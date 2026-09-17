"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, EventCategory, CATEGORY_COLORS } from '@/types/calendar';
import { getEventStatus, isEventFinished, isEventOngoing, EventStatus } from '@/lib/calendarUtils';

interface FullCalendarViewProps {
  events: CalendarEvent[];
  onOpenImportModal: () => void;
  hasGoogleEvents: boolean;
}

type CalendarViewMode = 'month' | 'agenda';
type StatusFilter = 'All' | 'Active' | 'Finished';

export default function FullCalendarView({
  events,
  onOpenImportModal,
  hasGoogleEvents,
}: FullCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Update clock every 30s so event statuses (ongoing -> finished) transition in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter events by search, category & status
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterCategory !== 'All' && e.category !== filterCategory) return false;
      if (statusFilter === 'Active' && isEventFinished(e, now)) return false;
      if (statusFilter === 'Finished' && !isEventFinished(e, now)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(query);
        const matchDesc = e.description?.toLowerCase().includes(query);
        const matchLoc = e.location?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }
      return true;
    });
  }, [events, filterCategory, statusFilter, searchQuery, now]);

  // Map events by date: { 'YYYY-MM-DD': CalendarEvent[] }
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of filteredEvents) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    // Sort each day's events by timestamp
    for (const d in map) {
      map[d].sort((a, b) => a.timestamp - b.timestamp);
    }
    return map;
  }, [filteredEvents]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  const currentMonthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Generate 42 calendar grid cells (6 weeks) for month view
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayIndex = firstDayOfMonth.getDay(); // 0 = Sun ... 6 = Sat

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const prevD = daysInPrevMonth - i;
      const prevDateObj = new Date(year, month - 1, prevD);
      const yyyy = prevDateObj.getFullYear();
      const mm = String(prevDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(prevD).padStart(2, '0');
      cells.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNumber: prevD,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (cells.length > 35 ? 42 : 35) - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDateObj = new Date(year, month + 1, d);
      const yyyy = nextDateObj.getFullYear();
      const mm = String(nextDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentDate]);

  // Selected Day's events
  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDateStr] || [];
  }, [eventsByDate, selectedDateStr]);

  const selectedDayFormatted = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return selectedDateStr;
  }, [selectedDateStr]);

  return (
    <div
      className={`w-full flex flex-col gap-5 transition-all duration-300 ${
        isExpanded ? 'max-w-none' : 'max-w-6xl mx-auto'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="apple-glass rounded-2xl p-4 border border-black/5 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="apple-segmented-bg p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={prevMonth}
              title="Previous Month"
              className="w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={goToToday}
              className="px-3 h-8 rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/15 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              title="Next Month"
              className="w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight min-w-[180px]">
            {currentMonthName}
          </h2>
        </div>

        {/* View Mode & Filter Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-gray-400 dark:text-gray-500 text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#007AFF] w-40 sm:w-52 transition-all"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="apple-segmented-bg p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">calendar_view_month</span>
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">view_agenda</span>
              <span>Agenda</span>
            </button>
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse View' : 'Full Canvas View'}
            className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>

          {/* Import Google Calendar Button */}
          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <div className="w-4 h-4 bg-white rounded p-0.5 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <path fill="#34A853" d="M7 10h5v5H7z"/>
                <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
                <path fill="#EA4335" d="M7 15h5v5H7z"/>
              </svg>
            </div>
            <span>{hasGoogleEvents ? 'Sync GCal' : 'Import GCal'}</span>
          </button>
        </div>
      </div>

      {/* Category & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 font-medium">Category:</span>
          {(['All', 'Work', 'Meeting', 'Focus', 'Personal', 'Design'] as (EventCategory | 'All')[]).map(
            (cat) => {
              const isSelected = filterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-xs font-semibold'
                      : 'apple-glass border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              );
            }
          )}
        </div>

        {/* Status Filter: All, Active, Finished */}
        <div className="apple-segmented-bg p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs flex items-center gap-1 self-start sm:self-auto">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1.5 font-medium">Status:</span>
          {(['All', 'Active', 'Finished'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white font-semibold shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {st === 'Finished' && (
                <span className="material-symbols-outlined text-[13px] text-emerald-500 dark:text-emerald-400">check_circle</span>
              )}
              {st === 'Active' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]" />
              )}
              <span>{st}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN VIEW: Month Grid + Day Detail Drawer OR Agenda List */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Calendar Grid (8 cols on large screen) */}
          <div className="lg:col-span-8 apple-glass border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 text-center font-mono text-xs font-semibold text-gray-400 dark:text-gray-500 pb-2 border-b border-black/5 dark:border-white/10">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            {/* 7-col Month Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthGridDays.map((cell) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[88px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#007AFF] ring-2 ring-[#007AFF]/30 bg-blue-500/10 dark:bg-blue-500/15 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/[0.03] hover:bg-white/80 dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/10'
                        : 'border-black/[0.03] dark:border-white/[0.02] bg-black/[0.01] dark:bg-white/[0.01] opacity-40 hover:opacity-75'
                    }`}
                  >
                    {/* Date Number Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium font-mono ${
                          isToday
                            ? 'bg-[#007AFF] text-white font-bold shadow-xs'
                            : isSelected
                            ? 'text-[#007AFF] dark:text-[#0A84FF] font-bold'
                            : 'text-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Dot Count if multiple events */}
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 font-semibold">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Chips (Up to 2 chips) */}
                    <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const style = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Work;
                        const status = getEventStatus(evt, now);
                        const isFinished = status === 'finished';
                        const isOngoing = status === 'ongoing';

                        return (
                          <div
                            key={evt.id}
                            title={`${evt.startTime} — ${evt.title} (${isFinished ? 'Finished' : isOngoing ? 'Happening Now' : 'Upcoming'})`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 border transition-all ${
                              isFinished
                                ? 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-black/5 dark:border-white/5 line-through opacity-60 hover:opacity-100 hover:no-underline'
                                : isOngoing
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30 font-semibold'
                                : `${style.bg} ${style.text} ${style.border}`
                            }`}
                          >
                            {isFinished ? (
                              <span className="material-symbols-outlined text-[11px] text-emerald-500 dark:text-emerald-400 shrink-0 no-underline">
                                check
                              </span>
                            ) : isOngoing ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                            )}
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 px-1 font-mono">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Drawer (4 cols on large screen) */}
          <div className="lg:col-span-4 apple-glass border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col gap-4 sticky top-24">
            <div className="border-b border-black/5 dark:border-white/10 pb-3">
              <span className="text-[11px] font-semibold text-[#007AFF] dark:text-[#0A84FF] uppercase tracking-wider">
                Daily Schedule
              </span>
              <h3 className="font-headline-sm text-base font-bold text-gray-900 dark:text-white mt-0.5 leading-snug">
                {selectedDayFormatted}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
              </span>
            </div>

            {/* List of events on this day */}
            {selectedDayEvents.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center gap-2 text-gray-400 dark:text-gray-500">
                <span className="material-symbols-outlined text-[32px] opacity-40">event_busy</span>
                <span className="text-xs">No meetings or events on this date.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                {selectedDayEvents.map((evt) => {
                  const style = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Work;
                  const status = getEventStatus(evt, now);
                  const isFinished = status === 'finished';
                  const isOngoing = status === 'ongoing';

                  return (
                    <div
                      key={evt.id}
                      className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                        isFinished
                          ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-70 hover:opacity-100'
                          : isOngoing
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 ring-1 ring-emerald-500/20'
                          : 'bg-white/60 dark:bg-white/[0.04] border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold leading-tight ${
                          isFinished ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                        }`}>
                          {evt.title}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Finished / Ongoing Status Pill */}
                          {isFinished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-medium border border-black/5 dark:border-white/5">
                              <span className="material-symbols-outlined text-[12px] text-emerald-500 dark:text-emerald-400">check_circle</span>
                              <span>Finished</span>
                            </span>
                          ) : isOngoing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Happening Now</span>
                            </span>
                          ) : null}

                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                            {evt.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="material-symbols-outlined text-[15px] text-gray-400 dark:text-gray-500">schedule</span>
                        <span className={isFinished ? 'text-gray-400 dark:text-gray-500 line-through' : isOngoing ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#007AFF] dark:text-[#0A84FF]'}>
                          {evt.startTime} — {evt.endTime}
                        </span>
                        {isFinished && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal font-mono">
                            · Ended
                          </span>
                        )}
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}

                      {evt.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                          {evt.description}
                        </p>
                      )}

                      {evt.url && (
                        <a
                          href={evt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-1 h-7 px-3 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            isFinished
                              ? 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 border border-black/5 dark:border-white/5'
                              : 'bg-[#007AFF]/15 hover:bg-[#007AFF] text-[#007AFF] hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">videocam</span>
                          <span>{isFinished ? 'Meeting Link (Concluded)' : 'Join Meeting Link'}</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Agenda Timeline View */
        <div className="apple-glass border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
            <h3 className="font-headline-sm text-base font-bold text-gray-900 dark:text-white">
              Upcoming Schedule ({filteredEvents.length} Events)
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">Sorted chronologically</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl opacity-30">event_busy</span>
              <p className="text-sm">No events found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEvents.map((evt) => {
                const style = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Work;
                const isToday = evt.date === todayStr;
                const status = getEventStatus(evt, now);
                const isFinished = status === 'finished';
                const isOngoing = status === 'ongoing';

                return (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isFinished
                        ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-70 hover:opacity-95'
                        : isOngoing
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 ring-1 ring-emerald-500/20'
                        : isToday
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30'
                        : 'bg-white/60 dark:bg-white/[0.04] border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono ${
                        isFinished
                          ? 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-400 dark:text-gray-500'
                          : isOngoing
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-gray-900 dark:text-white'
                      }`}>
                        <span className="text-[10px] uppercase font-semibold leading-none">
                          {new Date(`${evt.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base font-bold leading-none mt-1">
                          {new Date(`${evt.date}T00:00:00`).getDate()}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${isFinished ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                            {evt.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                            {evt.category}
                          </span>
                          {isFinished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-medium border border-black/5 dark:border-white/5">
                              <span className="material-symbols-outlined text-[12px] text-emerald-500 dark:text-emerald-400">check_circle</span>
                              <span>Finished</span>
                            </span>
                          ) : isOngoing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Happening Now</span>
                            </span>
                          ) : isToday ? (
                            <span className="px-2 py-0.5 rounded bg-[#007AFF] text-white text-[10px] font-bold">
                              Today
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                          <span className={`font-medium ${isFinished ? 'text-gray-400 dark:text-gray-500 line-through' : isOngoing ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#007AFF] dark:text-[#0A84FF]'}`}>
                            {evt.startTime} — {evt.endTime}
                          </span>
                          {evt.location && (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">·</span>
                              <span className="truncate max-w-xs text-gray-500 dark:text-gray-400">{evt.location}</span>
                            </>
                          )}
                          {isFinished && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal font-mono">
                              · Ended
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {evt.url && (
                      <a
                        href={evt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`h-8 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto ${
                          isFinished
                            ? 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 border border-black/5 dark:border-white/5'
                            : 'bg-[#007AFF] hover:bg-[#0062cc] text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">videocam</span>
                        <span>{isFinished ? 'Ended' : 'Join Meeting'}</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

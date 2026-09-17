"use client";

import React, { useState, useMemo } from 'react';
import { CalendarEvent, EventCategory, CATEGORY_COLORS } from '@/types/calendar';

interface FullCalendarViewProps {
  events: CalendarEvent[];
  onOpenImportModal: () => void;
  hasGoogleEvents: boolean;
}

type CalendarViewMode = 'month' | 'agenda';

export default function FullCalendarView({
  events,
  onOpenImportModal,
  hasGoogleEvents,
}: FullCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter events by search & category
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterCategory !== 'All' && e.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(query);
        const matchDesc = e.description?.toLowerCase().includes(query);
        const matchLoc = e.location?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }
      return true;
    });
  }, [events, filterCategory, searchQuery]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container/70 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              title="Previous Month"
              className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={goToToday}
              className="px-3 h-8 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              title="Next Month"
              className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <h2 className="font-display-lg text-xl font-bold text-on-surface tracking-tight min-w-[180px]">
            {currentMonthName}
          </h2>
        </div>

        {/* View Mode & Filter Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary w-40 sm:w-52"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex bg-surface-container/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'month'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">calendar_view_month</span>
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'agenda'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-outline hover:text-on-surface'
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
            className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-outline hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>

          {/* Import Google Calendar Button */}
          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
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

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs text-outline mr-1">Filter:</span>
        {(['All', 'Work', 'Meeting', 'Focus', 'Personal', 'Design'] as (EventCategory | 'All')[]).map(
          (cat) => {
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-xs font-semibold'
                    : 'bg-surface-container-lowest border-outline-variant/30 text-outline hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            );
          }
        )}
      </div>

      {/* MAIN VIEW: Month Grid + Day Detail Drawer OR Agenda List */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Calendar Grid (8 cols on large screen) */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 text-center font-mono text-xs font-semibold text-outline pb-2 border-b border-outline-variant/20">
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
                        ? 'border-primary ring-2 ring-primary/40 bg-surface-container/60 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-outline-variant/20 bg-surface-container/25 hover:bg-surface-container/50 hover:border-outline-variant/40'
                        : 'border-outline-variant/10 bg-surface-container-lowest/40 opacity-40 hover:opacity-75'
                    }`}
                  >
                    {/* Date Number Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium font-mono ${
                          isToday
                            ? 'bg-primary text-on-primary font-bold shadow-xs'
                            : isSelected
                            ? 'text-primary font-bold'
                            : 'text-on-surface'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Dot Count if multiple events */}
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono text-outline font-semibold">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Chips (Up to 2 chips) */}
                    <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const style = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Work;
                        return (
                          <div
                            key={evt.id}
                            title={`${evt.startTime} — ${evt.title}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 border ${style.bg} ${style.text} ${style.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-outline px-1 font-mono">
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
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm flex flex-col gap-4 sticky top-24">
            <div className="border-b border-outline-variant/20 pb-3">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Daily Schedule
              </span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface mt-0.5 leading-snug">
                {selectedDayFormatted}
              </h3>
              <span className="text-xs text-outline">
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
              </span>
            </div>

            {/* List of events on this day */}
            {selectedDayEvents.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[32px] opacity-40">event_busy</span>
                <span className="text-xs">No meetings or events on this date.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                {selectedDayEvents.map((evt) => {
                  const style = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Work;
                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-surface-container/40 border border-outline-variant/25 flex flex-col gap-2 hover:border-outline-variant/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-on-surface leading-tight">
                          {evt.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                          {evt.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        <span>{evt.startTime} — {evt.endTime}</span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-outline">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}

                      {evt.description && (
                        <p className="text-[11px] text-outline/80 leading-relaxed line-clamp-3">
                          {evt.description}
                        </p>
                      )}

                      {evt.url && (
                        <a
                          href={evt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 h-7 px-3 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-on-primary text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">videocam</span>
                          <span>Join Meeting Link</span>
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
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              Upcoming Schedule ({filteredEvents.length} Events)
            </h3>
            <span className="text-xs text-outline font-mono">Sorted chronologically</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-outline flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl opacity-30">event_busy</span>
              <p className="text-sm">No events found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEvents.map((evt) => {
                const style = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Work;
                const isToday = evt.date === todayStr;

                return (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isToday
                        ? 'bg-primary-fixed/15 border-primary/30'
                        : 'bg-surface-container/30 border-outline-variant/20 hover:border-outline-variant/50'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center shrink-0 border border-outline-variant/20 font-mono">
                        <span className="text-[10px] text-outline uppercase font-semibold leading-none">
                          {new Date(`${evt.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base font-bold text-on-surface leading-none mt-1">
                          {new Date(`${evt.date}T00:00:00`).getDate()}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-on-surface">{evt.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                            {evt.category}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-outline mt-1 flex-wrap">
                          <span className="text-primary font-medium">{evt.startTime} — {evt.endTime}</span>
                          {evt.location && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-xs">{evt.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {evt.url && (
                      <a
                        href={evt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
                      >
                        <span className="material-symbols-outlined text-[15px]">videocam</span>
                        <span>Join Meeting</span>
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

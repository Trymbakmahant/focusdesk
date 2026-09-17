"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCalendar } from '@/hooks/useCalendar';
import GoogleCalendarModal from '@/components/calendar/GoogleCalendarModal';
import { CATEGORY_COLORS } from '@/types/calendar';
import { getEventStatus } from '@/lib/calendarUtils';

export default function CalendarTimeline() {
  const {
    events,
    googleCalendarUrl,
    hasGoogleEvents,
    importIcs,
    importFromUrl,
    clearGoogleEvents,
    isGoogleConnected,
    isSyncing,
  } = useCalendar();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Update clock every 30s so finished events update dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formattedCurrentDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // Display upcoming and today's events, sorted chronologically
  const displayedEvents = useMemo(() => {
    // Show events from today onwards, or latest events if all are in past
    const todayAndUpcoming = events.filter((e) => e.date >= todayStr);
    if (todayAndUpcoming.length > 0) {
      return todayAndUpcoming.slice(0, 5);
    }
    // If all events are historical (e.g. from past months), show latest 5
    return [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [events, todayStr]);

  return (
    <div className="apple-glass apple-card-hover md:col-span-5 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-sm">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </div>
            <h2 className="text-[16px] font-semibold text-gray-950 tracking-tight">Calendar</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2.5 py-0.5 rounded-full">
              {formattedCurrentDate}
            </span>

            {/* Expand / Full View Link */}
            <Link
              href="/calendar"
              title="Open Full Calendar View"
              className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-900 hover:bg-black/5 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </Link>

            {/* GCal Import Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 rounded-full bg-black/[0.04] hover:bg-black/[0.07] text-gray-700 text-[11px] font-medium transition-colors flex items-center gap-1.5 border border-black/5"
              title="Import Google Calendar"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <path fill="#34A853" d="M7 10h5v5H7z"/>
                <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
                <path fill="#EA4335" d="M7 15h5v5H7z"/>
              </svg>
              {isGoogleConnected && <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />}
              <span>{isGoogleConnected ? (isSyncing ? 'Syncing...' : 'Google Cal') : hasGoogleEvents ? 'Google Cal' : 'Connect'}</span>
            </button>
          </div>
        </div>

        {/* Timeline Events OR Empty State */}
        {events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-black/[0.02] border border-dashed border-black/10 flex flex-col items-center text-center gap-3 my-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
              <span className="material-symbols-outlined text-[24px]">event_note</span>
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-[14px] font-semibold text-gray-900">
                No Calendar Events
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Connect your Google Calendar or import an .ics feed to synchronize meetings, deep work, and scheduled events.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-1 px-3.5 py-1.5 rounded-full bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <span>Connect Google Calendar</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 relative pr-1 max-h-72 overflow-y-auto">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-black/5" />

            {/* Find the next upcoming or ongoing event */}
            {(() => {
              const ongoing = displayedEvents.find((e) => getEventStatus(e, now) === 'ongoing');
              const upcoming = displayedEvents.find((e) => getEventStatus(e, now) === 'upcoming');
              const nextEventId = ongoing ? ongoing.id : upcoming ? upcoming.id : null;

              return displayedEvents.map((event) => {
                const catConfig = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Work;
                const status = getEventStatus(event, now);
                const isFinished = status === 'finished';
                const isOngoing = status === 'ongoing';
                const isNextUp = event.id === nextEventId && !isOngoing;
                const isHighlighted = isOngoing || isNextUp;

                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 relative pl-6 transition-all rounded-2xl p-2.5 ${
                      isFinished
                        ? 'opacity-60 hover:opacity-100 bg-black/[0.01]'
                        : isOngoing
                        ? 'bg-[#34C759]/10 border border-[#34C759]/25'
                        : isNextUp
                        ? 'bg-[#007AFF]/[0.06] border border-[#007AFF]/20'
                        : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    {isFinished ? (
                      <span className="w-3.5 h-3.5 rounded-full absolute left-1 top-3 bg-gray-100 border border-black/10 flex items-center justify-center text-[#34C759]">
                        <span className="material-symbols-outlined text-[10px]">check</span>
                      </span>
                    ) : (
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute left-1.5 top-3.5 ${
                          isOngoing ? 'bg-[#34C759] ring-4 ring-[#34C759]/20 animate-pulse' : catConfig.dot
                        } ${isNextUp ? 'ring-4 ring-[#007AFF]/25 animate-pulse' : ''}`}
                      />
                    )}

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] truncate ${
                          isFinished
                            ? 'text-gray-400 line-through decoration-gray-300'
                            : isHighlighted
                            ? 'font-semibold text-gray-950'
                            : 'font-medium text-gray-900'
                        }`}>
                          {event.title}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {isFinished && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-black/[0.04] text-gray-500 border border-black/5 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px] text-[#34C759]">check</span>
                              Finished
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${catConfig.bg} ${catConfig.text}`}>
                            {event.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className={`text-[11px] tabular-nums ${
                          isFinished
                            ? 'text-gray-400 line-through decoration-gray-300'
                            : isOngoing
                            ? 'text-[#34C759] font-medium'
                            : isNextUp
                            ? 'text-[#007AFF] font-medium'
                            : 'text-gray-400'
                        }`}>
                          {event.startTime} — {event.endTime}
                          {isFinished ? ' · Finished' : isOngoing ? ' · Happening now' : isNextUp ? ' · Next up' : ''}
                        </span>
                        {event.location && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-400 text-[11px] truncate max-w-[150px]">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Footer Sync Status with Full View Link */}
      <div className="pt-3 flex items-center justify-between text-xs text-gray-400 border-t border-black/5 mt-3">
        <div className="flex items-center gap-1.5">
          {hasGoogleEvents ? (
            <span className="text-[#34C759] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span>{events.length} events synced</span>
            </span>
          ) : (
            <span>No calendar connected</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-gray-500 hover:text-gray-900 text-xs transition-colors"
          >
            {hasGoogleEvents ? 'Sync Settings' : 'Connect'}
          </button>
          <Link
            href="/calendar"
            className="text-[#007AFF] hover:underline font-semibold text-xs flex items-center gap-0.5"
          >
            <span>Full View</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Google Calendar Import Modal */}
      <GoogleCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportUrl={importFromUrl}
        onImportIcs={importIcs}
        existingUrl={googleCalendarUrl}
        hasGoogleEvents={hasGoogleEvents}
        onClearGoogleEvents={clearGoogleEvents}
      />
    </div>
  );
}

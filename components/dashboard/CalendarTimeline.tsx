"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCalendar } from '@/hooks/useCalendar';
import GoogleCalendarModal from '@/components/calendar/GoogleCalendarModal';
import { CATEGORY_COLORS } from '@/types/calendar';

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

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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
    <div className="md:col-span-5 flex flex-col justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Calendar</h2>
          </div>

          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-primary font-medium">{formattedCurrentDate}</span>

            {/* Expand / Full View Link */}
            <Link
              href="/calendar"
              title="Open Full Calendar View"
              className="w-7 h-7 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">open_in_new</span>
            </Link>

            {/* GCal Import Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors flex items-center gap-1.5 border border-outline-variant/20"
              title="Import Google Calendar"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <path fill="#34A853" d="M7 10h5v5H7z"/>
                <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
                <path fill="#EA4335" d="M7 15h5v5H7z"/>
              </svg>
              {isGoogleConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              <span>{isGoogleConnected ? (isSyncing ? 'Syncing...' : 'Google Cal') : hasGoogleEvents ? 'Google Cal' : 'Connect GCal'}</span>
            </button>
          </div>
        </div>

        {/* Timeline Events OR Empty State */}
        {events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-container-low/50 border border-dashed border-outline-variant/40 flex flex-col items-center text-center gap-3 my-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">event_note</span>
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                No Calendar Events
              </h3>
              <p className="text-body-sm text-outline text-xs leading-relaxed">
                Connect your Google Calendar or import an .ics feed to synchronize meetings, deep work, and scheduled events.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-1 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 bg-white rounded p-0.5">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <path fill="#34A853" d="M7 10h5v5H7z"/>
                <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
                <path fill="#EA4335" d="M7 15h5v5H7z"/>
              </svg>
              <span>Import Google Calendar</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-space-sm relative pr-1 max-h-72 overflow-y-auto">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-surface-container-high" />

            {displayedEvents.map((event, index) => {
              const catConfig = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Work;
              const isFirst = index === 0;

              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-space-md relative pl-6 transition-all rounded-xl p-2 ${
                    isFirst ? 'bg-primary-fixed/20 border border-primary/20' : 'hover:bg-surface-container-low/60'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full absolute left-1.5 top-3 ${catConfig.dot} ${
                      isFirst ? 'ring-4 ring-primary/20 animate-pulse' : ''
                    }`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-label-md text-label-md text-on-surface truncate ${isFirst ? 'font-semibold' : ''}`}>
                        {event.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${catConfig.bg} ${catConfig.text}`}>
                        {event.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className={`font-body-sm text-body-sm ${isFirst ? 'text-primary font-medium' : 'text-outline'}`}>
                        {event.startTime} — {event.endTime} {isFirst ? '· Next up' : ''}
                      </span>
                      {event.location && (
                        <>
                          <span className="text-outline">·</span>
                          <span className="text-outline text-[11px] truncate max-w-[150px]">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Sync Status with Full View Link */}
      <div className="pt-space-md flex items-center justify-between text-xs text-outline border-t border-outline-variant/15 mt-3">
        <div className="flex items-center gap-1.5">
          {hasGoogleEvents ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{events.length} events synced</span>
            </span>
          ) : (
            <span>No calendar connected</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-outline hover:text-on-surface text-xs transition-colors"
          >
            {hasGoogleEvents ? 'Sync Settings' : 'Connect'}
          </button>
          <Link
            href="/calendar"
            className="text-primary hover:underline font-medium text-xs flex items-center gap-0.5"
          >
            <span>Full View</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
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

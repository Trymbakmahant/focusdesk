"use client";

import React, { useState } from "react";
import CalendarTimeline from "@/components/dashboard/CalendarTimeline";
import NextEvent from "@/components/dashboard/NextEvent";
import GoogleCalendarModal from "@/components/calendar/GoogleCalendarModal";
import { useCalendar } from "@/hooks/useCalendar";

export default function CalendarPage() {
  const {
    events,
    googleCalendarUrl,
    hasGoogleEvents,
    importIcs,
    importFromUrl,
    importSampleEvents,
    clearGoogleEvents,
  } = useCalendar();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full gap-space-lg pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">calendar_month</span>
            <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface">Calendar &amp; Schedule</h1>
          </div>
          <p className="text-body-sm text-outline mt-1">
            Timeline of today's meetings, deep work sessions, and Google Calendar events.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-all flex items-center gap-2 shadow-xs hover:border-primary/50 self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
              <path fill="#34A853" d="M7 10h5v5H7z"/>
              <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
              <path fill="#EA4335" d="M7 15h5v5H7z"/>
            </svg>
          </div>
          <span>{hasGoogleEvents ? "Manage Google Calendar" : "Import Google Calendar"}</span>
          {hasGoogleEvents && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Sync Status Banner if connected */}
      {hasGoogleEvents && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">cloud_done</span>
            <span>Google Calendar is actively connected and synchronized with FocusDeck.</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400/80">{events.length} events loaded</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-dashboard">
        <NextEvent />
        <CalendarTimeline />
      </div>

      {/* Google Calendar Modal */}
      <GoogleCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportUrl={importFromUrl}
        onImportIcs={importIcs}
        onImportSample={importSampleEvents}
        existingUrl={googleCalendarUrl}
        hasGoogleEvents={hasGoogleEvents}
        onClearGoogleEvents={clearGoogleEvents}
      />
    </div>
  );
}

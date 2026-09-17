"use client";

import React, { useState } from "react";
import FullCalendarView from "@/components/calendar/FullCalendarView";
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
    clearGoogleEvents,
  } = useCalendar();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* Top Banner with Countdown Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-8 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">calendar_month</span>
            <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface">
              Calendar &amp; Schedule
            </h1>
          </div>
          <p className="text-body-sm text-outline mt-1 max-w-xl">
            Full-size monthly calendar grid, daily agenda, and timezone-synchronized Google Calendar integration.
          </p>
        </div>
        <div className="lg:col-span-4">
          <NextEvent />
        </div>
      </div>

      {/* Sync Status Banner if connected */}
      {hasGoogleEvents && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">cloud_done</span>
            <span>Google Calendar is actively synchronized ({events.length} events loaded).</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-emerald-400 underline hover:text-emerald-200 text-xs font-medium"
          >
            Manage Sync
          </button>
        </div>
      )}

      {/* Full-Size Interactive Calendar (Month & Agenda Views) */}
      <FullCalendarView
        events={events}
        onOpenImportModal={() => setIsModalOpen(true)}
        hasGoogleEvents={hasGoogleEvents}
      />

      {/* Google Calendar Modal */}
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

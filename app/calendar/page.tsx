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
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
              Calendar &amp; Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868B] dark:text-gray-400 mt-1.5 max-w-xl">
            Full-size monthly calendar grid, daily agenda, and timezone-synchronized Google Calendar integration.
          </p>
        </div>
        <div className="lg:col-span-4">
          <NextEvent />
        </div>
      </div>

      {/* Sync Status Banner if connected */}
      {hasGoogleEvents && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">cloud_done</span>
            <span className="font-medium">Google Calendar is actively synchronized ({events.length} events loaded).</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-semibold cursor-pointer"
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

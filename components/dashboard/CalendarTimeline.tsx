import React from 'react';

export default function CalendarTimeline() {
  return (
    <div className="md:col-span-5 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Calendar</h2>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-primary font-medium">September 4</span>
            <button className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-space-sm relative">
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-surface-container-high"></div>
          <div className="flex items-start gap-space-md relative pl-6">
            <span className="w-2.5 h-2.5 rounded-full bg-outline absolute left-1.5 top-1.5"></span>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface">Team Sync &amp; Architecture Review</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-label-sm font-label-sm">Work</span>
              </div>
              <span className="font-body-sm text-body-sm text-outline">09:30 — 10:30 AM</span>
            </div>
          </div>
          <div className="flex items-start gap-space-md relative pl-6 bg-primary-fixed/30 p-2 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-primary absolute left-1.5 top-3 ring-4 ring-primary-fixed"></span>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Deep Work: Core Card Engine</span>
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-label-sm font-label-sm">Focus</span>
              </div>
              <span className="font-body-sm text-body-sm text-primary">11:00 AM — 01:00 PM · Now</span>
            </div>
          </div>
          <div className="flex items-start gap-space-md relative pl-6">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary absolute left-1.5 top-1.5"></span>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface">Design Review with Product</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm">Design</span>
              </div>
              <span className="font-body-sm text-body-sm text-outline">14:30 — 15:15 PM</span>
            </div>
          </div>
          <div className="flex items-start gap-space-md relative pl-6">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary absolute left-1.5 top-1.5"></span>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface">Evening Run / Gym</span>
                <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm">Personal</span>
              </div>
              <span className="font-body-sm text-body-sm text-outline">17:30 — 18:30 PM</span>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-space-md flex items-center justify-between text-label-sm font-label-sm text-outline">
        <span>Google Calendar synced</span>
        <button className="text-primary hover:underline">Open iCal</button>
      </div>
    </div>
  );
}

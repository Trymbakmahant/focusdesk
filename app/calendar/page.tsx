import React from "react";
import CalendarTimeline from "@/components/dashboard/CalendarTimeline";
import NextEvent from "@/components/dashboard/NextEvent";

export default function CalendarPage() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full gap-space-lg">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-sm">Calendar View</h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-dashboard">
        <NextEvent />
        <CalendarTimeline />
      </div>
    </div>
  );
}

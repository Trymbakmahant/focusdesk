import React from "react";
import Reminders from "@/components/dashboard/Reminders";

export default function RemindersPage() {
  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Reminders View</h1>
      <Reminders />
    </div>
  );
}

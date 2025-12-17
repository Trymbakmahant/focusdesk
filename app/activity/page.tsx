import React from "react";
import HabitActivity from "@/components/dashboard/HabitActivity";

export default function ActivityPage() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Activity & Habits View</h1>
      <HabitActivity />
    </div>
  );
}

import React from "react";
import type { Metadata } from "next";
import HabitActivity from "@/components/dashboard/HabitActivity";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Habit Tracking & Productivity Activity",
  description:
    "Track daily habit streaks, analyze workday efficiency, and maintain productive momentum with Fixates's visual activity grid.",
  path: "/activity",
});

export default function ActivityPage() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Activity & Habits View</h1>
      <HabitActivity />
    </div>
  );
}

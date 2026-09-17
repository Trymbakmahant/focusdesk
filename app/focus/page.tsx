import React from "react";
import type { Metadata } from "next";
import FocusTimer from "@/components/dashboard/FocusTimer";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Deep Work Focus Timer & Pomodoro Mode",
  description:
    "Eliminate distractions and maximize productive flow with customizable Pomodoro sessions, countdown timers, and audio alerts on Fixates.",
  path: "/focus",
});

export default function FocusPage() {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Focus Mode</h1>
      <FocusTimer />
    </div>
  );
}

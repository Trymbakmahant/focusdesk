"use client";

import React from "react";
import GreetingHeader from "@/components/dashboard/GreetingHeader";
import HeroFocusCard from "@/components/dashboard/HeroFocusCard";
import TodayTasks from "@/components/dashboard/TodayTasks";
import FocusTimer from "@/components/dashboard/FocusTimer";
import NextEvent from "@/components/dashboard/NextEvent";
import CalendarTimeline from "@/components/dashboard/CalendarTimeline";
import HabitActivity from "@/components/dashboard/HabitActivity";
import QuickNote from "@/components/dashboard/QuickNote";
import Reminders from "@/components/dashboard/Reminders";
import { useViewMode } from "@/context/ViewModeContext";

export default function Home() {
  const { viewMode } = useViewMode();

  return (
    <>
      <GreetingHeader />

      <HeroFocusCard />

      {viewMode === "canvas" ? (
        /* Canvas View: 12-column responsive Bento Dashboard */
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter-dashboard animate-fadeIn">
          <TodayTasks />
          <FocusTimer />
          <NextEvent />
          <CalendarTimeline />
          <HabitActivity />
          <QuickNote />
          <Reminders />
        </section>
      ) : (
        /* Feed View: Streamlined single-column chronological activity stream */
        <section className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fadeIn pb-8">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-on-surface font-semibold">
              <span className="material-symbols-outlined text-[18px] text-primary">view_agenda</span>
              <span>Daily Activity &amp; Focus Feed</span>
            </div>
            <span className="text-outline">Chronological Stream</span>
          </div>

          <NextEvent />
          <FocusTimer />
          <TodayTasks />
          <CalendarTimeline />
          <HabitActivity />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickNote />
            <Reminders />
          </div>
        </section>
      )}
    </>
  );
}
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

export default function Home() {
  return (
    <>
      <GreetingHeader />

      <HeroFocusCard />

      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter-dashboard">
        <TodayTasks />
        <FocusTimer />
        <NextEvent />
        <CalendarTimeline />
        <HabitActivity />
        <QuickNote />
        <Reminders />
      </section>
    </>
  );
}
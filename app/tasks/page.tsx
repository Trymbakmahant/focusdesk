import React from "react";
import TodayTasks from "@/components/dashboard/TodayTasks";

export default function TasksPage() {
  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Tasks View</h1>
      <TodayTasks />
    </div>
  );
}

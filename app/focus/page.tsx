import React from "react";
import FocusTimer from "@/components/dashboard/FocusTimer";

export default function FocusPage() {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Focus Mode</h1>
      <FocusTimer />
    </div>
  );
}

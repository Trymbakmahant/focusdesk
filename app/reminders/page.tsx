import React from "react";
import type { Metadata } from "next";
import Reminders from "@/components/dashboard/Reminders";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Time-Sensitive Reminders & Daily Alerts",
  description:
    "Never miss an important commitment. Manage notifications, time-sensitive alerts, and priority reminders on Fixates.",
  path: "/reminders",
});

export default function RemindersPage() {
  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      <h1 className="font-display-lg text-[32px] text-on-surface mb-space-lg">Reminders View</h1>
      <Reminders />
    </div>
  );
}

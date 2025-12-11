"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function GreetingHeader() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");
  const [viewMode, setViewMode] = useState<"canvas" | "feed">("canvas");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon");
      } else if (hour >= 17 && hour < 22) {
        setGreeting("Good evening");
      } else {
        setGreeting("Good night");
      }

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now);

      setCurrentDate(formattedDate);
    };

    updateTimeAndGreeting();
    // Update every minute so greeting transitions smoothly
    const interval = setInterval(updateTimeAndGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format user display name
  const getUserName = () => {
    if (!user) return "Trymbak";
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) {
      const localPart = user.email.split("@")[0];
      // Format john.doe -> John Doe or trymbak -> Trymbak
      return localPart
        .split(/[._-]/)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
    }
    return "Trymbak";
  };

  const displayName = getUserName();

  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="font-display-lg text-display-lg text-on-surface tracking-tight">
            {mounted ? `${greeting}, ${displayName}` : "Good morning, Trymbak"}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-medium">
            macOS Native
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs font-body-lg text-body-lg text-on-surface-variant">
          <span>{mounted && currentDate ? currentDate : "Today"}</span>
          <span className="text-outline">·</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-body-sm font-body-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>4 tasks remaining today</span>
            <span className="text-outline">·</span>
            <span className="text-primary font-label-sm font-medium">3h 24m deep work logged</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-space-sm self-start md:self-end flex-wrap">
        <div className="flex items-center gap-space-xs bg-surface-container-lowest shadow-sm px-space-md py-1.5 rounded-xl text-on-surface w-56 hover:shadow transition-shadow cursor-pointer">
          <span className="material-symbols-outlined text-[18px] text-primary">search</span>
          <span className="font-body-sm text-body-sm text-outline flex-1">⌘K Search</span>
          <span className="font-code-kbd text-code-kbd px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">⌘K</span>
        </div>
        <button className="h-9 px-space-md rounded-xl bg-primary text-on-primary shadow-sm hover:bg-primary/90 transition-all flex items-center gap-space-xs font-label-md text-label-md font-medium">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Card</span>
        </button>
        <div className="relative">
          <button className="w-9 h-9 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm flex items-center justify-center transition-all">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface"></span>
        </div>
        <div className="flex items-center p-1 rounded-xl bg-surface-container-low shadow-sm">
          <button
            onClick={() => setViewMode("canvas")}
            className={`px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 text-label-sm font-label-sm transition-all ${
              viewMode === "canvas"
                ? "bg-surface-container-lowest text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Canvas</span>
          </button>
          <button
            onClick={() => setViewMode("feed")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-label-sm font-label-sm transition-all ${
              viewMode === "feed"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_agenda</span>
            <span>Feed</span>
          </button>
        </div>
      </div>
    </section>
  );
}

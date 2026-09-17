"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFocusStats } from "@/hooks/useFocusStats";
import { useTasks } from "@/hooks/useTasks";
import { useViewMode } from "@/context/ViewModeContext";

export default function GreetingHeader() {
  const { user } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");
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
  const { formattedTodayTime } = useFocusStats();
  const { tasks, todayString } = useTasks();

  const tasksRemaining = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate === todayString));
    return pending.length;
  }, [tasks, todayString]);

  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[30px] md:text-[34px] font-bold tracking-tight text-gray-950 dark:text-white">
            {mounted ? `${greeting}, ${displayName}` : "Good morning, Trymbak"}
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] dark:text-[#0A84FF] font-semibold text-[11px] border border-[#007AFF]/15 dark:border-[#007AFF]/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
            Sequoia Flow
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
          <span>{mounted && currentDate ? currentDate : "Today"}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-xs text-gray-800 dark:text-gray-200 text-[12px] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span>{tasksRemaining} {tasksRemaining === 1 ? 'task' : 'tasks'} remaining</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-[#007AFF] dark:text-[#0A84FF] font-semibold">{formattedTodayTime} logged</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-end flex-wrap">
        {/* Quick Shortcut Badges */}
        <div className="hidden lg:flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/5 dark:border-white/10 shadow-xs">
            <span className="text-gray-400 dark:text-gray-500">Task:</span>
            <kbd className="apple-keycap font-mono text-[10px] font-bold px-1 py-0.2 rounded text-gray-700 dark:text-gray-300">⌘T</kbd>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/5 dark:border-white/10 shadow-xs">
            <span className="text-gray-400 dark:text-gray-500">Timer:</span>
            <kbd className="apple-keycap font-mono text-[10px] font-bold px-1 py-0.2 rounded text-gray-700 dark:text-gray-300">⌘P</kbd>
          </span>
        </div>

        {/* Apple Segmented View Mode Switcher */}
        <div className="apple-segmented-bg p-1 rounded-full flex items-center border border-black/5 dark:border-white/10">
          <button
            onClick={() => setViewMode("canvas")}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold transition-all ${
              viewMode === "canvas"
                ? "bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#0A84FF] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">grid_view</span>
            <span>Canvas</span>
          </button>
          <button
            onClick={() => setViewMode("feed")}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold transition-all ${
              viewMode === "feed"
                ? "bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#0A84FF] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">view_agenda</span>
            <span>Feed</span>
          </button>
        </div>
      </div>
    </section>
  );
}

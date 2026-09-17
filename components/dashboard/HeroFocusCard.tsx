"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useFocusStats } from '@/hooks/useFocusStats';
import { useTasks } from '@/hooks/useTasks';
import { useCalendar } from '@/hooks/useCalendar';

const TARGET_PRESETS = [
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '5 hours', value: 300 },
  { label: '6 hours', value: 360 },
  { label: '8 hours', value: 480 },
];

export default function HeroFocusCard() {
  const {
    isLoaded,
    todayMinutes,
    targetMinutes,
    progressPercent,
    formattedTodayTime,
    formattedTargetTime,
    formattedRemainingTime,
    diffVsYesterdayMinutes,
    formattedDiffVsYesterday,
    completedSessions,
    lastSessionMinutes,
    setDailyTargetMinutes,
  } = useFocusStats();

  const { tasks } = useTasks();
  const { events } = useCalendar();

  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Calculate dynamic energy level based on circadian cycle
  const energyStatus = useMemo(() => {
    if (currentHour >= 5 && currentHour < 8) return { label: 'Rising', color: 'text-amber-500' };
    if (currentHour >= 8 && currentHour < 12) return { label: 'Peak (High)', color: 'text-primary' };
    if (currentHour >= 12 && currentHour < 14) return { label: 'Moderate', color: 'text-secondary' };
    if (currentHour >= 14 && currentHour < 17) return { label: 'High Flow', color: 'text-[#0284C7]' };
    if (currentHour >= 17 && currentHour < 21) return { label: 'Steady', color: 'text-teal-500' };
    return { label: 'Recharge', color: 'text-indigo-400' };
  }, [currentHour]);

  // 2. Compute dynamic efficiency based on task completion
  const efficiencyPercent = useMemo(() => {
    if (!tasks || tasks.length === 0) return 100;
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  // 3. Find next calendar event/break
  const nextEventLabel = useMemo(() => {
    if (!events || events.length === 0) return 'in 25m';
    const now = Date.now();
    const upcoming = events
      .filter((e) => e.timestamp > now)
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (!upcoming) return 'No more meetings';

    const diffMinutes = Math.max(1, Math.round((upcoming.timestamp - now) / 60000));
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `in ${hours}h ${mins}m`;
  }, [events]);

  // SVG Circular progress math (radius 52, circumference 326.7)
  const circumference = 326.7;
  const strokeDashoffset = Math.max(
    0,
    circumference * (1 - Math.min(100, progressPercent) / 100)
  );

  return (
    <section className="relative rounded-2xl bg-gradient-to-br from-[#EAF7FF] via-[#D9F1FF] to-surface-container-lowest p-space-xl shadow-md border border-outline-variant/20 z-10">
      {/* Background ambient orbs container with isolated overflow-hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl" />
        <div className="absolute right-1/4 -bottom-16 w-80 h-80 rounded-full bg-primary-fixed/40 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
        <div className="flex flex-col gap-space-sm max-w-2xl">
          {/* Top category indicator */}
          <div className="flex items-center gap-space-xs text-primary font-label-sm text-label-sm uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full bg-primary ${todayMinutes > 0 ? 'animate-ping' : ''}`} />
            <span>Focus for Today</span>
            <span className="text-outline">·</span>
            <span className="text-on-surface-variant lowercase">
              {todayMinutes > 0 ? 'ambient flow' : 'ready to focus'}
            </span>
          </div>

          {/* Large Time Display & Trend comparison */}
          <div className="flex items-baseline gap-space-md flex-wrap">
            <span className="font-display-lg text-[52px] leading-[58px] tracking-tight text-on-surface font-semibold">
              {isLoaded ? formattedTodayTime : '0m'}
            </span>
            <span className="font-headline-sm text-headline-sm text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">
                {diffVsYesterdayMinutes >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span>{formattedDiffVsYesterday}</span>
            </span>
          </div>

          {/* Subtext description */}
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {todayMinutes > 0 ? (
              <>
                Deep Work Session <span className="text-outline">·</span>{' '}
                <span className="text-on-surface font-medium">In the zone</span> with{' '}
                {completedSessions} focus {completedSessions === 1 ? 'block' : 'blocks'} logged today.
              </>
            ) : (
              <>
                Ready for deep work <span className="text-outline">·</span> Start the Focus Timer to begin logging your daily focus blocks.
              </>
            )}
          </p>

          {/* Progress Bar & Goal Selector */}
          <div className="flex flex-col gap-1.5 mt-space-xs relative">
            <div className="flex justify-between items-center text-label-sm font-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-on-surface font-medium">
                  {progressPercent}% of {formattedTargetTime} daily target
                </span>
                {/* Edit Target Goal Button */}
                <button
                  type="button"
                  onClick={() => setShowTargetMenu(!showTargetMenu)}
                  title="Change Daily Target"
                  className="w-6 h-6 rounded-lg bg-surface-container/60 hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                </button>
              </div>
              <span className="text-on-surface-variant">{formattedRemainingTime}</span>
            </div>

            {/* Target Goal Popup Menu (Unclipped, with click-away backdrop) */}
            {showTargetMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTargetMenu(false)}
                />
                <div className="absolute top-8 left-0 z-50 p-3 bg-surface-container-lowest/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col gap-2 text-xs text-on-surface min-w-[240px] animate-fadeIn">
                  <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                    <span className="font-semibold text-xs text-on-surface">Set Daily Focus Goal</span>
                    <button
                      type="button"
                      onClick={() => setShowTargetMenu(false)}
                      className="w-5 h-5 rounded-md hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {TARGET_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setDailyTargetMinutes(preset.value);
                          setShowTargetMenu(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between ${
                          targetMinutes === preset.value
                            ? 'bg-primary text-on-primary font-semibold shadow-xs'
                            : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className="text-[11px]">{preset.label}</span>
                        {targetMinutes === preset.value && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Linear Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-surface-container-high/60 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-700"
                style={{ width: `${Math.max(todayMinutes > 0 ? 4 : 0, progressPercent)}%` }}
              />
            </div>
          </div>

          {/* 4 Contextual Metrics Pills */}
          <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
            {/* Pill 1: Last/Current session */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">timelapse</span>
              <span>
                Current session: <strong>{lastSessionMinutes > 0 ? `${lastSessionMinutes}m` : '0m'}</strong>
              </span>
            </div>

            {/* Pill 2: Next break / Next meeting */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">coffee</span>
              <span>
                Next break: <strong>{nextEventLabel}</strong>
              </span>
            </div>

            {/* Pill 3: Circadian energy peak */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-[#0284C7]">bolt</span>
              <span>
                Peak energy: <strong className={energyStatus.color}>{energyStatus.label}</strong>
              </span>
            </div>

            {/* Pill 4: Task completion velocity / efficiency */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">target</span>
              <span>
                Efficiency: <strong>{efficiencyPercent}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Circular Progress Meter */}
        <div className="flex items-center justify-center p-space-md">
          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                className="text-surface-container-high/60"
                cx="60"
                cy="60"
                fill="none"
                r="52"
                stroke="currentColor"
                strokeWidth="9"
              />
              <circle
                className="text-primary transition-all duration-1000"
                cx="60"
                cy="60"
                fill="none"
                r="52"
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="9"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                {progressPercent}%
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                {progressPercent >= 100 ? 'TARGET MET' : 'COMPLETED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

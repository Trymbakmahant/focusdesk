"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusStats } from '@/hooks/useFocusStats';
import { useDailyFocus } from '@/hooks/useDailyFocus';
import { FocusCategory } from '@/types/focus';

const TARGET_PRESETS = [
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '5 hours', value: 300 },
  { label: '6 hours', value: 360 },
  { label: '8 hours', value: 480 },
];

const WORKDAY_PRESETS = [
  { label: '6h Day', hours: 6 },
  { label: '7h Day', hours: 7 },
  { label: '8h Standard Day', hours: 8 },
  { label: '9h Day', hours: 9 },
];

const CATEGORY_CHIPS: FocusCategory[] = [
  'Deep Work',
  'Engineering',
  'Architecture',
  'Design',
  'Strategy',
  'Research',
];

export default function HeroFocusCard() {
  const {
    isLoaded: statsLoaded,
    todayMinutes,
    targetMinutes,
    progressPercent,
    formattedTodayTime,
    formattedTargetTime,
    formattedRemainingTime,
    diffVsYesterdayMinutes,
    formattedDiffVsYesterday,
    completedSessions,
    setDailyTargetMinutes,
  } = useFocusStats();

  const {
    isSaving,
    lastSaved,
    focusIntention,
    category,
    workdayHours,
    deepWorkAllocationPercent,
    collaborationBufferHours,
    loggedWorkdayPercent,
    workdayAnalysis,
    history,
    saveDailyFocus,
    setWorkdayHours,
    setCategory,
  } = useDailyFocus();

  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [showWorkdayMenu, setShowWorkdayMenu] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [intentionInput, setIntentionInput] = useState(focusIntention);
  const [isEditingIntention, setIsEditingIntention] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize local input state when focusIntention changes
  useEffect(() => {
    setIntentionInput(focusIntention);
  }, [focusIntention]);

  const handleCommitIntention = () => {
    setIsEditingIntention(false);
    if (intentionInput.trim() !== focusIntention) {
      saveDailyFocus(intentionInput.trim(), category, workdayHours);
    }
  };

  // SVG Circular progress math (radius 52, circumference 326.7)
  const circumference = 326.7;
  const strokeDashoffset = Math.max(
    0,
    circumference * (1 - Math.min(100, progressPercent) / 100)
  );

  return (
    <>
      <section aria-label="Daily Focus Overview" className="apple-glass apple-card-hover relative overflow-hidden rounded-3xl p-6 md:p-7 border border-white/90 dark:border-white/10 bg-gradient-to-br from-[#EBF7FF]/90 via-[#F3FAFF]/80 to-white/90 dark:from-[#1C2029]/80 dark:via-[#16181F]/70 dark:to-[#121318]/90 shadow-sm z-10">
        <h2 className="sr-only">Daily Focus Target and Progress</h2>
        {/* Soft Atmospheric Radiant Glows */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#38BDF8]/20 dark:bg-[#38BDF8]/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-72 h-72 rounded-full bg-[#007AFF]/15 dark:bg-[#007AFF]/10 blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
          <div className="flex flex-col gap-3 max-w-2xl flex-1">
            {/* Top category indicator & cloud sync status */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-semibold text-[11px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">self_improvement</span>
                <span>Daily Focus Activity</span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-500 dark:text-gray-400 lowercase font-normal">
                  {todayMinutes > 0 ? 'ambient deep flow' : 'ready to focus'}
                </span>
              </div>

              {/* DB Cloud Persistence Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 text-[11px] text-gray-600 dark:text-gray-300 backdrop-blur shadow-xs">
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[13px] animate-spin text-[#007AFF]">sync</span>
                    <span>Saving to DB...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[13px] text-[#34C759]">cloud_done</span>
                    <span className="text-gray-500 dark:text-gray-400">Synced to DB</span>
                  </>
                )}
              </div>
            </div>

            {/* Large Time Display & Trend comparison */}
            <div className="flex items-baseline gap-4 flex-wrap">
              <span className="text-[48px] md:text-[54px] font-bold tracking-tight text-gray-950 dark:text-white tabular-nums leading-none">
                {statsLoaded ? formattedTodayTime : '0m'}
              </span>
              <span className="text-[13px] font-semibold text-[#007AFF] dark:text-[#0A84FF] flex items-center gap-1 bg-white/85 dark:bg-white/10 px-2.5 py-1 rounded-full border border-[#007AFF]/20 dark:border-white/10 shadow-xs">
                <span className="material-symbols-outlined text-[17px]">
                  {diffVsYesterdayMinutes >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                <span>{formattedDiffVsYesterday}</span>
              </span>
            </div>

            {/* Subtext description */}
            <p className="text-[14px] text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
              {todayMinutes > 0 ? (
                <>
                  Deep Work Engine <span className="text-gray-300 dark:text-gray-600">·</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100 font-medium">In the zone</span> with{' '}
                  {completedSessions} focus {completedSessions === 1 ? 'block' : 'blocks'} logged today.
                </>
              ) : (
                <>
                  Ready for deep work <span className="text-gray-300 dark:text-gray-600">·</span> Start the Focus Timer to begin logging your daily focus blocks.
                </>
              )}
            </p>

            {/* Apple Liquid Progress Line */}
            <div className="flex flex-col gap-1.5 mt-1 relative">
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                    {progressPercent}% of {formattedTargetTime} daily target
                  </span>
                  {/* Edit Target Goal Button */}
                  <button
                    type="button"
                    onClick={() => setShowTargetMenu(!showTargetMenu)}
                    title="Change Daily Target"
                    className="w-5 h-5 rounded-md bg-black/[0.04] dark:bg-white/10 hover:bg-black/[0.08] dark:hover:bg-white/15 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#007AFF] dark:hover:text-[#0A84FF] transition-colors border border-black/5 dark:border-white/10"
                  >
                    <span className="material-symbols-outlined text-[13px]">tune</span>
                  </button>
                </div>
                <span className="text-gray-500 dark:text-gray-400 tabular-nums">{formattedRemainingTime}</span>
              </div>

              {/* Target Goal Popup Menu */}
              {showTargetMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTargetMenu(false)}
                  />
                  <div className="absolute left-0 top-6 z-50 p-3 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-black/10 dark:border-white/15 flex flex-col gap-2 min-w-[200px] animate-fadeIn">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                      Set Target Goal
                    </span>
                    <div className="flex flex-col gap-1">
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
                              ? 'bg-[#007AFF] text-white font-semibold shadow-xs'
                              : 'bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-gray-800 dark:text-gray-200'
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

              {/* Progress Line */}
              <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#32ADE6] to-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)] transition-all duration-700"
                  style={{ width: `${Math.max(todayMinutes > 0 ? 4 : 0, progressPercent)}%` }}
                />
              </div>
            </div>

            {/* Apple System Pill Micro-stats Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 shadow-xs text-gray-800 dark:text-gray-200 text-[12px] font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#007AFF]">timelapse</span>
                <span>Current block: <strong className="text-gray-950 dark:text-white font-semibold tabular-nums">{todayMinutes > 0 ? `${todayMinutes}m` : '0m'}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 shadow-xs text-gray-800 dark:text-gray-200 text-[12px] font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#FF9500]">coffee</span>
                <span>Next break: <strong className="text-gray-950 dark:text-white font-semibold">in 18m</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 shadow-xs text-gray-800 dark:text-gray-200 text-[12px] font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#00C7BE]">bolt</span>
                <span>Peak energy: <strong className="text-gray-950 dark:text-white font-semibold">High</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 shadow-xs text-gray-800 dark:text-gray-200 text-[12px] font-medium">
                <span className="material-symbols-outlined text-[15px] text-[#5856D6]">track_changes</span>
                <span>Efficiency: <strong className="text-gray-950 dark:text-white font-semibold tabular-nums">94%</strong></span>
              </div>
            </div>

            {/* WHAT'S YOUR FOCUS TODAY (Based on an Average Working Day) */}
            <div className="mt-1 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.05] backdrop-blur-md border border-white dark:border-white/10 shadow-xs flex flex-col gap-2.5">
              {/* Header: Title & Workday Context */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#007AFF] dark:text-[#0A84FF] text-[18px]">psychology</span>
                  <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">What&apos;s your focus today?</span>
                </div>

                {/* Workday Benchmark Selector & Analysis Action */}
                <div className="flex items-center gap-2">
                  {/* Workday Length Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowWorkdayMenu(!showWorkdayMenu)}
                      className="px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 text-[11px] font-medium flex items-center gap-1 transition-colors border border-black/5 dark:border-white/10"
                      title="Adjust average working day hours"
                    >
                      <span className="material-symbols-outlined text-[13px] text-[#007AFF] dark:text-[#0A84FF]">schedule</span>
                      <span>Avg Workday: <strong>{workdayHours}h</strong></span>
                      <span className="material-symbols-outlined text-[12px]">expand_more</span>
                    </button>

                    {/* Workday Hours Dropdown */}
                    {showWorkdayMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowWorkdayMenu(false)}
                        />
                        <div className="absolute right-0 top-7 z-50 p-2 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl rounded-xl shadow-xl border border-black/10 dark:border-white/15 flex flex-col gap-1 text-xs text-gray-800 dark:text-gray-200 min-w-[160px] animate-fadeIn">
                          <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">
                            Avg Workday Length:
                          </span>
                          {WORKDAY_PRESETS.map((p) => (
                            <button
                              key={p.hours}
                              type="button"
                              onClick={() => {
                                setWorkdayHours(p.hours);
                                setShowWorkdayMenu(false);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                                workdayHours === p.hours
                                  ? 'bg-[#007AFF]/15 dark:bg-[#007AFF]/25 text-[#007AFF] dark:text-[#0A84FF] font-semibold'
                                  : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              <span>{p.label}</span>
                              {workdayHours === p.hours && (
                                <span className="material-symbols-outlined text-[14px] text-[#007AFF] dark:text-[#0A84FF]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Workday Analysis Button */}
                  <button
                    type="button"
                    onClick={() => setShowAnalysisModal(true)}
                    className="px-2.5 py-1 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 hover:bg-[#007AFF]/15 dark:hover:bg-[#007AFF]/30 text-[#007AFF] dark:text-[#0A84FF] text-[11px] font-semibold flex items-center gap-1 transition-all border border-[#007AFF]/15 dark:border-[#007AFF]/30"
                  >
                    <span className="material-symbols-outlined text-[14px]">analytics</span>
                    <span>Analysis</span>
                  </button>
                </div>
              </div>

              {/* Focus Intention Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={intentionInput}
                  onChange={(e) => setIntentionInput(e.target.value)}
                  onFocus={() => setIsEditingIntention(true)}
                  onBlur={handleCommitIntention}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Set your main objective today (e.g., Ship Rust Tauri IPC module)..."
                  className="flex-1 bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.1] focus:bg-white dark:focus:bg-[#2C2C2E] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-xs sm:text-sm px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 focus:border-[#007AFF] dark:focus:border-[#0A84FF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                />
                {isEditingIntention && (
                  <button
                    type="button"
                    onClick={handleCommitIntention}
                    className="px-3 py-1.5 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-xs"
                  >
                    Save
                  </button>
                )}
              </div>

              {/* Category Chips & Workday Allocation Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                {/* Category selector chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mr-0.5">Category:</span>
                  {CATEGORY_CHIPS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        category === cat
                          ? 'bg-[#007AFF] text-white font-semibold shadow-xs'
                          : 'bg-black/[0.03] dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Workday Breakdown summary badge */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C7BE]" />
                  <span>
                    Focus Target: <strong className="text-gray-800 dark:text-gray-200">{deepWorkAllocationPercent}%</strong> of {workdayHours}h Workday
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span><strong className="text-gray-800 dark:text-gray-200">{collaborationBufferHours}h</strong> Buffer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Activity Rings & Gauge */}
          <div className="flex items-center justify-center p-2 self-center">
            <div className="relative flex items-center justify-center w-40 h-40 md:w-44 md:h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Track Base */}
                <circle
                  className="text-blue-100/70"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                {/* Outer Ring (Focus Target) */}
                <circle
                  className="text-[#007AFF] transition-all duration-1000 drop-shadow-[0_2px_4px_rgba(0,122,255,0.3)]"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="50"
                  stroke="currentColor"
                  strokeDasharray="314.15"
                  strokeDashoffset={Math.max(0, 314.15 * (1 - Math.min(100, progressPercent) / 100))}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
                {/* Inner Activity Sub-Ring */}
                <circle
                  className="text-[#00C7BE] transition-all duration-1000"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="38"
                  stroke="currentColor"
                  strokeDasharray="238.7"
                  strokeDashoffset={Math.max(0, 238.7 * (1 - Math.min(100, progressPercent * 0.85) / 100))}
                  strokeLinecap="round"
                  strokeWidth="6"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[28px] font-bold text-gray-950 tabular-nums tracking-tight">
                  {progressPercent}%
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  {progressPercent >= 100 ? 'TARGET MET' : 'COMPLETED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKDAY & FOCUS ANALYSIS MODAL */}
      {mounted && showAnalysisModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setShowAnalysisModal(false)}
          />
          <div className="relative z-10 w-full max-w-xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/80 dark:border-white/15 flex flex-col gap-4 text-gray-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 dark:bg-[#007AFF]/20 flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF]">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-950 dark:text-white">
                    Workday &amp; Focus Analysis
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deep work benchmarks based on your average {workdayHours}-hour working day
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalysisModal(false)}
                className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Assessment Card */}
            <div className={`p-4 rounded-2xl border ${workdayAnalysis.badgeColor} flex items-start gap-3`}>
              <span className="material-symbols-outlined text-[22px] mt-0.5">insights</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{workdayAnalysis.rating}</span>
                <span className="text-xs opacity-90">{workdayAnalysis.description}</span>
              </div>
            </div>

            {/* Visual Workday Capacity Bar */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-900 dark:text-gray-200">Average Workday Allocation ({workdayHours}h total)</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formattedTargetTime} Focus / {collaborationBufferHours}h Buffer
                </span>
              </div>

              {/* Split progress bar */}
              <div className="w-full h-4 rounded-xl bg-black/[0.06] dark:bg-white/10 overflow-hidden flex p-0.5 gap-0.5">
                <div
                  className="h-full rounded-l-lg bg-[#007AFF] transition-all duration-500"
                  style={{ width: `${deepWorkAllocationPercent}%` }}
                  title={`Deep Work Target: ${deepWorkAllocationPercent}%`}
                />
                <div
                  className="h-full rounded-r-lg bg-black/[0.08] dark:bg-white/15 transition-all duration-500"
                  style={{ width: `${100 - deepWorkAllocationPercent}%` }}
                  title={`Collaboration & Buffer: ${100 - deepWorkAllocationPercent}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 pt-0.5">
                <span className="flex items-center gap-1 text-[#007AFF] dark:text-[#0A84FF]">
                  <span className="w-2 h-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]" />
                  <span>Deep Work Target ({deepWorkAllocationPercent}%)</span>
                </span>
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                  <span>Buffer &amp; Collaboration ({100 - deepWorkAllocationPercent}%)</span>
                </span>
              </div>
            </div>

            {/* Current Day Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
                <span className="block text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Today&apos;s Focus</span>
                <span className="text-lg font-semibold text-[#007AFF] dark:text-[#0A84FF]">{formattedTodayTime}</span>
                <span className="block text-[10px] text-gray-400 dark:text-gray-500">of {formattedTargetTime} target</span>
              </div>
              <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
                <span className="block text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Workday Logged</span>
                <span className="text-lg font-semibold text-[#00C7BE]">{loggedWorkdayPercent}%</span>
                <span className="block text-[10px] text-gray-400 dark:text-gray-500">of {workdayHours}h day</span>
              </div>
              <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 col-span-2 sm:col-span-1">
                <span className="block text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Category</span>
                <span className="text-lg font-semibold text-gray-950 dark:text-white">{category}</span>
                <span className="block text-[10px] text-gray-400 dark:text-gray-500">Stored in DB</span>
              </div>
            </div>

            {/* Today's Stored Intention in DB */}
            <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                <span>Today&apos;s Logged Intention in Supabase</span>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  <span>Persisted in DB</span>
                </span>
              </div>
              <span className="font-semibold text-gray-950 dark:text-white text-sm">{focusIntention}</span>
            </div>

            {/* Database History Section (Past Days) */}
            {history.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Recent Focus History (from Cloud DB)
                </span>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                  {history.map((record) => (
                    <div
                      key={record.id || record.date}
                      className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">{record.date}</span>
                        <span className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/10 text-[10px] font-medium text-gray-900 dark:text-white">
                          {record.category}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                          {record.focusIntention}
                        </span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {record.actualMinutes}m / {record.targetMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0071EB] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


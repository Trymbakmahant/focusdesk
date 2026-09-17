"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  const [intentionInput, setIntentionInput] = useState(focusIntention);
  const [isEditingIntention, setIsEditingIntention] = useState(false);

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
      <section aria-label="Daily Focus Overview" className="relative rounded-2xl bg-gradient-to-br from-[#EAF7FF] via-[#D9F1FF] to-surface-container-lowest p-space-xl shadow-md border border-outline-variant/20 z-10">
        <h2 className="sr-only">Daily Focus Target and Progress</h2>
        {/* Background ambient orbs container with isolated overflow-hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl" />
          <div className="absolute right-1/4 -bottom-16 w-80 h-80 rounded-full bg-primary-fixed/40 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
          <div className="flex flex-col gap-space-sm max-w-2xl flex-1">
            {/* Top category indicator & cloud sync status */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-space-xs text-primary font-label-sm text-label-sm uppercase tracking-wider">
                <span className={`w-2 h-2 rounded-full bg-primary ${todayMinutes > 0 ? 'animate-ping' : ''}`} />
                <span>Focus for Today</span>
                <span className="text-outline">·</span>
                <span className="text-on-surface-variant lowercase">
                  {todayMinutes > 0 ? 'ambient flow' : 'ready to focus'}
                </span>
              </div>

              {/* DB Cloud Persistence Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/80 border border-outline-variant/30 text-[11px] text-on-surface-variant backdrop-blur">
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[13px] animate-spin text-primary">sync</span>
                    <span>Saving to DB...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[13px] text-emerald-600">cloud_done</span>
                    <span className="text-outline">Synced to DB</span>
                  </>
                )}
              </div>
            </div>

            {/* Large Time Display & Trend comparison */}
            <div className="flex items-baseline gap-space-md flex-wrap">
              <span className="font-display-lg text-[52px] leading-[58px] tracking-tight text-on-surface font-semibold">
                {statsLoaded ? formattedTodayTime : '0m'}
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

              {/* Target Goal Popup Menu */}
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

            {/* WHAT'S YOUR FOCUS TODAY (Based on an Average Working Day) */}
            <div className="mt-space-sm p-space-md rounded-2xl bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/30 shadow-xs flex flex-col gap-2.5">
              {/* Header: Title & Workday Context */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                  <span className="font-semibold text-sm text-on-surface">What&apos;s your focus today?</span>
                </div>

                {/* Workday Benchmark Selector & Analysis Action */}
                <div className="flex items-center gap-2">
                  {/* Workday Length Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowWorkdayMenu(!showWorkdayMenu)}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface text-[11px] font-medium flex items-center gap-1 transition-colors border border-outline-variant/20"
                      title="Adjust average working day hours"
                    >
                      <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
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
                        <div className="absolute right-0 top-7 z-50 p-2 bg-surface-container-lowest/98 backdrop-blur-xl rounded-xl shadow-xl border border-outline-variant/30 flex flex-col gap-1 text-xs text-on-surface min-w-[160px] animate-fadeIn">
                          <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-outline font-semibold">
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
                                  ? 'bg-primary/15 text-primary font-semibold'
                                  : 'hover:bg-surface-container text-on-surface'
                              }`}
                            >
                              <span>{p.label}</span>
                              {workdayHours === p.hours && (
                                <span className="material-symbols-outlined text-[14px] text-primary">check</span>
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
                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold flex items-center gap-1 transition-all border border-primary/20"
                  >
                    <span className="material-symbols-outlined text-[14px]">analytics</span>
                    <span>Workday Analysis</span>
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
                  className="flex-1 bg-surface-container-low/70 hover:bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs sm:text-sm px-3 py-2 rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {isEditingIntention && (
                  <button
                    type="button"
                    onClick={handleCommitIntention}
                    className="px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                )}
              </div>

              {/* Category Chips & Workday Allocation Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Category selector chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-outline font-medium mr-0.5">Category:</span>
                  {CATEGORY_CHIPS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        category === cat
                          ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Workday Breakdown summary badge */}
                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>
                    Focus Target: <strong>{deepWorkAllocationPercent}%</strong> of {workdayHours}h Workday
                  </span>
                  <span className="text-outline">·</span>
                  <span><strong>{collaborationBufferHours}h</strong> Buffer</span>
                </div>
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

      {/* WORKDAY & FOCUS ANALYSIS MODAL */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setShowAnalysisModal(false)}
          />
          <div className="relative z-10 w-full max-w-xl bg-surface-container-lowest/98 backdrop-blur-2xl rounded-3xl p-space-xl shadow-2xl border border-outline-variant/30 flex flex-col gap-space-md text-on-surface">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Workday &amp; Focus Analysis
                  </h3>
                  <p className="text-xs text-outline">
                    Deep work benchmarks based on your average {workdayHours}-hour working day
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalysisModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors"
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
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-on-surface">Average Workday Allocation ({workdayHours}h total)</span>
                <span className="text-outline">
                  {formattedTargetTime} Focus / {collaborationBufferHours}h Buffer
                </span>
              </div>

              {/* Split progress bar */}
              <div className="w-full h-4 rounded-xl bg-surface-container overflow-hidden flex p-0.5 gap-0.5">
                <div
                  className="h-full rounded-l-lg bg-primary transition-all duration-500"
                  style={{ width: `${deepWorkAllocationPercent}%` }}
                  title={`Deep Work Target: ${deepWorkAllocationPercent}%`}
                />
                <div
                  className="h-full rounded-r-lg bg-surface-variant/50 transition-all duration-500"
                  style={{ width: `${100 - deepWorkAllocationPercent}%` }}
                  title={`Collaboration & Buffer: ${100 - deepWorkAllocationPercent}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-outline pt-0.5">
                <span className="flex items-center gap-1 text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Deep Work Target ({deepWorkAllocationPercent}%)</span>
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-surface-variant" />
                  <span>Buffer &amp; Collaboration ({100 - deepWorkAllocationPercent}%)</span>
                </span>
              </div>
            </div>

            {/* Current Day Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="block text-[11px] text-outline uppercase tracking-wider">Today&apos;s Focus</span>
                <span className="text-lg font-semibold text-primary">{formattedTodayTime}</span>
                <span className="block text-[10px] text-outline">of {formattedTargetTime} target</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="block text-[11px] text-outline uppercase tracking-wider">Workday Logged</span>
                <span className="text-lg font-semibold text-secondary">{loggedWorkdayPercent}%</span>
                <span className="block text-[10px] text-outline">of {workdayHours}h day</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 col-span-2 sm:col-span-1">
                <span className="block text-[11px] text-outline uppercase tracking-wider">Active Category</span>
                <span className="text-lg font-semibold text-on-surface">{category}</span>
                <span className="block text-[10px] text-outline">Stored in DB</span>
              </div>
            </div>

            {/* Today's Stored Intention in DB */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/20 text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-outline text-[11px]">
                <span>Today&apos;s Logged Intention in Supabase</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  <span>Persisted in DB</span>
                </span>
              </div>
              <span className="font-semibold text-on-surface text-sm">{focusIntention}</span>
            </div>

            {/* Database History Section (Past Days) */}
            {history.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                  Recent Focus History (from Cloud DB)
                </span>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                  {history.map((record) => (
                    <div
                      key={record.id || record.date}
                      className="px-3 py-2 rounded-xl bg-surface-container-low/60 border border-outline-variant/15 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-outline">{record.date}</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-medium text-on-surface">
                          {record.category}
                        </span>
                        <span className="font-medium text-on-surface truncate max-w-[180px]">
                          {record.focusIntention}
                        </span>
                      </div>
                      <span className="text-outline font-medium">
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
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


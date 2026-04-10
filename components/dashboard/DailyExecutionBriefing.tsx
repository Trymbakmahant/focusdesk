"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSecondBrain } from '@/hooks/useSecondBrain';

export default function DailyExecutionBriefing() {
  const { briefing, fetchBriefing } = useSecondBrain();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBriefing();
    setIsRefreshing(false);
  };

  const handleCopy = () => {
    if (briefing?.summaryText) {
      navigator.clipboard.writeText(briefing.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!briefing) {
    return (
      <div className="w-full rounded-3xl bg-white/60 dark:bg-[#1E1F23]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 p-6 flex items-center justify-center min-h-[160px] animate-pulse shadow-sm">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="material-symbols-outlined animate-spin text-[#007AFF]">sync</span>
          <span>Synthesizing live daily execution briefing...</span>
        </div>
      </div>
    );
  }

  const { topPriorities, overdueTasks, upcomingDeadlines, recentDecisions, date } = briefing;

  return (
    <div className="w-full rounded-3xl bg-white/70 dark:bg-[#1A1B1E]/85 backdrop-blur-[36px] border border-black/5 dark:border-white/10 p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5856D6] to-[#007AFF] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(88,86,214,0.35)]">
            <span className="material-symbols-outlined text-[20px]">neurology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                Daily Execution Briefing
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                LIVE MCP
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Deterministic synthesis from live memory &amp; task records • {date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Copy briefing markdown to clipboard"
          >
            <span className="material-symbols-outlined text-[15px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied' : 'Copy Brief'}</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
            title="Refresh briefing"
          >
            <span className={`material-symbols-outlined text-[17px] ${isRefreshing ? 'animate-spin text-[#007AFF]' : ''}`}>
              refresh
            </span>
          </button>

          <Link
            href="/second-brain"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium bg-[#007AFF] text-white hover:bg-[#0062cc] shadow-sm transition-all"
          >
            <span>Open OS</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Overdue Alert Banner (if any) */}
      {overdueTasks.length > 0 && (
        <div className="mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-red-500 shrink-0 mt-0.5">
            warning
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                {overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Action Item' : 'Action Items'}
              </span>
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Needs Immediate Action</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {overdueTasks.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-xs text-red-800 dark:text-red-200"
                >
                  <span className="font-medium truncate max-w-[200px]">{t.title}</span>
                  <span className="text-[10px] opacity-75 font-mono">({t.dueDate})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid: Priorities, Upcoming Deadlines, Decisions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
        {/* Top 3 Priorities (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-2.5 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#007AFF]">flag</span>
              Top 3 Daily Priorities
            </span>
            <span className="text-[10px] text-gray-400">Sorted by urgency</span>
          </div>

          {topPriorities.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              No priorities scheduled for today. Ready for deep focus.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topPriorities.map((task, idx) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#202125] border border-black/5 dark:border-white/10 hover:border-[#007AFF]/30 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </span>
                    {task.projectName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF] font-medium shrink-0">
                        {task.projectName}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        : task.priority === 'high'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7-Day Deadlines & Decisions (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {/* Upcoming Deadlines */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex-1">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#FF9500]">schedule</span>
              7-Day Deadlines
            </span>

            {upcomingDeadlines.length === 0 ? (
              <span className="text-[11px] text-gray-400 py-2">No deadlines in the next 7 days.</span>
            ) : (
              <div className="flex flex-col gap-1.5">
                {upcomingDeadlines.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-gray-800 dark:text-gray-200 truncate pr-2 font-medium">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-semibold text-[#FF9500] shrink-0 bg-[#FF9500]/10 px-2 py-0.5 rounded-md">
                      in {item.daysRemaining}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Architectural & Strategic Decisions */}
          {recentDecisions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#5856D6]">lightbulb</span>
                Latest Decision
              </span>
              <div className="text-xs">
                <span className="font-semibold text-gray-900 dark:text-white">{recentDecisions[0].title}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                  {recentDecisions[0].rationale}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

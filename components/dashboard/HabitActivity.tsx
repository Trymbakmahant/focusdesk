"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import HabitModal, { HabitFormData } from './HabitModal';

export type Habit = {
  id: string;
  user_id?: string;
  title: string;
  icon: string;
  type: 'Good' | 'Bad';
  count_today: number;
  daily_limit: number;
  created_at?: string;
};

export default function HabitActivity() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    formattedDate: string;
    count: number;
    isToday: boolean;
  } | null>(null);

  // User-scoped localStorage key for habits list
  const habitsStorageKey = useMemo(() => {
    return user ? `focusdeck_habits_${user.id}` : 'focusdeck_habits_guest';
  }, [user]);

  // Load habits from Supabase or localStorage for the authenticated user
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setActiveHabitId(null);
      setLoading(false);
      return;
    }

    // 1. Try local cache first
    try {
      const cached = localStorage.getItem(habitsStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHabits(parsed);
          setActiveHabitId(parsed[0].id);
        }
      }
    } catch {
      // Fallback
    }

    // 2. Fetch from Supabase
    async function fetchHabits() {
      if (!supabase || !user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setHabits(data);
          localStorage.setItem(habitsStorageKey, JSON.stringify(data));
          if (data.length > 0) {
            setActiveHabitId((prev) => (prev && data.some((h: Habit) => h.id === prev) ? prev : data[0].id));
          } else {
            setActiveHabitId(null);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch habits error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHabits();
  }, [user, habitsStorageKey]);

  // Persist habits to localStorage whenever habits change
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(habitsStorageKey, JSON.stringify(habits));
    } catch (err) {
      console.error('Failed to cache habits:', err);
    }
  }, [habits, user, habitsStorageKey]);

  const activeHabit = habits.find((h) => h.id === activeHabitId) || habits[0] || null;

  // Handlers
  const handleOpenCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (formData: HabitFormData) => {
    if (editingHabit) {
      // Update existing habit
      const updatedList = habits.map((h) =>
        h.id === editingHabit.id ? { ...h, ...formData } : h
      );
      setHabits(updatedList);

      if (supabase && user) {
        try {
          await supabase
            .from('habits')
            .update({
              title: formData.title,
              icon: formData.icon,
              type: formData.type,
              daily_limit: formData.daily_limit,
            })
            .eq('id', editingHabit.id)
            .eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase update habit error:', err);
        }
      }
    } else {
      // Create new habit
      const newHabit: Habit = {
        id: crypto.randomUUID(),
        user_id: user?.id,
        title: formData.title,
        icon: formData.icon,
        type: formData.type,
        count_today: 0,
        daily_limit: formData.daily_limit,
        created_at: new Date().toISOString(),
      };

      setHabits((prev) => [...prev, newHabit]);
      setActiveHabitId(newHabit.id);

      if (supabase && user) {
        try {
          await supabase.from('habits').insert([
            {
              id: newHabit.id,
              user_id: user.id,
              title: newHabit.title,
              icon: newHabit.icon,
              type: newHabit.type,
              count_today: 0,
              daily_limit: newHabit.daily_limit,
              created_at: newHabit.created_at,
            },
          ]);
        } catch (err) {
          console.warn('Supabase insert habit error:', err);
        }
      }
    }
  };

  const updateHabitCount = async (increment: number) => {
    if (!activeHabit) return;
    const newCount = Math.max(0, activeHabit.count_today + increment);
    setHabits(
      habits.map((h) => (h.id === activeHabit.id ? { ...h, count_today: newCount } : h))
    );

    // Update today in persistent logs for heatmap
    if (user) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const logKey = `focusdeck_habit_logs_${user.id}_${activeHabit.id}`;
        const existing = JSON.parse(localStorage.getItem(logKey) || '{}');
        existing[todayStr] = newCount;
        localStorage.setItem(logKey, JSON.stringify(existing));
      } catch (err) {
        console.warn('Failed to update log history:', err);
      }
    }

    if (supabase && user) {
      try {
        await supabase
          .from('habits')
          .update({ count_today: newCount })
          .eq('id', activeHabit.id)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase update count error:', err);
      }
    }
  };

  const deleteHabit = async () => {
    if (!activeHabit) return;
    if (!confirm(`Are you sure you want to delete "${activeHabit.title}"?`)) return;

    const habitToDeleteId = activeHabit.id;
    const filtered = habits.filter((h) => h.id !== habitToDeleteId);
    setHabits(filtered);
    setActiveHabitId(filtered.length > 0 ? filtered[0].id : null);

    if (supabase && user) {
      try {
        await supabase
          .from('habits')
          .delete()
          .eq('id', habitToDeleteId)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase delete habit error:', err);
      }
    }
  };

  // Generate dynamic 12-week heatmap (84 days)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    const todayStr = today.toISOString().split('T')[0];

    let logsMap: Record<string, number> = {};
    if (user && activeHabit) {
      try {
        const logKey = `focusdeck_habit_logs_${user.id}_${activeHabit.id}`;
        logsMap = JSON.parse(localStorage.getItem(logKey) || '{}');
      } catch {
        // Fallback
      }
    }

    for (let i = 139; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;

      // Count for today comes from live activeHabit state, past from logsMap
      const count = isToday ? (activeHabit?.count_today ?? 0) : (logsMap[dateStr] || 0);

      days.push({
        date: dateStr,
        dayOfWeek: d.getDay(), // 0 = Sun, 1 = Mon ... 6 = Sat
        formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count,
        isToday,
      });
    }

    return days;
  }, [user, activeHabit, activeHabit?.count_today]);

  // Color generator for heatmap cells (Apple Health Palette)
  const getCellColor = (count: number, isGood: boolean) => {
    if (count === 0) {
      return 'bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05] hover:border-black/20 dark:hover:border-white/30';
    }

    if (isGood) {
      if (count === 1) return 'bg-[#34C759]/25 dark:bg-[#34C759]/30 border border-[#34C759]/35 hover:bg-[#34C759]/40';
      if (count === 2) return 'bg-[#34C759]/55 dark:bg-[#34C759]/60 border border-[#34C759]/65 hover:bg-[#34C759]/70';
      if (count === 3) return 'bg-[#34C759]/80 dark:bg-[#34C759]/85 border border-[#34C759]/90 hover:bg-[#34C759]/95';
      return 'bg-[#34C759] border border-[#34C759] shadow-[0_1px_4px_rgba(52,199,89,0.3)] hover:brightness-110';
    } else {
      // Bad habit (Harm reduction)
      if (count === 1) return 'bg-[#FF9500]/30 dark:bg-[#FF9500]/35 border border-[#FF9500]/40 hover:bg-[#FF9500]/50';
      if (count === 2) return 'bg-[#FF9500]/65 dark:bg-[#FF9500]/70 border border-[#FF9500]/75 hover:bg-[#FF9500]/80';
      if (count === 3) return 'bg-[#FF3B30]/75 dark:bg-[#FF3B30]/80 border border-[#FF3B30]/85 hover:bg-[#FF3B30]/90';
      return 'bg-[#FF3B30] border border-[#FF3B30] shadow-[0_1px_4px_rgba(255,59,48,0.3)] hover:brightness-110';
    }
  };

  const isGoodHabit = activeHabit ? activeHabit.type === 'Good' : true;

  return (
    <div className="apple-glass apple-card-hover md:col-span-7 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden transition-all">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#34C759]/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Top Header */}
        <div className="flex flex-col gap-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[19px]">vital_signs</span>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-white tracking-tight">Habits &amp; Activity</h2>
                <span className="text-[11px] font-semibold text-[#86868B] dark:text-gray-400 px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">Health</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeHabit && (
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    activeHabit.type === 'Bad'
                      ? 'bg-[#FF9500]/12 text-[#FF9500]'
                      : 'bg-[#34C759]/12 text-[#34C759]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {activeHabit.type === 'Bad' ? 'trending_down' : 'trending_up'}
                  </span>
                  <span>{activeHabit.type === 'Bad' ? 'Harm Reduction' : 'Positive Routine'}</span>
                </div>
              )}
              <button
                onClick={handleOpenCreate}
                className="px-3 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0071EB] text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>New Habit</span>
              </button>
            </div>
          </div>

          {/* Habit Selection Tabs */}
          {habits.length > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="apple-segmented-bg p-1 rounded-full flex items-center gap-1 overflow-x-auto max-w-full">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => setActiveHabitId(habit.id)}
                    className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs whitespace-nowrap transition-all ${
                      activeHabitId === habit.id
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                        : 'text-[#86868B] dark:text-gray-400 hover:text-[#1D1D1F] dark:hover:text-white'
                    }`}
                  >
                    <span>{habit.icon}</span>
                    <span>{habit.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Body: Active Habit Card OR Empty State */}
        {habits.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center text-center gap-3 my-2 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
              <span className="material-symbols-outlined text-[28px]">self_improvement</span>
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                No Habits Tracked Yet
              </h3>
              <p className="text-xs text-[#86868B] dark:text-gray-400 leading-relaxed">
                Build positive daily routines (like workouts, meditation, or hydration) or track and reduce harmful habits.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="mt-1 px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0071EB] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Create Your First Habit</span>
            </button>
          </div>
        ) : activeHabit ? (
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.05] backdrop-blur-md flex items-center justify-between gap-4 mb-3 border border-white/80 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2C2C2E] flex items-center justify-center text-[24px] shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform border border-black/5 dark:border-white/10"
                onClick={() => handleOpenEdit(activeHabit)}
                title="Click to edit habit"
              >
                {activeHabit.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <div
                  className="flex items-baseline gap-1.5 cursor-pointer flex-wrap"
                  onClick={() => handleOpenEdit(activeHabit)}
                  title="Click to edit habit"
                >
                  <span className="text-[28px] font-bold tracking-tight text-[#1D1D1F] dark:text-white tabular-nums leading-none">
                    {activeHabit.count_today}
                  </span>
                  <span className="text-xs text-[#86868B] dark:text-gray-400 font-medium">
                    {activeHabit.type === 'Bad' ? 'logged today' : 'completed today'}
                  </span>
                  <span className="text-[#C7C7CC] dark:text-gray-600">·</span>
                  <span className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                    Daily {activeHabit.type === 'Bad' ? 'limit' : 'goal'}: {activeHabit.daily_limit}
                  </span>
                </div>
                <span className="text-[11px] text-[#86868B] dark:text-gray-400 mt-0.5 truncate font-medium">
                  {activeHabit.type === 'Bad'
                    ? activeHabit.count_today <= activeHabit.daily_limit
                      ? `🟢 Under daily quota (${activeHabit.count_today}/${activeHabit.daily_limit})`
                      : `🔴 Over daily limit (${activeHabit.count_today}/${activeHabit.daily_limit})`
                    : activeHabit.count_today >= activeHabit.daily_limit
                    ? `🎉 Target reached for today!`
                    : `⚡ ${activeHabit.daily_limit - activeHabit.count_today} more to hit daily goal`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEdit(activeHabit)}
                className="w-8 h-8 rounded-full text-[#86868B] dark:text-gray-400 hover:text-[#007AFF] dark:hover:text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                title="Edit Habit"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button
                onClick={deleteHabit}
                className="w-8 h-8 rounded-full text-[#86868B] dark:text-gray-400 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center justify-center transition-colors"
                title="Delete Habit"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
              <button
                onClick={() => updateHabitCount(-1)}
                disabled={activeHabit.count_today <= 0}
                className="w-8 h-8 rounded-full bg-white dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 disabled:opacity-30 text-[#1D1D1F] dark:text-white shadow-xs flex items-center justify-center text-sm font-semibold transition-all border border-black/5 dark:border-white/10"
                title="Decrease count"
              >
                −
              </button>
              <button
                onClick={() => updateHabitCount(1)}
                className="h-8 px-3.5 rounded-full bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] hover:bg-[#0071EB] transition-all flex items-center gap-1 text-xs font-semibold active:scale-95"
                title="Log 1"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>Log 1</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Dynamic Frequency Heatmap Section - Stretches 100% full width of parent card */}
        <div className="py-2 w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-[#86868B] dark:text-gray-400 font-medium flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#34C759]">grid_view</span>
              <span className="tracking-tight font-semibold text-[#1D1D1F] dark:text-white">20-Week Activity Grid</span>
              {activeHabit && <span className="text-gray-500 dark:text-gray-400">({activeHabit.title})</span>}
            </span>

            {/* Dynamic Inspector Badge on Hover */}
            {hoveredDay ? (
              <span className="text-[11px] font-semibold text-[#007AFF] dark:text-[#0A84FF] flex items-center gap-1.5 bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-2.5 py-0.5 rounded-full animate-fadeIn border border-[#007AFF]/20">
                <span>{hoveredDay.formattedDate}:</span>
                <strong className="text-gray-900 dark:text-white">{hoveredDay.count} {hoveredDay.count === 1 ? 'log' : 'logs'}</strong>
                {activeHabit && (
                  <span className="text-gray-500 dark:text-gray-300 font-normal">
                    ({isGoodHabit 
                      ? (hoveredDay.count >= activeHabit.daily_limit ? '🎉 Goal reached' : `${activeHabit.daily_limit - hoveredDay.count} to hit goal`)
                      : (hoveredDay.count <= activeHabit.daily_limit ? '🟢 Within limit' : `⚠️ +${hoveredDay.count - activeHabit.daily_limit} over limit`)})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-[10px]">Hover any block for details</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full">
            {/* Weekday indicators */}
            <div className="flex flex-col justify-between text-[10px] text-[#86868B] dark:text-gray-400 font-mono h-[116px] py-1 select-none font-medium shrink-0">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* 7 rows x 20 columns grid stretching full width */}
            <div className="grid grid-flow-col grid-rows-7 auto-cols-fr w-full gap-1.5 p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-white/80 dark:border-white/10 backdrop-blur-xs">
              {heatmapData.map((day) => {
                const cellColor = getCellColor(day.count, isGoodHabit);
                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`group/cell relative h-3.5 sm:h-4 w-full rounded-[4px] transition-all cursor-pointer ${cellColor} ${
                      day.isToday ? 'ring-2 ring-[#007AFF] dark:ring-[#0A84FF] ring-offset-1 ring-offset-white dark:ring-offset-[#1C1C1E] z-10' : ''
                    } hover:scale-110 hover:z-20 hover:shadow-md`}
                  >
                    {/* Floating Apple Glass Tooltip on Hover */}
                    <div className="pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-all duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 min-w-[150px] px-3 py-2 rounded-xl bg-gray-950/95 dark:bg-[#2C2C2E]/95 text-white backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col gap-0.5 text-center">
                      <span className="text-[10px] font-medium text-gray-400">{day.formattedDate}{day.isToday ? ' · Today' : ''}</span>
                      <span className="text-[12px] font-bold text-white">
                        {day.count} {day.count === 1 ? 'time' : 'times'} logged
                      </span>
                      {activeHabit && (
                        <span className="text-[10px] font-medium pt-0.5 border-t border-white/10 mt-0.5">
                          {isGoodHabit 
                            ? (day.count >= activeHabit.daily_limit ? '✅ Goal achieved' : `⚡ ${activeHabit.daily_limit - day.count} more to hit goal`)
                            : (day.count <= activeHabit.daily_limit ? '🟢 Within safe limit' : `⚠️ Over limit by ${day.count - activeHabit.daily_limit}`)
                          }
                        </span>
                      )}
                      <div className="w-2 h-2 bg-gray-950/95 dark:bg-[#2C2C2E]/95 rotate-45 border-r border-b border-white/20 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Dynamic Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 text-xs text-[#86868B] dark:text-gray-400 border-t border-black/5 dark:border-white/10 mt-2 gap-2 font-medium">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[#007AFF] dark:text-[#0A84FF] font-semibold">
            {habits.length > 0 ? `${habits.length} tracked habit${habits.length !== 1 ? 's' : ''}` : 'No habits yet'}
          </span>
          <span>·</span>
          <span>Synced with Apple Cloud / Supabase</span>
        </div>

        {/* Dynamic Theme-Synchronized Legend */}
        <div className="flex items-center gap-1.5 text-[11px] self-end sm:self-auto">
          <span>Less</span>
          <span
            className="w-3 h-3 rounded-[3px] bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05]"
            title="0 logs"
          />
          <span
            className={`w-3 h-3 rounded-[3px] border ${
              isGoodHabit ? 'bg-[#34C759]/25 dark:bg-[#34C759]/30 border-[#34C759]/35' : 'bg-[#FF9500]/30 dark:bg-[#FF9500]/35 border-[#FF9500]/40'
            }`}
            title="1 log"
          />
          <span
            className={`w-3 h-3 rounded-[3px] border ${
              isGoodHabit ? 'bg-[#34C759]/55 dark:bg-[#34C759]/60 border-[#34C759]/65' : 'bg-[#FF9500]/65 dark:bg-[#FF9500]/70 border-[#FF9500]/75'
            }`}
            title="2 logs"
          />
          <span
            className={`w-3 h-3 rounded-[3px] border ${
              isGoodHabit ? 'bg-[#34C759]/80 dark:bg-[#34C759]/85 border-[#34C759]/90' : 'bg-[#FF3B30]/75 dark:bg-[#FF3B30]/80 border-[#FF3B30]/85'
            }`}
            title="3 logs"
          />
          <span
            className={`w-3 h-3 rounded-[3px] border ${
              isGoodHabit ? 'bg-[#34C759] border-[#34C759]' : 'bg-[#FF3B30] border-[#FF3B30]'
            }`}
            title="4+ logs"
          />
          <span>More</span>
        </div>
      </div>

      {/* Create / Edit Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={
          editingHabit
            ? {
                title: editingHabit.title,
                icon: editingHabit.icon,
                type: editingHabit.type,
                daily_limit: editingHabit.daily_limit,
              }
            : null
        }
      />
    </div>
  );
}

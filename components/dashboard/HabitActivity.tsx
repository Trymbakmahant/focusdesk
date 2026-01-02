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

    for (let i = 83; i >= 0; i--) {
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

  // Color generator for heatmap cells
  const getCellColor = (count: number, isGood: boolean) => {
    if (count === 0) {
      return 'bg-surface-container-high/30 border border-outline-variant/15 hover:border-outline-variant/50';
    }

    if (isGood) {
      if (count === 1) return 'bg-primary/30 border border-primary/40 hover:bg-primary/40';
      if (count === 2) return 'bg-primary/55 border border-primary/60 hover:bg-primary/65';
      if (count === 3) return 'bg-primary/80 border border-primary/85 hover:bg-primary/90';
      return 'bg-primary border border-primary shadow-xs hover:brightness-110';
    } else {
      // Bad habit (Harm reduction)
      if (count === 1) return 'bg-amber-500/35 border border-amber-500/50 hover:bg-amber-500/45';
      if (count === 2) return 'bg-amber-500/65 border border-amber-500/80 hover:bg-amber-500/75';
      if (count === 3) return 'bg-rose-500/70 border border-rose-500/85 hover:bg-rose-500/80';
      return 'bg-rose-500 border border-rose-500 shadow-xs hover:brightness-110';
    }
  };

  const isGoodHabit = activeHabit ? activeHabit.type === 'Good' : true;

  return (
    <div className="md:col-span-7 flex flex-col justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        {/* Top Header */}
        <div className="flex flex-col gap-space-sm pb-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">vital_signs</span>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Habits &amp; Activity</h2>
                <span className="font-label-sm text-label-sm text-outline">Tracker</span>
              </div>
            </div>

            <div className="flex items-center gap-space-xs">
              {activeHabit && (
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                    activeHabit.type === 'Bad'
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-primary-fixed text-on-primary-fixed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {activeHabit.type === 'Bad' ? 'trending_down' : 'trending_up'}
                  </span>
                  <span>{activeHabit.type === 'Bad' ? 'Harm Reduction' : 'Positive Routine'}</span>
                </div>
              )}
              <button
                onClick={handleOpenCreate}
                className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>New Habit</span>
              </button>
            </div>
          </div>

          {/* Habit Selection Tabs (Only if habits exist) */}
          {habits.length > 0 && (
            <div className="flex items-center justify-between gap-space-sm pt-1">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low overflow-x-auto max-w-full">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => setActiveHabitId(habit.id)}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-label-sm text-label-sm whitespace-nowrap transition-all ${
                      activeHabitId === habit.id
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
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
          <div className="p-8 rounded-2xl bg-surface-container-low/50 border border-dashed border-outline-variant/40 flex flex-col items-center text-center gap-3 my-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">self_improvement</span>
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                No Habits Tracked Yet
              </h3>
              <p className="text-body-sm text-outline text-xs leading-relaxed">
                Build positive daily routines (like workouts, meditation, or hydration) or track and reduce harmful habits.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="mt-1 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Create Your First Habit</span>
            </button>
          </div>
        ) : activeHabit ? (
          <div className="p-space-sm rounded-xl bg-surface-container-low/70 flex items-center justify-between gap-space-md mb-space-sm border border-outline-variant/15">
            <div className="flex items-center gap-space-md min-w-0 flex-1">
              <div
                className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-[24px] shadow-xs shrink-0 cursor-pointer hover:scale-105 transition-transform border border-outline-variant/20"
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
                  <span className="font-display-lg text-[28px] leading-none text-on-surface font-semibold">
                    {activeHabit.count_today}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {activeHabit.type === 'Bad' ? 'logged today' : 'completed today'}
                  </span>
                  <span className="text-outline">·</span>
                  <span className="font-label-sm text-label-sm text-secondary">
                    Daily {activeHabit.type === 'Bad' ? 'limit' : 'goal'}: {activeHabit.daily_limit}
                  </span>
                </div>
                <span className="text-[11px] font-label-sm text-outline mt-0.5 truncate">
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
                className="w-8 h-8 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors"
                title="Edit Habit"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button
                onClick={deleteHabit}
                className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-surface-container flex items-center justify-center transition-colors"
                title="Delete Habit"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
              <button
                onClick={() => updateHabitCount(-1)}
                disabled={activeHabit.count_today <= 0}
                className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container disabled:opacity-40 text-on-surface shadow-xs flex items-center justify-center text-label-md font-semibold transition-colors border border-outline-variant/20"
                title="Decrease count"
              >
                −
              </button>
              <button
                onClick={() => updateHabitCount(1)}
                className="h-8 px-space-sm rounded-lg bg-primary text-on-primary shadow-xs hover:bg-primary-container transition-all flex items-center gap-1 text-label-sm font-label-sm active:scale-95"
                title="Log 1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Log 1</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Dynamic Frequency Heatmap Section */}
        <div className="py-2 overflow-x-auto">
          <div className="flex items-center justify-between text-[11px] text-outline mb-2">
            <span className="font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">grid_view</span>
              <span>12-Week Daily Frequency Heatmap</span>
              {activeHabit && <span className="text-on-surface font-semibold">({activeHabit.title})</span>}
            </span>
            <span>Hover cell for date details</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Weekday indicators */}
            <div className="flex flex-col justify-between text-[10px] text-outline font-mono h-[112px] py-1 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* 7 rows x 12 columns grid */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 p-2 rounded-xl bg-surface-container-low/40 border border-outline-variant/20">
              {heatmapData.map((day) => {
                const cellColor = getCellColor(day.count, isGoodHabit);
                return (
                  <div
                    key={day.date}
                    title={`${day.formattedDate}: ${day.count} ${day.count === 1 ? 'log' : 'logs'}${day.isToday ? ' (Today)' : ''}`}
                    className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer ${cellColor} ${
                      day.isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-surface-container-lowest' : ''
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Dynamic Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-space-xs font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/15 mt-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-outline">
          <span className="text-secondary font-medium">
            {habits.length > 0 ? `${habits.length} tracked habit${habits.length !== 1 ? 's' : ''}` : 'No habits yet'}
          </span>
          <span>·</span>
          <span>Synced with cloud Supabase</span>
        </div>

        {/* Dynamic Theme-Synchronized Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-outline self-end sm:self-auto">
          <span>Less</span>
          <span
            className="w-3 h-3 rounded-sm bg-surface-container-high/30 border border-outline-variant/15"
            title="0 logs"
          />
          <span
            className={`w-3 h-3 rounded-sm border ${
              isGoodHabit ? 'bg-primary/30 border-primary/40' : 'bg-amber-500/35 border-amber-500/50'
            }`}
            title="1 log"
          />
          <span
            className={`w-3 h-3 rounded-sm border ${
              isGoodHabit ? 'bg-primary/55 border-primary/60' : 'bg-amber-500/65 border-amber-500/80'
            }`}
            title="2 logs"
          />
          <span
            className={`w-3 h-3 rounded-sm border ${
              isGoodHabit ? 'bg-primary/80 border-primary/85' : 'bg-rose-500/70 border-rose-500/85'
            }`}
            title="3 logs"
          />
          <span
            className={`w-3 h-3 rounded-sm border ${
              isGoodHabit ? 'bg-primary border-primary' : 'bg-rose-500 border-rose-500'
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

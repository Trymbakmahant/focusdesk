"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Habit = {
  id: string;
  title: string;
  icon: string;
  type: 'Good' | 'Bad';
  count_today: number;
  daily_limit: number;
};

const initialHabits: Habit[] = [
  { id: '1', title: 'Cigarettes (Harm Red.)', icon: '🚬', type: 'Bad', count_today: 3, daily_limit: 4 },
  { id: '2', title: 'Gym Workout', icon: '💪', type: 'Good', count_today: 0, daily_limit: 1 },
  { id: '3', title: 'GitHub Code', icon: '💻', type: 'Good', count_today: 1, daily_limit: 1 },
  { id: '4', title: 'Meditation', icon: '🧘', type: 'Good', count_today: 0, daily_limit: 1 },
];

export default function HabitActivity() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [activeHabitId, setActiveHabitId] = useState<string>('1');
  const [polarity, setPolarity] = useState<'Good' | 'Bad'>('Bad');

  useEffect(() => {
    async function fetchHabits() {
      if (!supabase) return;
      const { data, error } = await supabase.from('habits').select('*');
      if (!error && data && data.length > 0) {
        setHabits(data);
        if (data.length > 0) {
          setActiveHabitId(data[0].id);
          setPolarity(data[0].type);
        }
      }
    }
    fetchHabits();
  }, []);

  const activeHabit = habits.find(h => h.id === activeHabitId) || habits[0];

  const togglePolarity = () => {
    setPolarity(prev => prev === 'Good' ? 'Bad' : 'Good');
  };

  const updateHabitCount = async (increment: number) => {
    if (!activeHabit) return;
    const newCount = Math.max(0, activeHabit.count_today + increment);
    setHabits(habits.map(h => h.id === activeHabit.id ? { ...h, count_today: newCount } : h));
    
    if (supabase) {
      await supabase.from('habits').update({ count_today: newCount }).eq('id', activeHabit.id);
    }
  };

  const addHabit = async () => {
    const title = prompt("Enter habit title:");
    if (!title) return;
    const icon = prompt("Enter an emoji icon:") || "✨";
    const limit = parseInt(prompt("Enter daily goal/limit number:") || "1", 10);
    
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title,
      icon,
      type: polarity,
      count_today: 0,
      daily_limit: isNaN(limit) ? 1 : limit
    };
    
    setHabits([...habits, newHabit]);
    setActiveHabitId(newHabit.id);
    
    if (supabase) {
      await supabase.from('habits').insert([newHabit]);
    }
  };

  const editHabit = async () => {
    if (!activeHabit) return;
    const newTitle = prompt("Edit habit title:", activeHabit.title);
    if (!newTitle) return;
    const newIcon = prompt("Edit emoji icon:", activeHabit.icon) || activeHabit.icon;
    const limit = parseInt(prompt("Edit daily goal/limit number:", activeHabit.daily_limit.toString()) || activeHabit.daily_limit.toString(), 10);

    setHabits(habits.map(h => h.id === activeHabit.id ? { ...h, title: newTitle, icon: newIcon, daily_limit: isNaN(limit) ? h.daily_limit : limit } : h));
    
    if (supabase) {
      await supabase.from('habits').update({ title: newTitle, icon: newIcon, daily_limit: isNaN(limit) ? activeHabit.daily_limit : limit }).eq('id', activeHabit.id);
    }
  };

  const deleteHabit = async () => {
    if (!activeHabit) return;
    if (!confirm(`Are you sure you want to delete ${activeHabit.title}?`)) return;

    const filtered = habits.filter(h => h.id !== activeHabit.id);
    setHabits(filtered);
    if (filtered.length > 0) {
      setActiveHabitId(filtered[0].id);
      setPolarity(filtered[0].type);
    }
    
    if (supabase) {
      await supabase.from('habits').delete().eq('id', activeHabit.id);
    }
  };

  return (
    <div className="md:col-span-7 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex flex-col gap-space-sm pb-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">vital_signs</span>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Habits &amp; Activity</h2>
                <span className="font-label-sm text-label-sm text-outline">Tracker</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${polarity === 'Bad' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                <span className="material-symbols-outlined text-[14px]">{polarity === 'Bad' ? 'trending_down' : 'trending_up'}</span>
                <span>{polarity === 'Bad' ? 'Reduce Bad Habit' : 'Build Good Habit'}</span>
              </div>
              <button className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low overflow-x-auto">
              {habits.map(habit => (
                <button 
                  key={habit.id}
                  onClick={() => { setActiveHabitId(habit.id); setPolarity(habit.type); }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-label-sm text-label-sm whitespace-nowrap ${activeHabitId === habit.id ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <span>{habit.icon}</span>
                  <span>{habit.title}</span>
                </button>
              ))}
              <button onClick={addHabit} className="px-2.5 py-1 rounded-lg text-outline hover:text-primary flex items-center gap-1 font-label-sm text-label-sm whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>New</span>
              </button>
            </div>
            <button onClick={togglePolarity} className="h-7 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-[11px] font-label-sm flex items-center gap-1 shrink-0 transition-colors" title="Toggle between Build Good Habit and Reduce Harm Habit">
              <span className="material-symbols-outlined text-[14px] text-primary">swap_horiz</span>
              <span>Polarity</span>
            </button>
          </div>
        </div>
        
        {activeHabit ? (
          <div className="p-space-sm rounded-xl bg-surface-container-low/70 flex items-center justify-between gap-space-md mb-space-sm">
            <div className="flex items-center gap-space-md min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-[20px] shadow-xs shrink-0 cursor-pointer" onClick={editHabit} title="Edit Habit">
                {activeHabit.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1.5 cursor-pointer" onClick={editHabit} title="Edit Habit">
                  <span className="font-display-lg text-[28px] leading-none text-on-surface font-semibold">{activeHabit.count_today}</span>
                  <span className="text-body-sm text-on-surface-variant">{polarity === 'Bad' ? 'logged today' : 'completed today'}</span>
                  <span className="text-outline">·</span>
                  <span className="font-label-sm text-label-sm text-secondary">Daily {polarity === 'Bad' ? 'limit' : 'goal'}: {activeHabit.daily_limit}</span>
                </div>
                <span className="text-[11px] font-label-sm text-outline mt-0.5 truncate">{polarity === 'Bad' ? `Harm reduction goal: 0/day · Clean window: 4h 15m` : `Consistency streak: 3 days`}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={deleteHabit} className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-surface-container flex items-center justify-center text-label-md font-semibold transition-colors" title="Delete Habit">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
              <button onClick={() => updateHabitCount(-1)} className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-xs flex items-center justify-center text-label-md font-semibold transition-colors">
                −
              </button>
              <button onClick={() => updateHabitCount(1)} className="h-8 px-space-sm rounded-lg bg-primary text-on-primary shadow-xs hover:bg-primary-container transition-all flex items-center gap-1 text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Log 1</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-space-sm rounded-xl bg-surface-container-low/70 flex items-center justify-center text-outline mb-space-sm h-[88px]">
            No habits created yet. Click "New" to create one.
          </div>
        )}

        <div className="py-space-xs overflow-x-auto">
          <div className="flex items-center justify-between text-[11px] text-outline mb-1.5">
            <span>Daily Frequency Heatmap (Last 12 Weeks)</span>
            <span>Intensity: Low to High</span>
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
            {/* Keeping visual placeholder grid for aesthetics without over-complicating state */}
            <div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#EAF7FF]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div>
            <div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#0284C7]"></div><div className="w-3.5 h-3.5 rounded bg-[#38BDF8]"></div><div className="w-3.5 h-3.5 rounded bg-[#7DD3FC]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div><div className="w-3.5 h-3.5 rounded bg-[#BAE6FD]"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="text-secondary font-label-md">📉 -42% weekly reduction</span>
          <span className="text-outline">·</span>
          <span>Under daily quota for <strong className="text-primary font-semibold">6 days</strong></span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-outline">
          <span>0 logs</span>
          <span className="w-2.5 h-2.5 rounded bg-[#EAF7FF]"></span>
          <span className="w-2.5 h-2.5 rounded bg-[#7DD3FC]"></span>
          <span className="w-2.5 h-2.5 rounded bg-[#0284C7]"></span>
          <span>4+ logs</span>
        </div>
      </div>
    </div>
  );
}

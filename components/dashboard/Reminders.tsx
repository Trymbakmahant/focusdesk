"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Reminder = {
  id: string;
  title: string;
  time: string;
  completed: boolean;
};

const initialReminders: Reminder[] = [
  { id: '1', title: 'Submit hackathon project', time: 'Today · 8:00 PM', completed: false },
  { id: '2', title: 'Hydration check', time: 'Hourly interval', completed: false },
];

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);

  useEffect(() => {
    async function fetchReminders() {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setReminders(data);
      }
    }
    fetchReminders();
  }, [user]);

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !currentStatus } : r));
    if (supabase && user) {
      await supabase.from('reminders').update({ completed: !currentStatus }).eq('id', id).eq('user_id', user.id);
    }
  };

  const addReminder = async () => {
    const title = prompt("Enter reminder title:");
    if (!title) return;
    const time = prompt("Enter time/interval:") || "No time specified";
    
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title,
      time,
      completed: false
    };
    
    setReminders([...reminders, newReminder]);
    
    if (supabase && user) {
      await supabase.from('reminders').insert([{ ...newReminder, user_id: user.id }]);
    }
  };

  const editReminder = async (id: string, currentTitle: string, currentTime: string) => {
    const newTitle = prompt("Edit reminder title:", currentTitle);
    if (!newTitle) return;
    const newTime = prompt("Edit time/interval:", currentTime) || currentTime;

    setReminders(reminders.map(r => r.id === id ? { ...r, title: newTitle, time: newTime } : r));
    
    if (supabase) {
      await supabase.from('reminders').update({ title: newTitle, time: newTime }).eq('id', id);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    setReminders(reminders.filter(r => r.id !== id));
    
    if (supabase) {
      await supabase.from('reminders').delete().eq('id', id);
    }
  };

  const activeCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="apple-glass apple-card-hover md:col-span-5 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden transition-all">
      {/* Ambient Apple Reminders glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF9500]/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[19px]">notifications_active</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1D1D1F] tracking-tight">Reminders</h2>
              <span className="text-[11px] font-semibold text-[#86868B] px-2 py-0.5 rounded-full bg-black/[0.04]">Alerts</span>
            </div>
          </div>
          <button
            onClick={addReminder}
            className="w-7 h-7 rounded-full text-[#86868B] hover:text-[#007AFF] hover:bg-black/5 flex items-center justify-center transition-colors"
            title="Add Reminder"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-0.5">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all group border ${
                reminder.completed
                  ? 'bg-white/30 border-black/[0.03] opacity-60'
                  : 'bg-white/60 hover:bg-white/80 border-white/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Apple Reminders circular checkbox ring */}
              <button
                onClick={() => toggleReminder(reminder.id, reminder.completed)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  reminder.completed
                    ? 'border-[#007AFF] bg-[#007AFF] text-white'
                    : 'border-[#C7C7CC] hover:border-[#007AFF] bg-white'
                }`}
                title={reminder.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {reminder.completed && (
                  <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                )}
              </button>

              <div className="flex flex-col flex-1 min-w-0">
                <span
                  className={`text-xs font-medium truncate ${
                    reminder.completed ? 'line-through text-[#86868B]' : 'text-[#1D1D1F]'
                  }`}
                >
                  {reminder.title}
                </span>
                <span className="text-[11px] text-[#86868B] font-medium">{reminder.time}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => editReminder(reminder.id, reminder.title, reminder.time)}
                  className="w-6 h-6 rounded-full text-[#86868B] hover:text-[#007AFF] hover:bg-black/5 flex items-center justify-center transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="w-6 h-6 rounded-full text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center justify-center transition-colors"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-[#86868B] border-t border-black/5 mt-3 font-medium">
        <span className="text-[11px]">{activeCount} active reminder{activeCount !== 1 ? 's' : ''}</span>
        <button
          onClick={addReminder}
          className="text-[#007AFF] hover:text-[#0071EB] font-semibold flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          <span>New Reminder</span>
        </button>
      </div>
    </div>
  );
}

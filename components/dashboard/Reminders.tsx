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
    <div className="md:col-span-5 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Reminders</h2>
          </div>
          <button className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div className="flex flex-col gap-space-sm max-h-64 overflow-y-auto">
          {reminders.map(reminder => (
            <div key={reminder.id} className={`flex items-start gap-space-sm p-space-sm rounded-xl transition-all group ${reminder.completed ? 'bg-surface-container-low/40 opacity-50' : 'bg-surface-container-low/70'}`}>
              <span className="text-primary text-[18px] shrink-0">🔔</span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`font-label-md text-label-md truncate ${reminder.completed ? 'line-through text-outline' : 'text-on-surface'}`}>{reminder.title}</span>
                <span className="font-body-sm text-body-sm text-outline">{reminder.time}</span>
              </div>
              
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editReminder(reminder.id, reminder.title, reminder.time)} className="text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button onClick={() => deleteReminder(reminder.id)} className="text-outline hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>

              <button onClick={() => toggleReminder(reminder.id, reminder.completed)} className={`hover:text-primary shrink-0 ml-1 ${reminder.completed ? 'text-primary' : 'text-outline'}`}>
                <span className="material-symbols-outlined text-[18px]">done</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-space-md flex items-center justify-between text-label-sm font-label-sm mt-4">
        <span className="text-outline">{activeCount} active trigger{activeCount !== 1 ? 's' : ''}</span>
        <button onClick={addReminder} className="text-primary hover:underline">+ New Reminder</button>
      </div>
    </div>
  );
}

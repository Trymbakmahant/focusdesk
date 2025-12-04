"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
};

const initialTasks: Task[] = [
  { id: '1', title: 'Finish FocusDeck UI dashboard', completed: true, priority: 'Done' },
  { id: '2', title: 'Review Rust Tauri backend code', completed: true, priority: 'Done' },
  { id: '3', title: 'Push GitHub commit to main', completed: false, priority: 'High' },
  { id: '4', title: 'Read 20 pages of Systems Architecture', completed: false, priority: 'Focus' },
  { id: '5', title: 'Refactor SQLite local migrations', completed: false, priority: 'Code' },
];

export default function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    async function fetchTasks() {
      if (!supabase) return;
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setTasks(data);
      }
    }
    fetchTasks();
  }, []);

  const toggleTask = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus, priority: !currentStatus ? 'Done' : 'High' } : t));
    if (supabase) {
      await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
    }
  };

  const addTask = async () => {
    const title = prompt("Enter new task:");
    if (!title) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority: 'New'
    };
    
    setTasks([...tasks, newTask]);
    
    if (supabase) {
      await supabase.from('tasks').insert([newTask]);
    }
  };

  const editTask = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Edit task title:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    setTasks(tasks.map(t => t.id === id ? { ...t, title: newTitle } : t));
    
    if (supabase) {
      await supabase.from('tasks').update({ title: newTitle }).eq('id', id);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setTasks(tasks.filter(t => t.id !== id));
    
    if (supabase) {
      await supabase.from('tasks').delete().eq('id', id);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  return (
    <div className="md:col-span-5 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Today's Tasks</h2>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="text-label-sm font-label-sm text-outline">{completedCount} of {totalCount}</span>
            <button className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-container mb-space-md">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="flex flex-col gap-space-xs max-h-64 overflow-y-auto pr-1">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-space-xs rounded-xl hover:bg-surface-container-low transition-colors group"
            >
              <div 
                className="flex items-center gap-space-sm min-w-0 cursor-pointer flex-1"
                onClick={() => toggleTask(task.id, task.completed)}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${task.completed ? 'bg-primary text-on-primary' : 'bg-surface-container-high group-hover:bg-primary-fixed text-transparent'}`}>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <span className={`font-body-md text-body-md truncate ${task.completed ? 'line-through text-outline' : 'text-on-surface'}`}>
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editTask(task.id, task.title)} className="text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button onClick={() => deleteTask(task.id)} className="text-outline hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
              <span className={`ml-2 font-label-sm text-label-sm group-hover:hidden ${task.completed ? 'text-outline' : task.priority === 'High' ? 'px-2 py-0.5 rounded-md bg-error-container text-on-error-container' : 'text-on-surface-variant'}`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-space-md flex items-center justify-between mt-4">
        <button onClick={addTask} className="flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-label-md">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>New task</span>
        </button>
        <span className="font-code-kbd text-code-kbd text-outline">⌘T</span>
      </div>
    </div>
  );
}

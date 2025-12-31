"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TaskItem,
  BadgeItem,
  ImportanceLevel,
  IMPORTANCE_WEIGHTS,
  INITIAL_BADGE_BOX,
  PRESET_BADGE_COLORS,
} from '@/types/task';

const TASKS_STORAGE_KEY = 'focusdeck_tasks_v2';
const BADGE_BOX_STORAGE_KEY = 'focusdeck_badge_box_v1';

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialDefaultTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Deploy FocusDeck desktop production build',
    completed: false,
    importance: 'Urgent',
    badge: 'Code',
    dueDate: getTodayString(),
    createdAt: '2025-12-30T10:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Refactor SQLite database migrations',
    completed: false,
    importance: 'High',
    badge: 'Code',
    dueDate: getTodayString(),
    createdAt: '2025-12-30T09:30:00Z',
  },
  {
    id: 'task-3',
    title: 'Design high-contrast badge color tokens',
    completed: false,
    importance: 'Medium',
    badge: 'Design',
    dueDate: getTodayString(),
    createdAt: '2025-12-30T09:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Read 20 pages of Systems Architecture',
    completed: false,
    importance: 'Low',
    badge: 'Focus',
    dueDate: getTodayString(),
    createdAt: '2025-12-30T08:30:00Z',
  },
  {
    id: 'task-5',
    title: 'Finish FocusDeck UI layout & responsive shell',
    completed: true,
    importance: 'High',
    badge: 'Work',
    dueDate: getTodayString(),
    createdAt: '2025-12-30T08:00:00Z',
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [badgeBox, setBadgeBox] = useState<BadgeItem[]>(INITIAL_BADGE_BOX);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage or fallback
  useEffect(() => {
    try {
      // 1. Load Badge Box
      const savedBadges = localStorage.getItem(BADGE_BOX_STORAGE_KEY);
      if (savedBadges) {
        const parsed = JSON.parse(savedBadges);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBadgeBox(parsed);
        }
      }

      // 2. Load Tasks
      const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        } else {
          setTasks(initialDefaultTasks);
        }
      } else {
        setTasks(initialDefaultTasks);
      }
    } catch {
      setTasks(initialDefaultTasks);
    }

    // 3. Sync with Supabase if configured
    async function syncSupabase() {
      if (!supabase) {
        setIsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const formatted: TaskItem[] = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            completed: Boolean(t.completed),
            importance: (t.importance as ImportanceLevel) || 'Medium',
            badge: t.badge || undefined,
            dueDate: t.due_date || getTodayString(),
            createdAt: t.created_at || new Date().toISOString(),
          }));
          setTasks(formatted);
        }
      } catch (err) {
        console.warn('Supabase sync skipped, using local data:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    syncSupabase();
  }, []);

  // Save to localStorage whenever badgeBox changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(BADGE_BOX_STORAGE_KEY, JSON.stringify(badgeBox));
    } catch (err) {
      console.error('Failed to persist badge box:', err);
    }
  }, [badgeBox, isLoaded]);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to persist tasks:', err);
    }
  }, [tasks, isLoaded]);

  // Sort tasks: Active first by Importance (Urgent -> High -> Medium -> Low), then Completed
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // 1. Incomplete tasks before completed tasks
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // 2. Sort by Importance weight descending (Urgent = 4, Low = 1)
      const weightA = IMPORTANCE_WEIGHTS[a.importance] || 2;
      const weightB = IMPORTANCE_WEIGHTS[b.importance] || 2;
      if (weightA !== weightB) {
        return weightB - weightA;
      }

      // 3. Sort by Due Date ascending
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      // 4. Sort by Created Date descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  // Add a task
  const addTask = useCallback(
    async (taskData: {
      title: string;
      importance: ImportanceLevel;
      badge?: string;
      dueDate?: string;
    }) => {
      const newTask: TaskItem = {
        id: crypto.randomUUID(),
        title: taskData.title.trim(),
        completed: false,
        importance: taskData.importance,
        badge: taskData.badge || undefined,
        dueDate: taskData.dueDate || getTodayString(),
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);

      if (supabase) {
        try {
          await supabase.from('tasks').insert([
            {
              id: newTask.id,
              title: newTask.title,
              completed: false,
              importance: newTask.importance,
              badge: newTask.badge,
              due_date: newTask.dueDate,
              created_at: newTask.createdAt,
            },
          ]);
        } catch (err) {
          console.warn('Supabase task insert error:', err);
        }
      }

      return newTask;
    },
    []
  );

  // Update a task
  const updateTask = useCallback(
    async (id: string, updates: Partial<TaskItem>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      if (supabase) {
        try {
          const supabaseUpdates: Record<string, any> = {};
          if (updates.title !== undefined) supabaseUpdates.title = updates.title;
          if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
          if (updates.importance !== undefined) supabaseUpdates.importance = updates.importance;
          if (updates.badge !== undefined) supabaseUpdates.badge = updates.badge;
          if (updates.dueDate !== undefined) supabaseUpdates.due_date = updates.dueDate;

          await supabase.from('tasks').update(supabaseUpdates).eq('id', id);
        } catch (err) {
          console.warn('Supabase task update error:', err);
        }
      }
    },
    []
  );

  // Toggle completion status
  const toggleTask = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      const newCompleted = !target.completed;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
      );

      if (supabase) {
        try {
          await supabase
            .from('tasks')
            .update({ completed: newCompleted })
            .eq('id', id);
        } catch (err) {
          console.warn('Supabase task toggle error:', err);
        }
      }
    },
    [tasks]
  );

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (supabase) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase task delete error:', err);
      }
    }
  }, []);

  // Add badge to Badge Box
  const addBadge = useCallback(
    (name: string, colorPresetIndex = 0): BadgeItem => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Badge name cannot be empty');

      // Check if already in box
      const existing = badgeBox.find(
        (b) => b.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      const preset = PRESET_BADGE_COLORS[colorPresetIndex % PRESET_BADGE_COLORS.length];
      const newBadge: BadgeItem = {
        id: `badge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        color: preset.color,
        textColor: preset.textColor,
        borderColor: preset.borderColor,
      };

      setBadgeBox((prev) => [...prev, newBadge]);
      return newBadge;
    },
    [badgeBox]
  );

  // Remove badge from Badge Box
  const deleteBadge = useCallback((id: string) => {
    setBadgeBox((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    tasks: sortedTasks,
    rawTasks: tasks,
    badgeBox,
    isLoaded,
    todayString: getTodayString(),
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addBadge,
    deleteBadge,
  };
}

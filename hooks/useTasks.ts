"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  TaskItem,
  BadgeItem,
  ImportanceLevel,
  IMPORTANCE_WEIGHTS,
  INITIAL_BADGE_BOX,
  PRESET_BADGE_COLORS,
} from '@/types/task';

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [badgeBox, setBadgeBox] = useState<BadgeItem[]>(INITIAL_BADGE_BOX);
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage keys scoped to authenticated user
  const tasksKey = useMemo(() => {
    return user ? `focusdeck_tasks_${user.id}` : 'focusdeck_tasks_guest';
  }, [user]);

  const badgeBoxKey = useMemo(() => {
    return user ? `focusdeck_badge_box_${user.id}` : 'focusdeck_badge_box_guest';
  }, [user]);

  // Load user data whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setIsLoaded(true);
      return;
    }

    try {
      // 1. Load User's Badge Box from local cache
      const savedBadges = localStorage.getItem(badgeBoxKey);
      if (savedBadges) {
        const parsed = JSON.parse(savedBadges);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBadgeBox(parsed);
        } else {
          setBadgeBox(INITIAL_BADGE_BOX);
        }
      } else {
        setBadgeBox(INITIAL_BADGE_BOX);
      }

      // 2. Load User's Tasks from local cache
      const savedTasks = localStorage.getItem(tasksKey);
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      }
    } catch {
      // Fallback
    }

    // 3. Fetch from Supabase for this specific user
    async function syncSupabase() {
      if (!supabase || !user) {
        setIsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
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
          localStorage.setItem(tasksKey, JSON.stringify(formatted));
        }
      } catch (err) {
        console.warn('Supabase sync error:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    syncSupabase();
  }, [user, tasksKey, badgeBoxKey]);

  // Save to localStorage whenever badgeBox changes
  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      localStorage.setItem(badgeBoxKey, JSON.stringify(badgeBox));
    } catch (err) {
      console.error('Failed to persist badge box:', err);
    }
  }, [badgeBox, isLoaded, user, badgeBoxKey]);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      localStorage.setItem(tasksKey, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to persist tasks:', err);
    }
  }, [tasks, isLoaded, user, tasksKey]);

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

  // Add a task scoped to current user
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

      if (supabase && user) {
        try {
          await supabase.from('tasks').insert([
            {
              id: newTask.id,
              user_id: user.id,
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
    [user]
  );

  // Update a task
  const updateTask = useCallback(
    async (id: string, updates: Partial<TaskItem>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      if (supabase && user) {
        try {
          const supabaseUpdates: Record<string, any> = {};
          if (updates.title !== undefined) supabaseUpdates.title = updates.title;
          if (updates.completed !== undefined) supabaseUpdates.completed = updates.completed;
          if (updates.importance !== undefined) supabaseUpdates.importance = updates.importance;
          if (updates.badge !== undefined) supabaseUpdates.badge = updates.badge;
          if (updates.dueDate !== undefined) supabaseUpdates.due_date = updates.dueDate;

          await supabase
            .from('tasks')
            .update(supabaseUpdates)
            .eq('id', id)
            .eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase task update error:', err);
        }
      }
    },
    [user]
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

      if (supabase && user) {
        try {
          await supabase
            .from('tasks')
            .update({ completed: newCompleted })
            .eq('id', id)
            .eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase task toggle error:', err);
        }
      }
    },
    [tasks, user]
  );

  // Delete a task
  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));

      if (supabase && user) {
        try {
          await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        } catch (err) {
          console.warn('Supabase task delete error:', err);
        }
      }
    },
    [user]
  );

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

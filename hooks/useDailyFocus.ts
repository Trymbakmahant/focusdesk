"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useFocusStats } from '@/hooks/useFocusStats';
import { DailyFocusIntention, FocusCategory } from '@/types/focus';

const DAILY_FOCUS_UPDATE_EVENT = 'focusdeck-daily-focus-update';

function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useDailyFocus() {
  const { user } = useAuth();
  const { todayMinutes, targetMinutes, completedSessions } = useFocusStats();

  const todayIso = useMemo(() => getTodayIso(), []);

  const storageKey = useMemo(() => {
    return user
      ? `focusdeck_daily_focus_${user.id}_${todayIso}`
      : `focusdeck_daily_focus_guest_${todayIso}`;
  }, [user, todayIso]);

  const [focusIntention, setFocusIntention] = useState<string>('Ship Core FocusDeck Architecture');
  const [category, setCategory] = useState<FocusCategory | string>('Deep Work');
  const [workdayHours, setWorkdayHours] = useState<number>(8.0); // Standard 8-hour workday benchmark
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [history, setHistory] = useState<DailyFocusIntention[]>([]);

  // 1. Initial load from localStorage (optimistic) and Supabase
  const loadDailyFocus = useCallback(async () => {
    // A. LocalStorage fast read
    try {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.focusIntention !== undefined) setFocusIntention(parsed.focusIntention);
        if (parsed.category !== undefined) setCategory(parsed.category);
        if (parsed.workdayHours !== undefined) setWorkdayHours(Number(parsed.workdayHours));
        if (parsed.updatedAt) setLastSaved(new Date(parsed.updatedAt));
      }
    } catch (err) {
      console.warn('Error reading local daily focus:', err);
    } finally {
      setIsLoaded(true);
    }

    // B. Supabase cloud sync
    if (supabase && user) {
      try {
        // Fetch today's focus row
        const { data, error } = await supabase
          .from('daily_focus')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayIso)
          .maybeSingle();

        if (!error && data) {
          if (data.focus_intention) setFocusIntention(data.focus_intention);
          if (data.category) setCategory(data.category);
          if (data.workday_hours) setWorkdayHours(Number(data.workday_hours));
          if (data.updated_at) setLastSaved(new Date(data.updated_at));

          // Cache fresh data to localStorage
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              focusIntention: data.focus_intention,
              category: data.category,
              workdayHours: data.workday_hours,
              updatedAt: data.updated_at,
            })
          );
        }

        // Fetch past 7 days for analysis
        const { data: historyData } = await supabase
          .from('daily_focus')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(7);

        if (historyData && historyData.length > 0) {
          const mappedHistory: DailyFocusIntention[] = historyData.map((row) => ({
            id: row.id,
            userId: row.user_id,
            date: row.date,
            focusIntention: row.focus_intention,
            category: row.category,
            workdayHours: Number(row.workday_hours || 8),
            targetMinutes: Number(row.target_minutes || 240),
            actualMinutes: Number(row.actual_minutes || 0),
            completedSessions: Number(row.completed_sessions || 0),
            updatedAt: row.updated_at,
          }));
          setHistory(mappedHistory);
        }
      } catch (cloudErr) {
        console.warn('Supabase daily focus fetch error:', cloudErr);
      }
    }
  }, [storageKey, supabase, user, todayIso]);

  useEffect(() => {
    loadDailyFocus();

    const handleSync = () => {
      loadDailyFocus();
    };

    window.addEventListener(DAILY_FOCUS_UPDATE_EVENT, handleSync);
    return () => {
      window.removeEventListener(DAILY_FOCUS_UPDATE_EVENT, handleSync);
    };
  }, [loadDailyFocus]);

  // 2. Persist to Supabase and LocalStorage
  const saveDailyFocus = useCallback(
    async (
      newIntention: string,
      newCategory?: FocusCategory | string,
      newWorkdayHours?: number
    ) => {
      const trimmed = newIntention.trim() || 'Deep Work Focus';
      const updatedCategory = newCategory || category;
      const updatedWorkdayHours = newWorkdayHours ?? workdayHours;

      setFocusIntention(trimmed);
      if (newCategory) setCategory(updatedCategory);
      if (newWorkdayHours !== undefined) setWorkdayHours(updatedWorkdayHours);
      setIsSaving(true);

      const now = new Date();
      setLastSaved(now);

      // Local storage cache
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            focusIntention: trimmed,
            category: updatedCategory,
            workdayHours: updatedWorkdayHours,
            updatedAt: now.toISOString(),
          })
        );
      } catch (err) {
        console.error('Failed to save daily focus to local storage:', err);
      }

      // Supabase cloud persistence
      if (supabase && user) {
        try {
          await supabase.from('daily_focus').upsert(
            {
              user_id: user.id,
              date: todayIso,
              focus_intention: trimmed,
              category: updatedCategory,
              workday_hours: updatedWorkdayHours,
              target_minutes: targetMinutes,
              actual_minutes: todayMinutes,
              completed_sessions: completedSessions,
              updated_at: now.toISOString(),
            },
            { onConflict: 'user_id,date' }
          );
        } catch (err) {
          console.warn('Failed to upsert daily focus to Supabase:', err);
        }
      }

      setIsSaving(false);
      window.dispatchEvent(new CustomEvent(DAILY_FOCUS_UPDATE_EVENT));
    },
    [
      category,
      workdayHours,
      storageKey,
      user,
      todayIso,
      targetMinutes,
      todayMinutes,
      completedSessions,
    ]
  );

  // 3. Workday Analysis Calculations
  const workdayMinutes = workdayHours * 60;
  
  // Percent of average workday allocated to deep focus (target)
  const deepWorkAllocationPercent = Math.min(
    100,
    Math.round((targetMinutes / Math.max(1, workdayMinutes)) * 100)
  );

  // Buffer hours left in workday for meetings, async communication & coordination
  const collaborationBufferMinutes = Math.max(0, workdayMinutes - targetMinutes);
  const collaborationBufferHours = (collaborationBufferMinutes / 60).toFixed(1);

  // Actual logged progress relative to the entire workday
  const loggedWorkdayPercent = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, workdayMinutes)) * 100)
  );

  // Qualitative Analysis feedback
  const workdayAnalysis = useMemo(() => {
    if (deepWorkAllocationPercent < 35) {
      return {
        rating: 'Light Focus Load',
        description: 'High availability for meetings, emails, and cross-team collaboration.',
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      };
    }
    if (deepWorkAllocationPercent <= 65) {
      return {
        rating: 'Optimal Deep Work Capacity',
        description: 'Balanced 50/50 ratio: high productivity deep work with healthy meeting buffer.',
        badgeColor: 'bg-primary/10 text-primary border-primary/20',
      };
    }
    return {
      rating: 'High Intensity Sprint',
      description: 'Focus-heavy day with minimal buffer for meetings and ad-hoc communication.',
      badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    };
  }, [deepWorkAllocationPercent]);

  return {
    isLoaded,
    isSaving,
    lastSaved,
    focusIntention,
    category,
    workdayHours,
    targetMinutes,
    todayMinutes,
    workdayMinutes,
    deepWorkAllocationPercent,
    collaborationBufferHours,
    loggedWorkdayPercent,
    workdayAnalysis,
    history,
    saveDailyFocus,
    setWorkdayHours: (hours: number) => saveDailyFocus(focusIntention, category, hours),
    setCategory: (cat: FocusCategory | string) => saveDailyFocus(focusIntention, cat, workdayHours),
  };
}

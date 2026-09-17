"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DailyFocusRecord, FocusGoalSettings } from '@/types/focus';

const FOCUS_UPDATE_EVENT = 'focusdeck-focus-update';

function getIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayIso(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getIsoDate(yesterday);
}

export function useFocusStats() {
  const { user } = useAuth();

  const storageKey = useMemo(() => {
    return user ? `focusdeck_focus_records_${user.id}` : 'focusdeck_focus_records_guest';
  }, [user]);

  const goalKey = useMemo(() => {
    return user ? `focusdeck_focus_goal_${user.id}` : 'focusdeck_focus_goal_guest';
  }, [user]);

  const [records, setRecords] = useState<Record<string, DailyFocusRecord>>({});
  const [goal, setGoal] = useState<FocusGoalSettings>({ dailyTargetMinutes: 300 }); // default 5h (300 min)
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFromStorage = useCallback(() => {
    try {
      const savedRecords = localStorage.getItem(storageKey);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (parsed && typeof parsed === 'object') {
          setRecords(parsed);
        }
      }

      const savedGoal = localStorage.getItem(goalKey);
      if (savedGoal) {
        const parsed = JSON.parse(savedGoal);
        if (parsed?.dailyTargetMinutes) {
          setGoal(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, goalKey]);

  useEffect(() => {
    loadFromStorage();

    const handleSync = () => {
      loadFromStorage();
    };

    window.addEventListener(FOCUS_UPDATE_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(FOCUS_UPDATE_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadFromStorage]);

  const todayKey = getIsoDate();
  const yesterdayKey = getYesterdayIso();

  const todayRecord: DailyFocusRecord = useMemo(() => {
    return records[todayKey] || {
      date: todayKey,
      totalSeconds: 0,
      completedSessions: 0,
      lastSessionSeconds: 0,
    };
  }, [records, todayKey]);

  const yesterdayRecord: DailyFocusRecord = useMemo(() => {
    return records[yesterdayKey] || {
      date: yesterdayKey,
      totalSeconds: 0,
      completedSessions: 0,
    };
  }, [records, yesterdayKey]);

  // Calculations
  const todayMinutes = Math.round(todayRecord.totalSeconds / 60);
  const yesterdayMinutes = Math.round(yesterdayRecord.totalSeconds / 60);
  const targetMinutes = goal.dailyTargetMinutes;

  const progressPercent = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, targetMinutes)) * 100)
  );

  const remainingMinutes = Math.max(0, targetMinutes - todayMinutes);

  const formatHoursMins = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formattedTodayTime = formatHoursMins(todayMinutes);
  const formattedTargetTime = formatHoursMins(targetMinutes);

  const formattedRemainingTime =
    remainingMinutes === 0
      ? 'Daily target achieved!'
      : `${formatHoursMins(remainingMinutes)} remaining`;

  const diffVsYesterdayMinutes = todayMinutes - yesterdayMinutes;

  const formattedDiffVsYesterday = useMemo(() => {
    if (yesterdayMinutes === 0 && todayMinutes > 0) {
      return `+${todayMinutes}m vs yesterday`;
    }
    if (diffVsYesterdayMinutes > 0) {
      return `+${diffVsYesterdayMinutes}m vs yesterday`;
    }
    if (diffVsYesterdayMinutes < 0) {
      return `${diffVsYesterdayMinutes}m vs yesterday`;
    }
    return `Matches yesterday`;
  }, [diffVsYesterdayMinutes, todayMinutes, yesterdayMinutes]);

  // Actions
  const addFocusSeconds = useCallback(
    (secondsToAdd: number) => {
      if (secondsToAdd <= 0) return;

      const current = records[todayKey] || {
        date: todayKey,
        totalSeconds: 0,
        completedSessions: 0,
        lastSessionSeconds: 0,
      };

      const updatedRecord: DailyFocusRecord = {
        date: todayKey,
        totalSeconds: current.totalSeconds + secondsToAdd,
        completedSessions: current.completedSessions + 1,
        lastSessionSeconds: secondsToAdd,
      };

      const newRecords = {
        ...records,
        [todayKey]: updatedRecord,
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(newRecords));
        setRecords(newRecords);
        window.dispatchEvent(new CustomEvent(FOCUS_UPDATE_EVENT));
      } catch (err) {
        console.error('Failed to persist focus records:', err);
      }
    },
    [records, storageKey, todayKey]
  );

  const setDailyTargetMinutes = useCallback(
    (newTargetMinutes: number) => {
      const clamped = Math.max(30, Math.min(1440, newTargetMinutes));
      const newGoal: FocusGoalSettings = { dailyTargetMinutes: clamped };
      try {
        localStorage.setItem(goalKey, JSON.stringify(newGoal));
        setGoal(newGoal);
        window.dispatchEvent(new CustomEvent(FOCUS_UPDATE_EVENT));
      } catch (err) {
        console.error('Failed to persist daily focus target:', err);
      }
    },
    [goalKey]
  );

  const resetTodayFocus = useCallback(() => {
    const updatedRecord: DailyFocusRecord = {
      date: todayKey,
      totalSeconds: 0,
      completedSessions: 0,
      lastSessionSeconds: 0,
    };

    const newRecords = {
      ...records,
      [todayKey]: updatedRecord,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(newRecords));
      setRecords(newRecords);
      window.dispatchEvent(new CustomEvent(FOCUS_UPDATE_EVENT));
    } catch (err) {
      console.error('Failed to reset today focus:', err);
    }
  }, [records, storageKey, todayKey]);

  return {
    isLoaded,
    todayMinutes,
    yesterdayMinutes,
    targetMinutes,
    progressPercent,
    remainingMinutes,
    formattedTodayTime,
    formattedTargetTime,
    formattedRemainingTime,
    diffVsYesterdayMinutes,
    formattedDiffVsYesterday,
    completedSessions: todayRecord.completedSessions,
    lastSessionMinutes: Math.round((todayRecord.lastSessionSeconds || 0) / 60),
    addFocusSeconds,
    setDailyTargetMinutes,
    resetTodayFocus,
  };
}

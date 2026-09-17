"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface HabitFormData {
  title: string;
  icon: string;
  type: 'Good' | 'Bad';
  daily_limit: number;
}

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HabitFormData) => void;
  initialData?: HabitFormData | null;
}

const EMOJI_PRESETS = [
  { emoji: '💪', label: 'Fitness' },
  { emoji: '💧', label: 'Water' },
  { emoji: '📚', label: 'Reading' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '🧘', label: 'Meditation' },
  { emoji: '🏃', label: 'Running' },
  { emoji: '🥗', label: 'Nutrition' },
  { emoji: '🎯', label: 'Focus' },
  { emoji: '⚡', label: 'Energy' },
  { emoji: '☕', label: 'Coffee' },
  { emoji: '🚭', label: 'Harm Red.' },
  { emoji: '🛌', label: 'Sleep' },
];

export default function HabitModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: HabitModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('💪');
  const [type, setType] = useState<'Good' | 'Bad'>('Good');
  const [dailyLimit, setDailyLimit] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setIcon(initialData.icon || '💪');
      setType(initialData.type);
      setDailyLimit(initialData.daily_limit || 1);
    } else {
      setTitle('');
      setIcon('💪');
      setType('Good');
      setDailyLimit(1);
    }
  }, [initialData, isOpen]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      icon: icon.trim() || '✨',
      type,
      daily_limit: Math.max(1, dailyLimit),
    });
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/80 dark:border-white/15 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col gap-5 text-[#1D1D1F] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">
                {initialData ? 'edit' : 'add_circle'}
              </span>
            </div>
            <h2 id="habit-modal-title" className="text-base font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
              {initialData ? 'Edit Habit' : 'New Habit'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 rounded-full text-[#86868B] dark:text-gray-400 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Polarity / Habit Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#86868B] dark:text-gray-400">Habit Goal Type</label>
            <div className="grid grid-cols-2 gap-1.5 apple-segmented-bg p-1 rounded-full">
              <button
                type="button"
                onClick={() => setType('Good')}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Good'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#34C759] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                    : 'text-[#86868B] dark:text-gray-400 hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">trending_up</span>
                <span>Positive Routine</span>
              </button>
              <button
                type="button"
                onClick={() => setType('Bad')}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Bad'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#FF9500] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                    : 'text-[#86868B] dark:text-gray-400 hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">trending_down</span>
                <span>Harm Reduction</span>
              </button>
            </div>
            <span className="text-[11px] text-[#86868B] dark:text-gray-400 font-medium">
              {type === 'Good'
                ? 'Target: Daily positive routine to hit (e.g. 1 workout, 8 glasses water)'
                : 'Target: Harm reduction quota to stay below (e.g. max 2 coffees, limit cigarettes)'}
            </span>
          </div>

          {/* Habit Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-title" className="text-xs font-semibold text-[#86868B] dark:text-gray-400 flex items-center justify-between">
              <span>Habit Title</span>
              <span className="text-[10px] text-[#86868B] dark:text-gray-500">Required</span>
            </label>
            <input
              id="habit-title"
              type="text"
              required
              autoFocus
              placeholder={type === 'Good' ? 'e.g. Daily Gym Workout or Read 20 Pages' : 'e.g. Limit Soda or Screen Time'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-sm transition-all"
            />
          </div>

          {/* Emoji Icon Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#86868B] dark:text-gray-400 flex items-center justify-between">
              <span>Icon / Emoji</span>
              <span className="text-xs text-[#86868B] dark:text-gray-400 font-mono">Current: {icon}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setIcon(item.emoji)}
                  title={item.label}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    icon === item.emoji
                      ? 'bg-white dark:bg-[#2C2C2E] border-[#007AFF] ring-2 ring-[#007AFF]/30 scale-105 shadow-sm'
                      : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/5 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#86868B] dark:text-gray-400">Or enter custom emoji:</span>
              <input
                type="text"
                maxLength={4}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-14 px-2 py-1 text-center text-base rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
              />
            </div>
          </div>

          {/* Daily Goal / Limit Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#86868B] dark:text-gray-400 flex items-center justify-between">
              <span>{type === 'Good' ? 'Daily Target Goal' : 'Daily Quota Limit'}</span>
              <span className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                {dailyLimit} {dailyLimit === 1 ? 'time' : 'times'} / day
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDailyLimit(Math.max(1, dailyLimit - 1))}
                className="w-10 h-10 rounded-full bg-white dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-white font-semibold text-lg flex items-center justify-center shadow-xs transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-white font-semibold text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
              />
              <button
                type="button"
                onClick={() => setDailyLimit(dailyLimit + 1)}
                className="w-10 h-10 rounded-full bg-white dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-white font-semibold text-lg flex items-center justify-center shadow-xs transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#86868B] dark:text-gray-400 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-full bg-[#007AFF] hover:bg-[#0071EB] disabled:opacity-40 text-white text-xs font-semibold shadow-[0_2px_8px_rgba(0,122,255,0.25)] transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {initialData ? 'save' : 'add'}
              </span>
              <span>{initialData ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

"use client";

import React, { useState, useEffect } from 'react';

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
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('💪');
  const [type, setType] = useState<'Good' | 'Bad'>('Good');
  const [dailyLimit, setDailyLimit] = useState(1);

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

  if (!isOpen) return null;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-5 text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              {initialData ? 'edit' : 'add_circle'}
            </span>
            <h2 id="habit-modal-title" className="font-headline-sm text-lg font-semibold text-on-surface">
              {initialData ? 'Edit Habit' : 'Create New Habit'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Polarity / Habit Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-on-surface-variant">Habit Goal Type</label>
            <div className="grid grid-cols-2 gap-2 bg-surface-container/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('Good')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Good'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Build Good Habit</span>
              </button>
              <button
                type="button"
                onClick={() => setType('Bad')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Bad'
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">trending_down</span>
                <span>Reduce Bad Habit</span>
              </button>
            </div>
            <span className="text-[11px] text-outline">
              {type === 'Good'
                ? 'Target: Daily positive routine to hit (e.g. 1 workout, 8 glasses water)'
                : 'Target: Harm reduction quota to stay below (e.g. max 2 coffees, limit cigarettes)'}
            </span>
          </div>

          {/* Habit Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-title" className="text-body-sm font-medium text-on-surface-variant flex items-center justify-between">
              <span>Habit Title</span>
              <span className="text-xs text-outline">Required</span>
            </label>
            <input
              id="habit-title"
              type="text"
              required
              autoFocus
              placeholder={type === 'Good' ? 'e.g. Daily Gym Workout or Read 20 Pages' : 'e.g. Limit Soda or Screen Time'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-sm transition-all"
            />
          </div>

          {/* Emoji Icon Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-body-sm font-medium text-on-surface-variant flex items-center justify-between">
              <span>Icon / Emoji</span>
              <span className="text-xs text-outline font-mono">Current: {icon}</span>
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
                      ? 'bg-surface-container-high border-primary ring-2 ring-primary scale-110 shadow-sm'
                      : 'bg-surface-container/60 border-outline-variant/20 hover:bg-surface-container hover:scale-105'
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-outline">Or enter custom emoji:</span>
              <input
                type="text"
                maxLength={4}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-14 px-2 py-1 text-center text-base rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Daily Goal / Limit Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-on-surface-variant flex items-center justify-between">
              <span>{type === 'Good' ? 'Daily Target Goal' : 'Daily Quota Limit'}</span>
              <span className="text-xs font-mono text-primary font-semibold">
                {dailyLimit} {dailyLimit === 1 ? 'time' : 'times'} / day
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDailyLimit(Math.max(1, dailyLimit - 1))}
                className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold text-lg flex items-center justify-center transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-lg focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setDailyLimit(dailyLimit + 1)}
                className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold text-lg flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/20 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-xs font-medium shadow-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {initialData ? 'save' : 'add'}
              </span>
              <span>{initialData ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

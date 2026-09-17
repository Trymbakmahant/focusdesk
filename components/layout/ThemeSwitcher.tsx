"use client";

import React from 'react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function ThemeSwitcher({ compact = false, className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'light_mode' },
    { mode: 'dark', label: 'Dark', icon: 'dark_mode' },
    { mode: 'system', label: 'Auto', icon: 'brightness_auto' },
  ];

  if (compact) {
    return (
      <div
        role="radiogroup"
        aria-label="Theme mode switcher"
        className={`apple-segmented-bg p-0.5 rounded-full flex items-center border border-black/5 dark:border-white/10 ${className}`}
      >
        {options.map((opt) => {
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(opt.mode)}
              title={`${opt.label} Appearance (${opt.mode === 'system' ? 'System Sync' : opt.mode})`}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#0A84FF] shadow-[0_1px_3px_rgba(0,0,0,0.14)] scale-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{opt.icon}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance Mode"
      className={`apple-segmented-bg p-1 rounded-xl grid grid-cols-3 gap-1 border border-black/5 dark:border-white/10 w-full ${className}`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.mode)}
            className={`py-1 px-1 rounded-lg flex items-center justify-center gap-1 text-[11px] transition-all min-w-0 ${
              isActive
                ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#0A84FF] shadow-[0_1px_3px_rgba(0,0,0,0.14)] font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] shrink-0">{opt.icon}</span>
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

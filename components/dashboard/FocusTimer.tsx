"use client";

import React, { useState, useEffect } from 'react';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
const MODE_TIMES = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

export default function FocusTimer() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.pomodoro);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play sound or notification here
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="md:col-span-4 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Focus Timer</h2>
          </div>
          <button className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low">
          <button onClick={() => changeMode('pomodoro')} className={`flex-1 py-1 rounded-lg text-center font-label-sm text-label-sm ${mode === 'pomodoro' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>Pomodoro (25m)</button>
          <button onClick={() => changeMode('shortBreak')} className={`flex-1 py-1 rounded-lg text-center font-label-sm text-label-sm ${mode === 'shortBreak' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>Short (5m)</button>
          <button onClick={() => changeMode('longBreak')} className={`flex-1 py-1 rounded-lg text-center font-label-sm text-label-sm ${mode === 'longBreak' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>Long (15m)</button>
        </div>
        <div className="my-space-md text-center flex flex-col items-center justify-center py-space-sm bg-surface-container-low/50 rounded-2xl">
          <span className="font-display-lg text-[44px] leading-none tracking-tight text-on-surface font-semibold">{formatTime(timeLeft)}</span>
          <span className="font-label-sm text-label-sm text-primary mt-2 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full bg-primary ${isActive ? 'animate-pulse' : ''}`}></span>
            {isActive ? 'Flow State Active' : 'Paused'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <button onClick={toggleTimer} className="flex-1 h-9 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-xs hover:bg-primary-container transition-all flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[18px]">{isActive ? 'pause' : 'play_arrow'}</span>
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>
        <button onClick={resetTimer} className="h-9 px-space-md rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

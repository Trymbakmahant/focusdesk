"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'custom';

const MODE_TIMES = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function FocusTimer() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.pomodoro);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize Alarm Chime via Web Audio API (zero asset dependencies, reliable across browsers)
  const playAlarmSound = useCallback(() => {
    if (isMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Play a harmonic ringing bell chime
      const scheduleChime = (freq: number, startTime: number, duration: number, peakGain = 0.3) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Staccato alarm sequence (Chime 1: A-Major chord)
      scheduleChime(440.0, now, 0.4, 0.25);       // A4
      scheduleChime(554.37, now + 0.1, 0.45, 0.25); // C#5
      scheduleChime(659.25, now + 0.2, 0.6, 0.3);  // E5
      scheduleChime(880.0, now + 0.35, 0.9, 0.35); // A5

      // Second burst
      scheduleChime(440.0, now + 1.0, 0.4, 0.25);
      scheduleChime(554.37, now + 1.1, 0.45, 0.25);
      scheduleChime(659.25, now + 1.2, 0.6, 0.3);
      scheduleChime(880.0, now + 1.35, 1.2, 0.4);

      // Third ringing harmonic resolution
      scheduleChime(587.33, now + 2.2, 0.5, 0.25); // D5
      scheduleChime(739.99, now + 2.3, 0.5, 0.25); // F#5
      scheduleChime(880.0, now + 2.4, 0.6, 0.3);   // A5
      scheduleChime(1174.66, now + 2.5, 1.5, 0.35); // D6
    } catch (err) {
      console.warn('Unable to play alarm chime:', err);
    }
  }, [isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsFinished(true);
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playAlarmSound]);

  const toggleTimer = () => {
    if (isFinished) {
      resetTimer();
      setIsActive(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    if (mode === 'custom') {
      setTimeLeft(customMinutes * 60);
    } else {
      setTimeLeft(MODE_TIMES[mode]);
    }
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setIsFinished(false);
    if (newMode === 'custom') {
      setShowCustomConfig(true);
      setTimeLeft(customMinutes * 60);
    } else {
      setShowCustomConfig(false);
      setTimeLeft(MODE_TIMES[newMode]);
    }
  };

  const handleCustomMinutesChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(180, newVal));
    setCustomMinutes(clamped);
    if (mode === 'custom') {
      setIsActive(false);
      setIsFinished(false);
      setTimeLeft(clamped * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="md:col-span-4 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Visual pulse glow on timer finish */}
      {isFinished && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-2xl animate-pulse pointer-events-none" />
      )}

      <div className="flex flex-col gap-space-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Focus Timer</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Mute/Sound Alarm Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Alarm Sound' : 'Mute Alarm Sound'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isMuted
                  ? 'text-outline-variant hover:text-outline'
                  : 'text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>

            {/* Test Alarm sound preview button */}
            <button
              type="button"
              onClick={playAlarmSound}
              title="Test Alarm Sound"
              className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
          </div>
        </div>

        {/* Mode Selectors */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-surface-container-low text-[11px]">
          <button
            type="button"
            onClick={() => changeMode('pomodoro')}
            className={`py-1 rounded-lg text-center font-medium transition-all ${
              mode === 'pomodoro'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            25m
          </button>
          <button
            type="button"
            onClick={() => changeMode('shortBreak')}
            className={`py-1 rounded-lg text-center font-medium transition-all ${
              mode === 'shortBreak'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Short (5m)
          </button>
          <button
            type="button"
            onClick={() => changeMode('longBreak')}
            className={`py-1 rounded-lg text-center font-medium transition-all ${
              mode === 'longBreak'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Long (15m)
          </button>
          <button
            type="button"
            onClick={() => changeMode('custom')}
            className={`py-1 rounded-lg text-center font-medium transition-all flex items-center justify-center gap-0.5 ${
              mode === 'custom'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">tune</span>
            <span>Custom</span>
          </button>
        </div>

        {/* Custom Duration Controls (when Custom mode is active) */}
        {mode === 'custom' && (
          <div className="p-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-outline">Custom Duration</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCustomMinutesChange(customMinutes - 5)}
                  className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                >
                  -
                </button>
                <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded-md border border-outline-variant/30 font-mono font-semibold text-primary">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => handleCustomMinutesChange(parseInt(e.target.value) || 1)}
                    className="w-8 text-center bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-outline">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCustomMinutesChange(customMinutes + 5)}
                  className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleCustomMinutesChange(mins)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${
                    customMinutes === mins
                      ? 'bg-primary text-on-primary font-semibold shadow-xs'
                      : 'bg-surface-container text-outline hover:text-on-surface'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Display Timer */}
        <div className="my-space-sm text-center flex flex-col items-center justify-center py-space-sm bg-surface-container-low/50 rounded-2xl relative">
          <span
            className={`font-display-lg text-[46px] leading-none tracking-tight font-semibold transition-colors ${
              isFinished ? 'text-primary animate-bounce' : 'text-on-surface'
            }`}
          >
            {formatTime(timeLeft)}
          </span>

          <span className="font-label-sm text-label-sm text-primary mt-2 flex items-center gap-1.5">
            {isFinished ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
                <span className="material-symbols-outlined text-[16px]">alarm_on</span>
                Session Complete! Alarm Sounded
              </span>
            ) : (
              <>
                <span
                  className={`w-2 h-2 rounded-full bg-primary ${
                    isActive ? 'animate-pulse' : ''
                  }`}
                />
                {isActive ? 'Flow State Active' : 'Paused'}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-space-sm">
        <button
          type="button"
          onClick={toggleTimer}
          className={`flex-1 h-10 rounded-xl font-label-md text-label-md shadow-xs transition-all flex items-center justify-center gap-1.5 ${
            isFinished
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white font-semibold'
              : isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-primary text-on-primary hover:bg-primary/90'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isFinished ? 'replay' : isActive ? 'pause' : 'play_arrow'}
          </span>
          <span>{isFinished ? 'Start Next' : isActive ? 'Pause' : 'Start'}</span>
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="h-10 px-space-md rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

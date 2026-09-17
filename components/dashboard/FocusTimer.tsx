"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusStats } from '@/hooks/useFocusStats';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'custom';

const MODE_TIMES = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function FocusTimer() {
  const { addFocusSeconds } = useFocusStats();
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
            // Automatically log focus time for focus modes
            if (mode === 'pomodoro' || mode === 'custom') {
              const sessionDuration = mode === 'custom' ? customMinutes * 60 : MODE_TIMES[mode];
              addFocusSeconds(sessionDuration);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playAlarmSound]);

  // Harness & Voice Command listener
  useEffect(() => {
    const handleTimerCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      if (detail.action === 'start') {
        const targetMode: TimerMode = detail.mode || 'pomodoro';
        setMode(targetMode);
        setIsFinished(false);

        if (targetMode === 'custom' && detail.durationMinutes) {
          const mins = Math.max(1, Math.min(180, Number(detail.durationMinutes)));
          setCustomMinutes(mins);
          setShowCustomConfig(true);
          setTimeLeft(mins * 60);
        } else if (targetMode === 'custom') {
          setShowCustomConfig(true);
          setTimeLeft(customMinutes * 60);
        } else {
          setShowCustomConfig(false);
          setTimeLeft(MODE_TIMES[targetMode] || 25 * 60);
        }
        setIsActive(true);
      } else if (detail.action === 'pause') {
        setIsActive(false);
      } else if (detail.action === 'resume') {
        setIsActive(true);
      } else if (detail.action === 'reset') {
        setIsActive(false);
        setIsFinished(false);
        if (mode === 'custom') {
          setTimeLeft(customMinutes * 60);
        } else {
          setTimeLeft(MODE_TIMES[mode]);
        }
      }
    };

    window.addEventListener('focusdeck-timer-command', handleTimerCommand);
    return () => {
      window.removeEventListener('focusdeck-timer-command', handleTimerCommand);
    };
  }, [mode, customMinutes]);


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
    <div className="apple-glass apple-card-hover md:col-span-4 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-sm relative overflow-hidden">
      {/* Visual pulse glow on timer finish */}
      {isFinished && (
        <div className="absolute inset-0 bg-[#5856D6]/10 border-2 border-[#5856D6] rounded-3xl animate-pulse pointer-events-none" />
      )}

      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5856D6]/10 flex items-center justify-center text-[#5856D6]">
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </div>
            <h2 className="text-[16px] font-semibold text-gray-950 tracking-tight">Focus Timer</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Mute/Sound Alarm Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Alarm Sound' : 'Mute Alarm Sound'}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? 'text-gray-400 hover:text-gray-600'
                  : 'text-[#5856D6] hover:bg-[#5856D6]/10'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>

            {/* Test Alarm sound preview button */}
            <button
              type="button"
              onClick={playAlarmSound}
              title="Test Alarm Sound"
              className="w-7 h-7 rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-800 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
            </button>
          </div>
        </div>

        {/* Apple Segmented Preset Toggle */}
        <div className="apple-segmented-bg p-1 rounded-full flex items-center text-[11px] font-medium gap-0.5">
          <button
            type="button"
            onClick={() => changeMode('pomodoro')}
            className={`flex-1 py-1 rounded-full text-center transition-all ${
              mode === 'pomodoro'
                ? 'bg-white text-[#5856D6] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pomodoro (25m)
          </button>
          <button
            type="button"
            onClick={() => changeMode('shortBreak')}
            className={`flex-1 py-1 rounded-full text-center transition-all ${
              mode === 'shortBreak'
                ? 'bg-white text-[#5856D6] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Short (5m)
          </button>
          <button
            type="button"
            onClick={() => changeMode('longBreak')}
            className={`flex-1 py-1 rounded-full text-center transition-all ${
              mode === 'longBreak'
                ? 'bg-white text-[#5856D6] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Long (15m)
          </button>
          <button
            type="button"
            onClick={() => changeMode('custom')}
            className={`px-2.5 py-1 rounded-full text-center transition-all flex items-center justify-center gap-0.5 ${
              mode === 'custom'
                ? 'bg-white text-[#5856D6] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">tune</span>
          </button>
        </div>

        {/* Custom Duration Controls (when Custom mode is active) */}
        {mode === 'custom' && (
          <div className="p-2.5 rounded-2xl bg-black/[0.03] border border-black/5 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">Custom Duration</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCustomMinutesChange(customMinutes - 5)}
                  className="w-6 h-6 rounded-md bg-white border border-black/5 flex items-center justify-center text-gray-600 hover:text-[#5856D6] transition-colors"
                >
                  -
                </button>
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-black/10 font-mono font-semibold text-[#5856D6]">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => handleCustomMinutesChange(parseInt(e.target.value) || 1)}
                    className="w-8 text-center bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCustomMinutesChange(customMinutes + 5)}
                  className="w-6 h-6 rounded-md bg-white border border-black/5 flex items-center justify-center text-gray-600 hover:text-[#5856D6] transition-colors"
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
                  className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    customMinutes === mins
                      ? 'bg-[#5856D6] text-white font-semibold shadow-xs'
                      : 'bg-white text-gray-600 border border-black/5 hover:text-gray-900'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabular Large Timer Display */}
        <div className="my-2 py-4 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-black/[0.02] to-black/[0.04] border border-black/5">
          <span
            className={`text-[46px] font-bold tracking-tight tabular-nums leading-none transition-colors ${
              isFinished ? 'text-[#34C759] animate-bounce' : 'text-gray-950'
            }`}
          >
            {formatTime(timeLeft)}
          </span>

          <span className="text-[11px] font-semibold mt-2.5 flex items-center gap-1.5">
            {isFinished ? (
              <span className="flex items-center gap-1 text-[#34C759] font-semibold animate-pulse">
                <span className="material-symbols-outlined text-[16px]">alarm_on</span>
                Session Complete!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5856D6]/10 text-[#5856D6]">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-[#5856D6] ${
                    isActive ? 'animate-pulse' : ''
                  }`}
                />
                {isActive ? 'Flow State Active' : 'Paused'}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={toggleTimer}
          className={`flex-1 h-9 rounded-xl font-medium text-[13px] shadow-[0_2px_8px_rgba(88,86,214,0.25)] transition-all flex items-center justify-center gap-1.5 ${
            isFinished
              ? 'bg-[#34C759] hover:bg-green-600 text-white font-semibold'
              : isActive
              ? 'bg-[#FF9500] hover:bg-amber-600 text-white'
              : 'bg-[#5856D6] text-white hover:bg-indigo-600'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">
            {isFinished ? 'replay' : isActive ? 'pause' : 'play_arrow'}
          </span>
          <span>{isFinished ? 'Start Next' : isActive ? 'Pause' : 'Start'}</span>
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="h-9 px-4 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-gray-800 font-medium text-[13px] transition-all flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[17px]">restart_alt</span>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

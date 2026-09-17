"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCalendar } from '@/hooks/useCalendar';
import { CalendarEvent, CATEGORY_COLORS } from '@/types/calendar';

export default function NextEvent() {
  const { events } = useCalendar();
  const [now, setNow] = useState<number>(Date.now());

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute the next upcoming or in-progress event from Calendar Events
  const { nextEvent, isHappeningNow, targetTimestamp, isPast } = useMemo(() => {
    if (!events || events.length === 0) {
      return { nextEvent: null, isHappeningNow: false, targetTimestamp: null, isPast: false };
    }

    // Sort events chronologically by start timestamp ascending
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

    // 1. Check if an event is currently happening right now
    const current = sorted.find((e) => {
      const end = e.endTimestamp || (e.timestamp + 3600000);
      return e.timestamp <= now && now < end;
    });

    if (current) {
      return {
        nextEvent: current,
        isHappeningNow: true,
        targetTimestamp: current.endTimestamp || (current.timestamp + 3600000),
        isPast: false,
      };
    }

    // 2. Find the closest future event
    const upcoming = sorted.find((e) => e.timestamp > now);
    if (upcoming) {
      return {
        nextEvent: upcoming,
        isHappeningNow: false,
        targetTimestamp: upcoming.timestamp,
        isPast: false,
      };
    }

    // 3. If all events are in the past, display the most recent event
    const latest = sorted[sorted.length - 1];
    return {
      nextEvent: latest,
      isHappeningNow: false,
      targetTimestamp: null,
      isPast: true,
    };
  }, [events, now]);

  // Countdown timer calculations
  const timeLeft = useMemo(() => {
    if (!targetTimestamp || targetTimestamp <= now) {
      return { days: 0, hours: 0, mins: 0, secs: 0 };
    }

    const distance = Math.max(0, targetTimestamp - now);
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    return { days, hours, mins, secs };
  }, [targetTimestamp, now]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const formatEventDate = (event: CalendarEvent) => {
    const eventDate = new Date(event.timestamp);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();

    let datePrefix = '';
    if (isToday) {
      datePrefix = 'Today';
    } else if (isTomorrow) {
      datePrefix = 'Tomorrow';
    } else {
      datePrefix = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(eventDate);
    }

    return `${datePrefix} · ${event.startTime}`;
  };

  // If no calendar events exist in state
  if (!nextEvent) {
    return (
      <div className="md:col-span-3 flex flex-col justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">event_upcoming</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Next Event</h2>
            </div>
            <Link
              href="/calendar"
              title="Open Calendar"
              className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-6 gap-2">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">event_available</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-headline-sm text-sm font-semibold text-on-surface">No Events Scheduled</p>
              <p className="text-body-sm text-outline text-xs max-w-[200px] leading-relaxed">
                Connect your Google Calendar or add events to track live countdowns.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/calendar"
          className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/20"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>Open Calendar</span>
        </Link>
      </div>
    );
  }

  const catConfig = CATEGORY_COLORS[nextEvent.category] || CATEGORY_COLORS.Work;

  return (
    <div className="apple-glass apple-card-hover md:col-span-3 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-sm group">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#00C7BE]/10 flex items-center justify-center text-[#00C7BE] shrink-0">
              <span className="material-symbols-outlined text-[18px]">event_upcoming</span>
            </div>
            <h2 className="text-[16px] font-semibold text-gray-950 tracking-tight truncate">Upcoming</h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isHappeningNow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] text-[10px] font-semibold border border-[#34C759]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                Live Now
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.04] text-gray-400 text-[10px] font-medium border border-black/5">
                <span className="material-symbols-outlined text-[12px] text-[#34C759]">check_circle</span>
                Finished
              </span>
            ) : (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}>
                {nextEvent.category}
              </span>
            )}

            <Link
              href="/calendar"
              title="View in Calendar"
              className="w-7 h-7 rounded-full text-gray-400 hover:bg-black/5 hover:text-gray-900 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* Event Title */}
        <div className="mt-1">
          <Link
            href="/calendar"
            className={`text-[13px] font-semibold hover:text-[#007AFF] transition-colors line-clamp-1 ${
              isPast ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-950'
            }`}
            title={nextEvent.title}
          >
            {nextEvent.title}
          </Link>
          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 font-medium">
            <span>{isHappeningNow ? 'Ends in:' : isPast ? 'Event finished' : 'Starts in:'}</span>
          </div>
        </div>

        {/* Countdown Timer Grid OR Concluded Card */}
        {isPast ? (
          <div className="my-3.5 p-3.5 rounded-2xl bg-black/[0.02] border border-black/5 flex items-center justify-center gap-2 text-center text-gray-500">
            <span className="material-symbols-outlined text-[18px] text-[#34C759]">task_alt</span>
            <span className="text-xs font-medium text-gray-700">Event has concluded</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 my-3.5 text-center">
            <div className="flex flex-col bg-black/[0.03] border border-black/5 rounded-xl py-2">
              <span className="text-[18px] font-bold text-gray-900 tabular-nums">
                {formatNumber(timeLeft.days)}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Days</span>
            </div>
            <div className="flex flex-col bg-black/[0.03] border border-black/5 rounded-xl py-2">
              <span className="text-[18px] font-bold text-gray-900 tabular-nums">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Hours</span>
            </div>
            <div className="flex flex-col bg-black/[0.03] border border-black/5 rounded-xl py-2">
              <span className="text-[18px] font-bold text-gray-900 tabular-nums">
                {formatNumber(timeLeft.mins)}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mins</span>
            </div>
            <div className="flex flex-col bg-[#00C7BE]/10 border border-[#00C7BE]/20 rounded-xl py-2">
              <span className="text-[18px] font-bold text-[#00C7BE] tabular-nums">
                {formatNumber(timeLeft.secs)}
              </span>
              <span className="text-[9px] font-bold text-[#00C7BE] uppercase tracking-wider">Secs</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Date / Time and optional Meeting Link */}
      <div className="flex items-center justify-between text-gray-500 pt-2 border-t border-black/5 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">calendar_today</span>
          <span className="truncate">{formatEventDate(nextEvent)}</span>
        </div>

        {nextEvent.url ? (
          <a
            href={nextEvent.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Join Google Meet / Link"
            className="flex items-center gap-1 text-[#007AFF] hover:underline font-semibold shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">videocam</span>
            <span>Join</span>
          </a>
        ) : nextEvent.location ? (
          <span className="text-gray-400 truncate max-w-[90px]" title={nextEvent.location}>
            {nextEvent.location}
          </span>
        ) : (
          <Link href="/calendar" className="text-gray-400 hover:text-[#007AFF] transition-colors">
            Details →
          </Link>
        )}
      </div>
    </div>
  );
}

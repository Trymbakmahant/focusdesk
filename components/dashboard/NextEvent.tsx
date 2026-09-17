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
    <div className="md:col-span-3 flex flex-col justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow group">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">event_upcoming</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Next Event</h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isHappeningNow ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold ring-1 ring-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Now
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-outline text-[10px] font-medium">
                Concluded
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}>
                {nextEvent.category}
              </span>
            )}

            <Link
              href="/calendar"
              title="View in Calendar"
              className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* Event Title */}
        <div className="mt-1">
          <Link
            href="/calendar"
            className="font-body-sm text-body-sm text-on-surface font-semibold hover:text-primary transition-colors line-clamp-1"
            title={nextEvent.title}
          >
            {nextEvent.title}
          </Link>
          <div className="text-[11px] text-outline mt-0.5 flex items-center gap-1">
            <span>{isHappeningNow ? 'Ends in:' : isPast ? 'Completed' : 'Starts in:'}</span>
          </div>
        </div>

        {/* Countdown Timer Grid */}
        <div className="grid grid-cols-4 gap-1.5 my-space-md text-center">
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2 border border-outline-variant/15">
            <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              {formatNumber(timeLeft.days)}
            </span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Days</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2 border border-outline-variant/15">
            <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Hours</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2 border border-outline-variant/15">
            <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              {formatNumber(timeLeft.mins)}
            </span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Mins</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2 border border-outline-variant/15">
            <span className="font-headline-lg text-headline-lg text-primary font-semibold">
              {formatNumber(timeLeft.secs)}
            </span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Secs</span>
          </div>
        </div>
      </div>

      {/* Footer: Date / Time and optional Meeting Link */}
      <div className="flex items-center justify-between text-on-surface-variant text-body-sm font-body-sm pt-space-xs border-t border-outline-variant/15 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[15px] text-outline shrink-0">calendar_today</span>
          <span className="truncate">{formatEventDate(nextEvent)}</span>
        </div>

        {nextEvent.url ? (
          <a
            href={nextEvent.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Join Google Meet / Link"
            className="flex items-center gap-1 text-primary hover:underline text-[11px] font-medium shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">videocam</span>
            <span>Join</span>
          </a>
        ) : nextEvent.location ? (
          <span className="text-[11px] text-outline truncate max-w-[90px]" title={nextEvent.location}>
            {nextEvent.location}
          </span>
        ) : (
          <Link href="/calendar" className="text-[11px] text-outline hover:text-primary transition-colors">
            Details →
          </Link>
        )}
      </div>
    </div>
  );
}

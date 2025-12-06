"use client";

import React, { useState, useEffect } from 'react';

export default function NextEvent() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0
  });

  useEffect(() => {
    // Target date: September 10, 2026 09:30 AM
    const targetDate = new Date('2026-09-10T09:30:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, mins, secs });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="md:col-span-3 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">event_upcoming</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Next Event</h2>
          </div>
          <button className="w-7 h-7 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">ETHGlobal Online</p>
        <div className="grid grid-cols-4 gap-1.5 my-space-md text-center">
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2">
            <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">{formatNumber(timeLeft.days)}</span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Days</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2">
            <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">{formatNumber(timeLeft.hours)}</span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Hours</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2">
            <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">{formatNumber(timeLeft.mins)}</span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Mins</span>
          </div>
          <div className="flex flex-col bg-surface-container-low rounded-xl p-2">
            <span className="font-headline-lg text-headline-lg text-primary font-semibold">{formatNumber(timeLeft.secs)}</span>
            <span className="font-label-sm text-[10px] text-outline uppercase">Secs</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-space-xs text-on-surface-variant text-body-sm font-body-sm">
        <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
        <span className="truncate">September 10, 2026 · 09:30 AM</span>
      </div>
    </div>
  );
}

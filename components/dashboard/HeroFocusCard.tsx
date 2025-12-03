import React from 'react';

export default function HeroFocusCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EAF7FF] via-[#D9F1FF] to-surface-container-lowest p-space-xl shadow-md">
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
      <div className="absolute right-1/4 -bottom-16 w-80 h-80 rounded-full bg-primary-fixed/40 blur-2xl pointer-events-none"></div>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
        <div className="flex flex-col gap-space-sm max-w-2xl">
          <div className="flex items-center gap-space-xs text-primary font-label-sm text-label-sm uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>Focus for Today</span>
            <span className="text-outline">·</span>
            <span className="text-on-surface-variant lowercase">ambient flow</span>
          </div>
          <div className="flex items-baseline gap-space-md">
            <span className="font-display-lg text-[52px] leading-[58px] tracking-tight text-on-surface font-semibold">3h 24m</span>
            <span className="font-headline-sm text-headline-sm text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">trending_up</span> +38m vs yesterday
            </span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Deep Work Session <span className="text-outline">·</span> <span className="text-on-surface font-medium">In the zone</span> with zero context switching for 42 minutes.
          </p>
          <div className="flex flex-col gap-1.5 mt-space-xs">
            <div className="flex justify-between items-center text-label-sm font-label-sm">
              <span className="text-on-surface font-medium">68% of 5h daily target</span>
              <span className="text-on-surface-variant">1h 36m remaining</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container-high/60 overflow-hidden p-0.5">
              <div className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-700" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">timelapse</span>
              <span>Current session: <strong>42m</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">coffee</span>
              <span>Next break: <strong>in 18m</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-[#0284C7]">bolt</span>
              <span>Peak energy: <strong>High</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur shadow-xs text-on-surface text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">target</span>
              <span>Efficiency: <strong>94%</strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-space-md">
          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle className="text-surface-container-high/60" cx="60" cy="60" fill="none" r="52" stroke="currentColor" strokeWidth="9"></circle>
              <circle className="text-primary transition-all duration-1000" cx="60" cy="60" fill="none" r="52" stroke="currentColor" strokeDasharray="326.7" strokeDashoffset="104.5" strokeLinecap="round" strokeWidth="9"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">68%</span>
              <span className="font-label-sm text-label-sm text-outline">COMPLETED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

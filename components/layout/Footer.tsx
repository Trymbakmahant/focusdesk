import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between py-space-md text-outline font-body-sm text-body-sm border-t border-outline-variant/10 gap-space-sm mt-4">
      <div className="flex flex-wrap items-center gap-space-xs text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px] text-primary">bolt</span>
          <span>Tauri 2 + SQLite</span>
        </span>
        <span>All data stored locally on your Mac</span>
        <span className="text-outline">·</span>
        <nav className="flex flex-wrap items-center gap-2 text-outline-variant" aria-label="Footer navigation">
          <Link href="/focus" className="hover:text-primary transition-colors">Focus</Link>
          <span>·</span>
          <Link href="/tasks" className="hover:text-primary transition-colors">Tasks</Link>
          <span>·</span>
          <Link href="/calendar" className="hover:text-primary transition-colors">Calendar</Link>
          <span>·</span>
          <Link href="/activity" className="hover:text-primary transition-colors">Activity</Link>
          <span>·</span>
          <Link href="/reminders" className="hover:text-primary transition-colors">Reminders</Link>
          <span>·</span>
          <a href="/llms.txt" className="hover:text-primary transition-colors" title="Machine-readable AI Documentation">llms.txt</a>
        </nav>
      </div>
      <div className="flex items-center gap-space-sm">
        <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
          <span className="text-outline font-body-sm text-body-sm">Press</span>
          <kbd className="font-code-kbd text-code-kbd px-1 py-0.5 rounded bg-surface-container-highest text-on-surface">⌘K</kbd>
          <span className="text-outline font-body-sm text-body-sm">for Command Palette</span>
        </div>
      </div>
    </footer>
  );
}

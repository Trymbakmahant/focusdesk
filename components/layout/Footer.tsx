import React from 'react';

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between py-space-md text-outline font-body-sm text-body-sm border-t-0 gap-space-sm">
      <div className="flex items-center gap-space-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px] text-primary">bolt</span>
          <span>Tauri 2 + SQLite</span>
        </span>
        <span>All data stored locally on your Mac</span>
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

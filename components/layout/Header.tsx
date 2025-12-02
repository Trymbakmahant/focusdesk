import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 md:left-sidebar-width right-0 h-14 z-30 bg-surface/75 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] flex items-center justify-between px-space-md md:px-space-lg transition-all duration-300">
      <div className="flex items-center gap-space-sm md:gap-space-md">
        <button 
          onClick={onMenuClick} 
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        <div className="md:hidden flex items-center gap-space-xs">
          <img alt="FocusDeck Logo" className="w-7 h-7 rounded-lg object-cover ring-1 ring-outline-variant/30" src="/logo.jpg" />
          <span className="font-headline-sm text-body-md text-on-surface font-semibold">FocusDeck</span>
        </div>
        <div className="hidden md:flex items-center gap-space-xs text-outline">
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span className="font-label-md text-label-md">Today, May 24</span>
        </div>
        <div className="hidden md:flex items-center gap-space-xs bg-surface-container/70 px-space-sm py-1 rounded-lg text-on-surface-variant w-72">
          <span className="material-symbols-outlined text-[18px] text-outline">search</span>
          <span className="font-body-sm text-body-sm text-outline flex-1 truncate">Search FocusDeck...</span>
          <kbd className="font-code-kbd text-code-kbd bg-surface-container-highest px-1 py-0.5 rounded text-on-surface-variant">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        {user ? (
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container text-xs text-outline">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="truncate max-w-[140px] text-on-surface">{user.email}</span>
          </div>
        ) : (
          <Link
            href="/login"
            className="h-8 px-space-sm rounded-lg bg-surface-container-high/70 hover:bg-surface-container text-on-surface hover:text-primary transition-colors flex items-center gap-space-2xs text-label-md font-label-md"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In</span>
          </Link>
        )}
        <button className="h-8 px-space-sm rounded-lg bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center gap-space-2xs text-label-md font-label-md">
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add Card</span>
        </button>
        <button className="w-8 h-8 rounded-lg bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
        </button>
        <Link 
          href="/focus"
          className="h-8 px-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center gap-space-2xs text-label-md font-label-md"
        >
          <span className="material-symbols-outlined text-[16px]">self_improvement</span>
          <span>Focus</span>
        </Link>
      </div>
    </header>
  );
}

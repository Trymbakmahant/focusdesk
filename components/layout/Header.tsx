import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="fixed top-0 left-0 md:left-sidebar-width right-0 h-14 z-30 bg-white/70 dark:bg-[#1c1c1e]/75 backdrop-blur-[24px] border-b border-black/[0.06] dark:border-white/10 shadow-[0_1px_5px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] flex items-center justify-between px-4 md:px-6 transition-all duration-300">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuClick} 
          className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        <div className="md:hidden flex items-center gap-2">
          <img alt="FocusDeck Logo" className="w-6 h-6 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10" src="/logo.jpg" />
          <span className="font-semibold text-[14px] text-gray-950 dark:text-white">FocusDeck</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span className="material-symbols-outlined text-[18px] text-[#007AFF]">calendar_today</span>
          <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{formattedDate}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-colors px-3 py-1.5 rounded-full text-gray-600 dark:text-gray-300 w-72 border border-black/5 dark:border-white/10">
          <span className="material-symbols-outlined text-[17px] text-gray-400 dark:text-gray-500">search</span>
          <span className="text-[12px] text-gray-400 dark:text-gray-500 flex-1 truncate">Search FocusDeck...</span>
          <kbd className="apple-keycap font-mono text-[10px] text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded font-semibold">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Apple Appearance Switcher (Light / Dark / Auto) */}
        <ThemeSwitcher compact />

        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-xs text-gray-700 dark:text-gray-300">
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              )}
              <span className="truncate max-w-[130px] font-medium">{user.name || user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="h-7 px-2.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors flex items-center gap-1 border border-black/5 dark:border-white/10"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="h-8 px-3 rounded-full bg-[#007AFF] text-white hover:bg-blue-600 shadow-sm transition-colors flex items-center gap-1 text-[12px] font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In</span>
          </Link>
        )}
        <button className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
        </button>
        <Link 
          href="/focus"
          className="h-8 px-3.5 rounded-full bg-[#007AFF] text-white hover:bg-blue-600 transition-all flex items-center gap-1.5 text-[12px] font-semibold shadow-[0_1px_4px_rgba(0,122,255,0.25)]"
        >
          <span className="material-symbols-outlined text-[16px]">self_improvement</span>
          <span>Focus</span>
        </Link>
      </div>
    </header>
  );
}

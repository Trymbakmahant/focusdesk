import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed top-0 left-0 h-screen w-sidebar-width z-50 flex flex-col bg-[#F6F8FB]/80 dark:bg-[#141517]/85 backdrop-blur-[36px] border-r border-white/60 dark:border-white/10 shadow-[1px_0_15px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_20px_rgba(0,0,0,0.4)] justify-between transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex flex-col">
        {/* Genuine macOS Traffic Lights with tactile depth & inner border */}
        <div className="h-12 px-5 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 cursor-pointer" />
        </div>
       
        {/* App Branding with Squircle Icon */}
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0 bg-gradient-to-b from-white to-gray-50 dark:from-[#2C2C2E] dark:to-[#1C1C1E] flex items-center justify-center p-0.5">
            <img alt="FocusDeck Icon" className="w-full h-full object-contain rounded-lg" src="/logo.jpg" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[14px] text-gray-900 dark:text-white tracking-tight leading-tight">FocusDeck</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] uppercase tracking-wider">v2.4</span>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">macOS Sequoia Native</span>
          </div>
        </div>

        {/* Navigation Section: Focus Views */}
        <div className="px-3 pt-3">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Focus View</div>
          <nav className="flex flex-col gap-0.5">
            <Link 
              href="/" 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] transition-all ${
                pathname === '/' 
                  ? 'bg-[#007AFF] text-white font-medium shadow-[0_2px_8px_rgba(0,122,255,0.28)]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${pathname === '/' ? 'text-white' : 'text-[#007AFF]'}`}>dashboard</span>
                <span>Dashboard</span>
              </div>
              <kbd className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${pathname === '/' ? 'bg-white/20 text-white' : 'apple-keycap text-gray-500 dark:text-gray-400'}`}>⌘1</kbd>
            </Link>

            <Link 
              href="/tasks" 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] transition-all ${
                pathname === '/tasks' 
                  ? 'bg-[#007AFF] text-white font-medium shadow-[0_2px_8px_rgba(0,122,255,0.28)]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${pathname === '/tasks' ? 'text-white' : 'text-[#34C759]'}`}>check_circle</span>
                <span>Tasks</span>
              </div>
              <kbd className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${pathname === '/tasks' ? 'bg-white/20 text-white' : 'apple-keycap text-gray-500 dark:text-gray-400'}`}>⌘2</kbd>
            </Link>

            <Link 
              href="/calendar" 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] transition-all ${
                pathname === '/calendar' 
                  ? 'bg-[#007AFF] text-white font-medium shadow-[0_2px_8px_rgba(0,122,255,0.28)]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${pathname === '/calendar' ? 'text-white' : 'text-[#00C7BE]'}`}>calendar_today</span>
                <span>Calendar</span>
              </div>
              <kbd className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${pathname === '/calendar' ? 'bg-white/20 text-white' : 'apple-keycap text-gray-500 dark:text-gray-400'}`}>⌘3</kbd>
            </Link>

            <Link 
              href="/reminders" 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] transition-all ${
                pathname === '/reminders' 
                  ? 'bg-[#007AFF] text-white font-medium shadow-[0_2px_8px_rgba(0,122,255,0.28)]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${pathname === '/reminders' ? 'text-white' : 'text-[#FF9500]'}`}>notifications_active</span>
                <span>Reminders</span>
              </div>
              <kbd className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${pathname === '/reminders' ? 'bg-white/20 text-white' : 'apple-keycap text-gray-500 dark:text-gray-400'}`}>⌘4</kbd>
            </Link>

            <Link 
              href="/focus" 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] transition-all ${
                pathname === '/focus' 
                  ? 'bg-[#007AFF] text-white font-medium shadow-[0_2px_8px_rgba(0,122,255,0.28)]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${pathname === '/focus' ? 'text-white' : 'text-[#5856D6]'}`}>timer</span>
                <span>Focus</span>
              </div>
              <kbd className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${pathname === '/focus' ? 'bg-white/20 text-white' : 'apple-keycap text-gray-500 dark:text-gray-400'}`}>⌘5</kbd>
            </Link>

            <Link 
              href="/activity" 
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] transition-all ${
                pathname === '/activity' 
                  ? 'bg-[#007AFF] text-white font-medium shadow-[0_2px_8px_rgba(0,122,255,0.28)]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${pathname === '/activity' ? 'text-white' : 'text-[#32ADE6]'}`}>vital_signs</span>
                <span>Habits &amp; Activity</span>
              </div>
              <kbd className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${pathname === '/activity' ? 'bg-white/20 text-white' : 'apple-keycap text-gray-500 dark:text-gray-400'}`}>⌘6</kbd>
            </Link>
          </nav>
        </div>

        {/* Collections */}
        <div className="px-3 pt-4">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Collections</div>
          <nav className="flex flex-col gap-0.5">
            <a className="flex items-center px-2.5 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[13px]" href="#">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C7BE] mr-2.5 shadow-xs"></span>
              <span>Personal</span>
            </a>
            <a className="flex items-center px-2.5 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[13px]" href="#">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] mr-2.5 shadow-xs"></span>
              <span>Work</span>
            </a>
            <a className="flex items-center px-2.5 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[13px]" href="#">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5856D6] mr-2.5 shadow-xs"></span>
              <span>Development</span>
            </a>
            <a className="flex items-center px-2.5 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[13px]" href="#">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500] mr-2.5 shadow-xs"></span>
              <span>Projects</span>
            </a>
          </nav>
        </div>
      </div>

      {/* Footer Appearance, Profile & Command Palette */}
      <div className="p-3 flex flex-col gap-2.5 border-t border-black/5 dark:border-white/10">
        {/* Apple macOS Appearance Switcher */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Appearance</span>
          <ThemeSwitcher />
        </div>

        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border border-black/5 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[12px] flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[15px] text-[#007AFF]">terminal</span>
            Command Menu
          </span>
          <kbd className="apple-keycap font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">⌘K</kbd>
        </div>

        <div className="pt-0.5">
          {user ? (
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="relative shrink-0">
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#34C759] ring-1.5 ring-white dark:ring-[#1C1C1E]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">{user.name || user.email}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">macOS Pro</span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-[#007AFF] text-white hover:bg-blue-600 shadow-sm transition-colors text-[12px] font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In with WorkOS</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

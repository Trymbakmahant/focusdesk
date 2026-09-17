import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
      
      <aside className={`fixed top-0 left-0 h-screen w-sidebar-width z-50 flex flex-col bg-surface-container-low/80 backdrop-blur-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] justify-between transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex flex-col">
       
        <div className="px-space-md py-space-xs flex items-center gap-space-sm">
          <img alt="Fixates Logo" className="h-8 w-8 rounded-lg object-cover ring-1 ring-outline-variant/30 shrink-0 shadow-sm" src="/logo.jpg" />
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-body-md text-on-surface truncate leading-tight">Fixates</span>
            <span className="font-label-sm text-label-sm text-outline truncate leading-tight">Command Center</span>
          </div>
        </div>
        <div className="px-space-md pt-space-md">
          <div className="px-space-sm pb-space-2xs font-label-sm text-label-sm text-outline uppercase tracking-wider">Focus View</div>
          <nav className="flex flex-col gap-space-2xs">
            <Link aria-current="page" className="flex items-center justify-between px-space-sm py-space-xs transition-all bg-secondary-fixed text-on-surface font-label-md rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)]" href="/">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">space_dashboard</span>
                <span className="font-label-md text-label-md">Home</span>
              </div>
            </Link>
            <Link className="flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="/tasks">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span className="font-label-md text-label-md">Tasks</span>
              </div>
            </Link>
            <Link className="flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="/calendar">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span className="font-label-md text-label-md">Calendar</span>
              </div>
            </Link>
            <Link className="flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="/reminders">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                <span className="font-label-md text-label-md">Reminders</span>
              </div>
            </Link>
            <Link className="flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="/focus">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span className="font-label-md text-label-md">Focus</span>
              </div>
            </Link>
            <Link className="flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="/activity">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">insights</span>
                <span className="font-label-md text-label-md">Activity</span>
              </div>
            </Link>
          </nav>
        </div>
        <div className="px-space-md pt-space-lg">
          <div className="px-space-sm pb-space-2xs font-label-sm text-label-sm text-outline uppercase tracking-wider">Collections</div>
          <nav className="flex flex-col gap-space-2xs">
            <a className="flex items-center px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="#">
              <span className="w-2 h-2 rounded-full bg-secondary mr-space-sm"></span>
              <span className="font-label-md text-label-md">Personal</span>
            </a>
            <a className="flex items-center px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="#">
              <span className="w-2 h-2 rounded-full bg-primary mr-space-sm"></span>
              <span className="font-label-md text-label-md">Work</span>
            </a>
            <a className="flex items-center px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="#">
              <span className="w-2 h-2 rounded-full bg-tertiary mr-space-sm"></span>
              <span className="font-label-md text-label-md">Development</span>
            </a>
            <a className="flex items-center px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" href="#">
              <span className="w-2 h-2 rounded-full bg-primary-container mr-space-sm"></span>
              <span className="font-label-md text-label-md">Projects</span>
            </a>
          </nav>
        </div>
      </div>
      <div className="p-space-md flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-sm py-space-xs rounded-lg bg-surface-container/60 text-outline">
          <span className="font-body-sm text-body-sm flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px]">cloud_download</span>
            Command
          </span>
          <span className="font-code-kbd text-code-kbd px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">⌘K</span>
        </div>
        <div className="pt-space-xs border-t border-outline-variant/20">
          {user ? (
            <div className="flex items-center justify-between p-1 rounded-lg bg-surface-container/40">
              <div className="flex items-center gap-space-xs min-w-0 pr-2">
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/30 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0 ring-1 ring-primary/30">
                    {user.name ? user.name[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface truncate">{user.name || user.email}</span>
                  <span className="text-[10px] text-primary leading-none">WorkOS Authenticated</span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-space-xs w-full py-2 px-space-sm rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">login</span>
              <span>Sign In with WorkOS</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

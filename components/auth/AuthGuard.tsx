"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = pathname === '/login' || pathname.startsWith('/auth');

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        router.replace('/login');
      } else if (user && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // 1. While checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-4 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-4 text-center z-10">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="FocusDeck Logo"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/40 shadow-2xl shadow-primary/20 animate-pulse"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary ring-2 ring-background animate-ping" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-headline-md text-xl font-bold text-on-surface tracking-tight">FocusDeck</h1>
            <p className="text-body-sm text-outline text-xs">Checking authentication & loading your workspace...</p>
          </div>
          <div className="w-44 h-1.5 bg-surface-container rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 2. If unauthenticated and on a protected route (show sign-in prompt while auto-redirecting)
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-6 relative overflow-hidden">
        <div className="w-full max-w-md bg-surface-container-low/90 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/30 text-primary">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="font-headline-sm text-xl font-bold text-on-surface">Sign In Required</h2>
            <p className="text-body-sm text-outline text-xs leading-relaxed">
              Please sign in to access your personal tasks, habits, focus timers, and workspace data.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-2">
            <button
              onClick={() => router.replace('/login')}
              className="w-full h-11 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-label-md font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Sign In to FocusDeck</span>
            </button>
            <span className="text-[11px] text-outline">Redirecting to login page...</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is authenticated (or on public route like /login)
  return <>{children}</>;
}

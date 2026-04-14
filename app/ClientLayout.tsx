"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ViewModeProvider } from '@/context/ViewModeContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AgentVoiceModal from '@/components/harness/AgentVoiceModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/auth') || pathname.startsWith('/callback');

  // Global ⌘K and Ctrl+K shortcut listener to toggle Voice AI Harness
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsVoiceModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ViewModeProvider>
          <AuthGuard>
          {isAuthPage ? (
            <div className="min-h-screen flex flex-col justify-between bg-background">
              <main className="flex-1 flex items-center justify-center p-space-sm md:p-space-lg">
                {children}
              </main>
              <Footer />
            </div>
          ) : (
            <>
              <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                onVoiceClick={() => setIsVoiceModalOpen(true)} 
              />
              <div className="pl-0 md:pl-sidebar-width min-h-screen flex flex-col transition-all duration-300">
                <Header 
                  onMenuClick={() => setIsSidebarOpen(true)} 
                  onVoiceClick={() => setIsVoiceModalOpen(true)}
                />
                <main className="relative pt-20 md:pt-24 px-space-sm md:px-space-lg pb-space-lg md:pb-space-xl flex-1 w-full">
                  <div className="flex flex-col w-full gap-space-lg md:gap-space-xl">
                    {children}
                    <Footer />
                  </div>
                </main>
              </div>

              {/* Floating Voice Command AI Assistant Button */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                title="AI Voice Command Assistant (⌘K)"
                className="fixed bottom-6 right-6 z-40 h-12 pl-3 pr-4 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(124,58,237,0.45)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.65)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/25 backdrop-blur-md group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-xs">
                  <span className="material-symbols-outlined text-[17px] text-white">mic</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-bold tracking-tight leading-tight">Voice AI</span>
                  <span className="text-[9px] text-white/75 font-mono leading-none">Press ⌘K</span>
                </div>
              </button>

              {/* Interactive Multi-Turn Voice & Tool Agent Modal */}
              <AgentVoiceModal 
                isOpen={isVoiceModalOpen} 
                onClose={() => setIsVoiceModalOpen(false)} 
              />
            </>
          )}
        </AuthGuard>
      </ViewModeProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}


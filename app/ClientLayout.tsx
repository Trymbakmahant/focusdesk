"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  return (
    <AuthProvider>
      {isAuthPage ? (
        <div className="min-h-screen flex flex-col justify-between bg-background">
          <main className="flex-1 flex items-center justify-center p-space-sm md:p-space-lg">
            {children}
          </main>
          <Footer />
        </div>
      ) : (
        <>
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <div className="pl-0 md:pl-sidebar-width min-h-screen flex flex-col transition-all duration-300">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="relative pt-20 md:pt-24 px-space-sm md:px-space-lg pb-space-lg md:pb-space-xl flex-1 w-full">
              <div className="flex flex-col w-full gap-space-lg md:gap-space-xl">
                {children}
                <Footer />
              </div>
            </main>
          </div>
        </>
      )}
    </AuthProvider>
  );
}

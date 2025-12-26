"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setStatus('error');
      setErrorMessage('Supabase is not configured yet. Please check your .env.local');
      return;
    }

    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error_description') || url.searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage(error);
          return;
        }

        // If code is present (PKCE flow)
        if (code) {
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }
        }

        // Check if we now have an active session
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          setStatus('success');
          setTimeout(() => {
            router.push('/');
          }, 1200);
        } else {
          // If hash tokens were processed automatically by the client
          const { data: { subscription } } = client.auth.onAuthStateChange((event, newSession) => {
            if (newSession) {
              setStatus('success');
              setTimeout(() => {
                router.push('/');
              }, 1200);
            }
          });

          // Timeout fallback
          setTimeout(async () => {
            const { data: { session: fallbackSession } } = await client.auth.getSession();
            if (fallbackSession) {
              setStatus('success');
              router.push('/');
            } else {
              setStatus('error');
              setErrorMessage('Could not verify session. The confirmation link may have expired or already been used.');
            }
            subscription.unsubscribe();
          }, 3500);
        }
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-space-md py-space-xl">
      <div className="w-full max-w-md bg-surface-container-low/90 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl p-space-lg md:p-space-xl shadow-2xl flex flex-col items-center text-center gap-space-md relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        {status === 'verifying' && (
          <>
            <div className="relative w-16 h-16 flex items-center justify-center mb-space-2xs">
              <img src="/logo.jpg" alt="FocusDeck Logo" className="w-12 h-12 rounded-xl object-cover ring-1 ring-outline-variant/30 shadow-lg" />
              <div className="absolute inset-0 rounded-2xl border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Verifying your email</h2>
              <p className="font-body-sm text-body-sm text-outline">
                Connecting to FocusDeck and synchronizing your account session...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/30 text-primary animate-bounce">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Email Verified!</h2>
              <p className="font-body-sm text-body-sm text-outline">
                Welcome to FocusDeck. Redirecting you to your dashboard...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-error/15 flex items-center justify-center ring-1 ring-error/30 text-error">
              <span className="material-symbols-outlined text-[32px]">cancel</span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Verification Failed</h2>
              <p className="font-body-sm text-body-sm text-error-container text-xs mt-1">
                {errorMessage}
              </p>
            </div>
            <Link
              href="/login"
              className="mt-space-xs px-space-md py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              Return to Login
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

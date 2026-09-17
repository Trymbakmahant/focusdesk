"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isConfigured, signIn, signUp, loading: authLoading } = useAuth();

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState<boolean>(false);

  // Monitor network state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setErrorMessage(null);
      };
      const handleOffline = () => {
        setIsOnline(false);
        setErrorMessage('You are currently offline. Please reconnect to continue.');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Check URL query parameters for auth feedback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unconfigured') {
      setErrorMessage('WorkOS credentials are not yet configured in .env.local.');
    } else if (errorParam === 'auth_error') {
      setErrorMessage('Authentication error occurred while communicating with WorkOS. Please try again.');
    }
  }, [searchParams]);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignIn = () => {
    if (!isOnline) {
      setErrorMessage('No internet connection. Please verify your network.');
      return;
    }
    setSigningIn(true);
    signIn();
  };

  const handleSignUp = () => {
    if (!isOnline) {
      setErrorMessage('No internet connection. Please verify your network.');
      return;
    }
    setSigningIn(true);
    signUp();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-space-md py-space-xl">
      <div className="w-full max-w-lg bg-surface-container-low/90 backdrop-blur-2xl border border-outline-variant/30 rounded-3xl p-space-lg md:p-space-xl shadow-2xl flex flex-col gap-space-lg relative overflow-hidden">
        
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Offline Network Warning Banner */}
        {!isOnline && (
          <div className="bg-error/20 border border-error/50 rounded-xl p-3 flex items-center justify-between gap-space-xs text-error-container relative z-10 animate-pulse">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">wifi_off</span>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-error">No Internet Connection</span>
                <span className="text-[11px] text-outline">Connect to the internet to sign in with WorkOS AuthKit.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const online = navigator.onLine;
                setIsOnline(online);
                if (online) setErrorMessage(null);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors text-on-surface shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="bg-error/15 border border-error/30 text-error-container rounded-xl p-space-sm flex items-start gap-space-xs text-body-sm relative z-10">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-error">error</span>
            <span className="text-xs leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center gap-space-xs relative z-10">
          <div className="relative">
            <img 
              src="/logo.jpg" 
              alt="FocusDeck Logo" 
              className="w-16 h-16 rounded-2xl object-cover ring-1 ring-outline-variant/30 shadow-xl shadow-black/40" 
            />
            <div className="absolute -bottom-1 -right-1 bg-surface-container-highest px-1.5 py-0.5 rounded-md border border-outline-variant/40 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] font-mono font-semibold text-on-surface">WorkOS</span>
            </div>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-semibold mt-2">
            Welcome to FocusDeck
          </h1>
          <p className="font-body-sm text-body-sm text-outline max-w-sm">
            Authenticate seamlessly with WorkOS AuthKit for enterprise-grade single sign-on, social logins, and passwordless access.
          </p>
        </div>

        {/* WorkOS Setup Guide (if keys are missing in .env.local) */}
        {!isConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-space-md flex flex-col gap-2.5 text-amber-200 text-body-sm relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-400 shrink-0">key</span>
              <span className="font-semibold text-amber-300 text-xs">WorkOS Setup Configuration</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              To activate authentication, add the following credentials to your <code className="bg-amber-950/70 px-1 py-0.5 rounded font-mono text-amber-100">frontend/.env.local</code>:
            </p>
            <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl border border-outline-variant/20 font-mono text-[11px] text-on-surface flex flex-col gap-1 overflow-x-auto select-text">
              <span className="text-outline"># WorkOS Dashboard -&gt; API Keys / AuthKit</span>
              <span>WORKOS_CLIENT_ID=client_...</span>
              <span>WORKOS_API_KEY=sk_test_...</span>
              <span>WORKOS_COOKIE_PASSWORD=32_character_random_secret</span>
              <span>WORKOS_REDIRECT_URI=http://localhost:3000/callback</span>
              <span>NEXT_PUBLIC_WORKOS_CLIENT_ID=client_...</span>
            </div>
          </div>
        )}

        {/* Primary Action Section */}
        <div className="flex flex-col gap-space-sm relative z-10">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn || authLoading}
            className="w-full h-12 rounded-xl bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.99] font-label-md font-semibold text-sm transition-all flex items-center justify-center gap-space-xs shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {signingIn ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                <span>Connecting to WorkOS...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">login</span>
                <span>Continue with WorkOS AuthKit</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={signingIn || authLoading}
            className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.99] font-label-md font-medium text-xs transition-all flex items-center justify-center gap-space-xs text-on-surface border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">person_add</span>
            <span>Create a new account</span>
          </button>
        </div>

        {/* AuthKit Features Matrix */}
        <div className="grid grid-cols-2 gap-2 pt-space-xs border-t border-outline-variant/20 relative z-10 text-xs text-outline">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container/40">
            <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface text-[11px]">Enterprise SSO</span>
              <span className="text-[10px] text-outline">Okta, Azure, SAML</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container/40">
            <span className="material-symbols-outlined text-[18px] text-primary">fingerprint</span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface text-[11px]">Passkeys &amp; Social</span>
              <span className="text-[10px] text-outline">Google, GitHub, Apple</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container/40">
            <span className="material-symbols-outlined text-[18px] text-primary">mail_lock</span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface text-[11px]">Magic Link &amp; OTP</span>
              <span className="text-[10px] text-outline">Passwordless access</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container/40">
            <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface text-[11px]">Multi-Factor Auth</span>
              <span className="text-[10px] text-outline">TOTP &amp; SMS security</span>
            </div>
          </div>
        </div>

        {/* Footer / Return link */}
        <div className="pt-space-2xs text-center relative z-10 flex flex-col items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('focusdeck_guest', 'true');
              }
              router.push('/');
            }}
            className="inline-flex items-center gap-1 text-xs text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            <span>Return to FocusDeck dashboard (Guest Preview)</span>
          </button>
          <span className="text-[10px] text-outline/60">
            Protected by WorkOS AuthKit · Encrypted session tokens
          </span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, isConfigured, signInWithPassword, signUpWithPassword, signInWithOtp, verifyOtp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Internet connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Email confirmation state (shows Check Your Gmail view)
  const [emailSentFor, setEmailSentFor] = useState<'signup' | 'magiclink' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Monitor online / offline network state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setErrorMessage(null);
      };
      const handleOffline = () => {
        setIsOnline(false);
        setErrorMessage('You are currently offline. Please check your internet connection.');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Helper to format any network / server / auth errors nicely
  const parseAuthError = (err: unknown): string => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'No internet connection. Please verify your Wi-Fi or cellular network.';
    }
    const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : 'An unexpected error occurred';
    const lower = msg.toLowerCase();
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed') || lower.includes('network request failed')) {
      return 'Network connection error: Unable to reach Supabase. Check your internet connection or verify your Supabase project URL.';
    }
    if (lower.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lower.includes('user already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Pre-flight internet check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setErrorMessage('No internet connection. Please reconnect to the internet and try again.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setErrorMessage(parseAuthError(error.message));
        } else {
          router.push('/');
        }
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match. Please re-enter your password.');
          setLoading(false);
          return;
        }
        const { error, needsEmailConfirmation } = await signUpWithPassword(email, password);
        if (error) {
          setErrorMessage(parseAuthError(error.message));
        } else if (needsEmailConfirmation) {
          setEmailSentFor('signup');
          setSuccessMessage('Confirmation email sent to your inbox!');
        } else {
          router.push('/');
        }
      } else if (mode === 'magiclink') {
        const { error } = await signInWithOtp(email);
        if (error) {
          setErrorMessage(parseAuthError(error.message));
        } else {
          setEmailSentFor('magiclink');
          setSuccessMessage('Magic link sent to your inbox!');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setErrorMessage('No internet connection. Please reconnect before verifying.');
      return;
    }

    setErrorMessage(null);
    setOtpLoading(true);

    try {
      const type = emailSentFor === 'signup' ? 'signup' : 'magiclink';
      const { error } = await verifyOtp(email, otpCode.trim(), type);
      if (error) {
        setErrorMessage(parseAuthError(error.message));
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setErrorMessage('Cannot resend while offline. Please connect to the internet.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      if (emailSentFor === 'signup') {
        const { error } = await signUpWithPassword(email, password);
        if (error) setErrorMessage(parseAuthError(error.message));
        else setSuccessMessage('New confirmation email sent!');
      } else {
        const { error } = await signInWithOtp(email);
        if (error) setErrorMessage(parseAuthError(error.message));
        else setSuccessMessage('New magic link sent!');
      }
    } catch (err) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-space-md py-space-xl">
      <div className="w-full max-w-md bg-surface-container-low/90 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl p-space-lg md:p-space-xl shadow-2xl flex flex-col gap-space-md relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        {/* Offline Network Warning Banner */}
        {!isOnline && (
          <div className="bg-error/20 border border-error/50 rounded-xl p-3 flex items-center justify-between gap-space-xs text-error-container relative z-10 animate-pulse">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">wifi_off</span>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-error">No Internet Connection</span>
                <span className="text-[11px] text-outline">Connect to the internet to sign in or sign up.</span>
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

        {/* Cloud Config Warning (If credentials not yet in .env.local) */}
        {!isConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-space-sm flex items-start gap-space-xs text-amber-200 text-body-sm relative z-10">
            <span className="material-symbols-outlined text-[20px] text-amber-400 shrink-0 mt-0.5">info</span>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-300">Cloud Supabase Setup Needed</span>
              <span className="text-xs text-amber-200/90 leading-relaxed">
                Add your cloud <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-100">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-100">frontend/.env.local</code> to enable live email authentication.
              </span>
            </div>
          </div>
        )}

        {/* Check Your Gmail View */}
        {emailSentFor ? (
          <div className="flex flex-col items-center text-center gap-space-md relative z-10 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/30 text-primary">
              <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Check your Gmail
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                {emailSentFor === 'signup'
                  ? 'We sent a verification link & code to:'
                  : 'We sent your one-click Magic Link & code to:'}
              </p>
              <div className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-medium text-xs border border-outline-variant/30">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{email}</span>
              </div>
            </div>

            {/* Error notification */}
            {errorMessage && (
              <div className="w-full bg-error/15 border border-error/30 text-error-container rounded-xl p-space-sm flex items-start gap-space-xs text-body-sm text-left">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-error">error</span>
                <span className="text-xs leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success notification */}
            {successMessage && (
              <div className="w-full bg-primary-container/20 border border-primary/30 text-primary-container rounded-xl p-space-sm flex items-center gap-space-xs text-body-sm text-left">
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                <span className="text-xs">{successMessage}</span>
              </div>
            )}

            {/* Direct Open Gmail Button */}
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-label-md font-semibold text-sm transition-all flex items-center justify-center gap-space-xs shadow-lg shadow-primary/20 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span>Open Gmail</span>
            </a>

            {/* Alternative: Enter 6-digit Code */}
            <div className="w-full pt-space-xs border-t border-outline-variant/20 flex flex-col gap-2">
              <span className="text-xs text-outline">Or enter the 6-digit code from the email:</span>
              <form onSubmit={handleVerifyOtp} className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none flex-1 text-on-surface font-mono text-center tracking-widest text-base"
                />
                <button
                  type="submit"
                  disabled={otpLoading || !otpCode.trim()}
                  className="px-4 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {otpLoading ? 'Verifying...' : 'Verify'}
                </button>
              </form>
            </div>

            {/* Actions: Resend or Switch Email */}
            <div className="flex items-center justify-between w-full pt-space-xs text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-primary hover:underline disabled:opacity-50"
              >
                {loading ? 'Resending...' : 'Resend email'}
              </button>
              <button
                type="button"
                onClick={() => { setEmailSentFor(null); setErrorMessage(null); setSuccessMessage(null); }}
                className="text-outline hover:text-on-surface transition-colors"
              >
                Use another email
              </button>
            </div>
          </div>
        ) : (
          /* Standard Auth Form */
          <>
            {/* Header / Logo */}
            <div className="flex flex-col items-center text-center gap-space-xs relative z-10">
              <img 
                src="/logo.jpg" 
                alt="FocusDeck Logo" 
                className="w-14 h-14 rounded-2xl object-cover ring-1 ring-outline-variant/30 mb-space-2xs shadow-xl shadow-black/40" 
              />
              <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'magiclink' && 'Sign in with Magic Link'}
              </h1>
              <p className="font-body-sm text-body-sm text-outline">
                {mode === 'signin' && 'Enter your credentials to access your FocusDeck'}
                {mode === 'signup' && 'Set up your account to synchronize tasks, focus sessions, and notes'}
                {mode === 'magiclink' && 'We’ll email you a passwordless one-click sign in link'}
              </p>
            </div>

            {/* Tab switchers */}
            <div className="flex bg-surface-container/70 p-1 rounded-xl gap-1 text-label-md font-label-md relative z-10">
              <button
                type="button"
                onClick={() => { setMode('signin'); setConfirmPassword(''); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-2 rounded-lg transition-all text-center ${
                  mode === 'signin'
                    ? 'bg-surface text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setConfirmPassword(''); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-2 rounded-lg transition-all text-center ${
                  mode === 'signup'
                    ? 'bg-surface text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setMode('magiclink'); setConfirmPassword(''); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-2 rounded-lg transition-all text-center ${
                  mode === 'magiclink'
                    ? 'bg-surface text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Magic Link
              </button>
            </div>

            {/* Feedback alerts */}
            {errorMessage && (
              <div className="bg-error/15 border border-error/30 text-error-container rounded-xl p-space-sm flex items-start gap-space-xs text-body-sm animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-error">error</span>
                <span className="text-xs leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-primary-container/20 border border-primary/30 text-primary-container rounded-xl p-space-sm flex items-center gap-space-xs text-body-sm animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                <span className="text-xs">{successMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md relative z-10">
              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Email address</label>
                <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-2.5 rounded-xl border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="bg-transparent border-none outline-none flex-1 text-on-surface font-body-md placeholder:text-outline/60 text-sm"
                  />
                </div>
              </div>

              {/* Password input (hidden for magic link) */}
              {mode !== 'magiclink' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => { setMode('magiclink'); setErrorMessage(null); }}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-2.5 rounded-xl border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <span className="material-symbols-outlined text-outline text-[18px]">lock</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                        className="bg-transparent border-none outline-none flex-1 text-on-surface font-body-md placeholder:text-outline/60 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-outline hover:text-on-surface transition-colors flex items-center"
                        tabIndex={-1}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (only shown in signup mode) */}
                  {mode === 'signup' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Confirm Password</label>
                        {confirmPassword && password && (
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${
                            password === confirmPassword ? 'text-primary' : 'text-error'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {password === confirmPassword ? 'check_circle' : 'cancel'}
                            </span>
                            {password === confirmPassword ? 'Matches' : 'Does not match'}
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-space-xs bg-surface-container px-space-sm py-2.5 rounded-xl border transition-all ${
                        confirmPassword && password !== confirmPassword 
                          ? 'border-error/60 focus-within:border-error focus-within:ring-1 focus-within:ring-error' 
                          : 'border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
                      }`}>
                        <span className="material-symbols-outlined text-outline text-[18px]">verified_user</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="bg-transparent border-none outline-none flex-1 text-on-surface font-body-md placeholder:text-outline/60 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.99] font-label-md font-semibold text-sm transition-all flex items-center justify-center gap-space-xs shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-space-xs"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      {mode === 'signin' ? 'login' : mode === 'signup' ? 'person_add' : 'send'}
                    </span>
                    <span>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'magiclink' && 'Send Magic Link'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Footer info */}
            <div className="pt-space-xs text-center relative z-10">
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Return to FocusDeck dashboard</span>
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

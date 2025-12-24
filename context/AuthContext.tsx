"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError, EmailOtpType } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string, type?: EmailOtpType) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
  signInWithOtp: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getCallbackUrl = () => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/callback`;
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      return { 
        error: { 
          name: 'NotConfigured', 
          message: 'Supabase is not configured yet. Please add your cloud Supabase keys to .env.local' 
        } as AuthError 
      };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      return { 
        error: { 
          name: 'NotConfigured', 
          message: 'Supabase is not configured yet. Please add your cloud Supabase keys to .env.local' 
        } as AuthError 
      };
    }
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: getCallbackUrl(),
      }
    });

    const needsEmailConfirmation = Boolean(data.user && !data.session);
    return { error, needsEmailConfirmation };
  };

  const signInWithOtp = async (email: string) => {
    if (!supabase) {
      return { 
        error: { 
          name: 'NotConfigured', 
          message: 'Supabase is not configured yet. Please add your cloud Supabase keys to .env.local' 
        } as AuthError 
      };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getCallbackUrl(),
      },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string, type: EmailOtpType = 'email') => {
    if (!supabase) {
      return { 
        error: { 
          name: 'NotConfigured', 
          message: 'Supabase is not configured yet. Please add your cloud Supabase keys to .env.local' 
        } as AuthError 
      };
    }
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured,
        signInWithPassword,
        signUpWithPassword,
        signInWithOtp,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

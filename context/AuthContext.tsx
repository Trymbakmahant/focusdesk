"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthKitProvider, useAuth as useWorkOSAuth } from '@workos-inc/authkit-nextjs/components';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePictureUrl?: string | null;
  user_metadata?: {
    full_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
  };
  raw?: unknown;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: () => void;
  signUp: () => void;
  signOut: () => Promise<{ error: unknown | null }>;
  // Compatibility stubs for existing code
  signInWithPassword: (email: string, password: string) => Promise<{ error: unknown | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: unknown | null; needsEmailConfirmation?: boolean }>;
  signInWithOtp: (email: string) => Promise<{ error: unknown | null }>;
  verifyOtp: (email: string, token: string, type?: unknown) => Promise<{ error: unknown | null }>;
}

const defaultContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signIn: () => {},
  signUp: () => {},
  signOut: async () => ({ error: null }),
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
  signInWithOtp: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
};

const AuthContext = createContext<AuthContextType>(defaultContext);

function InnerAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user: workosUser, loading: workosLoading, signOut: workosSignOut } = useWorkOSAuth();
  const [isConfigured, setIsConfigured] = useState<boolean>(
    Boolean(process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID)
  );

  useEffect(() => {
    // Verify server-side configuration status
    fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.isConfigured === 'boolean') {
          setIsConfigured(data.isConfigured);
        }
      })
      .catch(() => {
        // Fallback to client-side flag
        setIsConfigured(Boolean(process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID));
      });
  }, []);

  const normalizedUser = useMemo<AuthUser | null>(() => {
    if (!workosUser) return null;

    const fullName = [workosUser.firstName, workosUser.lastName].filter(Boolean).join(' ') || undefined;

    return {
      id: workosUser.id,
      email: workosUser.email || '',
      firstName: workosUser.firstName,
      lastName: workosUser.lastName,
      name: fullName,
      profilePictureUrl: workosUser.profilePictureUrl,
      user_metadata: {
        full_name: fullName,
        name: fullName,
        avatar_url: workosUser.profilePictureUrl,
      },
      raw: workosUser,
    };
  }, [workosUser]);

  const session = useMemo(() => {
    return normalizedUser ? { user: normalizedUser } : null;
  }, [normalizedUser]);

  const signIn = useCallback(() => {
    window.location.assign('/auth/login');
  }, []);

  const signUp = useCallback(() => {
    window.location.assign('/auth/signup');
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (workosSignOut) {
        await workosSignOut({ returnTo: '/login' });
      } else {
        window.location.assign('/auth/logout');
      }
      return { error: null };
    } catch {
      window.location.assign('/auth/logout');
      return { error: null };
    }
  }, [workosSignOut]);

  // Backward compatibility handlers
  const signInWithPassword = useCallback(async () => {
    signIn();
    return { error: null };
  }, [signIn]);

  const signUpWithPassword = useCallback(async () => {
    signUp();
    return { error: null, needsEmailConfirmation: false };
  }, [signUp]);

  const signInWithOtp = useCallback(async () => {
    signIn();
    return { error: null };
  }, [signIn]);

  const verifyOtp = useCallback(async () => {
    return { error: null };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user: normalizedUser,
    session,
    loading: workosLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    signInWithPassword,
    signUpWithPassword,
    signInWithOtp,
    verifyOtp,
  }), [
    normalizedUser,
    session,
    workosLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    signInWithPassword,
    signUpWithPassword,
    signInWithOtp,
    verifyOtp,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider>
      <InnerAuthProvider>
        {children}
      </InnerAuthProvider>
    </AuthKitProvider>
  );
}

export const useAuth = () => useContext(AuthContext);

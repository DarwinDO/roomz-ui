/**
 * Authentication Context for RommZ
 * Manages user authentication state and provides auth methods.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { auth as authClient, supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type UserProfile = Tables<'users'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>;
  signUp: (email: string, password: string, userData?: Record<string, unknown>) => Promise<{ user: User; session: Session }>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ user: User; session: Session }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsEmailVerified(!!nextSession?.user?.email_confirmed_at);

      if (nextSession?.user) {
        setTimeout(async () => {
          if (isMounted) {
            await fetchProfile(nextSession.user.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }

      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || isEmailVerified) {
      return;
    }

    const pollInterval = setInterval(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email_confirmed_at) {
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Email verified detected via polling');
      }

      setIsEmailVerified(true);
      setUser(currentUser);

      const { data: { session: nextSession } } = await supabase.auth.getSession();
      if (nextSession) {
        setSession(nextSession);
      }

      await fetchProfile(currentUser.id);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user, isEmailVerified]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await authClient.signIn(email, password);

    if (!data.user || !data.session) {
      throw new Error('Không nhận được thông tin đăng nhập');
    }

    return {
      user: data.user,
      session: data.session,
    };
  };

  const signUp = async (email: string, password: string, userData?: Record<string, unknown>) => {
    const data = await authClient.signUp(email, password, userData);

    if (!data.user) {
      throw new Error('Không nhận được thông tin tài khoản');
    }

    return {
      user: data.user,
      session: data.session || ({} as Session),
    };
  };

  const sendEmailOtp = async (email: string) => {
    await authClient.sendEmailOtp(email);
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const data = await authClient.verifyEmailOtp(email, token);

    if (!data.user || !data.session) {
      throw new Error('Không tạo được phiên đăng nhập sau khi xác thực mã');
    }

    return {
      user: data.user,
      session: data.session,
    };
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    await authClient.signInWithGoogle();
  };

  const refreshUser = async () => {
    try {
      const nextUser = await authClient.getUser();
      if (!nextUser) {
        return;
      }

      setUser(nextUser);
      setIsEmailVerified(!!nextUser.email_confirmed_at);
      await fetchProfile(nextUser.id);
    } catch (error) {
      console.error('Error in refreshUser:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    profile,
    isEmailVerified,
    signIn,
    signUp,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    signInWithGoogle,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

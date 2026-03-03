/**
 * Authentication Context for RoomZ
 * Manages user authentication state and provides auth methods
 * 
 * Best practices based on Supabase docs:
 * - Uses onAuthStateChange for real-time session updates
 * - Properly handles session persistence across page reloads
 * - Provides loading state during initial session check
 */

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';

// Type for user profile from database
export type UserProfile = Tables<'users'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isEmailVerified: boolean; // Trạng thái email verification
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>;
  signUp: (email: string, password: string, userData?: Record<string, unknown>) => Promise<{ user: User; session: Session }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>; // Force refresh user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    // Flag to track if component is mounted (for cleanup)
    let isMounted = true;

    // Listen for auth state changes (including email verification)
    // This is the primary way to get auth state - handles both initial load and changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Auth state changed, update session

      setSession(session);
      setUser(session?.user ?? null);

      // Update email verification status
      setIsEmailVerified(!!session?.user?.email_confirmed_at);

      // Handle profile updates on auth events
      if (session?.user) {
        // Use setTimeout to avoid blocking the auth state update
        // This prevents race conditions with Supabase's internal state
        setTimeout(async () => {
          if (isMounted) {
            await fetchProfile(session.user.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }

      // Set loading to false after initial session check
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for email verification polling
  // This avoids re-subscribing to auth changes when isEmailVerified changes
  useEffect(() => {
    // Only poll if user exists and email is not verified
    if (!user || isEmailVerified) return;

    const pollInterval = setInterval(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.email_confirmed_at) {
        // Email just got verified!
        if (import.meta.env.DEV) {
          console.log('Email verified detected via polling');
        }
        setIsEmailVerified(true);
        setUser(currentUser);

        // Refresh session to get updated data
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
        }

        // Refresh profile to sync email_verified status
        await fetchProfile(currentUser.id);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user, isEmailVerified]);

  // Fetch user profile from database
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Không nhận được thông tin user hoặc session');

    return { user: data.user, session: data.session };
  };

  const signUp = async (email: string, password: string, userData?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Không nhận được thông tin user');

    // Note: session might be null if email confirmation is required
    return {
      user: data.user,
      session: data.session || {} as Session
    };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local state
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  // Force refresh user data (useful after email verification)
  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error refreshing user:', error);
        return;
      }

      if (user) {
        setUser(user);
        setIsEmailVerified(!!user.email_confirmed_at);
        await fetchProfile(user.id);
      }
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
    signOut,
    signInWithGoogle,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

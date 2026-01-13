'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { getUserById } from '@/lib/supabase-api';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin' | 'shipping_provider') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      // Handle session errors (expired, invalid, etc.)
      if (sessionError) {
        console.error('Session error:', sessionError);
        setSession(null);
        setSupabaseUser(null);
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Auth session:', currentSession ? 'exists' : 'null');
      setSession(currentSession);
      setSupabaseUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        console.log('User ID:', currentSession.user.id);

        // Fetch user profile from users table
        let profile = await getUserById(currentSession.user.id);
        console.log('User profile:', profile);

        if (profile) {
          setUser(profile);
        } else {
          // If profile doesn't exist, create it from auth metadata
          console.log('Creating user profile with metadata:', currentSession.user.user_metadata);

          // Get role from metadata, default to 'buyer' if not set
          const userRole = currentSession.user.user_metadata?.role || 'buyer';
          const userName = currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User';

          // Use upsert to handle race conditions
          const { data: profileData, error } = await supabase
            .from('users')
            .upsert({
              id: currentSession.user.id,
              email: currentSession.user.email!,
              name: userName,
              role: userRole,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (error) {
            // Log detailed error information
            const errorDetails = {
              message: error?.message || 'Unknown error',
              code: error?.code || 'NO_CODE',
              details: error?.details || null,
              hint: error?.hint || null,
              fullError: JSON.stringify(error, null, 2),
            };
            console.error('Error creating/updating user profile:', errorDetails);
            console.error('Full error object:', error);

            // If it's a permission error, the trigger should have created it
            // Try fetching again after a short delay
            if (error?.code === '42501' || error?.code === 'PGRST301') {
              console.log('Permission error detected, waiting for trigger to complete...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              const retryProfile = await getUserById(currentSession.user.id);
              if (retryProfile) {
                console.log('Profile found after retry:', retryProfile);
                setUser(retryProfile);
              }
            }
          } else if (profileData) {
            console.log('Created/updated user profile:', profileData);
            setUser(profileData);
          } else {
            console.warn('No profile data returned from upsert, but no error either');
            // Try fetching the profile one more time
            const retryProfile = await getUserById(currentSession.user.id);
            if (retryProfile) {
              setUser(retryProfile);
            }
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setSession(null);
      setSupabaseUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safety timeout - if auth check takes more than 10 seconds, stop loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing loading to stop');
        setLoading(false);
        setUser(null);
        setSession(null);
        setSupabaseUser(null);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    refreshUser().finally(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      // Handle specific auth events
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setSession(null);
        setSupabaseUser(null);
        setLoading(false);
        return;
      } else if (event === 'USER_UPDATED') {
        console.log('User updated');
      }

      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        await refreshUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Set up automatic session refresh every 50 minutes (tokens expire in 1 hour)
    const refreshInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        console.log('Refreshing session...');
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Session refresh failed:', error);
          // Force logout if session refresh fails
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
        } else {
          console.log('Session refreshed successfully');
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      clearTimeout(timeoutId);
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin' | 'shipping_provider') => {
    try {
      console.log('Starting signup with:', { email, name, role });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup failed:', error);
        return { error };
      }

      // Wait for trigger to create user profile, then refresh
      // The trigger function (handle_new_user) will automatically create the profile
      // If trigger fails, refreshUser will create it via upsert
      if (data.user) {
        console.log('User created, waiting for profile creation...');
        // Wait a bit longer for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshUser();
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    await refreshUser();
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


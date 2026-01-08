/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Handles user sign in, sign up, sign out, and profile management.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getCurrentProfile, isProUser } from '../lib/supabase';
import type { Profile } from '../types/database';

// Feature limits configuration
export const FEATURE_LIMITS = {
  FREE_WEEKLY_PREDICTIONS: 10,
  FREE_DETAILED_FORECAST_TRIES: 3,
  FREE_HISTORY_DAYS: 7,
} as const;

interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;

  // Usage tracking
  weeklyPredictionsUsed: number;
  detailedForecastsUsed: number; // Trial usage for free users
  remainingWeeklyPredictions: number;
  remainingDetailedForecasts: number;

  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;

  // Refresh methods
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  // Usage state
  const [weeklyPredictionsUsed, setWeeklyPredictionsUsed] = useState(0);
  const [detailedForecastsUsed, setDetailedForecastsUsed] = useState(0);

  // Calculate remaining predictions
  const remainingWeeklyPredictions = isPro
    ? 999 // Unlimited for pro
    : FEATURE_LIMITS.FREE_WEEKLY_PREDICTIONS - weeklyPredictionsUsed;

  const remainingDetailedForecasts = isPro
    ? 999 // Unlimited for pro
    : FEATURE_LIMITS.FREE_DETAILED_FORECAST_TRIES - (profile?.trial_detailed_forecasts_used || 0);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet (trigger hasn't fired)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Fetch weekly usage
  const fetchUsage = async () => {
    try {
      const { data, error } = await supabase.rpc('get_weekly_usage', {
        user_id: user?.id,
        action_type: null,
      });

      if (error) throw error;
      return data || 0;
    } catch (err) {
      console.error('Error fetching usage:', err);
      return 0;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const userProfile = await fetchProfile(initialSession.user.id);
          setProfile(userProfile);
          setIsPro(userProfile?.subscription_tier === 'pro' && userProfile?.subscription_status === 'active');
          setDetailedForecastsUsed(userProfile?.trial_detailed_forecasts_used || 0);

          const usage = await fetchUsage();
          setWeeklyPredictionsUsed(usage);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id);
          setProfile(userProfile);
          setIsPro(userProfile?.subscription_tier === 'pro' && userProfile?.subscription_status === 'active');
          setDetailedForecastsUsed(userProfile?.trial_detailed_forecasts_used || 0);

          const usage = await fetchUsage();
          setWeeklyPredictionsUsed(usage);
        } else {
          setProfile(null);
          setIsPro(false);
          setWeeklyPredictionsUsed(0);
          setDetailedForecastsUsed(0);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsPro(false);
    setWeeklyPredictionsUsed(0);
    setDetailedForecastsUsed(0);
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);

    // Update isPro status if subscription changed
    if (updates.subscription_tier || updates.subscription_status) {
      setIsPro(data.subscription_tier === 'pro' && data.subscription_status === 'active');
    }

    return data;
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
      setIsPro(userProfile.subscription_tier === 'pro' && userProfile.subscription_status === 'active');
      setDetailedForecastsUsed(userProfile.trial_detailed_forecasts_used || 0);
    }

    const usage = await fetchUsage();
    setWeeklyPredictionsUsed(usage);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isPro,
    weeklyPredictionsUsed,
    detailedForecastsUsed,
    remainingWeeklyPredictions,
    remainingDetailedForecasts,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

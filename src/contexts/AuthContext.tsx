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
  isEmailVerified: boolean;

  // Usage tracking
  weeklyPredictionsUsed: number;
  detailedForecastsUsed: number; // Trial usage for free users
  remainingWeeklyPredictions: number;
  remainingDetailedForecasts: number;

  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;

  // Email verification
  resendVerificationEmail: () => Promise<void>;

  // Password reset
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;

  // Refresh methods
  refreshProfile: () => Promise<void>;

  // Usage logging
  logUsage: (action: 'standard_prediction' | 'detailed_prediction' | 'backtest') => Promise<void>;
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
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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
    if (!user) return 0;

    try {
      const { data, error } = await supabase.rpc('get_weekly_usage', {
        user_id: user.id,
        action_type: null,
      });

      if (error) return 0;
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
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Auth session error:', sessionError);
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsEmailVerified(initialSession?.user?.email_confirmed_at ? true : false);

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
        // Always set loading to false, even if there was an error
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsEmailVerified(newSession?.user?.email_confirmed_at ? true : false);

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
          setIsEmailVerified(false);
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    // Return whether email verification is needed
    return {
      needsVerification: !data.session && data.user?.email_confirmed_at === null,
    };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsPro(false);
    setIsEmailVerified(false);
    setWeeklyPredictionsUsed(0);
    setDetailedForecastsUsed(0);
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  // Update password (for authenticated users)
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
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

  // Log usage action and refresh stats
  const logUsage = async (action: 'standard_prediction' | 'detailed_prediction' | 'backtest') => {
    if (!user) return;

    try {
      // Log the usage action using the database function
      const { error } = await supabase.rpc('log_usage', {
        p_action: action,
        p_user_id: user.id,
      });

      if (error) {
        console.warn('Failed to log usage:', error);
      }

      // For detailed forecasts, also increment trial usage
      if (action === 'detailed_prediction' && !isPro) {
        const { error: incrementError } = await supabase.rpc('increment_trial_usage', {
          p_user_id: user.id,
        });

        if (!incrementError) {
          // Refresh profile to get updated trial count
          const userProfile = await fetchProfile(user.id);
          if (userProfile) {
            setDetailedForecastsUsed(userProfile.trial_detailed_forecasts_used || 0);
          }
        }
      }

      // Refresh usage stats
      const usage = await fetchUsage();
      setWeeklyPredictionsUsed(usage);
    } catch (err) {
      console.error('Error logging usage:', err);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isPro,
    isEmailVerified,
    weeklyPredictionsUsed,
    detailedForecastsUsed,
    remainingWeeklyPredictions,
    remainingDetailedForecasts,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resendVerificationEmail,
    requestPasswordReset,
    updatePassword,
    refreshProfile,
    logUsage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

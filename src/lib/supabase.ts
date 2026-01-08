/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client for authentication and database operations.
 * Falls back to demo mode if credentials are not configured.
 */

import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Flag to track if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Mock subscription class for demo mode
class MockSubscription {
  unsubscribe = () => {};
}

// Create a minimal mock client for demo mode
const createMockClient = () => {
  console.warn('Supabase not configured. Running in demo mode.');

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.') }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.') }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (_callback: any) => {
        return { data: { subscription: new MockSubscription() } };
      },
    },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { code: 'PGRST116' } }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      }),
      insert: async () => ({ error: null }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
    rpc: async () => ({ data: 0, error: null }),
  };
};

// Create Supabase client
const realClient = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
}) : null;

export const supabase = realClient ?? createMockClient();

// Database types are imported from types/database.ts
export type { Database } from '../types/database';

// Helper function to get current user
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get current user's profile
export const getCurrentProfile = async () => {
  if (!isSupabaseConfigured) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // If profile doesn't exist, it might be because the trigger hasn't fired yet
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
};

// Helper function to check if user is on Pro tier
export const isProUser = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  const profile = await getCurrentProfile();
  return profile?.subscription_tier === 'pro' &&
         profile?.subscription_status === 'active';
};

// Helper function to get weekly usage
export const getWeeklyUsage = async (action?: string): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const user = await getCurrentUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc('get_weekly_usage', {
    user_id: user.id,
    action_type: action || null,
  });

  if (error) return 0;
  return data || 0;
};

// Helper function to log usage
export const logUsage = async (action: 'standard_prediction' | 'detailed_prediction' | 'backtest') => {
  if (!isSupabaseConfigured) return;
  const user = await getCurrentUser();
  if (!user) return;

  // Get Monday of current week
  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);

  const { error } = await supabase.from('usage_logs').insert({
    user_id: user.id,
    action,
    week_start: weekStart.toISOString(),
  });

  if (error) console.error('Failed to log usage:', error);
};

export default supabase;

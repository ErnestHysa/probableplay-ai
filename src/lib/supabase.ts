/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client for authentication and database operations.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Please add it to your .env.local file.\n' +
    'Get it from: https://supabase.com/dashboard/project/_/settings/api'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Please add it to your .env.local file.\n' +
    'Get it from: https://supabase.com/dashboard/project/_/settings/api'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store auth sessions in localStorage
    storage: window.localStorage,
    // Persist session across page refreshes
    persistSession: true,
    // Detect when session expires
    detectSessionInUrl: true,
    // Auto-refresh token before it expires
    autoRefreshToken: true,
  },
});

// Database types are imported from types/database.ts
export type { Database } from '../types/database';

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get current user's profile
export const getCurrentProfile = async () => {
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
  const profile = await getCurrentProfile();
  return profile?.subscription_tier === 'pro' &&
         profile?.subscription_status === 'active';
};

// Helper function to get weekly usage
export const getWeeklyUsage = async (action?: string): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc('get_weekly_usage', {
    user_id: user.id,
    action_type: action || null,
  });

  if (error) throw error;
  return data || 0;
};

// Helper function to log usage
export const logUsage = async (action: 'standard_prediction' | 'detailed_prediction' | 'backtest') => {
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

  if (error) throw error;
};

export default supabase;

/**
 * Database Types
 *
 * TypeScript types generated from Supabase database schema.
 * These match the tables defined in supabase/migrations/001_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type PredictionType = 'standard' | 'detailed' | 'backtest';
export type UsageAction = 'standard_prediction' | 'detailed_prediction' | 'backtest';

// Database table types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          subscription_tier: SubscriptionTier;
          subscription_status: SubscriptionStatus | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_detailed_forecasts_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_detailed_forecasts_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_detailed_forecasts_used?: number;
          updated_at?: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          match_data: Json;
          prediction_type: PredictionType;
          prediction_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          match_data: Json;
          prediction_type: PredictionType;
          prediction_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          match_data?: Json;
          prediction_type?: PredictionType;
          prediction_data?: Json;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action: UsageAction;
          week_start: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: UsageAction;
          week_start: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: UsageAction;
          week_start?: string;
        };
      };
    };
    Functions: {
      get_weekly_usage: {
        Args: {
          user_id: string;
          action_type: UsageAction | null;
        };
        Returns: number;
      };
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Prediction = Database['public']['Tables']['predictions']['Row'];
export type UsageLog = Database['public']['Tables']['usage_logs']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type PredictionInsert = Database['public']['Tables']['predictions']['Insert'];
export type UsageLogInsert = Database['public']['Tables']['usage_logs']['Insert'];

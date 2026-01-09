-- ============================================
-- ProbablePlay AI - Database Schema
-- ============================================
-- Run this in Supabase SQL Editor to set up the database
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends auth.users with subscription and usage data
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,

  -- Subscription fields
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Usage tracking for free tier
  trial_detailed_forecasts_used INTEGER DEFAULT 0 CHECK (trial_detailed_forecasts_used >= 0 AND trial_detailed_forecasts_used <= 3),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREDICTIONS TABLE
-- Stores all AI predictions made by users
-- ============================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Match information
  match_id TEXT NOT NULL,
  match_data JSONB NOT NULL,

  -- Prediction type and result
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('standard', 'detailed', 'backtest')),
  prediction_data JSONB NOT NULL,

  -- Accuracy tracking (updated when match completes)
  is_correct BOOLEAN,
  actual_result JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_predictions_user_created ON public.predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON public.predictions(prediction_type);

-- ============================================
-- USAGE LOGS TABLE
-- Tracks weekly usage for limit enforcement
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Action type
  action TEXT NOT NULL CHECK (action IN ('standard_prediction', 'detailed_prediction', 'backtest')),

  -- Week start date (Monday) for grouping
  week_start DATE NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for weekly usage queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_week ON public.usage_logs(user_id, week_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_logs_unique ON public.usage_logs(user_id, action, week_start);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Predictions policies
DROP POLICY IF EXISTS "Users can view own predictions" ON public.predictions;
CREATE POLICY "Users can view own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own predictions" ON public.predictions;
CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own predictions" ON public.predictions;
CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own predictions" ON public.predictions;
CREATE POLICY "Users can delete own predictions" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);

-- Usage logs policies
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.usage_logs;
CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Get Weekly Usage
-- Returns the count of actions for a user in the current week
-- ============================================
CREATE OR REPLACE FUNCTION public.get_weekly_usage(
  p_user_id UUID DEFAULT NULL,
  p_action_type TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_week_start DATE;
  v_usage_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get Monday of current week
  v_week_start := date_trunc('week', CURRENT_DATE);

  IF p_action_type IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.usage_logs
    WHERE user_id = v_user_id
      AND action = p_action_type
      AND week_start = v_week_start;
  ELSE
    SELECT COUNT(*) INTO v_usage_count
    FROM public.usage_logs
    WHERE user_id = v_user_id
      AND week_start = v_week_start;
  END IF;

  RETURN COALESCE(v_usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Log Usage
-- Logs a usage action for a user
-- ============================================
CREATE OR REPLACE FUNCTION public.log_usage(
  p_action TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_week_start DATE;
  v_log_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get Monday of current week
  v_week_start := date_trunc('week', CURRENT_DATE);

  -- Insert usage log (ignore if already exists for this week)
  INSERT INTO public.usage_logs (user_id, action, week_start)
  VALUES (v_user_id, p_action, v_week_start)
  ON CONFLICT (user_id, action, week_start) DO NOTHING
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Increment Trial Usage
-- Increments the trial detailed forecasts counter
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_trial_usage(
  p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_current_count INTEGER;
  v_new_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get current count
  SELECT COALESCE(trial_detailed_forecasts_used, 0) INTO v_current_count
  FROM public.profiles
  WHERE id = v_user_id;

  -- Increment and update
  v_new_count := v_current_count + 1;

  UPDATE public.profiles
  SET trial_detailed_forecasts_used = v_new_count,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- Trigger to create profile when user signs up
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- Automatically updates the updated_at column
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_predictions_updated_at ON public.predictions;
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.predictions TO authenticated;
GRANT ALL ON public.usage_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_usage(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_trial_usage(UUID) TO authenticated;

-- ============================================
-- HELPER VIEWS (for easier querying)
-- ============================================

-- View for user prediction history with accuracy
CREATE OR REPLACE VIEW user_prediction_history AS
SELECT
  p.id,
  p.user_id,
  p.match_id,
  p.match_data->>'homeTeam' as home_team,
  p.match_data->>'awayTeam' as away_team,
  p.match_data->>'league' as league,
  p.prediction_type,
  p.prediction_data,
  p.is_correct,
  p.actual_result,
  p.created_at
FROM public.predictions p;

-- View for user weekly stats
CREATE OR REPLACE VIEW user_weekly_stats AS
SELECT
  ul.user_id,
  ul.week_start,
  COUNT(*) FILTER (WHERE ul.action = 'standard_prediction') as standard_predictions,
  COUNT(*) FILTER (WHERE ul.action = 'detailed_prediction') as detailed_predictions,
  COUNT(*) FILTER (WHERE ul.action = 'backtest') as backtests
FROM public.usage_logs ul
GROUP BY ul.user_id, ul.week_start;

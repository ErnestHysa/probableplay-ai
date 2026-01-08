-- ============================================
-- ProbablePlay AI - Database Schema
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  trial_detailed_forecasts_used INTEGER DEFAULT 0 CHECK (trial_detailed_forecasts_used >= 0 AND trial_detailed_forecasts_used <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table (stores all user predictions)
CREATE TABLE public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  match_data JSONB NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('standard', 'detailed', 'backtest')),
  prediction_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_predictions_user_created ON public.predictions(user_id, created_at DESC);
CREATE INDEX idx_predictions_match_id ON public.predictions(match_id);

-- Usage logs table (for weekly prediction limits)
CREATE TABLE public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('standard_prediction', 'detailed_prediction', 'backtest')),
  week_start DATE NOT NULL, -- Monday of the week
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for weekly usage queries
CREATE INDEX idx_usage_logs_user_week ON public.usage_logs(user_id, week_start);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for predictions
CREATE POLICY "Users can view own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create profile on user signup
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

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get weekly usage count
CREATE OR REPLACE FUNCTION public.get_weekly_usage(user_id UUID, action_type TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
  current_week_start DATE;
BEGIN
  -- Get Monday of current week
  current_week_start := date_trunc('week', CURRENT_DATE);

  IF action_type IS NULL THEN
    SELECT COUNT(*) INTO usage_count
    FROM public.usage_logs
    WHERE user_id = $1
      AND week_start = current_week_start;
  ELSE
    SELECT COUNT(*) INTO usage_count
    FROM public.usage_logs
    WHERE user_id = $1
      AND action = action_type
      AND week_start = current_week_start;
  END IF;

  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.predictions TO authenticated;
GRANT ALL ON public.usage_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_usage(UUID, TEXT) TO authenticated;

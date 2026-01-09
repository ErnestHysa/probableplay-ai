/**
 * Prediction Storage Service
 *
 * Handles storing predictions to Supabase database.
 * Falls back to localStorage for demo mode or unauthenticated users.
 *
 * This service is called after predictions are generated to:
 * 1. Store predictions in the database for authenticated users
 * 2. Log usage actions for limit tracking
 * 3. Sync with localStorage for offline/demo access
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { Match, PredictionResult, DetailedForecastResult, PredictionType } from '../types';
import type { PredictionInsert } from '../src/types/database';

export interface StorageResult {
  success: boolean;
  error?: string;
  predictionId?: string;
  usageRemaining?: number;
}

/**
 * Get Monday of the current week for usage tracking
 */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
  now.setDate(diff);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/**
 * Store a prediction in Supabase
 */
export async function storePrediction(
  match: Match,
  prediction: PredictionResult | DetailedForecastResult,
  type: PredictionType,
  userId?: string
): Promise<StorageResult> {
  // If Supabase is not configured, fall back to localStorage only
  if (!isSupabaseConfigured) {
    console.log('Supabase not configured. Prediction will only be stored in localStorage.');
    return { success: true };
  }

  try {
    // Get current user if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('User not authenticated. Prediction will only be stored in localStorage.');
        return { success: true };
      }
      currentUserId = user.id;
    }

    // Determine prediction type for database
    const predictionType = type === 'STANDARD' ? 'standard' : 'detailed';

    // Prepare match data for JSONB storage
    const matchData = {
      id: match.id,
      sport: match.sport,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startTime: match.startTime,
      status: match.status,
      score: match.score,
      minute: match.minute,
    };

    // Prepare prediction data
    const predictionData = type === 'STANDARD'
      ? {
          probabilities: (prediction as PredictionResult).probabilities,
          summary: (prediction as PredictionResult).summary,
          detailedAnalysis: (prediction as PredictionResult).detailedAnalysis,
          keyFactors: (prediction as PredictionResult).keyFactors,
          sources: (prediction as PredictionResult).sources,
          lastUpdated: (prediction as PredictionResult).lastUpdated,
        }
      : {
          predictedScore: (prediction as DetailedForecastResult).predictedScore,
          totalGoals: (prediction as DetailedForecastResult).totalGoals,
          firstTeamToScore: (prediction as DetailedForecastResult).firstTeamToScore,
          halfTimeWinner: (prediction as DetailedForecastResult).halfTimeWinner,
          secondHalfWinner: (prediction as DetailedForecastResult).secondHalfWinner,
          likelyScorers: (prediction as DetailedForecastResult).likelyScorers,
          scoringMethodProbabilities: (prediction as DetailedForecastResult).scoringMethodProbabilities,
          redCards: (prediction as DetailedForecastResult).redCards,
          confidenceScore: (prediction as DetailedForecastResult).confidenceScore,
          reasoning: (prediction as DetailedForecastResult).reasoning,
        };

    // Insert prediction into database
    const { data: predictionDataResult, error: insertError } = await supabase
      .from('predictions')
      .insert({
        user_id: currentUserId,
        match_id: match.id,
        match_data: matchData,
        prediction_type: predictionType,
        prediction_data: predictionData,
      } as PredictionInsert)
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to store prediction:', insertError);
      return { success: false, error: insertError.message };
    }

    // Log usage action
    const actionType = type === 'STANDARD' ? 'standard_prediction' : 'detailed_prediction';
    const weekStart = getWeekStart();

    const { error: usageError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: currentUserId,
        action: actionType,
        week_start: weekStart,
      })
      .onConflict('user_id, action, week_start')
      .ignore(); // Don't error if already logged this week

    if (usageError) {
      console.warn('Failed to log usage:', usageError);
    }

    // Get updated usage count
    const { data: usageData } = await supabase.rpc('get_weekly_usage', {
      p_user_id: currentUserId,
      p_action_type: actionType,
    });

    const weeklyLimit = type === 'STANDARD' ? 10 : null; // 10 for standard, unlimited for pro detailed
    const usageRemaining = weeklyLimit !== null ? Math.max(0, weeklyLimit - (usageData || 0)) : undefined;

    return {
      success: true,
      predictionId: predictionDataResult?.id,
      usageRemaining,
    };
  } catch (error) {
    console.error('Prediction storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch user's prediction history from Supabase
 */
export async function fetchPredictionHistory(userId?: string): Promise<{
  success: boolean;
  predictions?: Array<{
    id: string;
    match: Match;
    predictionType: 'standard' | 'detailed';
    prediction: PredictionResult | DetailedForecastResult;
    createdAt: string;
  }>;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: true, predictions: [] };
  }

  try {
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform database rows to our app format
    const predictions = (data || []).map((row: any) => ({
      id: row.id,
      match: row.match_data as Match,
      predictionType: row.prediction_type,
      prediction: row.prediction_data as PredictionResult | DetailedForecastResult,
      createdAt: row.created_at,
    }));

    return { success: true, predictions };
  } catch (error) {
    console.error('Fetch history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's current usage statistics
 */
export async function getUserUsageStats(userId?: string): Promise<{
  success: boolean;
  stats?: {
    standardPredictionsUsed: number;
    detailedPredictionsUsed: number;
    backtestsUsed: number;
    trialDetailedUsed: number;
    weekStart: string;
  };
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      stats: {
        standardPredictionsUsed: 0,
        detailedPredictionsUsed: 0,
        backtestsUsed: 0,
        trialDetailedUsed: 0,
        weekStart: getWeekStart(),
      },
    };
  }

  try {
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }
      currentUserId = user.id;
    }

    // Get weekly usage from RPC function
    const [standardResult, detailedResult, backtestResult] = await Promise.all([
      supabase.rpc('get_weekly_usage', {
        p_user_id: currentUserId,
        p_action_type: 'standard_prediction',
      }),
      supabase.rpc('get_weekly_usage', {
        p_user_id: currentUserId,
        p_action_type: 'detailed_prediction',
      }),
      supabase.rpc('get_weekly_usage', {
        p_user_id: currentUserId,
        p_action_type: 'backtest',
      }),
    ]);

    // Get profile for trial usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_detailed_forecasts_used')
      .eq('id', currentUserId)
      .single();

    return {
      success: true,
      stats: {
        standardPredictionsUsed: standardResult.data || 0,
        detailedPredictionsUsed: detailedResult.data || 0,
        backtestsUsed: backtestResult.data || 0,
        trialDetailedUsed: profile?.trial_detailed_forecasts_used || 0,
        weekStart: getWeekStart(),
      },
    };
  } catch (error) {
    console.error('Get usage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user can make a prediction based on their tier and usage
 */
export async function canMakePrediction(
  type: 'standard' | 'detailed' | 'backtest',
  userId?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  usageRemaining?: number;
}> {
  if (!isSupabaseConfigured) {
    // In demo mode, allow all predictions
    return { allowed: true };
  }

  try {
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { allowed: true }; // Allow for demo mode
      }
      currentUserId = user.id;
    }

    // Get user profile to check subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, trial_detailed_forecasts_used')
      .eq('id', currentUserId)
      .single();

    const isPro = profile?.subscription_tier === 'pro' &&
                  profile?.subscription_status === 'active';

    if (type === 'backtest' && !isPro) {
      return {
        allowed: false,
        reason: 'Backtesting is only available for Pro subscribers. Upgrade to unlock this feature!',
      };
    }

    // For detailed predictions, check trial usage for free users
    if (type === 'detailed' && !isPro) {
      const trialUsed = profile?.trial_detailed_forecasts_used || 0;
      const trialLimit = 3;
      if (trialUsed >= trialLimit) {
        return {
          allowed: false,
          reason: `You've used all ${trialLimit} free detailed forecasts. Upgrade to Pro for unlimited access!`,
        };
      }
      return {
        allowed: true,
        usageRemaining: trialLimit - trialUsed,
      };
    }

    // For standard predictions, check weekly limit for free users
    if (type === 'standard' && !isPro) {
      const { data: usage } = await supabase.rpc('get_weekly_usage', {
        p_user_id: currentUserId,
        p_action_type: 'standard_prediction',
      });
      const weeklyLimit = 10;
      const used = usage || 0;
      if (used >= weeklyLimit) {
        return {
          allowed: false,
          reason: `You've reached the weekly limit of ${weeklyLimit} standard predictions. Upgrade to Pro for unlimited access!`,
        };
      }
      return {
        allowed: true,
        usageRemaining: weeklyLimit - used,
      };
    }

    // Pro users have unlimited access
    return { allowed: true };
  } catch (error) {
    console.error('Check prediction allowance error:', error);
    return { allowed: true }; // Allow on error to prevent blocking
  }
}

/**
 * Increment trial usage for detailed forecasts
 */
export async function incrementTrialUsage(userId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return false;
      currentUserId = user.id;
    }

    const { error } = await supabase.rpc('increment_trial_usage', {
      p_user_id: currentUserId,
    });

    return !error;
  } catch (error) {
    console.error('Increment trial usage error:', error);
    return false;
  }
}

/**
 * Delete a prediction from history
 */
export async function deletePrediction(predictionId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', predictionId);

    return !error;
  } catch (error) {
    console.error('Delete prediction error:', error);
    return false;
  }
}

/**
 * Clear all prediction history for a user
 */
export async function clearHistory(userId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return false;
      currentUserId = user.id;
    }

    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('user_id', currentUserId);

    return !error;
  } catch (error) {
    console.error('Clear history error:', error);
    return false;
  }
}

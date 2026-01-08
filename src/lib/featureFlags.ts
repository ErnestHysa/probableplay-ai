/**
 * Feature Flag Utilities
 *
 * Checks user permissions for accessing various features.
 */

import { useAuth } from '../contexts/AuthContext';

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

/**
 * Check if user can make a standard prediction
 */
export const canMakeStandardPrediction = (): FeatureCheckResult => {
  // This hook-based approach allows usage from components
  // For non-component usage, pass auth state as parameter
  return { allowed: true };
};

/**
 * Check if user can make a detailed forecast
 */
export const canMakeDetailedForecast = (profile: any, remaining: number): FeatureCheckResult => {
  if (!profile) {
    return { allowed: false, reason: 'Please sign in to use this feature' };
  }

  // Pro users have unlimited access
  if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') {
    return { allowed: true };
  }

  // Free users have 3 trial uses
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'You have used your 3 free detailed forecasts. Upgrade to Pro for unlimited access.',
      upgradeRequired: true,
    };
  }

  return { allowed: true };
};

/**
 * Check if user can access backtesting
 */
export const canAccessBacktesting = (profile: any): FeatureCheckResult => {
  if (!profile) {
    return { allowed: false, reason: 'Please sign in to use this feature' };
  }

  if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Backtesting is a Pro feature. Upgrade to unlock unlimited backtesting.',
    upgradeRequired: true,
  };
};

/**
 * Check if user can access advanced statistics
 */
export const canAccessAdvancedStats = (profile: any): FeatureCheckResult => {
  if (!profile) {
    return { allowed: false, reason: 'Please sign in to view statistics' };
  }

  if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Advanced statistics are available for Pro users.',
    upgradeRequired: true,
  };
};

/**
 * Check if user can export data
 */
export const canExportData = (profile: any): FeatureCheckResult => {
  if (!profile) {
    return { allowed: false, reason: 'Please sign in to export data' };
  }

  if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Data export is available for Pro users.',
    upgradeRequired: true,
  };
};

/**
 * Get history retention days based on subscription tier
 */
export const getHistoryRetentionDays = (profile: any): number => {
  if (!profile) return 7; // Non-authenticated users get 7 days
  if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') return -1; // -1 = forever
  return 7; // Free tier = 7 days
};

/**
 * Hook for feature checks (to be used in components)
 */
export const useFeatureFlags = () => {
  const { profile, remainingWeeklyPredictions, remainingDetailedForecasts } = useAuth();

  return {
    canMakeStandardPrediction: () => {
      if (!profile) return { allowed: true }; // Allow non-auth for now
      if (remainingWeeklyPredictions <= 0) {
        return {
          allowed: false,
          reason: 'Weekly prediction limit reached. Upgrade to Pro for unlimited predictions.',
          upgradeRequired: true,
        };
      }
      return { allowed: true };
    },

    canMakeDetailedForecast: () =>
      canMakeDetailedForecast(profile, remainingDetailedForecasts),

    canAccessBacktesting: () =>
      canAccessBacktesting(profile),

    canAccessAdvancedStats: () =>
      canAccessAdvancedStats(profile),

    canExportData: () =>
      canExportData(profile),

    getHistoryRetentionDays: () =>
      getHistoryRetentionDays(profile),
  };
};

export default useFeatureFlags;

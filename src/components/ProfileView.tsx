/**
 * Profile View
 *
 * Shows user profile, subscription status, and usage statistics.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Calendar, Trophy, Zap, LogOut, ChevronRight, Lock } from 'lucide-react';

interface ProfileViewProps {
  onNavigate?: (view: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const {
    profile,
    user,
    signOut,
    isPro,
    weeklyPredictionsUsed,
    detailedForecastsUsed,
    remainingWeeklyPredictions,
    refreshProfile,
    isAuthenticated,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMemberSince = () => {
    if (profile?.created_at) {
      return formatDate(profile.created_at);
    }
    return 'Unknown';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Guest State */}
      {!isAuthenticated && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In to View Your Profile</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Manage your account settings, view your subscription status, and track your usage statistics.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/auth/signin"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/auth/signup"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      )}

      {isAuthenticated && (
      <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400">Manage your account and subscription</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isPro
              ? 'bg-gradient-to-br from-orange-500 to-red-500'
              : 'bg-gradient-to-br from-slate-600 to-slate-700'
          }`}>
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {profile?.full_name || 'User'}
            </h2>
            <p className="text-slate-400 text-sm flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            isPro
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'bg-slate-700 text-slate-300'
          }`}>
            {isPro ? 'PRO' : 'FREE'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Member Since</p>
              <p className="text-white font-medium">{getMemberSince()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Weekly Predictions</p>
              <p className="text-white font-medium">
                {weeklyPredictionsUsed} / {isPro ? '∞' : '10'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Detailed Forecasts</p>
              <p className="text-white font-medium">
                {detailedForecastsUsed} / {isPro ? '∞' : '3'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className={`rounded-2xl p-6 border mb-6 ${
        isPro
          ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30'
          : 'bg-slate-800/50 border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Subscription</h3>
          {isPro && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>

        {isPro ? (
          <div className="space-y-3">
            <p className="text-slate-300">
              You're a <span className="text-orange-400 font-semibold">Pro</span> member with unlimited access to all features.
            </p>
            <button
              onClick={() => onNavigate?.('pricing')}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              Manage subscription <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-300">
              Upgrade to <span className="text-orange-400 font-semibold">Pro</span> for unlimited predictions, backtesting, and advanced analytics.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate?.('pricing')}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
              </button>
              <span className="text-slate-500 text-sm flex items-center">
                $9/month or $90/year
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-3 text-red-400">
            <LogOut className="w-5 h-5" />
            Sign Out
          </span>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Usage Warning (Free tier with low remaining) */}
      {!isPro && remainingWeeklyPredictions <= 3 && remainingWeeklyPredictions > 0 && (
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <p className="text-orange-400 text-sm">
            <strong>{remainingWeeklyPredictions} predictions remaining</strong> this week.
            Upgrade to Pro for unlimited predictions.
          </p>
        </div>
      )}

      {!isPro && remainingWeeklyPredictions === 0 && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">
            <strong>Weekly limit reached.</strong> Upgrade to Pro to continue making predictions.
          </p>
          <button
            onClick={() => onNavigate?.('pricing')}
            className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Upgrade Now
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ProfileView;

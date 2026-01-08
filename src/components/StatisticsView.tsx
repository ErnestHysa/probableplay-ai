/**
 * Statistics View
 *
 * Advanced statistics dashboard for Pro users.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Target, Trophy, Zap, Lock } from 'lucide-react';
import { getHistoryRetentionDays } from '../lib/featureFlags';

interface StatisticsViewProps {
  onNavigate?: (view: string) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ onNavigate }) => {
  const { isPro, profile, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Mock statistics for now (will be calculated from real data)
  const stats = {
    overallAccuracy: 0,
    totalPredictions: 0,
    correctPredictions: 0,
    bestStreak: 0,
    currentStreak: 0,
    bySport: {
      football: { total: 0, correct: 0, accuracy: 0 },
      nba: { total: 0, correct: 0, accuracy: 0 },
    },
    byType: {
      standard: { total: 0, correct: 0, accuracy: 0 },
      detailed: { total: 0, correct: 0, accuracy: 0 },
    },
    recentForm: [] as { date: string; correct: boolean; match: string }[],
  };

  useEffect(() => {
    // TODO: Calculate real statistics from prediction history
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Guest State - Not authenticated */}
      {!isAuthenticated && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pro Feature: Advanced Statistics</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Track your prediction accuracy over time, analyze performance by sport, and see detailed insights. Available exclusively for Pro subscribers.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/auth/signin"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Zap size={18} /> Upgrade to Pro
            </Link>
          </div>
        </div>
      )}

      {/* Free User State - Authenticated but not Pro */}
      {isAuthenticated && !isPro && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro for Advanced Statistics</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Track your prediction accuracy over time, analyze performance by sport, and see detailed insights about your betting patterns.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-colors font-medium"
          >
            <Zap size={18} /> Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Full Statistics Interface - Pro users only */}
      {isAuthenticated && isPro && (
      <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Advanced Statistics</h1>
          <p className="text-slate-400">Track your prediction accuracy over time</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-full">
          <Zap size={16} />
          PRO FEATURE
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Overall Accuracy</p>
          <p className="text-3xl font-bold text-white">{stats.overallAccuracy}%</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
            <Trophy className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Total Predictions</p>
          <p className="text-3xl font-bold text-white">{stats.totalPredictions}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Best Streak</p>
          <p className="text-3xl font-bold text-white">{stats.bestStreak}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Accuracy by Sport */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Accuracy by Sport</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Football</span>
                <span className="text-white font-medium">{stats.bySport.football.accuracy}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.bySport.football.accuracy}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">NBA</span>
                <span className="text-white font-medium">{stats.bySport.nba.accuracy}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.bySport.nba.accuracy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy by Prediction Type */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Accuracy by Type</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Standard</span>
                <span className="text-white font-medium">{stats.byType.standard.accuracy}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.byType.standard.accuracy}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Detailed Forecast</span>
                <span className="text-white font-medium">{stats.byType.detailed.accuracy}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.byType.detailed.accuracy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Performance</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stats.recentForm.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">Start making predictions to see your performance trend.</p>
          ) : (
            stats.recentForm.map((item, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
                title={`${item.match}: ${item.correct ? 'Correct' : 'Incorrect'}`}
              >
                {item.correct ? '✓' : '✗'}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Empty State */}
      {stats.totalPredictions === 0 && (
        <div className="mt-8 p-8 bg-slate-800/30 rounded-xl border border-slate-700/50 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Predictions Yet</h3>
          <p className="text-slate-400 mb-6">Make your first prediction to start tracking your accuracy!</p>
          <button
            onClick={() => onNavigate?.('DASHBOARD')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-orange-600 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default StatisticsView;

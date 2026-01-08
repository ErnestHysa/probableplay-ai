/**
 * Empty State Component
 *
 * Friendly empty state messages with sports-themed illustrations.
 */

import React from 'react';
import { Trophy, Zap, BarChart3, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-predictions' | 'no-matches' | 'no-statistics' | 'no-backtests' | 'limit-reached';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-predictions',
  title,
  message,
  action,
  className = '',
}) => {
  const configs: Record<string, { icon: React.ElementType; defaultTitle: string; defaultMessage: string }> = {
    'no-predictions': {
      icon: Trophy,
      defaultTitle: 'No Predictions Yet',
      defaultMessage: 'Start making predictions to build your history and track your accuracy over time.',
    },
    'no-matches': {
      icon: Zap,
      defaultTitle: 'No Matches Found',
      defaultMessage: 'There are no matches scheduled for the selected league and date filter.',
    },
    'no-statistics': {
      icon: BarChart3,
      defaultTitle: 'No Statistics Available',
      defaultMessage: 'Make some predictions to see your accuracy trends and performance analytics.',
    },
    'no-backtests': {
      icon: TrendingUp,
      defaultTitle: 'No Backtests Yet',
      defaultMessage: 'Select teams and run a backtest to see how well our predictions would have performed historically.',
    },
    'limit-reached': {
      icon: Zap,
      defaultTitle: 'Weekly Limit Reached',
      defaultMessage: 'You\'ve used all your free predictions for this week. Upgrade to Pro for unlimited predictions.',
    },
  };

  const config = configs[type] || configs['no-predictions'];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon with gradient background */}
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-blue-400" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2 text-center">
        {title || config.defaultTitle}
      </h3>

      {/* Message */}
      <p className="text-slate-400 text-center max-w-md mb-6">
        {message || config.defaultMessage}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

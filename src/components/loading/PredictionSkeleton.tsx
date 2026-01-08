/**
 * Prediction Skeleton Loading Component
 *
 * Shimmer effect for prediction results during loading.
 */

import React from 'react';

export const PredictionSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-slate-700/50 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-6 w-48 bg-slate-700/50 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-32 bg-slate-700/30 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Probabilities */}
      <div className="space-y-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-slate-700/30 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-slate-700/30 rounded animate-pulse"></div>
            </div>
            <div className="h-2 bg-slate-700/30 rounded-full overflow-hidden animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse"></div>
        <div className="h-4 w-3/4 bg-slate-700/30 rounded animate-pulse"></div>
      </div>

      {/* Key factors */}
      <div className="mt-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 w-2 bg-slate-700/30 rounded-full animate-pulse"></div>
            <div className="h-3 w-full bg-slate-700/30 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DetailedForecastSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-64 bg-slate-700/50 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-48 bg-slate-700/30 rounded animate-pulse"></div>
        </div>
        <div className="h-8 w-20 bg-slate-700/50 rounded-full animate-pulse"></div>
      </div>

      {/* Score prediction */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-6 mb-6">
        <div className="h-4 w-32 bg-slate-700/30 rounded mb-3 mx-auto animate-pulse"></div>
        <div className="h-12 w-48 bg-slate-700/30 rounded mx-auto animate-pulse"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-700/20 rounded-lg p-4">
            <div className="h-3 w-20 bg-slate-700/30 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-full bg-slate-700/30 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Scorers */}
      <div className="mb-6">
        <div className="h-4 w-24 bg-slate-700/30 rounded mb-3 animate-pulse"></div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-slate-700/30 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-700/30 rounded mb-1 animate-pulse"></div>
              <div className="h-3 w-24 bg-slate-700/20 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-12 bg-slate-700/30 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-24 bg-slate-700/30 rounded animate-pulse"></div>
        <div className="h-6 w-16 bg-slate-700/30 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default PredictionSkeleton;

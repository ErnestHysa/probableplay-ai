/**
 * Match Skeleton Loading Component
 *
 * Shimmer effect for match cards during loading.
 */

import React from 'react';

export const MatchSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${className}`}>
      {/* League badge */}
      <div className="h-4 w-24 bg-slate-700/50 rounded mb-3 animate-pulse"></div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="h-5 w-32 bg-slate-700/50 rounded mb-1 animate-pulse"></div>
          <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-12 bg-slate-700/50 rounded animate-pulse mx-4"></div>
        <div className="flex-1 text-right">
          <div className="h-5 w-32 bg-slate-700/50 rounded mb-1 ml-auto animate-pulse"></div>
          <div className="h-3 w-20 bg-slate-700/30 rounded ml-auto animate-pulse"></div>
        </div>
      </div>

      {/* Time/Status */}
      <div className="flex items-center justify-between mt-3">
        <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-slate-700/50 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export const MatchListSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <MatchSkeleton key={i} />
      ))}
    </div>
  );
};

export default MatchSkeleton;

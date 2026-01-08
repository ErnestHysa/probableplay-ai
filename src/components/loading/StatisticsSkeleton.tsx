/**
 * Statistics Skeleton Loading Component
 *
 * Shimmer effect for statistics dashboard during loading.
 */

import React from 'react';

export const StatisticsSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-9 w-64 bg-slate-700/50 rounded mb-2 animate-pulse"></div>
          <div className="h-5 w-48 bg-slate-700/30 rounded animate-pulse"></div>
        </div>
        <div className="h-7 w-32 bg-slate-700/50 rounded-full animate-pulse"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="h-10 w-10 bg-slate-700/50 rounded-lg mb-3 animate-pulse"></div>
            <div className="h-4 w-24 bg-slate-700/30 rounded mb-2 animate-pulse"></div>
            <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Chart 1 */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="h-6 w-40 bg-slate-700/50 rounded mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-slate-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-slate-700/30 rounded animate-pulse"></div>
                </div>
                <div className="h-2 bg-slate-700/30 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="h-6 w-40 bg-slate-700/50 rounded mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-slate-700/30 rounded animate-pulse"></div>
                </div>
                <div className="h-2 bg-slate-700/30 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="h-6 w-48 bg-slate-700/50 rounded mb-4 animate-pulse"></div>
        <div className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 w-10 bg-slate-700/30 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsSkeleton;

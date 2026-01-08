/**
 * Weekly Usage Chart
 *
 * Shows prediction usage over the past weeks.
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';

interface WeekData {
  week: string;
  predictions: number;
  detailedForecasts: number;
}

interface WeeklyUsageChartProps {
  data: WeekData[];
  limit: number;
  className?: string;
}

export const WeeklyUsageChart: React.FC<WeeklyUsageChartProps> = ({ data, limit, className = '' }) => {
  if (data.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Weekly Usage</h3>
        <p className="text-slate-500 text-sm">No usage data yet</p>
      </div>
    );
  }

  const maxPredictions = Math.max(...data.map(d => d.predictions), limit);
  const chartHeight = 120;

  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Weekly Usage</h3>
        <div className="text-sm text-slate-400">
          Limit: <span className="text-white font-medium">{limit === 999 ? 'Unlimited' : limit}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end gap-2 h-full" style={{ height: `${chartHeight}px` }}>
          {data.map((d, i) => {
            const barHeight = (d.predictions / maxPredictions) * chartHeight;
            const isOverLimit = d.predictions >= limit && limit !== 999;
            const isCurrentWeek = i === data.length - 1;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="relative w-full">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isOverLimit
                        ? 'bg-gradient-to-t from-red-600 to-red-400'
                        : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                    } ${isCurrentWeek ? 'ring-2 ring-white/50' : ''}`}
                    style={{ height: `${barHeight}px` }}
                  >
                    {/* Count label on top of bar */}
                    {d.predictions > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-white font-medium">
                        {d.predictions}
                      </span>
                    )}
                  </div>

                  {/* Limit line */}
                  {limit !== 999 && (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-orange-500"
                      style={{
                        bottom: `${(limit / maxPredictions) * chartHeight}px`,
                      }}
                      title={`Weekly limit: ${limit}`}
                    />
                  )}
                </div>

                {/* Week label */}
                <span className={`text-xs ${isCurrentWeek ? 'text-white font-medium' : 'text-slate-500'}`}>
                  {d.week}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-cyan-400"></div>
          <span className="text-slate-400">Within limit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-red-600 to-red-400"></div>
          <span className="text-slate-400">Over limit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-orange-500"></div>
          <span className="text-slate-400">Weekly limit</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyUsageChart;

/**
 * Accuracy Trend Chart
 *
 * Shows prediction accuracy over time using CSS-based visualization.
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DataPoint {
  date: string;
  accuracy: number;
  totalPredictions: number;
}

interface AccuracyTrendChartProps {
  data: DataPoint[];
  className?: string;
}

export const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({ data, className = '' }) => {
  if (data.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Accuracy Trend</h3>
        <p className="text-slate-500 text-sm">No data available</p>
      </div>
    );
  }

  // Calculate overall trend
  const recentAccuracy = data.slice(-7).reduce((sum, d) => sum + d.accuracy, 0) / Math.min(data.length, 7);
  const earlierAccuracy = data.slice(0, Math.max(0, data.length - 7)).reduce((sum, d) => sum + d.accuracy, 0) / Math.max(1, data.length - 7) || recentAccuracy;
  const isImproving = recentAccuracy >= earlierAccuracy;
  const trendPercent = earlierAccuracy > 0 ? ((recentAccuracy - earlierAccuracy) / earlierAccuracy * 100) : 0;

  const maxAccuracy = 100;
  const chartHeight = 150;

  // Generate points for SVG path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = chartHeight - (d.accuracy / maxAccuracy) * chartHeight;
    return `${x},${y}`;
  });

  // Fill area for gradient effect
  const fillArea = `${points.join(' ')} L100,${chartHeight} L0,${chartHeight} Z`;

  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Accuracy Trend</h3>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          isImproving ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isImproving ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(trendPercent).toFixed(1)}%
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 100 ${chartHeight}`} className="w-full" style={{ height: `${chartHeight}px` }}>
          <defs>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={chartHeight - (pct / 100) * chartHeight}
              x2="100"
              y2={chartHeight - (pct / 100) * chartHeight}
              stroke="rgb(51 65 85)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Fill area */}
          <polygon
            points={fillArea}
            fill="url(#trendGradient)"
          />

          {/* Line */}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = chartHeight - (d.accuracy / maxAccuracy) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="1.5"
                fill="rgb(59 130 246)"
                className="hover:r-3 transition-all cursor-pointer"
              >
                <title>{d.date}: {d.accuracy}%</title>
              </circle>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 -ml-8 h-full flex flex-col justify-between text-xs text-slate-500">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
      </div>

      {/* Current accuracy badge */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-400">Current: {data[data.length - 1]?.accuracy || 0}%</span>
        <span className="text-slate-400">Predictions: {data[data.length - 1]?.totalPredictions || 0}</span>
      </div>
    </div>
  );
};

export default AccuracyTrendChart;

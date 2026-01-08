/**
 * Prediction Distribution Chart
 *
 * Shows distribution of predictions by outcome type.
 */

import React from 'react';
import { Trophy } from 'lucide-react';

interface DistributionData {
  homeWins: number;
  draws: number;
  awayWins: number;
}

interface PredictionDistributionProps {
  data: DistributionData;
  className?: string;
}

export const PredictionDistribution: React.FC<PredictionDistributionProps> = ({ data, className = '' }) => {
  const total = data.homeWins + data.draws + data.awayWins;

  if (total === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Prediction Distribution</h3>
        <p className="text-slate-500 text-sm">No predictions yet</p>
      </div>
    );
  }

  const homeWinPct = (data.homeWins / total) * 100;
  const drawPct = (data.draws / total) * 100;
  const awayWinPct = (data.awayWins / total) * 100;

  const colors = {
    homeWin: 'from-blue-500 to-cyan-500',
    draw: 'from-amber-500 to-orange-500',
    awayWin: 'from-purple-500 to-pink-500',
  };

  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">Prediction Distribution</h3>

      {/* Donut Chart */}
      <div className="relative flex justify-center mb-6">
        <svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90">
          {homeWinPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgb(59 130 246)"
              strokeWidth="20"
              strokeDasharray={`${(homeWinPct / 100) * 251.3} 251.3`}
            />
          )}
          {drawPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgb(245 158 11)"
              strokeWidth="20"
              strokeDasharray={`${(drawPct / 100) * 251.3} 251.3`}
              strokeDashoffset={`-${(homeWinPct / 100) * 251.3}`}
            />
          )}
          {awayWinPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgb(168 85 247)"
              strokeWidth="20"
              strokeDasharray={`${(awayWinPct / 100) * 251.3} 251.3`}
              strokeDashoffset={`-${((homeWinPct + drawPct) / 100) * 251.3}`}
            />
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center rotate-90">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {/* Home Wins */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${colors.homeWin}`}></div>
            <span className="text-slate-300">Home Wins</span>
          </div>
          <div className="text-right">
            <span className="text-white font-medium">{data.homeWins}</span>
            <span className="text-slate-500 text-sm ml-2">({homeWinPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Draws */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${colors.draw}`}></div>
            <span className="text-slate-300">Draws</span>
          </div>
          <div className="text-right">
            <span className="text-white font-medium">{data.draws}</span>
            <span className="text-slate-500 text-sm ml-2">({drawPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Away Wins */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${colors.awayWin}`}></div>
            <span className="text-slate-300">Away Wins</span>
          </div>
          <div className="text-right">
            <span className="text-white font-medium">{data.awayWins}</span>
            <span className="text-slate-500 text-sm ml-2">({awayWinPct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionDistribution;

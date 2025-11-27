import React from 'react';

interface EventLikelihoodCardProps {
  event: string; // e.g., 'Penalty', 'Free Kick', etc.
  probability: string; // e.g., '15%'
  emoji: string; // Football emoji
  description?: string;
}

const parsePercentage = (str: string): number => {
  if (!str) return 0;
  const match = str.match(/(\d+)%?/);
  if (match && match[1]) {
    return Math.min(100, Math.max(0, parseInt(match[1], 10)));
  }
  return 0;
};

const getProbabilityColor = (percentage: number) => {
  if (percentage >= 50) return 'bg-emerald-500';
  if (percentage >= 25) return 'bg-blue-500';
  if (percentage > 0) return 'bg-slate-500';
  return 'bg-slate-700';
};

const getTextColor = (percentage: number) => {
  if (percentage >= 50) return 'text-emerald-400';
  if (percentage >= 25) return 'text-blue-400';
  if (percentage > 0) return 'text-slate-400';
  return 'text-slate-500';
};

export const EventLikelihoodCard: React.FC<EventLikelihoodCardProps> = ({
  event,
  probability,
  emoji,
  description
}) => {
  const percentage = parsePercentage(probability);
  const colorClass = getProbabilityColor(percentage);
  const textColorClass = getTextColor(percentage);

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white">{event}</h4>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden mr-3">
          <div
            className={`h-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-xs font-mono font-bold ${textColorClass}`}>
          {probability}
        </span>
      </div>
    </div>
  );
};

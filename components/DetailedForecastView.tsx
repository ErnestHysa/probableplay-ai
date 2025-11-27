
import React, { useState } from 'react';
import { Match, DetailedForecastResult } from '../types';
import { LoadingState } from './ui';
import { ConfidenceMeter } from './ui/ConfidenceMeter';
import { EventLikelihoodCard } from './primitives/EventLikelihoodCard';
import { 
  ArrowLeft, Target, Clock, AlertTriangle, Shield, Goal, ChevronDown, ChevronUp, 
  Zap, Users, TrendingUp
} from 'lucide-react';

interface DetailedForecastViewProps {
  match: Match;
  forecast: DetailedForecastResult | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

// Football emoji set for event rows
const eventEmojis = {
  penalty: '🎯',
  freeKick: '⚡',
  cornerHeader: '🥅',
  ownGoal: '📉',
  outsideBox: '💨'
};

// Parse reasoning into structured steps
const parseReasoningSteps = (reasoning: string): string[] => {
  // Split by common sentence endings and filter empty
  return reasoning
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0)
    .slice(0, 5); // Limit to first 5 steps for readability
};

export const DetailedForecastView: React.FC<DetailedForecastViewProps> = ({ 
  match, 
  forecast, 
  isLoading, 
  error,
  onBack 
}) => {
  const [expandedReasoning, setExpandedReasoning] = useState(false);

  // Helper to choose icon based on scoring method
  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('penalty')) return '🎯';
    if (m.includes('header')) return '🥅';
    if (m.includes('free kick')) return '⚡';
    if (m.includes('shot') || m.includes('drive')) return '💨';
    return '⚽';
  };

  // Helper to parse percentage string to number
  const parsePercentage = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/(\d+)%?/);
    if (match && match[1]) {
      return Math.min(100, Math.max(0, parseInt(match[1], 10)));
    }
    return 0;
  };

  // Map confidence score to ConfidenceMeter level
  const getConfidenceLevel = (score: string) => {
    if (score === 'High') return 'High';
    if (score === 'Medium') return 'Medium';
    return 'Low';
  };

  const reasoningSteps = forecast ? parseReasoningSteps(forecast.reasoning) : [];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Match List
      </button>

      {/* Match Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Detailed AI Forecast</h2>
        <div className="flex items-center gap-2 text-slate-400 mt-2">
          <span className="text-lg">{match.homeTeam}</span>
          <span className="text-slate-600 text-xs font-bold">VS</span>
          <span className="text-lg">{match.awayTeam}</span>
        </div>
      </div>

      {isLoading && (
        <LoadingState 
          icon={Target}
          title="Analyzing Scoring Vectors..."
          message="Calculating exact scorelines, identifying goalscorers, and evaluating set-piece probabilities."
          size="lg"
        />
      )}

      {!isLoading && error && (
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-red-400 mb-2">Forecast Failed</h3>
          <p className="text-slate-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && forecast && (
        <div className="space-y-6">
          {/* Hero Scoreboard Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Predicted Score */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={64} className="text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Predicted Score</span>
              <div className="text-5xl font-black text-white tracking-tight">{forecast.predictedScore}</div>
              <span className="text-xs text-slate-400 mt-2">Final Result</span>
            </div>

            {/* Total Goals */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Goals</span>
              <div className="text-5xl font-black text-blue-400 tracking-tight">{forecast.totalGoals}</div>
              <span className="text-xs text-slate-400 mt-2">Expected Goals</span>
            </div>

            {/* First Team to Score */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First to Score</span>
              <div className="text-2xl font-bold text-emerald-300">{forecast.firstTeamToScore}</div>
              <span className="text-xs text-slate-400 mt-2">Opening Goal</span>
            </div>
          </div>

          {/* Confidence & Key Metrics Band */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield size={20} className="text-emerald-400" />
              Confidence & Match Insights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Confidence Meter */}
              <div className="flex justify-center items-start">
                <ConfidenceMeter 
                  level={getConfidenceLevel(forecast.confidenceScore)}
                  variant="radial"
                  size="md"
                  showLabel={true}
                  showIcon={true}
                />
              </div>

              {/* Match Insights Grid */}
              <div className="md:col-span-3 grid grid-cols-2 gap-4">
                {/* Half-Time Winner */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock size={14} className="text-purple-500" />
                    1st Half
                  </div>
                  <div className="text-lg font-bold text-white">{forecast.halfTimeWinner}</div>
                </div>

                {/* Second Half Winner */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock size={14} className="text-purple-500" />
                    2nd Half
                  </div>
                  <div className="text-lg font-bold text-white">{forecast.secondHalfWinner}</div>
                </div>

                {/* Red Cards */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={14} className="text-red-500" />
                    Red Cards
                  </div>
                  <div className="text-lg font-bold text-white">{forecast.redCards}</div>
                </div>

                {/* Confidence Badge */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap size={14} className="text-amber-500" />
                    Confidence
                  </div>
                  <div className={`text-lg font-bold ${forecast.confidenceScore === 'High' ? 'text-emerald-400' : forecast.confidenceScore === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                    {forecast.confidenceScore}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Reasoning Timeline Panel */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setExpandedReasoning(!expandedReasoning)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                <span className="text-lg font-bold text-white">AI Reasoning</span>
                <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {reasoningSteps.length} Steps
                </span>
              </div>
              {expandedReasoning ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            {expandedReasoning && (
              <div className="border-t border-slate-700">
                <div className="divide-y divide-slate-700">
                  {reasoningSteps.map((step, idx) => (
                    <div key={idx} className="px-6 py-4 flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {idx + 1}
                        </div>
                        {idx < reasoningSteps.length - 1 && (
                          <div className="w-0.5 h-8 bg-emerald-500/20 mt-2" />
                        )}
                      </div>
                      <div className="pt-1 flex-1 pb-2">
                        <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Projected Goalscorers Panel */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
              <Goal className="text-emerald-400" size={20} />
              <h3 className="text-lg font-bold text-white">Projected Goalscorers</h3>
            </div>
            {forecast.likelyScorers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {forecast.likelyScorers.map((scorer, i) => (
                  <div 
                    key={i} 
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{scorer.player}</h4>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{scorer.team}</p>
                      </div>
                      <div className="bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-3 border-t border-slate-700">
                      <div>
                        <div className="text-xs text-slate-500 mb-1 font-semibold">Method</div>
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                          <span className="text-lg">{getMethodIcon(scorer.method)}</span>
                          <span className="font-medium">{scorer.method}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-slate-500 mb-1 font-semibold">Likelihood</div>
                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          {scorer.likelihood}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 italic">
                No high-probability goalscorers identified for this match.
              </div>
            )}
          </div>

          {/* Event Probabilities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scoring Methods */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                Scoring Methods
              </h3>
              <div className="space-y-3">
                {Object.entries(forecast.scoringMethodProbabilities).map(([method, prob]) => {
                  const probStr = String(prob);
                  const methodDisplay = method.replace(/([A-Z])/g, ' $1').trim();
                  const methodKey = method as keyof typeof eventEmojis;
                  const emoji = eventEmojis[methodKey] || '⚽';
                  
                  return (
                    <EventLikelihoodCard
                      key={method}
                      event={methodDisplay}
                      probability={probStr}
                      emoji={emoji}
                    />
                  );
                })}
              </div>
            </div>

            {/* Halves & Match Flow */}
            <div className="space-y-4">
              {/* Half-Time Flow */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-purple-500" />
                  Match Flow
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-400">1st Half</span>
                      <span className="text-base font-bold text-white">{forecast.halfTimeWinner}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-400">2nd Half</span>
                      <span className="text-base font-bold text-white">{forecast.secondHalfWinner}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discipline Card */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <AlertTriangle size={18} className="text-red-500" />
                      Discipline
                    </h3>
                    <p className="text-slate-400 text-sm mt-2">Expected Red Cards</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-red-400">{forecast.redCards}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

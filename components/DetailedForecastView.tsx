
import React from 'react';
import { Match, DetailedForecastResult } from '../types';
import { 
  ArrowLeft, Target, Clock, AlertTriangle, Shield, Footprints, Flame, Goal, CircleDot, User
} from 'lucide-react';

interface DetailedForecastViewProps {
  match: Match;
  forecast: DetailedForecastResult | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

export const DetailedForecastView: React.FC<DetailedForecastViewProps> = ({ 
  match, 
  forecast, 
  isLoading, 
  error,
  onBack 
}) => {
  
  // Helper to choose icon based on scoring method
  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('penalty')) return <CircleDot size={16} className="text-yellow-400" />;
    if (m.includes('header')) return <User size={16} className="text-purple-400" />;
    if (m.includes('free kick')) return <Target size={16} className="text-blue-400" />;
    if (m.includes('shot') || m.includes('drive')) return <Footprints size={16} className="text-emerald-400" />;
    return <Goal size={16} className="text-slate-400" />;
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

  const getProbabilityColor = (percentage: number) => {
    if (percentage >= 50) return 'bg-emerald-500';
    if (percentage >= 25) return 'bg-blue-500';
    if (percentage > 0) return 'bg-slate-500';
    return 'bg-slate-700';
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Match List
      </button>

      {/* Match Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Detailed AI Forecast</h2>
        <div className="flex items-center gap-2 text-slate-400">
           <span>{match.homeTeam}</span>
           <span className="text-slate-600 text-xs font-bold">VS</span>
           <span>{match.awayTeam}</span>
        </div>
      </div>

      {isLoading && (
        <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700 border-dashed">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing Scoring Vectors...</h3>
            <p className="text-slate-400 max-w-md mx-auto">
                Calculating exact scorelines, identifying goalscorers, and evaluating set-piece probabilities.
            </p>
        </div>
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
            
            {/* Top Row: AI Reasoning & Confidence */}
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Flame size={14} className="text-amber-500" /> AI Reasoning
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${forecast.confidenceScore === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                        {forecast.confidenceScore} Confidence
                    </span>
                </div>
                <p className="text-slate-200 text-lg leading-relaxed italic">
                    "{forecast.reasoning}"
                </p>
            </div>

            {/* Scoreline & Goals Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Exact Score */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Target size={64} className="text-emerald-500" />
                     </div>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Predicted Score</span>
                     <div className="text-4xl font-black text-white tracking-tight">{forecast.predictedScore}</div>
                </div>

                {/* Total Goals */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Goals</span>
                     <div className="text-4xl font-black text-blue-400 tracking-tight">{forecast.totalGoals}</div>
                </div>

                {/* First Team to Score */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First to Score</span>
                     <div className="text-xl font-bold text-emerald-300">{forecast.firstTeamToScore}</div>
                </div>
            </div>

            {/* The Goalhunter Feed (Likely Scorers & Methods) */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
                    <Goal className="text-emerald-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Projected Goalscorers</h3>
                </div>
                <div className="divide-y divide-slate-700">
                    {forecast.likelyScorers.length > 0 ? (
                        forecast.likelyScorers.map((scorer, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-slate-300 font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-lg">{scorer.player}</div>
                                        <div className="text-slate-400 text-xs uppercase">{scorer.team}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-sm">
                                        {getMethodIcon(scorer.method)}
                                        {scorer.method}
                                    </div>
                                    <div className="text-slate-500 text-xs mt-0.5">
                                        Likelihood: <span className="text-slate-300 font-mono">{scorer.likelihood}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-slate-500 italic">
                            No high-probability goalscorers identified for this match.
                        </div>
                    )}
                </div>
            </div>

            {/* Event Probability Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Scoring Method Probabilities */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Target size={16} className="text-blue-500" /> Scoring Methods
                    </h3>
                    <div className="space-y-4">
                         {Object.entries(forecast.scoringMethodProbabilities).map(([method, prob]) => {
                             const percentage = parsePercentage(prob as string);
                             return (
                                 <div key={method} className="flex items-center justify-between">
                                     <span className="text-slate-400 capitalize text-sm">{method.replace(/([A-Z])/g, ' $1').trim()}</span>
                                     <div className="flex items-center gap-2">
                                         <div className={`w-24 h-2 rounded-full overflow-hidden bg-slate-700`}>
                                             <div 
                                                className={`h-full transition-all duration-500 ${getProbabilityColor(percentage)}`}
                                                style={{ width: `${percentage}%` }}
                                             />
                                         </div>
                                         <span className="text-xs font-mono w-12 text-right text-slate-300">{prob as string}</span>
                                     </div>
                                 </div>
                             );
                         })}
                    </div>
                </div>

                {/* Halves & Discipline */}
                <div className="space-y-6">
                    {/* Halves */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-purple-500" /> Half-Time Analysis
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-900/50 p-3 rounded text-center">
                                 <div className="text-xs text-slate-500 mb-1">1st Half Winner</div>
                                 <div className="font-bold text-white">{forecast.halfTimeWinner}</div>
                             </div>
                             <div className="bg-slate-900/50 p-3 rounded text-center">
                                 <div className="text-xs text-slate-500 mb-1">2nd Half Winner</div>
                                 <div className="font-bold text-white">{forecast.secondHalfWinner}</div>
                             </div>
                        </div>
                    </div>

                    {/* Discipline */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex justify-between items-center">
                        <div>
                             <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Shield size={16} className="text-red-500" /> Discipline
                            </h3>
                             <p className="text-slate-400 text-xs mt-1">Predicted Red Cards</p>
                        </div>
                        <div className="text-xl font-bold text-white text-right">{forecast.redCards}</div>
                    </div>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

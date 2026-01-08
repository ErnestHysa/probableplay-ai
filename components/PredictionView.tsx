
import React from 'react';
import { Match, PredictionResult } from '../types';
import { ProbabilityChart } from './ProbabilityChart';
import { 
  ArrowLeft, ExternalLink, Info, AlertTriangle, CheckCircle2 
} from 'lucide-react';

interface PredictionViewProps {
  match: Match;
  prediction: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({ 
  match, 
  prediction, 
  isLoading, 
  error,
  onBack 
}) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
      </button>

      {/* Match Header */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{match.homeTeam}</h2>
            <span className="text-emerald-500 font-bold text-sm tracking-widest uppercase">Home</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-slate-500 font-mono text-sm mb-1">{new Date(match.startTime).toLocaleDateString()}</div>
            <div className="bg-slate-900 px-4 py-2 rounded-full border border-slate-700 text-xl font-bold font-mono text-white">
                VS
            </div>
            <div className="text-slate-500 text-xs mt-2">{match.league}</div>
          </div>

          <div className="text-center md:text-right">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{match.awayTeam}</h2>
            <span className="text-blue-500 font-bold text-sm tracking-widest uppercase">Away</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700 border-dashed">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing Match Data...</h3>
            <p className="text-slate-400 max-w-md mx-auto">
                Gemini is researching recent form, checking injury reports, and calculating probabilities using live web data.
            </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-8 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Analysis Failed</h3>
            <p className="text-slate-400">{error}</p>
        </div>
      )}

      {/* Prediction Content */}
      {!isLoading && !error && prediction && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats & Chart */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Info size={18} className="text-emerald-400" />
                        AI Probability
                    </h3>
                    <ProbabilityChart probabilities={prediction.probabilities} />
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Key Factors</h3>
                    <ul className="space-y-3">
                        {prediction.keyFactors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-1 shrink-0" />
                                <span>{factor}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Column: Analysis */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Executive Summary</h3>
                    <p className="text-slate-300 leading-relaxed text-lg">
                        {prediction.summary}
                    </p>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h3>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-400">
                        {prediction.detailedAnalysis.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                        ))}
                    </div>
                </div>

                {/* Sources */}
                {prediction.sources.length > 0 && (
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sources & References</h4>
                        <div className="flex flex-wrap gap-2">
                            {prediction.sources.map((source, idx) => (
                                <a 
                                    key={idx} 
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs text-slate-400 hover:text-emerald-400 transition-colors border border-slate-700"
                                >
                                    {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                                    <ExternalLink size={10} />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

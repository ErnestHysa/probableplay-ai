import React, { useMemo } from 'react';
import { Match, HistoryItem, PredictionResult } from '../../types';
import { historyService } from '../../services/historyService';
import { Clock, TrendingUp, Target, Calendar, Play, AlertCircle } from 'lucide-react';
import { ConfidenceMeter, MiniTrendChart, EmptyState } from '../ui';

interface DashboardSummaryProps {
  matches: Match[];
}

interface AISnapshot {
  latestPrediction: PredictionResult | null;
  accuracy: number;
  totalPredictions: number;
  trendData: Array<{ name: string; value: number; label?: string }>;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ matches }) => {
  const aiSnapshot = useMemo((): AISnapshot => {
    const history = historyService.getHistory();
    
    if (history.length === 0) {
      return {
        latestPrediction: null,
        accuracy: 0,
        totalPredictions: 0,
        trendData: []
      };
    }

    // Get latest standard prediction
    const latestStandard = history.find(item => item.type === 'STANDARD' && item.standardPrediction);
    const latestPrediction = latestStandard?.standardPrediction || null;

    // Calculate accuracy
    const finishedItems = history.filter(item => item.result?.isFinished);
    const correctItems = finishedItems.filter(item => {
      if (!item.standardPrediction) return false;
      
      const pred = item.standardPrediction.probabilities;
      const predictedWinner = pred.homeWin > pred.awayWin && pred.homeWin > pred.draw ? 'Home' :
                              pred.awayWin > pred.homeWin && pred.awayWin > pred.draw ? 'Away' : 'Draw';
      
      return predictedWinner === item.result?.winner;
    });
    
    const accuracy = finishedItems.length > 0 ? Math.round((correctItems.length / finishedItems.length) * 100) : 0;

    // Calculate trend data (last 10 predictions)
    const recentHistory = history.slice(0, 10).reverse();
    const trendData = recentHistory.map((item, index) => {
      const predictionsSoFar = recentHistory.slice(0, index + 1);
      const finishedSoFar = predictionsSoFar.filter(p => p.result?.isFinished);
      const correctSoFar = finishedSoFar.filter(p => {
        if (!p.standardPrediction) return false;
        
        const pred = p.standardPrediction.probabilities;
        const predictedWinner = pred.homeWin > pred.awayWin && pred.homeWin > pred.draw ? 'Home' :
                                pred.awayWin > pred.homeWin && pred.awayWin > pred.draw ? 'Away' : 'Draw';
        
        return predictedWinner === p.result?.winner;
      });
      
      return {
        name: `P${index + 1}`,
        value: finishedSoFar.length > 0 ? Math.round((correctSoFar.length / finishedSoFar.length) * 100) : 0,
        label: `Prediction ${index + 1}`
      };
    });

    return {
      latestPrediction,
      accuracy,
      totalPredictions: history.length,
      trendData
    };
  }, []);

  const nextKickoff = useMemo(() => {
    if (matches.length === 0) return null;
    
    const now = new Date();
    const upcomingMatches = matches
      .filter(match => match.status === 'Scheduled' && new Date(match.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return upcomingMatches[0] || null;
  }, [matches]);

  const getConfidenceLevel = (probabilities?: { homeWin: number; draw: number; awayWin: number }) => {
    if (!probabilities) return 'Low';
    
    const maxProb = Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin);
    if (maxProb >= 65) return 'High';
    if (maxProb >= 45) return 'Medium';
    return 'Low';
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  if (aiSnapshot.totalPredictions === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 mb-8">
        <EmptyState
          icon={Target}
          title="Start Your AI Journey"
          message="Make your first prediction to see personalized insights, accuracy tracking, and AI summaries right here on your dashboard."
          action={{
            label: "Select a Match to Predict",
            onClick: () => {
              // Scroll to matches section
              const matchesSection = document.getElementById('matches-section');
              matchesSection?.scrollIntoView({ behavior: 'smooth' });
            },
            icon: Play
          }}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Next Kickoff */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Clock size={18} />
            <span>Next Kickoff</span>
          </div>
          {nextKickoff ? (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-xs text-slate-400 mb-1">{nextKickoff.league}</div>
              <div className="font-semibold text-white mb-2">
                {nextKickoff.homeTeam} vs {nextKickoff.awayTeam}
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <Calendar size={14} />
                <span>{formatTime(nextKickoff.startTime)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-slate-400 text-sm">No upcoming matches today</div>
            </div>
          )}
        </div>

        {/* Latest AI Prediction */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Target size={18} />
            <span>Latest AI Prediction</span>
          </div>
          {aiSnapshot.latestPrediction ? (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-sm text-slate-300 mb-3 line-clamp-2">
                {aiSnapshot.latestPrediction.summary}
              </div>
              
              {/* Mini Probability Visualization */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 text-center">
                  <div className="text-xs text-slate-400 mb-1">HOME</div>
                  <div 
                    className="h-2 bg-emerald-500 rounded-full"
                    style={{ width: `${aiSnapshot.latestPrediction.probabilities.homeWin}%` }}
                  />
                  <div className="text-xs text-slate-300 mt-1">
                    {Math.round(aiSnapshot.latestPrediction.probabilities.homeWin)}%
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-slate-400 mb-1">DRAW</div>
                  <div 
                    className="h-2 bg-amber-500 rounded-full"
                    style={{ width: `${aiSnapshot.latestPrediction.probabilities.draw}%` }}
                  />
                  <div className="text-xs text-slate-300 mt-1">
                    {Math.round(aiSnapshot.latestPrediction.probabilities.draw)}%
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-slate-400 mb-1">AWAY</div>
                  <div 
                    className="h-2 bg-red-500 rounded-full"
                    style={{ width: `${aiSnapshot.latestPrediction.probabilities.awayWin}%` }}
                  />
                  <div className="text-xs text-slate-300 mt-1">
                    {Math.round(aiSnapshot.latestPrediction.probabilities.awayWin)}%
                  </div>
                </div>
              </div>

              <ConfidenceMeter
                level={getConfidenceLevel(aiSnapshot.latestPrediction.probabilities)}
                variant="horizontal"
                size="sm"
                showLabel={false}
                showIcon={true}
              />
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-slate-400 text-sm">No standard predictions yet</div>
            </div>
          )}
        </div>

        {/* Recent Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <TrendingUp size={18} />
            <span>Recent Performance</span>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{aiSnapshot.accuracy}%</div>
                <div className="text-xs text-slate-400">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-300">{aiSnapshot.totalPredictions}</div>
                <div className="text-xs text-slate-400">Total Predictions</div>
              </div>
            </div>

            {/* Mini Trend Chart */}
            {aiSnapshot.trendData.length > 1 ? (
              <MiniTrendChart
                data={aiSnapshot.trendData}
                variant="area"
                height={80}
                color="#10b981"
                label="Accuracy"
              />
            ) : (
              <div className="h-20 flex items-center justify-center bg-slate-900/50 rounded border border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <AlertCircle size={14} />
                  <span>More predictions needed for trend</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
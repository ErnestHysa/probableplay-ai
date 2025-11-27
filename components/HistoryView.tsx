
import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { historyService } from '../services/historyService';
import { geminiService } from '../services/geminiService';
import { EmptyState, SkeletonCard } from './ui';
import { 
  RefreshCw, CheckCircle, XCircle, MinusCircle, Clock, 
  ChevronDown, ChevronUp, Trophy, FileText, User, Goal,
  GitCompare, ArrowRight, Trash2, BarChart3
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Comparison State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(historyService.getHistory());
  };

  const handleUpdateResults = async () => {
    setIsUpdating(true);
    try {
      const pendingItems = history.filter(h => !h.result);
      
      if (pendingItems.length === 0) {
        setIsUpdating(false);
        return;
      }

      const uniqueMatches = Array.from(new Set(pendingItems.map(h => h.match.id)))
        .map(id => pendingItems.find(h => h.match.id === id))
        .filter(Boolean) as HistoryItem[];

      const resultsMap = await geminiService.fetchMatchResults(uniqueMatches);
      
      let updatedCount = 0;
      resultsMap.forEach((result, matchId) => {
        if (historyService.updateResult(matchId, result)) {
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        loadHistory();
      }
    } catch (error) {
      console.error("Failed to update history", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (isCompareMode) return; // Disable expand in compare mode to prevent confusion
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
        if (selectedIds.length < 2) {
            setSelectedIds([...selectedIds, id]);
        }
    }
  };
  
  const handleDeleteSelected = () => {
      const newHistory = historyService.deleteItems(selectedIds);
      setHistory(newHistory);
      setSelectedIds([]);
      setIsCompareMode(false);
  };

  const getAccuracyBadge = (item: HistoryItem) => {
    if (!item.result) return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
        <MinusCircle size={14} /> Pending
      </div>
    );

    let isCorrect = false;
    let text = "Incorrect";
    
    if (item.type === 'STANDARD' && item.standardPrediction) {
      const { homeWin, awayWin, draw } = item.standardPrediction.probabilities;
      const { winner } = item.result;
      
      let pick = 'Draw';
      let maxProb = draw;
      if (homeWin > maxProb) { pick = 'Home'; maxProb = homeWin; }
      if (awayWin > maxProb) { pick = 'Away'; maxProb = awayWin; }
      
      isCorrect = pick === winner;
      text = isCorrect ? 'Correct Pick' : 'Incorrect Pick';
    }
    else if (item.type === 'DETAILED' && item.detailedForecast) {
       const { predictedScore } = item.detailedForecast;
       const [pHome, pAway] = predictedScore.split('-').map(Number);
       
       let predictedWinner = 'Draw';
       if (!isNaN(pHome) && !isNaN(pAway)) {
           if (pHome > pAway) predictedWinner = 'Home';
           if (pAway > pHome) predictedWinner = 'Away';
       }

       isCorrect = predictedWinner === item.result.winner;
       text = isCorrect ? 'Trend Correct' : 'Trend Incorrect';
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
        {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
        {text}
      </div>
    );
  };

  // --- Comparison Logic ---
  const renderComparisonModal = () => {
      const item1 = history.find(h => h.id === selectedIds[0]);
      const item2 = history.find(h => h.id === selectedIds[1]);

      if (!item1 || !item2) return null;

      // Helper to render value based on type
      const renderValue = (item: HistoryItem, field: 'score' | 'confidence' | 'reasoning' | 'scorers') => {
          if (item.type === 'STANDARD') {
              if (field === 'score') return "N/A (Overview)";
              if (field === 'confidence') return "N/A";
              if (field === 'reasoning') return item.standardPrediction?.summary || "N/A";
              if (field === 'scorers') return "No scorer data";
          } else {
              if (field === 'score') return item.detailedForecast?.predictedScore;
              if (field === 'confidence') return item.detailedForecast?.confidenceScore;
              if (field === 'reasoning') return item.detailedForecast?.reasoning;
              if (field === 'scorers') return item.detailedForecast?.likelyScorers.map(s => s.player).join(", ");
          }
      };

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
              <div className="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <GitCompare className="text-emerald-400" /> Prediction Comparison
                      </h3>
                      <button 
                        onClick={() => setShowComparisonModal(false)}
                        className="text-slate-400 hover:text-white"
                      >
                          Close
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-2 divide-x divide-slate-700">
                      {/* Column 1 */}
                      <div className="p-6 space-y-6">
                          <div className="font-bold text-lg text-white mb-2">{item1.match.homeTeam} vs {item1.match.awayTeam}</div>
                          <div className="text-xs text-slate-500 mb-4">{new Date(item1.timestamp).toLocaleString()} • {item1.type}</div>
                          
                          <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Predicted Score</div>
                              <div className="text-2xl font-bold text-emerald-400">{renderValue(item1, 'score')}</div>
                          </div>
                          <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Confidence</div>
                              <div className="text-lg text-white">{renderValue(item1, 'confidence')}</div>
                          </div>
                           <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Scorers</div>
                              <div className="text-sm text-slate-300">{renderValue(item1, 'scorers')}</div>
                          </div>
                          <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Reasoning</div>
                              <div className="text-sm text-slate-400 italic bg-slate-900 p-3 rounded border border-slate-700">
                                  "{renderValue(item1, 'reasoning')}"
                              </div>
                          </div>
                      </div>

                      {/* Column 2 */}
                      <div className="p-6 space-y-6 bg-slate-800/50">
                          <div className="font-bold text-lg text-white mb-2">{item2.match.homeTeam} vs {item2.match.awayTeam}</div>
                          <div className="text-xs text-slate-500 mb-4">{new Date(item2.timestamp).toLocaleString()} • {item2.type}</div>

                          <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Predicted Score</div>
                              <div className="text-2xl font-bold text-blue-400">{renderValue(item2, 'score')}</div>
                          </div>
                          <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Confidence</div>
                              <div className="text-lg text-white">{renderValue(item2, 'confidence')}</div>
                          </div>
                           <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Scorers</div>
                              <div className="text-sm text-slate-300">{renderValue(item2, 'scorers')}</div>
                          </div>
                          <div>
                              <div className="text-xs uppercase text-slate-500 font-bold mb-1">Reasoning</div>
                              <div className="text-sm text-slate-400 italic bg-slate-900 p-3 rounded border border-slate-700">
                                  "{renderValue(item2, 'reasoning')}"
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {showComparisonModal && renderComparisonModal()}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Prediction History</h2>
          <p className="text-slate-400 text-sm">Review, track, and compare your AI forecasts.</p>
        </div>
        
        <div className="flex gap-2">
            {!isCompareMode ? (
                <>
                    <button
                        onClick={() => { setIsCompareMode(true); setExpandedId(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <GitCompare size={16} /> Compare
                    </button>
                    <button
                        onClick={handleUpdateResults}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/20 text-sm font-medium"
                    >
                        <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
                        {isUpdating ? 'Checking...' : 'Check Results'}
                    </button>
                </>
            ) : (
                <>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} /> Delete ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowComparisonModal(true)}
                        disabled={selectedIds.length !== 2}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        Compare Selected ({selectedIds.length}/2)
                    </button>
                    <button
                        onClick={() => { setIsCompareMode(false); setSelectedIds([]); }}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        Cancel
                    </button>
                </>
            )}
        </div>
      </div>

      {history.length === 0 ? (
        <EmptyState 
          icon={BarChart3}
          title="No prediction history yet"
          message="Generate predictions in the Dashboard or Detailed Forecast tabs to start building your history and track AI accuracy."
          size="lg"
        />
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
             const isExpanded = expandedId === item.id;
             const isDetailed = item.type === 'DETAILED';
             const isStandard = item.type === 'STANDARD';
             const isSelected = selectedIds.includes(item.id);

             return (
               <div 
                key={item.id} 
                className={`bg-slate-800 border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700 hover:border-slate-600'}`}
               >
                  {/* Header Row (Clickable) */}
                  <div 
                    onClick={() => isCompareMode ? toggleSelection(item.id) : toggleExpand(item.id)}
                    className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-700/30 transition-colors select-none"
                  >
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        {isCompareMode && (
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-900'}`}>
                                {isSelected && <CheckCircle size={14} className="text-white" />}
                            </div>
                        )}
                        <div className={`p-3 rounded-lg ${isDetailed ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                           {isDetailed ? <FileText size={20} /> : <Trophy size={20} />}
                        </div>
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-lg">{item.match.homeTeam} vs {item.match.awayTeam}</span>
                           </div>
                           <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded border ${isDetailed ? 'border-blue-500/30 text-blue-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                                 {isDetailed ? 'DETAILED' : 'STANDARD'}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        {/* Quick Summary View */}
                        <div className="text-right">
                           {isStandard && item.standardPrediction && (
                              <div className="flex flex-col items-end">
                                 <div className="text-xs text-slate-500 uppercase font-bold mb-1">Win Probability</div>
                                 <div className="flex items-center gap-1 text-sm text-slate-300">
                                    <span className="text-emerald-400 font-bold">{(item.standardPrediction.probabilities.homeWin * 100).toFixed(0)}%</span>
                                    <span>/</span>
                                    <span className="text-slate-400">{(item.standardPrediction.probabilities.draw * 100).toFixed(0)}%</span>
                                    <span>/</span>
                                    <span className="text-blue-400 font-bold">{(item.standardPrediction.probabilities.awayWin * 100).toFixed(0)}%</span>
                                 </div>
                              </div>
                           )}
                           {isDetailed && item.detailedForecast && (
                              <div className="flex flex-col items-end">
                                 <div className="text-xs text-slate-500 uppercase font-bold mb-1">Predicted Score</div>
                                 <div className="text-xl font-bold text-white tracking-tight">
                                    {item.detailedForecast.predictedScore}
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Result Badge */}
                        <div className="flex flex-col items-end gap-1 min-w-[100px]">
                           {item.result ? (
                              <span className="text-sm font-mono font-bold text-white">
                                 {item.result.homeScore} - {item.result.awayScore}
                              </span>
                           ) : (
                              <span className="text-xs text-slate-500 italic">Score Pending</span>
                           )}
                           {getAccuracyBadge(item)}
                        </div>

                        {/* Expand Icon */}
                        {!isCompareMode && (
                            <div className="text-slate-500">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        )}
                     </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && !isCompareMode && (
                     <div className="border-t border-slate-700 bg-slate-900/30 p-6 animate-fade-in">
                        {isStandard && item.standardPrediction && (
                           <div className="space-y-4">
                              <div>
                                 <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Analysis Summary</h4>
                                 <p className="text-slate-300 text-sm leading-relaxed">{item.standardPrediction.summary}</p>
                              </div>
                           </div>
                        )}

                        {isDetailed && item.detailedForecast && (
                           <div className="space-y-6">
                              {/* Stat Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Total Goals</div>
                                    <div className="text-lg font-bold text-white">{item.detailedForecast.totalGoals}</div>
                                 </div>
                                 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">First Scorer</div>
                                    <div className="text-lg font-bold text-emerald-400">{item.detailedForecast.firstTeamToScore}</div>
                                 </div>
                                 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Red Cards</div>
                                    <div className="text-lg font-bold text-red-400">{item.detailedForecast.redCards}</div>
                                 </div>
                                 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Confidence</div>
                                    <div className="text-lg font-bold text-blue-400">{item.detailedForecast.confidenceScore}</div>
                                 </div>
                              </div>

                              {/* NEW: Half-Time Analysis */}
                              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Clock size={14} /> Half-Time Analysis
                                </h4>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col items-center flex-1 border-r border-slate-700">
                                        <span className="text-slate-500 text-[10px] uppercase">1st Half Winner</span>
                                        <span className="font-bold text-white">{item.detailedForecast.halfTimeWinner}</span>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-slate-500 text-[10px] uppercase">2nd Half Winner</span>
                                        <span className="font-bold text-white">{item.detailedForecast.secondHalfWinner}</span>
                                    </div>
                                </div>
                              </div>

                              {/* Scorers Grid with NUMBERS */}
                              <div>
                                 <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Goal size={16} /> Predicted Scorers
                                 </h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {item.detailedForecast.likelyScorers.map((scorer, i) => (
                                       <div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                             {/* NUMBERED INDEX ADDED HERE */}
                                             <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                                {i + 1}
                                             </div>
                                             <div>
                                                <div className="text-sm font-bold text-white">{scorer.player}</div>
                                                <div className="text-[10px] text-slate-500 uppercase">{scorer.team}</div>
                                             </div>
                                          </div>
                                          <div className="text-right">
                                             <div className="text-xs font-bold text-emerald-400">{scorer.method}</div>
                                             <div className="text-[10px] text-slate-500">{scorer.likelihood} Prob.</div>
                                          </div>
                                       </div>
                                    ))}
                                    {item.detailedForecast.likelyScorers.length === 0 && (
                                       <div className="text-sm text-slate-500 italic p-2">No specific scorer data available.</div>
                                    )}
                                 </div>
                              </div>
                              
                              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 italic text-sm text-slate-400">
                                 AI Reasoning: "{item.detailedForecast.reasoning}"
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

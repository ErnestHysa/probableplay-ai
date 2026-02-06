
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { BacktestResultItem } from '../types';
import { EmptyState, LoadingState, SkeletonCard, MiniTrendChart } from './ui';
import { AlertCircle, PlayCircle, Plus, Trash2, CheckCircle, XCircle, TrendingUp, Users, Database } from 'lucide-react';

export const BacktestView: React.FC = () => {
  // Form State
  const [sport, setSport] = useState('Football');
  const [league, setLeague] = useState('');
  const [teamInput, setTeamInput] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState(3);
  
  // Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<BacktestResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddTeam = () => {
    if (teamInput.trim() && !selectedTeams.includes(teamInput.trim())) {
      setSelectedTeams([...selectedTeams, teamInput.trim()]);
      setTeamInput('');
    }
  };

  const handleRemoveTeam = (team: string) => {
    setSelectedTeams(selectedTeams.filter(t => t !== team));
  };

  const handleRunBacktest = async () => {
    if (!geminiService.isConfigured) {
      setError("API key is missing. Add GEMINI_API_KEY to run backtesting.");
      return;
    }

    if (selectedTeams.length === 0) {
      setError("Please add at least one team.");
      return;
    }
    if (!league) {
        setError("Please enter a league name.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress('Fetching past match data...');

    try {
      // 1. Fetch Candidates
      const candidates = await geminiService.fetchBacktestCandidates(sport, league, selectedTeams, matchCount);
      
      if (candidates.length === 0) {
        throw new Error("No past matches found for these criteria. Try checking spelling or using a more popular league.");
      }

      setProgress(`Found ${candidates.length} matches. Analyzing...`);

      // 2. Run Predictions Sequentially (to avoid rate limits and state issues)
      const resultsBuffer: BacktestResultItem[] = [];
      
      for (let i = 0; i < candidates.length; i++) {
        const match = candidates[i];
        setProgress(`Analyzing match ${i + 1} of ${candidates.length}: ${match.homeTeam} vs ${match.awayTeam}...`);
        
        const result = await geminiService.runBacktestPrediction(match);
        resultsBuffer.push(result);
        // Update intermediate results for better UX
        setResults([...resultsBuffer]);
      }

      setProgress('Complete!');
      
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred during backtesting.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    if (results.length === 0) return null;
    const correct = results.filter(r => r.isCorrect).length;
    return {
      total: results.length,
      correct,
      accuracy: Math.round((correct / results.length) * 100)
    };
  };

  const calculateTrendData = () => {
    if (results.length === 0) return [];

    const trendPoints = [];
    let correctCount = 0;

    for (let i = 0; i < results.length; i++) {
      if (results[i].isCorrect) correctCount++;
      const accuracy = Math.round((correctCount / (i + 1)) * 100);
      
      trendPoints.push({
        name: `${i + 1}`,
        value: accuracy,
        label: `${correctCount}/${i + 1}`
      });
    }

    return trendPoints;
  };

  const stats = calculateStats();
  const trendData = calculateTrendData();

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" /> Backtesting Engine
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Sport & League */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Sport</label>
              <select 
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Football">Football</option>
                <option value="NBA">NBA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">League</label>
              <input 
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="e.g. Premier League"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Matches to Check</label>
              <input 
                type="number"
                min="1"
                max="5"
                value={matchCount}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  const safeValue = Number.isFinite(parsed) ? Math.min(5, Math.max(1, parsed)) : 1;
                  setMatchCount(safeValue);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">Max 5 matches to preserve API limits.</p>
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Teams</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                  placeholder="e.g. Arsenal"
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  onClick={handleAddTeam}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-lg p-3 min-h-[100px] flex items-center justify-center">
               {selectedTeams.length === 0 ? (
                 <div className="text-center py-4">
                   <Users size={32} className="mx-auto text-slate-700 mb-2" />
                   <span className="text-slate-600 text-sm italic block">No teams added yet</span>
                   <span className="text-slate-700 text-xs block mt-1">Enter team names above and press + to add</span>
                 </div>
               ) : (
                 <div className="flex flex-wrap gap-2 w-full">
                   {selectedTeams.map(team => (
                     <span key={team} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-sm">
                       {team}
                       <button onClick={() => handleRemoveTeam(team)} className="hover:text-emerald-200"><Trash2 size={12} /></button>
                     </span>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Error</span>
                  {error}
                </div>
            </div>
        )}

        <button
          onClick={handleRunBacktest}
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            isLoading 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-lg hover:shadow-emerald-500/25'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {progress}
            </>
          ) : (
            <>
              <PlayCircle size={24} /> Run Historical Analysis
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {!isLoading && !stats && results.length === 0 && (
        <EmptyState 
          icon={Database}
          title="No backtest results yet"
          message="Configure the settings above and run a historical analysis to test AI prediction accuracy on past matches."
          size="lg"
        />
      )}

      {isLoading && results.length === 0 && (
        <div className="space-y-6">
          <LoadingState 
            icon={TrendingUp}
            title={progress}
            message="The AI is analyzing each historical match sequentially. This may take a few moments."
            size="lg"
          />
        </div>
      )}

      {stats && (
        <div className="space-y-6">
           {/* Summary Cards */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Matches Analyzed</div>
                 <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Correct Picks</div>
                 <div className="text-2xl font-bold text-emerald-400">{stats.correct}</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Model Accuracy</div>
                 <div className="text-2xl font-bold text-blue-400">{stats.accuracy}%</div>
              </div>
           </div>

           {/* Accuracy Trend Chart */}
           {trendData.length > 0 && (
             <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
               <div className="flex items-center gap-2 mb-4">
                 <TrendingUp size={18} className="text-emerald-400" />
                 <span className="text-lg font-semibold text-white">Rolling Accuracy</span>
               </div>
               <MiniTrendChart
                 data={trendData}
                 variant="area"
                 height={150}
                 color="#10b981"
                 label="Accuracy"
               />
             </div>
           )}

           {/* List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Match</th>
                     <th className="px-6 py-4">Actual Result</th>
                     <th className="px-6 py-4">AI Prediction</th>
                     <th className="px-6 py-4 text-right">Outcome</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {results.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{item.date}</td>
                      <td className="px-6 py-4">
                         <div className="font-bold text-white">{item.homeTeam} <span className="text-slate-500 font-normal">vs</span> {item.awayTeam}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{item.actualHomeScore}-{item.actualAwayScore}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{item.actualWinner}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${item.predictedWinner === item.actualWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                                    Picked {item.predictedWinner}
                                </span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span title="Home Win Probability" className="text-emerald-500/80">H: {(item.predictedProbabilities.homeWin * 100).toFixed(0)}%</span>
                                <span title="Draw Probability">D: {(item.predictedProbabilities.draw * 100).toFixed(0)}%</span>
                                <span title="Away Win Probability" className="text-blue-500/80">A: {(item.predictedProbabilities.awayWin * 100).toFixed(0)}%</span>
                             </div>
                             <span className="text-xs text-slate-500 truncate max-w-[200px]" title={item.explanation}>{item.explanation}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {item.isCorrect ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={14}/> Correct</span>
                         ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={14}/> Incorrect</span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

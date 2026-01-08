
import React, { useState, useEffect } from 'react';
import { League, Match, SportFilter } from '../types';
import { geminiService } from '../services/geminiService';
import { MatchList } from './MatchList';
import { ChevronDown, ChevronRight, Trophy, RefreshCw } from 'lucide-react';

interface LeagueAccordionProps {
  league: League;
  filter: SportFilter;
  searchQuery: string;
  onSelectMatch: (match: Match) => void;
  autoExpand?: boolean;
  isDemoMode?: boolean;
}

export const LeagueAccordion: React.FC<LeagueAccordionProps> = ({
  league,
  filter,
  searchQuery,
  onSelectMatch,
  autoExpand = false,
  isDemoMode = false
}) => {
  const [isOpen, setIsOpen] = useState(autoExpand);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // If autoExpand is true on mount, fetch immediately (only if not demo mode)
  useEffect(() => {
    if (autoExpand && !hasFetched && !isDemoMode) {
        fetchMatches();
    }
  }, [autoExpand, isDemoMode]);

  // In demo mode, use league.matches directly; otherwise fetch
  const displayMatches = isDemoMode ? (league.matches || []) : matches;

  const fetchMatches = async () => {
    if (isDemoMode) return; // Don't fetch in demo mode

    setIsLoading(true);
    try {
        const data = await geminiService.fetchMatchesByLeague(league);
        setMatches(data);
        setHasFetched(true);
    } catch (error) {
        console.error("Error fetching league matches:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!isOpen && !hasFetched && !isDemoMode) {
        fetchMatches();
    }
    setIsOpen(!isOpen);
  };

  const handleRefresh = (e: React.MouseEvent) => {
      e.stopPropagation();
      fetchMatches();
  };

  // Filter matches based on search query (local filtering)
  const filteredMatches = displayMatches.filter(m =>
      m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <div
        onClick={toggleOpen}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${league.sport === 'NBA' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Trophy size={16} />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg">{league.name}</h3>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{league.country}</div>
            </div>
        </div>

        <div className="flex items-center gap-3">
             {(hasFetched || isDemoMode) && (
                 <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                     {displayMatches.length} Matches
                 </span>
             )}
             {!isDemoMode && (
             <button
                onClick={handleRefresh}
                className="p-2 hover:bg-slate-600 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Refresh League"
             >
                 <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
             </button>
             )}
             {isOpen ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronRight size={20} className="text-slate-500" />}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-slate-700 p-4 bg-slate-900/30">
            {isLoading && displayMatches.length === 0 ? (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    Loading fixtures for {league.name}...
                </div>
            ) : (
                <MatchList
                    matches={filteredMatches}
                    onSelectMatch={onSelectMatch}
                    isLoading={false}
                    filter={filter}
                    searchQuery={searchQuery}
                    onRefresh={() => {}} // Handled by header refresh
                    isDemoMode={isDemoMode}
                />
            )}
        </div>
      )}
    </div>
  );
};

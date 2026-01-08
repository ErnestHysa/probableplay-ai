
import React, { useState, useEffect } from 'react';
import { League, Match, SportFilter } from '../types';
import { geminiService } from '../services/geminiService';
import { LeagueAccordion } from './LeagueAccordion';
import { Search, Loader2 } from 'lucide-react';
import { Filters } from './Filters';

interface DashboardProps {
  onSelectMatch: (match: Match) => void;
  filter: SportFilter;
  setFilter: (f: SportFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectMatch,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery
}) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
        fetchLeagues();
    }
  }, [hasInitialized]);

  // Re-fetch if sport filter changes heavily? 
  // For now, we fetch 'All' initially or we can refetch on filter change.
  useEffect(() => {
      if (hasInitialized) {
          fetchLeagues();
      }
  }, [filter]);

  const fetchLeagues = async () => {
    setIsLoadingLeagues(true);
    try {
        const data = await geminiService.fetchActiveLeagues(filter);
        setLeagues(data);
        setHasInitialized(true);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoadingLeagues(false);
    }
  };

  return (
    <div>
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl font-bold text-white mb-2">Game Day Intelligence</h2>
        <p className="text-slate-400">Select a league to view today's fixtures and get AI insights.</p>
      </div>

      <Filters 
        activeSport={filter}
        onSportChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isLoadingLeagues ? (
         <div className="text-center py-20">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-400 text-lg">Scanning global leagues for today's matches...</p>
         </div>
      ) : leagues.length === 0 ? (
         <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-800">
             <Search size={48} className="mx-auto text-slate-600 mb-4" />
             <p className="text-slate-400 text-lg">No active leagues found for today.</p>
             <button 
                onClick={fetchLeagues}
                className="mt-4 px-4 py-2 bg-slate-700 rounded text-white hover:bg-slate-600 transition-colors"
             >
                Try Again
             </button>
         </div>
      ) : (
         <div className="space-y-2">
             {leagues.map((league) => (
                 <LeagueAccordion 
                    key={league.id}
                    league={league}
                    filter={filter}
                    searchQuery={searchQuery}
                    onSelectMatch={onSelectMatch}
                    autoExpand={false}
                 />
             ))}
         </div>
      )}
    </div>
  );
};

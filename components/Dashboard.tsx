
import React, { useState, useEffect } from 'react';
import { League, Match, SportFilter } from '../types';
import { geminiService } from '../services/geminiService';
import { LeagueAccordion } from './LeagueAccordion';
import { Search, Loader2, Eye } from 'lucide-react';
import { Filters } from './Filters';
import { useAuth } from '../src/contexts/AuthContext';

// Demo data for unauthenticated users
const DEMO_LEAGUES: League[] = [
  {
    id: 'demo-premier-league',
    name: 'Premier League',
    sport: 'Football',
    country: 'England',
    matches: [
      {
        id: 'demo-match-1',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        date: '2025-01-15',
        time: '17:30',
        league: 'Premier League',
        sport: 'Football'
      },
      {
        id: 'demo-match-2',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        date: '2025-01-15',
        time: '20:00',
        league: 'Premier League',
        sport: 'Football'
      },
      {
        id: 'demo-match-3',
        homeTeam: 'Manchester City',
        awayTeam: 'Tottenham',
        date: '2025-01-15',
        time: '20:00',
        league: 'Premier League',
        sport: 'Football'
      }
    ]
  },
  {
    id: 'demo-la-liga',
    name: 'La Liga',
    sport: 'Football',
    country: 'Spain',
    matches: [
      {
        id: 'demo-match-4',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        date: '2025-01-15',
        time: '21:00',
        league: 'La Liga',
        sport: 'Football'
      },
      {
        id: 'demo-match-5',
        homeTeam: 'Atletico Madrid',
        awayTeam: 'Sevilla',
        date: '2025-01-15',
        time: '19:00',
        league: 'La Liga',
        sport: 'Football'
      }
    ]
  },
  {
    id: 'demo-nba',
    name: 'NBA',
    sport: 'Basketball',
    country: 'USA',
    matches: [
      {
        id: 'demo-match-6',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        date: '2025-01-15',
        time: '22:00',
        league: 'NBA',
        sport: 'Basketball'
      },
      {
        id: 'demo-match-7',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Miami Heat',
        date: '2025-01-15',
        time: '19:30',
        league: 'NBA',
        sport: 'Basketball'
      }
    ]
  }
];

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
  const { isAuthenticated } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use demo data for unauthenticated users
  const displayLeagues = isAuthenticated ? leagues : DEMO_LEAGUES;
  const isLoading = isAuthenticated ? isLoadingLeagues : false;

  useEffect(() => {
    if (isAuthenticated && !hasInitialized) {
        fetchLeagues();
    }
  }, [hasInitialized, isAuthenticated]);

  // Re-fetch if sport filter changes heavily?
  // For now, we fetch 'All' initially or we can refetch on filter change.
  useEffect(() => {
      if (isAuthenticated && hasInitialized) {
          fetchLeagues();
      }
  }, [filter, isAuthenticated, hasInitialized]);

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

  // Filter demo data by sport
  const filteredLeagues = displayLeagues.filter(league => {
    if (filter === 'All') return true;
    if (filter === 'Football') return league.sport === 'Football';
    if (filter === 'Basketball') return league.sport === 'Basketball';
    return true;
  });

  return (
    <div>
      <div className="mb-8 text-center md:text-left">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold text-white">Game Day Intelligence</h2>
          {!isAuthenticated && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full flex items-center gap-1">
              <Eye size={14} />
              Demo Mode
            </span>
          )}
        </div>
        <p className="text-slate-400">
          {isAuthenticated
            ? 'Select a league to view today\'s fixtures and get AI insights.'
            : 'Browse demo matches to explore the app. Sign up to get real AI predictions on live fixtures.'}
        </p>
      </div>

      <Filters
        activeSport={filter}
        onSportChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isLoading ? (
         <div className="text-center py-20">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-400 text-lg">Scanning global leagues for today's matches...</p>
         </div>
      ) : filteredLeagues.length === 0 ? (
         <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-800">
             <Search size={48} className="mx-auto text-slate-600 mb-4" />
             <p className="text-slate-400 text-lg">No active leagues found for today.</p>
             {isAuthenticated && (
               <button
                  onClick={fetchLeagues}
                  className="mt-4 px-4 py-2 bg-slate-700 rounded text-white hover:bg-slate-600 transition-colors"
               >
                  Try Again
               </button>
             )}
         </div>
      ) : (
         <div className="space-y-2">
             {filteredLeagues.map((league) => (
                 <LeagueAccordion
                    key={league.id}
                    league={league}
                    filter={filter}
                    searchQuery={searchQuery}
                    onSelectMatch={onSelectMatch}
                    autoExpand={false}
                    isDemoMode={!isAuthenticated}
                 />
             ))}
         </div>
      )}
    </div>
  );
};

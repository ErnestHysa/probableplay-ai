import React, { useMemo } from 'react';
import { Match, SportFilter } from '../types';
import { Calendar, ChevronRight, RefreshCw, Clock, Search } from 'lucide-react';
import { LoadingState, EmptyState, SkeletonCard } from './ui';
import { Match, SportFilter, ExtendedFilters, MatchStatus } from '../types';
import { Calendar, ChevronRight, RefreshCw, Clock } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  isLoading: boolean;
  filter?: SportFilter;
  filters?: ExtendedFilters;
  searchQuery: string;
  onRefresh: () => void;
}

export const MatchList: React.FC<MatchListProps> = ({ 
  matches, 
  onSelectMatch, 
  isLoading, 
  filter, 
  filters,
  searchQuery,
  onRefresh 
}) => {
  
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const activeFilters = filters || { sport: filter || 'All', status: 'All', confidenceThreshold: 0 };
      
      const matchesSport = activeFilters.sport === 'All' || match.sport.toLowerCase().includes(activeFilters.sport.toLowerCase());
      const matchesStatus = activeFilters.status === 'All' || match.status === activeFilters.status;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        match.homeTeam.toLowerCase().includes(query) || 
        match.awayTeam.toLowerCase().includes(query) || 
        match.league.toLowerCase().includes(query);
      
      let matchesKickoff = true;
      if (activeFilters.kickoffWindow?.startHour !== undefined || activeFilters.kickoffWindow?.endHour !== undefined) {
        try {
          const matchTime = new Date(match.startTime);
          const hour = matchTime.getHours();
          const startHour = activeFilters.kickoffWindow?.startHour;
          const endHour = activeFilters.kickoffWindow?.endHour;
          
          if (startHour !== undefined && endHour !== undefined) {
            matchesKickoff = hour >= startHour && hour < endHour;
          } else if (startHour !== undefined) {
            matchesKickoff = hour >= startHour;
          } else if (endHour !== undefined) {
            matchesKickoff = hour < endHour;
          }
        } catch (e) {
          matchesKickoff = true;
        }
      }
      
      return matchesSport && matchesStatus && matchesSearch && matchesKickoff;
    });
  }, [matches, filter, filters, searchQuery]);

  // Helper to format date nicely
  const formatMatchTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // Validate date
      if (isNaN(date.getTime())) return "Time TBD";

      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      // Check if it's tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      if (isToday) return `Today, ${timeStr}`;
      if (isTomorrow) return `Tomorrow, ${timeStr}`;
      return `${date.toLocaleDateString([], {month: 'short', day: 'numeric'})}, ${timeStr}`;
    } catch (e) {
      return isoString;
    }
  };

  if (isLoading && matches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-100">Today's Fixtures</h2>
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh Fixtures"
          >
            <RefreshCw size={18} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <SkeletonCard variant="match" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">Today's Fixtures</h2>
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50"
          title="Refresh Fixtures"
        >
          <RefreshCw size={18} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <EmptyState 
          icon={searchQuery ? Search : Calendar}
          title={searchQuery ? "No matches found" : "No fixtures available"}
          message={searchQuery 
            ? "Try adjusting your search term or changing the sport filter." 
            : "No matches scheduled for today. Try changing the sport filter or refresh to check for updates."}
          action={{
            label: "Refresh Fixtures",
            onClick: onRefresh,
            icon: RefreshCw
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => (
            <div 
              key={match.id}
              onClick={() => onSelectMatch(match)}
              className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer transition-all duration-200 relative overflow-hidden"
            >
              {/* Hover Glow Effect */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700 text-slate-300 truncate max-w-[60%]">
                  {match.sport} • {match.league}
                </span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 shrink-0 bg-emerald-500/10 px-2 py-1 rounded">
                  <Clock size={12} />
                  {formatMatchTime(match.startTime)}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {match.homeTeam}
                  </span>
                  <span className="text-xs text-slate-500">HOME</span>
                </div>
                <div className="w-full h-px bg-slate-700"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {match.awayTeam}
                  </span>
                  <span className="text-xs text-slate-500">AWAY</span>
                </div>
              </div>

              <div className="mt-4 flex items-center text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Get AI Prediction <ChevronRight size={16} className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
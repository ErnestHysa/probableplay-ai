import React, { useMemo } from 'react';
import { Match, SportFilter, ExtendedFilters, MatchStatus, AISnapshot } from '../types';
import { Calendar, ChevronRight, RefreshCw, Clock, Search, Eye, Zap, Info } from 'lucide-react';
import { LoadingState, EmptyState, SkeletonCard } from './ui';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  isLoading: boolean;
  filter?: SportFilter;
  filters?: ExtendedFilters;
  searchQuery: string;
  onRefresh: () => void;
  aiSnapshot?: AISnapshot;
}

export const MatchList: React.FC<MatchListProps> = ({ 
  matches, 
  onSelectMatch, 
  isLoading, 
  filter, 
  filters,
  searchQuery,
  onRefresh,
  aiSnapshot
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

  const getConfidenceLevel = (probabilities?: { homeWin: number; draw: number; awayWin: number }) => {
    if (!probabilities) return 'Low';
    
    const maxProb = Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin);
    if (maxProb >= 65) return 'High';
    if (maxProb >= 45) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'High': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'Medium': return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' };
      case 'Low': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      default: return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' };
    }
  };

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'Live': return <Eye size={12} className="text-red-400" />;
      case 'Scheduled': return <Clock size={12} className="text-slate-400" />;
      case 'Finished': return <Info size={12} className="text-slate-500" />;
      default: return <Clock size={12} className="text-slate-400" />;
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

              {/* AI Snippet Row */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                {aiSnapshot?.latestPrediction ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium text-slate-400">AI Insight</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchStatusIcon(match.status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          match.status === 'Live' ? 'bg-red-500/20 text-red-400' :
                          match.status === 'Scheduled' ? 'bg-slate-700 text-slate-400' :
                          'bg-slate-700 text-slate-500'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {truncateText(aiSnapshot.latestPrediction.summary, 80)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <span className="text-xs text-emerald-400 font-mono">
                          {Math.round(aiSnapshot.latestPrediction.probabilities.homeWin)}%
                        </span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-amber-400 font-mono">
                          {Math.round(aiSnapshot.latestPrediction.probabilities.draw)}%
                        </span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-red-400 font-mono">
                          {Math.round(aiSnapshot.latestPrediction.probabilities.awayWin)}%
                        </span>
                      </div>
                      <div
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: getConfidenceColor(
                            getConfidenceLevel(aiSnapshot.latestPrediction.probabilities)
                          ).bg,
                          color: getConfidenceColor(
                            getConfidenceLevel(aiSnapshot.latestPrediction.probabilities)
                          ).text
                        }}
                      >
                        {getConfidenceLevel(aiSnapshot.latestPrediction.probabilities)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-slate-500" />
                        <span className="text-xs font-medium text-slate-500">AI Insight</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMatchStatusIcon(match.status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          match.status === 'Live' ? 'bg-red-500/20 text-red-400' :
                          match.status === 'Scheduled' ? 'bg-slate-700 text-slate-400' :
                          'bg-slate-700 text-slate-500'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic">
                      No predictions yet. Select this match to generate AI insights.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <span className="text-xs text-slate-600 font-mono">--%</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-600 font-mono">--%</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-600 font-mono">--%</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-700 text-slate-500">
                        No Data
                      </span>
                    </div>
                  </div>
                )}
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
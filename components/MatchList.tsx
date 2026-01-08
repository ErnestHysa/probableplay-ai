
import React, { useMemo, useState } from 'react';
import { Match, SportFilter } from '../types';
import { Calendar, ChevronRight, RefreshCw, Clock, Radio, PlayCircle, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  isLoading: boolean;
  filter: SportFilter;
  searchQuery: string;
  onRefresh: () => void;
  isDemoMode?: boolean;
}

type TabType = 'ALL' | 'LIVE' | 'UPCOMING';

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  onSelectMatch,
  isLoading,
  filter,
  searchQuery,
  onRefresh,
  isDemoMode = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  const filteredMatches = useMemo(() => {
    let filtered = matches.filter(match => {
      // Sport Filter
      const matchesSport = filter === 'All' || match.sport.toLowerCase().includes(filter.toLowerCase());
      
      // Search Filter
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        match.homeTeam.toLowerCase().includes(query) || 
        match.awayTeam.toLowerCase().includes(query) || 
        match.league.toLowerCase().includes(query);
      
      // Tab Filter
      const matchesTab = 
        activeTab === 'ALL' ? true :
        activeTab === 'LIVE' ? match.status === 'Live' :
        activeTab === 'UPCOMING' ? match.status !== 'Live' : true;

      return matchesSport && matchesSearch && matchesTab;
    });

    // Sort: Live matches first, then by Start Time
    return filtered.sort((a, b) => {
        if (a.status === 'Live' && b.status !== 'Live') return -1;
        if (a.status !== 'Live' && b.status === 'Live') return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [matches, filter, searchQuery, activeTab]);

  // Helper to format date nicely
  const formatMatchTime = (match: Match) => {
    if (match.status === 'Live') {
        return "LIVE NOW";
    }

    try {
      const date = new Date(match.startTime);
      if (isNaN(date.getTime())) return "Time TBD";

      // Uses browser's default locale (which detects Greece automatically if set in OS/Browser)
      const timeStr = date.toLocaleTimeString(undefined, {
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false // Force 24h format which is standard in Greece
      });
      
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
          return `Today, ${timeStr}`;
      }
      
      return `${date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}, ${timeStr}`;
    } catch (e) {
      return match.startTime;
    }
  };

  const liveCount = matches.filter(m => m.status === 'Live').length;

  const handleMatchClick = (match: Match) => {
    if (isDemoMode) {
      setShowSignupModal(true);
    } else {
      onSelectMatch(match);
    }
  };

  if (isLoading && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 animate-pulse">Scouting live and upcoming fixtures...</p>
        <p className="text-xs text-slate-600">Verifying start times in your local timezone</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Today's Fixtures
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                {matches.length}
            </span>
        </h2>
        
        <div className="flex items-center gap-3">
             <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  ALL
                </button>
                <button 
                  onClick={() => setActiveTab('LIVE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'LIVE' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  <Radio size={12} className={activeTab === 'LIVE' || liveCount > 0 ? 'animate-pulse' : ''} />
                  LIVE ({liveCount})
                </button>
                <button 
                  onClick={() => setActiveTab('UPCOMING')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'UPCOMING' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  UPCOMING
                </button>
             </div>

            <button 
              onClick={onRefresh} 
              disabled={isLoading}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50 border border-slate-700"
              title="Refresh Fixtures"
            >
              <RefreshCw size={18} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-800">
          <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No matches found.</p>
          <p className="text-slate-600 text-sm mt-2">
             {activeTab === 'LIVE' ? "There are no games currently in progress." : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => {
            const isLive = match.status === 'Live';
            return (
                <div
                key={match.id}
                onClick={() => handleMatchClick(match)}
                className={`group bg-slate-800/50 hover:bg-slate-800 border ${isLive ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-slate-700 hover:border-emerald-500/50'} rounded-xl p-5 cursor-pointer transition-all duration-200 relative overflow-hidden ${isDemoMode ? 'ring-1 ring-amber-500/30' : ''}`}
                >
                {/* Demo Mode Badge */}
                {isDemoMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                      <Lock size={10} />
                      Demo
                    </span>
                  </div>
                )}

                {/* Hover Glow Effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700 text-slate-300 truncate max-w-[60%]">
                    {match.sport} • {match.league}
                    </span>
                    <span className={`text-xs font-mono flex items-center gap-1 shrink-0 px-2 py-1 rounded font-bold ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {isLive ? <Radio size={12} /> : <Clock size={12} />}
                    {formatMatchTime(match)}
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
                    {isDemoMode ? (
                      <>Sign up to unlock <Lock size={14} className="ml-1" /></>
                    ) : (
                      <>Get AI Prediction <ChevronRight size={16} className="ml-1" /></>
                    )}
                </div>
                </div>
            );
          })}
        </div>
      )}

      {/* Sign Up Modal for Demo Mode */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-8 border border-slate-700 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlock AI Predictions</h3>
                <p className="text-slate-400">Sign up to get real AI-powered predictions on live matches</p>
              </div>
              <button
                onClick={() => setShowSignupModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">AI-Powered Predictions</p>
                  <p className="text-slate-500 text-sm">Get intelligent predictions using Google Gemini AI</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Real-Time Data</p>
                  <p className="text-slate-500 text-sm">Access live fixtures from major leagues worldwide</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Lock size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Free to Start</p>
                  <p className="text-slate-500 text-sm">10 free predictions every week</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/auth/signup"
                onClick={() => setShowSignupModal(false)}
                className="w-full block text-center py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-orange-600 transition-all"
              >
                Create Free Account
              </Link>
              <button
                onClick={() => setShowSignupModal(false)}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ExtendedFilters, MatchStatus, SportFilter, Match } from '../types';
import { SPORTS_TABS, SUPPORTED_LEAGUES, SPORT_ICONS } from '../constants';
import { Search, X, Settings, Globe, Zap, Clock, Sliders, Target, Activity } from 'lucide-react';

interface FiltersProps {
  filters: ExtendedFilters;
  onFiltersChange: (filters: ExtendedFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allMatches: Match[];
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  allMatches
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const [resultsCount, setResultsCount] = useState(0);

  // Debounce search
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [debouncedSearch, onSearchChange]);

  // Update external search state
  useEffect(() => {
    setDebouncedSearch(searchQuery);
  }, [searchQuery]);

  // Calculate results count for aria-live
  useEffect(() => {
    const count = allMatches.filter(match => {
      const matchesSport = filters.sport === 'All' || match.sport.toLowerCase().includes(filters.sport.toLowerCase());
      const matchesStatus = filters.status === 'All' || match.status === filters.status;
      const query = debouncedSearch.toLowerCase();
      const matchesSearch = !query || 
        match.homeTeam.toLowerCase().includes(query) || 
        match.awayTeam.toLowerCase().includes(query) || 
        match.league.toLowerCase().includes(query);
      
      return matchesSport && matchesStatus && matchesSearch;
    }).length;
    setResultsCount(count);
  }, [filters, debouncedSearch, allMatches]);

  // Generate suggestions from leagues and teams
  const searchSuggestions = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 1) return [];
    
    const query = debouncedSearch.toLowerCase();
    const leagues = new Set<string>();
    const teams = new Set<string>();

    allMatches.forEach(match => {
      if (match.league.toLowerCase().includes(query)) {
        leagues.add(match.league);
      }
      if (match.homeTeam.toLowerCase().includes(query)) {
        teams.add(match.homeTeam);
      }
      if (match.awayTeam.toLowerCase().includes(query)) {
        teams.add(match.awayTeam);
      }
    });

    return [
      ...Array.from(leagues).slice(0, 2).map(l => ({ type: 'league', value: l })),
      ...Array.from(teams).slice(0, 3).map(t => ({ type: 'team', value: t }))
    ];
  }, [debouncedSearch, allMatches]);

  const handleSportChange = (sport: SportFilter) => {
    onFiltersChange({ ...filters, sport });
  };

  const handleStatusChange = (status: MatchStatus) => {
    onFiltersChange({ ...filters, status });
  };

  const handleConfidenceChange = (value: number) => {
    onFiltersChange({ ...filters, confidenceThreshold: value });
  };

  const handleKickoffWindowChange = (startHour?: number, endHour?: number) => {
    onFiltersChange({
      ...filters,
      kickoffWindow: { startHour, endHour }
    });
  };

  const handleClearSearch = useCallback(() => {
    setDebouncedSearch('');
    onSearchChange('');
    searchInputRef.current?.focus();
  }, [onSearchChange]);

  const handleSuggestionClick = (value: string) => {
    setDebouncedSearch(value);
    setShowSearchSuggestions(false);
  };

  const getSportIcon = (sport: SportFilter) => {
    if (sport === 'Football') return <Target size={16} />;
    if (sport === 'NBA') return <Activity size={16} />;
    return <Globe size={16} />;
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Main Control Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        {/* Sport Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
          {SPORTS_TABS.map((sport) => (
            <button
              key={sport}
              onClick={() => handleSportChange(sport)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                filters.sport === sport
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
              aria-pressed={filters.sport === sport}
            >
              {getSportIcon(sport)}
              <span className="hidden sm:inline">{sport}</span>
            </button>
          ))}
        </div>

        {/* Quick Status Toggles */}
        <div className="flex gap-2 flex-wrap lg:flex-nowrap">
          {['Live', 'Scheduled'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status as MatchStatus)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filters.status === status
                  ? 'bg-blue-600/80 text-white'
                  : filters.status === 'All'
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
              }`}
              aria-pressed={filters.status === status}
              title={`Filter by ${status} matches`}
            >
              <Zap size={12} className="inline mr-1" />
              {status}
            </button>
          ))}
          <button
            onClick={() => handleStatusChange('All')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filters.status === 'All'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            aria-pressed={filters.status === 'All'}
            title="Show all match statuses"
          >
            All
          </button>
        </div>

        {/* Advanced Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm ${
            showAdvanced
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
          }`}
          title="Open advanced filters"
          aria-expanded={showAdvanced}
        >
          <Sliders size={16} />
          <span className="hidden sm:inline">Advanced</span>
        </button>
      </div>

      {/* Search Bar with Suggestions */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-500" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search team, league..."
          value={debouncedSearch}
          onChange={(e) => {
            setDebouncedSearch(e.target.value);
            setShowSearchSuggestions(true);
          }}
          onFocus={() => setShowSearchSuggestions(true)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent block pl-10 pr-10 p-2.5 placeholder-slate-500 transition-all"
          aria-label="Search matches"
          aria-live="polite"
          aria-describedby="search-results-count"
        />
        {debouncedSearch && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {/* Search Suggestions Dropdown */}
        {showSearchSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
            <div className="max-h-48 overflow-y-auto">
              {searchSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion.value)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 text-sm transition-colors flex items-center gap-2 border-b border-slate-700 last:border-b-0"
                >
                  {suggestion.type === 'league' ? (
                    <Globe size={14} className="text-emerald-400" />
                  ) : (
                    <Zap size={14} className="text-blue-400" />
                  )}
                  <span>{suggestion.value}</span>
                  <span className="text-xs text-slate-500 ml-auto">
                    {suggestion.type === 'league' ? 'League' : 'Team'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Count Announcement */}
      <div id="search-results-count" className="sr-only">
        {resultsCount} matches found
      </div>

      {/* Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Advanced Filters</h3>
          </div>

          {/* Confidence Threshold */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">
              Confidence Threshold: <span className="text-emerald-400">{filters.confidenceThreshold}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.confidenceThreshold}
              onChange={(e) => handleConfidenceChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              aria-label="Confidence threshold filter"
            />
            <div className="text-xs text-slate-500 mt-1">Only show predictions above this confidence level</div>
          </div>

          {/* Kickoff Window */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <Clock size={14} />
              Kickoff Window
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                max="23"
                placeholder="Start (0-23)"
                value={filters.kickoffWindow?.startHour ?? ''}
                onChange={(e) => handleKickoffWindowChange(
                  e.target.value ? parseInt(e.target.value) : undefined,
                  filters.kickoffWindow?.endHour
                )}
                className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 transition-all"
                aria-label="Kickoff start hour"
              />
              <input
                type="number"
                min="0"
                max="23"
                placeholder="End (0-23)"
                value={filters.kickoffWindow?.endHour ?? ''}
                onChange={(e) => handleKickoffWindowChange(
                  filters.kickoffWindow?.startHour,
                  e.target.value ? parseInt(e.target.value) : undefined
                )}
                className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 transition-all"
                aria-label="Kickoff end hour"
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">Filter matches by kickoff time window</div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              onFiltersChange({
                sport: 'All',
                status: 'All',
                confidenceThreshold: 0,
                kickoffWindow: undefined
              });
              setShowAdvanced(false);
            }}
            className="w-full mt-2 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { SportFilter } from '../types';
import { SPORTS_TABS } from '../constants';
import { Search } from 'lucide-react';

interface FiltersProps {
  activeSport: SportFilter;
  onSportChange: (sport: SportFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({ 
  activeSport, 
  onSportChange, 
  searchQuery, 
  onSearchChange 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
        {SPORTS_TABS.map((sport) => (
          <button
            key={sport}
            onClick={() => onSportChange(sport)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeSport === sport 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-500" />
        </div>
        <input
          type="text"
          placeholder="Search team or league..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent block pl-10 p-2.5 placeholder-slate-500 transition-all"
        />
      </div>
    </div>
  );
};

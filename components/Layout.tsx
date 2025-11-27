
import React from 'react';
import { ShieldAlert, Trophy, LayoutDashboard, History, FlaskConical, FileText } from 'lucide-react';
import { DISCLAIMER_TEXT } from '../constants';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentView }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate(ViewState.DASHBOARD)}
          >
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Trophy size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              ProbablePlay AI
            </h1>
          </div>
          
          <nav className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar">
             <button 
                onClick={() => onNavigate(ViewState.DASHBOARD)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 ${currentView === ViewState.DASHBOARD ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
             >
               <LayoutDashboard size={18} />
               <span className="hidden sm:inline">Today's Fixtures</span>
             </button>
             <button 
                onClick={() => onNavigate(ViewState.DETAILED_FORECAST)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 ${currentView === ViewState.DETAILED_FORECAST ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
             >
               <FileText size={18} />
               <span className="hidden sm:inline">Detailed AI Forecast</span>
             </button>
             <button 
                onClick={() => onNavigate(ViewState.HISTORY)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 ${currentView === ViewState.HISTORY ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
             >
               <History size={18} />
               <span className="hidden sm:inline">History</span>
             </button>
             <button 
                onClick={() => onNavigate(ViewState.BACKTEST)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 ${currentView === ViewState.BACKTEST ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
             >
               <FlaskConical size={18} />
               <span className="hidden sm:inline">Backtest Lab</span>
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer / Disclaimer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4 text-amber-500">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Responsible Use Disclaimer</h3>
          <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
            {DISCLAIMER_TEXT}
          </p>
          <div className="mt-6 text-xs text-slate-600">
            Powered by Google Gemini • Data sourced via Google Search
          </div>
        </div>
      </footer>
    </div>
  );
};

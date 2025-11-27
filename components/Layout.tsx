
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
  const navItems = [
    { view: ViewState.DASHBOARD, icon: LayoutDashboard, label: "Today's Fixtures" },
    { view: ViewState.DETAILED_FORECAST, icon: FileText, label: "Detailed AI Forecast" },
    { view: ViewState.HISTORY, icon: History, label: "History" },
    { view: ViewState.BACKTEST, icon: FlaskConical, label: "Backtest Lab" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-0 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate(ViewState.DASHBOARD)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            aria-label="ProbablePlay AI Home"
          >
            <div className="bg-emerald-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Trophy size={18} sm:size={20} className="text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline">
              ProbablePlay AI
            </h1>
          </button>

          {/* Navigation */}
          <nav 
            className="flex items-center gap-1 sm:gap-2 lg:gap-6 overflow-x-auto no-scrollbar flex-1"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap px-2 sm:px-3 py-2 rounded-md ${
                  currentView === view
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50'
                }`}
                aria-current={currentView === view ? 'page' : undefined}
                title={label}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
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

/**
 * Layout Component
 *
 * Main app layout with header navigation and footer.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Trophy, LayoutDashboard, History, FlaskConical, FileText, BarChart3, User, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';
import { DISCLAIMER_TEXT } from '../constants';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentView }) => {
  const { isAuthenticated, user, signOut, isPro } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/signin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate(ViewState.DASHBOARD)}
          >
            <div className="bg-gradient-to-br from-blue-500 to-orange-500 p-2 rounded-lg">
              <Trophy size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
              ProbablePlay AI
            </h1>
          </div>

          <nav className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onNavigate(ViewState.DASHBOARD)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.DASHBOARD ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Today's Fixtures</span>
            </button>

            <button
              onClick={() => onNavigate(ViewState.DETAILED_FORECAST)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.DETAILED_FORECAST ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
            >
              <FileText size={18} />
              <span className="hidden sm:inline">Detailed</span>
            </button>

            <button
              onClick={() => onNavigate(ViewState.HISTORY)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.HISTORY ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
            >
              <History size={18} />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              onClick={() => onNavigate(ViewState.BACKTEST)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.BACKTEST ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
            >
              <FlaskConical size={18} />
              <span className="hidden sm:inline">Backtest</span>
            </button>

            <button
              onClick={() => onNavigate(ViewState.STATISTICS)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.STATISTICS ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
            >
              <BarChart3 size={18} />
              <span className="hidden sm:inline">Statistics</span>
            </button>

            <button
              onClick={() => onNavigate(ViewState.PRICING)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.PRICING ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
            >
              <Zap size={18} />
              <span className="hidden sm:inline">Pricing</span>
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            {/* Auth buttons or Profile */}
            {isAuthenticated ? (
              <button
                onClick={() => onNavigate(ViewState.PROFILE)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${currentView === ViewState.PROFILE ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPro ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-slate-700'}`}>
                  <User size={14} className={isPro ? 'text-white' : 'text-slate-300'} />
                </div>
                <span className="hidden sm:inline">Profile</span>
                {isPro && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium rounded-full">
                    <Zap size={10} />
                    PRO
                  </span>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/signin"
                  className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="text-sm font-medium bg-gradient-to-r from-blue-500 to-orange-500 text-white px-3 py-1.5 rounded-lg hover:from-blue-600 hover:to-orange-600 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Guest Banner - shown when not authenticated */}
      {!isAuthenticated && (
        <div className="sticky top-16 z-40 bg-gradient-to-r from-blue-600 to-orange-500 px-4 py-2 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-sm text-white font-medium">
              Browse the app in demo mode. <span className="opacity-90">Sign up for free predictions!</span>
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/auth/signin"
                className="text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="text-sm font-medium bg-white text-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}

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
            Powered by Google Gemini AI • Sports data via TheSportsDB API
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

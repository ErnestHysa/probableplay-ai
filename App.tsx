/**
 * ProbablePlay AI - Main App Component
 *
 * Central application component with auth integration and routing.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PredictionView } from './components/PredictionView';
import { DetailedForecastView } from './components/DetailedForecastView';
import { HistoryView } from './components/HistoryView';
import { BacktestView } from './components/BacktestView';
import { ProfileView } from './src/components/ProfileView';
import { PricingView } from './src/components/PricingView';
import { StatisticsView } from './src/components/StatisticsView';
import { SignIn } from './src/components/auth/SignIn';
import { SignUp } from './src/components/auth/SignUp';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { Match, PredictionResult, ViewState, SportFilter, DetailedForecastResult } from './types';
import { geminiService } from './services/geminiService';
import { historyService } from './services/historyService';

// Inner App component that uses auth context
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, refreshProfile, logUsage } = useAuth();

  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Data State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [detailedForecast, setDetailedForecast] = useState<DetailedForecastResult | null>(null);

  // Shared Filter State
  const [activeSport, setActiveSport] = useState<SportFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Async State
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    if (!geminiService.isConfigured) {
      setHasApiKey(false);
    }
  }, []);

  // Flow 1: Standard Prediction (Dashboard Tab)
  const handleSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    setView(ViewState.DETAIL);
    setPrediction(null);
    setPredictionError(null);
    setIsPredicting(true);

    try {
      if (!geminiService.isConfigured) throw new Error("API Key missing");

      const result = await geminiService.predictMatch(match);
      setPrediction(result);

      // Save to history (localStorage for now, will migrate to Supabase)
      historyService.savePrediction(match, result, 'STANDARD');

      // Log usage for Supabase
      if (isAuthenticated) {
        await logUsage('standard_prediction');
        await refreshProfile();
      }

    } catch (err: any) {
      console.error(err);
      setPredictionError(err.message || "Failed to generate prediction.");
    } finally {
      setIsPredicting(false);
    }
  };

  // Flow 2: Detailed Forecast (Detailed Forecast Tab)
  const handleSelectDetailedMatch = async (match: Match) => {
    setSelectedMatch(match);
    if (view !== ViewState.DETAILED_FORECAST) setView(ViewState.DETAILED_FORECAST);

    setDetailedForecast(null);
    setPredictionError(null);
    setIsPredicting(true);

    try {
      if (!geminiService.isConfigured) throw new Error("API Key missing");

      const result = await geminiService.getDetailedForecast(match);
      setDetailedForecast(result);

      // Save to history
      historyService.savePrediction(match, result, 'DETAILED');

      // Log usage for Supabase
      if (isAuthenticated) {
        await logUsage('detailed_prediction');
        await refreshProfile();
      }

    } catch (err: any) {
      console.error(err);
      setPredictionError(err.message || "Failed to generate detailed forecast.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleBack = () => {
    if (view === ViewState.DETAIL) {
      setView(ViewState.DASHBOARD);
    } else if (view === ViewState.DETAILED_FORECAST) {
      setSelectedMatch(null);
    }
    setPrediction(null);
    setDetailedForecast(null);
  };

  const handleNavigate = (newView: ViewState) => {
    setView(newView);
    setSelectedMatch(null);
    setPrediction(null);
    setDetailedForecast(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // API Key missing
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl max-w-md text-center border border-red-500/50">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Error</h2>
          <p className="text-slate-300 mb-4">GEMINI_API_KEY is missing. Please add it to your .env.local file.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      onNavigate={handleNavigate}
      currentView={view}
    >
      {/* DASHBOARD VIEW */}
      {view === ViewState.DASHBOARD && (
        <Dashboard
          onSelectMatch={handleSelectMatch}
          filter={activeSport}
          setFilter={setActiveSport}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* PREDICTION DETAIL VIEW */}
      {view === ViewState.DETAIL && selectedMatch && (
        <PredictionView
          match={selectedMatch}
          prediction={prediction}
          isLoading={isPredicting}
          error={predictionError}
          onBack={handleBack}
        />
      )}

      {/* DETAILED FORECAST TAB */}
      {view === ViewState.DETAILED_FORECAST && (
        <>
          {!selectedMatch ? (
            <>
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">Detailed AI Forecast</h2>
                <p className="text-slate-400">Select a league and match to generate a granular deep-dive report.</p>
              </div>

              <Dashboard
                onSelectMatch={handleSelectDetailedMatch}
                filter={activeSport}
                setFilter={setActiveSport}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </>
          ) : (
            <DetailedForecastView
              match={selectedMatch}
              forecast={detailedForecast}
              isLoading={isPredicting}
              error={predictionError}
              onBack={handleBack}
            />
          )}
        </>
      )}

      {/* HISTORY VIEW */}
      {view === ViewState.HISTORY && (
        <HistoryView />
      )}

      {/* BACKTEST VIEW */}
      {view === ViewState.BACKTEST && (
        <ProtectedRoute requirePro={true}>
          <BacktestView />
        </ProtectedRoute>
      )}

      {/* PROFILE VIEW */}
      {view === ViewState.PROFILE && (
        <ProfileView onNavigate={handleNavigate} />
      )}

      {/* PRICING VIEW */}
      {view === ViewState.PRICING && (
        <PricingView onNavigate={handleNavigate} />
      )}

      {/* STATISTICS VIEW */}
      {view === ViewState.STATISTICS && (
        <ProtectedRoute requirePro={true}>
          <StatisticsView onNavigate={handleNavigate} />
        </ProtectedRoute>
      )}
    </Layout>
  );
};

// Root App with providers
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />

          {/* Protected main app */}
          <Route path="/*" element={<AppContent />} />

          {/* Redirect root to main app */}
          <Route path="/" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

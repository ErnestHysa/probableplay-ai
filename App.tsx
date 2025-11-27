
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { MatchList } from './components/MatchList';
import { PredictionView } from './components/PredictionView';
import { DetailedForecastView } from './components/DetailedForecastView';
import { HistoryView } from './components/HistoryView';
import { BacktestView } from './components/BacktestView';
import { Filters } from './components/Filters';
import { Match, PredictionResult, ViewState, SportFilter, DetailedForecastResult } from './types';
import { geminiService } from './services/geminiService';
import { historyService } from './services/historyService';
import { PLACEHOLDER_MATCHES } from './constants';

// Cache key for matches
const MATCHES_CACHE_KEY = 'probable_play_matches_cache_v2';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // Data State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [detailedForecast, setDetailedForecast] = useState<DetailedForecastResult | null>(null);
  
  // UI State
  const [activeSport, setActiveSport] = useState<SportFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Async State
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    if (!geminiService.isConfigured) {
      setHasApiKey(false);
      setMatches(PLACEHOLDER_MATCHES);
    } else {
      initializeMatches();
    }
  }, []);

  const initializeMatches = () => {
    const cachedData = localStorage.getItem(MATCHES_CACHE_KEY);
    if (cachedData) {
      try {
        const { timestamp, data } = JSON.parse(cachedData);
        const cacheDate = new Date(timestamp);
        const now = new Date();
        const isSameDay = cacheDate.toDateString() === now.toDateString();
        
        if (isSameDay && Array.isArray(data) && data.length > 0) {
          setMatches(data);
          return;
        }
      } catch (e) {
        localStorage.removeItem(MATCHES_CACHE_KEY);
      }
    }
    fetchMatches();
  };

  const fetchMatches = async () => {
    if (!geminiService.isConfigured) return;
    setIsLoadingMatches(true);
    try {
      const data = await geminiService.fetchTodaysMatches();
      if (data.length > 0) {
        setMatches(data);
        localStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
      } else {
        setMatches(PLACEHOLDER_MATCHES);
      }
    } catch (err) {
      console.error(err);
      setMatches(PLACEHOLDER_MATCHES); 
    } finally {
      setIsLoadingMatches(false);
    }
  };

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
      // Save as Standard type
      historyService.savePrediction(match, result, 'STANDARD');
      
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
    // Stay in DETAILED_FORECAST view, but now we have a selected match to show
    setDetailedForecast(null);
    setPredictionError(null);
    setIsPredicting(true);

    try {
      if (!geminiService.isConfigured) throw new Error("API Key missing");
      
      const result = await geminiService.getDetailedForecast(match);
      setDetailedForecast(result);
      // Save as Detailed type
      historyService.savePrediction(match, result, 'DETAILED');
      
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
        // Just clear selection to go back to list within the same tab
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

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl max-w-md text-center border border-red-500/50">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Error</h2>
          <p className="text-slate-300 mb-4">API Key Missing.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      onNavigate={handleNavigate}
      currentView={view}
    >
      {/* 1. DASHBOARD VIEW */}
      {view === ViewState.DASHBOARD && (
        <>
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Game Day Intelligence</h2>
            <p className="text-slate-400">Quick AI insights for today's fixtures.</p>
          </div>
          
          <Filters 
            activeSport={activeSport}
            onSportChange={setActiveSport}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          
          <MatchList 
            matches={matches} 
            onSelectMatch={handleSelectMatch}
            isLoading={isLoadingMatches}
            filter={activeSport}
            searchQuery={searchQuery}
            onRefresh={fetchMatches}
          />
        </>
      )}

      {/* 2. PREDICTION DETAIL VIEW (Sub-view of Dashboard) */}
      {view === ViewState.DETAIL && selectedMatch && (
        <PredictionView 
          match={selectedMatch}
          prediction={prediction}
          isLoading={isPredicting}
          error={predictionError}
          onBack={handleBack}
        />
      )}

      {/* 3. DETAILED FORECAST TAB */}
      {view === ViewState.DETAILED_FORECAST && (
        <>
            {!selectedMatch ? (
                // Show match list specifically for Detailed Forecast selection
                <>
                     <div className="mb-8 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">Detailed AI Forecast</h2>
                        <p className="text-slate-400">Select a match to generate a granular deep-dive report (Scorers, Cards, Halves).</p>
                    </div>
                    
                    <Filters 
                        activeSport={activeSport}
                        onSportChange={setActiveSport}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    <MatchList 
                        matches={matches} 
                        onSelectMatch={handleSelectDetailedMatch} // Uses separate handler
                        isLoading={isLoadingMatches}
                        filter={activeSport}
                        searchQuery={searchQuery}
                        onRefresh={fetchMatches}
                    />
                </>
            ) : (
                // Show the specific detailed forecast view
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

      {/* 4. HISTORY VIEW */}
      {view === ViewState.HISTORY && (
        <HistoryView />
      )}

      {/* 5. BACKTEST VIEW */}
      {view === ViewState.BACKTEST && (
        <BacktestView />
      )}
    </Layout>
  );
};

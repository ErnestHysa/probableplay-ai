
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { MatchList } from './components/MatchList';
import { Filters } from './components/Filters';
import { DashboardSummary } from './components/dashboard/DashboardSummary';
import { Match, PredictionResult, ViewState, DetailedForecastResult, ExtendedFilters, AISnapshot } from './types';
import { geminiService } from './services/geminiService';
import { historyService } from './services/historyService';
import { PLACEHOLDER_MATCHES } from './constants';

const PredictionView = lazy(() => import('./components/PredictionView').then(m => ({ default: m.PredictionView })));
const DetailedForecastView = lazy(() => import('./components/DetailedForecastView').then(m => ({ default: m.DetailedForecastView })));
const HistoryView = lazy(() => import('./components/HistoryView').then(m => ({ default: m.HistoryView })));
const BacktestView = lazy(() => import('./components/BacktestView').then(m => ({ default: m.BacktestView })));

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ExtendedFilters>({
    sport: 'All',
    status: 'All',
    confidenceThreshold: 0
  });
  
  // Async State
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [aiSnapshot, setAiSnapshot] = useState<AISnapshot>({
    latestPrediction: null,
    accuracy: 0,
    totalPredictions: 0,
    trendData: []
  });

  useEffect(() => {
    if (!geminiService.isConfigured) {
      setHasApiKey(false);
      setMatches(PLACEHOLDER_MATCHES);
      setIsLoadingMatches(false);
    } else {
      initializeMatches();
    }
  }, []);

  const generateAISnapshot = (): AISnapshot => {
    const history = historyService.getHistory();
    
    if (history.length === 0) {
      return {
        latestPrediction: null,
        accuracy: 0,
        totalPredictions: 0,
        trendData: []
      };
    }

    // Get latest standard prediction
    const latestStandard = history.find(item => item.type === 'STANDARD' && item.standardPrediction);
    const latestPrediction = latestStandard?.standardPrediction || null;

    // Calculate accuracy
    const finishedItems = history.filter(item => item.result?.isFinished);
    const correctItems = finishedItems.filter(item => {
      if (!item.standardPrediction) return false;
      
      const pred = item.standardPrediction.probabilities;
      const predictedWinner = pred.homeWin > pred.awayWin && pred.homeWin > pred.draw ? 'Home' :
                              pred.awayWin > pred.homeWin && pred.awayWin > pred.draw ? 'Away' : 'Draw';
      
      return predictedWinner === item.result?.winner;
    });
    
    const accuracy = finishedItems.length > 0 ? Math.round((correctItems.length / finishedItems.length) * 100) : 0;

    // Calculate trend data (last 10 predictions)
    const recentHistory = history.slice(0, 10).reverse();
    const trendData = recentHistory.map((item, index) => {
      const predictionsSoFar = recentHistory.slice(0, index + 1);
      const finishedSoFar = predictionsSoFar.filter(p => p.result?.isFinished);
      const correctSoFar = finishedSoFar.filter(p => {
        if (!p.standardPrediction) return false;
        
        const pred = p.standardPrediction.probabilities;
        const predictedWinner = pred.homeWin > pred.awayWin && pred.homeWin > pred.draw ? 'Home' :
                                pred.awayWin > pred.homeWin && pred.awayWin > pred.draw ? 'Away' : 'Draw';
        
        return predictedWinner === p.result?.winner;
      });
      
      return {
        name: `P${index + 1}`,
        value: finishedSoFar.length > 0 ? Math.round((correctSoFar.length / finishedSoFar.length) * 100) : 0,
        label: `Prediction ${index + 1}`
      };
    });

    return {
      latestPrediction,
      accuracy,
      totalPredictions: history.length,
      trendData
    };
  };

  useEffect(() => {
    // Generate AI snapshot on mount
    setAiSnapshot(generateAISnapshot());
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

      // Update AI snapshot
      setAiSnapshot(generateAISnapshot());
      
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

      // Update AI snapshot
      setAiSnapshot(generateAISnapshot());
      
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

  return (
    <Layout 
      onNavigate={handleNavigate}
      currentView={view}
    >
      {!hasApiKey && (
        <div className="mb-6 bg-amber-500/10 border border-amber-400/30 p-4 rounded-xl text-amber-200 text-sm">
          Gemini API key is not configured. You can browse the app in demo mode, but live AI predictions/backtests require setting <code className="font-mono text-amber-100">GEMINI_API_KEY</code>.
        </div>
      )}

      {/* 1. DASHBOARD VIEW */}
      {view === ViewState.DASHBOARD && (
        <>
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Game Day Intelligence</h2>
            <p className="text-slate-400">Quick AI insights for today's fixtures.</p>
          </div>
          
          <DashboardSummary matches={matches} />
          
          <Filters 
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allMatches={matches}
          />
          
          <div id="matches-section">
            <MatchList 
              matches={matches} 
              onSelectMatch={handleSelectMatch}
              isLoading={isLoadingMatches}
              filters={filters}
              searchQuery={searchQuery}
              onRefresh={fetchMatches}
              aiSnapshot={aiSnapshot}
              selectionDisabledReason={!hasApiKey ? 'Set GEMINI_API_KEY to generate live predictions.' : undefined}
            />
          </div>
        </>
      )}

      {/* 2. PREDICTION DETAIL VIEW (Sub-view of Dashboard) */}
      {view === ViewState.DETAIL && selectedMatch && (
        <Suspense fallback={<div className="text-slate-400">Loading prediction view...</div>}>
          <PredictionView 
            match={selectedMatch}
            prediction={prediction}
            isLoading={isPredicting}
            error={predictionError}
            onBack={handleBack}
          />
        </Suspense>
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
                        filters={filters}
                        onFiltersChange={setFilters}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        allMatches={matches}
                    />

                    <MatchList 
                        matches={matches} 
                        onSelectMatch={handleSelectDetailedMatch}
                        isLoading={isLoadingMatches}
                        filters={filters}
                        searchQuery={searchQuery}
                        onRefresh={fetchMatches}
                        selectionDisabledReason={!hasApiKey ? 'Set GEMINI_API_KEY to generate detailed forecasts.' : undefined}
                    />
                </>
            ) : (
                // Show the specific detailed forecast view
                <Suspense fallback={<div className="text-slate-400">Loading detailed forecast...</div>}>
                  <DetailedForecastView 
                      match={selectedMatch}
                      forecast={detailedForecast}
                      isLoading={isPredicting}
                      error={predictionError}
                      onBack={handleBack}
                  />
                </Suspense>
            )}
        </>
      )}

      {/* 4. HISTORY VIEW */}
      {view === ViewState.HISTORY && (
        <Suspense fallback={<div className="text-slate-400">Loading history...</div>}>
          <HistoryView />
        </Suspense>
      )}

      {/* 5. BACKTEST VIEW */}
      {view === ViewState.BACKTEST && (
        <Suspense fallback={<div className="text-slate-400">Loading backtest lab...</div>}>
          <BacktestView />
        </Suspense>
      )}
    </Layout>
  );
};

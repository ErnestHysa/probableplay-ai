
import { HistoryItem, Match, PredictionResult, DetailedForecastResult, MatchResult, PredictionType } from "../types";
import { storePrediction, fetchPredictionHistory, canMakePrediction, incrementTrialUsage } from "./predictionStorageService";

const HISTORY_KEY = 'probable_play_history_v2';

export const historyService = {
  getHistory: (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  },

  savePrediction: async (
    match: Match,
    data: PredictionResult | DetailedForecastResult,
    type: PredictionType
  ) => {
    const history = historyService.getHistory();

    // User requested to APPEND history rather than replace, to allow comparing different runs.
    // We create a unique ID every time.

    const newItem: HistoryItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      match,
      type,
      timestamp: Date.now(),
      // Conditionally assign data based on type
      standardPrediction: type === 'STANDARD' ? (data as PredictionResult) : undefined,
      detailedForecast: type === 'DETAILED' ? (data as DetailedForecastResult) : undefined
    };

    // If there was a previous result for this match ID, try to carry it over so we don't lose the "Pending/Finished" status
    // just because we re-ran the AI.
    const previousEntry = history.find(h => h.match.id === match.id && h.result);
    if (previousEntry) {
      newItem.result = previousEntry.result;
    }

    // Add to beginning of list (Newest first)
    history.unshift(newItem);

    // Optional: Limit history size to prevent localStorage overflow (e.g., keep last 50)
    if (history.length > 50) {
        history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Also store in Supabase for authenticated users
    try {
      const result = await storePrediction(match, data, type);
      if (result.success) {
        // Increment trial usage for detailed forecasts (free tier)
        if (type === 'DETAILED') {
          await incrementTrialUsage();
        }
      }
    } catch (error) {
      console.warn('Failed to sync prediction to database:', error);
    }
  },

  updateResult: (matchId: string, result: MatchResult) => {
    const history = historyService.getHistory();
    let updated = false;

    // Update all history items for this match ID (since we might have multiple snapshots of the same game)
    history.forEach(h => {
      if (h.match.id === matchId) {
        h.result = result;
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
    return updated;
  },
  
  // Helper to delete specific items if needed
  deleteItems: (ids: string[]) => {
      let history = historyService.getHistory();
      history = history.filter(h => !ids.includes(h.id));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return history;
  }
};

// Export the usage tracking functions for use in components
export { canMakePrediction, getUserUsageStats, fetchPredictionHistory, incrementTrialUsage } from './predictionStorageService';

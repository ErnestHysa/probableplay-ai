/**
 * History Service Tests
 *
 * Tests for prediction history management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { historyService } from '../historyService';
import type { HistoryItem, Match, PredictionResult, DetailedForecastResult } from '../../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto
global.crypto = {
  randomUUID: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
} as any;

describe('historyService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockMatch: Match = {
    id: 'match-1',
    sport: 'Football',
    league: 'Premier League',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    startTime: '2024-01-15T15:00:00Z',
    status: 'Scheduled',
  };

  const mockStandardPrediction: PredictionResult = {
    matchId: 'match-1',
    probabilities: {
      homeWin: 0.5,
      draw: 0.3,
      awayWin: 0.2,
    },
    summary: 'Home advantage likely',
    detailedAnalysis: 'Detailed analysis',
    keyFactors: ['Home form'],
    sources: [],
    lastUpdated: new Date().toISOString(),
  };

  const mockDetailedForecast: DetailedForecastResult = {
    matchId: 'match-1',
    predictedScore: '2-1',
    totalGoals: 'Over 2.5',
    firstTeamToScore: 'Manchester United',
    halfTimeWinner: 'Home',
    secondHalfWinner: 'Draw',
    likelyScorers: [],
    scoringMethodProbabilities: {
      penalty: '10%',
      freeKick: '5%',
      cornerHeader: '15%',
      ownGoal: '2%',
      outsideBox: '12%',
    },
    redCards: '0 (90%)',
    confidenceScore: 'High',
    reasoning: 'Evenly matched',
  };

  describe('getHistory', () => {
    it('should return empty array for no history', () => {
      const result = historyService.getHistory();
      expect(result).toEqual([]);
    });

    it('should parse stored history', () => {
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'STANDARD',
          match: mockMatch,
          standardPrediction: mockStandardPrediction,
        },
      ];

      localStorage.setItem('probable_play_history_v2', JSON.stringify(mockHistory));
      const result = historyService.getHistory();

      expect(result).toHaveLength(1);
      expect(result[0].match.homeTeam).toBe('Manchester United');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('probable_play_history_v2', 'invalid json');
      const result = historyService.getHistory();
      expect(result).toEqual([]);
    });
  });

  describe('savePrediction', () => {
    it('should save standard prediction to history', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');

      const result = historyService.getHistory();
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('STANDARD');
      expect(result[0].standardPrediction).toEqual(mockStandardPrediction);
    });

    it('should save detailed forecast to history', async () => {
      await historyService.savePrediction(mockMatch, mockDetailedForecast, 'DETAILED');

      const result = historyService.getHistory();
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('DETAILED');
      expect(result[0].detailedForecast).toEqual(mockDetailedForecast);
    });

    it('should prepend new items (newest first)', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');

      const firstMatch = { ...mockMatch, id: 'match-2' };
      await historyService.savePrediction(firstMatch, mockStandardPrediction, 'STANDARD');

      const result = historyService.getHistory();
      expect(result).toHaveLength(2);
      expect(result[0].match.id).toBe('match-2');
      expect(result[1].match.id).toBe('match-1');
    });

    it('should limit history to 50 items', async () => {
      // Save 51 items
      for (let i = 0; i < 51; i++) {
        await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');
      }

      const result = historyService.getHistory();
      expect(result.length).toBe(50);
    });

    it('should carry over existing result for same match', async () => {
      // First save without result
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');

      // Simulate result being added
      const history = historyService.getHistory();
      history[0].result = {
        homeScore: 2,
        awayScore: 1,
        winner: 'Home',
        isFinished: true,
      };
      localStorage.setItem('probable_play_history_v2', JSON.stringify(history));

      // Save again for same match
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');

      const result = historyService.getHistory();
      expect(result[0].result).toEqual({
        homeScore: 2,
        awayScore: 1,
        winner: 'Home',
        isFinished: true,
      });
    });
  });

  describe('updateResult', () => {
    it('should update result for a match', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');

      const result = {
        homeScore: 2,
        awayScore: 1,
        winner: 'Home' as const,
        isFinished: true,
      };

      const updated = historyService.updateResult('match-1', result);

      expect(updated).toBe(true);

      const history = historyService.getHistory();
      expect(history[0].result).toEqual(result);
    });

    it('should update all entries for same match', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');
      await historyService.savePrediction(mockMatch, mockDetailedForecast, 'DETAILED');

      const result = {
        homeScore: 2,
        awayScore: 1,
        winner: 'Home' as const,
        isFinished: true,
      };

      historyService.updateResult('match-1', result);

      const history = historyService.getHistory();
      expect(history[0].result).toEqual(result);
      expect(history[1].result).toEqual(result);
    });

    it('should return false for non-existent match', () => {
      const result = {
        homeScore: 2,
        awayScore: 1,
        winner: 'Home' as const,
        isFinished: true,
      };

      const updated = historyService.updateResult('non-existent', result);
      expect(updated).toBe(false);
    });
  });

  describe('deleteItems', () => {
    it('should delete items by id', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');

      const history = historyService.getHistory();
      const idToDelete = history[0].id;

      const result = historyService.deleteItems([idToDelete]);

      expect(result).toHaveLength(0);
    });

    it('should delete multiple items', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');
      await historyService.savePrediction(mockMatch, mockDetailedForecast, 'DETAILED');

      const history = historyService.getHistory();
      const idsToDelete = history.map(h => h.id);

      const result = historyService.deleteItems(idsToDelete);

      expect(result).toHaveLength(0);
    });

    it('should only delete specified items', async () => {
      await historyService.savePrediction(mockMatch, mockStandardPrediction, 'STANDARD');
      await historyService.savePrediction(mockMatch, mockDetailedForecast, 'DETAILED');

      const history = historyService.getHistory();
      const idToDelete = history[0].id;

      historyService.deleteItems([idToDelete]);

      const result = historyService.getHistory();
      expect(result).toHaveLength(1);
    });
  });
});

/**
 * Export Utility Tests
 *
 * Tests for CSV and JSON export functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { exportToCSV, exportToJSON } from '../export';
import type { HistoryItem } from '../../../types';

describe('Export Utilities', () => {
  const mockHistory: HistoryItem[] = [
    {
      id: '1',
      timestamp: Date.now(),
      type: 'STANDARD',
      match: {
        id: 'm1',
        sport: 'Football',
        league: 'Premier League',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        startTime: '2024-01-15T15:00:00Z',
        status: 'Finished',
        score: '2-1',
      },
      standardPrediction: {
        matchId: 'm1',
        probabilities: {
          homeWin: 0.5,
          draw: 0.3,
          awayWin: 0.2,
        },
        summary: 'Home advantage likely',
        detailedAnalysis: 'Detailed analysis here',
        keyFactors: ['Home form', 'Away injuries'],
        sources: [],
        lastUpdated: new Date().toISOString(),
      },
      result: {
        homeScore: 2,
        awayScore: 1,
        winner: 'Home',
        isFinished: true,
      },
    },
    {
      id: '2',
      timestamp: Date.now() - 86400000,
      type: 'DETAILED',
      match: {
        id: 'm2',
        sport: 'Football',
        league: 'La Liga',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        startTime: '2024-01-14T20:00:00Z',
        status: 'Scheduled',
      },
      detailedForecast: {
        matchId: 'm2',
        predictedScore: '2-1',
        totalGoals: 'Over 2.5',
        firstTeamToScore: 'Real Madrid',
        halfTimeWinner: 'Home',
        secondHalfWinner: 'Draw',
        likelyScorers: [
          { player: 'Benzema', team: 'Real Madrid', method: 'Shot', likelihood: '45%' },
        ],
        scoringMethodProbabilities: {
          penalty: '10%',
          freeKick: '5%',
          cornerHeader: '15%',
          ownGoal: '2%',
          outsideBox: '12%',
        },
        redCards: '0 (90%)',
        confidenceScore: 'High',
        reasoning: 'Teams evenly matched',
      },
    },
  ];

  describe('exportToCSV', () => {
    it('should export standard predictions to CSV', () => {
      const result = exportToCSV(mockHistory, 'STANDARD');

      expect(result).toContain('Date');
      expect(result).toContain('Sport');
      expect(result).toContain('Home Team');
      expect(result).toContain('Away Team');
      expect(result).toContain('Manchester United');
      expect(result).toContain('50%');
    });

    it('should filter by prediction type', () => {
      const allResult = exportToCSV(mockHistory, 'all');
      const standardResult = exportToCSV(mockHistory, 'STANDARD');
      const detailedResult = exportToCSV(mockHistory, 'DETAILED');

      // All should have both predictions
      expect(allResult).toContain('Manchester United');
      expect(allResult).toContain('Real Madrid');

      // Standard should only have first
      expect(standardResult).toContain('Manchester United');
      expect(standardResult).not.toContain('Real Madrid');

      // Detailed should only have second
      expect(detailedResult).not.toContain('Manchester United');
      expect(detailedResult).toContain('Real Madrid');
    });

    it('should return empty string for empty history', () => {
      const result = exportToCSV([], 'all');
      expect(result).toBe('');
    });

    it('should escape commas in CSV values', () => {
      const historyWithComma: HistoryItem[] = [
        {
          id: '1',
          timestamp: Date.now(),
          type: 'STANDARD',
          match: {
            id: 'm1',
            sport: 'Football',
            league: 'Premier League',
            homeTeam: 'Team A, B',
            awayTeam: 'Team C',
            startTime: '2024-01-15T15:00:00Z',
            status: 'Scheduled',
          },
          standardPrediction: {
            matchId: 'm1',
            probabilities: { homeWin: 0.5, draw: 0.3, awayWin: 0.2 },
            summary: 'Summary',
            detailedAnalysis: 'Analysis',
            keyFactors: [],
            sources: [],
            lastUpdated: new Date().toISOString(),
          },
        },
      ];

      const result = exportToCSV(historyWithComma, 'STANDARD');
      expect(result).toContain('"Team A, B"');
    });
  });

  describe('exportToJSON', () => {
    it('should export predictions as JSON', () => {
      const result = exportToJSON(mockHistory, 'all');
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('exportDate');
      expect(parsed).toHaveProperty('totalPredictions');
      expect(parsed).toHaveProperty('predictions');
      expect(parsed.totalPredictions).toBe(2);
      expect(parsed.predictions).toHaveLength(2);
    });

    it('should include full prediction data in JSON', () => {
      const result = exportToJSON(mockHistory, 'STANDARD');
      const parsed = JSON.parse(result);

      expect(parsed.predictions[0]).toHaveProperty('match');
      expect(parsed.predictions[0]).toHaveProperty('prediction');
      expect(parsed.predictions[0].prediction).toHaveProperty('probabilities');
    });

    it('should filter by prediction type', () => {
      const standardResult = exportToJSON(mockHistory, 'STANDARD');
      const detailedResult = exportToJSON(mockHistory, 'DETAILED');

      const standardParsed = JSON.parse(standardResult);
      const detailedParsed = JSON.parse(detailedResult);

      expect(standardParsed.totalPredictions).toBe(1);
      expect(detailedParsed.totalPredictions).toBe(1);
    });

    it('should handle empty history', () => {
      const result = exportToJSON([], 'all');
      const parsed = JSON.parse(result);

      expect(parsed.totalPredictions).toBe(0);
      expect(parsed.predictions).toEqual([]);
    });
  });
});

/**
 * Export Utilities
 *
 * Export prediction data to CSV and JSON formats.
 */

import type { PredictionResult, DetailedForecastResult, HistoryItem } from '../types';

/**
 * Convert data to CSV format
 */
export const exportToCSV = (
  predictions: HistoryItem[],
  predictionType: 'all' | 'STANDARD' | 'DETAILED' = 'all'
): string => {
  // Filter by prediction type
  const filtered = predictionType === 'all'
    ? predictions
    : predictions.filter(p => p.type === predictionType);

  if (filtered.length === 0) return '';

  // CSV Header
  const headers = ['Date', 'Sport', 'League', 'Home Team', 'Away Team', 'Prediction Type', 'Details'];

  // Build CSV rows
  const rows = filtered.map(item => {
    const { match, type, standardPrediction, detailedForecast } = item;

    let details = '';
    if (type === 'STANDARD' && standardPrediction) {
      details = `Home: ${(standardPrediction.probabilities.homeWin * 100).toFixed(0)}%, Draw: ${(standardPrediction.probabilities.draw * 100).toFixed(0)}%, Away: ${(standardPrediction.probabilities.awayWin * 100).toFixed(0)}%`;
    } else if (type === 'DETAILED' && detailedForecast) {
      details = `Score: ${detailedForecast.predictedScore}, First to Score: ${detailedForecast.firstTeamToScore}`;
    }

    return [
      new Date(item.timestamp).toISOString(),
      match.sport,
      match.league,
      match.homeTeam,
      match.awayTeam,
      type,
      `"${details}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Convert data to JSON format
 */
export const exportToJSON = (
  predictions: HistoryItem[],
  predictionType: 'all' | 'STANDARD' | 'DETAILED' = 'all'
): string => {
  // Filter by prediction type
  const filtered = predictionType === 'all'
    ? predictions
    : predictions.filter(p => p.type === predictionType);

  const exportData = {
    exportDate: new Date().toISOString(),
    predictionType,
    totalPredictions: filtered.length,
    predictions: filtered.map(item => ({
      id: item.id,
      date: new Date(item.timestamp).toISOString(),
      match: {
        sport: item.match.sport,
        league: item.match.league,
        homeTeam: item.match.homeTeam,
        awayTeam: item.match.awayTeam,
        startTime: item.match.startTime,
      },
      prediction: item.type === 'STANDARD' ? item.standardPrediction : item.detailedForecast,
      result: item.result,
    })),
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Download file to user's computer
 */
export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export and download predictions
 */
export const exportPredictions = (
  predictions: HistoryItem[],
  format: 'csv' | 'json',
  predictionType?: 'all' | 'STANDARD' | 'DETAILED'
) => {
  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    const csv = exportToCSV(predictions, predictionType);
    downloadFile(csv, `probableplay-predictions-${timestamp}.csv`, 'text/csv');
  } else {
    const json = exportToJSON(predictions, predictionType);
    downloadFile(json, `probableplay-predictions-${timestamp}.json`, 'application/json');
  }
};

export default {
  exportToCSV,
  exportToJSON,
  downloadFile,
  exportPredictions,
};

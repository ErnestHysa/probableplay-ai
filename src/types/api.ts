/**
 * API Type Definitions
 *
 * Types for external API responses (TheSportsDB, etc.)
 */

// ============================================
// TheSportsDB API Types
// ============================================

export interface TheSportsDBEvent {
  idEvent: string;
  idLeague: string;
  strSport: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  strTimestamp?: string;
  strStatus?: string;
  intHomeScore?: number | null;
  intAwayScore?: number | null;
  strProgress?: string;
  idCountry?: string;
  strCountry?: string;
}

export interface TheSportsDBEventsResponse {
  events: TheSportsDBEvent[];
}

export interface TheSportsDBLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strCountry?: string;
}

export interface TheSportsDBLeaguesResponse {
  leagues: TheSportsDBLeague[];
}

// ============================================
// AI Response Types
// ============================================

export interface AIProbabilityResponse {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  summary: string;
  detailedAnalysis: string;
  keyFactors: string[];
}

export interface AIDetailedForecastResponse {
  predictedScore: string;
  totalGoals: string;
  firstTeamToScore: string;
  halfTimeWinner: 'Home' | 'Draw' | 'Away';
  secondHalfWinner: 'Home' | 'Draw' | 'Away';
  likelyScorers: {
    player: string;
    team: string;
    method: string;
    likelihood: string;
  }[];
  scoringMethodProbabilities: {
    penalty: string;
    freeKick: string;
    cornerHeader: string;
    ownGoal: string;
    outsideBox: string;
  };
  redCards: string;
  confidenceScore: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface AIBacktestResponse {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  explanation: string;
}

// ============================================
// Gemini AI Types
// ============================================

export interface GeminiCandidate {
  content?: {
    parts?: {
      text?: string;
    }[];
  };
  finishReason?: string;
  index?: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface GeminiGenerateContentRequest {
  model: string;
  contents: string;
  config?: {
    temperature?: number;
    systemInstruction?: string;
  };
}

// ============================================
// Backtest Types
// ============================================

export interface BacktestMatchData {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface BacktestAPIResponse {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

// ============================================
// Generic API Response Wrapper
// ============================================

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

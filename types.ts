
export interface Team {
  name: string;
  isHome: boolean;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO string
  status: 'Scheduled' | 'Live' | 'Finished';
}

export interface PredictionProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ScorerPrediction {
  player: string;
  team: string;
  method: string; // e.g. "Shot", "Header", "Penalty", "Free Kick"
  likelihood: string; // "35%", "80%" (Numeric string)
}

export interface DetailedForecastResult {
  matchId: string;
  // Core Outcome
  predictedScore: string; // e.g., "2-1"
  totalGoals: string; // e.g., "Over 2.5"
  
  // Scoring Flow
  firstTeamToScore: string;
  halfTimeWinner: 'Home' | 'Draw' | 'Away';
  secondHalfWinner: 'Home' | 'Draw' | 'Away';
  
  // Complex Data Points
  likelyScorers: ScorerPrediction[];
  
  // Event Probabilities
  scoringMethodProbabilities: {
    penalty: string; // e.g. "15%"
    freeKick: string; // e.g. "5%"
    cornerHeader: string; // e.g. "25%"
    ownGoal: string; // e.g. "1%"
    outsideBox: string; // e.g. "12%"
  };

  // Discipline
  redCards: string; // e.g. "0 (90%)" or ">0 (15%)"
  
  // Meta
  confidenceScore: string; 
  reasoning: string;
}

export interface PredictionResult {
  matchId: string;
  probabilities: PredictionProbabilities;
  summary: string;
  detailedAnalysis: string;
  keyFactors: string[];
  sources: GroundingSource[];
  lastUpdated: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  winner: 'Home' | 'Draw' | 'Away';
  isFinished: boolean;
}

export type PredictionType = 'STANDARD' | 'DETAILED';

export interface HistoryItem {
  id: string;
  match: Match;
  type: PredictionType;
  // We store one of the two depending on the type
  standardPrediction?: PredictionResult;
  detailedForecast?: DetailedForecastResult;
  result?: MatchResult;
  timestamp: number;
}

export type SportFilter = 'All' | 'Football' | 'NBA';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DETAILED_FORECAST = 'DETAILED_FORECAST',
  DETAIL = 'DETAIL',
  HISTORY = 'HISTORY',
  BACKTEST = 'BACKTEST',
}

export interface BacktestResultItem {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  actualHomeScore: number;
  actualAwayScore: number;
  actualWinner: 'Home' | 'Draw' | 'Away';
  predictedWinner: 'Home' | 'Draw' | 'Away';
  predictedProbabilities: PredictionProbabilities;
  isCorrect: boolean;
  explanation: string;
}

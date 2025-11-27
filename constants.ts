import { SportFilter, Match } from './types';

export const SUPPORTED_LEAGUES = [
  "English Premier League",
  "Bundesliga",
  "La Liga",
  "Serie A",
  "Ligue 1",
  "Eredivisie",
  "NBA",
  "Champions League"
];

export const SPORTS_TABS: SportFilter[] = ['All', 'Football', 'NBA'];

export const PLACEHOLDER_MATCHES: Match[] = [
  {
    id: "demo-1",
    sport: "Football",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    startTime: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
    status: "Scheduled"
  },
  {
    id: "demo-2",
    sport: "NBA",
    league: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Warriors",
    startTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(),
    status: "Scheduled"
  }
];

export const DISCLAIMER_TEXT = "This app provides informational and entertainment predictions only using AI analysis. No bets can be placed through this app. Predictions are not guarantees. Please act responsibly.";
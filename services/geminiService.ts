import { GoogleGenAI } from "@google/genai";
import { Match, PredictionResult, MatchResult, HistoryItem, BacktestResultItem, DetailedForecastResult, League } from "../types";
import {
  TheSportsDBEvent,
  AIProbabilityResponse,
  AIDetailedForecastResponse,
  AIBacktestResponse,
  BacktestMatchData,
} from "../src/types/api";
import { validateProbabilities } from "../src/utils/validation";

type JsonObject = Record<string, unknown>;
type JsonArray = Array<unknown>;

// Helper to get today's date in readable format
const getTodayString = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// Helper to get YYYY-MM-DD for API calls (using local time to define "Today")
const getLocalISODate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
};

export class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;
  private sportsDbKey = "123";
  private useEdgeFunction: boolean;

  // Cache for TheSportsDB events to avoid double fetching
  private eventsCache: TheSportsDBEvent[] = [];
  private lastFetchDate: string = "";
  private abortController: AbortController | null = null;

  constructor() {
    // In Vite, env vars must start with VITE_ and are accessed via import.meta.env
    this.apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    // Use edge function in production if available
    this.useEdgeFunction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  }

  get isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Check if we should use the edge function
   */
  private shouldUseEdgeFunction(): boolean {
    return this.useEdgeFunction;
  }

  /**
   * Call prediction via edge function (server-side API key)
   */
  private async callEdgeFunction(match: Match, type: 'standard' | 'detailed'): Promise<PredictionResult | DetailedForecastResult> {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ match, type }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Edge function error');
    }

    return response.json();
  }

  /**
   * Cancel any pending requests
   */
  public cancelPendingRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Create a new abort controller for cancellable requests
   */
  private createCancellableRequest() {
    this.cancelPendingRequests();
    this.abortController = new AbortController();
    return this.abortController;
  }

  private cleanAndParseJson(text: string): JsonObject {
    const tryParse = (str: string) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    };

    if (!text) throw new Error("Empty response from AI");

    // Try to find JSON block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const result = tryParse(codeBlockMatch[1]);
      if (result) return result;
    }

    // Try to find raw object/array
    const firstOpen = text.search(/[\{\[]/);
    const lastClose = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const substring = text.substring(firstOpen, lastClose + 1);
      const result = tryParse(substring);
      if (result) return result;
    }

    let cleaned = text.replace(/```json|```/g, '').trim();
    if (cleaned.toLowerCase().startsWith('json')) {
        cleaned = cleaned.substring(4).trim();
    }
    
    const finalAttempt = tryParse(cleaned);
    if (finalAttempt) return finalAttempt;

    console.error("Failed to parse JSON response. Raw text:", text);
    throw new Error("Invalid JSON response from AI");
  }

  /**
   * Phase 1: Fetch Active Leagues (VIA THESPORTSDB API)
   * Fetches BOTH Schedule and Live Data, merges them, and extracts unique leagues.
   */
  async fetchActiveLeagues(sportFilter: string): Promise<League[]> {
    const dateStr = getLocalISODate();

    // Reset cache if date has changed (simple daily cache invalidation)
    if (this.lastFetchDate !== dateStr) {
        this.eventsCache = [];
        this.lastFetchDate = dateStr;
    }

    // Determine which sports to fetch from API
    const sportsToFetch: string[] = [];
    if (sportFilter === 'All') {
        sportsToFetch.push('Soccer', 'Basketball');
    } else if (sportFilter === 'Football') {
        sportsToFetch.push('Soccer');
    } else if (sportFilter === 'NBA') {
        sportsToFetch.push('Basketball');
    }

    // Maps to store merged events (ID -> Event) to handle duplicates between Live and Schedule
    const eventMap = new Map<string, TheSportsDBEvent>();

    // We fetch both Schedule (eventsday) and Live (livescore) in parallel for each sport
    await Promise.all(sportsToFetch.map(async (sport) => {
        try {
            // 1. Fetch Daily Schedule
            const scheduleUrl = `https://www.thesportsdb.com/api/v1/json/${this.sportsDbKey}/eventsday.php?d=${dateStr}&s=${sport}`;
            const liveUrl = `https://www.thesportsdb.com/api/v1/json/${this.sportsDbKey}/livescore.php?s=${sport}`;

            const [scheduleRes, liveRes] = await Promise.allSettled([
                fetch(scheduleUrl),
                fetch(liveUrl)
            ]);

            // Process Schedule
            if (scheduleRes.status === 'fulfilled' && scheduleRes.value.ok) {
                const json = await scheduleRes.value.json();
                if (json.events && Array.isArray(json.events)) {
                    json.events.forEach((evt: any) => {
                        eventMap.set(evt.idEvent, evt);
                    });
                }
            }

            // Process Live (Overlay/Merge)
            if (liveRes.status === 'fulfilled' && liveRes.value.ok) {
                const json = await liveRes.value.json();
                if (json.events && Array.isArray(json.events)) {
                    json.events.forEach((evt: any) => {
                        // If event exists, merge it (Live data takes precedence for score/status)
                        const existing = eventMap.get(evt.idEvent);
                        if (existing) {
                            eventMap.set(evt.idEvent, { 
                                ...existing, 
                                ...evt, 
                                // Ensure status is explicitly mapped for our UI logic later
                                strStatus: 'Live',
                                // Preserve League ID if missing in live feed
                                idLeague: evt.idLeague || existing.idLeague
                            });
                        } else {
                            // New event found in live feed but not schedule (e.g. started yesterday, currently playing)
                            eventMap.set(evt.idEvent, { ...evt, strStatus: 'Live' });
                        }
                    });
                }
            }

        } catch (e) {
            console.error(`Failed to fetch ${sport} from TheSportsDB:`, e);
        }
    }));

    // Convert map back to array and cache it
    const allEvents = Array.from(eventMap.values());
    this.eventsCache = allEvents;

    // Aggregate unique leagues
    const leagueMap = new Map<string, League>();
    
    allEvents.forEach((evt) => {
        // Ensure we have a League ID and Name
        if (!evt.idLeague || !evt.strLeague) return;

        if (!leagueMap.has(evt.idLeague)) {
            // Map 'Soccer' -> 'Football' for internal consistency
            const displaySport = (evt.strSport === 'Soccer') ? 'Football' : evt.strSport;
            
            leagueMap.set(evt.idLeague, {
                id: evt.idLeague,
                name: evt.strLeague,
                sport: displaySport || 'Unknown',
                country: 'International', // TheSportsDB 'strCountry' isn't always reliable on event objects
                matchCount: 0
            });
        }
        const league = leagueMap.get(evt.idLeague);
        if (league) league.matchCount!++;
    });

    return Array.from(leagueMap.values());
  }

  /**
   * Phase 2: Fetch Matches by League (VIA CACHE/API)
   * Filters the cached events by league ID.
   */
  async fetchMatchesByLeague(league: League): Promise<Match[]> {
    // Filter events from our cache that belong to this league
    const leagueEvents = this.eventsCache.filter(evt => evt.idLeague === league.id);

    return leagueEvents.map(evt => {
        // Parse Start Time
        // TheSportsDB usually provides 'strTimestamp' (ISO UTC). 
        // Fallback: Combine dateEvent + strTime (Usually GMT).
        let isoTime = evt.strTimestamp;
        if (!isoTime) {
             isoTime = `${evt.dateEvent}T${evt.strTime}`;
             // If strTime doesn't have timezone offset, assume UTC/GMT (Z) for reliability
             if (!isoTime.endsWith('Z') && !isoTime.includes('+')) {
                 isoTime += 'Z';
             }
        }

        // Determine Status
        // strStatus can be "Match Finished", "Not Started", "FT", "AET", "PENS", or "15:00"
        let status: 'Scheduled' | 'Live' | 'Finished' | 'Postponed' = 'Scheduled';
        const s = evt.strStatus ? evt.strStatus.toLowerCase() : '';

        // Check for specific API status codes
        if (s === 'live') {
            status = 'Live';
        } else if (s === 'match finished' || s === 'ft' || s === 'aet' || s === 'pens') {
            status = 'Finished';
        } else if (s === 'not started' || s === 'ns' || s.includes(':')) {
            // If status is a time (e.g. "15:00"), it's scheduled
            status = 'Scheduled';
        } else if (s === 'postponed' || s === 'ppd') {
            status = 'Postponed';
        } else {
            // Any other status usually implies In-Play (e.g. '1H', '2H', 'HT', '45', '75')
            // If it looks like a minute count or period, it's live.
            status = 'Live';
        }

        // Parse Live Score
        let score = undefined;
        if (evt.intHomeScore !== null && evt.intAwayScore !== null) {
             score = `${evt.intHomeScore}-${evt.intAwayScore}`;
        }

        return {
            id: evt.idEvent,
            sport: (evt.strSport === 'Soccer') ? 'Football' : evt.strSport,
            league: evt.strLeague,
            homeTeam: evt.strHomeTeam,
            awayTeam: evt.strAwayTeam,
            startTime: isoTime,
            status: status,
            score: score,
            minute: evt.strProgress // Sometimes provided in live feed
        };
    });
  }

  /**
   * Standard Prediction (Overview)
   * Phase 5: Improved prompts + probability validation
   * Uses edge function in production for API key security
   */
  async predictMatch(match: Match): Promise<PredictionResult> {
    if (!this.isConfigured) throw new Error("API Key missing");

    // Use edge function in production
    if (this.shouldUseEdgeFunction()) {
      return this.callEdgeFunction(match, 'standard') as Promise<PredictionResult>;
    }

    const today = getTodayString();

    const prompt = `You are an expert sports analyst specializing in ${match.sport}.

Analyze the upcoming match: ${match.homeTeam} vs ${match.awayTeam}
League: ${match.league}
Date: ${today}

TASK: Provide probability estimates for match outcome based on:
1. Historical team performance patterns
2. Home advantage factor (home teams typically have +10-15% edge)
3. Recent form trends
4. Head-to-head record patterns

CRITICAL RULES:
- Probabilities MUST sum to exactly 1.0 (100%)
- Home win probability typically 0.35-0.55 for evenly matched teams
- Draw probability typically 0.20-0.35 for football/soccer, lower for basketball
- Away win probability typically 0.25-0.45
- Use 2 decimal places maximum

Return ONLY valid JSON:
{
  "homeWinProbability": 0.45,
  "drawProbability": 0.28,
  "awayWinProbability": 0.27,
  "summary": "2-3 sentence analysis of the matchup",
  "detailedAnalysis": "Two detailed paragraphs: 1) Team form and tactical matchup, 2) Key injury/suspension news and historical context",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4"]
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
          systemInstruction: "You are a professional sports betting analyst. Always provide probabilities that sum exactly to 1.0. Be specific and data-driven in your analysis."
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const data = this.cleanAndParseJson(text) as AIProbabilityResponse;

      // Extract probabilities
      let homeWin = Number(data.homeWinProbability) || 0;
      let draw = Number(data.drawProbability) || 0;
      let awayWin = Number(data.awayWinProbability) || 0;

      const rawProbabilities = { homeWin, draw, awayWin };

      // Validate and normalize if needed
      const validation = validateProbabilities(rawProbabilities);
      if (!validation.valid && validation.normalized) {
        console.warn(`Invalid probabilities detected (sum: ${validation.sum.toFixed(3)}). Normalizing...`);
        rawProbabilities.homeWin = validation.normalized.homeWin;
        rawProbabilities.draw = validation.normalized.draw;
        rawProbabilities.awayWin = validation.normalized.awayWin;
      }

      return {
        matchId: match.id,
        probabilities: rawProbabilities,
        summary: String(data.summary ?? "Analysis based on team performance patterns."),
        detailedAnalysis: String(data.detailedAnalysis ?? "Detailed form analysis and tactical breakdown."),
        keyFactors: Array.isArray(data.keyFactors) ? data.keyFactors.map(String) : [],
        sources: [],
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error("Prediction failed:", error);
      throw error;
    }
  }

  /**
   * Detailed Forecast (High Precision Mode)
   * Phase 5: Improved prompts with consistency checks
   * Uses edge function in production for API key security
   */
  async getDetailedForecast(match: Match): Promise<DetailedForecastResult> {
    if (!this.isConfigured) throw new Error("API Key missing");

    // Use edge function in production
    if (this.shouldUseEdgeFunction()) {
      return this.callEdgeFunction(match, 'detailed') as Promise<DetailedForecastResult>;
    }

    const today = getTodayString();

    const prompt = `You are an expert sports forecaster providing detailed match predictions.

MATCH: ${match.homeTeam} vs ${match.awayTeam}
LEAGUE: ${match.league}
DATE: ${today}

TASK: Provide a comprehensive statistical forecast with the following predictions:

1. EXACT SCORELINE: Most likely final score (e.g., "2-1", "1-0", "2-2")
2. TOTAL GOALS: "Over 2.5", "Under 2.5", "Over 3.5", etc. based on team attacking/defending stats
3. FIRST TEAM TO SCORE: "${match.homeTeam}" or "${match.awayTeam}" based on early-game performance
4. HALF-TIME RESULT: "Home", "Draw", or "Away" prediction for first half
5. SECOND-HALF RESULT: "Home", "Draw", or "Away" prediction for second half
6. LIKELY SCORERS: 2-3 players who might score with their method and estimated probability
7. SCORING METHOD BREAKDOWN: Probability percentages for different goal types
8. RED CARDS: Prediction with likelihood (e.g., "0 (85%)", "1+ (15%)")
9. CONFIDENCE: "High" (strong data), "Medium" (moderate certainty), or "Low" (highly uncertain)
10. REASONING: Brief explanation of the prediction logic

CRITICAL CONSISTENCY RULES:
- If predicting 0-0 scoreline, firstTeamToScore must be "None" and likelyScorers can be empty
- Total goals prediction must align with exact score (e.g., "2-1" = "Over 1.5" or "Over 2.5")
- Method probabilities should be realistic (penalties ~10-15%, headers ~15-20%, etc.)
- All percentages in scoringMethodProbabilities must be under 50% individually

Return ONLY valid JSON:
{
  "predictedScore": "2-1",
  "totalGoals": "Over 2.5",
  "firstTeamToScore": "${match.homeTeam}",
  "halfTimeWinner": "Home",
  "secondHalfWinner": "Draw",
  "likelyScorers": [
    {"player": "Player Name", "team": "${match.homeTeam}", "method": "Header/Shot/Penalty/Free Kick", "likelihood": "45%"},
    {"player": "Player Name", "team": "${match.awayTeam}", "method": "Shot", "likelihood": "35%"}
  ],
  "scoringMethodProbabilities": {
    "penalty": "12%",
    "freeKick": "8%",
    "cornerHeader": "18%",
    "ownGoal": "3%",
    "outsideBox": "15%"
  },
  "redCards": "0 (82%)",
  "confidenceScore": "Medium",
  "reasoning": "Brief explanation based on team stats, form, and historical patterns."
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
          systemInstruction: "You are a professional sports forecaster. Always ensure your predictions are internally consistent. If you predict low scoring, don't predict many scorers. Be specific and realistic."
        }
      });

      const text = response.text;
      const data = this.cleanAndParseJson(text) as AIDetailedForecastResponse;

      // Normalize and validate data
      const predictedScore = String(data.predictedScore ?? "N/A");
      const firstTeamToScore = String(data.firstTeamToScore ?? "Unknown");

      // Consistency check: if 0-0 predicted, ensure no scorers are listed
      let likelyScorers = Array.isArray(data.likelyScorers) ? data.likelyScorers : [];
      if ((predictedScore === "0-0" || predictedScore === "0-0 ") && likelyScorers.length > 0) {
        console.warn("Consistency fix: Removed scorers for 0-0 prediction");
        likelyScorers = [];
      }

      const validMethods = ["Shot", "Header", "Penalty", "Free Kick", "Own Goal"] as const;

      return {
        matchId: match.id,
        predictedScore,
        totalGoals: String(data.totalGoals ?? "N/A"),
        firstTeamToScore,
        halfTimeWinner: data.halfTimeWinner === "Home" || data.halfTimeWinner === "Draw" || data.halfTimeWinner === "Away"
          ? data.halfTimeWinner
          : "Draw",
        secondHalfWinner: data.secondHalfWinner === "Home" || data.secondHalfWinner === "Draw" || data.secondHalfWinner === "Away"
          ? data.secondHalfWinner
          : "Draw",

        likelyScorers: likelyScorers.map((s) => ({
          player: String(s.player ?? "Unknown"),
          team: String(s.team ?? match.homeTeam),
          method: validMethods.includes(s.method as typeof validMethods[number])
            ? s.method
            : "Shot",
          likelihood: String(s.likelihood ?? "50%")
        })),

        scoringMethodProbabilities: {
          penalty: String(data.scoringMethodProbabilities?.penalty ?? "0%"),
          freeKick: String(data.scoringMethodProbabilities?.freeKick ?? "0%"),
          cornerHeader: String(data.scoringMethodProbabilities?.cornerHeader ?? "0%"),
          ownGoal: String(data.scoringMethodProbabilities?.ownGoal ?? "0%"),
          outsideBox: String(data.scoringMethodProbabilities?.outsideBox ?? "0%")
        },

        redCards: String(data.redCards ?? "0 (90%)"),
        confidenceScore: data.confidenceScore === "High" || data.confidenceScore === "Medium" || data.confidenceScore === "Low"
          ? data.confidenceScore
          : "Medium",
        reasoning: String(data.reasoning ?? "Based on team performance patterns and historical data.")
      };
    } catch (error) {
      console.error("Detailed forecast failed:", error);
      throw error;
    }
  }

  /**
   * Fetches results for a list of past matches.
   */
  async fetchMatchResults(historyItems: HistoryItem[]): Promise<Map<string, MatchResult>> {
    if (!this.isConfigured || historyItems.length === 0) return new Map();

    const matchesList = historyItems.map(h => ({
      id: h.match.id,
      home: h.match.homeTeam,
      away: h.match.awayTeam,
      date: h.match.startTime
    }));

    const prompt = `
      I have a list of sports matches. Provide the final score and winner for each based on your knowledge.
      Matches: ${JSON.stringify(matchesList)}
      Output strictly a JSON array: [{"id": "...", "homeScore": 1, "awayScore": 0, "winner": "Home", "isFinished": true}]
      If a match result is unknown, set isFinished to false.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text;
      if (!text) return new Map();

      const results = this.cleanAndParseJson(text);
      const resultMap = new Map<string, MatchResult>();

      if (Array.isArray(results)) {
        results.forEach((r: any) => {
          if (r.id && r.isFinished) {
            resultMap.set(r.id, {
              homeScore: r.homeScore,
              awayScore: r.awayScore,
              winner: r.winner,
              isFinished: true
            });
          }
        });
      }
      return resultMap;

    } catch (error) {
      console.error("Failed to fetch results:", error);
      return new Map();
    }
  }

  // --- Backtest Methods ---
  async fetchBacktestCandidates(sport: string, league: string, teams: string[], count: number): Promise<BacktestMatchData[]> {
    if (!this.isConfigured) throw new Error("API Key missing");
    const safeCount = Math.min(count, 5);
    const teamStr = teams.join(' OR ');

    const prompt = `
      List the last ${safeCount} COMPLETED matches involving ANY of: ${teamStr}.
      Sport: ${sport}, League: ${league}.
      Output JSON array: [{"date": "YYYY-MM-DD", "homeTeam": "Name", "awayTeam": "Name", "homeScore": 1, "awayScore": 2}]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const data = this.cleanAndParseJson(response.text) as JsonArray;
      return Array.isArray(data) ? data as BacktestMatchData[] : [];
    } catch (e) { return []; }
  }

  async runBacktestPrediction(matchData: BacktestMatchData): Promise<BacktestResultItem> {
    const matchDate = new Date(matchData.date);
    const simDate = new Date(matchDate);
    simDate.setDate(matchDate.getDate() - 1);
    const simDateStr = simDate.toLocaleDateString();

    const prompt = `
      SIMULATION DATE: ${simDateStr}.
      Predict ${matchData.homeTeam} vs ${matchData.awayTeam} (${matchData.date}).
      Do not check actual results. Use general team knowledge.
      Return JSON: {"homeWinProbability": 0.5, "drawProbability": 0.2, "awayWinProbability": 0.3, "explanation": "..."}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const p = this.cleanAndParseJson(response.text) as AIBacktestResponse;

      let actualWinner: 'Home' | 'Draw' | 'Away' = 'Draw';
      if (matchData.homeScore > matchData.awayScore) actualWinner = 'Home';
      if (matchData.awayScore > matchData.homeScore) actualWinner = 'Away';

      let predictedWinner: 'Home' | 'Draw' | 'Away' = 'Draw';
      let maxProb = p.drawProbability ?? 0;
      if ((p.homeWinProbability ?? 0) > maxProb) {
        maxProb = p.homeWinProbability;
        predictedWinner = 'Home';
      }
      if ((p.awayWinProbability ?? 0) > maxProb) {
        predictedWinner = 'Away';
      }

      return {
        id: `bt-${Date.now()}-${Math.random()}`,
        date: matchData.date,
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        actualHomeScore: matchData.homeScore,
        actualAwayScore: matchData.awayScore,
        actualWinner,
        predictedWinner,
        predictedProbabilities: {
          homeWin: p.homeWinProbability,
          draw: p.drawProbability ?? 0,
          awayWin: p.awayWinProbability ?? 0
        },
        isCorrect: predictedWinner === actualWinner,
        explanation: p.explanation ?? "Prediction completed"
      };
    } catch (e) {
      return {
        id: `err-${Date.now()}`, date: matchData.date, homeTeam: matchData.homeTeam, awayTeam: matchData.awayTeam,
        actualHomeScore: 0, actualAwayScore: 0, actualWinner: 'Draw', predictedWinner: 'Draw',
        predictedProbabilities: { homeWin: 0, draw: 0, awayWin: 0 }, isCorrect: false, explanation: "Error"
      };
    }
  }
}

export const geminiService = new GeminiService();

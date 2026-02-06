
import { GoogleGenAI } from "@google/genai";
import { Match, PredictionResult, MatchResult, HistoryItem, BacktestResultItem, DetailedForecastResult } from "../types";
import { appLogger } from "../utils/logger";

// Helper to get today's date in readable format
const getTodayString = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  get isConfigured() {
    return !!this.apiKey;
  }

  private normalizeProbability(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(1, parsed));
  }

  private buildNormalizedProbabilities(raw: {
    homeWinProbability?: unknown;
    drawProbability?: unknown;
    awayWinProbability?: unknown;
  }) {
    let homeWin = this.normalizeProbability(raw.homeWinProbability);
    let draw = this.normalizeProbability(raw.drawProbability);
    let awayWin = this.normalizeProbability(raw.awayWinProbability);

    const sum = homeWin + draw + awayWin;
    if (sum <= 0) {
      return { homeWin: 0.34, draw: 0.32, awayWin: 0.34 };
    }

    homeWin = homeWin / sum;
    draw = draw / sum;
    awayWin = awayWin / sum;

    return { homeWin, draw, awayWin };
  }

  private normalizePeriodWinner(value: unknown): 'Home' | 'Draw' | 'Away' {
    if (value === 'Home' || value === 'Draw' || value === 'Away') {
      return value;
    }
    return 'Draw';
  }

  private normalizePercentString(value: unknown): string {
    if (typeof value === 'string' && /%/.test(value)) return value;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0%';
    return `${Math.max(0, Math.min(100, Math.round(numeric)))}%`;
  }

  private normalizeBacktestCandidate(row: any): { date: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number } | null {
    if (!row || !row.date || !row.homeTeam || !row.awayTeam) return null;
    const homeScore = Number(row.homeScore);
    const awayScore = Number(row.awayScore);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;
    return {
      date: String(row.date),
      homeTeam: String(row.homeTeam),
      awayTeam: String(row.awayTeam),
      homeScore,
      awayScore
    };
  }

  /**
   * Helper to parse JSON from AI response
   */
  private cleanAndParseJson(text: string): any {
    const tryParse = (str: string) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    };

    if (!text) throw new Error("Empty response from AI");

    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const result = tryParse(codeBlockMatch[1]);
      if (result) return result;
    }

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

    appLogger.error("Failed to parse JSON response", { rawText: text });
    throw new Error("Invalid JSON response from AI");
  }

  /**
   * Fetches today's matches.
   */
  async fetchTodaysMatches(): Promise<Match[]> {
    if (!this.isConfigured) throw new Error("API Key missing");

    const today = getTodayString();
    
    const prompt = `
      Find the schedule for major sports matches taking place today, ${today}.
      Focus on:
      1. Football (Soccer): Premier League, Bundesliga, La Liga, Serie A, Ligue 1, Eredivisie, Champions League.
      2. Basketball: NBA.
      
      List at least 5-10 key matches if available.
      
      CRITICAL TIMEZONE INSTRUCTION:
      - You MUST return all start times in UTC (Coordinated Universal Time) ISO 8601 format ending with 'Z'.
      - FOR NBA GAMES: Convert ET to UTC.

      Strictly return a JSON array of objects.
      Output format:
      [
        {
          "sport": "Football or NBA",
          "league": "League Name",
          "homeTeam": "Home Team Name",
          "awayTeam": "Away Team Name",
          "startTime": "2023-MM-DDTHH:mm:ssZ" 
        }
      ]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a sports scheduler helper. Accurately retrieve today's fixtures and output valid JSON with strictly UTC timestamps."
        }
      });

      const text = response.text;
      if (!text) return [];

      const matchesData = this.cleanAndParseJson(text);
      
      if (Array.isArray(matchesData)) {
        return matchesData
        .filter((m: any) => m?.homeTeam && m?.awayTeam && m?.startTime)
        .map((m: any) => {
          const slug = `${m.homeTeam}-${m.awayTeam}-${m.startTime}`.toLowerCase().replace(/[^a-z0-9]/g, '');
          return {
            sport: m.sport || 'Football',
            league: m.league || 'Unknown League',
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            startTime: m.startTime,
            id: slug || `gm-${Date.now()}-${Math.random()}`,
            status: 'Scheduled'
          };
        });
      }
      return [];

    } catch (error) {
      appLogger.error("Failed to fetch matches", error);
      return [];
    }
  }

  /**
   * Standard Prediction (Overview)
   */
  async predictMatch(match: Match): Promise<PredictionResult> {
    if (!this.isConfigured) throw new Error("API Key missing");

    const today = getTodayString();

    const prompt = `
      Analyze the ${match.sport} match between ${match.homeTeam} (Home) and ${match.awayTeam} (Away) scheduled for today, ${today}.
      League: ${match.league}.

      Use Google Search to find:
      1. Recent form, H2H history, injuries.
      2. League standings context.

      Based on this data, estimate the probabilities of a Home Win, Draw, and Away Win.
      
      Strictly return a JSON object:
      {
        "homeWinProbability": number (0-1),
        "drawProbability": number (0-1),
        "awayWinProbability": number (0-1),
        "summary": "Concise 2-3 sentence summary",
        "detailedAnalysis": "2 paragraphs analyzing form and key factors",
        "keyFactors": ["List of 3-5 key brief strings"]
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are an expert sports analyst. Provide data-driven probabilities in JSON."
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const data = this.cleanAndParseJson(text);

      const sources: {title: string, uri: string}[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      const probabilities = this.buildNormalizedProbabilities(data);

      return {
        matchId: match.id,
        probabilities,
        summary: typeof data.summary === 'string' ? data.summary : 'Prediction generated from available data.',
        detailedAnalysis: typeof data.detailedAnalysis === 'string' ? data.detailedAnalysis : 'Detailed analysis unavailable.',
        keyFactors: Array.isArray(data.keyFactors) ? data.keyFactors : [],
        sources: sources,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      appLogger.error("Prediction failed", error);
      throw error;
    }
  }

  /**
   * Detailed Forecast (High Precision Mode)
   * Uses low temperature and thinking logic for maximum accuracy.
   */
  async getDetailedForecast(match: Match): Promise<DetailedForecastResult> {
    if (!this.isConfigured) throw new Error("API Key missing");
    
    const today = getTodayString();

    const prompt = `
      Perform a PROFESSIONAL, HIGH-STAKES statistical forecast for the ${match.sport} match between ${match.homeTeam} and ${match.awayTeam} (${today}).
      
      PROTOCOL:
      1. DATA SEARCH (Mandatory):
         - Search for "Expected Goals (xG) last 5 matches" for both teams.
         - Search for "Head-to-Head results last 3 years".
         - Search for "CONFIRMED injury list today".
         - Search for "Referee yellow/red card average".
         
      2. LOGIC (Chain of Thought):
         - Compare attacking strength vs defensive weakness.
         - If key scorer is injured -> reduce Total Goals prediction.
         - If Head-to-Head is tight -> predict Draw or narrow win.
         - DO NOT BE VAGUE. Calculate the most statistically probable outcome.
         - CONSISTENCY CHECK: If you predict 0-0, you cannot predict a "First Scorer". If you predict "Over 2.5 goals", the Exact Score must have 3+ goals.

      REQUIRED OUTPUT DATA:
      1. EXACT SCORE: Most probable numeric scoreline based on xG (e.g., "2-1").
      2. TOTAL GOALS: "Under X" or "Over X" based on defensive stats.
      3. FIRST TEAM TO SCORE: Based on early-game scoring stats.
      4. HALF TIME / SECOND HALF: Winner of each specific period.
      5. SCORERS: Top 2-3 players with HIGHEST xG. Include method (Penalty, Header, etc.).
      6. PROBABILITIES: Specific % chance for events.
      7. RED CARDS: "0" or "1+". Only predict "1+" if referee is strict or teams are aggressive.
      8. REASONING: Citing specific stats (e.g. "Arsenal xG is 2.1 vs Liverpool 1.4").

      Strictly return a JSON object matching this schema:
      {
         "predictedScore": "string",
         "totalGoals": "string",
         "firstTeamToScore": "string",
         "halfTimeWinner": "Home" | "Draw" | "Away",
         "secondHalfWinner": "Home" | "Draw" | "Away",
         "likelyScorers": [
            { "player": "Name", "team": "Team Name", "method": "Header/Shot/Penalty", "likelihood": "45%" }
         ],
         "scoringMethodProbabilities": {
            "penalty": "25%",
            "freeKick": "5%",
            "cornerHeader": "15%",
            "ownGoal": "2%",
            "outsideBox": "10%"
         },
         "redCards": "0 (90%)",
         "confidenceScore": "High" | "Medium" | "Low",
         "reasoning": "Brief data-driven explanation."
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1, // EXTREMELY LOW TEMPERATURE FOR DETERMINISTIC, CONSISTENT RESULTS
          thinkingConfig: { thinkingBudget: 2048 }, // FORCE DEEP THINKING / CALCULATION
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a ruthless algorithmic betting model. You do not guess. You only predict what is supported by hard statistics (xG, H2H, Form). If data is conflicting, choose the conservative outcome. Be precise."
        }
      });

      const text = response.text;
      const data = this.cleanAndParseJson(text);

      return {
        matchId: match.id,
        predictedScore: data.predictedScore || "N/A",
        totalGoals: data.totalGoals || "N/A",
        firstTeamToScore: data.firstTeamToScore || "Unknown",
        halfTimeWinner: this.normalizePeriodWinner(data.halfTimeWinner),
        secondHalfWinner: this.normalizePeriodWinner(data.secondHalfWinner),
        
        likelyScorers: Array.isArray(data.likelyScorers)
          ? data.likelyScorers.filter((s: any) => s?.player && s?.team).slice(0, 5).map((s: any) => ({
              player: String(s.player),
              team: String(s.team),
              method: typeof s.method === 'string' ? s.method : 'Shot',
              likelihood: this.normalizePercentString(s.likelihood)
            }))
          : [],
        
        scoringMethodProbabilities: {
          penalty: this.normalizePercentString(data.scoringMethodProbabilities?.penalty),
          freeKick: this.normalizePercentString(data.scoringMethodProbabilities?.freeKick),
          cornerHeader: this.normalizePercentString(data.scoringMethodProbabilities?.cornerHeader),
          ownGoal: this.normalizePercentString(data.scoringMethodProbabilities?.ownGoal),
          outsideBox: this.normalizePercentString(data.scoringMethodProbabilities?.outsideBox)
        },

        redCards: data.redCards || "0 (90%)",
        confidenceScore: data.confidenceScore || "Medium",
        reasoning: data.reasoning || "Based on recent statistics."
      };
    } catch (error) {
      appLogger.error("Detailed forecast failed", error);
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
      I have a list of sports matches. I need to know the final score and winner for each.
      Matches: ${JSON.stringify(matchesList)}
      Use Google Search. Output strictly a JSON array: [{"id": "...", "homeScore": 1, "awayScore": 0, "winner": "Home", "isFinished": true}]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
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
      appLogger.error("Failed to fetch results", error);
      return new Map();
    }
  }

  // --- Backtest Methods ---
  async fetchBacktestCandidates(sport: string, league: string, teams: string[], count: number): Promise<any[]> {
    if (!this.isConfigured) throw new Error("API Key missing");
    const safeCount = Math.min(count, 5);
    const teamStr = teams.join(' OR ');
    
    const prompt = `
      Find the last ${safeCount} COMPLETED matches involving ANY of: ${teamStr}.
      Sport: ${sport}, League: ${league}.
      Output JSON array: [{"date": "YYYY-MM-DD", "homeTeam": "Name", "awayTeam": "Name", "homeScore": 1, "awayScore": 2}]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      const data = this.cleanAndParseJson(response.text);
      if (!Array.isArray(data)) return [];
      return data
        .map((item) => this.normalizeBacktestCandidate(item))
        .filter((item): item is { date: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number } => !!item);
    } catch (e) {
      appLogger.warn('Failed to fetch backtest candidates', e);
      return [];
    }
  }

  async runBacktestPrediction(matchData: any): Promise<BacktestResultItem> {
    const matchDate = new Date(matchData.date);
    const simDate = new Date(matchDate);
    simDate.setDate(matchDate.getDate() - 1);
    const simDateStr = simDate.toLocaleDateString();

    const prompt = `
      SIMULATION DATE: ${simDateStr}.
      Predict ${matchData.homeTeam} vs ${matchData.awayTeam} (${matchData.date}).
      Do not check actual results.
      Return JSON: {"homeWinProbability": 0.5, "drawProbability": 0.2, "awayWinProbability": 0.3, "explanation": "..."}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      const p = this.cleanAndParseJson(response.text);
      
      let actualWinner: 'Home' | 'Draw' | 'Away' = 'Draw';
      if (matchData.homeScore > matchData.awayScore) actualWinner = 'Home';
      if (matchData.awayScore > matchData.homeScore) actualWinner = 'Away';

      const normalized = this.buildNormalizedProbabilities(p);

      let predictedWinner: 'Home' | 'Draw' | 'Away' = 'Draw';
      let maxProb = normalized.draw;
      if (normalized.homeWin > maxProb) { maxProb = normalized.homeWin; predictedWinner = 'Home'; }
      if (normalized.awayWin > maxProb) { predictedWinner = 'Away'; }

      return {
        id: `bt-${Date.now()}-${Math.random()}`,
        date: matchData.date,
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        actualHomeScore: matchData.homeScore,
        actualAwayScore: matchData.awayScore,
        actualWinner,
        predictedWinner,
        predictedProbabilities: normalized,
        isCorrect: predictedWinner === actualWinner,
        explanation: typeof p.explanation === 'string' ? p.explanation : 'Prediction generated from historical simulation inputs.'
      };
    } catch (e) {
      appLogger.warn('Backtest prediction failed for candidate', { matchData, error: e });
      return {
        id: `err-${Date.now()}`, date: matchData.date, homeTeam: matchData.homeTeam, awayTeam: matchData.awayTeam,
        actualHomeScore: 0, actualAwayScore: 0, actualWinner: 'Draw', predictedWinner: 'Draw',
        predictedProbabilities: { homeWin: 0, draw: 0, awayWin: 0 }, isCorrect: false, explanation: "Error"
      };
    }
  }
}

export const geminiService = new GeminiService();

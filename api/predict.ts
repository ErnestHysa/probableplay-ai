/**
 * Vercel Edge Function for AI Predictions
 *
 * This edge function hides the Gemini API key server-side
 * and provides a secure endpoint for predictions.
 *
 * Environment Variables Required:
 * - GEMINI_API_KEY: Your Google Gemini API key
 */

interface PredictionRequest {
  match: {
    id: string;
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
  };
  type: 'standard' | 'detailed';
}

interface ProbabilityResponse {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  summary: string;
  detailedAnalysis: string;
  keyFactors: string[];
}

interface DetailedForecastResponse {
  predictedScore: string;
  totalGoals: string;
  firstTeamToScore: string;
  halfTimeWinner: 'Home' | 'Draw' | 'Away';
  secondHalfWinner: 'Home' | 'Draw' | 'Away';
  likelyScorers: Array<{
    player: string;
    team: string;
    method: string;
    likelihood: string;
  }>;
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

const GEMINI_API_KEY = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

// Helper to get today's date
const getTodayString = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper to clean and parse JSON from AI response
function cleanAndParseJson(text: string): Record<string, unknown> {
  const tryParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
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

  throw new Error("Invalid JSON response from AI");
}

// Generate standard prediction prompt
function generateStandardPrompt(match: PredictionRequest['match']): string {
  const today = getTodayString();

  return `You are an expert sports analyst specializing in ${match.sport}.

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
}

// Generate detailed forecast prompt
function generateDetailedPrompt(match: PredictionRequest['match']): string {
  const today = getTodayString();

  return `You are an expert sports forecaster providing detailed match predictions.

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
}

// Validate probabilities sum to ~1.0
function validateProbabilities(probabilities: { homeWin: number; draw: number; awayWin: number }): {
  valid: boolean;
  sum: number;
  normalized?: { homeWin: number; draw: number; awayWin: number };
} {
  const sum = probabilities.homeWin + probabilities.draw + probabilities.awayWin;

  if (Math.abs(sum - 1.0) <= 0.1) {
    return { valid: true, sum };
  }

  // Normalize
  return {
    valid: false,
    sum,
    normalized: {
      homeWin: probabilities.homeWin / sum,
      draw: probabilities.draw / sum,
      awayWin: probabilities.awayWin / sum,
    },
  };
}

// Call Gemini API
async function callGemini(prompt: string, temperature = 0.1): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: 2048,
        },
        systemInstruction: "You are a professional sports analyst. Always provide probabilities that sum exactly to 1.0. Be specific and data-driven in your analysis.",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  return text;
}

// Main handler for Vercel Edge Functions
export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method === 'GET') {
    return Response.json({
      error: 'Method not allowed. Use POST instead.',
      message: 'This endpoint requires a POST request with prediction parameters.'
    }, { status: 405 });
  }

  if (request.method !== 'POST') {
    return Response.json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    }, { status: 405 });
  }

  try {
    // Parse request body
    const body: PredictionRequest = await request.json();

    if (!body.match || !body.match.id || !body.match.homeTeam || !body.match.awayTeam) {
      return Response.json({
        error: 'Invalid request',
        message: 'Missing required match data'
      }, { status: 400 });
    }

    const { match, type = 'standard' } = body;

    // Generate prompt based on type
    const prompt = type === 'detailed'
      ? generateDetailedPrompt(match)
      : generateStandardPrompt(match);

    // Call Gemini API
    const responseText = await callGemini(prompt, 0.1);
    const data = cleanAndParseJson(responseText);

    // Handle standard prediction response
    if (type === 'standard') {
      const probData = data as ProbabilityResponse;

      let homeWin = Number(probData.homeWinProbability) || 0;
      let draw = Number(probData.drawProbability) || 0;
      let awayWin = Number(probData.awayWinProbability) || 0;

      const rawProbabilities = { homeWin, draw, awayWin };

      // Validate and normalize if needed
      const validation = validateProbabilities(rawProbabilities);
      if (!validation.valid && validation.normalized) {
        console.warn(`Invalid probabilities detected (sum: ${validation.sum.toFixed(3)}). Normalizing...`);
        rawProbabilities.homeWin = validation.normalized.homeWin;
        rawProbabilities.draw = validation.normalized.draw;
        rawProbabilities.awayWin = validation.normalized.awayWin;
      }

      return Response.json({
        matchId: match.id,
        probabilities: rawProbabilities,
        summary: probData.summary ?? "Analysis based on team performance patterns.",
        detailedAnalysis: probData.detailedAnalysis ?? "Detailed form analysis and tactical breakdown.",
        keyFactors: Array.isArray(probData.keyFactors) ? probData.keyFactors : [],
        sources: [],
        lastUpdated: new Date().toISOString()
      });
    }

    // Handle detailed forecast response
    const detailedData = data as DetailedForecastResponse;

    const predictedScore = String(detailedData.predictedScore ?? "N/A");
    const firstTeamToScore = String(detailedData.firstTeamToScore ?? "Unknown");

    // Consistency check: if 0-0 predicted, ensure no scorers are listed
    let likelyScorers = Array.isArray(detailedData.likelyScorers) ? detailedData.likelyScorers : [];
    if ((predictedScore === "0-0" || predictedScore === "0-0 ") && likelyScorers.length > 0) {
      likelyScorers = [];
    }

    const validMethods = ["Shot", "Header", "Penalty", "Free Kick", "Own Goal"] as const;

    return Response.json({
      matchId: match.id,
      predictedScore,
      totalGoals: String(detailedData.totalGoals ?? "N/A"),
      firstTeamToScore,
      halfTimeWinner: detailedData.halfTimeWinner ?? "Draw",
      secondHalfWinner: detailedData.secondHalfWinner ?? "Draw",
      likelyScorers: likelyScorers.map((s) => ({
        player: String(s.player ?? "Unknown"),
        team: String(s.team ?? match.homeTeam),
        method: validMethods.includes(s.method as typeof validMethods[number]) ? s.method : "Shot",
        likelihood: String(s.likelihood ?? "50%")
      })),
      scoringMethodProbabilities: {
        penalty: String(detailedData.scoringMethodProbabilities?.penalty ?? "0%"),
        freeKick: String(detailedData.scoringMethodProbabilities?.freeKick ?? "0%"),
        cornerHeader: String(detailedData.scoringMethodProbabilities?.cornerHeader ?? "0%"),
        ownGoal: String(detailedData.scoringMethodProbabilities?.ownGoal ?? "0%"),
        outsideBox: String(detailedData.scoringMethodProbabilities?.outsideBox ?? "0%")
      },
      redCards: String(detailedData.redCards ?? "0 (90%)"),
      confidenceScore: detailedData.confidenceScore ?? "Medium",
      reasoning: String(detailedData.reasoning ?? "Based on team performance patterns and historical data.")
    });

  } catch (error) {
    console.error('Prediction error:', error);

    return Response.json({
      error: 'Prediction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Edge function config for Vercel
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East
};

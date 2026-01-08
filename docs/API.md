# ProbablePlay AI - API Documentation

## Overview

This document describes the external APIs and services used by ProbablePlay AI, as well as the internal service interfaces.

## Table of Contents

- [External APIs](#external-apis)
  - [Google Gemini AI](#google-gemini-ai)
  - [TheSportsDB API](#thesportsdb-api)
  - [Supabase](#supabase)
  - [Stripe API](#stripe-api)
- [Internal Services](#internal-services)
  - [GeminiService](#geminiservice)
  - [HistoryService](#historyservice)
- [Data Models](#data-models)

---

## External APIs

### Google Gemini AI

**Base URL**: `https://generativelanguage.googleapis.com/v1beta`

**Purpose**: Generate AI-powered sports predictions with Google Search Grounding

#### Authentication
```typescript
// API key via environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });
```

#### Endpoints Used

##### Generate Content
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```

**Request Body**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Prediction prompt..."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "responseMimeType": "application/json"
  },
  "tools": [
    {
      "googleSearch": {}
    }
  ]
}
```

**Response**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"homeWinProbability\": 65, ...}"
          }
        ]
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 150,
    "candidatesTokenCount": 200,
    "totalTokenCount": 350
  }
}
```

#### Usage in ProbablePlay AI

1. **Standard Prediction**
   - Model: `gemini-2.5-flash`
   - Temperature: `0.7`
   - Tools: Google Search Grounding enabled
   - Output: Win/draw/loss probabilities

2. **Detailed Forecast**
   - Model: `gemini-2.5-flash`
   - Temperature: `0.7`
   - Tools: Google Search Grounding + Thinking
   - Output: Comprehensive prediction report

3. **Backtesting**
   - Model: `gemini-2.5-flash`
   - Temperature: `0.7`
   - Tools: None (historical data only)
   - Output: Simulated prediction

---

### TheSportsDB API

**Base URL**: `https://www.thesportsdb.com/api/v1/json/3`

**Purpose**: Fetch match data, league information, and team details

#### Authentication
```typescript
// API key via query parameter
const apiKey = "123"; // Free tier key
```

#### Endpoints Used

##### Get Today's Events
```
GET https://www.thesportsdb.com/api/v1/json/{api_key}/eventsday.php?d=YYYY-MM-DD
```

**Response**:
```json
{
  "events": [
    {
      "idEvent": "123456",
      "idLeague": "4329",
      "strSport": "Soccer",
      "strLeague": "Premier League",
      "strHomeTeam": "Manchester United",
      "strAwayTeam": "Liverpool",
      "dateEvent": "2025-01-15",
      "strTime": "15:00:00",
      "strStatus": "Scheduled",
      "intHomeScore": null,
      "intAwayScore": null
    }
  ]
}
```

##### Search Leagues
```
GET https://www.thesportsdb.com/api/v1/json/{api_key}/search_all_leagues.php?s=Soccer
```

##### Get League Details
```
GET https://www.thesportsdb.com/api/v1/json/{api_key}/lookupleague.php?id={league_id}
```

#### Supported Leagues

| League | ID | Sport |
|--------|----|----|
| Premier League | 4329 | Soccer |
| Bundesliga | 4331 | Soccer |
| La Liga | 4335 | Soccer |
| Serie A | 4332 | Soccer |
| Ligue 1 | 4334 | Soccer |
| Eredivisie | 4337 | Soccer |
| Champions League | 4480 | Soccer |
| NBA | 4387 | Basketball |

---

### Supabase

**Base URL**: `https://vdbeicavzhuubrjnbcuv.supabase.co`

**Purpose**: Authentication and database operations

#### Authentication

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

#### Endpoints Used

##### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
});
```

##### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password',
});
```

##### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

##### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

##### Database Query
```typescript
// Fetch user profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Insert prediction
const { data, error } = await supabase
  .from('predictions')
  .insert({
    user_id: userId,
    match_id: matchId,
    match_data: matchData,
    prediction_type: 'standard',
    prediction_data: predictionData,
  });

// Call database function
const { data, error } = await supabase.rpc('get_weekly_usage', {
  user_id: userId,
  action_type: 'standard_prediction',
});
```

---

### Stripe API

**Base URL**: `https://api.stripe.com/v1`

**Purpose**: Payment processing for Pro subscriptions

#### Authentication
```typescript
const stripe = Stripe(publishableKey);
// Secret key used in server-side Edge Functions
```

#### Endpoints Used

##### Create Checkout Session (Server-Side)
```typescript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price: 'price_xxx',
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing`,
  customer_email: userEmail,
});
```

##### Handle Webhook (Server-Side)
```typescript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

switch (event.type) {
  case 'checkout.session.completed':
    // Update user to Pro
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_customer_id: event.data.object.customer,
        stripe_subscription_id: event.data.object.subscription,
      })
      .eq('id', userId);
    break;
  case 'customer.subscription.deleted':
    // Downgrade to Free
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
      })
      .eq('stripe_subscription_id', event.data.object.id);
    break;
}
```

---

## Internal Services

### GeminiService

**Location**: `services/geminiService.ts`

**Purpose**: Wrapper around Google Gemini AI for sports predictions

#### Methods

##### predictMatch
```typescript
async predictMatch(match: Match): Promise<PredictionResult>
```

Generates a standard prediction with win/draw/loss probabilities.

**Parameters**:
- `match`: Match object with teams, date, league info

**Returns**:
```typescript
interface PredictionResult {
  matchId: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  summary: string;
  keyFactors: string[];
  createdAt: string;
}
```

**Example Usage**:
```typescript
const service = new GeminiService();
const prediction = await service.predictMatch(match);
console.log(prediction.homeWinProbability); // 65
```

---

##### getDetailedForecast
```typescript
async getDetailedForecast(match: Match): Promise<DetailedForecastResult>
```

Generates a comprehensive forecast with score predictions, likely scorers, etc.

**Parameters**:
- `match`: Match object with teams, date, league info

**Returns**:
```typescript
interface DetailedForecastResult {
  matchId: string;
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
```

**Example Usage**:
```typescript
const service = new GeminiService();
const forecast = await service.getDetailedForecast(match);
console.log(forecast.predictedScore); // "2-1"
```

---

##### backtestMatch
```typescript
async backtestMatch(matchData: BacktestMatchData): Promise<BacktestResultItem>
```

Simulates a prediction for a historical match (actual result hidden from AI).

**Parameters**:
```typescript
interface BacktestMatchData {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}
```

**Returns**:
```typescript
interface BacktestResultItem {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  predictedHomeWin: number;
  predictedDraw: number;
  predictedAwayWin: number;
  actualResult: 'Home' | 'Draw' | 'Away';
  predictedResult: 'Home' | 'Draw' | 'Away';
  isCorrect: boolean;
}
```

**Example Usage**:
```typescript
const service = new GeminiService();
const backtest = await service.backtestMatch({
  date: '2024-12-01',
  homeTeam: 'Manchester United',
  awayTeam: 'Liverpool',
  homeScore: 2,
  awayScore: 1,
});
console.log(backtest.isCorrect); // true
```

---

##### fetchTodayMatches
```typescript
async fetchTodayMatches(sport?: 'Soccer' | 'Basketball'): Promise<Match[]>
```

Fetches today's matches from TheSportsDB API.

**Parameters**:
- `sport` (optional): Filter by sport type

**Returns**: Array of Match objects

**Example Usage**:
```typescript
const service = new GeminiService();
const soccerMatches = await service.fetchTodayMatches('Soccer');
const allMatches = await service.fetchTodayMatches();
```

---

### HistoryService

**Location**: `services/historyService.ts`

**Purpose**: Manage prediction history in Supabase and local cache

#### Methods

##### savePrediction
```typescript
async savePrediction(
  userId: string,
  matchId: string,
  matchData: Match,
  predictionType: 'standard' | 'detailed' | 'backtest',
  predictionData: PredictionResult | DetailedForecastResult
): Promise<void>
```

Saves a prediction to Supabase and local cache.

**Parameters**:
- `userId`: User ID from Supabase auth
- `matchId`: Unique match identifier
- `matchData`: Full match object
- `predictionType`: Type of prediction
- `predictionData`: Prediction result data

**Example Usage**:
```typescript
await historyService.savePrediction(
  user.id,
  match.id,
  match,
  'standard',
  prediction
);
```

---

##### getPredictions
```typescript
async getPredictions(
  userId: string,
  limit?: number
): Promise<PredictionRecord[]>
```

Retrieves prediction history for a user.

**Parameters**:
- `userId`: User ID from Supabase auth
- `limit` (optional): Maximum number of records to return

**Returns**: Array of prediction records

**Example Usage**:
```typescript
const history = await historyService.getPredictions(user.id, 50);
console.log(history.length); // 42
```

---

##### logUsage
```typescript
async logUsage(
  userId: string,
  action: 'standard_prediction' | 'detailed_prediction' | 'backtest'
): Promise<void>
```

Logs a usage action for weekly limit tracking.

**Parameters**:
- `userId`: User ID from Supabase auth
- `action`: Type of action performed

**Example Usage**:
```typescript
await historyService.logUsage(user.id, 'standard_prediction');
```

---

##### getWeeklyUsage
```typescript
async getWeeklyUsage(userId: string, action?: UsageAction): Promise<number>
```

Gets the count of usage actions in the current week.

**Parameters**:
- `userId`: User ID from Supabase auth
- `action` (optional): Filter by specific action type

**Returns**: Number of actions this week

**Example Usage**:
```typescript
const standardPredictions = await historyService.getWeeklyUsage(
  user.id,
  'standard_prediction'
);
console.log(standardPredictions); // 7
```

---

## Data Models

### Match

```typescript
interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  league: string;
  sport: 'All' | 'Football' | 'NBA';
  status: 'Scheduled' | 'Live' | 'Finished' | 'Postponed';
  homeScore?: number;
  awayScore?: number;
}
```

### PredictionResult

```typescript
interface PredictionResult {
  matchId: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  summary: string;
  keyFactors: string[];
  createdAt: string;
}
```

### DetailedForecastResult

```typescript
interface DetailedForecastResult {
  matchId: string;
  predictedScore: string;
  totalGoals: string;
  firstTeamToScore: string;
  halfTimeWinner: 'Home' | 'Draw' | 'Away';
  secondHalfWinner: 'Home' | 'Draw' | 'Away';
  likelyScorers: LikelyScorer[];
  scoringMethodProbabilities: ScoringMethods;
  redCards: string;
  confidenceScore: 'High' | 'Medium' | 'Low';
  reasoning: string;
}
```

### UserProfile

```typescript
interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_tier: 'free' | 'pro';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_detailed_forecasts_used: number;
  created_at: string;
  updated_at: string;
}
```

---

## Error Handling

All services implement error handling with descriptive messages:

```typescript
try {
  const prediction = await geminiService.predictMatch(match);
} catch (error) {
  if (error instanceof PredictionError) {
    console.error('Prediction failed:', error.message);
    // Show user-friendly error message
  }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `PredictionError` | API call failed | Retry with exponential backoff |
| `ValidationError` | Invalid match data | Validate input before API call |
| `AuthenticationError` | Invalid Supabase session | Prompt user to sign in again |
| `RateLimitError` | API rate limit exceeded | Wait before retrying |
| `NetworkError` | Connection failed | Check internet connection |

---

## Rate Limits

### Google Gemini AI
- Free tier: 15 requests per minute
- Paid tier: 150 requests per minute

### TheSportsDB
- Free tier: Unlimited (with API key)

### Supabase
- Free tier: 500MB database, 1GB bandwidth
- Pro tier: 8GB database, 50GB bandwidth

---

## Testing API Integrations

### Mock Gemini Responses
```typescript
const mockPrediction: PredictionResult = {
  matchId: '123',
  homeWinProbability: 60,
  drawProbability: 25,
  awayWinProbability: 15,
  summary: 'Home team favored',
  keyFactors: ['Home advantage', 'Recent form'],
  createdAt: new Date().toISOString(),
};
```

### Mock TheSportsDB Responses
```typescript
const mockMatches: Match[] = [
  {
    id: '1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    date: '2025-01-15',
    time: '15:00',
    league: 'Premier League',
    sport: 'Football',
    status: 'Scheduled',
  },
];
```

---

Last updated: 2025-01-08

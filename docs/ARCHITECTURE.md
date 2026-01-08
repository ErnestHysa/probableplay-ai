# ProbablePlay AI - Architecture Documentation

## System Overview

ProbablePlay AI is a client-side React application that provides AI-powered sports betting predictions. The application uses a serverless architecture with managed services for authentication, database, and payments.

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Browser       │─────▶│   Vite Dev   │─────▶│  Production     │
│  (React App)    │      │    Server    │      │   (Static)      │
└────────┬────────┘      └──────────────┘      └────────┬────────┘
         │                                               │
         │                                               │
         └───────────────────┬───────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Supabase    │   │   Gemini AI  │   │   Stripe     │
│  (Auth+DB)   │   │  (Predict)   │   │  (Payments)  │
└──────────────┘   └──────────────┘   └──────────────┘
         │                   │
         ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │ TheSportsDB  │
│  (Database)  │   │  (MatchData) │
└──────────────┘   └──────────────┘
```

## Technology Stack

### Frontend Layer
- **React 19**: UI framework with concurrent features
- **TypeScript 5.8**: Type-safe development
- **Vite 6**: Fast build tool and dev server
- **React Router 6**: Client-side routing
- **Tailwind CSS**: Utility-first styling (via CDN)
- **Recharts**: Data visualization charts
- **Lucide React**: Icon library

### Backend Services (BaaS)
- **Supabase**: Authentication + PostgreSQL database
- **Google Gemini AI**: AI prediction engine
- **Stripe**: Payment processing
- **TheSportsDB**: Sports data API

## Key Design Decisions

### 1. Client-Side Architecture
**Decision**: Run all application logic in the browser
**Rationale**:
- Simplifies deployment (static hosting)
- Reduces infrastructure costs
- Faster development iteration
- Sufficient for current scale

**Trade-offs**:
- API keys exposed to client (mitigated with API restrictions)
- Limited background processing
- Requires careful permission handling

### 2. Supabase for Auth & Database
**Decision**: Use Supabase instead of custom backend
**Rationale**:
- Built-in authentication with social providers
- Real-time subscriptions for profile updates
- Row Level Security (RLS) for data protection
- PostgreSQL with full SQL capabilities
- Easy integration with React

**Implementation**:
```typescript
// Auth context provides centralized state
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});
```

### 3. Feature Flags System
**Decision**: Centralized permission checking in `lib/featureFlags.ts`
**Rationale**:
- Single source of truth for permissions
- Consistent upgrade prompts
- Easy to modify tier limits
- Testable in isolation

**Implementation**:
```typescript
export const canAccessBacktesting = (profile: any): FeatureCheckResult => {
  if (!profile) {
    return { allowed: false, reason: 'Please sign in to use this feature' };
  }

  if (profile.subscription_tier === 'pro' && profile.subscription_status === 'active') {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Backtesting is a Pro feature. Upgrade to unlock unlimited backtesting.',
    upgradeRequired: true,
  };
};
```

### 4. State Management Strategy
**Decision**: React Context + local component state
**Rationale**:
- Sufficient for current complexity
- No need for Redux/Zustand overhead
- Auth state is global (Context)
- UI state is local (useState)
- Easy to understand and debug

**State Hierarchy**:
```
App.tsx (Root)
├── AuthContext (Global: user, profile, auth methods)
└── Local State (Per View)
    ├── view: ViewState
    ├── selectedMatch: Match | null
    ├── prediction: PredictionResult | null
    ├── activeSport: SportFilter
    └── searchQuery: string
```

### 5. Service Layer Pattern
**Decision**: Separate business logic from components
**Rationale**:
- Reusable across components
- Easier to test
- Clear separation of concerns
- Centralized API configuration

**Services**:
- `geminiService.ts`: AI predictions, match fetching
- `historyService.ts`: Prediction storage (Supabase + local cache)

## Database Schema

### Tables

#### profiles
User account and subscription data
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_detailed_forecasts_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### predictions
Prediction history for all users
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  match_id TEXT NOT NULL,
  match_data JSONB,
  prediction_type TEXT,
  prediction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### usage_logs
Weekly usage tracking for limits
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables use RLS policies to ensure users can only access their own data:

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only insert their own predictions
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Authentication Flow

### Browse Mode (Unauthenticated)
```
1. User lands on homepage
2. AuthContext initializes (isLoading = true)
3. Session check returns no user
4. App renders in browse mode
5. Dashboard shows demo/public matches
```

### Sign Up Flow
```
1. User clicks "Sign Up"
2. Navigates to /auth/signup
3. Enters email/password
4. Supabase auth.createUser()
5. Profile created via trigger
6. Redirected to dashboard
7. AuthContext updates with user data
```

### Sign In Flow
```
1. User clicks "Sign In"
2. Navigates to /auth/signin
3. Enters credentials
4. Supabase auth.signInWithPassword()
5. Session established
6. Profile fetched from profiles table
7. Redirected to dashboard
```

### Pro Upgrade Flow
```
1. User clicks "Upgrade to Pro"
2. Navigates to PricingView
3. Selects plan (monthly/yearly)
4. Stripe Checkout initialized
5. Redirected to Stripe hosted page
6. Payment processed
7. Webhook updates Supabase profile
8. User redirected back to app
9. AuthContext refreshes profile
10. Pro features unlocked
```

## Prediction Generation Flow

### Standard Prediction
```
1. User selects match from Dashboard
2. App.tsx: handleSelectMatch(match)
3. Navigate to PredictionView
4. User clicks "Get Prediction"
5. Feature check: canMakeStandardPrediction()
6. If allowed:
   - geminiService.predictMatch(match)
   - Call Gemini API with search grounding
   - Parse JSON response
   - Validate probabilities (sum to 100)
   - Save to Supabase predictions table
   - Log usage in usage_logs
   - Update state with result
7. If not allowed:
   - Show UpgradeModal with reason
```

### Detailed Forecast
```
1. User navigates to "Detailed Forecast" tab
2. Selects match (reuses Dashboard)
3. User clicks "Get Detailed Forecast"
4. Feature check: canMakeDetailedForecast()
5. If allowed:
   - geminiService.getDetailedForecast(match)
   - Call Gemini API with thinking config
   - Parse comprehensive JSON response
   - Decrement trial forecasts used (if free tier)
   - Save to predictions table
   - Update profile
   - Log usage
6. Display comprehensive report:
   - Predicted score
   - Likely scorers
   - Scoring methods
   - Half/full time predictions
   - Confidence score
```

### Backtesting
```
1. User navigates to BacktestView (Pro only)
2. Feature check: canAccessBacktesting()
3. User selects historical match
4. geminiService.backtestMatch(matchData)
5. Simulate prediction as if match was upcoming
6. Compare with actual result
7. Calculate accuracy metrics
8. Store in backtest results
9. Display accuracy over time
```

## Component Architecture

### Component Hierarchy
```
App (BrowserRouter)
├── AuthProvider (AuthContext)
│   ├── Routes
│   │   ├── /auth/signin → SignIn
│   │   ├── /auth/signup → SignUp
│   │   └── * → AppContent
│   │       └── Layout
│   │           ├── Navigation
│   │           └── Content Area
│   │               ├── Dashboard
│   │               │   ├── Filters
│   │               │   ├── MatchList
│   │               │   │   └── LeagueAccordion
│   │               │   │       └── MatchCard
│   │               │   └── SearchBar
│   │               ├── PredictionView
│   │               │   ├── MatchInfo
│   │               │   ├── ProbabilityChart
│   │               │   └── PredictionSummary
│   │               ├── DetailedForecastView
│   │               │   ├── ForecastSummary
│   │               │   ├── ScorePrediction
│   │               │   └── LikelyScorers
│   │               ├── HistoryView
│   │               │   ├── PredictionList
│   │               │   └── PredictionCard
│   │               ├── BacktestView
│   │               │   ├── BacktestForm
│   │               │   └── BacktestResults
│   │               ├── StatisticsView
│   │               │   ├── AccuracyTrendChart
│   │               │   ├── PredictionDistribution
│   │               │   └── WeeklyUsageChart
│   │               ├── ProfileView
│   │               │   ├── ProfileInfo
│   │               │   └── UsageStats
│   │               └── PricingView
│   │                   └── PricingCards
│   └── Global Components
│       ├── ProtectedRoute
│       ├── UpgradeModal
│       ├── Toast
│       └── ErrorBoundary
```

### Component Patterns

#### 1. Container/Presentational Pattern
```typescript
// Container component (handles logic)
const Dashboard: React.FC<DashboardProps> = ({ onSelectMatch, filter, setFilter }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches().then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, [filter]);

  return <MatchList matches={matches} onSelectMatch={onSelectMatch} loading={loading} />;
};

// Presentational component (renders UI)
const MatchList: React.FC<MatchListProps> = ({ matches, onSelectMatch, loading }) => {
  if (loading) return <MatchSkeleton />;
  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} onClick={onSelectMatch} />
      ))}
    </div>
  );
};
```

#### 2. Custom Hooks Pattern
```typescript
// Feature flag hook for components
const useFeatureFlags = () => {
  const { profile, remainingWeeklyPredictions } = useAuth();

  return {
    canMakeStandardPrediction: () => {
      if (!profile) return { allowed: true };
      if (remainingWeeklyPredictions <= 0) {
        return {
          allowed: false,
          reason: 'Weekly limit reached',
          upgradeRequired: true,
        };
      }
      return { allowed: true };
    },
  };
};

// Usage in component
const PredictionView = () => {
  const { canMakeStandardPrediction } = useFeatureFlags();

  const handlePredict = () => {
    const check = canMakeStandardPrediction();
    if (!check.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    // Proceed with prediction
  };
};
```

#### 3. Render Props Pattern
```typescript
<ProtectedRoute>
  {(isAllowed) => (
    isAllowed ? (
      <BacktestView />
    ) : (
      <UpgradePrompt feature="Backtesting" />
    )
  )}
</ProtectedRoute>
```

## Type System

### Type Definitions Organization

```
types/
├── database.ts          # Supabase-generated types
├── api.ts               # External API types (TheSportsDB, Gemini)
└── types.ts             # Shared application types
```

### Key Type Examples

```typescript
// Match data from TheSportsDB
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  league: string;
  sport: SportFilter;
  status: MatchStatus;
}

// Standard prediction result
export interface PredictionResult {
  matchId: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  summary: string;
  keyFactors: string[];
  createdAt: string;
}

// Detailed forecast result
export interface DetailedForecastResult {
  matchId: string;
  predictedScore: string;
  totalGoals: string;
  firstTeamToScore: string;
  likelyScorers: LikelyScorer[];
  scoringMethodProbabilities: ScoringMethods;
  confidenceScore: 'High' | 'Medium' | 'Low';
  reasoning: string;
}
```

## Error Handling Strategy

### 1. Service Layer Errors
```typescript
export class GeminiService {
  async predictMatch(match: Match): Promise<PredictionResult> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return this.parsePrediction(response);
    } catch (error) {
      console.error('Prediction failed:', error);
      throw new PredictionError('Failed to generate prediction');
    }
  }
}
```

### 2. Component Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 3. User-Facing Error Messages
```typescript
const PredictionView = () => {
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    try {
      setError(null);
      await generatePrediction();
    } catch (err) {
      setError('Unable to generate prediction. Please try again later.');
    }
  };

  return (
    <div>
      {error && <ErrorMessage message={error} />}
      {/* ... rest of component */}
    </div>
  );
};
```

## Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load heavy components
const StatisticsView = lazy(() => import('./components/StatisticsView'));
const BacktestView = lazy(() => import('./components/BacktestView'));

// Usage with Suspense
<Suspense fallback={<StatisticsSkeleton />}>
  <StatisticsView />
</Suspense>
```

### 2. Memoization
```typescript
// Memoize expensive computations
const filteredMatches = useMemo(() => {
  return matches.filter(match =>
    activeSport === 'All' || match.sport === activeSport
  );
}, [matches, activeSport]);

// Memoize callbacks
const handleSelectMatch = useCallback((match: Match) => {
  setSelectedMatch(match);
  setView(ViewState.DETAIL);
}, []);
```

### 3. Loading States
```typescript
// Skeleton screens for better perceived performance
const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  return loading ? (
    <MatchSkeleton count={5} />
  ) : (
    <MatchList matches={matches} />
  );
};
```

## Security Considerations

### 1. API Key Exposure
**Risk**: Client-side exposes API keys
**Mitigation**:
- Use Supabase anon key (restricted by RLS)
- Use Gemini API key with domain restrictions
- Never expose secret keys (Stripe secret, etc.)

### 2. Row Level Security
**Implementation**:
```sql
-- Enable RLS on all tables
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can CRUD own predictions"
  ON predictions FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Input Validation
**Strategy**: Use Zod schemas for all inputs
```typescript
import { z } from 'zod';

export const predictionSchema = z.object({
  matchId: z.string().uuid(),
  predictionType: z.enum(['standard', 'detailed', 'backtest']),
  homeWinProbability: z.number().min(0).max(100),
  drawProbability: z.number().min(0).max(100),
  awayWinProbability: z.number().min(0).max(100),
});
```

### 4. Stripe Webhook Verification
```typescript
// In Edge Function (server-side)
export default async function handler(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      webhookSecret
    );

    // Process webhook
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
}
```

## Deployment Architecture

### Development
```
Vite Dev Server (localhost:3000)
├── HMR for fast updates
├── Source maps for debugging
└── Proxy to APIs
```

### Production
```
Vercel (or similar static host)
├── Static files from `npm run build`
├── Edge Functions for Stripe webhooks
├── Environment variables for configuration
└── Automatic deployments on git push
```

### Build Process
```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build
# Creates: dist/index.html, dist/assets/*.js

# 3. Preview
npm run preview
# Serves dist/ locally for testing
```

## Monitoring & Analytics

### Recommended Tools
- **Vercel Analytics**: Web vitals and traffic
- **Supabase Logs**: Database and auth events
- **Stripe Dashboard**: Payment metrics
- **Google Analytics**: User behavior (optional)

### Key Metrics to Track
- Prediction accuracy
- Free to Pro conversion rate
- Feature usage by tier
- API error rates
- Page load times

## Future Architecture Considerations

### Potential Enhancements
1. **Server-Side API Layer**
   - Move Gemini calls to Edge Functions
   - Hide API keys completely
   - Enable background processing

2. **Redis Caching**
   - Cache match data from TheSportsDB
   - Cache prediction results
   - Reduce API calls

3. **WebSocket Real-Time Updates**
   - Live match scores
   - Real-time prediction updates
   - Instant notifications

4. **Microservices**
   - Separate prediction service
   - Dedicated auth service
   - Payment processing service

### Scalability Planning
- Current architecture supports ~10k users
- With Edge Functions: ~100k users
- With microservices: 1M+ users

---

Last updated: 2025-01-08

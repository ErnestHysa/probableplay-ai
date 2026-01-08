# ProbablePlay AI - Project Guide for Claude Code

## Project Overview

**ProbablePlay AI** is a React-based SaaS application that provides AI-powered sports match predictions. It features a Netflix-style browse mode for unauthenticated users and tiered subscriptions (Free/Pro) with advanced features like backtesting and detailed AI forecasts.

**Key Features:**
- **Browse Mode**: Unauthenticated users can explore demo matches (Netflix-style experience)
- **Standard Predictions**: Win/draw/loss probability analysis for all authenticated users
- **Detailed AI Forecasts**: Comprehensive predictions with score predictions, likely scorers (3 free for new users, unlimited for Pro)
- **Backtesting**: Test prediction accuracy against historical matches (Pro only)
- **Advanced Statistics**: Track accuracy trends and usage analytics (Pro only)
- **Authentication**: Supabase-based auth with email/password
- **Payments**: Stripe integration for Pro subscriptions

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React | 19.2.0 |
| **Language** | TypeScript | ~5.8.2 |
| **Build Tool** | Vite | 6.2.0 |
| **Authentication** | Supabase Auth | 2.90.0 |
| **Database** | Supabase PostgreSQL | - |
| **Payments** | Stripe | - |
| **AI Service** | Google Gemini API (@google/genai) | 1.30.0 |
| **Charts** | Recharts | 3.5.0 |
| **Icons** | Lucide React | 0.555.0 |
| **Routing** | React Router DOM | 6.30.3 |
| **Validation** | Zod | 3.25.76 |
| **Date Utilities** | date-fns | 3.6.0 |
| **Styling** | Tailwind CSS (via CDN) | - |
| **Sports Data** | TheSportsDB API | - |

---

## Directory Structure

```
probableplay-ai/
├── src/
│   ├── components/           # React UI components
│   │   ├── auth/            # SignIn, SignUp components
│   │   ├── charts/          # Recharts components (AccuracyTrend, etc.)
│   │   ├── loading/         # Skeleton loading states
│   │   ├── Dashboard.tsx    # Main dashboard for browsing matches
│   │   ├── PredictionView.tsx      # Display prediction results
│   │   ├── DetailedForecastView.tsx # Detailed analysis view
│   │   ├── HistoryView.tsx         # Historical predictions
│   │   ├── BacktestView.tsx        # Backtesting interface
│   │   ├── StatisticsView.tsx      # Advanced analytics dashboard
│   │   ├── ProfileView.tsx         # User profile and settings
│   │   ├── PricingView.tsx         # Stripe pricing page
│   │   ├── ProtectedRoute.tsx      # Auth wrapper component
│   │   └── UpgradeModal.tsx        # Pro upgrade prompt
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── lib/
│   │   ├── featureFlags.ts  # Feature permission checks
│   │   ├── schemas.ts       # Zod validation schemas
│   │   └── supabase.ts      # Supabase client configuration
│   ├── services/
│   │   ├── geminiService.ts # AI prediction service
│   │   └── historyService.ts # Local storage management
│   ├── types/
│   │   ├── api.ts           # External API type definitions
│   │   └── database.ts      # Supabase database types
│   ├── utils/
│   │   ├── validation.ts    # Input validation utilities
│   │   └── export.ts        # Data export utilities
│   └── styles/
│       └── theme.ts         # Tailwind theme configuration
├── services/                # Business logic services
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture
│   ├── API.md               # API documentation
│   ├── CONTRIBUTING.md      # Contribution guidelines
│   └── DEPLOYMENT.md        # Deployment guide
├── App.tsx                  # Main application component
├── index.tsx                # Application entry point
├── types.ts                 # Shared TypeScript type definitions
├── constants.ts             # Application constants
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── .env.example             # Environment variables template
└── .env.local               # Environment variables (not committed)
```

---

## Architecture & Patterns

### State Management
- **AuthContext** (React Context): Global authentication state
- **Local Component State**: UI-specific state using useState
- **State Lifting**: Shared state lifted to App.tsx
- **No Redux/Zustand**: Keeping it simple for now

### Authentication Flow
1. **Browse Mode**: Users can explore without authentication (demo matches)
2. **Sign Up**: Create account via Supabase auth (email/password)
3. **Free Tier**: Auto-enrolled after signup (10 predictions/week, 3 detailed forecasts)
4. **Pro Upgrade**: Stripe checkout for unlimited access
5. **Session Management**: Supabase handles persistence

### Feature Flags System
Centralized permission checking in `lib/featureFlags.ts`:
- `canMakeStandardPrediction()`: Check weekly limits
- `canMakeDetailedForecast()`: Check trial usage or Pro status
- `canAccessBacktesting()`: Pro only
- `canAccessAdvancedStats()`: Pro only
- `canExportData()`: Pro only

### Service Layer
- `services/geminiService.ts`:
  - Fetches matches from TheSportsDB API
  - Generates predictions via Gemini AI with Google Search Grounding
  - Handles backtesting logic
- `services/historyService.ts`:
  - Saves predictions to Supabase
  - Retrieves prediction history
  - Logs usage for weekly limits

### Component Organization
- Functional components with hooks (no class components)
- Explicit prop interfaces (TypeScript)
- Reusable components (MatchCard, Filters, etc.)
- Clear separation: Container (logic) vs Presentational (UI)

### Data Flow
```
User Action → Component → AuthContext Check → Service Layer → External API
                                              ↓
                         Response → State Update → Component Re-render
```

---

## Type Definitions

### Core Types (types.ts)
- `Match`: Sports match with teams, time, status, score
- `PredictionResult`: Standard prediction with probabilities
- `DetailedForecastResult`: In-depth prediction with scorers, methods
- `League`: Sports league with metadata
- `ViewState`: App navigation state enum
- `SportFilter`: 'All' | 'Football' | 'NBA'

### API Types (src/types/api.ts)
- `TheSportsDBEvent`: Match data from TheSportsDB
- `AIProbabilityResponse`: Standard prediction response
- `AIDetailedForecastResponse`: Detailed forecast response
- `AIBacktestResponse`: Backtest prediction response

### Database Types (src/types/database.ts)
- `Profile`: User profile and subscription data
- `Prediction`: Prediction record
- `UsageLog`: Usage tracking for limits

---

## Environment Setup

**Required in `.env.local`:**
```bash
# Supabase (Authentication + Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Gemini AI (Predictions)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Development commands:**
```bash
npm install      # Install dependencies
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Subscription Tiers

| Feature | Free | Pro |
|---------|------|-----|
| Standard Predictions | 10/week | Unlimited |
| Detailed Forecasts | 3 total | Unlimited |
| Backtesting | Locked | Unlimited |
| Advanced Statistics | Locked | Full access |
| History Retention | 7 days | Forever |
| Data Export | Locked | CSV/JSON |

---

## Supported Leagues

### Football (Soccer)
- English Premier League
- Bundesliga (Germany)
- La Liga (Spain)
- Serie A (Italy)
- Ligue 1 (France)
- Eredivisie (Netherlands)
- UEFA Champions League

### Basketball
- NBA (National Basketball Association)

---

## Key Flows

### Browse Mode (Unauthenticated)
1. User lands on homepage
2. AuthContext checks for session (none found)
3. Dashboard shows demo/public matches
4. "Get Started" prompts sign-up

### Standard Prediction Flow
1. User selects match from Dashboard
2. Feature check: `canMakeStandardPrediction()`
3. If allowed: `geminiService.predictMatch()`
4. Save to Supabase predictions table
5. Log usage in usage_logs table
6. Display results in PredictionView
7. If not allowed: Show UpgradeModal

### Detailed Forecast Flow
1. User navigates to "Detailed Forecast" tab
2. Selects match (reuses Dashboard)
3. Feature check: `canMakeDetailedForecast()`
4. If Pro or has trials remaining: `geminiService.getDetailedForecast()`
5. Decrement trial count (if free tier)
6. Save prediction and update profile
7. Display comprehensive report

### Pro Upgrade Flow
1. User clicks "Upgrade to Pro"
2. Navigate to PricingView
3. Click "Subscribe" → Stripe Checkout
4. Redirect to Stripe hosted page
5. Payment processed
6. Webhook updates Supabase profile (tier: 'pro')
7. User redirected back to app
8. AuthContext refreshes profile
9. Pro features unlocked

---

## Code Conventions

1. **Components**: Use `React.FC` with explicit prop interfaces
2. **Imports**: Absolute imports from root directory preferred
3. **Naming**:
   - camelCase for variables and functions
   - PascalCase for components and types
   - UPPER_CASE for constants
4. **Styling**: Tailwind CSS utility classes
5. **Error Handling**: Try-catch in services, display errors in UI
6. **Loading States**: Always show loading indicators during async operations
7. **Feature Checks**: Use `useFeatureFlags()` hook before allowing actions

---

## AI Team Configuration

When working on this project, use these specialist agents:

| Task Type | Use Agent |
|-----------|-----------|
| **Frontend components** | `react-component-architect` |
| **UI styling/Tailwind** | `tailwind-frontend-expert` |
| **TypeScript issues** | `typescript-expert` or general frontend agent |
| **API/service logic** | `backend-developer` (for service layer) |
| **Code review** | `code-reviewer` (after changes) |
| **Bug investigation** | `systematic-debugging` (superpowers skill) |
| **New features** | `brainstorming` (superpowers skill) first |
| **Documentation** | `documentation-specialist` (for docs updates) |

---

## Important Notes

- **Browse Mode**: Unauthenticated users can explore demo matches
- **API Key**: The app checks for `VITE_GEMINI_API_KEY` on load and shows error if missing
- **Demo Data**: `PLACEHOLDER_MATCHES` in constants.ts provides demo data for testing
- **Sports Mapping**: TheSportsDB returns "Soccer" → app displays "Football"
- **Match Status**: Matches can be Scheduled, Live, Finished, or Postponed
- **Data Storage**: Prediction history stored in Supabase (not localStorage anymore)
- **Feature Flags**: Always check permissions before allowing Pro features
- **Stripe Webhooks**: Use Edge Functions for secure webhook handling

---

## Current AI Model

- **Model**: `gemini-2.5-flash`
- **Features**: Google Search Grounding, Thinking Config (for detailed forecasts)
- **System Instructions**: Expert sports analyst persona for predictions
- **Temperature**: 0.7 (balanced creativity)

---

## Development Notes

When adding features:
1. Add new types to appropriate `types/` file first
2. Create reusable components in `components/`
3. Add service methods to `services/geminiService.ts` for API calls
4. Update feature flags in `lib/featureFlags.ts` if gated by subscription
5. Update App.tsx state management for new data flows
6. Update AuthContext if authentication state changes
7. Test with both Free and Pro tiers
8. Follow existing patterns for consistency

---

## Documentation

For detailed information, see:
- **README.md**: Project overview and getting started
- **docs/ARCHITECTURE.md**: System architecture and design decisions
- **docs/API.md**: API documentation (internal and external)
- **docs/CONTRIBUTING.md**: Contribution guidelines and coding standards
- **docs/DEPLOYMENT.md**: Deployment guide for production

---

Last updated: 2025-01-08

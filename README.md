# ProbablePlay AI

AI-powered sports betting predictions powered by Google Gemini AI. Get intelligent predictions for football (soccer) and NBA matches with advanced analytics and detailed forecasting.

## Features

### For Everyone (Browse Mode)
- **Explore Matches**: Browse upcoming matches without signing up
- **Demo Experience**: Preview the platform with sample matches
- **Modern UI**: Netflix-style interface with dark theme

### Free Tier Features
- **Standard Predictions**: Get win/draw/loss probabilities for matches
- **3 Free Detailed Forecasts**: Try our advanced AI analysis (limited time offer)
- **Weekly Prediction Limits**: Limited standard predictions per week
- **7-Day History**: Access your prediction history for the past 7 days

### Pro Tier Features
- **Unlimited Predictions**: No weekly limits on standard predictions
- **Unlimited Detailed Forecasts**: Deep-dive AI analysis on any match
- **Backtesting Lab**: Test predictions against historical matches
- **Advanced Statistics**: Track accuracy trends, prediction distribution, and weekly usage
- **Data Export**: Export your prediction history
- **Unlimited History**: Access all your predictions forever

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React | 19.2.0 |
| **Language** | TypeScript | ~5.8.2 |
| **Build Tool** | Vite | 6.2.0 |
| **AI Service** | Google Gemini API (@google/genai) | 1.30.0 |
| **Authentication** | Supabase Auth | 2.90.0 |
| **Database** | Supabase PostgreSQL | - |
| **Payments** | Stripe | - |
| **Charts** | Recharts | 3.5.0 |
| **Icons** | Lucide React | 0.555.0 |
| **Routing** | React Router DOM | 6.30.3 |
| **Validation** | Zod | 3.25.76 |
| **Date Utilities** | date-fns | 3.6.0 |
| **Styling** | Tailwind CSS (via CDN) | - |
| **Sports Data** | TheSportsDB API | - |

## Project Structure

```
probableplay-ai/
├── src/
│   ├── components/           # React UI components
│   │   ├── auth/            # Authentication components (SignIn, SignUp)
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
├── App.tsx                  # Main application component
├── index.tsx                # Application entry point
├── types.ts                 # Shared TypeScript type definitions
├── constants.ts             # Application constants
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── .env.local               # Environment variables (not committed)
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Google Gemini API key
- Supabase project (for authentication and database)
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd probableplay-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # ============================================
   # ProbablePlay AI - Environment Variables
   # ============================================

   # --------------------------------------------
   # Supabase Configuration
   # --------------------------------------------
   # Get these from: https://supabase.com/dashboard/project/_/settings/api
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # --------------------------------------------
   # Stripe Configuration
   # --------------------------------------------
   # Get publishable key from: https://dashboard.stripe.com/apikeys
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

   # --------------------------------------------
   # Gemini AI Configuration
   # --------------------------------------------
   # Get from: https://aistudio.google.com/app/apikey
   # Note: VITE_ prefix is required for Vite to expose this variable to the browser
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Set up Supabase database**

   Run the SQL migration in your Supabase SQL editor to create the required tables:
   - `profiles` - User subscription and account data
   - `predictions` - Prediction history
   - `usage_logs` - Weekly usage tracking

   See `supabase/migrations/` for the complete schema.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key for payments |
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key for AI predictions |

## Key Features Explained

### Browse Mode (Unauthenticated)
New users can explore the platform without signing up:
- View upcoming matches across supported leagues
- Browse demo matches to see how predictions work
- Netflix-style UI with match cards and filters

### Standard Predictions
Basic win/draw/loss probability analysis:
- Home win, draw, away win percentages
- AI-generated summary
- Key factors influencing the prediction
- Available to all authenticated users (weekly limits apply for free tier)

### Detailed Forecast (Pro Feature, 3 Free for New Users)
Comprehensive match analysis including:
- Predicted scoreline
- Total goals expectation
- First team to score
- Half-time/full-time predictions
- Likely goal scorers with probabilities
- Scoring method probabilities (penalty, free kick, etc.)
- Red card predictions
- Confidence score with reasoning

### Backtesting (Pro Only)
Test prediction accuracy against historical matches:
- Select past matches to simulate predictions
- Compare AI predictions with actual results
- Track accuracy over time
- Identify patterns in prediction performance

### Statistics Dashboard (Pro Only)
Advanced analytics and insights:
- Accuracy trend charts
- Prediction distribution analysis
- Weekly usage tracking
- Historical performance metrics
- Export capabilities

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

## Authentication Flow

1. **Browse Mode**: Users can explore without authentication
2. **Sign Up**: Create account with email/password
3. **Free Tier**: Automatic enrollment with limited features
4. **Pro Upgrade**: Stripe checkout for subscription
5. **Session Management**: Supabase handles auth persistence

## Subscription Tiers

| Feature | Free | Pro |
|---------|------|-----|
| Standard Predictions | 10/week | Unlimited |
| Detailed Forecasts | 3 total | Unlimited |
| Backtesting | Not available | Unlimited |
| Advanced Statistics | Not available | Full access |
| History Retention | 7 days | Forever |
| Data Export | Not available | CSV/JSON |

## Architecture Highlights

### State Management
- React Context (AuthContext) for authentication
- Local component state for UI interactions
- Supabase real-time subscriptions for profile updates

### Service Layer
- `geminiService.ts`: Handles all AI API interactions with Google Gemini
- `historyService.ts`: Manages prediction storage (Supabase + local cache)

### Feature Flags
- Centralized permission system in `lib/featureFlags.ts`
- Checks user subscription tier before granting access
- Provides upgrade prompts when limits are reached

### Data Flow
```
User Action → Component → AuthContext Check → Service Layer → API
                                              ↓
                         Response → State Update → UI Re-render
```

## AI Configuration

- **Model**: `gemini-2.5-flash`
- **Features**: Google Search Grounding for real-time data
- **System Instructions**: Expert sports analyst persona
- **Fallback**: Graceful error handling with user-friendly messages

## Contributing

1. Follow existing code patterns and conventions
2. Use TypeScript strict mode (enforced in tsconfig.json)
3. Write component prop interfaces explicitly
4. Handle errors gracefully with user feedback
5. Test authentication flows for both free and pro tiers
6. Respect feature flag permissions

## Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Add environment variables in project settings
3. Deploy automatically on push to main branch

### Manual Build
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## Security Notes

- Never commit `.env.local` to version control
- Supabase Row Level Security (RLS) should be enabled
- Stripe webhooks should be verified in production
- API keys are exposed to client-side (use appropriate restrictions)

## License

[Your License Here]

## Support

For issues or questions:
- Create an issue in the repository
- Contact: [Your support email]

---

Built with React 19, TypeScript, Vite, and powered by Google Gemini AI.

# ProbablePlay AI - Project Guide for Claude Code

## Project Overview

**ProbablePlay AI** is a React-based web application that provides AI-powered sports match predictions. It uses Google's Gemini AI with Google Search Grounding to generate predictions for football (soccer) and NBA matches.

**Key Features:**
- Real-time match predictions with win probabilities
- Detailed AI forecasts with scoring predictions, likely scorers, and match events
- Match history tracking
- Backtesting lab for historical prediction accuracy
- Multiple prediction types (Standard and Detailed)

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React | 19.2.0 |
| **Language** | TypeScript | ~5.8.2 |
| **Build Tool** | Vite | 6.2.0 |
| **AI Service** | Google Gemini API (@google/genai) | 1.30.0 |
| **Charts** | Recharts | 3.5.0 |
| **Icons** | Lucide React | 0.555.0 |
| **Styling** | Tailwind CSS (via CDN) | - |
| **Sports Data** | TheSportsDB API | - |

---

## Directory Structure

```
probableplay-ai/
├── components/           # React UI components
│   ├── Dashboard.tsx           # Main dashboard for today's fixtures
│   ├── MatchList.tsx           # List of matches with filtering
│   ├── Layout.tsx              # Main layout with navigation
│   ├── LeagueAccordion.tsx     # Accordion for league sections
│   ├── Filters.tsx             # Sport and search filters
│   ├── PredictionView.tsx      # Display prediction results
│   ├── DetailedForecastView.tsx  # Detailed analysis view
│   ├── HistoryView.tsx         # Historical predictions
│   ├── BacktestView.tsx        # Backtesting interface
│   └── ProbabilityChart.tsx    # Visual probability charts
├── services/             # Business logic services
│   ├── geminiService.ts        # AI prediction service
│   └── historyService.ts       # Local storage management
├── App.tsx               # Main application component
├── index.tsx             # Application entry point
├── types.ts              # TypeScript type definitions
├── constants.ts          # Application constants
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
└── .env.local            # Environment variables (GEMINI_API_KEY)
```

---

## Architecture & Patterns

### State Management
- **Local component state** using React hooks (useState, useEffect)
- **State lifting** to App component for shared data (filters, navigation)
- **No global state management library** - keep it simple

### Service Layer
- `geminiService.ts`: Handles all AI API interactions
  - Fetches leagues/matches from TheSportsDB
  - Generates predictions via Gemini AI
  - Supports Google Search Grounding for real-time data
- `historyService.ts`: Manages local storage for predictions

### Component Organization
- Single file per component
- Clear prop interfaces (TypeScript)
- Functional components with hooks
- Reusable components (Filters, MatchList, etc.)

### Data Flow
```
User Action → Component → Handler (App.tsx) → Service (geminiService)
                                              ↓
API Response → Service → State Update → Component Re-render
```

---

## Type Definitions (types.ts)

Key types to understand:
- `Match`: A sports match with teams, time, status, score
- `PredictionResult`: Standard prediction with probabilities
- `DetailedForecastResult`: In-depth prediction with scorers, methods
- `League`: Sports league with metadata
- `ViewState`: App navigation state enum
- `SportFilter`: 'All' | 'Football' | 'NBA'

---

## Environment Setup

**Required in `.env.local`:**
```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Development commands:**
```bash
npm install      # Install dependencies
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
```

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

---

## Code Conventions

1. **Components**: Use `React.FC` with explicit prop interfaces
2. **Imports**: Use `@/` path alias for root directory imports
3. **Naming**: camelCase for variables, PascalCase for components
4. **Styling**: Tailwind CSS utility classes
5. **Error Handling**: Try-catch in service methods, display errors in UI
6. **Loading States**: Always show loading indicators during async operations

---

## Supported Leagues

- English Premier League
- Bundesliga
- La Liga
- Serie A
- Ligue 1
- Eredivisie
- NBA
- Champions League

---

## Key Flows

### Standard Prediction Flow
1. User selects match from Dashboard
2. `handleSelectMatch` in App.tsx calls `geminiService.predictMatch()`
3. Gemini AI generates probabilities with Google Search
4. Result saved to history via `historyService.savePrediction()`
5. PredictionView displays results

### Detailed Forecast Flow
1. User navigates to "Detailed Forecast" tab
2. Selects match (reuses Dashboard component)
3. `handleSelectDetailedMatch` calls `geminiService.getDetailedForecast()`
4. Returns comprehensive prediction with scorers, methods, probabilities
5. DetailedForecastView displays full report

---

## Important Notes

- **API Key**: The app checks for `GEMINI_API_KEY` on load and shows error if missing
- **Demo Mode**: `PLACEHOLDER_MATCHES` in constants.ts provides demo data for testing
- **Sports Mapping**: TheSportsDB returns "Soccer" → app displays "Football"
- **Live Status**: Matches can be Scheduled, Live, Finished, or Postponed
- **Local Storage**: Prediction history persists in browser localStorage

---

## Current AI Model

- **Model**: `gemini-2.5-flash`
- **Features**: Google Search Grounding, Thinking Config (for detailed forecasts)
- **System Instructions**: Expert sports analyst persona for predictions

---

## Development Notes

When adding features:
1. Add new types to `types.ts` first
2. Create reusable components in `components/`
3. Add service methods to `services/geminiService.ts` for API calls
4. Update App.tsx state management for new data flows
5. Follow existing patterns for consistency

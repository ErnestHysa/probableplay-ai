# Contributing to ProbablePlay AI

Thank you for your interest in contributing to ProbablePlay AI! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- A code editor (VS Code recommended)
- Google Gemini API key
- Supabase account (for testing auth features)

### Initial Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/probableplay-ai.git
   cd probableplay-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### 1. Choose an Issue

- Check the [Issues](../../issues) page for open issues
- Comment on the issue you want to work on
- Wait for assignment before starting work

### 2. Create a Branch

Use these branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

```bash
git checkout -b feature/detailed-forecast-export
git checkout -b fix/prediction-validation
git checkout -b docs/api-documentation
```

### 3. Make Changes

- Follow the [Coding Standards](#coding-standards)
- Test your changes thoroughly
- Update documentation if needed

### 4. Commit Changes

Follow the [Commit Conventions](#commit-conventions)

```bash
git add .
git commit -m "feat: add CSV export for detailed forecasts"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

---

## Coding Standards

### TypeScript

#### Use Strict Type Checking
The project uses TypeScript strict mode. Always:

- Define types for all function parameters and return values
- Avoid `any` types
- Use interfaces for object shapes
- Use type aliases for union types

```typescript
// Good
interface PredictionProps {
  match: Match;
  onGenerate: (prediction: PredictionResult) => void;
}

const PredictionView: React.FC<PredictionProps> = ({ match, onGenerate }) => {
  // ...
};

// Bad
const PredictionView = ({ match, onGenerate }: any) => {
  // ...
};
```

#### Use Type Guards
```typescript
const isPredictionResult = (obj: unknown): obj is PredictionResult => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'homeWinProbability' in obj
  );
};
```

### React Components

#### Functional Components with Hooks
```typescript
// Good
const Dashboard: React.FC<DashboardProps> = ({ onSelectMatch, filter }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches().then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, [filter]);

  if (loading) return <MatchSkeleton />;

  return <MatchList matches={matches} onSelectMatch={onSelectMatch} />;
};

// Bad - Avoid class components
class Dashboard extends React.Component {
  // ...
}
```

#### Props Interfaces
```typescript
interface DashboardProps {
  onSelectMatch: (match: Match) => void;
  filter: SportFilter;
  setFilter: (filter: SportFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
```

#### Component Organization
```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Match } from '../types';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component definition
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Event handlers
  const handleClick = () => {
    // ...
  };

  // 7. Derived values
  const filteredData = useMemo(() => {
    // ...
  }, [state]);

  // 8. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 9. Export
export default Component;
```

### Styling

#### Tailwind CSS Classes
```typescript
// Use Tailwind utility classes
<div className="bg-slate-900 text-white p-4 rounded-lg">
  <h2 className="text-2xl font-bold mb-2">Title</h2>
  <p className="text-slate-400">Description</p>
</div>
```

#### Consistent Spacing
```typescript
// Use consistent spacing scale
className="p-4"        // padding: 1rem
className="mb-4"       // margin-bottom: 1rem
className="gap-4"      // gap: 1rem
className="space-y-4"  // margin-top between children
```

#### Responsive Design
```typescript
// Mobile-first approach
className="text-sm md:text-base lg:text-lg"
className="w-full md:w-1/2 lg:w-1/3"
className="p-2 md:p-4 lg:p-6"
```

### Error Handling

#### Service Layer
```typescript
// Always handle errors in services
async predictMatch(match: Match): Promise<PredictionResult> {
  try {
    const response = await this.ai.models.generateContent({ ... });
    return this.parseResponse(response);
  } catch (error) {
    console.error('Prediction failed:', error);
    throw new PredictionError('Failed to generate prediction', error);
  }
}
```

#### Components
```typescript
// Display user-friendly errors
const PredictionView = () => {
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    try {
      setError(null);
      await generatePrediction();
    } catch (err) {
      setError('Unable to generate prediction. Please try again.');
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
```

### Naming Conventions

#### Files and Folders
- Components: PascalCase (`Dashboard.tsx`, `PredictionView.tsx`)
- Services: camelCase (`geminiService.ts`, `historyService.ts`)
- Utils: camelCase (`validation.ts`, `export.ts`)
- Types: camelCase (`api.ts`, `database.ts`)

#### Variables and Functions
```typescript
// camelCase for variables and functions
const matchData = ...;
const handleSubmit = () => { ... };

// PascalCase for components and types
const Dashboard: React.FC = () => { ... };
interface MatchData { ... }
type SportFilter = 'All' | 'Football' | 'NBA';

// UPPER_CASE for constants
const MAX_PREDICTIONS_PER_WEEK = 10;
const DEFAULT_LEAGUE_ID = '4329';
```

---

## Testing Guidelines

### Manual Testing

Before submitting a PR, test:

1. **Authentication Flow**
   - Sign up new user
   - Sign in existing user
   - Sign out
   - Browse mode (unauthenticated)

2. **Feature Permissions**
   - Free tier limits (10 predictions/week)
   - Detailed forecast limits (3 total for free users)
   - Pro features locked for free users

3. **Predictions**
   - Standard prediction generation
   - Detailed forecast generation
   - Backtesting (Pro only)
   - Error handling for API failures

4. **UI/UX**
   - Responsive design (mobile, tablet, desktop)
   - Loading states
   - Error messages
   - Empty states

### Testing with Different Tiers

1. **Free Tier**
   ```typescript
   // In Supabase, set user's subscription_tier to 'free'
   // Test that limits are enforced
   ```

2. **Pro Tier**
   ```typescript
   // In Supabase, set user's subscription_tier to 'pro'
   // Test that all features are accessible
   ```

### Browser Testing

Test in:
- Chrome (primary)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(predictions): add confidence score to detailed forecasts

Fix: Handle null values in match data validation

docs(api): update Gemini API endpoint documentation

refactor(auth): extract sign-in logic to custom hook

fix(subscription): prevent duplicate stripe checkout sessions
```

---

## Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update README if adding features
   - Update API docs if changing services
   - Update ARCHITECTURE.md for structural changes

2. **Run Type Check**
   ```bash
   npx tsc --noEmit
   ```

3. **Test Build**
   ```bash
   npm run build
   ```

4. **Test Locally**
   - Test all user flows
   - Test on different devices
   - Test with different subscription tiers

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] Tested with free tier
- [ ] Tested with pro tier

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Comments added to complex code
- [ ] All tests passing
```

### Review Process

1. **Automated Checks**
   - TypeScript compilation
   - Build success
   - Linting (if configured)

2. **Code Review**
   - At least one maintainer approval required
   - Address all review comments
   - Make requested changes

3. **Merge**
   - Squash and merge to main branch
   - Delete feature branch after merge

---

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing documentation first

---

Happy contributing!

# UI Components Guide: Loading & Empty States

## Overview
This document describes the reusable loading and empty state components added to the ProbablePlay AI application to provide consistent, branded, and accessible user experience patterns across all views.

## Components

### 1. LoadingState (`components/ui/LoadingState.tsx`)

A reusable loading indicator component with two variants:

#### Props
- `icon?: LucideIcon` - Optional icon to display (will animate with pulse effect)
- `title?: string` - Main loading message (default: "Loading...")
- `message?: string` - Optional detailed description
- `size?: 'sm' | 'md' | 'lg'` - Size variant (default: 'md')
- `variant?: 'default' | 'minimal'` - Display style (default: 'default')

#### Usage
```tsx
// Full loading state with context
<LoadingState 
  icon={TrendingUp}
  title="Analyzing Match Data..."
  message="Gemini is researching recent form, checking injury reports, and calculating probabilities."
  size="lg"
/>

// Minimal inline loading
<LoadingState 
  title="Updating..."
  variant="minimal"
/>
```

#### Features
- Emerald-branded spinner animation
- Optional icon with pulse animation
- Responsive sizing (sm/md/lg)
- ARIA live region for screen reader announcements
- Dark theme styled

---

### 2. EmptyState (`components/ui/EmptyState.tsx`)

A component for displaying contextual empty states with optional actions.

#### Props
- `icon: LucideIcon` - Icon to display (required)
- `title: string` - Main message (required)
- `message?: string` - Optional supporting text
- `action?: { label: string; onClick: () => void; icon?: LucideIcon }` - Optional action button
- `size?: 'sm' | 'md' | 'lg'` - Size variant (default: 'md')

#### Usage
```tsx
<EmptyState 
  icon={Calendar}
  title="No fixtures available"
  message="No matches scheduled for today. Try changing the sport filter or refresh to check for updates."
  action={{
    label: "Refresh Fixtures",
    onClick: handleRefresh,
    icon: RefreshCw
  }}
/>
```

#### Features
- Contextual icons and messaging
- Optional call-to-action button
- Responsive sizing
- ARIA live region announcements
- Consistent dark theme styling

---

### 3. SkeletonCard (`components/ui/SkeletonCard.tsx`)

Skeleton loading placeholders that mimic final layouts to reduce layout shift.

#### Props
- `variant?: 'match' | 'prediction' | 'history' | 'stat'` - Layout type (default: 'match')
- `count?: number` - Number of skeletons to render (default: 1)

#### Variants
- **match**: Grid of match cards (3 columns on desktop)
- **prediction**: Full prediction analysis layout with sidebars
- **history**: List of history items
- **stat**: Grid of 3 statistic cards

#### Usage
```tsx
// Loading state for match list
<SkeletonCard variant="match" count={6} />

// Loading state for prediction view
<SkeletonCard variant="prediction" />

// Loading state for history items
<SkeletonCard variant="history" count={5} />

// Loading state for stats
<SkeletonCard variant="stat" count={3} />
```

#### Features
- Mimics final content layout
- Reduces cumulative layout shift (CLS)
- Pulse animation for visual feedback
- Auto-layouts in appropriate grid/flex containers
- ARIA status announcements

---

## Implementation Across Views

### MatchList
**Loading State:**
- Shows skeleton grid of 6 match cards
- Preserves header and refresh button
- Mimics final 3-column grid layout

**Empty State:**
- Contextual icon (Search or Calendar based on filter state)
- Dynamic messaging for search vs. no matches
- Refresh action button

### PredictionView
**Loading State:**
- Full-screen loading with TrendingUp icon
- Contextual message about AI analysis
- Replaces old spinner with branded LoadingState component

**Empty State:**
- Error states handled separately with AlertTriangle icon
- No explicit empty state (always has match context)

### DetailedForecastView
**Loading State:**
- Full-screen loading with Target icon
- Message about scoring analysis
- Branded LoadingState component

**Empty State:**
- Error states handled separately
- No explicit empty state (always has match context)

### HistoryView
**Loading State:**
- Skeleton history item cards
- Preserves comparison/update controls

**Empty State:**
- BarChart3 icon
- Encourages user to generate predictions
- Links functionality across app tabs
- No action button (directed to other tabs)

### BacktestView
**Loading State:**
- Shows when analysis is in progress
- Dynamic progress message
- TrendingUp icon with context about sequential analysis

**Empty State:**
- Database icon when no results yet
- Instructions to run analysis
- Visual placeholder in teams area with Users icon

---

## Accessibility Features

All components include:

1. **ARIA Live Regions**: `role="status"` and `aria-live="polite"` for screen reader announcements
2. **ARIA Labels**: Descriptive labels on interactive elements
3. **Screen Reader Only Text**: `.sr-only` class for additional context
4. **Semantic HTML**: Proper heading hierarchy and button elements
5. **Keyboard Navigation**: All interactive elements are keyboard accessible

---

## Design Consistency

### Color Palette
- **Primary Brand**: Emerald-500 (`#10b981`)
- **Backgrounds**: Slate-800/slate-900 with transparency
- **Borders**: Slate-700 (solid) or slate-800 (subtle)
- **Text**: White for headings, slate-400 for body, slate-600 for hints
- **Icons**: Slate-600 for empty states, emerald-500 for loading

### Spacing
- **Container Padding**: Standard 6 (24px) for cards
- **Vertical Rhythm**: 6 for section spacing, 4 for related items
- **Empty State Padding**: 20 (md), 32 (lg) for vertical centering

### Animation
- **Spinner**: Emerald border with transparent top, 1s rotation
- **Pulse**: Opacity animation on skeleton cards
- **Transitions**: 200-300ms for hover states

---

## Best Practices

1. **Always use skeletons for initial loads** - Better perceived performance
2. **Match skeleton layout to final content** - Reduces layout shift
3. **Provide contextual messages** - Users understand what's happening
4. **Include recovery actions** - Help users resolve empty states
5. **Maintain brand consistency** - Use provided color tokens and icons
6. **Test with screen readers** - Ensure ARIA announcements are clear

---

## Future Enhancements

Potential improvements:
- Stagger animation for skeleton grids
- Progress indicators for multi-step operations
- Toast notifications for background updates
- Inline loading states for partial updates
- Shimmer effect for premium feel

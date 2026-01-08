/**
 * Sports/Bold Design System
 *
 * Vibrant, energetic design system for ProbablePlay AI.
 * Bold colors, strong contrasts, and dynamic gradients.
 */

// ============================================
// Color Palette
// ============================================

export const colors = {
  // Primary - Electric Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary electric blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary - Vibrant Orange
  secondary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Secondary vibrant orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // Accent - Neon Green
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Accent neon green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Success - Emerald Green
  success: {
    light: '#34d399',
    DEFAULT: '#10b981',
    dark: '#059669',
  },

  // Warning - Golden Yellow
  warning: {
    light: '#fbbf24',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },

  // Error - Red
  error: {
    light: '#f87171',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  },

  // Neutral - Slate (dark theme base)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617', // Deepest background
  },
};

// ============================================
// Gradients
// ============================================

export const gradients = {
  // Primary brand gradient
  primary: 'from-blue-500 to-cyan-500',

  // Action gradient (CTA buttons)
  action: 'from-orange-500 to-red-500',

  // Success gradient
  success: 'from-emerald-500 to-teal-500',

  // Pro badge gradient
  pro: 'from-orange-500 to-red-500',

  // Subtle gradients
  subtle: 'from-slate-800 to-slate-900',
  card: 'from-slate-800/50 to-slate-900/50',

  // Vibrant gradients for highlights
  vibrant: 'from-blue-500 via-purple-500 to-pink-500',
  warm: 'from-orange-500 via-red-500 to-pink-500',
  cool: 'from-cyan-500 via-blue-500 to-indigo-500',
};

// ============================================
// Spacing Scale
// ============================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

// ============================================
// Border Radius
// ============================================

export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// ============================================
// Typography
// ============================================

export const typography = {
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// ============================================
// Shadows
// ============================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Colored shadows for depth
  glow: {
    blue: '0 0 20px rgb(59 130 246 / 0.3)',
    orange: '0 0 20px rgb(249 115 22 / 0.3)',
    green: '0 0 20px rgb(34 197 94 / 0.3)',
  },
};

// ============================================
// Animation Durations
// ============================================

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
};

export const easings = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// ============================================
// Z-Index Scale
// ============================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ============================================
// Breakpoints (for reference)
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// Component-Specific Styles
// ============================================

export const components = {
  // Button styles
  button: {
    base: 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none',
    sizes: {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    },
    variants: {
      primary: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 focus:ring-blue-500',
      secondary: 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 focus:ring-orange-500',
      ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
      outline: 'border-2 border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white',
    },
  },

  // Card styles
  card: {
    base: 'bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm',
    hover: 'hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-200',
  },

  // Input styles
  input: {
    base: 'w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
    error: 'border-red-500 focus:ring-red-500',
  },

  // Badge styles
  badge: {
    base: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
    variants: {
      success: 'bg-green-500/20 text-green-400',
      warning: 'bg-yellow-500/20 text-yellow-400',
      error: 'bg-red-500/20 text-red-400',
      info: 'bg-blue-500/20 text-blue-400',
      pro: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400',
    },
  },
};

// ============================================
// CSS Variables String
// ============================================

export const cssVariables = `
  :root {
    /* Colors */
    --color-primary: ${colors.primary[500]};
    --color-secondary: ${colors.secondary[500]};
    --color-accent: ${colors.accent[500]};
    --color-success: ${colors.success.DEFAULT};
    --color-warning: ${colors.warning.DEFAULT};
    --color-error: ${colors.error.DEFAULT};

    /* Background */
    --bg-primary: ${colors.slate[950]};
    --bg-secondary: ${colors.slate[900]};
    --bg-tertiary: ${colors.slate[800]};

    /* Text */
    --text-primary: #ffffff;
    --text-secondary: ${colors.slate[400]};
    --text-muted: ${colors.slate[500]};

    /* Border */
    --border-color: ${colors.slate[700]};
    --border-color-hover: ${colors.slate[600]};

    /* Spacing */
    --spacing-xs: ${spacing.xs};
    --spacing-sm: ${spacing.sm};
    --spacing-md: ${spacing.md};
    --spacing-lg: ${spacing.lg};
    --spacing-xl: ${spacing.xl};

    /* Radius */
    --radius-sm: ${borderRadius.sm};
    --radius-md: ${borderRadius.md};
    --radius-lg: ${borderRadius.lg};
    --radius-xl: ${borderRadius.xl};
    --radius-2xl: ${borderRadius['2xl]};

    /* Transitions */
    --transition-fast: ${transitions.fast};
    --transition-base: ${transitions.base};
    --transition-slow: ${transitions.slow};
  }
`;

export default {
  colors,
  gradients,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  easings,
  zIndex,
  breakpoints,
  components,
  cssVariables,
};

// Design Tokens - Centralized color system, spacing, typography
// This file contains all reusable design constants

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const COLORS = {
  // Primary Colors
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100', 
    200: 'bg-blue-200',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
    900: 'bg-blue-900',
  },
  
  // Status Colors
  status: {
    planned: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    inProgress: {
      bg: 'bg-amber-50',
      text: 'text-amber-700', 
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    done: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200', 
      dot: 'bg-green-500',
    },
    skipped: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  },
  
  // Priority Colors
  priority: {
    must: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    should: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200', 
      dot: 'bg-orange-500',
    },
    want: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
  },
  
  // Neutral Colors
  neutral: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    300: 'bg-slate-300',
    400: 'bg-slate-400',
    500: 'bg-slate-500',
    600: 'bg-slate-600',
    700: 'bg-slate-700',
    800: 'bg-slate-800',
    900: 'bg-slate-900',
  },
  
  // Semantic Colors
  semantic: {
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    warning: {
      bg: 'bg-yellow-50', 
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    },
    error: {
      bg: 'bg-red-50',
      text: 'text-red-700', 
      border: 'border-red-200',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const SPACING = {
  xs: 'p-1',
  sm: 'p-2', 
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
  '2xl': 'p-8',
  
  // Padding X
  px: {
    xs: 'px-1',
    sm: 'px-2',
    md: 'px-3', 
    lg: 'px-4',
    xl: 'px-6',
  },
  
  // Padding Y
  py: {
    xs: 'py-1',
    sm: 'py-2',
    md: 'py-3',
    lg: 'py-4', 
    xl: 'py-6',
  },
  
  // Margin
  m: {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-3',
    lg: 'm-4',
    xl: 'm-6',
  },
  
  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-2', 
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const TYPOGRAPHY = {
  // Font Sizes
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },
  
  // Font Weights
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  
  // Line Heights
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// ============================================================================
// SHADOW SYSTEM
// ============================================================================

export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;

// ============================================================================
// TRANSITION SYSTEM
// ============================================================================

export const TRANSITIONS = {
  none: 'transition-none',
  all: 'transition-all',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  transform: 'transition-transform',
  
  // Durations
  duration: {
    75: 'duration-75',
    100: 'duration-100',
    150: 'duration-150',
    200: 'duration-200',
    300: 'duration-300',
    500: 'duration-500',
  },
  
  // Easing
  ease: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
} as const;

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const COMPONENT_STYLES = {
  // Button Base
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  },
  
  // Input Base
  input: {
    base: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-50',
  },
  
  // Card Base
  card: {
    base: 'bg-white rounded-lg border border-slate-200 shadow-sm',
    hover: 'hover:shadow-md transition-shadow',
  },
  
  // Badge Base
  badge: {
    base: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
  },
} as const;


// Theme System - Centralized theme management and utilities
// This file contains theme-related utilities and configurations

import { COLORS, COMPONENT_STYLES } from './design-tokens';

// ============================================================================
// THEME TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red';

// ============================================================================
// THEME CONFIGURATIONS
// ============================================================================

export const THEMES = {
  light: {
    background: 'bg-white',
    surface: 'bg-slate-50',
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      muted: 'text-slate-500',
    },
    border: 'border-slate-200',
    shadow: 'shadow-sm',
  },
  dark: {
    background: 'bg-slate-900',
    surface: 'bg-slate-800',
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      muted: 'text-slate-400',
    },
    border: 'border-slate-700',
    shadow: 'shadow-lg',
  },
} as const;

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const COLOR_SCHEMES: Record<ColorScheme, {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}> = {
  blue: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    accent: 'bg-blue-500',
    background: 'bg-blue-50',
    surface: 'bg-white',
  },
  green: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    accent: 'bg-green-500',
    background: 'bg-green-50',
    surface: 'bg-white',
  },
  purple: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    accent: 'bg-purple-500',
    background: 'bg-purple-50',
    surface: 'bg-white',
  },
  orange: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-100',
    accent: 'bg-orange-500',
    background: 'bg-orange-50',
    surface: 'bg-white',
  },
  red: {
    primary: 'bg-red-600',
    secondary: 'bg-red-100',
    accent: 'bg-red-500',
    background: 'bg-red-50',
    surface: 'bg-white',
  },
} as const;

// ============================================================================
// COMPONENT THEMES
// ============================================================================

export const COMPONENT_THEMES = {
  // Button Themes
  button: {
    primary: {
      light: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      dark: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400',
    },
    secondary: {
      light: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500',
      dark: 'bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-400',
    },
    ghost: {
      light: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
      dark: 'text-slate-300 hover:bg-slate-700 focus:ring-slate-400',
    },
    danger: {
      light: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      dark: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    },
  },
  
  // Input Themes
  input: {
    light: 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500',
    dark: 'bg-slate-800 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400',
  },
  
  // Card Themes
  card: {
    light: 'bg-white border-slate-200 shadow-sm',
    dark: 'bg-slate-800 border-slate-700 shadow-lg',
  },
  
  // Badge Themes
  badge: {
    light: 'border-slate-200',
    dark: 'border-slate-600',
  },
} as const;

// ============================================================================
// STATUS THEMES
// ============================================================================

export const STATUS_THEMES = {
  planned: {
    light: {
      bg: COLORS.status.planned.bg,
      text: COLORS.status.planned.text,
      border: COLORS.status.planned.border,
      dot: COLORS.status.planned.dot,
    },
    dark: {
      bg: 'bg-blue-900/20',
      text: 'text-blue-300',
      border: 'border-blue-700',
      dot: 'bg-blue-400',
    },
  },
  inProgress: {
    light: {
      bg: COLORS.status.inProgress.bg,
      text: COLORS.status.inProgress.text,
      border: COLORS.status.inProgress.border,
      dot: COLORS.status.inProgress.dot,
    },
    dark: {
      bg: 'bg-amber-900/20',
      text: 'text-amber-300',
      border: 'border-amber-700',
      dot: 'bg-amber-400',
    },
  },
  done: {
    light: {
      bg: COLORS.status.done.bg,
      text: COLORS.status.done.text,
      border: COLORS.status.done.border,
      dot: COLORS.status.done.dot,
    },
    dark: {
      bg: 'bg-green-900/20',
      text: 'text-green-300',
      border: 'border-green-700',
      dot: 'bg-green-400',
    },
  },
  skipped: {
    light: {
      bg: COLORS.status.skipped.bg,
      text: COLORS.status.skipped.text,
      border: COLORS.status.skipped.border,
      dot: COLORS.status.skipped.dot,
    },
    dark: {
      bg: 'bg-slate-800/50',
      text: 'text-slate-400',
      border: 'border-slate-600',
      dot: 'bg-slate-500',
    },
  },
} as const;

// ============================================================================
// PRIORITY THEMES
// ============================================================================

export const PRIORITY_THEMES = {
  must: {
    light: {
      bg: COLORS.priority.must.bg,
      text: COLORS.priority.must.text,
      border: COLORS.priority.must.border,
      dot: COLORS.priority.must.dot,
    },
    dark: {
      bg: 'bg-red-900/20',
      text: 'text-red-300',
      border: 'border-red-700',
      dot: 'bg-red-400',
    },
  },
  should: {
    light: {
      bg: COLORS.priority.should.bg,
      text: COLORS.priority.should.text,
      border: COLORS.priority.should.border,
      dot: COLORS.priority.should.dot,
    },
    dark: {
      bg: 'bg-orange-900/20',
      text: 'text-orange-300',
      border: 'border-orange-700',
      dot: 'bg-orange-400',
    },
  },
  want: {
    light: {
      bg: COLORS.priority.want.bg,
      text: COLORS.priority.want.text,
      border: COLORS.priority.want.border,
      dot: COLORS.priority.want.dot,
    },
    dark: {
      bg: 'bg-slate-800/50',
      text: 'text-slate-300',
      border: 'border-slate-600',
      dot: 'bg-slate-400',
    },
  },
} as const;

// ============================================================================
// THEME UTILITIES
// ============================================================================

export function getThemeClasses(mode: ThemeMode, component: keyof typeof COMPONENT_THEMES, variant?: string) {
  const theme = COMPONENT_THEMES[component];
  if (variant && variant in theme) {
    return theme[variant as keyof typeof theme][mode];
  }
  return theme[mode];
}

export function getStatusTheme(status: keyof typeof STATUS_THEMES, mode: ThemeMode) {
  return STATUS_THEMES[status][mode];
}

export function getPriorityTheme(priority: keyof typeof PRIORITY_THEMES, mode: ThemeMode) {
  return PRIORITY_THEMES[priority][mode];
}

export function getColorScheme(scheme: ColorScheme) {
  return COLOR_SCHEMES[scheme];
}

// ============================================================================
// THEME CONTEXT TYPES
// ============================================================================

export interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  toggleMode: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

// ============================================================================
// DEFAULT THEME
// ============================================================================

export const DEFAULT_THEME = {
  mode: 'light' as ThemeMode,
  colorScheme: 'blue' as ColorScheme,
} as const;


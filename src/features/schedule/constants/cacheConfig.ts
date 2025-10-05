/**
 * Cache configuration constants for React Query
 * 
 * These values control how long data is considered fresh and how long
 * it's kept in memory after becoming unused.
 */
export const CACHE_CONFIG = {
  /** Time in ms before cached data is considered stale and needs refetching */
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  /** Time in ms before unused data is garbage collected from cache */
  GC_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Timer interval constants for countdown functionality
 * 
 * Controls the frequency of timer updates and countdown precision.
 */
export const TIMER_INTERVALS = {
  /** Countdown tick interval in milliseconds (1 second) */
  COUNTDOWN_TICK_MS: 1000,
  /** Animation delay for smooth transitions */
  ANIMATION_DELAY_MS: 10,
  /** Debounce delay for auto-starting next session */
  SESSION_TRANSITION_DELAY_MS: 1000,
  /** Delay before closing timer UI */
  CLOSE_TIMER_DELAY_MS: 300,
  /** Delay before focusing quick add input */
  FOCUS_INPUT_DELAY_MS: 40,
} as const;

/**
 * Entity prefix constants for building unique keys
 * 
 * Used to create composite keys that uniquely identify different entity types
 * when deduplicating items or building lookup maps.
 */
export const ENTITY_PREFIXES = {
  /** Prefix for work item entities */
  WORK_ITEM: 'work',
  /** Prefix for checklist item entities */
  CHECKLIST: 'check',
  /** Prefix for task entities */
  TASK: 'task',
} as const;

/**
 * Default values for focus sessions and timer configuration
 * 
 * These values are used when no specific duration is provided
 * or as fallback values in various timer calculations.
 */
export const DEFAULT_VALUES = {
  /** Default focus session duration in minutes */
  FOCUS_DURATION_MINUTES: 25,
  /** Default short break duration in minutes */
  SHORT_BREAK_MINUTES: 5,
  /** Default long break duration in minutes */
  LONG_BREAK_MINUTES: 15,
  /** Number of focus sessions before a long break */
  SESSIONS_BEFORE_LONG_BREAK: 4,
  /** Default priority value for new tasks */
  DEFAULT_PRIORITY: 2,
  /** Minimum widget distance from viewport edges (pixels) */
  WIDGET_EDGE_MARGIN: 20,
  /** Floating widget width (pixels) */
  WIDGET_WIDTH: 200,
  /** Floating widget height (pixels) */
  WIDGET_HEIGHT: 150,
  /** Debug mode focus duration in seconds */
  DEBUG_FOCUS_SECONDS: 10,
  /** Debug mode break duration in seconds */
  DEBUG_BREAK_SECONDS: 5,
} as const;

/**
 * Status priority scores for conflict resolution
 * 
 * Higher scores indicate higher priority when selecting the best
 * item version during deduplication. Used in shouldPreferWorkItem logic.
 * 
 * Priority order: IN_PROGRESS > PLANNED > DONE > SKIPPED
 * Rationale: Current work is most important, then scheduled work,
 * then completed work, and finally skipped items.
 */
export const STATUS_PRIORITY_SCORE = {
  /** In progress items - highest priority (currently being worked on) */
  IN_PROGRESS: 3,
  /** Planned items - medium priority (scheduled to work on) */
  PLANNED: 2,
  /** Done items - low priority (already completed) */
  DONE: 1,
  /** Skipped items - lowest priority (explicitly skipped) */
  SKIPPED: 0,
} as const;

/**
 * Pagination default values for API queries
 * 
 * These values are used consistently across all data fetching hooks
 * to ensure uniform pagination behavior throughout the application.
 */
export const PAGINATION = {
  /** Default starting page number (1-indexed) */
  DEFAULT_PAGE: 1,
  /** Default page size for fetching multiple items */
  DEFAULT_PAGE_SIZE: 100,
} as const;


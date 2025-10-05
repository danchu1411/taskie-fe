/**
 * Schedule feature constants
 * Contains focus duration configurations and helper functions
 */

import { DEFAULT_VALUES } from "./constants/cacheConfig";

/**
 * Helper function to check if a duration would result in focus sessions < 20 minutes
 * Uses the same logic as the session planning algorithm
 */
function isValidSessionDuration(totalMinutes: number): boolean {
  const OPTIMAL_FOCUS = DEFAULT_VALUES.FOCUS_DURATION_MINUTES; // 25
  const SHORT_BREAK = DEFAULT_VALUES.SHORT_BREAK_MINUTES; // 5
  const LONG_BREAK = DEFAULT_VALUES.LONG_BREAK_MINUTES; // 15
  const SESSIONS_BEFORE_LONG = DEFAULT_VALUES.SESSIONS_BEFORE_LONG_BREAK; // 4
  const MIN_ACCEPTABLE_FOCUS = 20; // Minimum focus session duration to keep option
  
  // Very short durations are always valid (single session)
  if (totalMinutes <= MIN_ACCEPTABLE_FOCUS) {
    return true;
  }
  
  // Calculate optimal number of focus sessions
  const numFocusSessions = Math.max(1, Math.round(totalMinutes / (OPTIMAL_FOCUS + SHORT_BREAK)));
  
  // If only 1 session, always valid
  if (numFocusSessions === 1) {
    return true;
  }
  
  // Calculate breaks needed
  const numShortBreaks = Math.max(0, numFocusSessions - 1 - Math.floor((numFocusSessions - 1) / SESSIONS_BEFORE_LONG));
  const numLongBreaks = Math.max(0, Math.floor((numFocusSessions - 1) / SESSIONS_BEFORE_LONG));
  const totalBreakTime = numShortBreaks * SHORT_BREAK + numLongBreaks * LONG_BREAK;
  
  // Calculate focus time available
  const totalFocusTime = totalMinutes - totalBreakTime;
  
  // Check if we have enough time for minimum focus sessions
  if (totalFocusTime < MIN_ACCEPTABLE_FOCUS * numFocusSessions) {
    return false; // Would result in sessions < 20 minutes
  }
  
  // Calculate average focus session duration
  const avgFocusTime = Math.floor(totalFocusTime / numFocusSessions);
  
  // Only allow if average focus session is >= 20 minutes
  return avgFocusTime >= MIN_ACCEPTABLE_FOCUS;
}

/**
 * Allowed focus durations in minutes
 * Generated from 5 to 240 minutes with step 5
 * Excludes durations that would result in focus sessions < 20 minutes when split evenly
 * Example: 35 minutes → [15, break, 15] → excluded because 15 < 20
 * Note: 0.33 minutes = 20 seconds (debug mode)
 */
export const ALLOWED_FOCUS_DURATIONS = [
  0.33, // Debug mode: ~20 seconds
  ...Array.from(
    { length: (240 - 5) / 5 + 1 }, 
    (_, i) => 5 + i * 5
  ).filter(duration => isValidSessionDuration(duration))
];

/**
 * Type for allowed focus durations
 */
export type AllowedFocusDuration = typeof ALLOWED_FOCUS_DURATIONS[number];

/**
 * Get the nearest allowed duration to the given minutes
 * If the exact duration is not allowed, returns the closest one
 * 
 * @param minutes - The desired duration in minutes
 * @returns The nearest allowed duration
 */
export function getNearestDuration(minutes: number): AllowedFocusDuration {
  if (minutes <= 0) {
    return ALLOWED_FOCUS_DURATIONS[0]; // Return shortest duration for invalid input
  }

  // Find the closest duration
  let closest = ALLOWED_FOCUS_DURATIONS[0];
  let minDifference = Math.abs(minutes - closest);

  for (const duration of ALLOWED_FOCUS_DURATIONS) {
    const difference = Math.abs(minutes - duration);
    if (difference < minDifference) {
      minDifference = difference;
      closest = duration;
    }
  }

  return closest;
}

/**
 * Get the next duration in the sequence
 * 
 * @param current - Current duration in minutes
 * @param direction - Direction to move ('up' or 'down')
 * @returns The next duration in the sequence
 */
export function getNextDuration(
  current: number, 
  direction: 'up' | 'down'
): AllowedFocusDuration {
  const currentIndex = ALLOWED_FOCUS_DURATIONS.indexOf(current as AllowedFocusDuration);
  
  if (currentIndex === -1) {
    // Current duration is not in the allowed list, return the nearest one
    return getNearestDuration(current);
  }

  if (direction === 'up') {
    // Move to next duration, stay at max if already at end
    const nextIndex = currentIndex + 1;
    if (nextIndex >= ALLOWED_FOCUS_DURATIONS.length) {
      return ALLOWED_FOCUS_DURATIONS[currentIndex]; // Stay at current
    }
    return ALLOWED_FOCUS_DURATIONS[nextIndex];
  } else {
    // Move to previous duration, stay at min if already at beginning
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      return ALLOWED_FOCUS_DURATIONS[currentIndex]; // Stay at current
    }
    return ALLOWED_FOCUS_DURATIONS[prevIndex];
  }
}

/**
 * Check if a duration is allowed
 * 
 * @param minutes - Duration to check
 * @returns True if the duration is in the allowed list
 */
export function isAllowedDuration(minutes: number): boolean {
  return ALLOWED_FOCUS_DURATIONS.includes(minutes as AllowedFocusDuration);
}

/**
 * Get duration display name with description
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string with duration and description
 */
export function getDurationDisplayName(minutes: number): string {
  // Special cases for common durations
  const specialCases: Record<number, string> = {
    0.33: '20 sec - 🐛 DEBUG MODE',
    5: '5 min - Quick focus',
    10: '10 min - Short focus',
    15: '15 min - Brief session',
    20: '20 min - Medium focus',
    25: '25 min - Standard Pomodoro',
    30: '30 min - Extended focus',
    45: '45 min - Long session',
    60: '60 min - 1 hour',
    90: '90 min - 1.5 hours',
    120: '120 min - 2 hours',
    180: '180 min - 3 hours',
    240: '240 min - 4 hours'
  };

  if (specialCases[minutes]) {
    return specialCases[minutes];
  }

  // Generate automatic labels for other durations
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} sec - Debug`;
  } else if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 120) {
    return `${minutes} min - ${(minutes / 60).toFixed(1)} hours`;
  } else {
    return `${minutes} min - ${(minutes / 60).toFixed(1)} hours`;
  }
}

/**
 * Get the default focus duration
 * Returns the standard Pomodoro duration (25 minutes)
 */
export function getDefaultFocusDuration(): AllowedFocusDuration {
  return DEFAULT_VALUES.FOCUS_DURATION_MINUTES;
}

/**
 * Get focus duration options for UI components
 * Returns array of objects with value and label
 */
export function getFocusDurationOptions(): Array<{ value: number; label: string }> {
  return ALLOWED_FOCUS_DURATIONS.map(duration => ({
    value: duration,
    label: getDurationDisplayName(duration)
  }));
}

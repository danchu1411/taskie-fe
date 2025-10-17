/**
 * Focus time formatting utilities
 * Provides user-friendly display of focus time in minutes/hours
 */

/**
 * Format focus time in a user-friendly way
 * @param totalMinutes - Total focus time in minutes
 * @returns Formatted string (e.g., "25 min", "1h 30m", "2.5h")
 */
export function formatFocusTime(totalMinutes: number): string {
  if (totalMinutes === 0) {
    return '0 min';
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  // Show as decimal for cleaner display (e.g., 1.5h instead of 1h 30m)
  if (minutes === 30) {
    return `${hours + 0.5}h`;
  }

  // For other cases, show hours and minutes
  return `${hours}h ${minutes}m`;
}

/**
 * Get focus time display value and unit separately
 * @param totalMinutes - Total focus time in minutes
 * @returns Object with value and unit
 */
export function getFocusTimeDisplay(totalMinutes: number): { value: number; unit: string; formatted: string } {
  if (totalMinutes === 0) {
    return { value: 0, unit: 'min', formatted: '0 min' };
  }

  if (totalMinutes < 60) {
    return { value: totalMinutes, unit: 'min', formatted: `${totalMinutes} min` };
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return { value: hours, unit: 'h', formatted: `${hours}h` };
  }

  if (minutes === 30) {
    return { value: hours + 0.5, unit: 'h', formatted: `${hours + 0.5}h` };
  }

  return { value: hours, unit: 'h', formatted: `${hours}h ${minutes}m` };
}

/**
 * Check if focus time reached a milestone
 * @param totalMinutes - Total focus time in minutes
 * @returns Milestone info if reached
 */
export function getFocusTimeMilestone(totalMinutes: number): { milestone: string; achieved: boolean } | null {
  const milestones = [
    { minutes: 60, label: '1 hour' },
    { minutes: 120, label: '2 hours' },
    { minutes: 300, label: '5 hours' },
    { minutes: 600, label: '10 hours' },
    { minutes: 1200, label: '20 hours' },
  ];

  for (const milestone of milestones) {
    if (totalMinutes >= milestone.minutes && totalMinutes < milestone.minutes + 25) {
      return { milestone: milestone.label, achieved: true };
    }
  }

  return null;
}


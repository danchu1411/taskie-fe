/**
 * Date utilities for UTC-safe date comparisons
 * Used for streak calculation to ensure timezone independence
 */

/**
 * Check if two dates are the same day in UTC
 * @param dateStr - ISO date string from backend (e.g., "2025-01-16T00:00:00.000Z")
 * @param date - JavaScript Date object
 * @returns true if both dates represent the same UTC day
 */
export function isSameDay(dateStr: string, date: Date): boolean {
  if (!dateStr || !date) return false;
  
  try {
    // Extract date part from ISO string (YYYY-MM-DD)
    const dateFromStr = dateStr.split('T')[0];
    
    // Get UTC date part from Date object
    const dateFromDate = date.toISOString().split('T')[0];
    
    return dateFromStr === dateFromDate;
  } catch (error) {
    console.warn('Error comparing dates:', error);
    return false;
  }
}

/**
 * Get today's date in UTC ISO format
 * @returns ISO string for today (e.g., "2025-01-16T00:00:00.000Z")
 */
export function getTodayUTC(): string {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Check if a given date string represents today in UTC
 * @param dateStr - ISO date string
 * @returns true if the date is today
 */
export function isToday(dateStr: string): boolean {
  return isSameDay(dateStr, new Date());
}

/**
 * Get yesterday's date in UTC ISO format
 * @returns ISO string for yesterday
 */
export function getYesterdayUTC(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Format date for display (local timezone)
 * @param dateStr - ISO date string
 * @returns formatted date string
 */
export function formatDateForDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Get number of days between two dates
 * @param dateStr1 - First ISO date string
 * @param dateStr2 - Second ISO date string
 * @returns number of days difference
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  try {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.warn('Error calculating days difference:', error);
    return 0;
  }
}

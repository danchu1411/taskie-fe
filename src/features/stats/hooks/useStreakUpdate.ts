import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { STATS_QUERY_KEY } from './useStatsData';
import { isSameDay, getTodayUTC } from '../../../lib/date-utils';
import type { StatsOverview } from '../../../lib/types';

interface UseStreakUpdateReturn {
  checkAndUpdateStreak: () => boolean;
  isFirstActivityToday: () => boolean;
}

/**
 * Custom hook for optimistic streak updates
 * Checks if activity is first of the day and updates streak accordingly
 */
export function useStreakUpdate(): UseStreakUpdateReturn {
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(0);
  const DEBOUNCE_MS = 300; // Prevent rapid updates

  /**
   * Check if today is the first activity day
   */
  const isFirstActivityToday = useCallback((): boolean => {
    try {
      const statsData = queryClient.getQueryData([STATS_QUERY_KEY, 'overview']) as StatsOverview | undefined;
      
      if (!statsData?.lastActivityDate) {
        return true; // No previous activity, so this is first
      }

      return !isSameDay(statsData.lastActivityDate, new Date());
    } catch (error) {
      console.warn('Error checking first activity:', error);
      return false;
    }
  }, [queryClient]);

  /**
   * Check and optimistically update streak if this is first activity today
   * @returns true if streak was increased, false otherwise
   */
  const checkAndUpdateStreak = useCallback((): boolean => {
    const now = Date.now();
    
    // Debounce rapid calls
    if (now - lastUpdateRef.current < DEBOUNCE_MS) {
      return false;
    }
    lastUpdateRef.current = now;

    try {
      const statsData = queryClient.getQueryData([STATS_QUERY_KEY, 'overview']) as StatsOverview | undefined;
      
      if (!statsData) {
        console.warn('No stats data available for streak update');
        return false;
      }

      // Check if this is first activity today
      const isFirstToday = isFirstActivityToday();
      
      if (!isFirstToday) {
        return false; // Not first activity today, no streak change
      }

      // Optimistically update streak
      const newStreak = statsData.currentStreak + 1;
      const todayUTC = getTodayUTC();
      
      const updatedStats: StatsOverview = {
        ...statsData,
        currentStreak: newStreak,
        lastActivityDate: todayUTC,
        // Update longest streak if this is a new record
        longestStreak: Math.max(statsData.longestStreak, newStreak)
      };

      // Update React Query cache optimistically
      queryClient.setQueryData([STATS_QUERY_KEY, 'overview'], updatedStats);

      // Always invalidate backend cache to ensure sync
      queryClient.invalidateQueries({ queryKey: [STATS_QUERY_KEY] });

      console.log(`🔥 Streak increased to ${newStreak}! First activity today.`);
      return true;

    } catch (error) {
      console.error('Error updating streak:', error);
      return false;
    }
  }, [queryClient, isFirstActivityToday]);

  return {
    checkAndUpdateStreak,
    isFirstActivityToday
  };
}

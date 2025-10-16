import { useQuery } from '@tanstack/react-query';
import { 
  getStatsOverview, 
  getDailyActivity, 
  getStreakHistory 
} from '../../../lib/api-stats';

export const STATS_QUERY_KEY = 'stats';

export function useStatsOverview() {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'overview'],
    queryFn: getStatsOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDailyActivity(days: number = 30) {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'daily', days],
    queryFn: () => getDailyActivity(days),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useStreakHistory(limit: number = 10) {
  return useQuery({
    queryKey: [STATS_QUERY_KEY, 'streak', limit],
    queryFn: () => getStreakHistory(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

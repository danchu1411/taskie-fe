import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { STATS_QUERY_KEY } from './useStatsData';

export function useStatsInvalidation() {
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const invalidateStats = useCallback(() => {
    const isOnStatsPage = location.pathname === '/stats';
    
    // Always invalidate cache - invalidate all stats queries
    queryClient.invalidateQueries({ queryKey: [STATS_QUERY_KEY] });
    
    // Only refetch if user is on stats page
    if (isOnStatsPage) {
      queryClient.refetchQueries({ queryKey: [STATS_QUERY_KEY] });
    }
  }, [queryClient, location.pathname]);
  
  return { invalidateStats };
}

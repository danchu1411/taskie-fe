import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { CACHE_CONFIG } from '../features/schedule/constants/cacheConfig';

/**
 * Custom hook để tối ưu hóa data fetching với prefetching và background updates
 */
export function useOptimizedQueries() {
  const queryClient = useQueryClient();

  // Prefetch data cho navigation
  const prefetchPageData = useCallback((userId: string | null, page: string) => {
    if (!userId) return;

    switch (page) {
      case 'today':
        queryClient.prefetchQuery({
          queryKey: ['today-tasks', userId],
          staleTime: CACHE_CONFIG.STALE_TIME,
        });
        queryClient.prefetchQuery({
          queryKey: ['schedule', 'entries', userId],
          staleTime: CACHE_CONFIG.STALE_TIME,
        });
        break;
      case 'tasks':
        queryClient.prefetchQuery({
          queryKey: ['tasks', userId, { search: '', status: 'all', priority: 'all', page: 1, pageSize: 20 }],
          staleTime: CACHE_CONFIG.STALE_TIME,
        });
        break;
      case 'planner':
        queryClient.prefetchQuery({
          queryKey: ['schedule', 'entries', userId],
          staleTime: CACHE_CONFIG.STALE_TIME,
        });
        break;
    }
  }, [queryClient]);

  // Background refetch cho critical data
  const enableBackgroundRefetch = useCallback((queryKey: string[]) => {
    queryClient.setQueryDefaults(queryKey, {
      refetchInterval: CACHE_CONFIG.REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    });
  }, [queryClient]);

  // Invalidate và refetch data
  const invalidateAndRefetch = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey, type: 'active' });
  }, [queryClient]);

  // Batch invalidate multiple queries
  const batchInvalidate = useCallback((queryKeys: string[][]) => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient]);

  return {
    prefetchPageData,
    enableBackgroundRefetch,
    invalidateAndRefetch,
    batchInvalidate,
  };
}

/**
 * Hook để tối ưu hóa component re-renders
 */
export function useOptimizedCallbacks<T extends Record<string, (...args: any[]) => any>>(
  callbacks: T
): T {
  return useMemo(() => {
    const optimized: any = {};
    Object.keys(callbacks).forEach(key => {
      optimized[key] = useCallback(callbacks[key], []);
    });
    return optimized;
  }, [callbacks]);
}

/**
 * Hook để debounce state updates
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, setValue, debouncedValue];
}

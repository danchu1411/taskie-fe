import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import api from "../../../lib/api";
import { CACHE_CONFIG } from "../constants/cacheConfig";
import { STATUS } from "./useTodayData";
import type { StatusValue } from "./useTodayData";

/**
 * Base query key for all schedule entries
 * Use this in mutations to invalidate/refetch schedule data
 * 
 * @example
 * ```tsx
 * queryClient.refetchQueries({ queryKey: SCHEDULE_QUERY_KEY, type: "active" });
 * ```
 */
export const SCHEDULE_QUERY_KEY = ["schedule", "entries"] as const;

/**
 * Schedule entry data structure from API
 */
export type ScheduleEntry = {
  id?: string;
  schedule_id?: string;
  work_item_id?: string;
  task_id?: string;
  checklist_item_id?: string;
  start_at: string;
  planned_minutes?: number;
  plannedMinutes?: number;
  status?: number;
  updated_at?: string;
  updatedAt?: string;
  created_at?: string;
  user_id?: string;
};

/**
 * Range specification for schedule queries
 * Can be a preset string or explicit from/to dates
 */
export type ScheduleRange = 
  | { preset: 'today' | 'week' | 'month' | 'upcoming' }
  | { from: Date | string; to: Date | string };

/**
 * Options for schedule data queries
 */
export interface UseScheduleDataOptions {
  /** Filter by schedule entry status */
  status?: StatusValue | StatusValue[];
  /** Page number for pagination (if needed) */
  page?: number;
  /** Page size for pagination (if needed) */
  pageSize?: number;
  /** Sort order */
  order?: 'asc' | 'desc';
  /** Additional React Query options */
  queryOptions?: Omit<UseQueryOptions<ScheduleEntry[], unknown>, 'queryKey' | 'queryFn'>;
}

/**
 * Result from useScheduleData hook
 */
export interface UseScheduleDataResult {
  data: ScheduleEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Converts a range specification to concrete from/to ISO strings
 */
function resolveRange(range: ScheduleRange): { from: string; to: string } {
  if ('preset' in range) {
    const now = new Date();
    
    switch (range.preset) {
      case 'today': {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        return {
          from: startOfToday.toISOString(),
          to: startOfTomorrow.toISOString(),
        };
      }
      case 'week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return {
          from: startOfWeek.toISOString(),
          to: endOfWeek.toISOString(),
        };
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return {
          from: startOfMonth.toISOString(),
          to: endOfMonth.toISOString(),
        };
      }
      case 'upcoming':
      default: {
        // Upcoming: from now to 30 days ahead
        const end = new Date(now);
        end.setDate(now.getDate() + 30);
        return {
          from: now.toISOString(),
          to: end.toISOString(),
        };
      }
    }
  } else {
    // Explicit from/to
    const from = range.from instanceof Date ? range.from.toISOString() : range.from;
    const to = range.to instanceof Date ? range.to.toISOString() : range.to;
    return { from, to };
  }
}

/**
 * Custom hook to fetch schedule entries with flexible range and filtering
 * 
 * @param userId - User ID to fetch schedules for (null disables the query)
 * @param range - Time range specification (preset or explicit from/to)
 * @param options - Additional filtering and query options
 * 
 * @example
 * // Fetch today's planned entries
 * const { data } = useScheduleData(userId, { preset: 'today' });
 * 
 * @example
 * // Fetch custom range with specific status
 * const { data } = useScheduleData(
 *   userId,
 *   { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
 *   { status: STATUS.IN_PROGRESS }
 * );
 */
export function useScheduleData(
  userId: string | null | undefined,
  range: ScheduleRange = { preset: 'today' },
  options: UseScheduleDataOptions = {}
): UseScheduleDataResult {
  const {
    status, // No default - undefined means fetch all statuses
    page,
    pageSize,
    order = 'asc',
    queryOptions = {},
  } = options;

  const { from, to } = resolveRange(range);

  // Build unique query key that includes all parameters
  const queryKey = [
    "schedule",
    "entries",
    userId,
    from,
    to,
    Array.isArray(status) ? status.join(',') : status,
    page,
    pageSize,
    order,
  ].filter(val => val !== undefined);

  const query = useQuery<ScheduleEntry[], unknown>({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("from", from);
      params.append("to", to);
      params.append("order", order);
      
      // Add status filter if specified
      if (status !== undefined) {
        if (Array.isArray(status)) {
          status.forEach(s => params.append("status", String(s)));
        } else {
          params.append("status", String(status));
        }
      }
      
      // Add pagination if specified
      if (page !== undefined) {
        params.append("page", String(page));
      }
      if (pageSize !== undefined) {
        params.append("pageSize", String(pageSize));
      }

      const res = await api.get(`/schedule-entries/upcoming?${params}`);
      const payload = res.data;
      
      // Normalize response format (API may return array or { items: [] })
      if (Array.isArray(payload)) {
        return payload;
      }
      if (payload?.items && Array.isArray(payload.items)) {
        return payload.items;
      }
      return [];
    },
    staleTime: CACHE_CONFIG.STALE_TIME,
    gcTime: CACHE_CONFIG.GC_TIME,
    ...queryOptions,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Helper to get schedule entries for today with planned status
 * Convenience wrapper around useScheduleData
 */
export function useTodaySchedule(userId: string | null | undefined) {
  return useScheduleData(userId, { preset: 'today' }, { status: STATUS.PLANNED });
}

/**
 * Helper to get all upcoming schedule entries
 * Convenience wrapper around useScheduleData
 */
export function useUpcomingSchedule(userId: string | null | undefined) {
  return useScheduleData(userId, { preset: 'upcoming' });
}

/**
 * Hook to get helper functions for invalidating schedule cache
 * Use this in mutations to ensure schedule data refreshes immediately,
 * bypassing the staleTime configuration (5 minutes)
 *
 * @returns Object with cache invalidation helpers
 *
 * @example
 * ```tsx
 * const { refetchScheduleQueries } = useScheduleCacheHelpers();
 * 
 * const updateMutation = useMutation({
 *   mutationFn: updateScheduleEntry,
 *   onSuccess: () => {
 *     // Force immediate refetch, bypasses 5min staleTime
 *     refetchScheduleQueries();
 *   }
 * });
 * ```
 */
export function useScheduleCacheHelpers() {
  const queryClient = useQueryClient();

  /**
   * Force immediate refetch of all active schedule queries
   * Bypasses staleTime - data updates instantly across Today/Planner/Upcoming
   */
  const refetchScheduleQueries = useCallback(() => {
    return queryClient.refetchQueries({ 
      queryKey: SCHEDULE_QUERY_KEY, 
      type: "active" 
    });
  }, [queryClient]);

  /**
   * Mark schedule queries as stale and refetch active ones
   * Less aggressive than refetchScheduleQueries
   */
  const invalidateScheduleQueries = useCallback(() => {
    return queryClient.invalidateQueries({ 
      queryKey: SCHEDULE_QUERY_KEY,
      refetchType: "active"
    });
  }, [queryClient]);

  return {
    /** Force immediate refetch of all active schedule queries */
    refetchScheduleQueries,
    /** Mark schedule queries as stale and refetch active ones */
    invalidateScheduleQueries,
    /** Base query key for schedule entries - use in custom invalidations */
    SCHEDULE_QUERY_KEY,
  };
}


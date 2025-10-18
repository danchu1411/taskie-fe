import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import api from "../../../lib/api";
import type { TaskRecord } from "../../../lib/types";
import { CACHE_CONFIG, PAGINATION } from "../constants/cacheConfig";
import { useScheduleData, type ScheduleEntry } from "./useScheduleData";
import {
  mapTodayItems,
  buildScheduleLookup,
  augmentWithSchedule,
  filterTodayItems,
  findScheduleEntryForItem,
  toDateValue,
} from "../utils/normalizeTodayData";

// Types
export type StatusValue = 0 | 1 | 2 | 3;

export const STATUS = {
  PLANNED: 0 as StatusValue,
  IN_PROGRESS: 1 as StatusValue,
  DONE: 2 as StatusValue,
  SKIPPED: 3 as StatusValue,
} as const;

export type TodayItem = {
  id: string;
  source: "task" | "checklist";
  title: string;
  parentTitle: string | null;
  status: StatusValue;
  priority: 1 | 2 | 3 | null;
  startAt: string | null;
  plannedMinutes: number | null;
  deadline: string | null;
  updatedAt?: number;
  taskId: string | null;
  checklistItemId: string | null;
};

export interface TaskListResponse {
  items: TaskRecord[];
}

export interface TodayDataResult {
  tasksQuery: ReturnType<typeof useQuery<TaskListResponse, unknown>>;
  items: TodayItem[];
  categories: {
    inProgress: TodayItem[];
    planned: TodayItem[];
    completed: TodayItem[];
    doneCount: number;
    progressValue: number;
  };
  findScheduleEntry: (item: TodayItem) => ScheduleEntry | undefined;
}

// Data fetching hook
function useTasksData(userId: string | null) {
  return useQuery<TaskListResponse, unknown>({
    queryKey: ["today-tasks", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      try {
        const response = await api.get<TaskListResponse>("/tasks/by-user/" + userId, {
          params: {
            includeChecklist: true,
            includeWorkItems: true,
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          },
        });
        return response.data;
      } catch (error) {
        if (isAxiosError(error)) {
          throw error;
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: CACHE_CONFIG.STALE_TIME,
    gcTime: CACHE_CONFIG.GC_TIME
  });
}

// Categories hook
function useTaskCategories(items: TodayItem[]) {
  return useMemo(() => {
    const inProgress = items
      .filter((item) => item.status === STATUS.IN_PROGRESS)
      .sort((a, b) => {
        // 1. Sort by priority first (High=1, Medium=2, Low=3, null=4)
        const aPriority = a.priority ?? 4;
        const bPriority = b.priority ?? 4;
        if (aPriority !== bPriority) return aPriority - bPriority;

        // 2. Then by most recently updated (most active first)
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      });

    const planned = items
      .filter((item) => item.status === STATUS.PLANNED)
      .sort((a, b) => {
        // 1. Sort by priority first (High=1, Medium=2, Low=3, null=4)
        const aPriority = a.priority ?? 4;
        const bPriority = b.priority ?? 4;
        if (aPriority !== bPriority) return aPriority - bPriority;

        // 2. Then by deadline (earliest first)
        const aDeadline = toDateValue(a.deadline);
        const bDeadline = toDateValue(b.deadline);
        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline) return -1;
        if (bDeadline) return 1;

        // 3. Then by scheduled time (earliest first)
        const aStart = toDateValue(a.startAt);
        const bStart = toDateValue(b.startAt);
        if (aStart && bStart) return aStart - bStart;
        if (aStart) return -1;
        if (bStart) return 1;

        // 4. Finally by creation time (oldest first - most recent updatedAt last)
        return (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
      });

    const completed = items
      .filter((item) => item.status === STATUS.DONE || item.status === STATUS.SKIPPED)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    const doneCount = items.filter((item) => item.status === STATUS.DONE).length;
    const progressValue = items.length ? Math.round((doneCount / items.length) * 100) : 0;

    return { inProgress, planned, completed, doneCount, progressValue };
  }, [items]);
}

// Main hook
export function useTodayData(userId: string | null): TodayDataResult {
  const tasksQuery = useTasksData(userId);
  
  // Fetch schedule entries for filtering logic
  // Note: Tasks already have schedule info in workItems (from /tasks/by-user response)
  // We fetch schedule-entries mainly to:
  // 1. Know which items are scheduled for other days (to hide from today)
  // 2. Provide fallback schedule info for items without workItems
  // 7 days is sufficient because IN_PROGRESS items show regardless of schedule date
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(startOfToday);
  endDate.setDate(endDate.getDate() + 7); // 7 days ahead (optimized from 30)
  
  const { data: scheduleData } = useScheduleData(
    userId,
    { from: startOfToday, to: endDate }, // 7 days range for filtering
    { order: 'asc' } // Fetch ALL statuses (PLANNED, IN_PROGRESS, DONE, SKIPPED)
  );
  
  const scheduleQuery = {
    data: scheduleData,
  };
  
  const { items, scheduleLookup } = useMemo(() => {
    if (!tasksQuery.data) return { items: [], scheduleLookup: new Map<string, ScheduleEntry>() };
    
    // Step 1: Map tasks to TodayItems
    const mapped = mapTodayItems(tasksQuery.data);
    
    // Step 2: Build schedule lookup (include all statuses, not just PLANNED)
    const scheduleEntries = scheduleQuery.data ?? [];
    const scheduleLookup = buildScheduleLookup(scheduleEntries);
    
    // Step 3: Augment items with schedule data
    const augmentedItems = augmentWithSchedule(mapped, scheduleLookup);
    
    // Step 4: Filter to today's items
    const filteredItems = filterTodayItems(augmentedItems);

    return { items: filteredItems, scheduleLookup };
  }, [tasksQuery.data, scheduleQuery.data]);

  const categories = useTaskCategories(items);

  // Helper function to find schedule entry for a specific item
  const findScheduleEntry = useCallback((item: TodayItem): ScheduleEntry | undefined => {
    return findScheduleEntryForItem(item, scheduleLookup);
  }, [scheduleLookup]);

  return {
    tasksQuery,
    items,
    categories,
    findScheduleEntry,
  };
}

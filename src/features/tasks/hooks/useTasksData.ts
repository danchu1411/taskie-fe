import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../../../lib/api";
import type { TaskListResponse, TaskFilters, TaskRecord } from "../../../lib";
import { STATUS } from "../../../lib";
import { CACHE_CONFIG, PAGINATION } from "../../schedule/constants/cacheConfig";
import { useScheduleData, type ScheduleEntry } from "../../schedule/hooks/useScheduleData";

export interface TasksByStatus {
  planned: TaskRecord[];
  inProgress: TaskRecord[];
  done: TaskRecord[];
  skipped: TaskRecord[];
}

export interface UseTasksDataResult {
  // Query result
  tasksQuery: ReturnType<typeof useQuery<TaskListResponse>>;
  
  // Derived data
  tasksByStatus: TasksByStatus;
  flatList: TaskRecord[];
  
  // Convenience properties
  tasks: TaskRecord[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useTasksData(userId: string | null, filters: TaskFilters): UseTasksDataResult {
  const tasksQuery = useQuery<TaskListResponse>({
    queryKey: ["tasks", userId, filters],
    enabled: Boolean(userId),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append("q", filters.search);
      if (filters.status && filters.status !== 'all') params.append("status", filters.status.toString());
      if (filters.priority && filters.priority !== 'all') params.append("priority", filters.priority.toString());
      params.append("page", (filters.page || PAGINATION.DEFAULT_PAGE).toString());
      params.append("pageSize", (filters.pageSize || 20).toString());
      params.append("includeChecklist", "true");
      params.append("includeWorkItems", "true");

      const response = await api.get<TaskListResponse>(`/tasks/by-user/${userId}?${params}`);
      return response.data;
    },
    staleTime: CACHE_CONFIG.STALE_TIME
  });

  const { data: tasksData } = tasksQuery;

  // Fetch schedule entries (like TodayPage does)
  // This contains the actual schedule data (start_at, planned_minutes)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(startOfToday);
  endDate.setDate(endDate.getDate() + 365); // Fetch all schedules for the next year
  
  const { data: scheduleData } = useScheduleData(
    userId,
    { from: startOfToday, to: endDate },
    { order: 'asc' } // No status filter - get all schedules
  );

  // Merge schedule data from schedule entries (not workItems)
  const mergedTasks = useMemo(() => {
    if (!tasksData?.items) return [];
    if (!scheduleData || scheduleData.length === 0) {
      return tasksData.items;
    }
    
    
    // Build lookup: work_item_id -> schedule entry
    const scheduleLookup = new Map<string, ScheduleEntry>();
    for (const entry of scheduleData) {
      const workId = entry.work_item_id || entry.task_id || entry.checklist_item_id;
      if (workId) {
        scheduleLookup.set(workId.toLowerCase(), entry);
      }
    }
    
    // Merge schedule data into tasks
    return tasksData.items.map(task => {
      // Backend returns 'id' field instead of 'task_id'
      const taskId = task.id || task.task_id;
      const scheduleEntry = taskId ? scheduleLookup.get(taskId.toLowerCase()) : undefined;
      
      if (task.is_atomic && scheduleEntry) {
        return {
          ...task,
          start_at: scheduleEntry.start_at,
          planned_minutes: scheduleEntry.planned_minutes || scheduleEntry.plannedMinutes,
        };
      }
      
      // Merge schedule for checklist items
      const updatedChecklist = task.checklist?.map(item => {
        const itemId = item.id || item.checklist_item_id;
        const itemSchedule = itemId ? scheduleLookup.get(itemId.toLowerCase()) : undefined;
        if (itemSchedule) {
          return {
            ...item,
            start_at: itemSchedule.start_at,
            planned_minutes: itemSchedule.planned_minutes || itemSchedule.plannedMinutes,
          };
        }
        return item;
      });
      
      return {
        ...task,
        checklist: updatedChecklist,
      };
    });
  }, [tasksData?.items, scheduleData]);

  // Filter tasks by derived status for board view
  // Use derived_status (auto-computed for tasks with checklist)
  const tasksByStatus = useMemo((): TasksByStatus => {
    if (!mergedTasks.length) return { planned: [], inProgress: [], done: [], skipped: [] };
    
    return {
      planned: mergedTasks.filter(task => task.derived_status === STATUS.PLANNED),
      inProgress: mergedTasks.filter(task => task.derived_status === STATUS.IN_PROGRESS),
      done: mergedTasks.filter(task => task.derived_status === STATUS.DONE),
      skipped: mergedTasks.filter(task => task.derived_status === STATUS.SKIPPED),
    };
  }, [mergedTasks]);

  // Flat list of all tasks
  const flatList = useMemo(() => {
    return mergedTasks;
  }, [mergedTasks]);

  return {
    tasksQuery,
    tasksByStatus,
    flatList,
    tasks: mergedTasks, // Use mergedTasks instead of raw tasksData to include schedule info
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
  };
}

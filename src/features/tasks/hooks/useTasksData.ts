import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../../../lib/api";
import type { TaskListResponse, TaskFilters, TaskRecord, StatusValue, ChecklistItemRecord } from "../../../lib";
import { STATUS } from "../../../lib";
import { CACHE_CONFIG, PAGINATION } from "../../schedule/constants/cacheConfig";
import { useScheduleData, type ScheduleEntry } from "../../schedule/hooks/useScheduleData";

// Helper function to calculate derived status from checklist items
function calculateDerivedStatus(checklistItems: ChecklistItemRecord[]): StatusValue {
  if (!checklistItems || checklistItems.length === 0) {
    return STATUS.PLANNED; // Default for atomic tasks
  }

  // Count each status
  const counts = {
    inProgress: checklistItems.filter(item => item.status === STATUS.IN_PROGRESS).length,
    planned: checklistItems.filter(item => item.status === STATUS.PLANNED).length,
    done: checklistItems.filter(item => item.status === STATUS.DONE).length,
    skipped: checklistItems.filter(item => item.status === STATUS.SKIPPED).length,
  };

  // Rule 1: Any item IN_PROGRESS → Task IN_PROGRESS
  if (counts.inProgress > 0) {
    return STATUS.IN_PROGRESS;
  }

  // Rule 2: Some DONE + Some PLANNED → Task IN_PROGRESS (partial progress)
  if (counts.done > 0 && counts.planned > 0) {
    return STATUS.IN_PROGRESS;
  }

  // Rule 3: All items DONE → Task DONE
  if (counts.done > 0 && counts.planned === 0 && counts.inProgress === 0) {
    return STATUS.DONE;
  }

  // Rule 4: All items SKIPPED → Task SKIPPED
  if (counts.skipped > 0 && counts.planned === 0 && counts.inProgress === 0 && counts.done === 0) {
    return STATUS.SKIPPED;
  }

  // Rule 5: Default (has PLANNED items) → Task PLANNED
  return STATUS.PLANNED;
}

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
    queryKey: ["tasks", userId], // Remove filters from queryKey - fetch all data
    enabled: Boolean(userId),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Only send pagination params to backend, not filters
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
          derived_status: task.status, // For atomic tasks, derived_status = status
        };
      }
      
      // For atomic tasks without schedule entry, also set derived_status = status
      if (task.is_atomic && !scheduleEntry) {
        return {
          ...task,
          derived_status: task.status, // For atomic tasks, derived_status = status
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
      
      // Calculate derived_status based on task type and checklist
      let derivedStatus: StatusValue;
      if (task.is_atomic) {
        // For atomic tasks, derived_status should equal status
        derivedStatus = task.status;
      } else if (updatedChecklist && updatedChecklist.length > 0) {
        // For tasks with checklist, calculate from checklist items
        derivedStatus = calculateDerivedStatus(updatedChecklist);
      } else {
        // Fallback to existing derived_status or status
        derivedStatus = task.derived_status || task.status;
      }

      return {
        ...task,
        checklist: updatedChecklist,
        derived_status: derivedStatus,
      };
    });
  }, [tasksData?.items, scheduleData]);

  // Apply frontend filters to merged tasks
  const filteredTasks = useMemo(() => {
    if (!mergedTasks.length) return [];
    
    let filtered = mergedTasks;
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.checklist?.some(item => 
          item.title.toLowerCase().includes(searchTerm)
        )
      );
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(task => task.derived_status === filters.status);
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    return filtered;
  }, [mergedTasks, filters]);

  // Filter tasks by derived status for board view
  // Use derived_status (auto-computed for tasks with checklist)
  const tasksByStatus = useMemo((): TasksByStatus => {
    if (!filteredTasks.length) return { planned: [], inProgress: [], done: [], skipped: [] };
    
    return {
      planned: filteredTasks.filter(task => task.derived_status === STATUS.PLANNED),
      inProgress: filteredTasks.filter(task => task.derived_status === STATUS.IN_PROGRESS),
      done: filteredTasks.filter(task => task.derived_status === STATUS.DONE),
      skipped: filteredTasks.filter(task => task.derived_status === STATUS.SKIPPED),
    };
  }, [filteredTasks]);

  // Flat list of all tasks
  const flatList = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  return {
    tasksQuery,
    tasksByStatus,
    flatList,
    tasks: filteredTasks, // Use filteredTasks instead of mergedTasks
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
  };
}

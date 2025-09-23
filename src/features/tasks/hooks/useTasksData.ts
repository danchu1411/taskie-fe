import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../../../lib/api";
import type { TaskListResponse, TaskFilters, TaskRecord } from "../../../lib";
import { STATUS } from "../../../lib";

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
      params.append("page", (filters.page || 1).toString());
      params.append("pageSize", (filters.pageSize || 20).toString());
      params.append("includeChecklist", "true");
      params.append("includeWorkItems", "true");

      const response = await api.get<TaskListResponse>(`/tasks/by-user/${userId}?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: tasksData } = tasksQuery;

  // Filter tasks by status for board view
  const tasksByStatus = useMemo((): TasksByStatus => {
    if (!tasksData?.items) return { planned: [], inProgress: [], done: [], skipped: [] };
    
    return {
      planned: tasksData.items.filter(task => task.status === STATUS.PLANNED),
      inProgress: tasksData.items.filter(task => task.status === STATUS.IN_PROGRESS),
      done: tasksData.items.filter(task => task.status === STATUS.DONE),
      skipped: tasksData.items.filter(task => task.status === STATUS.SKIPPED),
    };
  }, [tasksData?.items]);

  // Flat list of all tasks
  const flatList = useMemo(() => {
    return tasksData?.items || [];
  }, [tasksData?.items]);

  return {
    tasksQuery,
    tasksByStatus,
    flatList,
    tasks: tasksData?.items || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
  };
}

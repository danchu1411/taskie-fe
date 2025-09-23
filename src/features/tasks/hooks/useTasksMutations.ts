import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import api from "../../../lib/api";
import type { 
  TaskRecord, 
  TaskListResponse, 
  StatusValue, 
  ChecklistItemRecord 
} from "../../../lib";
import { STATUS } from "../../../lib";
import { arrayMove } from "@dnd-kit/sortable";

export interface UseTasksMutationsResult {
  // Task mutations
  createTask: (taskData: Partial<TaskRecord>) => void;
  updateTask: (taskId: string, taskData: Partial<TaskRecord>) => void;
  deleteTask: (taskId: string) => void;
  
  // Checklist mutations
  createChecklistItem: (taskId: string, payload: Partial<ChecklistItemRecord>) => void;
  updateChecklistItem: (itemId: string, payload: Partial<ChecklistItemRecord>) => void;
  deleteChecklistItem: (itemId: string) => void;
  reorderChecklistItem: (itemId: string, targetOrder: number) => void;
  
  // Status change
  changeTaskStatus: (task: TaskRecord, newStatus: StatusValue) => void;
  changeChecklistItemStatus: (itemId: string, newStatus: StatusValue) => void;
  
  // Mutation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingChecklist: boolean;
  isDeletingChecklist: boolean;
  isReorderingChecklist: boolean;
}

export function useTasksMutations(userId: string | null): UseTasksMutationsResult {
  const queryClient = useQueryClient();

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<TaskRecord>) => {
      const response = await api.post<TaskRecord>("/tasks/create", taskData);
      return response.data;
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
    onError: (error: any) => {
      console.error("Failed to create task:", error);
    },
  });

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: Partial<TaskRecord> }) => {
      console.log('TasksPage updateTask mutation:', { 
        taskId, 
        taskIdType: typeof taskId,
        taskIdLength: taskId?.length,
        taskData,
        url: `/tasks/${taskId}`
      });
      
      // Validate taskId exists and has correct format
      if (!taskId) {
        throw new Error('Task ID is required for update');
      }
      
      const response = await api.patch<TaskRecord>(`/tasks/${taskId}`, taskData);
      return response.data;
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onMutate: async ({ taskId, taskData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", userId]) as TaskListResponse | undefined;
      
      // Optimistically update to the new value
      queryClient.setQueryData(["tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            // Use same logic as TodayPage to compare taskId - check both id and task_id
            const taskTaskId = (task as any).id || task.task_id;
            return taskTaskId === taskId
              ? { ...task, ...taskData }
              : task;
          })
        };
      });
      
      return { previousTasks };
    },
    onError: (error: any, _variables, context) => {
      console.error('TasksPage updateTask error:', error.response?.data || error);
      // Revert to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", userId], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Validate taskId exists and has correct format
      if (!taskId) {
        throw new Error('Task ID is required for delete');
      }
      // Use official DELETE endpoint per API docs
      await api.delete(`/tasks/${taskId}`);
    },
    onMutate: async (taskId: string) => {
      // Cancel any outgoing refetches for any variant of tasks queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot all variants we might touch
      const snapshots: Array<{ key: any[]; data: TaskListResponse | undefined }> = [];
      queryClient.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] }).forEach(([key, data]) => {
        snapshots.push({ key: key as any[], data });
        // Optimistically update each dataset
        queryClient.setQueryData(key, (old: TaskListResponse | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            // Remove the task locally for better UX (server marks it skipped)
            items: old.items.filter((task: TaskRecord) => {
              const existingId = (task as any).id || task.task_id;
              return existingId !== taskId;
            })
          };
        });
      });

      return { snapshots } as const;
    },
    onError: (error: any, _taskId, context) => {
      console.error("Failed to delete task:", error);
      // Revert all snapshots on error
      if (context?.snapshots) {
        for (const snap of context.snapshots) {
          queryClient.setQueryData(snap.key, snap.data);
        }
      }
    },
    onSuccess: () => {
      // Invalidate all task queries to ensure freshness
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  // Delete Checklist Item Mutation
  const deleteChecklistItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!itemId) {
        throw new Error('Checklist item ID is required for delete');
      }
      await api.delete(`/checklist-items/${itemId}`);
    },
    onMutate: async (itemId: string) => {
      // Cancel any outgoing refetches for any variant of tasks queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot all variants we might touch
      const snapshots: Array<{ key: any[]; data: TaskListResponse | undefined }> = [];
      queryClient.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] }).forEach(([key, data]) => {
        snapshots.push({ key: key as any[], data });
        // Optimistically remove the checklist item from all tasks
        queryClient.setQueryData(key, (old: TaskListResponse | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((task: TaskRecord) => {
              if (!task.checklist || task.checklist.length === 0) return task;
              return {
                ...task,
                checklist: task.checklist.filter(ci => ci.checklist_item_id !== itemId)
              };
            })
          };
        });
      });

      return { snapshots } as const;
    },
    onError: (_error, _itemId, context) => {
      if (context?.snapshots) {
        for (const snap of context.snapshots) {
          queryClient.setQueryData(snap.key, snap.data);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  // Reorder Checklist Item Mutation
  const reorderChecklistItemMutation = useMutation({
    mutationFn: async (payload: { itemId: string; targetOrder: number }) => {
      const { itemId, targetOrder } = payload;
      if (!itemId || !targetOrder || targetOrder < 1) {
        throw new Error('Checklist reorder payload is invalid');
      }
      await api.patch(`/checklist-items/${itemId}`, { order: targetOrder });
    },
    onMutate: async ({ itemId, targetOrder }) => {
      // Cancel any outgoing refetches for any variant of tasks queries
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot all variants we might touch
      const snapshots: Array<{ key: any[]; data: TaskListResponse | undefined }> = [];
      queryClient.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] }).forEach(([key, data]) => {
        snapshots.push({ key: key as any[], data });
        // Optimistically reorder within the task's checklist
        queryClient.setQueryData(key, (old: TaskListResponse | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((task: TaskRecord) => {
              if (!task.checklist || task.checklist.length === 0) return task;
              const fromIndex = task.checklist.findIndex(ci => ci.checklist_item_id === itemId);
              if (fromIndex === -1) return task;
              const toIndex = Math.min(Math.max(targetOrder - 1, 0), task.checklist.length - 1);
              const newChecklist = arrayMove(task.checklist, fromIndex, toIndex).map((ci, idx) => ({
                ...ci,
                order_index: idx + 1,
              }));
              return { ...task, checklist: newChecklist } as TaskRecord;
            })
          };
        });
      });

      return { snapshots } as const;
    },
    onError: (_error, _vars, context) => {
      if (context?.snapshots) {
        for (const snap of context.snapshots) {
          queryClient.setQueryData(snap.key, snap.data);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    }
  });

  // Create Checklist Item Mutation
  const createChecklistItemMutation = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: Partial<ChecklistItemRecord> }) => {
      // API expects bulk payload under "checklist" per docs
      const response = await api.post(`/checklist-items/${taskId}/checklist`, {
        checklist: [
          {
            title: payload.title,
            deadline: payload.deadline ?? null,
            priority: payload.priority ?? null,
            status: payload.status ?? STATUS.PLANNED,
          },
        ],
      });
      return response.data;
    },
    onSuccess: () => {
      // Refresh task data and Today
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  // Update Checklist Item Mutation
  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: string; payload: Partial<ChecklistItemRecord> }) => {
      const body: Record<string, unknown> = {};
      if (payload.title !== undefined) body.title = payload.title;
      if (payload.deadline !== undefined) body.deadline = payload.deadline ?? null;
      if (payload.priority !== undefined) body.priority = payload.priority ?? null;
      if (payload.status !== undefined) body.status = payload.status;
      return api.patch(`/checklist-items/${itemId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  // Handlers
  const createTask = useCallback((taskData: Partial<TaskRecord>) => {
    createTaskMutation.mutate(taskData);
  }, [createTaskMutation]);

  const updateTask = useCallback((taskId: string, taskData: Partial<TaskRecord>) => {
    updateTaskMutation.mutate({ taskId, taskData });
  }, [updateTaskMutation]);

  const deleteTask = useCallback((taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onError: (error: any) => {
        const serverMsg: string | undefined = error?.response?.data?.error || error?.response?.data?.message;
        const isSqlTriggerIssue = typeof serverMsg === 'string' && serverMsg.includes("OUTPUT clause") && serverMsg.includes("Triggers");
        if (isSqlTriggerIssue) {
          // Fallback: mark as skipped instead of hard delete
          updateTaskMutation.mutate({ taskId, taskData: { status: STATUS.SKIPPED } });
        }
      }
    });
  }, [deleteTaskMutation, updateTaskMutation]);

  const createChecklistItem = useCallback((taskId: string, payload: Partial<ChecklistItemRecord>) => {
    createChecklistItemMutation.mutate({ taskId, payload });
  }, [createChecklistItemMutation]);

  const updateChecklistItem = useCallback((itemId: string, payload: Partial<ChecklistItemRecord>) => {
    updateChecklistItemMutation.mutate({ itemId, payload });
  }, [updateChecklistItemMutation]);

  const deleteChecklistItem = useCallback((itemId: string) => {
    deleteChecklistItemMutation.mutate(itemId);
  }, [deleteChecklistItemMutation]);

  const reorderChecklistItem = useCallback((itemId: string, targetOrder: number) => {
    reorderChecklistItemMutation.mutate({ itemId, targetOrder });
  }, [reorderChecklistItemMutation]);

  const changeTaskStatus = useCallback((task: TaskRecord, newStatus: StatusValue) => {
    const taskId = (task as any).id || task.task_id;
    updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const changeChecklistItemStatus = useCallback((itemId: string, newStatus: StatusValue) => {
    updateChecklistItem(itemId, { status: newStatus });
  }, [updateChecklistItem]);

  return {
    // Task mutations
    createTask,
    updateTask,
    deleteTask,
    
    // Checklist mutations
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklistItem,
    
    // Status change
    changeTaskStatus,
    changeChecklistItemStatus,
    
    // Mutation states
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isUpdatingChecklist: updateChecklistItemMutation.isPending,
    isDeletingChecklist: deleteChecklistItemMutation.isPending,
    isReorderingChecklist: reorderChecklistItemMutation.isPending,
  };
}

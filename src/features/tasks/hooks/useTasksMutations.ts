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
import { SCHEDULE_QUERY_KEY } from "../../schedule/hooks/useScheduleData";

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
      // Cancel any outgoing refetches - use partial matching for all task queries
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value - get all task queries
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ["tasks", userId] });
      
      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: ["tasks", userId] }, (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            // Use same logic as TodayPage to compare taskId - check both id and task_id
            const taskTaskId = (task as any).id || task.task_id;
            if (taskTaskId === taskId) {
              // Update task with new data
              const updatedTask = { ...task, ...taskData };
              
              // Calculate derived_status based on task type and checklist
              if (taskData.status !== undefined) {
                if (task.is_atomic) {
                  // For atomic tasks, derived_status should equal status
                  updatedTask.derived_status = taskData.status;
                } else if (task.checklist && task.checklist.length > 0) {
                  // For tasks with checklist, recalculate derived_status from checklist items
                  updatedTask.derived_status = calculateDerivedStatus(task.checklist);
                } else {
                  // Fallback: use the new status as derived_status
                  updatedTask.derived_status = taskData.status;
                }
              }
              
              return updatedTask;
            }
            return task;
          })
        };
      });
      
      return { previousTasksQueries };
    },
    onError: (error: any, _variables, context) => {
      console.error('TasksPage updateTask error:', error.response?.data || error);
      // Revert all previous task queries on error
      if (context?.previousTasksQueries) {
        context.previousTasksQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ["tasks", userId] });
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", userId]) as TaskListResponse | undefined;
      
      // Optimistically remove the task
      queryClient.setQueryData(["tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.filter((task: TaskRecord) => {
            const taskTaskId = (task as any).id || task.task_id;
            return taskTaskId !== taskId;
          })
        };
      });
      
      return { previousTasks };
    },
    onError: (error: any, _variables, context) => {
      console.error('TasksPage deleteTask error:', error);
      // Revert to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", userId], context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Invalidate schedule queries to remove orphaned schedule entries
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });

  // Change Task Status Mutation (for BoardView DnD)
  const changeTaskStatusMutation = useMutation({
    mutationFn: async ({ task, newStatus }: { task: TaskRecord; newStatus: StatusValue }) => {
      const taskId = (task as any).id || task.task_id;
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    },
    onMutate: async ({ task, newStatus }) => {
      const taskId = (task as any).id || task.task_id;
      
      // Cancel any outgoing refetches - use partial matching for all task queries
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value - get all task queries
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ["tasks", userId] });
      
      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: ["tasks", userId] }, (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((t: TaskRecord) => {
            const tTaskId = (t as any).id || t.task_id;
            return tTaskId === taskId
              ? { ...t, status: newStatus, derived_status: newStatus }
              : t;
          })
        };
      });
      
      return { previousTasksQueries };
    },
    onError: (error: any, _variables, context) => {
      console.error('changeTaskStatus error:', error);
      if (context?.previousTasksQueries) {
        // Restore all previous task queries
        context.previousTasksQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      
      // NEW: Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      if (window.location.pathname === '/stats') {
        queryClient.refetchQueries({ queryKey: ['stats'] });
      }
    },
  });

  // Change Checklist Item Status Mutation
  const changeChecklistItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, newStatus }: { itemId: string; newStatus: StatusValue }) => {
      await api.patch(`/checklist-items/${itemId}`, { status: newStatus });
    },
    onMutate: async ({ itemId, newStatus }) => {
      // Cancel any outgoing refetches - use partial matching for all task queries
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value - get all task queries
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ["tasks", userId] });
      
      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: ["tasks", userId] }, (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            if (!task.checklist) return task;
            
            const updatedChecklist = task.checklist.map((item: ChecklistItemRecord) =>
              item.checklist_item_id === itemId
                ? { ...item, status: newStatus }
                : item
            );
            
            // Calculate new derived_status based on updated checklist
            const newDerivedStatus = calculateDerivedStatus(updatedChecklist);
            
            return {
              ...task,
              checklist: updatedChecklist,
              derived_status: newDerivedStatus
            };
          })
        };
      });
      
      return { previousTasksQueries };
    },
    onError: (error: any, _variables, context) => {
      console.error('changeChecklistItemStatus error:', error);
      if (context?.previousTasksQueries) {
        // Restore all previous task queries
        context.previousTasksQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      
      // NEW: Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      if (window.location.pathname === '/stats') {
        queryClient.refetchQueries({ queryKey: ['stats'] });
      }
    },
  });

  // Create Checklist Item Mutation
  const createChecklistItemMutation = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: Partial<ChecklistItemRecord> }) => {
      // Fix: Use correct API endpoint like TodayPage
      const response = await api.post(`/checklist-items/${taskId}/checklist`, { 
        checklist: [payload] 
      });
      return response.data;
    },
    onSuccess: () => {
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
      // ADD SCHEDULE FIELDS
      if (payload.start_at !== undefined) body.start_at = payload.start_at ?? null;
      if (payload.planned_minutes !== undefined) body.planned_minutes = payload.planned_minutes ?? null;
      
      console.log('updateChecklistItem mutation:', { itemId, body });
      return api.patch(`/checklist-items/${itemId}`, body);
    },
    onMutate: async ({ itemId, payload }) => {
      // Cancel any outgoing refetches - use partial matching for all task queries
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value - get all task queries
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ["tasks", userId] });
      
      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: ["tasks", userId] }, (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            if (!task.checklist) return task;
            
            const updatedChecklist = task.checklist.map((item: ChecklistItemRecord) =>
              item.checklist_item_id === itemId
                ? { ...item, ...payload }
                : item
            );
            
            // Calculate new derived_status based on updated checklist
            const newDerivedStatus = calculateDerivedStatus(updatedChecklist);
            
            return {
              ...task,
              checklist: updatedChecklist,
              derived_status: newDerivedStatus
            };
          })
        };
      });
      
      return { previousTasksQueries };
    },
    onError: (error: any, _variables, context) => {
      console.error('updateChecklistItem error:', error);
      if (context?.previousTasksQueries) {
        // Restore all previous task queries
        context.previousTasksQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  // Delete Checklist Item Mutation
  const deleteChecklistItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/checklist-items/${itemId}`);
    },
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches - use partial matching for all task queries
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value - get all task queries
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ["tasks", userId] });
      
      // Optimistically update all task queries
      queryClient.setQueriesData({ queryKey: ["tasks", userId] }, (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            if (!task.checklist) return task;
            
            const updatedChecklist = task.checklist.filter((item: ChecklistItemRecord) =>
              item.checklist_item_id !== itemId
            );
            
            // Calculate new derived_status based on updated checklist
            const newDerivedStatus = calculateDerivedStatus(updatedChecklist);
            
            return {
              ...task,
              checklist: updatedChecklist,
              derived_status: newDerivedStatus
            };
          })
        };
      });
      
      return { previousTasksQueries };
    },
    onError: (error: any, _variables, context) => {
      console.error('deleteChecklistItem error:', error);
      if (context?.previousTasksQueries) {
        // Restore all previous task queries
        context.previousTasksQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Invalidate schedule queries to remove orphaned schedule entries
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });

  // Reorder Checklist Item Mutation
  const reorderChecklistItemMutation = useMutation({
    mutationFn: async ({ itemId, targetOrder }: { itemId: string; targetOrder: number }) => {
      await api.patch(`/checklist-items/${itemId}`, { order_index: targetOrder });
    },
    onMutate: async ({ itemId, targetOrder }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", userId]) as TaskListResponse | undefined;
      
      // Find the task containing this checklist item
      queryClient.setQueryData(["tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            if (!task.checklist) return task;
            
            const itemIndex = task.checklist.findIndex(item => item.checklist_item_id === itemId);
            if (itemIndex === -1) return task;
            
            // Reorder checklist items
            const newChecklist = arrayMove(task.checklist, itemIndex, targetOrder - 1);
            
            // Update order_index for all items
            return {
              ...task,
              checklist: newChecklist.map((item, index) => ({
                ...item,
                order_index: index + 1
              }))
            };
          })
        };
      });
      
      return { previousTasks };
    },
    onError: (error: any, _variables, context) => {
      console.error('reorderChecklistItem error:', error);
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", userId], context.previousTasks);
      }
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
    changeTaskStatusMutation.mutate({ task, newStatus });
  }, [changeTaskStatusMutation]);

  const changeChecklistItemStatus = useCallback((itemId: string, newStatus: StatusValue) => {
    changeChecklistItemStatusMutation.mutate({ itemId, newStatus });
  }, [changeChecklistItemStatusMutation]);

  return {
    createTask,
    updateTask,
    deleteTask,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklistItem,
    changeTaskStatus,
    changeChecklistItemStatus,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isUpdatingChecklist: updateChecklistItemMutation.isPending,
    isDeletingChecklist: deleteChecklistItemMutation.isPending,
    isReorderingChecklist: reorderChecklistItemMutation.isPending,
  };
}

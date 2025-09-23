import React, { useCallback, useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import api from "../../lib/api";
import type { 
  TaskRecord, 
  TaskListResponse, 
  TaskFilters, 
  StatusValue, 
  PriorityValue,
  ChecklistItemRecord
} from "../../lib";
import { STATUS, clsx } from "../../lib";
import { 
  NavigationBar, 
  StatusBadge, 
  PriorityBadge, 
  DueDateBadge, 
  TaskModal, 
  ChecklistItemModal,
  BoardView,
  Button,
  Input,
  SystemError
} from "../../components/ui";


// Task Card Component
function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onStart,
  onAddChecklist,
  onEditChecklistItem,
  onDeleteChecklistItem,
  onChecklistItemStatusChange,
  onChecklistItemReorder,
  isUpdating = false
}: { 
  task: TaskRecord;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onStart?: (task: TaskRecord) => void;
  onAddChecklist?: (task: TaskRecord) => void;
  onEditChecklistItem?: (item: ChecklistItemRecord) => void;
  onDeleteChecklistItem?: (itemId: string) => void;
  onChecklistItemStatusChange?: (itemId: string, newStatus: StatusValue) => void;
  onChecklistItemReorder?: (itemId: string, targetOrder: number) => void;
  isUpdating?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const completedChecklist = task.checklist?.filter(item => item.status === STATUS.DONE).length || 0;
  const totalChecklist = task.checklist?.length || 0;
  
  // Determine if task can be scheduled
  const canSchedule = !hasChecklist;

  // Calculate derived task status based on checklist items
  const derivedTaskStatus = useMemo(() => {
    if (!hasChecklist) return task.status;
    
    const checklist = task.checklist!;
    const statuses = checklist.map(item => item.status);
    
    // If all items are done, task should be done
    if (statuses.every(status => status === STATUS.DONE)) {
      return STATUS.DONE;
    }
    
    // If any item is in progress, task should be in progress
    if (statuses.some(status => status === STATUS.IN_PROGRESS)) {
      return STATUS.IN_PROGRESS;
    }
    
    // If any item is skipped, task should be skipped
    if (statuses.some(status => status === STATUS.SKIPPED)) {
      return STATUS.SKIPPED;
    }
    
    // If all items are planned, task should be planned
    if (statuses.every(status => status === STATUS.PLANNED)) {
      return STATUS.PLANNED;
    }
    
    return task.status;
  }, [task.status, task.checklist, hasChecklist]);

  // Check if task status needs to be updated
  const needsStatusUpdate = derivedTaskStatus !== task.status;

  // DnD for checklist
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const orderedChecklist = useMemo(() => {
    return (task.checklist ?? []).slice().sort((a, b) => a.order_index - b.order_index);
  }, [task.checklist]);

  const handleChecklistDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = orderedChecklist.findIndex(i => i.checklist_item_id === String(active.id));
    const toIndex = orderedChecklist.findIndex(i => i.checklist_item_id === String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    onChecklistItemReorder?.(String(active.id), toIndex + 1);
  }, [orderedChecklist, onChecklistItemReorder]);

  function ChecklistItemRow({ item }: { item: ChecklistItemRecord }) {
    const effectivePriority = item.priority ?? task.priority;
    const effectiveDeadline = item.deadline ?? task.deadline;
    const hasDeadlineConflict = Boolean(item.deadline && task.deadline && new Date(item.deadline) > new Date(task.deadline));

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.checklist_item_id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} key={item.checklist_item_id} className={clsx(
        "group p-3 rounded-lg border transition-all duration-200",
        item.status === STATUS.DONE 
          ? "bg-green-50 border-green-200" 
          : item.status === STATUS.IN_PROGRESS
          ? "bg-amber-50 border-amber-200"
          : item.status === STATUS.SKIPPED
          ? "bg-slate-50 border-slate-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}>
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="flex flex-col items-center gap-1 mt-1" {...listeners} {...attributes}>
            <div className="w-4 h-4 text-slate-400 cursor-move hover:text-slate-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
            </div>
            <span className="text-xs text-slate-400 font-mono">#{item.order_index}</span>
          </div>

          {/* Checkbox */}
          <input 
            type="checkbox"
            checked={item.status === STATUS.DONE}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newStatus = e.target.checked ? STATUS.DONE : STATUS.PLANNED;
              onChecklistItemStatusChange?.(item.checklist_item_id, newStatus);
            }}
            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h5 className={clsx(
                  "text-sm font-medium leading-tight",
                  item.status === STATUS.DONE 
                    ? "line-through text-slate-500" 
                    : "text-slate-900"
                )}>
                  {item.title}
                </h5>
                {/* Effective values with inheritance indicators */}
                <div className="flex items-center gap-2 mt-2">
                  {effectivePriority && (
                    <div className="flex items-center gap-1">
                      <PriorityBadge priority={effectivePriority} />
                      {!item.priority && (
                        <span className="text-xs text-slate-400" title="Inherited from task">
                          (inherited)
                        </span>
                      )}
                    </div>
                  )}

                  {effectiveDeadline && (
                    <div className="flex items-center gap-1">
                      <DueDateBadge deadline={effectiveDeadline} />
                      {!item.deadline && (
                        <span className="text-xs text-slate-400" title="Inherited from task">
                          (inherited)
                        </span>
                      )}
                      {hasDeadlineConflict && (
                        <span className="text-xs text-red-500" title="Deadline conflict with task">
                          ⚠️ conflict
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditChecklistItem?.(item)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteChecklistItem?.(item.checklist_item_id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="group rounded-xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:border-slate-300">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Left: Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Status + Title + Type */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex items-center gap-2">
              <StatusBadge 
                status={task.status} 
                onClick={() => onStatusChange(task)}
                disabled={isUpdating}
              />
              {needsStatusUpdate && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-600 font-medium">
                    →
                  </span>
                  <StatusBadge 
                    status={derivedTaskStatus} 
                    className="opacity-75"
                  />
                  <button
                    onClick={() => {
                      // TODO: Implement auto-update task status
                      console.log('Auto-update task status to:', derivedTaskStatus);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 transition-colors"
                    title="Click to update task status automatically"
                  >
                    Update
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 text-base sm:text-lg leading-tight">
                  {task.title}
                </h3>
                {needsStatusUpdate && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                    Status needs update
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <PriorityBadge priority={task.priority ?? null} />
            <DueDateBadge deadline={task.deadline} />
            
            {/* Scheduled Time */}
            {canSchedule && task.start_at && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                Starts {new Date(task.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

            {/* Planned Duration */}
            {canSchedule && task.planned_minutes && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                {task.planned_minutes}m planned
              </span>
            )}

            {/* Checklist Progress (for container tasks) */}
            {hasChecklist && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                {expanded ? "▼" : "▶"}
                {completedChecklist}/{totalChecklist} subtasks
              </button>
            )}

            {/* Add Checklist */}
            {!hasChecklist && onAddChecklist && (
              <button
                onClick={() => onAddChecklist(task)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
              >
                + Add Checklist
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap gap-2 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            title="Edit"
            aria-label="Edit task"
          >
            Edit
          </button>
            {/* Start button for tasks that can be scheduled */}
          {onStart && canSchedule && (
            <button
              type="button"
              onClick={() => onStart(task)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              title="Start Timer"
              aria-label="Start focus timer"
            >
              Start
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete((task.task_id || (task as any).id))}
            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
            title="Delete"
            aria-label="Delete task"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      {hasChecklist && expanded && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Checklist Items</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {completedChecklist} of {totalChecklist} completed
              </span>
              <div className="w-16 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          
          <DndContext sensors={sensors} onDragEnd={handleChecklistDragEnd}>
            <SortableContext items={orderedChecklist.map(i => i.checklist_item_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
                {orderedChecklist.map((item) => (
                  <ChecklistItemRow key={item.checklist_item_id} item={item} />
                ))}
                      </div>
            </SortableContext>
          </DndContext>
          
          {/* Add new checklist item */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => onAddChecklist?.(task)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add new checklist item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// Custom hooks
function useTasksData(userId: string | null, filters: TaskFilters) {
  return useQuery<TaskListResponse>({
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
}

function useCreateTask(userId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
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
}

function useUpdateTask(userId: string | null, setPendingStatusId: (id: string | null) => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
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
      setPendingStatusId(taskId);
      
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
    onSettled: () => {
      setPendingStatusId(null);
    },
  });
}

function useDeleteTask(userId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
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
}

function useDeleteChecklistItem(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
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
                checklist: task.checklist.filter((ci) => ci.checklist_item_id !== itemId)
              } as TaskRecord;
            })
          };
        });
      });

      return { snapshots } as const;
    },
    onError: (error: any, _itemId, context) => {
      console.error("Failed to delete checklist item:", error);
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
      // Keep Today page in sync as well
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });
}

function useReorderChecklistItem(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
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
}


// Main Tasks Page Component
export default function TasksPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    status: 'all',
    priority: 'all',
    page: 1,
    pageSize: 20,
  });
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTask, setStatusModalTask] = useState<TaskRecord | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  
  // Checklist item modal state
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItemRecord | null>(null);
  const [checklistModalTaskId, setChecklistModalTaskId] = useState<string | null>(null);

  // Data fetching
  const { data: tasksData, isLoading, error, refetch } = useTasksData(user?.id || null, filters);
  
  // Mutations
  const createTaskMutation = useCreateTask(user?.id || null);
  const updateTaskMutation = useUpdateTask(user?.id || null, setPendingStatusId);
  const deleteTaskMutation = useDeleteTask(user?.id || null);

  // Handlers
  const handleCreateTask = useCallback((taskData: Partial<TaskRecord>) => {
    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        setModalOpen(false);
        setEditingTask(null);
      }
    });
  }, [createTaskMutation]);

  const handleUpdateTask = useCallback((taskData: Partial<TaskRecord>, taskId?: string) => {
    const targetTaskId = taskId || (editingTask ? ((editingTask as any).id || editingTask.task_id) : undefined);
    if (targetTaskId) {
      updateTaskMutation.mutate({ taskId: targetTaskId, taskData }, {
        onSuccess: () => {
          setModalOpen(false);
          setEditingTask(null);
        }
      });
    } else {
      console.error('No task ID provided for update');
    }
  }, [editingTask, updateTaskMutation]);

  const handleDeleteTask = useCallback((taskId: string) => {
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


  const openStatusModal = useCallback((task: TaskRecord) => {
    // Use same logic as TodayPage to get taskId - check both id and task_id
    const taskId = (task as any).id || task.task_id;
    
    console.log('TasksPage openStatusModal:', { 
      taskId, 
      taskIdType: typeof taskId,
      taskIdLength: taskId?.length,
      fullTask: task
    });
    setStatusModalTask(task);
    setStatusModalOpen(true);
  }, []);

  const handleStatusModalChange = useCallback((newStatus: StatusValue) => {
    if (!statusModalTask) return;
    
    // Use same logic as TodayPage to get taskId - check both id and task_id
    const taskId = (statusModalTask as any).id || statusModalTask.task_id;
    
    console.log('TasksPage handleStatusModalChange:', { 
      taskId, 
      taskIdType: typeof taskId,
      taskIdLength: taskId?.length,
      newStatus,
      currentStatus: statusModalTask.status,
      fullTask: statusModalTask
    });
    
    if (!taskId) {
      console.error('No taskId found in task:', statusModalTask);
      return;
    }
    
    // Validate taskId format (should be GUID)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(taskId)) {
      console.error('Invalid taskId format:', taskId);
      console.error('TaskId type:', typeof taskId);
      console.error('TaskId length:', taskId?.length);
      return;
    }
    
    handleUpdateTask({ status: newStatus }, taskId);
    setStatusModalOpen(false);
    setStatusModalTask(null);
  }, [statusModalTask, handleUpdateTask]);

  // Direct status change used by BoardView DnD (no modal)
  const handleBoardDropStatusChange = useCallback((taskWithNewStatus: TaskRecord) => {
    const taskId = (taskWithNewStatus as any).id || taskWithNewStatus.task_id;
    if (!taskId) return;
    updateTaskMutation.mutate({ taskId, taskData: { status: taskWithNewStatus.status } });
  }, [updateTaskMutation]);

  const handleEditTask = useCallback((task: TaskRecord) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleChecklist = useCallback((_task: TaskRecord) => {
    // TODO: Implement checklist functionality
    console.log("Checklist functionality coming soon!");
  }, []);

  const handleSchedule = useCallback((_task: TaskRecord) => {
    // TODO: Implement schedule functionality
    console.log("Schedule functionality coming soon!");
  }, []);

  const handleStart = useCallback((_task: TaskRecord) => {
    // TODO: Implement start timer functionality
    console.log("Start timer functionality coming soon!");
  }, []);

  const handleAddChecklist = useCallback((task: TaskRecord) => {
    const tid = ((task as any).id || task.task_id) as string;
    setChecklistModalTaskId(tid);
    setEditingChecklistItem(null);
    setChecklistModalOpen(true);
  }, []);

  const handleEditChecklistItem = useCallback((item: ChecklistItemRecord) => {
    setEditingChecklistItem(item);
    setChecklistModalTaskId(item.task_id);
    setChecklistModalOpen(true);
  }, []);

  const deleteChecklistItemMutation = useDeleteChecklistItem(user?.id || null);
  const handleDeleteChecklistItem = useCallback((itemId: string) => {
    if (!itemId) return;
    if (confirm('Are you sure you want to delete this checklist item?')) {
      deleteChecklistItemMutation.mutate(itemId);
    }
  }, [deleteChecklistItemMutation]);

  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id || null] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id || null] });
    },
  });

  const handleChecklistItemSubmit = useCallback((data: Partial<ChecklistItemRecord>) => {
    if (editingChecklistItem) {
      updateChecklistItemMutation.mutate({ itemId: editingChecklistItem.checklist_item_id, payload: data });
    } else if (checklistModalTaskId) {
      createChecklistItemMutation.mutate({ taskId: checklistModalTaskId, payload: data });
    } else {
      console.error('No taskId for creating checklist item');
    }
    // Close modal immediately for better UX
    setChecklistModalOpen(false);
    setEditingChecklistItem(null);
    setChecklistModalTaskId(null);
  }, [editingChecklistItem, checklistModalTaskId, createChecklistItemMutation, updateChecklistItemMutation]);

  const handleChecklistItemStatusChange = useCallback((itemId: string, newStatus: StatusValue) => {
    if (!itemId) return;
    updateChecklistItemMutation.mutate({ itemId, payload: { status: newStatus } });
  }, [updateChecklistItemMutation]);

  const reorderChecklistItemMutation = useReorderChecklistItem(user?.id || null);
  const handleChecklistItemReorder = useCallback((itemId: string, targetOrder: number) => {
    if (!itemId) return;
    reorderChecklistItemMutation.mutate({ itemId, targetOrder });
  }, [reorderChecklistItemMutation]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleSubmitTask = useCallback((taskData: Partial<TaskRecord>) => {
    if (editingTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
  }, [editingTask, handleUpdateTask, handleCreateTask]);

  // Filter tasks by status for board view
  const tasksByStatus = useMemo(() => {
    if (!tasksData?.items) return { planned: [], inProgress: [], done: [], skipped: [] };
    
    return {
      planned: tasksData.items.filter(task => task.status === STATUS.PLANNED),
      inProgress: tasksData.items.filter(task => task.status === STATUS.IN_PROGRESS),
      done: tasksData.items.filter(task => task.status === STATUS.DONE),
      skipped: tasksData.items.filter(task => task.status === STATUS.SKIPPED),
    };
  }, [tasksData?.items]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationBar onNavigate={onNavigate} activeNav="tasks" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SystemError
            fullScreen
            variant="error"
            title="Error Loading Tasks"
            message={error instanceof Error ? error.message : "An unexpected error occurred while loading your tasks."}
            actions={[
              {
                label: 'Retry',
                onClick: () => refetch(),
                variant: 'primary'
              }
            ]}
          />
        </div>
      </div>
    );
  }

  // Calculate task statistics
  const taskStats = useMemo(() => {
    if (!tasksData?.items) return null;
    
    const tasks = tasksData.items;
    
    return {
      total: tasks.length,
      planned: tasks.filter(t => t.status === STATUS.PLANNED).length,
      inProgress: tasks.filter(t => t.status === STATUS.IN_PROGRESS).length,
      done: tasks.filter(t => t.status === STATUS.DONE).length,
      skipped: tasks.filter(t => t.status === STATUS.SKIPPED).length,
    };
  }, [tasksData]);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar onNavigate={onNavigate} activeNav="tasks" />
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600">
              {taskStats ? `${taskStats.total} tasks` : "Manage your tasks"}
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
          >
            New Task
          </Button>
        </div>

        {/* Task Statistics */}
        {taskStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{taskStats.total}</div>
              <div className="text-xs sm:text-sm text-slate-600">Total</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
              <div className="text-xl sm:text-2xl font-bold text-blue-500">{taskStats.planned}</div>
              <div className="text-xs sm:text-sm text-slate-600">Planned</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{taskStats.inProgress}</div>
              <div className="text-xs sm:text-sm text-slate-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{taskStats.done}</div>
              <div className="text-xs sm:text-sm text-slate-600">Done</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
              <div className="text-xl sm:text-2xl font-bold text-slate-600">{taskStats.skipped}</div>
              <div className="text-xs sm:text-sm text-slate-600">Skipped</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  size="md"
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select 
                value={filters.status || 'all'} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, status: e.target.value as StatusValue | 'all' }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All statuses</option>
                <option value="0">Planned</option>
                <option value="1">In Progress</option>
                <option value="2">Done</option>
                <option value="3">Skipped</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select 
                value={filters.priority || 'all'} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, priority: e.target.value as PriorityValue | 'all' }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Any priority</option>
                <option value="1">Must</option>
                <option value="2">Should</option>
                <option value="3">Want</option>
              </select>
            </div>

            {/* View Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">View</label>
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={clsx(
                    "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    view === 'list' 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  List
                </button>
                <button
                  onClick={() => setView('board')}
                  className={clsx(
                    "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    view === 'board' 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Board
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={clsx(
                    "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    view === 'calendar' 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Calendar
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="flex gap-3">
                    <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      ) : view === 'list' ? (
        <div className="space-y-4">
          {tasksData?.items?.map((task) => (
            <TaskCard
              key={(task as any).id || task.task_id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={openStatusModal}
              isUpdating={updateTaskMutation.isPending && pendingStatusId === ((task as any).id || task.task_id)}
              onStart={handleStart}
              onAddChecklist={handleAddChecklist}
              onEditChecklistItem={handleEditChecklistItem}
              onDeleteChecklistItem={handleDeleteChecklistItem}
              onChecklistItemStatusChange={handleChecklistItemStatusChange}
              onChecklistItemReorder={handleChecklistItemReorder}
            />
          ))}
          {(!tasksData?.items || tasksData.items.length === 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-slate-500 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">No tasks found</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                  ? "Try adjusting your filters to see more tasks."
                  : "Get started by creating your first task to organize your work."
                }
              </p>
              <Button
                onClick={() => setModalOpen(true)}
                variant="primary"
                size="lg"
              >
                Create Your First Task
              </Button>
            </div>
          )}
        </div>
      ) : view === 'board' ? (
        <BoardView
          tasksByStatus={tasksByStatus}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={handleBoardDropStatusChange}
          onChecklist={handleChecklist}
          onSchedule={handleSchedule}
          onStart={handleStart}
          isUpdating={updateTaskMutation.isPending}
          pendingStatusId={pendingStatusId}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 bg-slate-500 rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Calendar View</h3>
          <p className="text-slate-600">Calendar view coming soon...</p>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        task={editingTask}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      {/* Checklist Item Modal */}
      <ChecklistItemModal
        isOpen={checklistModalOpen}
        onClose={() => {
          setChecklistModalOpen(false);
          setEditingChecklistItem(null);
          setChecklistModalTaskId(null);
        }}
        onSubmit={handleChecklistItemSubmit}
        item={editingChecklistItem}
        taskDeadline={tasksData?.items?.find(t => t.task_id === checklistModalTaskId)?.deadline}
        taskPriority={tasksData?.items?.find(t => t.task_id === checklistModalTaskId)?.priority}
        isLoading={false} // TODO: Add loading state for checklist operations
      />

      {/* Status Modal */}
      {statusModalOpen && statusModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Change Status</h3>
              <p className="text-sm text-slate-600">{statusModalTask.title}</p>
            </div>
            
            <div className="space-y-2">
              {[
                { value: STATUS.PLANNED, label: "Planned", description: "Task is planned but not started" },
                { value: STATUS.IN_PROGRESS, label: "In Progress", description: "Currently working on this task" },
                { value: STATUS.DONE, label: "Done", description: "Task has been completed" },
                { value: STATUS.SKIPPED, label: "Skipped", description: "Task was skipped or cancelled" },
              ].map((statusOption) => (
                <button
                  key={statusOption.value}
                  onClick={() => handleStatusModalChange(statusOption.value)}
                  className={clsx(
                    "w-full rounded-lg border p-3 text-left transition hover:bg-slate-50",
                    statusModalTask.status === statusOption.value
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "h-3 w-3 rounded-full",
                      statusOption.value === STATUS.PLANNED && "bg-sky-500",
                      statusOption.value === STATUS.IN_PROGRESS && "bg-amber-500",
                      statusOption.value === STATUS.DONE && "bg-emerald-500",
                      statusOption.value === STATUS.SKIPPED && "bg-slate-500"
                    )} />
                    <div>
                      <div className="font-medium text-slate-900">{statusOption.label}</div>
                      <div className="text-sm text-slate-600">{statusOption.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import api from "../../lib/api";

// Types based on backend API
type StatusValue = 0 | 1 | 2 | 3;
type PriorityValue = 1 | 2 | 3 | null;

const STATUS = {
  PLANNED: 0 as StatusValue,
  IN_PROGRESS: 1 as StatusValue,
  DONE: 2 as StatusValue,
  SKIPPED: 3 as StatusValue,
} as const;

const PRIORITY = {
  MUST: 1,
  SHOULD: 2,
  WANT: 3,
} as const;

interface TaskRecord {
  task_id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority?: PriorityValue;
  status: StatusValue;
  is_atomic: boolean;
  created_at: string;
  updated_at: string;
  checklist?: ChecklistItemRecord[];
  workItems?: WorkItemRecord[];
}

interface ChecklistItemRecord {
  checklist_item_id: string;
  task_id: string;
  title: string;
  deadline?: string;
  priority?: PriorityValue;
  status: StatusValue;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface WorkItemRecord {
  work_item_id: string;
  task_id: string;
  checklist_item_id?: string;
  start_at?: string;
  planned_minutes?: number;
  status: StatusValue;
  created_at: string;
  updated_at: string;
}

interface TaskListResponse {
  items: TaskRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface TaskFilters {
  search?: string;
  status?: StatusValue | 'all';
  priority?: PriorityValue | 'all';
  page?: number;
  pageSize?: number;
}

// Utility functions
function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `In ${diffDays}d`;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

// Status Badge Component
function StatusBadge({ status }: { status: StatusValue }) {
  const statusConfig = {
    [STATUS.PLANNED]: { 
      label: "Planned", 
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    [STATUS.IN_PROGRESS]: { 
      label: "In Progress", 
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    [STATUS.DONE]: { 
      label: "Done", 
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    [STATUS.SKIPPED]: { 
      label: "Skipped", 
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
  };

  const config = statusConfig[status];

  return (
    <span className={clsx(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
      config.className
    )}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: PriorityValue }) {
  if (!priority) return null;

  const priorityConfig = {
    [PRIORITY.MUST]: { 
      label: "Must", 
      className: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500"
    },
    [PRIORITY.SHOULD]: { 
      label: "Should", 
      className: "bg-orange-100 text-orange-700 border-orange-200",
      dot: "bg-orange-500"
    },
    [PRIORITY.WANT]: { 
      label: "Want", 
      className: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-500"
    },
  };

  const config = priorityConfig[priority];

  return (
    <span className={clsx(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
      config.className
    )}>
      <span className={clsx("h-2 w-2 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

// Due Date Badge Component
function DueDateBadge({ deadline }: { deadline?: string }) {
  if (!deadline) return null;

  const date = new Date(deadline);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;

  let label = formatDate(deadline);
  let className = "bg-slate-100 text-slate-700 border-slate-200";

  if (isOverdue) {
    className = "bg-red-100 text-red-700 border-red-200";
  } else if (isToday) {
    className = "bg-blue-100 text-blue-700 border-blue-200";
  } else if (isTomorrow) {
    className = "bg-amber-100 text-amber-700 border-amber-200";
  }

  return (
    <span className={clsx(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
      className
    )}>
      📅 {label}
      {formatTime(deadline) && ` • ${formatTime(deadline)}`}
    </span>
  );
}

// Task Card Component
function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: { 
  task: TaskRecord;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: StatusValue) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const completedChecklist = task.checklist?.filter(item => item.status === STATUS.DONE).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  const cycleStatus = (currentStatus: StatusValue): StatusValue => {
    return ((currentStatus + 1) % 4) as StatusValue;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => onStatusChange(task.task_id, cycleStatus(task.status))}
              className="hover:opacity-80 transition-opacity"
              title="Click to cycle status"
            >
              <StatusBadge status={task.status} />
            </button>
            <h3 className="font-semibold text-slate-900 truncate">
              {task.title}
            </h3>
          </div>
          
          {task.description && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <DueDateBadge deadline={task.deadline} />
            <PriorityBadge priority={task.priority ?? null} />
            
            {hasChecklist && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {expanded ? "▼" : "▶"}
                {completedChecklist}/{totalChecklist} subtasks
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            title="Edit task"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.task_id)}
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      {hasChecklist && expanded && (
        <div className="mt-3 space-y-2">
          <div className="border-t border-slate-200 pt-3">
            {task.checklist!.map((item) => (
              <div key={item.checklist_item_id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <input 
                  type="checkbox"
                  checked={item.status === STATUS.DONE}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // TODO: Implement checklist item status update
                    console.log('Update checklist item status:', item.checklist_item_id, e.target.checked);
                  }}
                  className="rounded"
                />
                <span className={clsx(
                  "text-sm flex-1",
                  item.status === STATUS.DONE && "line-through text-slate-500"
                )}>
                  {item.title}
                </span>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Task Modal Component
function TaskModal({ 
  open, 
  onClose, 
  onSubmit, 
  initialTask 
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<TaskRecord>) => void;
  initialTask?: TaskRecord | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<PriorityValue | 'all'>('all');
  const [status, setStatus] = useState<StatusValue>(STATUS.PLANNED);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open && initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setDeadline(initialTask.deadline ? new Date(initialTask.deadline).toISOString().slice(0, 16) : "");
      setPriority(initialTask.priority ?? 'all');
      setStatus(initialTask.status);
    } else if (open && !initialTask) {
      // Reset form for new task
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority('all');
      setStatus(STATUS.PLANNED);
    }
  }, [open, initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: Partial<TaskRecord> = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      priority: priority === 'all' ? null : (priority as PriorityValue),
      status,
    };

    onSubmit(taskData);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {initialTask ? "Edit Task" : "Create New Task"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority === 'all' ? '' : priority?.toString() || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as PriorityValue | 'all')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">None</option>
                    <option value="1">Must</option>
                    <option value="2">Should</option>
                    <option value="3">Want</option>
                  </select>
                </div>

                {initialTask && (
                  <div className="col-span-2">
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(parseInt(e.target.value) as StatusValue)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="0">Planned</option>
                      <option value="1">In Progress</option>
                      <option value="2">Done</option>
                      <option value="3">Skipped</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initialTask ? "Update" : "Create"} Task
              </button>
            </div>
          </form>
        </div>
      </div>
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

function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: Partial<TaskRecord>) => {
      const response = await api.post<TaskRecord>("/tasks/create", taskData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      alert("Task created successfully");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to create task");
    },
  });
}

function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: Partial<TaskRecord> }) => {
      const response = await api.patch<TaskRecord>(`/tasks/${taskId}`, taskData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      alert("Task updated successfully");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to update task");
    },
  });
}

function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      alert("Task deleted successfully");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to delete task");
    },
  });
}

// Navigation Bar Component
function NavigationBar({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const activeNav: "today" | "tasks" | "planner" | "stats" = "tasks";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate?.("/today")}
          className="text-xl font-extrabold tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Taskie
        </button>
        
        {/* Navigation Items */}
        <nav className="flex items-center gap-1">
          {[
            { 
              id: "today", 
              label: "Today", 
              icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              )
            },
            { 
              id: "tasks", 
              label: "Tasks", 
              icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )
            },
            { 
              id: "planner", 
              label: "Planner", 
              icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            { 
              id: "stats", 
              label: "Stats", 
              icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
          ].map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => {
                if (nav.id === "today" && onNavigate) {
                  onNavigate("/today");
                }
                // TODO: Add other navigation handlers
              }}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                activeNav === nav.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {nav.icon}
              {nav.label}
            </button>
          ))}
        </nav>
        
        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
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

  // Data fetching
  const { data: tasksData, isLoading, error } = useTasksData(user?.id || null, filters);
  
  // Mutations
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Handlers
  const handleCreateTask = useCallback((taskData: Partial<TaskRecord>) => {
    createTaskMutation.mutate(taskData);
  }, [createTaskMutation]);

  const handleUpdateTask = useCallback((taskData: Partial<TaskRecord>) => {
    if (editingTask) {
      updateTaskMutation.mutate({ taskId: editingTask.task_id, taskData });
    }
  }, [editingTask, updateTaskMutation]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  }, [deleteTaskMutation]);

  const handleStatusChange = useCallback((taskId: string, newStatus: StatusValue) => {
    updateTaskMutation.mutate({ taskId, taskData: { status: newStatus } });
  }, [updateTaskMutation]);

  const handleEditTask = useCallback((task: TaskRecord) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

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
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Tasks</h2>
          <p className="text-slate-600">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <NavigationBar onNavigate={onNavigate} />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600">
            {tasksData ? `${tasksData.total} tasks` : "Manage your tasks"}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          ➕ New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>
          </div>
          
          <select 
            value={filters.status || 'all'} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, status: e.target.value as StatusValue | 'all' }))}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="0">Planned</option>
            <option value="1">In Progress</option>
            <option value="2">Done</option>
            <option value="3">Skipped</option>
          </select>

          <select 
            value={filters.priority || 'all'} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, priority: e.target.value as PriorityValue | 'all' }))}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Any priority</option>
            <option value="1">Must</option>
            <option value="2">Should</option>
            <option value="3">Want</option>
          </select>

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
              📋 List
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
              📊 Board
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
              📅 Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="space-y-4">
          {tasksData?.items?.map((task) => (
            <TaskCard
              key={task.task_id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ))}
          {(!tasksData?.items || tasksData.items.length === 0) && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <div className="text-slate-400 mb-4 text-4xl">📋</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks found</h3>
              <p className="text-slate-600 mb-4">
                {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                  ? "Try adjusting your filters to see more tasks"
                  : "Get started by creating your first task"
                }
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                ➕ Create Task
              </button>
            </div>
          )}
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { status: STATUS.PLANNED, label: "Planned", tasks: tasksByStatus.planned },
            { status: STATUS.IN_PROGRESS, label: "In Progress", tasks: tasksByStatus.inProgress },
            { status: STATUS.DONE, label: "Done", tasks: tasksByStatus.done },
            { status: STATUS.SKIPPED, label: "Skipped", tasks: tasksByStatus.skipped },
          ].map(({ status, label, tasks }) => (
            <div key={status} className="bg-white rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-medium text-slate-600">
                  {label} ({tasks.length})
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-sm">No tasks</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="text-slate-400 mb-4 text-4xl">📅</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Calendar View</h3>
          <p className="text-slate-600">Calendar view coming soon...</p>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        initialTask={editingTask}
      />
      </div>
    </div>
  );
}
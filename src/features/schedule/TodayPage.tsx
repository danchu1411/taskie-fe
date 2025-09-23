import { isAxiosError } from "axios";
import { useCallback, useRef, useState, memo, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import api from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import { NavigationBar, SystemError } from "../../components/ui";
import { useTodayKeyboardShortcuts } from "./hooks/useTodayKeyboardShortcuts";
import { useTodayData, type TodayItem, type StatusValue, type TaskListResponse, STATUS } from "./hooks/useTodayData";
import useTodayTimer from "./useTodayTimer";
import { QuickAddPanel } from "./components/QuickAddPanel";
import { TodaySection } from "./components/TodaySection";
import { ScheduleModal } from "./components/ScheduleModal";
import { ChecklistAssignModal } from "./components/ChecklistAssignModal";
import { EditTaskModal } from "./components/EditTaskModal";
import { StatusPickerModal } from "./components/StatusPickerModal";
import type { TaskRecord, ChecklistItemRecord } from "../../lib/types";

function statusLabel(value: StatusValue) {
  if (value === STATUS.IN_PROGRESS) return "In progress";
  if (value === STATUS.DONE) return "Done";
  if (value === STATUS.SKIPPED) return "Skipped";
  return "Planned";
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Ring({ value }: { value: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, value));
  const offset = circumference - (bounded / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24">
      <circle cx="50" cy="50" r={radius} className="fill-none stroke-slate-200" strokeWidth={10} />
      <circle
        cx="50"
        cy="50"
        r={radius}
        className="fill-none stroke-indigo-500 transition-[stroke-dashoffset]"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}


function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "string") return data.error;
      if (typeof data.details === "string") return data.details;
    }
    return `${error.message} (Status: ${error.response?.status})`;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error. Please try again.";
}
type StatusChipProps = {
  status: StatusValue;
  onOpenModal: () => void;
  disabled?: boolean;
};

const StatusChip = memo(function StatusChip({ status, onOpenModal, disabled }: StatusChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onOpenModal();
      }}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
        status === STATUS.PLANNED && "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
        status === STATUS.IN_PROGRESS && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
        status === STATUS.DONE && "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
        status === STATUS.SKIPPED && "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
        disabled && "cursor-not-allowed opacity-60",
      )}
      aria-label={"Change status from " + statusLabel(status)}
      aria-disabled={disabled ? "true" : undefined}
      title="Click to select status"
    >
      <span className={clsx(
        "h-2 w-2 rounded-full",
        status === STATUS.PLANNED && "bg-blue-500",
        status === STATUS.IN_PROGRESS && "bg-amber-500",
        status === STATUS.DONE && "bg-green-500",
        status === STATUS.SKIPPED && "bg-slate-400",
      )} aria-hidden />
      {statusLabel(status)}
    </button>
  );
});

// Task Card Component for better performance


// Droppable Column Component


// Progress Overview Component
interface ProgressOverviewProps {
  totalTasks: number;
  inProgressCount: number;
  completedCount: number;
  progressValue: number;
}

const ProgressOverview = memo(function ProgressOverview({
  totalTasks,
  inProgressCount,
  completedCount,
  progressValue,
}: ProgressOverviewProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Total Tasks</p>
            <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">In Progress</p>
            <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <Ring value={progressValue} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Progress</p>
            <p className="text-2xl font-bold text-slate-900">{progressValue}%</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <SystemError
          fullScreen
          title="Something went wrong"
          message="We encountered an unexpected error. Please try refreshing the page."
          actions={[
            {
              label: 'Refresh Page',
              onClick: () => window.location.reload(),
              variant: 'primary'
            }
          ]}
        />
      );
    }

    return this.props.children;
  }
}


type TodayPageProps = {
  onNavigate?: (path: string) => void;
};

// Proper mutation context types
interface StatusMutationContext {
  previousTasks: TaskListResponse | undefined;
}

interface QuickAddMutationContext {
  previousTasks: TaskListResponse | undefined;
  tempId: string;
}

interface StatusMutationPayload {
  item: TodayItem;
  status: StatusValue;
}
function TodayPageContent({ onNavigate }: TodayPageProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const [quickOpen, setQuickOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const [customDuration, setCustomDuration] = useState(120); // minutes

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TodayItem | null>(null);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleMinutes, setScheduleMinutes] = useState(25);

  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodayItem | null>(null);
  const [checklistItems, setChecklistItems] = useState<Array<{ title: string; deadline?: string; priority?: number }>>([{ title: "" }]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TodayItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<1 | 2 | 3 | null>(null);


  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalItem, setStatusModalItem] = useState<TodayItem | null>(null);

  const quickRef = useRef<HTMLInputElement | null>(null);

  const { tasksQuery, items, categories } = useTodayData(userId);
  const { isLoading, isError, error, refetch } = tasksQuery;
  const { inProgress, planned, completed, doneCount, progressValue } = categories;

  const timer = useTodayTimer({
    items,
    onStartFocus: (item) => {
      if (item.status !== STATUS.IN_PROGRESS) {
        statusMutation.mutate({ item, status: STATUS.IN_PROGRESS });
      }
    }
  });
  const timerItem = timer.timerItem;
  const {
    timerOpen,
    timerAnimating,
    timerDuration,
    timerRemain,
    timerRunning,
    isFullscreen,
    isFloating,
    currentSession,
    sessionPlan,
    isDarkTheme,
    FloatingWidget,
    startCustomDuration,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    setTimerRunning,
    applyFloatingDelta,
  } = timer;
  const statusMutation = useMutation<void, unknown, StatusMutationPayload, StatusMutationContext>({
    mutationFn: async ({ item, status }) => {
      if (item.source === "task" && item.taskId) {
        await api.patch(`/tasks/${item.taskId}`, { status });
        return;
      }
      if (item.source === "checklist" && item.checklistItemId) {
        await api.patch(`/checklist-items/${item.checklistItemId}`, { status });
        return;
      }
      throw new Error("Unable to update status for this item.");
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onMutate: async ({ item, status }) => {
      setPendingStatusId(item.id);
      setStatusError(null);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["today-tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["today-tasks", userId]) as TaskListResponse | undefined;
      
      // Optimistically update to the new value
      queryClient.setQueryData(["today-tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            if (item.source === "task" && task.task_id === item.taskId) {
              return { ...task, status };
            }
            
            if (item.source === "checklist" && task.checklist) {
              return {
                ...task,
                checklist: task.checklist.map((checklistItem: ChecklistItemRecord) => 
                  checklistItem.checklist_item_id === item.checklistItemId
                    ? { ...checklistItem, status }
                    : checklistItem
                )
              };
            }
            
            return task;
          })
        };
      });
      
      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      setStatusError(getErrorMessage(err));
      // Revert to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["today-tasks", userId], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      setPendingStatusId(null);
    },
  });

  const quickAddMutation = useMutation<TaskRecord, unknown, string, QuickAddMutationContext>({
    mutationFn: async (title) => {
      const response = await api.post("/tasks/create", { title, priority: 2 });
      return response.data;
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (title) => {
      setQuickError(null);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["today-tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["today-tasks", userId]) as TaskListResponse | undefined;
      
      // Optimistically add the new task
      const tempId = `temp-${Date.now()}`;
        const optimisticTask: TaskRecord = {
        task_id: tempId,
        user_id: userId || "",
        title: title.trim(),
        description: undefined,
        deadline: undefined,
        priority: 2,
        status: 0,
        is_atomic: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workItems: [],
        checklist: [],
      };
      
      queryClient.setQueryData(["today-tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: [optimisticTask, ...old.items]
        };
      });
      
      return { previousTasks, tempId };
    },
    onError: (err, _title, context) => {
      setQuickError(getErrorMessage(err));
      // Revert to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["today-tasks", userId], context.previousTasks);
      }
    },
    onSuccess: (data, _title, context) => {
      setQuickTitle("");
      // Replace the optimistic task with the real one
      queryClient.setQueryData(["today-tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => 
            task.task_id === context?.tempId ? data : task
          )
        };
      });
      // Also refresh the Tasks page queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  const scheduleMutation = useMutation<void, unknown, { workItemId: string; startAt: string; plannedMinutes: number }>({
    mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
      await api.post("/schedule-entries", {
        workItemId,
        startAt,
        plannedMinutes,
        status: 0, // planned
      });
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      queryClient.invalidateQueries({ queryKey: ["schedule", "upcoming"] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setScheduleModalOpen(false);
      setSelectedItem(null);
    },
  });

  const checklistMutation = useMutation<void, unknown, { taskId: string; checklist: Array<{ title: string; deadline?: string; priority?: number }> }>({
    mutationFn: async ({ taskId, checklist }) => {
      await api.post(`/checklist-items/${taskId}/checklist`, { checklist });
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync (Tasks includes checklist)
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setChecklistModalOpen(false);
      setSelectedTask(null);
      setChecklistItems([{ title: "" }]);
    },
  });

  interface EditTaskPayload {
    taskId: string;
    title: string;
    description?: string;
    deadline?: string;
    priority?: number;
  }

  const editTaskMutation = useMutation<void, unknown, EditTaskPayload>({
    mutationFn: async ({ taskId, title, description, deadline, priority }) => {
      const payload: Record<string, unknown> = { title };
      if (description) payload.description = description;
      if (deadline) payload.deadline = deadline;
      if (priority) payload.priority = priority;
      
      await api.patch(`/tasks/${taskId}`, payload);
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditModalOpen(false);
      setEditingItem(null);
    },
  });
  const handleStatusChange = useCallback(
    (item: TodayItem, nextStatus: StatusValue) => {
      statusMutation.mutate({ item, status: nextStatus });
    },
    [statusMutation],
  );


  const openTimer = useCallback((item: TodayItem) => { timer.openTimer(item); }, [timer]);

  // timer controls are provided by hook via destructuring above

  // Floating Widget handled by useTodayTimer


  // Drag and Drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleFloatingDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event;
    
    // Only handle floating widget drags
    if (active.id === 'floating-widget' && active.data.current?.type === 'floating-widget') {
      const initial = active.rect.current.initial;
      const translated = active.rect.current.translated;
      
      if (initial && translated) {
        const delta = {
          x: translated.left - initial.left,
          y: translated.top - initial.top,
        };
        applyFloatingDelta(delta);
      }
    }
  }, [applyFloatingDelta]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    console.log('Drag end event:', { active: active.id, over: over?.id });

    if (!over) {
      console.log('No drop target found');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('Drag details:', { activeId, overId });


    // Find the dragged item
    const draggedItem = items.find(item => item.id === activeId);
    if (!draggedItem) {
      console.log('Dragged item not found:', activeId);
      return;
    }

    console.log('Dragged item:', draggedItem);

    // Determine new status based on drop zone
    let newStatus: StatusValue;
    
    // Check if dropped on a column
    if (overId === 'planned-column') {
      newStatus = STATUS.PLANNED;
    } else if (overId === 'in-progress-column') {
      newStatus = STATUS.IN_PROGRESS;
    } else if (overId === 'completed-column') {
      newStatus = STATUS.DONE;
    } else {
      // If dropped on another task, find which column that task belongs to
      const targetItem = items.find(item => item.id === overId);
      if (targetItem) {
        console.log('Dropped on task:', targetItem);
        newStatus = targetItem.status;
      } else {
        console.log('Invalid drop zone:', overId);
        return; // Invalid drop zone
      }
    }

    console.log('Status change:', { from: draggedItem.status, to: newStatus });

    // Only update if status actually changed
    if (draggedItem.status !== newStatus) {
      console.log('Updating status...');
      statusMutation.mutate({ item: draggedItem, status: newStatus });
    } else {
      console.log('Status unchanged, no update needed');
    }
  }, [items, statusMutation]);

  const addQuickItem = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) {
        setQuickError("Please enter a title.");
        return;
      }
      quickAddMutation.mutate(trimmed);
    },
    [quickAddMutation],
  );

  const openScheduleModal = useCallback((item: TodayItem) => {
    setSelectedItem(item);
    // Set default start time to next hour
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    setScheduleStartAt(nextHour.toISOString().slice(0, 16));
    setScheduleMinutes(item.plannedMinutes ?? 25);
    setScheduleModalOpen(true);
  }, []);

  const createSchedule = useCallback(() => {
    if (!selectedItem) return;
    
    const startAt = new Date(scheduleStartAt).toISOString();
    scheduleMutation.mutate({
      workItemId: selectedItem.id,
      startAt,
      plannedMinutes: scheduleMinutes,
    });
  }, [selectedItem, scheduleStartAt, scheduleMinutes, scheduleMutation]);

  const openChecklistModal = useCallback((item: TodayItem) => {
    if (item.source !== "task" || !item.taskId) return;
    setSelectedTask(item);
    setChecklistItems([{ title: "" }]);
    setChecklistModalOpen(true);
  }, []);

  const addChecklistItem = useCallback(() => {
    setChecklistItems(prev => [...prev, { title: "" }]);
  }, []);

  const updateChecklistItem = useCallback((index: number, field: string, value: string | number | undefined) => {
    setChecklistItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeChecklistItem = useCallback((index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const createChecklist = useCallback(() => {
    if (!selectedTask?.taskId) return;
    
    const validItems = checklistItems.filter(item => item.title.trim());
    if (validItems.length === 0) return;
    
    checklistMutation.mutate({
      taskId: selectedTask.taskId,
      checklist: validItems,
    });
  }, [selectedTask, checklistItems, checklistMutation]);

  const openEditModal = useCallback((item: TodayItem) => {
    if (item.source !== "task" || !item.taskId) return;
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(""); // We don't have description in TodayItem, so start empty
    setEditDeadline(item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : "");
    setEditPriority(item.priority);
    setEditModalOpen(true);
  }, []);

  const saveTaskEdit = useCallback(() => {
    if (!editingItem?.taskId) return;
    
    editTaskMutation.mutate({
      taskId: editingItem.taskId,
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      deadline: editDeadline ? new Date(editDeadline).toISOString() : undefined,
      priority: editPriority || undefined,
    });
  }, [editingItem, editTitle, editDescription, editDeadline, editPriority, editTaskMutation]);

  const openStatusModal = useCallback((item: TodayItem) => {
    setStatusModalItem(item);
    setStatusModalOpen(true);
  }, []);

  const selectStatus = useCallback((status: StatusValue) => {
    if (!statusModalItem) return;
    
    statusMutation.mutate({ item: statusModalItem, status });
    setStatusModalOpen(false);
    setStatusModalItem(null);
  }, [statusModalItem, statusMutation]);

  const errorMessage = isError ? getErrorMessage(error) : null;

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);



  // Timer effects moved to useTodayTimer hook

  // Keyboard shortcuts
  useTodayKeyboardShortcuts({
    quickOpen,
    setQuickOpen,
    scheduleModalOpen,
    setScheduleModalOpen,
    checklistModalOpen,
    setChecklistModalOpen,
    editModalOpen,
    setEditModalOpen,
    statusModalOpen,
    setStatusModalOpen,
    timerOpen,
    isFullscreen,
    isFloating,
    setTimerRunning,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    statusModalItem,
    selectStatus,
  });



  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-slate-50">
      <NavigationBar onNavigate={onNavigate} activeNav="today" />
          
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Calm Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="text-sm font-medium tracking-wider text-slate-500 uppercase">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] ?? 'there'}
              </h1>
              <div className="h-1 w-24 bg-slate-300"></div>
              <p className="text-lg font-medium text-slate-600">
                Let's focus on what matters today.
              </p>
        </div>
            
            <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => timer.openTimer()}
              className="rounded-lg bg-blue-600 px-8 py-4 text-white transition-colors hover:bg-blue-700"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">◐</span>
                <span className="font-medium">Start Focus</span>
              </div>
            </button>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6">
            <SystemError
              variant="error"
              title="Unable to load today schedule"
              message={errorMessage}
              actions={[
                {
                  label: 'Retry',
                  onClick: handleRetry,
                  variant: 'primary'
                }
              ]}
            />
          </div>
        )}

        {statusError && (
          <div className="mb-6">
            <SystemError
              variant="warning"
              title="Operation failed"
              message={statusError}
              actions={[
                {
                  label: 'Dismiss',
                  onClick: () => setStatusError(null),
                  variant: 'secondary'
                }
              ]}
            />
          </div>
        )}

        {/* Progress Overview */}
        {isLoading ? (
          <ProgressOverviewSkeleton />
        ) : (
          <ProgressOverview
            totalTasks={items.length}
            inProgressCount={inProgress.length}
            completedCount={doneCount}
            progressValue={progressValue}
          />
        )}
        {/* Calm Task Sections */}
        <div className="grid gap-8 lg:grid-cols-3">
          <TodaySection
            id="planned-column"
            title="Planned"
            subtitle="Ready to start"
            icon="□"
            iconBg="bg-blue-50"
            iconText="text-blue-600"
            countBg="bg-blue-50"
            countText="text-blue-600"
            items={planned}
            isLoading={isLoading}
            onStart={openTimer}
            onOpenTimer={openTimer}
            onSchedule={openScheduleModal}
            onChecklist={openChecklistModal}
            onEdit={openEditModal}
            onStatusModal={openStatusModal}
            isUpdating={(itemId) => statusMutation.isPending && pendingStatusId === itemId}
            className="lg:col-span-1"
          />

          <TodaySection
            id="in-progress-column"
            title="In Progress"
            subtitle="Currently working on"
            icon="◐"
            iconBg="bg-amber-50"
            iconText="text-amber-600"
            countBg="bg-amber-50"
            countText="text-amber-600"
            items={inProgress}
            isLoading={isLoading}
            onStart={openTimer}
            onOpenTimer={openTimer}
            onSchedule={openScheduleModal}
            onChecklist={openChecklistModal}
            onEdit={openEditModal}
            onStatusModal={openStatusModal}
            isUpdating={(itemId) => statusMutation.isPending && pendingStatusId === itemId}
            className="lg:col-span-1"
          />

          <TodaySection
            id="completed-column"
            title="Done"
            subtitle="Completed tasks"
            icon="●"
            iconBg="bg-green-50"
            iconText="text-green-600"
            countBg="bg-green-50"
            countText="text-green-600"
            items={completed}
            isLoading={isLoading}
            onStart={openTimer}
            onOpenTimer={openTimer}
            onSchedule={openScheduleModal}
            onChecklist={openChecklistModal}
            onEdit={openEditModal}
            onStatusModal={openStatusModal}
            onBack={(item) => handleStatusChange(item, STATUS.PLANNED)}
            isUpdating={(itemId) => statusMutation.isPending && pendingStatusId === itemId}
            className="lg:col-span-1"
          />
                      </div>
      </main>
      </div>
      {/* Calm Quick Add */}
      <div className="fixed bottom-6 right-6 z-40">
        <QuickAddPanel
          open={quickOpen}
          title={quickTitle}
          onTitleChange={setQuickTitle}
          onAdd={addQuickItem}
          onCancel={() => setQuickOpen(false)}
          error={quickError}
          loading={quickAddMutation.isPending}
          inputRef={quickRef}
        />
        <button
          type="button"
          onClick={() => {
            setQuickOpen((prev) => !prev);
            window.setTimeout(() => {
              if (!quickOpen) {
                quickRef.current?.focus();
              }
            }, 40);
          }}
          className="rounded-lg bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700"
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      </div>
      {/* Floating Widget */}
      {isFloating && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFloatingDragEnd}
        >
          <FloatingWidget />
        </DndContext>
      )}

      {/* Fullscreen Timer - Theme Support */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-50 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex h-full flex-col items-center justify-center">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className={`text-xl font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Focus period ({currentSession} of {sessionPlan.length})
              </h1>
              </div>

            {/* Circular Timer */}
            <div className="mb-12 relative">
              <div className="relative w-80 h-80">
                {/* Background Circle */}
                <div className={`absolute inset-0 rounded-full border ${
                  isDarkTheme 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={isDarkTheme ? 'text-gray-600' : 'text-gray-300'}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - (timerRemain / timerDuration))}`}
                      className="text-blue-500 transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Time Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-light mb-1 ${
                      isDarkTheme ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.floor(timerRemain / (60 * 1000))}
                    </div>
                    <div className={`text-lg ${
                      isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      min
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              {/* Pause/Resume Button */}
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white transition hover:bg-blue-600"
              >
                {timerRunning ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              {/* More Options Button */}
              <button
                onClick={enterFloatingMode}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                  isDarkTheme 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            {/* Next Session Info */}
            <div className="mt-8 text-center">
              <div className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                Up next: <span className="font-semibold">
                  {currentSession < sessionPlan.length ? 
                    `${sessionPlan[currentSession]?.duration || 5} min break` : 
                    'Session complete'
                  }
                </span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => timer.setIsDarkTheme(!isDarkTheme)}
              className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition ${
                isDarkTheme 
                  ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300'
              }`}
              title={isDarkTheme ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDarkTheme ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={closeTimer}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition ${
                isDarkTheme 
                  ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal Timer (Setup Mode) */}
      {timerOpen && !isFullscreen && !isFloating && (
        <div className="fixed inset-x-0 bottom-0 z-50">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
              timerAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeTimer}
          />
          
          {/* Windows 11 Style Modal */}
          <div 
            className={`relative rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
              timerAnimating 
                ? 'translate-y-0' 
                : 'translate-y-full'
            }`}
          >
            <div className="mx-auto max-w-md px-8 py-8">
              {/* Header */}
              <div className="mb-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900">Focus Session</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {timerItem ? timerItem.title : "Select a task to focus on"}
                </p>
              </div>

              {/* Time Display - Only show when running */}
              {timerRunning && (
                <div className="mb-8 text-center">
                  <div className="text-4xl font-light text-gray-900">
                    {formatTime(timerRemain)}
                  </div>
                </div>
              )}

              {/* Duration Controls - Only show when not running */}
              {!timerRunning && (
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <label className="text-sm font-medium text-gray-700">Total Duration</label>
                    <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                        onClick={() => setCustomDuration(prev => Math.max(30, prev - 30))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <div className="text-2xl font-medium text-gray-900">{customDuration}</div>
                        <div className="text-sm text-gray-600">minutes</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomDuration(prev => Math.min(480, prev + 30))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => startCustomDuration(customDuration)}
                      className="flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="font-medium">Start {customDuration}min Session</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons - Only show when running */}
              {timerRunning && (
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(false)}
                    className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-6 py-3 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    <span className="font-medium">Pause</span>
                  </button>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={closeTimer}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Close
              </button>
            </div>
                    </div>
                  </div>
                </div>
      )}

      <ScheduleModal
        open={scheduleModalOpen}
        selectedItem={selectedItem}
        startAt={scheduleStartAt}
        minutes={scheduleMinutes}
        onStartAtChange={setScheduleStartAt}
        onMinutesChange={setScheduleMinutes}
        onSave={createSchedule}
        onCancel={() => setScheduleModalOpen(false)}
        loading={scheduleMutation.isPending}
      />

      <ChecklistAssignModal
        open={checklistModalOpen}
        selectedTask={selectedTask}
        checklistItems={checklistItems}
        onItemChange={updateChecklistItem}
        onAddItem={addChecklistItem}
        onRemoveItem={removeChecklistItem}
        onSave={createChecklist}
        onCancel={() => setChecklistModalOpen(false)}
        loading={checklistMutation.isPending}
      />

      <EditTaskModal
        open={editModalOpen}
        editingItem={editingItem}
        title={editTitle}
        description={editDescription}
        deadline={editDeadline}
        priority={editPriority}
        onTitleChange={setEditTitle}
        onDescriptionChange={setEditDescription}
        onDeadlineChange={setEditDeadline}
        onPriorityChange={setEditPriority}
        onSave={saveTaskEdit}
        onCancel={() => setEditModalOpen(false)}
        loading={editTaskMutation.isPending}
      />

      <StatusPickerModal
        open={statusModalOpen}
        selectedItem={statusModalItem}
        onStatusSelect={selectStatus}
        onCancel={() => setStatusModalOpen(false)}
        loading={statusMutation.isPending}
      />
      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          (() => {
            const activeItem = items.find(item => item.id === activeId);
            if (!activeItem) return null;
            
            return (
              <div className="rotate-3 scale-105 rounded-lg bg-white p-4 shadow-lg border border-slate-200 opacity-90">
                <div className="mb-3 flex items-start justify-between">
                  <StatusChip
                    status={activeItem.status}
                    onOpenModal={() => {}}
                    disabled={true}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">{activeItem.title}</h3>
                  {activeItem.parentTitle && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                      </svg>
                      {activeItem.parentTitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}


const ProgressOverviewSkeleton = memo(function ProgressOverviewSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-4 shadow-sm border border-slate-200 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200"></div>
            <div>
              <div className="h-4 w-20 rounded bg-slate-200 mb-2"></div>
              <div className="h-6 w-8 rounded bg-slate-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default function TodayPage({ onNavigate }: TodayPageProps) {
  return (
    <ErrorBoundary>
      <TodayPageContent onNavigate={onNavigate} />
    </ErrorBoundary>
  );
}


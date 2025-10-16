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
import { recordFocusSession } from "../../lib/api-stats";
import { useAuth } from "../auth/AuthContext";
import { NavigationBar, SystemError, ChecklistItemModal } from "../../components/ui";
import { WallpaperBackground } from "../../components/WallpaperBackground";
import { useTodayKeyboardShortcuts } from "./hooks/useTodayKeyboardShortcuts";
import { useTodayData, type TodayItem, type StatusValue, type TaskListResponse, STATUS } from "./hooks/useTodayData";
import { SCHEDULE_QUERY_KEY } from "./hooks/useScheduleData";
import useTodayTimer from "./useTodayTimer";
import { getDefaultFocusDuration } from "./constants";
import { DEFAULT_VALUES, TIMER_INTERVALS } from "./constants/cacheConfig";
import { QuickAddPanel } from "./components/QuickAddPanel";
import { TodaySection } from "./components/TodaySection";
import { ScheduleModal } from "./components/ScheduleModal";
import { ChecklistAssignModal } from "./components/ChecklistAssignModal";
import { EditTaskModal } from "./components/EditTaskModal";
import { StatusPickerModal } from "./components/StatusPickerModal";
import { ConfirmStopSessionModal } from "./components/ConfirmStopSessionModal";
import { FocusTimerFullscreen } from "./components/FocusTimerFullscreen";
import { FocusTimerBottomSheet } from "./components/FocusTimerBottomSheet";
import type { TaskRecord, ChecklistItemRecord, WorkItemRecord } from "../../lib/types";

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

  const [customDuration, setCustomDuration] = useState(getDefaultFocusDuration()); // minutes
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TodayItem | null>(null);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleMinutes, setScheduleMinutes] = useState(getDefaultFocusDuration());
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodayItem | null>(null);
  const [checklistItems, setChecklistItems] = useState<Array<{ title: string; deadline?: string; priority?: number }>>([{ title: "" }]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TodayItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<1 | 2 | 3 | null>(null);

  // Checklist item modal state (giống TasksPage)
  const [checklistItemModalOpen, setChecklistItemModalOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItemRecord | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalItem, setStatusModalItem] = useState<TodayItem | null>(null);

  const quickRef = useRef<HTMLInputElement | null>(null);

  const { tasksQuery, items, categories, findScheduleEntry } = useTodayData(userId);

  const resolveWorkItemId = useCallback(
    (item: TodayItem | null) => {
      if (!item) return null;

      const normalize = (value: string | null | undefined) =>
        value ? String(value).toLowerCase() : null;

      const tasks = tasksQuery.data?.items ?? [];

      // Debug logging
      console.log('🔍 resolveWorkItemId called:', {
        source: item.source,
        itemId: item.id,
        taskId: item.taskId,
        checklistItemId: item.checklistItemId,
        title: item.title
      });

      // Quick path: if item.id is already a workItemId (starts with 'wi_')
      if (item.id && String(item.id).startsWith('wi_')) {
        console.log('✅ Quick return: item.id is already a workItemId:', item.id);
        return item.id;
      }

      const targetTaskId = normalize(item.taskId ?? item.id);
      const targetChecklistId = normalize(item.checklistItemId);

      for (const task of tasks) {
        const rawTaskId =
          normalize(task.task_id) ??
          normalize((task as unknown as { id?: string }).id) ??
          normalize((task as unknown as { taskId?: string }).taskId);

        if (targetTaskId && rawTaskId && rawTaskId !== targetTaskId) {
          continue;
        }

        const workItems =
          (task.workItems ??
            (task as unknown as { work_items?: WorkItemRecord[] }).work_items ??
            []) as Array<WorkItemRecord | Record<string, unknown>>;

        for (const rawWorkItem of workItems) {
          const workItem = rawWorkItem as WorkItemRecord;
          const workItemId =
            (rawWorkItem as any).work_id ??
            workItem.work_item_id ??
            (rawWorkItem as { workItemId?: string }).workItemId ??
            null;

          if (!workItemId) continue;

          const workItemChecklistId =
            normalize(workItem.checklist_item_id) ??
            normalize((rawWorkItem as { checklistItemId?: string }).checklistItemId);
          
          const workItemTaskId = 
            normalize(workItem.task_id) ??
            normalize((rawWorkItem as { taskId?: string }).taskId);

          // For checklist items: match by checklistItemId
          if (item.source === "checklist") {
            if (targetChecklistId && workItemChecklistId === targetChecklistId) {
              console.log('✅ Found workItemId for checklist:', workItemId);
              return workItemId;
            }
          } 
          // For tasks: match by taskId AND ensure it's an atomic task (no checklist_item_id)
          else if (item.source === "task") {
            if (targetTaskId && workItemTaskId === targetTaskId && !workItemChecklistId) {
              console.log('✅ Found workItemId for atomic task:', workItemId);
              return workItemId;
            }
          }
        }
      }

      console.log('⚠️ Fallback: returning item.id:', item.id);
      return item.id ?? null;
    },
    [tasksQuery.data],
  );

  const { isLoading, isError, error, refetch } = tasksQuery;
  const { inProgress, planned, completed, doneCount, progressValue } = categories;

  const timer = useTodayTimer({
    items,
    onStartFocus: (item) => {
      if (item.status !== STATUS.IN_PROGRESS) {
        statusMutation.mutate({ item, status: STATUS.IN_PROGRESS });
      }
    },
    onComplete: async (item) => {
      if (item && item.status !== STATUS.DONE) {
        statusMutation.mutate({ item, status: STATUS.DONE });
      }
      
      // NEW: Record focus session to stats
      if (item?.plannedMinutes) {
        try {
          await recordFocusSession(item.plannedMinutes);
          
          // Invalidate stats after recording
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          
          if (window.location.pathname === '/stats') {
            queryClient.refetchQueries({ queryKey: ['stats'] });
          }
        } catch (error) {
          console.error('Failed to record focus session:', error);
        }
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
    skipBreaks,
    setSkipBreaks,
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
      // Force immediate refetch of schedule queries - critical for status changes
      // When task/checklist status changes, schedule entry status may also change
      // Using refetchQueries instead of invalidateQueries to bypass staleTime
      queryClient.refetchQueries({ 
        queryKey: SCHEDULE_QUERY_KEY,
        type: "active"
      });
      
      // NEW: Invalidate stats when task/checklist status changes
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Refetch only if on stats page
      if (window.location.pathname === '/stats') {
        queryClient.refetchQueries({ queryKey: ['stats'] });
      }
    },
    onSettled: () => {
      setPendingStatusId(null);
    },
  });

  const quickAddMutation = useMutation<TaskRecord, unknown, string, QuickAddMutationContext>({
    mutationFn: async (title) => {
      const response = await api.post("/tasks/create", { title, priority: DEFAULT_VALUES.DEFAULT_PRIORITY });
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
        priority: DEFAULT_VALUES.DEFAULT_PRIORITY,
        status: STATUS.PLANNED,
        derived_status: STATUS.PLANNED,
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
      // Backend accepts work_id as workItemId
      // For checklist items: work_id = checklist_item_id
      // For atomic tasks: work_id = atomic_task_id
      const payload = {
        workItemId,  // Always send workItemId (work_id from backend)
        startAt,
        plannedMinutes,
        status: STATUS.PLANNED,
      };
      
      console.log('📤 POST /schedule-entries payload:', payload);
      
      await api.post("/schedule-entries", payload);
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      // Force immediate refetch of ALL active schedule queries (Today, Planner, Upcoming)
      // This fixes the stale cache issue - data updates instantly without waiting for 5min staleTime
      queryClient.refetchQueries({ 
        queryKey: SCHEDULE_QUERY_KEY, 
        type: "active" 
      });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setScheduleModalOpen(false);
      setSelectedItem(null);
      setIsEditingSchedule(false);
    },
  });

  const updateScheduleMutation = useMutation<void, unknown, { workItemId: string; startAt: string; plannedMinutes: number }>({
    mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
      console.log('📤 PATCH /schedule-entries/by-work-item/' + workItemId, { startAt, plannedMinutes });
      await api.patch(`/schedule-entries/by-work-item/${workItemId}`, {
        startAt,
        plannedMinutes,
      });
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      // Force immediate refetch of ALL active schedule queries (Today, Planner, Upcoming)
      // This fixes the stale cache issue - data updates instantly without waiting for 5min staleTime
      queryClient.refetchQueries({ 
        queryKey: SCHEDULE_QUERY_KEY, 
        type: "active" 
      });
      // Invalidate ALL queries (including inactive ones like Tasks page)
      queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_QUERY_KEY,
        refetchType: "none"
      });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setScheduleModalOpen(false);
      setSelectedItem(null);
      setIsEditingSchedule(false);
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
  const _handleStatusChange = useCallback(
    (item: TodayItem, nextStatus: StatusValue) => {
      statusMutation.mutate({ item, status: nextStatus });
    },
    [statusMutation],
  );


  const openTimer = useCallback((item: TodayItem) => {
    const minutes = item.plannedMinutes && item.plannedMinutes > 0 ? item.plannedMinutes : getDefaultFocusDuration();
    setCustomDuration(minutes);
    timer.openTimer(item);
  }, [timer, setCustomDuration]);

  // Handler for task selection from dropdown in timer
  const handleTaskSelect = useCallback((task: TodayItem) => {
    const minutes = task.plannedMinutes && task.plannedMinutes > 0 ? task.plannedMinutes : getDefaultFocusDuration();
    setCustomDuration(minutes);
    timer.openTimer(task);
  }, [timer, setCustomDuration]);

  // Timer close confirmation handlers
  const handleTimerClose = useCallback(() => {
    // Chỉ hỏi xác nhận nếu timer đã bắt đầu (đang chạy hoặc đã đếm lùi)
    const hasProgress = timerRemain < timerDuration;
    if (!timerRunning && !hasProgress) {
      // Chưa bắt đầu: đóng ngay không hỏi
      closeTimer();
      return;
    }
    setConfirmStopOpen(true);
  }, [timerRunning, timerRemain, timerDuration, closeTimer]);

  // Guarded navigation: confirm when leaving page with active/progress timer
  const guardedNavigate = useCallback((path: string) => {
    const hasProgress = timerRemain < timerDuration;
    if (timerRunning || hasProgress) {
      setPendingNavPath(path);
      setConfirmStopOpen(true);
      return;
    }
    onNavigate?.(path);
  }, [onNavigate, timerRunning, timerRemain, timerDuration]);

  const handleConfirmStop = useCallback(() => {
    closeTimer();
    setConfirmStopOpen(false);
    if (pendingNavPath) {
      const target = pendingNavPath;
      setPendingNavPath(null);
      onNavigate?.(target);
    }
  }, [closeTimer, pendingNavPath, onNavigate]);

  const handleCancelStop = useCallback(() => {
    setConfirmStopOpen(false);
  }, []);

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
    
    // Check if item already has a schedule entry
    const existingEntry = findScheduleEntry(item);
    
    if (existingEntry && (existingEntry.id || existingEntry.schedule_id)) {
      // EDIT MODE: Item already has schedule
      // No need to store entryId anymore - we'll use workItemId for update
      setIsEditingSchedule(true);
      // Convert UTC time from backend to LOCAL time for input
      const utcDate = new Date(existingEntry.start_at);
      const year = utcDate.getFullYear();
      const month = String(utcDate.getMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getDate()).padStart(2, '0');
      const hours = String(utcDate.getHours()).padStart(2, '0');
      const minutes = String(utcDate.getMinutes()).padStart(2, '0');
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('✏️ EDIT MODE - UTC from backend:', existingEntry.start_at, '→ Local time for input:', localTimeString);
      setScheduleStartAt(localTimeString);
      setScheduleMinutes(existingEntry.planned_minutes ?? existingEntry.plannedMinutes ?? DEFAULT_VALUES.FOCUS_DURATION_MINUTES);
    } else {
      // CREATE MODE: Item doesn't have schedule
      setIsEditingSchedule(false);
      // Set default start time to current LOCAL time (not UTC)
      const now = new Date();
      // Format to YYYY-MM-DDThh:mm for datetime-local input
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('➕ CREATE MODE - Current local time:', new Date(), '→ Input value:', localTimeString);
      setScheduleStartAt(localTimeString);
      setScheduleMinutes(item.plannedMinutes ?? DEFAULT_VALUES.FOCUS_DURATION_MINUTES);
    }
    
    setScheduleModalOpen(true);
  }, [findScheduleEntry]);

  const createSchedule = useCallback(() => {
    if (!selectedItem) return;

    const startAtDate = new Date(scheduleStartAt);
    if (Number.isNaN(startAtDate.getTime())) {
      setStatusError("Please choose a valid start time.");
      return;
    }

    console.log('📝 createSchedule called:', {
      isEditingSchedule,
      selectedItem: {
        id: selectedItem.id,
        source: selectedItem.source,
        taskId: selectedItem.taskId,
        checklistItemId: selectedItem.checklistItemId,
        title: selectedItem.title,
        startAt: selectedItem.startAt
      }
    });

    // Get work item ID for both CREATE and UPDATE
    const workItemId = resolveWorkItemId(selectedItem);
    console.log('Work Item ID:', workItemId);
    
    if (!workItemId) {
      setStatusError("Unable to schedule this item right now. Please try again later.");
      return;
    }

    // Decide between UPDATE and CREATE
    if (isEditingSchedule) {
      // UPDATE existing schedule entry using new optimized endpoint
      console.log('✏️ UPDATE mode with workItemId:', workItemId);
      updateScheduleMutation.mutate({
        workItemId,
        startAt: startAtDate.toISOString(),
        plannedMinutes: scheduleMinutes,
      });
    } else {
      // CREATE new schedule entry
      console.log('➕ CREATE mode with workItemId:', workItemId);
      scheduleMutation.mutate({
        workItemId,
        startAt: startAtDate.toISOString(),
        plannedMinutes: scheduleMinutes,
      });
    }
  }, [
    selectedItem,
    scheduleStartAt,
    scheduleMinutes,
    isEditingSchedule,
    scheduleMutation,
    updateScheduleMutation,
    resolveWorkItemId
  ]);

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
    // ✅ Phân biệt task vs checklist item (giống TasksPage)
    if (item.source === "checklist" && item.checklistItemId) {
      // Tìm RAW checklist item và parent task từ tasksQuery
      // Vì TodayItem đã merge deadline/priority, cần lấy giá trị gốc
      const parentTask = tasksQuery.data?.items.find(t => t.task_id === item.taskId);
      const rawChecklistItem = parentTask?.checklist?.find(ci => 
        ci.checklist_item_id === item.checklistItemId || 
        (ci as any).id === item.checklistItemId  // Fallback cho 'id'
      );
      
      console.log('🔍 Debug edit modal:', {
        checklistItemId: item.checklistItemId,
        taskId: item.taskId,
        parentTask: parentTask ? { task_id: parentTask.task_id, checklist_count: parentTask.checklist?.length } : null,
        rawChecklistItem: rawChecklistItem ? { id: rawChecklistItem.checklist_item_id, title: rawChecklistItem.title } : null,
      });
      
      // Dùng RAW checklist item nếu tìm thấy, nếu không fallback sang TodayItem
      const checklistItem: ChecklistItemRecord = rawChecklistItem ? {
        checklist_item_id: item.checklistItemId,
        task_id: item.taskId || "",
        title: rawChecklistItem.title,
        status: rawChecklistItem.status,
        order_index: rawChecklistItem.order_index || 0,
        deadline: rawChecklistItem.deadline || undefined,  // GỐC - chưa merge
        priority: rawChecklistItem.priority || undefined,  // GỐC - chưa merge
        created_at: rawChecklistItem.created_at || "",
        updated_at: rawChecklistItem.updated_at || "",
      } : {
        // ⚠️ Fallback: Không tìm thấy raw, dùng TodayItem (đã merge)
        // Checkbox sẽ không chính xác nhưng ít nhất modal vẫn mở được
        checklist_item_id: item.checklistItemId,
        task_id: item.taskId || "",
        title: item.title,
        status: item.status,
        order_index: 0,
        deadline: undefined,  // Để undefined để checkbox auto-tích
        priority: undefined,  // Để undefined để checkbox auto-tích
        created_at: "",
        updated_at: "",
      };
      
      setEditingChecklistItem(checklistItem);
      
      // Parent task deadline/priority
      setEditingItem(parentTask ? {
        ...item,
        deadline: parentTask.deadline || null,
        priority: parentTask.priority || null,
      } : item);
      
      setChecklistItemModalOpen(true);
    } else if (item.source === "task" && item.taskId) {
      // Mở EditTaskModal cho task
      setEditingItem(item);
      setEditTitle(item.title);
      setEditDescription(""); // We don't have description in TodayItem, so start empty
      setEditDeadline(item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : "");
      setEditPriority(item.priority);
      setEditModalOpen(true);
    }
  }, [tasksQuery.data]);

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

  // Handler cho checklist item submit (giống TasksPage)
  const handleChecklistItemSubmit = useCallback(async (data: Partial<ChecklistItemRecord>) => {
    if (!editingChecklistItem) return;
    
    try {
      await api.patch(`/checklist-items/${editingChecklistItem.checklist_item_id}`, {
        title: data.title,
        deadline: data.deadline,
        priority: data.priority,
      });
      
      // Refetch data
      await queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      await queryClient.refetchQueries({ queryKey: ['tasks', userId], type: 'active' });
      
      setChecklistItemModalOpen(false);
      setEditingChecklistItem(null);
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  }, [editingChecklistItem, userId, queryClient]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {!isFullscreen && <NavigationBar onNavigate={guardedNavigate} activeNav="today" />}
        
        {/* Hero Section with Lazy Loading Wallpaper */}
        <WallpaperBackground
          imagePath="/images/wallpapers/clear-lake-mountains-sunrays-water-reflection-4k-desktop.jpg"
          mobileImagePath="/images/wallpapers/clear-lake-mountains-sunrays-water-reflection-4k-mobile.jpg"
          className="mb-4"
        >
          <div className="py-12">
            <div className="mx-auto max-w-6xl px-6">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4">
                  <div className="text-sm font-medium tracking-wider text-white/90 uppercase drop-shadow-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-xl">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] ?? 'there'}
                  </h1>
                  <div className="h-1 w-24 bg-gradient-to-r from-white/80 to-white/60 rounded-full shadow-lg"></div>
                  <p className="text-lg font-medium text-white/95 drop-shadow-lg">
                    Let's focus on what matters today.
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => timer.openTimer()}
                    className="rounded-xl bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md px-8 py-4 text-white border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:border-white/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⏱</span>
                      <span className="font-medium">Start Focus</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </WallpaperBackground>
          
      <main className="mx-auto max-w-6xl px-6 py-6">

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
            icon="📋"
            iconBg="bg-blue-50"
            iconText="text-blue-600"
            countBg="bg-blue-50"
            countText="text-blue-600"
            items={planned}
            isLoading={isLoading}
            onStart={openTimer}
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
            icon="⏳"
            iconBg="bg-amber-50"
            iconText="text-amber-600"
            countBg="bg-amber-50"
            countText="text-amber-600"
            items={inProgress}
            isLoading={isLoading}
            onStart={openTimer}
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
            icon="✓"
            iconBg="bg-green-50"
            iconText="text-green-600"
            countBg="bg-green-50"
            countText="text-green-600"
            items={completed}
            isLoading={isLoading}
            onStart={undefined}
            onSchedule={openScheduleModal}
            onChecklist={undefined}
            onEdit={openEditModal}
            onStatusModal={openStatusModal}
            isUpdating={(itemId) => statusMutation.isPending && pendingStatusId === itemId}
            className="lg:col-span-1"
          />
                      </div>
      </main>
      </div>
      {/* Calm Quick Add */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Panel - absolute positioned above the button */}
        <div className="absolute bottom-20 right-0">
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
        </div>
        
        {/* + Button - always stays at bottom-right corner */}
        <button
          type="button"
          onClick={() => {
            setQuickOpen((prev) => !prev);
            window.setTimeout(() => {
              if (!quickOpen) {
                quickRef.current?.focus();
              }
            }, TIMER_INTERVALS.FOCUS_INPUT_DELAY_MS);
          }}
          className={`
            rounded-lg bg-blue-600 p-4 text-white shadow-lg
            transition-all duration-300 ease-in-out
            hover:bg-blue-700 hover:shadow-xl
            ${quickOpen 
              ? 'opacity-0 scale-75 pointer-events-none' 
              : 'opacity-100 scale-100'
            }
          `}
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
          <FloatingWidget onRequestClose={handleTimerClose} />
        </DndContext>
      )}

      {isFullscreen && (
        <FocusTimerFullscreen
          isDarkTheme={isDarkTheme}
          currentSession={currentSession}
          sessionPlan={sessionPlan}
          timerRemain={timerRemain}
          timerDuration={timerDuration}
          timerRunning={timerRunning}
          skipBreaks={skipBreaks}
          onToggleRunning={() => setTimerRunning(!timerRunning)}
          onEnterFloatingMode={enterFloatingMode}
          onClose={handleTimerClose}
          onToggleTheme={() => timer.setIsDarkTheme(!isDarkTheme)}
        />
      )}

      {timerOpen && !isFullscreen && !isFloating && (
        <FocusTimerBottomSheet
          timerAnimating={timerAnimating}
          timerItem={timerItem}
          timerRunning={timerRunning}
          timerRemain={timerRemain}
          customDuration={customDuration}
          skipBreaks={skipBreaks}
          availableTasks={items}
          onClose={handleTimerClose}
          onSetCustomDuration={setCustomDuration}
          onStartCustomDuration={startCustomDuration}
          onSetTimerRunning={setTimerRunning}
          onSkipBreaksChange={setSkipBreaks}
          onTaskSelect={handleTaskSelect}
        />
      )}

      <ConfirmStopSessionModal
        open={confirmStopOpen}
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />

      <ScheduleModal
        open={scheduleModalOpen}
        selectedItem={selectedItem}
        startAt={scheduleStartAt}
        minutes={scheduleMinutes}
        onStartAtChange={setScheduleStartAt}
        onMinutesChange={setScheduleMinutes}
        onSave={createSchedule}
        onCancel={() => setScheduleModalOpen(false)}
        loading={scheduleMutation.isPending || updateScheduleMutation.isPending}
        isEditMode={isEditingSchedule}
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

      {/* Checklist Item Modal (giống TasksPage) */}
      <ChecklistItemModal
        isOpen={checklistItemModalOpen}
        onClose={() => {
          setChecklistItemModalOpen(false);
          setEditingChecklistItem(null);
          setEditingItem(null);
        }}
        onSubmit={handleChecklistItemSubmit}
        item={editingChecklistItem}
        taskDeadline={editingItem?.deadline || undefined}
        taskPriority={editingItem?.priority || undefined}
        isLoading={false}
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


import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import type { 
  TaskRecord, 
  TaskFilters, 
  StatusValue, 
  PriorityValue,
  ChecklistItemRecord
} from "../../lib";
import { STATUS } from "../../lib";
import { useTasksData } from "./hooks/useTasksData";
import { useTasksMutations } from "./hooks/useTasksMutations";
import { getDefaultFocusDuration } from "../schedule/constants";
import { SCHEDULE_QUERY_KEY } from "../schedule/hooks/useScheduleData";
import api from "../../lib/api";
import { 
  NavigationBar, 
  TaskModal, 
  ChecklistItemModal,
  ScheduleModal,
  SystemError
} from "../../components/ui";
import AISuggestionsModal from "../../../components/AISuggestionsModal/index.tsx";
import {
  TaskStatusModal,
  TaskListView
} from "./components";
import { TaskDisplayBoardView } from "./components/TaskDisplayBoardView";

// Main Tasks Page Component
export default function TasksPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    status: 'all',
    priority: 'all',
    page: 1,
    pageSize: 20,
  });
  const [view, setView] = useState<'list' | 'board'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTask, setStatusModalTask] = useState<TaskRecord | null>(null);
  const [pendingStatusId] = useState<string | null>(null);
  
  // Checklist item modal state
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItemRecord | null>(null);
  const [checklistModalTaskId, setChecklistModalTaskId] = useState<string | null>(null);
  
  // Checklist item status modal state
  const [checklistStatusModalOpen, setChecklistStatusModalOpen] = useState(false);
  const [checklistStatusModalItem, setChecklistStatusModalItem] = useState<ChecklistItemRecord | null>(null);
  const [pendingChecklistItemId, setPendingChecklistItemId] = useState<string | null>(null);

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingItem, setSchedulingItem] = useState<TaskRecord | ChecklistItemRecord | null>(null);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleMinutes, setScheduleMinutes] = useState(getDefaultFocusDuration());
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  // AI Suggestions modal state
  const [aiSuggestionsModalOpen, setAiSuggestionsModalOpen] = useState(false);

  // Data fetching
  const { tasksByStatus, tasks, isLoading, error, refetch } = useTasksData(user?.id || null, filters);
  
  // Mutations
  const {
    createTask,
    updateTask,
    updateChecklistItem,
    deleteTask,
    createChecklistItem,
    deleteChecklistItem,
    reorderChecklistItem,
    changeChecklistItemStatus,
    isCreating,
    isUpdating,
    isUpdatingChecklist,
  } = useTasksMutations(user?.id || null);

  // Schedule mutations - CREATE
  const scheduleMutation = useMutation<void, unknown, { workItemId: string; startAt: string; plannedMinutes: number }>({
    mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
      const payload = {
        workItemId,
        startAt,
        plannedMinutes,
        status: STATUS.PLANNED,
      };
      console.log('📤 POST /schedule-entries payload:', payload);
      await api.post("/schedule-entries", payload);
    },
    onSuccess: () => {
      // Refetch active queries (current page)
      queryClient.refetchQueries({ 
        queryKey: SCHEDULE_QUERY_KEY, 
        type: "active" 
      });
      // Invalidate ALL queries (including inactive ones like Today page)
      // This ensures Today page will refetch when user navigates back
      queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_QUERY_KEY,
        refetchType: "none" // Don't refetch immediately, just mark as stale
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id] });
      setScheduleModalOpen(false);
      setSchedulingItem(null);
      setIsEditingSchedule(false);
    },
  });

  // Schedule mutations - UPDATE (using new optimized endpoint ⭐)
  const updateScheduleMutation = useMutation<void, unknown, { workItemId: string; startAt: string; plannedMinutes: number }>({
    mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
      console.log('📤 PATCH /schedule-entries/by-work-item/' + workItemId, { startAt, plannedMinutes });
      await api.patch(`/schedule-entries/by-work-item/${workItemId}`, {
        startAt,
        plannedMinutes,
      });
    },
    onSuccess: () => {
      // Refetch active queries (current page)
      queryClient.refetchQueries({ 
        queryKey: SCHEDULE_QUERY_KEY, 
        type: "active" 
      });
      // Invalidate ALL queries (including inactive ones like Today page)
      // This ensures Today page will refetch when user navigates back
      queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_QUERY_KEY,
        refetchType: "none" // Don't refetch immediately, just mark as stale
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id] });
      setScheduleModalOpen(false);
      setSchedulingItem(null);
      setIsEditingSchedule(false);
    },
  });

  // Handlers
  const handleCreateTask = useCallback((taskData: Partial<TaskRecord>) => {
    createTask(taskData);
        setModalOpen(false);
        setEditingTask(null);
  }, [createTask]);

  const handleUpdateTask = useCallback((taskData: Partial<TaskRecord>, taskId?: string) => {
    const targetTaskId = taskId || (editingTask ? ((editingTask as any).id || editingTask.task_id) : undefined);
    if (targetTaskId) {
      updateTask(targetTaskId, taskData);
          setModalOpen(false);
          setEditingTask(null);
    } else {
      console.error('No task ID provided for update');
    }
  }, [editingTask, updateTask]);

  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);


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

  const handleEditTask = useCallback((task: TaskRecord) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleChecklist = useCallback((_task: TaskRecord) => {
    // TODO: Implement checklist functionality
    console.log("Checklist functionality coming soon!");
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

  const handleDeleteChecklistItem = useCallback((itemId: string) => {
    if (!itemId) return;
    if (confirm('Are you sure you want to delete this checklist item?')) {
      deleteChecklistItem(itemId);
    }
  }, [deleteChecklistItem]);


  const handleChecklistItemSubmit = useCallback((data: Partial<ChecklistItemRecord>) => {
    if (editingChecklistItem) {
      updateChecklistItem(editingChecklistItem.checklist_item_id, data);
    } else if (checklistModalTaskId) {
      createChecklistItem(checklistModalTaskId, data);
    } else {
      console.error('No taskId for creating checklist item');
    }
    // Close modal immediately for better UX
    setChecklistModalOpen(false);
    setEditingChecklistItem(null);
    setChecklistModalTaskId(null);
  }, [editingChecklistItem, checklistModalTaskId, createChecklistItem, updateChecklistItem]);

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: StatusValue) => {
    handleUpdateTask({ status: newStatus }, taskId);
  }, [handleUpdateTask]);

  const handleChecklistItemStatusChange = useCallback((itemId: string, newStatus: StatusValue) => {
    changeChecklistItemStatus(itemId, newStatus);
  }, [changeChecklistItemStatus]);

  const openChecklistStatusModal = useCallback((item: ChecklistItemRecord) => {
    setChecklistStatusModalItem(item);
    setChecklistStatusModalOpen(true);
  }, []);

  const handleChecklistStatusModalChange = useCallback((newStatus: StatusValue) => {
    if (!checklistStatusModalItem) return;
    
    setPendingChecklistItemId(checklistStatusModalItem.checklist_item_id);
    changeChecklistItemStatus(checklistStatusModalItem.checklist_item_id, newStatus);
    setChecklistStatusModalOpen(false);
    setChecklistStatusModalItem(null);
    setPendingChecklistItemId(null);
  }, [checklistStatusModalItem, changeChecklistItemStatus]);

  const handleChecklistItemReorder = useCallback((itemId: string, targetOrder: number) => {
    reorderChecklistItem(itemId, targetOrder);
  }, [reorderChecklistItem]);

  // Schedule handlers
  const openScheduleModal = useCallback((item: TaskRecord | ChecklistItemRecord) => {
    console.log('📅 openScheduleModal called with item:', {
      title: item.title,
      start_at: item.start_at,
      planned_minutes: item.planned_minutes,
      isChecklistItem: 'checklist_item_id' in item
    });
    
    setSchedulingItem(item);
    
    // Check if item already has schedule
    const existingStartAt = item.start_at;
    const existingMinutes = item.planned_minutes;
    
    if (existingStartAt && existingMinutes) {
      // EDIT MODE: Item already has schedule
      console.log('✏️ EDIT MODE - Loading existing schedule');
      setIsEditingSchedule(true);
      
      const utcDate = new Date(existingStartAt);
      const year = utcDate.getFullYear();
      const month = String(utcDate.getMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getDate()).padStart(2, '0');
      const hours = String(utcDate.getHours()).padStart(2, '0');
      const minutes = String(utcDate.getMinutes()).padStart(2, '0');
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('Existing schedule:', { startAt: localTimeString, minutes: existingMinutes });
      setScheduleStartAt(localTimeString);
      setScheduleMinutes(existingMinutes);
    } else {
      // CREATE MODE: Item doesn't have schedule
      console.log('➕ CREATE MODE - Setting default schedule');
      setIsEditingSchedule(false);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      setScheduleStartAt(localTimeString);
      setScheduleMinutes(getDefaultFocusDuration());
    }
    
    setScheduleModalOpen(true);
  }, []);

  const handleScheduleSave = useCallback(() => {
    if (!schedulingItem) return;

    const startAtDate = new Date(scheduleStartAt);
    if (Number.isNaN(startAtDate.getTime())) {
      console.error("Invalid start time");
      return;
    }

    const isChecklistItem = 'checklist_item_id' in schedulingItem;
    
    // Get workItemId (checklist_item_id or task_id)
    const workItemId = isChecklistItem 
      ? schedulingItem.checklist_item_id 
      : (schedulingItem as any).id || schedulingItem.task_id;
    
    console.log('💾 handleScheduleSave called:', {
      isChecklistItem,
      workItemId,
      startAt: startAtDate.toISOString(),
      planned_minutes: scheduleMinutes,
      isEditMode: isEditingSchedule,
    });
    
    if (isEditingSchedule) {
      // UPDATE existing schedule entry using new optimized endpoint
      console.log('✏️ Updating existing schedule entry for work item:', workItemId);
      updateScheduleMutation.mutate({
        workItemId,
        startAt: startAtDate.toISOString(),
        plannedMinutes: scheduleMinutes,
      });
    } else {
      // CREATE new schedule entry
      console.log('➕ Creating new schedule entry for:', workItemId);
      scheduleMutation.mutate({
        workItemId,
        startAt: startAtDate.toISOString(),
        plannedMinutes: scheduleMinutes,
      });
    }
  }, [
    schedulingItem, 
    scheduleStartAt, 
    scheduleMinutes, 
    isEditingSchedule,
    scheduleMutation,
    updateScheduleMutation
  ]);

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

  // AI Suggestions handlers
  const handleAISuggestionsSuccess = useCallback((scheduleEntryId: string) => {
    console.log('AI Suggestion accepted, schedule entry created:', scheduleEntryId);
    
    // Refresh tasks data
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id] });
    queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    
    // Close modal
    setAiSuggestionsModalOpen(false);
    
    // Show success message
    alert(`✅ AI suggestion accepted! Schedule entry created: ${scheduleEntryId}`);
  }, [queryClient, user?.id]);

  const handleAISuggestionsClose = useCallback(() => {
    setAiSuggestionsModalOpen(false);
  }, []);


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
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
    if (!tasks.length) return null;
    
    return {
      total: tasks.length,
      planned: tasksByStatus.planned.length,
      inProgress: tasksByStatus.inProgress.length,
      done: tasksByStatus.done.length,
      skipped: tasksByStatus.skipped.length,
    };
  }, [tasks, tasksByStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <NavigationBar onNavigate={onNavigate} activeNav="tasks" />
      
        {/* Hero Section with Background Image */}
        <section className="relative mb-4 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/clear-lake-mountains-sunrays-water-reflection-4k.jpg)',
            backgroundSize: 'cover'
          }}
        ></div>
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-8 left-8 w-24 h-24 bg-gradient-to-br from-white/10 to-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-16 right-12 w-16 h-16 bg-gradient-to-br from-white/10 to-purple-200/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-8 left-1/4 w-12 h-12 bg-gradient-to-br from-white/10 to-cyan-200/20 rounded-full blur-md animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Hero Content - Only Header */}
        <div className="relative z-10 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium tracking-wider text-white/90 uppercase drop-shadow-sm mb-2">
                  Task Management
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-xl">
                  Tasks
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setAiSuggestionsModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-blue-500/80 to-indigo-600/80 backdrop-blur-md px-8 py-4 text-white border border-blue-400/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:from-blue-600/90 hover:to-indigo-700/90 hover:border-blue-500/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🤖</span>
                    <span className="font-medium">AI Sắp lịch</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md px-8 py-4 text-white border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:border-white/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">+</span>
                    <span className="font-medium">New Task</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="mx-auto max-w-7xl px-6 py-4 space-y-6">
        {/* Filters and View Toggle below wallpaper */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as StatusValue | 'all' })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="skipped">Skipped</option>
              </select>
              
              {/* Priority Filter */}
              <select
                value={filters.priority || 'all'}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value as PriorityValue | 'all' })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === 'list' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setView('board')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === 'board' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Board
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Task Stats Cards */}
        {taskStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{taskStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Planned</p>
                  <p className="text-2xl font-bold text-slate-900">{taskStats.planned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-slate-900">{taskStats.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Done</p>
                  <p className="text-2xl font-bold text-slate-900">{taskStats.done}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Skipped</p>
                  <p className="text-2xl font-bold text-slate-900">{taskStats.skipped}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
        <TaskListView
          tasks={tasks}
          filters={filters}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={openStatusModal}
          onStart={handleStart}
          onSchedule={openScheduleModal}
          onAddChecklist={handleAddChecklist}
          onEditChecklistItem={handleEditChecklistItem}
          onDeleteChecklistItem={handleDeleteChecklistItem}
          onChecklistItemStatusChange={handleChecklistItemStatusChange}
          onChecklistItemOpenStatusModal={openChecklistStatusModal}
          onChecklistItemReorder={handleChecklistItemReorder}
          isChecklistItemUpdating={(itemId: string) => pendingChecklistItemId === itemId}
          onCreateTask={() => setModalOpen(true)}
        />
      ) : (
        <TaskDisplayBoardView
          tasks={tasks}
          isUpdating={false}
          pendingStatusId={null}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={openStatusModal}
          onDragStatusChange={handleTaskStatusChange}
          onChecklist={handleChecklist}
          onSchedule={openScheduleModal}
          onChecklistItemStatusChange={openChecklistStatusModal}
          onDragChecklistItemStatusChange={handleChecklistItemStatusChange}
        />
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        task={editingTask}
        isLoading={isCreating || isUpdating}
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
        taskDeadline={tasks.find(t => t.task_id === checklistModalTaskId)?.deadline}
        taskPriority={tasks.find(t => t.task_id === checklistModalTaskId)?.priority}
        isLoading={false} // TODO: Add loading state for checklist operations
      />

      <TaskStatusModal
        open={statusModalOpen}
        task={statusModalTask}
        onStatusSelect={handleStatusModalChange}
        onClose={() => setStatusModalOpen(false)}
      />

      {/* Checklist Item Status Modal */}
      <TaskStatusModal
        open={checklistStatusModalOpen}
        task={checklistStatusModalItem}
        onStatusSelect={handleChecklistStatusModalChange}
        onClose={() => {
          setChecklistStatusModalOpen(false);
          setChecklistStatusModalItem(null);
        }}
        title="Change Checklist Item Status"
      />

      {/* Schedule Modal */}
      <ScheduleModal
        open={scheduleModalOpen}
        item={schedulingItem}
        startAt={scheduleStartAt}
        minutes={scheduleMinutes}
        onStartAtChange={setScheduleStartAt}
        onMinutesChange={setScheduleMinutes}
        onSave={handleScheduleSave}
        onCancel={() => {
          setScheduleModalOpen(false);
          setSchedulingItem(null);
        }}
        loading={scheduleMutation.isPending || updateScheduleMutation.isPending}
        isEditMode={isEditingSchedule}
      />

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        isOpen={aiSuggestionsModalOpen}
        onClose={handleAISuggestionsClose}
        onSuccess={handleAISuggestionsSuccess}
      />
      </div>
    </div>
  );
}



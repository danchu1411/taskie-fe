import React, { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { 
  TaskRecord, 
  TaskFilters, 
  StatusValue, 
  PriorityValue,
  ChecklistItemRecord
} from "../../lib";
import { STATUS, clsx } from "../../lib";
import { useTasksData } from "./hooks/useTasksData";
import { useTasksMutations } from "./hooks/useTasksMutations";
import { 
  NavigationBar, 
  TaskModal, 
  ChecklistItemModal,
  BoardView,
  Button,
  Input,
  SystemError,
  TaskCard
} from "../../components/ui";






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
  const [pendingStatusId] = useState<string | null>(null);
  
  // Checklist item modal state
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItemRecord | null>(null);
  const [checklistModalTaskId, setChecklistModalTaskId] = useState<string | null>(null);

  // Data fetching
  const { tasksByStatus, tasks, isLoading, error, refetch } = useTasksData(user?.id || null, filters);
  
  // Mutations
  const {
    createTask,
    updateTask,
    deleteTask,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklistItem,
    changeTaskStatus,
    changeChecklistItemStatus,
    isCreating,
    isUpdating,
  } = useTasksMutations(user?.id || null);

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

  // Direct status change used by BoardView DnD (no modal)
  const handleBoardDropStatusChange = useCallback((taskWithNewStatus: TaskRecord) => {
    changeTaskStatus(taskWithNewStatus, taskWithNewStatus.status);
  }, [changeTaskStatus]);

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

  const handleChecklistItemStatusChange = useCallback((itemId: string, newStatus: StatusValue) => {
    changeChecklistItemStatus(itemId, newStatus);
  }, [changeChecklistItemStatus]);

  const handleChecklistItemReorder = useCallback((itemId: string, targetOrder: number) => {
    reorderChecklistItem(itemId, targetOrder);
  }, [reorderChecklistItem]);

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
          {tasks.map((task) => (
            <TaskCard
              key={(task as any).id || task.task_id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={openStatusModal}
              isUpdating={isUpdating && pendingStatusId === ((task as any).id || task.task_id)}
              onStart={handleStart}
              onAddChecklist={handleAddChecklist}
              onEditChecklistItem={handleEditChecklistItem}
              onDeleteChecklistItem={handleDeleteChecklistItem}
              onChecklistItemStatusChange={handleChecklistItemStatusChange}
              onChecklistItemReorder={handleChecklistItemReorder}
            />
          ))}
          {tasks.length === 0 && (
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
          isUpdating={isUpdating}
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
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { 
  TaskRecord, 
  TaskFilters, 
  StatusValue, 
  ChecklistItemRecord
} from "../../lib";
import { useTasksData } from "./hooks/useTasksData";
import { useTasksMutations } from "./hooks/useTasksMutations";
import { 
  NavigationBar, 
  TaskModal, 
  ChecklistItemModal,
  SystemError,
  TaskToolbar,
  TaskStatusModal,
  TaskListView,
  TaskBoardView
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
        <TaskToolbar
          filters={filters}
          onFilterChange={setFilters}
          onCreate={() => setModalOpen(true)}
          currentView={view}
          onViewChange={setView}
          taskStats={taskStats}
        />


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
          onAddChecklist={handleAddChecklist}
          onEditChecklistItem={handleEditChecklistItem}
          onDeleteChecklistItem={handleDeleteChecklistItem}
          onChecklistItemStatusChange={handleChecklistItemStatusChange}
          onChecklistItemReorder={handleChecklistItemReorder}
          onCreateTask={() => setModalOpen(true)}
        />
      ) : view === 'board' ? (
        <TaskBoardView
          tasksByStatus={tasksByStatus}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={handleBoardDropStatusChange}
          onChecklist={handleChecklist}
          onSchedule={handleSchedule}
          onStart={handleStart}
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

      <TaskStatusModal
        open={statusModalOpen}
        task={statusModalTask}
        onStatusSelect={handleStatusModalChange}
        onClose={() => setStatusModalOpen(false)}
      />
      </div>
    </div>
  );
}
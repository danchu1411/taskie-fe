import React from "react";
import type { TaskRecord, TaskFilters, ChecklistItemRecord, StatusValue } from "../../../lib";
import { TaskDisplayCard } from "../../../components/TaskDisplayCard";
import { TaskEmptyState } from "../../../components/ui";
import { transformTasksForDisplay, type TaskDisplayItem } from "../utils/transformTasksForDisplay";

export interface TaskDisplayListViewProps {
  tasks: TaskRecord[];
  filters: TaskFilters;
  isUpdating: boolean;
  pendingStatusId: string | null;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onStart: (task: TaskRecord) => void;
  onSchedule: (item: TaskRecord | ChecklistItemRecord) => void;
  onAddChecklist: (task: TaskRecord) => void;
  onEditChecklistItem: (item: ChecklistItemRecord) => void;
  onDeleteChecklistItem: (itemId: string) => void;
  onChecklistItemStatusChange: (itemId: string, newStatus: StatusValue) => void;
  onChecklistItemOpenStatusModal: (item: ChecklistItemRecord) => void;
  onChecklistItemReorder: (itemId: string, targetOrder: number) => void;
  isChecklistItemUpdating: (itemId: string) => boolean;
  onCreateTask: () => void;
}

export const TaskDisplayListView = React.memo(function TaskDisplayListView({
  tasks,
  filters,
  isUpdating,
  pendingStatusId,
  onEdit,
  onDelete,
  onStatusChange,
  onStart,
  onSchedule,
  onAddChecklist,
  onEditChecklistItem,
  onDeleteChecklistItem,
  onChecklistItemStatusChange,
  onChecklistItemOpenStatusModal,
  onChecklistItemReorder,
  isChecklistItemUpdating,
  onCreateTask,
}: TaskDisplayListViewProps) {
  // Transform tasks into display items
  const displayItems = React.useMemo(() => {
    return transformTasksForDisplay(tasks);
  }, [tasks]);

  const handleEdit = (item: TaskDisplayItem) => {
    if (item.source === "checklist" && item.originalChecklistItem) {
      onEditChecklistItem(item.originalChecklistItem);
    } else if (item.originalTask) {
      onEdit(item.originalTask);
    }
  };

  const handleDelete = (item: TaskDisplayItem) => {
    if (item.source === "checklist" && item.checklistItemId) {
      onDeleteChecklistItem(item.checklistItemId);
    } else if (item.taskId) {
      onDelete(item.taskId);
    }
  };

  const handleStatusChange = (item: TaskDisplayItem) => {
    if (item.source === "checklist" && item.originalChecklistItem) {
      onChecklistItemOpenStatusModal(item.originalChecklistItem);
    } else if (item.originalTask) {
      onStatusChange(item.originalTask);
    }
  };

  const handleSchedule = (item: TaskDisplayItem) => {
    if (item.source === "checklist" && item.originalChecklistItem) {
      onSchedule(item.originalChecklistItem);
    } else if (item.originalTask) {
      onSchedule(item.originalTask);
    }
  };

  const handleStart = (item: TaskDisplayItem) => {
    if (item.originalTask) {
      onStart(item.originalTask);
    }
  };

  if (displayItems.length === 0) {
    return (
      <TaskEmptyState
        onCreateTask={onCreateTask}
        searchTerm={filters.search}
        statusFilter={filters.status}
        priorityFilter={filters.priority}
      />
    );
  }

  return (
    <div className="space-y-2">
      {displayItems.map((item) => (
        <TaskDisplayCard
          key={item.id}
          item={item}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onSchedule={handleSchedule}
          onStart={handleStart}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
});


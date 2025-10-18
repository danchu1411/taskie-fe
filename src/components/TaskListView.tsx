import React from "react";
import type { TaskRecord, TaskFilters, ChecklistItemRecord, StatusValue } from "../lib";
import { TaskCard, TaskEmptyState } from "./ui";

export interface TaskListViewProps {
  tasks: TaskRecord[];
  filters: TaskFilters;
  isUpdating: boolean;
  pendingStatusId: string | null;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onStart?: (task: TaskRecord) => void;
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

export const TaskListView = React.memo(function TaskListView({
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
}: TaskListViewProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={(task as any).id || task.task_id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          isUpdating={isUpdating && pendingStatusId === ((task as any).id || task.task_id)}
          onStart={onStart}
          onSchedule={onSchedule}
          onAddChecklist={onAddChecklist}
          onEditChecklistItem={onEditChecklistItem}
          onDeleteChecklistItem={onDeleteChecklistItem}
          onChecklistItemStatusChange={onChecklistItemStatusChange}
          onChecklistItemOpenStatusModal={onChecklistItemOpenStatusModal}
          onChecklistItemReorder={onChecklistItemReorder}
          isChecklistItemUpdating={isChecklistItemUpdating}
        />
      ))}
      {tasks.length === 0 && (
        <TaskEmptyState
          filters={filters}
          onCreateTask={onCreateTask}
        />
      )}
    </div>
  );
});

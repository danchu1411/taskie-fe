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
  onStart: (task: TaskRecord) => void;
  onAddChecklist: (task: TaskRecord) => void;
  onEditChecklistItem: (item: ChecklistItemRecord) => void;
  onDeleteChecklistItem: (itemId: string) => void;
  onChecklistItemStatusChange: (itemId: string, newStatus: StatusValue) => void;
  onChecklistItemReorder: (itemId: string, targetOrder: number) => void;
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
  onAddChecklist,
  onEditChecklistItem,
  onDeleteChecklistItem,
  onChecklistItemStatusChange,
  onChecklistItemReorder,
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
          onAddChecklist={onAddChecklist}
          onEditChecklistItem={onEditChecklistItem}
          onDeleteChecklistItem={onDeleteChecklistItem}
          onChecklistItemStatusChange={onChecklistItemStatusChange}
          onChecklistItemReorder={onChecklistItemReorder}
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

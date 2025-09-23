import React from "react";
import type { TaskRecord } from "../lib";
import { BoardView } from "./ui";

export interface TaskBoardViewProps {
  tasksByStatus: {
    planned: TaskRecord[];
    inProgress: TaskRecord[];
    done: TaskRecord[];
    skipped: TaskRecord[];
  };
  isUpdating: boolean;
  pendingStatusId: string | null;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onChecklist: (task: TaskRecord) => void;
  onSchedule: (task: TaskRecord) => void;
  onStart: (task: TaskRecord) => void;
}

export const TaskBoardView = React.memo(function TaskBoardView({
  tasksByStatus,
  isUpdating,
  pendingStatusId,
  onEdit,
  onDelete,
  onStatusChange,
  onChecklist,
  onSchedule,
  onStart,
}: TaskBoardViewProps) {
  return (
    <BoardView
      tasksByStatus={tasksByStatus}
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusChange={onStatusChange}
      onChecklist={onChecklist}
      onSchedule={onSchedule}
      onStart={onStart}
      isUpdating={isUpdating}
      pendingStatusId={pendingStatusId}
    />
  );
});

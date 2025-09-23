import React from "react";
import type { TaskRecord, StatusValue } from "../lib";
import { STATUS, clsx } from "../lib";

export interface TaskStatusModalProps {
  open: boolean;
  task: TaskRecord | null;
  onStatusSelect: (status: StatusValue) => void;
  onClose: () => void;
}

export const TaskStatusModal = React.memo(function TaskStatusModal({
  open,
  task,
  onStatusSelect,
  onClose,
}: TaskStatusModalProps) {
  if (!open || !task) return null;

  const statusOptions = [
    { value: STATUS.PLANNED, label: "Planned", description: "Task is planned but not started" },
    { value: STATUS.IN_PROGRESS, label: "In Progress", description: "Currently working on this task" },
    { value: STATUS.DONE, label: "Done", description: "Task has been completed" },
    { value: STATUS.SKIPPED, label: "Skipped", description: "Task was skipped or cancelled" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Change Status</h3>
          <p className="text-sm text-slate-600">{task.title}</p>
        </div>
        
        <div className="space-y-2">
          {statusOptions.map((statusOption) => (
            <button
              key={statusOption.value}
              onClick={() => onStatusSelect(statusOption.value)}
              className={clsx(
                "w-full rounded-lg border p-3 text-left transition hover:bg-slate-50",
                task.status === statusOption.value
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
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

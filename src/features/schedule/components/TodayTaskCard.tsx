import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TodayItem, StatusValue } from "../hooks/useTodayData";

interface TodayTaskCardProps {
  item: TodayItem;
  isUpdating: boolean;
  onStatusChange: () => void;
  onEdit?: () => void;
  onChecklist?: () => void;
  onSchedule?: () => void;
  onStart?: () => void;
  onBack?: () => void;
}

function formatDateTime(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString(undefined, options ?? { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(value: StatusValue) {
  if (value === 1) return "In progress";
  if (value === 2) return "Done";
  if (value === 3) return "Skipped";
  return "Planned";
}

function priorityLabel(value: 1 | 2 | 3): string {
  switch (value) {
    case 1:
      return "Must";    // Fix: 1 = Must (same as TasksPage)
    case 2:
      return "Should";  // 2 = Should (same as TasksPage)
    case 3:
      return "Want";    // Fix: 3 = Want (same as TasksPage)
    default:
      return "";
  }
}

function getPriorityStyles(value: 1 | 2 | 3): string {
  switch (value) {
    case 1:
      return "text-red-600 font-semibold"; // Fix: 1 = Must (high priority - red, bold)
    case 2:
      return "text-blue-600"; // 2 = Should (medium priority - blue)
    case 3:
      return "text-slate-500"; // Fix: 3 = Want (low priority - grey)
    default:
      return "text-slate-500";
  }
}

const StatusChip = memo(function StatusChip({ 
  status, 
  onOpenModal, 
  disabled 
}: { 
  status: StatusValue; 
  onOpenModal: () => void; 
  disabled: boolean; 
}) {
  const getStatusStyles = (status: StatusValue) => {
    switch (status) {
      case 1: // IN_PROGRESS
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 2: // DONE
        return "bg-green-100 text-green-800 border-green-200";
      case 3: // SKIPPED
        return "bg-slate-100 text-slate-800 border-slate-200";
      default: // PLANNED
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <button
      type="button"
      onClick={onOpenModal}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50 ${getStatusStyles(status)}`}
      title={`Status: ${statusLabel(status)}`}
      aria-label={`Change status from ${statusLabel(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {statusLabel(status)}
    </button>
  );
});

export const TodayTaskCard = memo(function TodayTaskCard({
  item,
  isUpdating,
  onStatusChange,
  onEdit,
  onChecklist,
  onSchedule,
  onStart,
  onBack,
}: TodayTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group rounded-lg bg-white p-4 shadow-sm border border-slate-200 transition-colors hover:border-slate-300 cursor-grab active:cursor-grabbing"
    >
      <div className="mb-3 flex items-start justify-between">
        <StatusChip
          status={item.status}
          onOpenModal={onStatusChange}
          disabled={isUpdating}
        />
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={isUpdating}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              title="Edit"
              aria-label="Edit task"
            >
              Edit
            </button>
          )}
          {onChecklist && (
            <button
              type="button"
              onClick={onChecklist}
              disabled={isUpdating}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              title="Add Checklist"
              aria-label="Add checklist items"
            >
              Checklist
            </button>
          )}
          {onSchedule && (
            <button
              type="button"
              onClick={onSchedule}
              disabled={isUpdating}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              title="Schedule"
              aria-label="Schedule task"
            >
              Schedule
            </button>
          )}
          {onStart && (
            <button
              type="button"
              onClick={onStart}
              disabled={isUpdating}
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              title="Start Timer"
              aria-label="Start focus timer"
            >
              Start
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isUpdating}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              title="Back to Planned"
              aria-label="Move back to planned"
            >
              Back
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-medium text-slate-900">{item.title}</h3>
        {item.parentTitle && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            {item.parentTitle}
          </span>
        )}
        
        
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {item.startAt && (() => {
            const startAtDate = new Date(item.startAt);
            if (!Number.isNaN(startAtDate.getTime())) {
              return (
                <span className="flex items-center gap-1 font-medium text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Scheduled {startAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              );
            }
            return null;
          })()}
          {item.priority && (
            <span className={`flex items-center gap-1 ${getPriorityStyles(item.priority)}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                item.priority === 1 ? 'bg-red-500' :    // Fix: 1 = Must (red)
                item.priority === 2 ? 'bg-blue-500' :   // 2 = Should (blue)
                'bg-slate-400'                          // Fix: 3 = Want (grey)
              }`}></span>
              {priorityLabel(item.priority)}
            </span>
          )}
          {item.deadline && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              Due {formatDateTime(item.deadline, { month: "short", day: "numeric" })}
            </span>
          )}
          {item.plannedMinutes && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              {item.plannedMinutes}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
});


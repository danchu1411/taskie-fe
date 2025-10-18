import React from "react";
import { clsx } from "../lib";
import type { TaskDisplayItem } from "../features/tasks/utils/transformTasksForDisplay";
import { STATUS, type StatusValue, type PriorityValue } from "../lib";
import { StatusBadge, PriorityBadge, DueDateBadge } from "./ui";

interface TaskDisplayCardProps {
  item: TaskDisplayItem;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: () => void;
  onSchedule?: () => void;
  onStart?: () => void;
  isUpdating?: boolean;
  isDragging?: boolean;
}

export const TaskDisplayCard = React.memo(function TaskDisplayCard({
  item,
  onEdit,
  onDelete,
  onStatusChange,
  onSchedule,
  onStart,
  isUpdating = false,
  isDragging = false,
}: TaskDisplayCardProps) {
  const isChecklistItem = item.source === "checklist";
  
  return (
    <div
      className={clsx(
        "group relative rounded-lg bg-white shadow-sm border transition-all duration-200",
        isDragging ? "opacity-50 shadow-2xl scale-105" : "hover:shadow-md",
        isUpdating ? "opacity-60 pointer-events-none" : "",
        "border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Status indicator line */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          item.status === STATUS.DONE
            ? "bg-green-500"
            : item.status === STATUS.IN_PROGRESS
            ? "bg-amber-500"
            : item.status === STATUS.SKIPPED
            ? "bg-slate-400"
            : "bg-blue-400"
        )}
      />

      <div className="p-4 pl-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Parent Title for checklist items */}
            {isChecklistItem && item.parentTitle && (
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs text-slate-500 font-medium truncate">
                  {item.parentTitle}
                </span>
              </div>
            )}
            
            {/* Title */}
            <h4
              className={clsx(
                "text-sm font-medium leading-tight",
                item.status === STATUS.DONE
                  ? "line-through text-slate-500"
                  : "text-slate-900"
              )}
            >
              {item.title}
            </h4>
          </div>

          {/* Actions */}
          <div 
            className="flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity flex-shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                title="Start"
                disabled={isUpdating}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            {onSchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSchedule();
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                title="Schedule"
                disabled={isUpdating}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
              title="Edit"
              disabled={isUpdating}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
              title="Delete"
              disabled={isUpdating}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Schedule Info - if scheduled */}
        {item.startAt && item.plannedMinutes && (
          <div className="flex items-center gap-2 mb-3 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-3 py-2 rounded-lg">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-indigo-900">
              {new Date(item.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
              {new Date(item.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-indigo-400">·</span>
            <span className="font-medium text-indigo-700">{item.plannedMinutes}m</span>
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div onPointerDown={(e) => e.stopPropagation()}>
            <StatusBadge
              status={item.status as StatusValue}
              onClick={onStatusChange}
              disabled={isUpdating}
            />
          </div>
          
          {item.priority && <PriorityBadge priority={item.priority as PriorityValue} />}
          
          {item.deadline && <DueDateBadge deadline={item.deadline} />}
        </div>
      </div>
    </div>
  );
});


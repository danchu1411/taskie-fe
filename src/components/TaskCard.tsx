import React, { useCallback, useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { 
  TaskRecord, 
  StatusValue, 
  ChecklistItemRecord 
} from "../lib";
import { STATUS, clsx } from "../lib";
import { 
  StatusBadge, 
  PriorityBadge, 
  DueDateBadge
} from "./ui";

export interface TaskCardProps {
  task: TaskRecord;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onStart?: (task: TaskRecord) => void;
  onSchedule?: (item: TaskRecord | ChecklistItemRecord) => void;
  onAddChecklist?: (task: TaskRecord) => void;
  onEditChecklistItem?: (item: ChecklistItemRecord) => void;
  onDeleteChecklistItem?: (itemId: string) => void;
  onChecklistItemStatusChange?: (itemId: string, newStatus: StatusValue) => void;
  onChecklistItemOpenStatusModal?: (item: ChecklistItemRecord) => void;
  onChecklistItemReorder?: (itemId: string, targetOrder: number) => void;
  isUpdating?: boolean;
  isChecklistItemUpdating?: (itemId: string) => boolean;
}

export const TaskCard = React.memo(function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onStart,
  onSchedule,
  onAddChecklist,
  onEditChecklistItem,
  onDeleteChecklistItem,
  onChecklistItemStatusChange: _onChecklistItemStatusChange,
  onChecklistItemOpenStatusModal,
  onChecklistItemReorder,
  isUpdating = false,
  isChecklistItemUpdating
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const completedChecklist = task.checklist?.filter(item => item.status === STATUS.DONE).length || 0;
  const totalChecklist = task.checklist?.length || 0;
  
  // Determine if task can be scheduled
  const canSchedule = !hasChecklist;



  // DnD for checklist
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const orderedChecklist = useMemo(() => {
    return (task.checklist ?? []).slice().sort((a, b) => a.order_index - b.order_index);
  }, [task.checklist]);

  const handleChecklistDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = orderedChecklist.findIndex(i => i.checklist_item_id === String(active.id));
    const toIndex = orderedChecklist.findIndex(i => i.checklist_item_id === String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    onChecklistItemReorder?.(String(active.id), toIndex + 1);
  }, [orderedChecklist, onChecklistItemReorder]);

  function ChecklistItemRow({ item }: { item: ChecklistItemRecord }) {
    const effectivePriority = item.priority ?? task.priority;
    const effectiveDeadline = item.deadline ?? task.deadline;
    const hasDeadlineConflict = Boolean(item.deadline && task.deadline && new Date(item.deadline) > new Date(task.deadline));

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.checklist_item_id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} key={item.checklist_item_id} className={clsx(
        "group relative rounded-lg border transition-all duration-200 hover:shadow-sm mx-4 sm:mx-6 mb-2",
        "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
      )}>
        {/* Status indicator line */}
        <div className={clsx(
          "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg",
          item.status === STATUS.DONE 
            ? "bg-green-500" 
            : item.status === STATUS.IN_PROGRESS
            ? "bg-amber-500"
            : item.status === STATUS.SKIPPED
            ? "bg-slate-400"
            : "bg-slate-300"
        )} />

        <div className="flex items-start gap-3 p-4 pl-5">
          {/* Drag Handle */}
          <div className="flex flex-col items-center gap-1 mt-0.5" {...listeners} {...attributes}>
            <div className="w-4 h-4 text-slate-400 cursor-move hover:text-slate-600 transition-colors">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
            </div>
            <span className="text-xs text-slate-400 font-mono leading-none">#{item.order_index}</span>
          </div>

          {/* Status Badge (replaces checkbox) */}
          <div className="flex-shrink-0 mt-0.5">
            <StatusBadge 
              status={item.status} 
              onClick={() => onChecklistItemOpenStatusModal?.(item)}
              disabled={isChecklistItemUpdating?.(item.checklist_item_id)}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-3">
                <h5 className={clsx(
                "text-sm font-medium leading-tight flex-1 pr-2",
                  item.status === STATUS.DONE 
                    ? "line-through text-slate-500" 
                    : "text-slate-900"
                )}>
                  {item.title}
                </h5>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {onSchedule && (
                    <button
                      onClick={() => onSchedule(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                      title="Schedule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onEditChecklistItem?.(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteChecklistItem?.(item.checklist_item_id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
            </div>

            {/* Schedule Info - if scheduled */}
            {item.start_at && item.planned_minutes && (
              <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-3 py-2 rounded-lg">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-indigo-900">
                  {new Date(item.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-indigo-400">·</span>
                <span className="font-medium text-indigo-700">{item.planned_minutes}m</span>
              </div>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2">
              {effectivePriority && (
                <PriorityBadge priority={effectivePriority} />
              )}

              {effectiveDeadline && (
                <div className="flex items-center gap-1">
                  <DueDateBadge deadline={effectiveDeadline} />
                  {hasDeadlineConflict && (
                    <span className="text-xs text-red-500 font-medium" title="Deadline conflict with task">
                      ⚠️ conflict
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl bg-white shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Top Bar - Meta Info */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge 
                status={task.is_atomic ? task.status : (task.derived_status ?? task.status)} 
                onClick={() => task.is_atomic ? onStatusChange(task) : undefined}
                disabled={isUpdating || !task.is_atomic}
              />
          <div className="h-4 w-px bg-slate-300" />
          <PriorityBadge priority={task.priority ?? null} />
          <DueDateBadge deadline={task.deadline} />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100">
          {onStart && canSchedule && (
            <button
              type="button"
              onClick={() => onStart(task)}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-600"
              title="Start Timer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
                  <button
            type="button"
            onClick={() => onDelete((task.task_id || (task as any).id))}
            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
                  </button>
                </div>
            </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Title Row */}
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-slate-900 text-lg sm:text-xl leading-tight">
            {task.title}
          </h3>
          
          {/* Checklist Button */}
          {hasChecklist && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors flex-shrink-0"
            >
              <span className="text-xs">{expanded ? "▼" : "▶"}</span>
              <span>{completedChecklist}/{totalChecklist}</span>
              <div className="w-12 bg-emerald-200 rounded-full h-1">
                <div 
                  className="bg-emerald-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0}%` }}
                />
              </div>
            </button>
          )}

          {/* Add Checklist */}
          {!hasChecklist && onAddChecklist && (
            <button
              onClick={() => onAddChecklist(task)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition-colors flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Checklist
            </button>
          )}
        </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

        {/* Schedule Section - For Atomic Tasks */}
        {canSchedule && (
          <div className="mb-4">
            {task.start_at && task.planned_minutes ? (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200">
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-indigo-900">
                      {new Date(task.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(task.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
                    <span className="text-xs text-indigo-400">·</span>
                    <span className="text-sm font-medium text-indigo-700">
                      {task.planned_minutes} minutes
              </span>
                  </div>
                </div>
                {onSchedule && (
              <button
                    type="button"
                    onClick={() => onSchedule(task)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors underline decoration-dotted"
              >
                    Reschedule
              </button>
            )}
              </div>
            ) : task.start_at ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-indigo-800">
                  Starts {new Date(task.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ) : onSchedule ? (
              <button
                type="button"
                onClick={() => onSchedule(task)}
                className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Schedule this task</span>
              </button>
            ) : null}
          </div>
        )}

      </div>

      {/* Checklist Items */}
      {hasChecklist && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded 
            ? 'max-h-screen opacity-100 mt-4 border-t border-slate-200' 
            : 'max-h-0 opacity-0 mt-0'
        }`}>
          {/* Header - with padding */}
          <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Checklist Items</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {completedChecklist} of {totalChecklist} completed
              </span>
              <div className="w-16 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0}%` }}
                />
                </div>
              </div>
            </div>
          </div>
          
          {/* Checklist Items - Full width, no padding */}
          <DndContext sensors={sensors} onDragEnd={handleChecklistDragEnd}>
            <SortableContext items={orderedChecklist.map(i => i.checklist_item_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
                {orderedChecklist.map((item) => (
                  <ChecklistItemRow key={item.checklist_item_id} item={item} />
                ))}
                      </div>
            </SortableContext>
          </DndContext>
          
          {/* Add new checklist item - with padding */}
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200">
            <button
              onClick={() => onAddChecklist?.(task)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add new checklist item
            </button>
          </div>
        </div>
        )}
    </div>
  );
});

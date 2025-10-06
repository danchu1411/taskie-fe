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
  onChecklistItemStatusChange,
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

  // Calculate derived task status based on checklist items
  const derivedTaskStatus = useMemo(() => {
    if (!hasChecklist) return task.status;
    
    const checklist = task.checklist!;
    const statuses = checklist.map(item => item.status);
    
    // If all items are done, task should be done
    if (statuses.every(status => status === STATUS.DONE)) {
      return STATUS.DONE;
    }
    
    // If any item is in progress, task should be in progress
    if (statuses.some(status => status === STATUS.IN_PROGRESS)) {
      return STATUS.IN_PROGRESS;
    }
    
    // If any item is skipped, task should be skipped
    if (statuses.some(status => status === STATUS.SKIPPED)) {
      return STATUS.SKIPPED;
    }
    
    // If all items are planned, task should be planned
    if (statuses.every(status => status === STATUS.PLANNED)) {
      return STATUS.PLANNED;
    }
    
    return task.status;
  }, [task.status, task.checklist, hasChecklist]);

  // Check if task status needs to be updated
  const needsStatusUpdate = derivedTaskStatus !== task.status;

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
        "group p-3 rounded-lg border transition-all duration-200",
        item.status === STATUS.DONE 
          ? "bg-green-50 border-green-200" 
          : item.status === STATUS.IN_PROGRESS
          ? "bg-amber-50 border-amber-200"
          : item.status === STATUS.SKIPPED
          ? "bg-slate-50 border-slate-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}>
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="flex flex-col items-center gap-1 mt-1" {...listeners} {...attributes}>
            <div className="w-4 h-4 text-slate-400 cursor-move hover:text-slate-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
            </div>
            <span className="text-xs text-slate-400 font-mono">#{item.order_index}</span>
          </div>

          {/* Checkbox */}
          <input 
            type="checkbox"
            checked={item.status === STATUS.DONE}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newStatus = e.target.checked ? STATUS.DONE : STATUS.PLANNED;
              onChecklistItemStatusChange?.(item.checklist_item_id, newStatus);
            }}
            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h5 className={clsx(
                  "text-sm font-medium leading-tight",
                  item.status === STATUS.DONE 
                    ? "line-through text-slate-500" 
                    : "text-slate-900"
                )}>
                  {item.title}
                </h5>
                {/* Effective values */}
                <div className="flex items-center gap-2 mt-2">
                  {effectivePriority && (
                    <PriorityBadge priority={effectivePriority} />
                  )}

                  {effectiveDeadline && (
                    <div className="flex items-center gap-1">
                      <DueDateBadge deadline={effectiveDeadline} />
                      {hasDeadlineConflict && (
                        <span className="text-xs text-red-500" title="Deadline conflict with task">
                          ⚠️ conflict
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-2">
                <StatusBadge 
                  status={item.status} 
                  onClick={() => onChecklistItemOpenStatusModal?.(item)}
                  disabled={isChecklistItemUpdating?.(item.checklist_item_id)}
                />
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditChecklistItem?.(item)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteChecklistItem?.(item.checklist_item_id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:border-slate-300">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Left: Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Status + Title + Type */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex items-center gap-2">
              <StatusBadge 
                status={task.derived_status} 
                onClick={() => task.is_atomic ? onStatusChange(task) : undefined}
                disabled={isUpdating || !task.is_atomic}
              />
              {needsStatusUpdate && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-600 font-medium">
                    →
                  </span>
                  <StatusBadge 
                    status={derivedTaskStatus} 
                    className="opacity-75"
                  />
                  <button
                    onClick={() => {
                      // TODO: Implement auto-update task status
                      console.log('Auto-update task status to:', derivedTaskStatus);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 transition-colors"
                    title="Click to update task status automatically"
                  >
                    Update
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 text-base sm:text-lg leading-tight">
                  {task.title}
                </h3>
                {needsStatusUpdate && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                    Status needs update
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <PriorityBadge priority={task.priority ?? null} />
            <DueDateBadge deadline={task.deadline} />
            
            {/* Scheduled Time */}
            {canSchedule && task.start_at && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                Starts {new Date(task.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

            {/* Planned Duration */}
            {canSchedule && task.planned_minutes && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                {task.planned_minutes}m planned
              </span>
            )}

            {/* Checklist Progress (for container tasks) */}
            {hasChecklist && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                {expanded ? "▼" : "▶"}
                {completedChecklist}/{totalChecklist} subtasks
              </button>
            )}

            {/* Add Checklist */}
            {!hasChecklist && onAddChecklist && (
              <button
                onClick={() => onAddChecklist(task)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
              >
                + Add Checklist
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap gap-2 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            title="Edit"
            aria-label="Edit task"
          >
            Edit
          </button>

          {/* Schedule button for atomic tasks */}
          {onSchedule && canSchedule && (
            <button
              type="button"
              onClick={() => onSchedule(task)}
              className="rounded-lg bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200"
              title={task.start_at ? "Reschedule" : "Schedule"}
              aria-label="Schedule task"
            >
              {task.start_at ? "Reschedule" : "Schedule"}
            </button>
          )}

          {/* Start button for tasks that can be scheduled */}
          {onStart && canSchedule && (
            <button
              type="button"
              onClick={() => onStart(task)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              title="Start Timer"
              aria-label="Start focus timer"
            >
              Start
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete((task.task_id || (task as any).id))}
            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
            title="Delete"
            aria-label="Delete task"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      {hasChecklist && expanded && (
        <div className="mt-4 border-t border-slate-200 pt-4">
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
          
          <DndContext sensors={sensors} onDragEnd={handleChecklistDragEnd}>
            <SortableContext items={orderedChecklist.map(i => i.checklist_item_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
                {orderedChecklist.map((item) => (
                  <ChecklistItemRow key={item.checklist_item_id} item={item} />
                ))}
                      </div>
            </SortableContext>
          </DndContext>
          
          {/* Add new checklist item */}
          <div className="mt-3 pt-3 border-t border-slate-200">
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

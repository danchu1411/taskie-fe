import React, { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "../../lib";
import type { TaskRecord, StatusValue } from "../../lib";
import { STATUS } from "../../lib";

interface BoardViewProps {
  tasksByStatus: {
    planned: TaskRecord[];
    inProgress: TaskRecord[];
    done: TaskRecord[];
    skipped: TaskRecord[];
  };
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onChecklist?: (task: TaskRecord) => void;
  onSchedule?: (task: TaskRecord) => void;
  onStart?: (task: TaskRecord) => void;
  isUpdating?: boolean;
  pendingStatusId?: string | null;
}

interface BoardColumnProps {
  status: StatusValue;
  label: string;
  tasks: TaskRecord[];
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onChecklist?: (task: TaskRecord) => void;
  onSchedule?: (task: TaskRecord) => void;
  onStart?: (task: TaskRecord) => void;
  isUpdating?: boolean;
  pendingStatusId?: string | null;
}

interface BoardTaskCardProps {
  task: TaskRecord;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onChecklist?: (task: TaskRecord) => void;
  onSchedule?: (task: TaskRecord) => void;
  onStart?: (task: TaskRecord) => void;
  isUpdating?: boolean;
  isDragging?: boolean;
}

function BoardTaskCardInner({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onChecklist,
  onSchedule,
  onStart,
  isUpdating = false,
  isDragging = false
}: BoardTaskCardProps) {
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const completedChecklist = task.checklist?.filter(item => item.status === STATUS.DONE).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  return (
    <div className={clsx("group bg-white rounded-lg border border-slate-200 p-3 shadow-sm transition-all duration-200",
      isDragging ? "opacity-50" : "hover:shadow-md"
    )}>
      <div className="space-y-2">
        {/* Title */}
        <h4 className="font-medium text-slate-900 text-sm leading-tight line-clamp-2">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Primary Info: Priority + Deadline */}
        <div className="flex items-center gap-1.5">
          {task.priority && (
            <span className={clsx(
              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
              task.priority === 1 && "bg-red-100 text-red-700",
              task.priority === 2 && "bg-yellow-100 text-yellow-700", 
              task.priority === 3 && "bg-green-100 text-green-700"
            )}>
              {task.priority === 1 ? "Must" : task.priority === 2 ? "Should" : "Want"}
            </span>
          )}
          
          {task.deadline && (
            <span className={clsx(
              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
              new Date(task.deadline) < new Date() ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            )}>
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Secondary Info: Time + Checklist */}
        <div className="flex items-center gap-1.5">
          {task.planned_minutes && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              {task.planned_minutes}m
            </span>
          )}

          {hasChecklist && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
              {completedChecklist}/{totalChecklist}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              title="Edit"
            >
              Edit
            </button>
            {onStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStart(task);
                }}
                className="rounded bg-indigo-600 px-1.5 py-0.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                title="Start Timer"
              >
                Start
              </button>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete((task.task_id || (task as any).id));
            }}
            className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function DraggableTaskCard(props: BoardTaskCardProps) {
  const { task } = props;
  const { setNodeRef, listeners, attributes, isDragging, transform } = useDraggable({ id: (task as any).id || task.task_id, data: { task } });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    touchAction: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <BoardTaskCardInner {...props} isDragging={isDragging} />
    </div>
  );
}

function BoardColumn({
  status,
  label,
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onChecklist,
  onSchedule,
  onStart,
  isUpdating,
  pendingStatusId
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}`, data: { status } });
  const getStatusColor = (status: StatusValue) => {
    switch (status) {
      case STATUS.PLANNED:
        return "bg-blue-50 border-blue-200";
      case STATUS.IN_PROGRESS:
        return "bg-amber-50 border-amber-200";
      case STATUS.DONE:
        return "bg-green-50 border-green-200";
      case STATUS.SKIPPED:
        return "bg-slate-50 border-slate-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: StatusValue) => {
    switch (status) {
      case STATUS.PLANNED:
        return "bg-blue-500";
      case STATUS.IN_PROGRESS:
        return "bg-amber-500";
      case STATUS.DONE:
        return "bg-green-500";
      case STATUS.SKIPPED:
        return "bg-slate-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusTextColor = (status: StatusValue) => {
    switch (status) {
      case STATUS.PLANNED:
        return "text-blue-700";
      case STATUS.IN_PROGRESS:
        return "text-amber-700";
      case STATUS.DONE:
        return "text-green-700";
      case STATUS.SKIPPED:
        return "text-slate-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div ref={setNodeRef} className={clsx(
      "rounded-xl border-2 min-h-[600px] flex flex-col",
      getStatusColor(status),
      isOver && "outline outline-2 outline-indigo-300"
    )}>
      {/* Column Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <div className={clsx("h-2 w-2 rounded-full", getStatusIcon(status))} />
          <h3 className={clsx("font-semibold text-sm", getStatusTextColor(status))}>
            {label}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {tasks.length > 0 && (
            <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={(task as any).id || task.task_id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onChecklist={onChecklist}
            onSchedule={onSchedule}
            onStart={onStart}
            isUpdating={isUpdating && pendingStatusId === task.task_id}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className={clsx("h-8 w-8 rounded-full mb-2 opacity-50", getStatusIcon(status))} />
            <p className="text-sm text-center">No tasks yet</p>
            <p className="text-xs text-center mt-1 opacity-75">
              Drag tasks here or create new ones
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardView({
  tasksByStatus,
  onEdit,
  onDelete,
  onStatusChange,
  onChecklist,
  onSchedule,
  onStart,
  isUpdating,
  pendingStatusId
}: BoardViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);
  const handleDragStart = (event: any) => {
    const task: TaskRecord | undefined = event.active?.data?.current?.task;
    if (task) setActiveTask(task);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const task: TaskRecord | undefined = active.data?.current?.task;
    const overStatus = (over.data?.current?.status as StatusValue) ?? null;
    if (!task || overStatus == null) return;
    if (task.status === overStatus) return;
    onStatusChange({ ...task, status: overStatus });
    setActiveTask(null);
  };
  const handleDragCancel = () => setActiveTask(null);
  const columns = [
    { status: STATUS.PLANNED, label: "Planned", tasks: tasksByStatus.planned },
    { status: STATUS.IN_PROGRESS, label: "In Progress", tasks: tasksByStatus.inProgress },
    { status: STATUS.DONE, label: "Done", tasks: tasksByStatus.done },
    { status: STATUS.SKIPPED, label: "Skipped", tasks: tasksByStatus.skipped },
  ];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map(({ status, label, tasks }) => (
        <BoardColumn
          key={status}
          status={status}
          label={label}
          tasks={tasks}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onChecklist={onChecklist}
          onSchedule={onSchedule}
          onStart={onStart}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
        />
      ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="pointer-events-none">
            <DraggableTaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              onStatusChange={() => {}}
              isUpdating={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

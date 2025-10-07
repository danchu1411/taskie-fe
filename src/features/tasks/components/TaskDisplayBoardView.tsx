import React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "../../../lib";
import type { TaskRecord, StatusValue, ChecklistItemRecord } from "../../../lib";
import { STATUS } from "../../../lib";
import { TaskDisplayCard } from "../../../components/TaskDisplayCard";
import { transformTasksForDisplay, type TaskDisplayItem } from "../utils/transformTasksForDisplay";

interface TaskDisplayBoardViewProps {
  tasks: TaskRecord[];
  isUpdating: boolean;
  pendingStatusId: string | null;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onDragStatusChange?: (taskId: string, newStatus: StatusValue) => void;
  onChecklist?: (task: TaskRecord) => void;
  onSchedule?: (task: TaskRecord | ChecklistItemRecord) => void;
  onChecklistItemStatusChange?: (item: ChecklistItemRecord) => void;
  onDragChecklistItemStatusChange?: (itemId: string, newStatus: StatusValue) => void;
}

interface BoardColumnProps {
  status: StatusValue;
  label: string;
  items: TaskDisplayItem[];
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onChecklist?: (task: TaskRecord) => void;
  onSchedule?: (task: TaskRecord | ChecklistItemRecord) => void;
  onChecklistItemStatusChange?: (item: ChecklistItemRecord) => void;
  isUpdating?: boolean;
  pendingStatusId?: string | null;
}

function BoardColumn({
  status,
  label,
  items,
  onEdit,
  onDelete,
  onStatusChange,
  onChecklist,
  onSchedule,
  onChecklistItemStatusChange,
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

  const getStatusLabel = (status: StatusValue) => {
    switch (status) {
      case STATUS.PLANNED:
        return "Planned";
      case STATUS.IN_PROGRESS:
        return "In Progress";
      case STATUS.DONE:
        return "Done";
      case STATUS.SKIPPED:
        return "Skipped";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700">{label}</h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 min-h-[200px] p-3 rounded-lg border-2 border-dashed transition-colors",
          isOver ? "border-blue-400 bg-blue-50" : "border-slate-200",
          getStatusColor(status)
        )}
      >
        <div className="space-y-2">
          {items.map((item) => (
            <DraggableTaskCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onChecklist={onChecklist}
              onSchedule={onSchedule}
              
              onChecklistItemStatusChange={onChecklistItemStatusChange}
              isUpdating={isUpdating && pendingStatusId === item.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DraggableTaskCard({
  item,
  onEdit,
  onDelete,
  onStatusChange,
  onChecklist,
  onSchedule,
  onChecklistItemStatusChange,
  isUpdating = false,
}: {
  item: TaskDisplayItem;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: TaskRecord) => void;
  onChecklist?: (task: TaskRecord) => void;
  onSchedule?: (task: TaskRecord | ChecklistItemRecord) => void;
  onChecklistItemStatusChange?: (item: ChecklistItemRecord) => void;
  isUpdating?: boolean;
}) {
  const { setNodeRef: setDraggableRef, listeners, attributes, isDragging: isDraggingCard, transform } = useDraggable({ 
    id: item.id, 
    data: { item } 
  });
  
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: item.id,
    data: { status: item.status }
  });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
  };

  const handleEdit = () => {
    if (item.source === "checklist" && item.originalChecklistItem) {
      // For checklist items, we need to edit the parent task
      if (item.originalTask) {
        onEdit(item.originalTask);
      }
    } else if (item.originalTask) {
      onEdit(item.originalTask);
    }
  };

  const handleDelete = () => {
    if (item.source === "checklist" && item.checklistItemId) {
      // For checklist items, we need to delete the checklist item
      // This should be handled by the parent component
      console.log("Delete checklist item:", item.checklistItemId);
    } else if (item.taskId) {
      onDelete(item.taskId);
    }
  };

  const handleStatusChange = () => {
    if (item.source === "checklist" && item.originalChecklistItem) {
      // For checklist items, open the checklist status modal
      if (onChecklistItemStatusChange) {
        onChecklistItemStatusChange(item.originalChecklistItem);
      }
    } else if (item.originalTask) {
      onStatusChange(item.originalTask);
    }
  };

  const handleSchedule = () => {
    if (item.source === "checklist" && item.originalChecklistItem) {
      // For checklist items, we need to schedule the checklist item
      if (onSchedule) {
        onSchedule(item.originalChecklistItem);
      }
    } else if (item.originalTask) {
      onSchedule?.(item.originalTask);
    }
  };

  const handleStart = () => {
    // Start only works for tasks, not checklist items
    if (item.source === "task" && item.originalTask) {
      onStart?.(item.originalTask);
    }
  };

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    setDraggableRef(element);
    setDroppableRef(element);
  };

  return (
    <div 
      ref={setRefs} 
      style={{
        ...style,
        opacity: isDraggingCard ? 0.5 : 1,
      }}
      {...listeners} 
      {...attributes} 
      className="cursor-grab active:cursor-grabbing"
    >
      <TaskDisplayCard
        item={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onSchedule={handleSchedule}
        
        isUpdating={isUpdating}
        isDragging={false}
      />
    </div>
  );
}

export const TaskDisplayBoardView = React.memo(function TaskDisplayBoardView({
  tasks,
  isUpdating,
  pendingStatusId,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStatusChange,
  onChecklist,
  onSchedule,
  onStart,
  onChecklistItemStatusChange,
  onDragChecklistItemStatusChange,
}: TaskDisplayBoardViewProps) {
  // Transform tasks into display items
  const displayItems = React.useMemo(() => {
    return transformTasksForDisplay(tasks);
  }, [tasks]);

  // Group items by status
  const itemsByStatus = React.useMemo(() => {
    const grouped = {
      planned: [] as TaskDisplayItem[],
      inProgress: [] as TaskDisplayItem[],
      done: [] as TaskDisplayItem[],
      skipped: [] as TaskDisplayItem[],
    };

    for (const item of displayItems) {
      switch (item.status) {
        case STATUS.PLANNED:
          grouped.planned.push(item);
          break;
        case STATUS.IN_PROGRESS:
          grouped.inProgress.push(item);
          break;
        case STATUS.DONE:
          grouped.done.push(item);
          break;
        case STATUS.SKIPPED:
          grouped.skipped.push(item);
          break;
      }
    }

    return grouped;
  }, [displayItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('🎯 handleDragEnd called:', { active: active.id, over: over?.id, overData: over?.data });
    
    if (!over) {
      console.log('❌ No over target');
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    console.log('📍 IDs:', { activeId, overId });
    
    // Find the item being dragged
    const draggedItem = displayItems.find(item => item.id === activeId);
    if (!draggedItem) {
      console.log('❌ No dragged item found');
      return;
    }
    
    console.log('✅ Dragged item:', { 
      id: draggedItem.id, 
      title: draggedItem.title, 
      currentStatus: draggedItem.status,
      source: draggedItem.source 
    });
    
    // Determine the target status
    let newStatus: StatusValue | undefined;
    
    // Check if dropped on a column
    if (overId.startsWith('col-')) {
      const targetColumn = overId.replace('col-', '');
      newStatus = parseInt(targetColumn) as StatusValue;
      console.log('🎯 Dropped on column:', { overId, targetColumn, newStatus });
    } 
    // Check if dropped on another item - get status from that item
    else {
      const overItem = displayItems.find(item => item.id === overId);
      if (overItem) {
        newStatus = overItem.status as StatusValue;
        console.log('🎯 Dropped on item:', { overItemId: overId, overItemTitle: overItem.title, newStatus });
      }
    }
    
    if (newStatus === undefined) {
      console.log('❌ Could not determine target status');
      return;
    }
    
    console.log('🎯 Target status:', newStatus);
    
    // Don't update if status is the same
    if (draggedItem.status === newStatus) {
      console.log('⏭️ Status is the same, skipping');
      return;
    }
    
    // Update status
    if (draggedItem.source === "checklist" && draggedItem.originalChecklistItem) {
      // Handle checklist item status change via drag
      console.log('📝 Updating checklist item status:', draggedItem.originalChecklistItem.checklist_item_id, newStatus);
      if (onDragChecklistItemStatusChange) {
        onDragChecklistItemStatusChange(draggedItem.originalChecklistItem.checklist_item_id, newStatus);
      } else {
        console.log('❌ No onDragChecklistItemStatusChange callback');
      }
    } else if (draggedItem.originalTask) {
      // Handle task status change via drag
      const taskId = draggedItem.taskId || draggedItem.originalTask.task_id || (draggedItem.originalTask as any).id;
      console.log('📋 Updating task status:', taskId, newStatus);
      if (onDragStatusChange && taskId) {
        onDragStatusChange(taskId, newStatus);
      } else {
        console.log('❌ No onDragStatusChange callback or taskId');
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BoardColumn
          status={STATUS.PLANNED}
          label="Planned"
          items={itemsByStatus.planned}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onChecklist={onChecklist}
          onSchedule={onSchedule}
          
          onChecklistItemStatusChange={onChecklistItemStatusChange}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
        />
        
        <BoardColumn
          status={STATUS.IN_PROGRESS}
          label="In Progress"
          items={itemsByStatus.inProgress}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onChecklist={onChecklist}
          onSchedule={onSchedule}
          
          onChecklistItemStatusChange={onChecklistItemStatusChange}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
        />
        
        <BoardColumn
          status={STATUS.DONE}
          label="Done"
          items={itemsByStatus.done}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onChecklist={onChecklist}
          onSchedule={onSchedule}
          
          onChecklistItemStatusChange={onChecklistItemStatusChange}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
        />
        
        <BoardColumn
          status={STATUS.SKIPPED}
          label="Skipped"
          items={itemsByStatus.skipped}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onChecklist={onChecklist}
          onSchedule={onSchedule}
          
          onChecklistItemStatusChange={onChecklistItemStatusChange}
          isUpdating={isUpdating}
          pendingStatusId={pendingStatusId}
        />
      </div>
      
      <DragOverlay>
        <div className="opacity-50">
          {/* Drag overlay content */}
        </div>
      </DragOverlay>
    </DndContext>
  );
});

import { ReactNode } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { memo } from "react";
import type { TodayItem, StatusValue } from "../hooks/useTodayData";
import { TodayTaskCard } from "./TodayTaskCard";

interface TodaySectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconText: string;
  countBg: string;
  countText: string;
  items: TodayItem[];
  isLoading: boolean;
  onStart: (item: TodayItem) => void;
  onOpenTimer: (item: TodayItem) => void;
  onSchedule: (item: TodayItem) => void;
  onChecklist: (item: TodayItem) => void;
  onEdit: (item: TodayItem) => void;
  onStatusModal: (item: TodayItem) => void;
  onBack?: (item: TodayItem) => void;
  isUpdating: (itemId: string) => boolean;
  className?: string;
}

const DroppableColumn = memo(function DroppableColumn({ 
  id, 
  children, 
  className 
}: { 
  id: string; 
  children: ReactNode; 
  className?: string; 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} ${isOver ? "bg-blue-50" : ""}`}
    >
      {children}
    </div>
  );
});

const TaskCardSkeleton = memo(function TaskCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200 animate-pulse">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-6 w-16 rounded-full bg-slate-200"></div>
        <div className="flex gap-1">
          <div className="h-6 w-12 rounded bg-slate-200"></div>
          <div className="h-6 w-16 rounded bg-slate-200"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200"></div>
        <div className="h-3 w-1/2 rounded bg-slate-200"></div>
      </div>
    </div>
  );
});

export const TodaySection = memo(function TodaySection({
  id,
  title,
  subtitle,
  icon,
  iconBg,
  iconText,
  countBg,
  countText,
  items,
  isLoading,
  onStart,
  onOpenTimer,
  onSchedule,
  onChecklist,
  onEdit,
  onStatusModal,
  onBack,
  isUpdating,
  className,
}: TodaySectionProps) {
  const emptyStateIcon = icon;
  const emptyStateTitle = `No ${title.toLowerCase()} tasks`;
  const emptyStateMessage = getEmptyStateMessage(title);

  return (
    <DroppableColumn id={id} className={className}>
      <div className="sticky top-24">
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconText}`}>
            <span className="text-sm">{icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className={`ml-auto rounded-full ${countBg} px-3 py-1 text-sm font-medium ${countText}`}>
            {items.length}
          </div>
        </div>
        
        <SortableContext id={id} items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: getSkeletonCount(title) }).map((_, i) => (
                  <TaskCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <span className="text-2xl text-slate-400">{emptyStateIcon}</span>
                </div>
                <h3 className="mb-2 font-semibold text-slate-800">{emptyStateTitle}</h3>
                <p className="text-sm text-slate-500">{emptyStateMessage}</p>
              </div>
            ) : (
              items.map((item) => {
                const updating = isUpdating(item.id);
                return (
                  <TodayTaskCard
                    key={item.id}
                    item={item}
                    isUpdating={updating}
                    onStatusChange={() => onStatusModal(item)}
                    onEdit={item.source === "task" ? () => onEdit(item) : undefined}
                    onChecklist={item.source === "task" ? () => onChecklist(item) : undefined}
                    onSchedule={() => onSchedule(item)}
                    onStart={() => onStart(item)}
                    onBack={onBack ? () => onBack(item) : undefined}
                  />
                );
              })
            )}
          </div>
        </SortableContext>
      </div>
    </DroppableColumn>
  );
});

function getEmptyStateMessage(title: string): string {
  switch (title) {
    case "Planned":
      return "Use the quick add button to create your first task";
    case "In Progress":
      return "Pick a task from the planned list to get started";
    case "Done":
      return "Complete some tasks to see them here";
    default:
      return "No tasks in this section";
  }
}

function getSkeletonCount(title: string): number {
  switch (title) {
    case "Planned":
      return 4;
    case "In Progress":
      return 3;
    case "Done":
      return 2;
    default:
      return 3;
  }
}

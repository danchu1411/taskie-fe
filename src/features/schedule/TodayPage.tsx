import { isAxiosError } from "axios";
import { useCallback, useMemo, useRef, useState, memo, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import { NavigationBar, Button, Input } from "../../components/ui";
import { useTodayKeyboardShortcuts } from "./hooks/useTodayKeyboardShortcuts";
import useTodayTimer from "./useTodayTimer";
import type { TaskRecord, ChecklistItemRecord, WorkItemRecord } from "../../lib/types";

type StatusValue = 0 | 1 | 2 | 3;

const STATUS = {
  PLANNED: 0 as StatusValue,
  IN_PROGRESS: 1 as StatusValue,
  DONE: 2 as StatusValue,
  SKIPPED: 3 as StatusValue,
} as const;

function statusLabel(value: StatusValue) {
  if (value === STATUS.IN_PROGRESS) return "In progress";
  if (value === STATUS.DONE) return "Done";
  if (value === STATUS.SKIPPED) return "Skipped";
  return "Planned";
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type TodayItem = {
  id: string;
  source: "task" | "checklist";
  title: string;
  parentTitle: string | null;
  status: StatusValue;
  priority: 1 | 2 | 3 | null;
  startAt: string | null;
  plannedMinutes: number | null;
  deadline: string | null;
  updatedAt?: number;
  taskId: string | null;
  checklistItemId: string | null;
};


interface TaskListResponse {
  items: TaskRecord[];
}

function readField<T>(
  source: TaskRecord | WorkItemRecord | ChecklistItemRecord | undefined,
  keys: string[],
  fallback?: T,
): T | undefined {
  if (!source) return fallback;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = (source as unknown as Record<string, unknown>)[key];
      if (value !== undefined && value !== null) {
        return value as T;
      }
    }
  }
  return fallback;
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toStatus(value: unknown): StatusValue {
  const numeric = toNumber(value);
  if (numeric === STATUS.IN_PROGRESS) return STATUS.IN_PROGRESS;
  if (numeric === STATUS.DONE) return STATUS.DONE;
  if (numeric === STATUS.SKIPPED) return STATUS.SKIPPED;
  if (numeric === STATUS.PLANNED) return STATUS.PLANNED;
  return STATUS.PLANNED;
}

function toPriority(value: unknown): 1 | 2 | 3 | null {
  const numeric = toNumber(value);
  if (numeric === 1) return 1;
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return null;
}

function toDateValue(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const timestamp = Date.parse(String(value));
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function Ring({ value }: { value: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, value));
  const offset = circumference - (bounded / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24">
      <circle cx="50" cy="50" r={radius} className="fill-none stroke-slate-200" strokeWidth={10} />
      <circle
        cx="50"
        cy="50"
        r={radius}
        className="fill-none stroke-indigo-500 transition-[stroke-dashoffset]"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
function normalizeWorkItem(
  taskRecord: TaskRecord,
  workItemRecord: WorkItemRecord,
): TodayItem | null {
  const taskId =
    readField<string>(workItemRecord, ["taskId", "task_id"]) ??
    readField<string>(taskRecord, ["taskId", "task_id"]);
  const checklistItemId = readField<string>(workItemRecord, [
    "checklistItemId",
    "checklist_item_id",
    "checklistId",
    "checklist_id",
  ]);
  const workItemId = readField<string>(workItemRecord, [
    "workItemId",
    "work_item_id",
    "id",
  ]);

  if (!taskId && !checklistItemId && !workItemId) return null;

  const status =
    toStatus(readField(workItemRecord, ["status"])) ??
    toStatus(readField(taskRecord, ["status"]));

  const priority =
    toPriority(readField(workItemRecord, ["effectivePriority", "priority"])) ??
    toPriority(readField(taskRecord, ["effectivePriority", "priority"]));

  const deadline =
    readField<string>(workItemRecord, ["effectiveDeadline", "deadline"]) ??
    readField<string>(taskRecord, ["effectiveDeadline", "deadline"]) ??
    null;

  const startAt = readField<string>(workItemRecord, ["startAt", "start_at"]) ?? null;
  const plannedMinutes = toNumber(readField(workItemRecord, ["plannedMinutes", "planned_minutes"])) ?? null;
  const updatedAt =
    toDateValue(readField(workItemRecord, ["updatedAt", "updated_at"])) ??
    toDateValue(readField(taskRecord, ["updatedAt", "updated_at"]));

  const title =
    readField<string>(workItemRecord, ["title"]) ??
    readField<string>(taskRecord, ["title"]) ??
    "(Untitled)";

  const parentTitle =
    readField<string>(workItemRecord, ["parentTitle", "parent_title"]) ??
    (checklistItemId ? readField<string>(taskRecord, ["title"]) ?? null : null);

  const source: "task" | "checklist" = checklistItemId ? "checklist" : "task";
  const id = workItemId ?? (source === "task" ? taskId ?? "" : checklistItemId ?? "");
  if (!id) return null;

  return {
    id,
    source,
    title,
    parentTitle,
    status,
    priority,
    startAt,
    plannedMinutes,
    deadline,
    updatedAt,
    taskId: taskId ?? null,
    checklistItemId: checklistItemId ?? null,
  };
}
function normalizeChecklist(
  taskRecord: TaskRecord,
  checklistRecord: ChecklistItemRecord,
): TodayItem | null {
  const checklistItemId = readField<string>(checklistRecord, [
    "checklistItemId",
    "checklist_item_id",
    "itemId",
    "id",
  ]);
  if (!checklistItemId) return null;

  const taskId = readField<string>(taskRecord, ["taskId", "task_id"]) ?? null;

  const status =
    toStatus(readField(checklistRecord, ["status"])) ??
    toStatus(readField(taskRecord, ["status"]));

  const priority =
    toPriority(readField(checklistRecord, ["priority"])) ??
    toPriority(readField(taskRecord, ["priority", "effectivePriority"]));

  const deadline =
    readField<string>(checklistRecord, ["deadline"]) ??
    readField<string>(taskRecord, ["effectiveDeadline", "deadline"]) ??
    null;

  const updatedAt =
    toDateValue(readField(checklistRecord, ["updatedAt", "updated_at"])) ??
    toDateValue(readField(taskRecord, ["updatedAt", "updated_at"]));

  const startAt = readField<string>(checklistRecord, ["startAt", "start_at"]) ?? null;
  const plannedMinutes = toNumber(readField(checklistRecord, ["plannedMinutes", "planned_minutes"])) ?? null;

  return {
    id: checklistItemId,
    source: "checklist",
    title: readField<string>(checklistRecord, ["title"]) ?? "(Untitled)",
    parentTitle: readField<string>(taskRecord, ["title"]) ?? null,
    status,
    priority,
    startAt,
    plannedMinutes,
    deadline,
    updatedAt,
    taskId,
    checklistItemId,
  };
}
function normalizeTask(taskRecord: TaskRecord): TodayItem | null {
  const taskId = readField<string>(taskRecord, ["taskId", "task_id"]);
  if (!taskId) return null;

  const status = toStatus(readField(taskRecord, ["status"]));
  const priority =
    toPriority(readField(taskRecord, ["priority", "effectivePriority"])) ?? null;

  const deadline =
    readField<string>(taskRecord, ["effectiveDeadline", "deadline"]) ?? null;

  const updatedAt = toDateValue(readField(taskRecord, ["updatedAt", "updated_at"]));
  const startAt = readField<string>(taskRecord, ["startAt", "start_at"]) ?? null;
  const plannedMinutes = toNumber(readField(taskRecord, ["plannedMinutes", "planned_minutes"])) ?? null;

  return {
    id: taskId,
    source: "task",
    title: readField<string>(taskRecord, ["title"]) ?? "(Untitled)",
    parentTitle: null,
    status,
    priority,
    startAt,
    plannedMinutes,
    deadline,
    updatedAt,
    taskId,
    checklistItemId: null,
  };
}
function mapTodayItems(payload: TaskListResponse | undefined): TodayItem[] {
  if (!payload?.items?.length) return [];
  const result: TodayItem[] = [];
  // Global guards to prevent duplicates across entire payload
  const globalSeenChecklistIds = new Set<string>(); // normalized (lowercase) checklist ids
  const globalSeenKeys = new Set<string>(); // composite keys: work:<id>, check:<id>, task:<id>

  for (const task of payload.items) {
    const taskRecord = task ?? {};

    // Read checklist first to build title->id map
    const checklistForTitleMap =
      readField<ChecklistItemRecord[]>(taskRecord, ["checklist"], []) ?? [];
    const checklistTitleMap = new Map<string, string>();
    for (const checklistItem of checklistForTitleMap) {
      const cidRaw = readField<string>(checklistItem, [
        "checklistItemId",
        "checklist_item_id",
        "itemId",
        "id",
      ]);
      const title = (readField<string>(checklistItem, ["title"]) ?? "").trim().toLowerCase();
      if (cidRaw && title) {
        checklistTitleMap.set(title, cidRaw);
      }
    }

    const workItems =
      readField<WorkItemRecord[]>(taskRecord, ["workItems"], []) ?? [];
    // Track checklist items that already have scheduled work items to avoid duplicates
    const scheduledChecklistIds = new Set<string>(); // normalized (lowercase)
    const uniqueChecklistWork = new Map<string, TodayItem>();
    const seenWorkIds = new Set<string>();

    function shouldPreferWorkItem(a: TodayItem, b: TodayItem): boolean {
      // Prefer IN_PROGRESS > PLANNED > DONE > SKIPPED
      const score = (s: StatusValue) => (s === STATUS.IN_PROGRESS ? 3 : s === STATUS.PLANNED ? 2 : s === STATUS.DONE ? 1 : 0);
      const sa = score(a.status);
      const sb = score(b.status);
      if (sa !== sb) return sa > sb;
      // If both planned: earlier startAt first
      const aStart = a.startAt ? Date.parse(a.startAt) : Number.POSITIVE_INFINITY;
      const bStart = b.startAt ? Date.parse(b.startAt) : Number.POSITIVE_INFINITY;
      if (aStart !== bStart) return aStart < bStart;
      // Fallback: newer updatedAt first
      const au = a.updatedAt ?? 0;
      const bu = b.updatedAt ?? 0;
      return au > bu;
    }

    for (const workItem of workItems) {
      // If work item misses checklistItemId but matches a checklist title, synthesize the id
      let synthesized: WorkItemRecord | null = null;
      const rawChecklistId = readField<string>(workItem, [
        "checklistItemId",
        "checklist_item_id",
        "checklistId",
        "checklist_id",
      ]);
      if (!rawChecklistId) {
        const wTitle = (readField<string>(workItem, ["title"]) ?? "").trim().toLowerCase();
        const matchId = wTitle ? checklistTitleMap.get(wTitle) : undefined;
        if (matchId) {
          synthesized = { ...(workItem as any), checklist_item_id: matchId } as any;
        }
      }

      const normalized = normalizeWorkItem(taskRecord, (synthesized ?? workItem) as any);
      if (!normalized) continue;
      const wid = (readField<string>(workItem, ["workItemId", "work_item_id"]) ?? normalized.id ?? "").toLowerCase();
      const checklistId = (normalized.checklistItemId ?? "").toLowerCase();

      if (normalized.source === "checklist" && checklistId) {
        const prev = uniqueChecklistWork.get(checklistId);
        if (!prev || shouldPreferWorkItem(normalized, prev)) {
          uniqueChecklistWork.set(checklistId, normalized);
        }
        scheduledChecklistIds.add(checklistId);
        continue;
      }

      // Non-checklist work items: keep unique per workItemId
      const dedupeKey = wid ? `work:${wid}` : `work:${normalized.id.toLowerCase?.() ?? String(normalized.id)}`;
      if (!globalSeenKeys.has(dedupeKey) && !seenWorkIds.has(dedupeKey)) {
        result.push(normalized);
        globalSeenKeys.add(dedupeKey);
        seenWorkIds.add(dedupeKey);
      }
    }

    // Push unique checklist work items
    for (const [, item] of uniqueChecklistWork) {
      const dedupeKey = `check:${(item.checklistItemId ?? item.id).toLowerCase?.() ?? String(item.id)}`;
      if (!globalSeenKeys.has(dedupeKey)) {
        result.push(item);
        globalSeenKeys.add(dedupeKey);
      }
    }

    const checklist =
      readField<ChecklistItemRecord[]>(taskRecord, ["checklist"], []) ?? [];
    for (const checklistItem of checklist) {
      // Skip raw checklist item if it already has a scheduled work item
      const checklistIdRaw = readField<string>(checklistItem, [
        "checklistItemId",
        "checklist_item_id",
        "itemId",
        "id",
      ]);
      const checklistId = checklistIdRaw ? checklistIdRaw.toLowerCase() : null;
      if (checklistId && scheduledChecklistIds.has(checklistId)) {
        continue;
      }
      // Also skip if we have already emitted this checklist id (defensive against backend duplicates)
      if (checklistId && globalSeenChecklistIds.has(checklistId)) {
        continue;
      }
      const normalized = normalizeChecklist(taskRecord, checklistItem);
      if (normalized) {
        if (checklistId) {
          const dedupeKey = `check:${checklistId}`;
          if (globalSeenKeys.has(dedupeKey)) {
            continue;
          }
          globalSeenKeys.add(dedupeKey);
          globalSeenChecklistIds.add(checklistId);
        }
        result.push(normalized);
      }
    }

    if (!workItems.length && !checklist.length) {
      const normalized = normalizeTask(taskRecord);
      if (normalized) {
        const tidRaw = readField<string>(taskRecord, ["taskId", "task_id"]) ?? normalized.id;
        const tid = tidRaw ? String(tidRaw).toLowerCase() : "";
        const dedupeKey = `task:${tid}`;
        if (!globalSeenKeys.has(dedupeKey)) {
        result.push(normalized);
          globalSeenKeys.add(dedupeKey);
        }
      }
    }
  }

  // Final defensive dedupe across all items to ensure no visual duplicates remain
  const final: TodayItem[] = [];
  const score = (s: StatusValue) => (s === STATUS.IN_PROGRESS ? 3 : s === STATUS.PLANNED ? 2 : s === STATUS.DONE ? 1 : 0);

  // Keep the highest-priority item per logical entity key
  const bestByKey = new Map<string, TodayItem>();
  for (const it of result) {
    const baseId = (it.source === "checklist" ? (it.checklistItemId ?? it.id) : it.source === "task" ? (it.taskId ?? it.id) : it.id) ?? it.id;
    const key = `${it.source === "checklist" ? "check" : it.source === "task" ? "task" : "work"}:${String(baseId).toLowerCase()}`;
    const prev = bestByKey.get(key);
    if (!prev || score(it.status) > score(prev.status)) {
      bestByKey.set(key, it);
    }
  }

  for (const [, it] of bestByKey) {
    final.push(it);
  }

  return final;
}
function formatDateTime(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString(undefined, options ?? { dateStyle: "medium", timeStyle: "short" });
}


function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "string") return data.error;
      if (typeof data.details === "string") return data.details;
    }
    return `${error.message} (Status: ${error.response?.status})`;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error. Please try again.";
}
type StatusChipProps = {
  status: StatusValue;
  onOpenModal: () => void;
  disabled?: boolean;
};

const StatusChip = memo(function StatusChip({ status, onOpenModal, disabled }: StatusChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onOpenModal();
      }}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
        status === STATUS.PLANNED && "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
        status === STATUS.IN_PROGRESS && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
        status === STATUS.DONE && "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
        status === STATUS.SKIPPED && "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
        disabled && "cursor-not-allowed opacity-60",
      )}
      aria-label={"Change status from " + statusLabel(status)}
      aria-disabled={disabled ? "true" : undefined}
      title="Click to select status"
    >
      <span className={clsx(
        "h-2 w-2 rounded-full",
        status === STATUS.PLANNED && "bg-blue-500",
        status === STATUS.IN_PROGRESS && "bg-amber-500",
        status === STATUS.DONE && "bg-green-500",
        status === STATUS.SKIPPED && "bg-slate-400",
      )} aria-hidden />
      {statusLabel(status)}
    </button>
  );
});

// Task Card Component for better performance
interface TaskCardProps {
  item: TodayItem;
  isUpdating: boolean;
  onStatusChange: () => void;
  onEdit?: () => void;
  onChecklist?: () => void;
  onSchedule?: () => void;
  onStart?: () => void;
  onBack?: () => void;
}


// Droppable Column Component
interface DroppableColumnProps {
  id: string;
  children: ReactNode;
  className?: string;
}

const DroppableColumn = memo(function DroppableColumn({ id, children, className }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 border-blue-200' : ''}`}
    >
      {children}
    </div>
  );
});

// Draggable Task Card Component
interface DraggableTaskCardProps extends TaskCardProps {
  dragId: string;
}

const DraggableTaskCard = memo(function DraggableTaskCard({
  item,
  isUpdating,
  onStatusChange,
  onEdit,
  onChecklist,
  onSchedule,
  onStart,
  onBack,
  dragId,
}: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dragId });

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
          {item.priority && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              Priority {item.priority}
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

// Progress Overview Component
interface ProgressOverviewProps {
  totalTasks: number;
  inProgressCount: number;
  completedCount: number;
  progressValue: number;
}

const ProgressOverview = memo(function ProgressOverview({
  totalTasks,
  inProgressCount,
  completedCount,
  progressValue,
}: ProgressOverviewProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Total Tasks</p>
            <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">In Progress</p>
            <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <Ring value={progressValue} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Progress</p>
            <p className="text-2xl font-bold text-slate-900">{progressValue}%</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hooks for better separation of concerns
function useTasksData(userId: string | null) {
  return useQuery<TaskListResponse, unknown>({
    queryKey: ["today-tasks", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      try {
        const response = await api.get<TaskListResponse>("/tasks/by-user/" + userId, {
          params: {
            includeChecklist: true,
            includeWorkItems: true,
            page: 1,
            pageSize: 100,
          },
        });
        return response.data;
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        if (isAxiosError(error)) {
          console.error("Response data:", error.response?.data);
          console.error("Response status:", error.response?.status);
          console.error("Response headers:", error.response?.headers);
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

function useTaskCategories(items: TodayItem[]) {
  return useMemo(() => {
    const inProgress = items
      .filter((item) => item.status === STATUS.IN_PROGRESS)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    const planned = items
      .filter((item) => item.status === STATUS.PLANNED)
      .sort((a, b) => {
        const aStart = toDateValue(a.startAt);
        const bStart = toDateValue(b.startAt);
        if (aStart && bStart) return aStart - bStart;
        if (aStart) return -1;
        if (bStart) return 1;

        const aDeadline = toDateValue(a.deadline);
        const bDeadline = toDateValue(b.deadline);
        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline) return -1;
        if (bDeadline) return 1;

        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      });

    const completed = items
      .filter((item) => item.status === STATUS.DONE || item.status === STATUS.SKIPPED)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    const doneCount = items.filter((item) => item.status === STATUS.DONE).length;
    const progressValue = items.length ? Math.round((doneCount / items.length) * 100) : 0;

    return { inProgress, planned, completed, doneCount, progressValue };
  }, [items]);
}

type TodayPageProps = {
  onNavigate?: (path: string) => void;
};

// Proper mutation context types
interface StatusMutationContext {
  previousTasks: TaskListResponse | undefined;
}

interface QuickAddMutationContext {
  previousTasks: TaskListResponse | undefined;
  tempId: string;
}

interface StatusMutationPayload {
  item: TodayItem;
  status: StatusValue;
}
function TodayPageContent({ onNavigate }: TodayPageProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const [quickOpen, setQuickOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const [customDuration, setCustomDuration] = useState(120); // minutes

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TodayItem | null>(null);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleMinutes, setScheduleMinutes] = useState(25);

  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodayItem | null>(null);
  const [checklistItems, setChecklistItems] = useState<Array<{ title: string; deadline?: string; priority?: number }>>([{ title: "" }]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TodayItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState<1 | 2 | 3 | null>(null);


  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalItem, setStatusModalItem] = useState<TodayItem | null>(null);

  const quickRef = useRef<HTMLInputElement | null>(null);

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTasksData(userId);
  // Timer logic moved into useTodayTimer hook

  const items = useMemo(() => {
    if (!tasksData) return [];
    return mapTodayItems(tasksData);
  }, [tasksData]);

  const { inProgress, planned, completed, doneCount, progressValue } = useTaskCategories(items);

  const timer = useTodayTimer({
    items,
    onStartFocus: (item) => {
      if (item.status !== STATUS.IN_PROGRESS) {
        statusMutation.mutate({ item, status: STATUS.IN_PROGRESS });
      }
    }
  });
  const timerItem = timer.timerItem;
  const {
    timerOpen,
    timerAnimating,
    timerDuration,
    timerRemain,
    timerRunning,
    isFullscreen,
    isFloating,
    currentSession,
    sessionPlan,
    isDarkTheme,
    FloatingWidget,
    startCustomDuration,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    setTimerRunning,
  } = timer;
  const statusMutation = useMutation<void, unknown, StatusMutationPayload, StatusMutationContext>({
    mutationFn: async ({ item, status }) => {
      if (item.source === "task" && item.taskId) {
        await api.patch(`/tasks/${item.taskId}`, { status });
        return;
      }
      if (item.source === "checklist" && item.checklistItemId) {
        await api.patch(`/checklist-items/${item.checklistItemId}`, { status });
        return;
      }
      throw new Error("Unable to update status for this item.");
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onMutate: async ({ item, status }) => {
      setPendingStatusId(item.id);
      setStatusError(null);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["today-tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["today-tasks", userId]) as TaskListResponse | undefined;
      
      // Optimistically update to the new value
      queryClient.setQueryData(["today-tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => {
            if (item.source === "task" && task.task_id === item.taskId) {
              return { ...task, status };
            }
            
            if (item.source === "checklist" && task.checklist) {
              return {
                ...task,
                checklist: task.checklist.map((checklistItem: ChecklistItemRecord) => 
                  checklistItem.checklist_item_id === item.checklistItemId
                    ? { ...checklistItem, status }
                    : checklistItem
                )
              };
            }
            
            return task;
          })
        };
      });
      
      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      setStatusError(getErrorMessage(err));
      // Revert to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["today-tasks", userId], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      setPendingStatusId(null);
    },
  });

  const quickAddMutation = useMutation<TaskRecord, unknown, string, QuickAddMutationContext>({
    mutationFn: async (title) => {
      const response = await api.post("/tasks/create", { title, priority: 2 });
      return response.data;
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onMutate: async (title) => {
      setQuickError(null);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["today-tasks", userId] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["today-tasks", userId]) as TaskListResponse | undefined;
      
      // Optimistically add the new task
      const tempId = `temp-${Date.now()}`;
        const optimisticTask: TaskRecord = {
        task_id: tempId,
        user_id: userId || "",
        title: title.trim(),
        description: undefined,
        deadline: undefined,
        priority: 2,
        status: 0,
        is_atomic: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workItems: [],
        checklist: [],
      };
      
      queryClient.setQueryData(["today-tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: [optimisticTask, ...old.items]
        };
      });
      
      return { previousTasks, tempId };
    },
    onError: (err, _title, context) => {
      setQuickError(getErrorMessage(err));
      // Revert to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["today-tasks", userId], context.previousTasks);
      }
    },
    onSuccess: (data, _title, context) => {
      setQuickTitle("");
      // Replace the optimistic task with the real one
      queryClient.setQueryData(["today-tasks", userId], (old: TaskListResponse | undefined) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((task: TaskRecord) => 
            task.task_id === context?.tempId ? data : task
          )
        };
      });
      // Also refresh the Tasks page queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    },
  });

  const scheduleMutation = useMutation<void, unknown, { workItemId: string; startAt: string; plannedMinutes: number }>({
    mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
      await api.post("/schedule-entries", {
        workItemId,
        startAt,
        plannedMinutes,
        status: 0, // planned
      });
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      queryClient.invalidateQueries({ queryKey: ["schedule", "upcoming"] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setScheduleModalOpen(false);
      setSelectedItem(null);
    },
  });

  const checklistMutation = useMutation<void, unknown, { taskId: string; checklist: Array<{ title: string; deadline?: string; priority?: number }> }>({
    mutationFn: async ({ taskId, checklist }) => {
      await api.post(`/checklist-items/${taskId}/checklist`, { checklist });
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync (Tasks includes checklist)
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setChecklistModalOpen(false);
      setSelectedTask(null);
      setChecklistItems([{ title: "" }]);
    },
  });

  interface EditTaskPayload {
    taskId: string;
    title: string;
    description?: string;
    deadline?: string;
    priority?: number;
  }

  const editTaskMutation = useMutation<void, unknown, EditTaskPayload>({
    mutationFn: async ({ taskId, title, description, deadline, priority }) => {
      const payload: Record<string, unknown> = { title };
      if (description) payload.description = description;
      if (deadline) payload.deadline = deadline;
      if (priority) payload.priority = priority;
      
      await api.patch(`/tasks/${taskId}`, payload);
    },
    onError: (err) => {
      setStatusError(getErrorMessage(err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
      // Keep Tasks page in sync
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditModalOpen(false);
      setEditingItem(null);
    },
  });
  const handleStatusChange = useCallback(
    (item: TodayItem, nextStatus: StatusValue) => {
      statusMutation.mutate({ item, status: nextStatus });
    },
    [statusMutation],
  );


  const openTimer = useCallback((item: TodayItem) => { timer.openTimer(item); }, [timer]);

  // timer controls are provided by hook via destructuring above

  // Floating Widget handled by useTodayTimer


  // Drag and Drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    console.log('Drag end event:', { active: active.id, over: over?.id });

    if (!over) {
      console.log('No drop target found');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('Drag details:', { activeId, overId });


    // Find the dragged item
    const draggedItem = items.find(item => item.id === activeId);
    if (!draggedItem) {
      console.log('Dragged item not found:', activeId);
      return;
    }

    console.log('Dragged item:', draggedItem);

    // Determine new status based on drop zone
    let newStatus: StatusValue;
    
    // Check if dropped on a column
    if (overId === 'planned-column') {
      newStatus = STATUS.PLANNED;
    } else if (overId === 'in-progress-column') {
      newStatus = STATUS.IN_PROGRESS;
    } else if (overId === 'completed-column') {
      newStatus = STATUS.DONE;
    } else {
      // If dropped on another task, find which column that task belongs to
      const targetItem = items.find(item => item.id === overId);
      if (targetItem) {
        console.log('Dropped on task:', targetItem);
        newStatus = targetItem.status;
      } else {
        console.log('Invalid drop zone:', overId);
        return; // Invalid drop zone
      }
    }

    console.log('Status change:', { from: draggedItem.status, to: newStatus });

    // Only update if status actually changed
    if (draggedItem.status !== newStatus) {
      console.log('Updating status...');
      statusMutation.mutate({ item: draggedItem, status: newStatus });
    } else {
      console.log('Status unchanged, no update needed');
    }
  }, [items, statusMutation]);

  const addQuickItem = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) {
        setQuickError("Please enter a title.");
        return;
      }
      quickAddMutation.mutate(trimmed);
    },
    [quickAddMutation],
  );

  const openScheduleModal = useCallback((item: TodayItem) => {
    setSelectedItem(item);
    // Set default start time to next hour
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    setScheduleStartAt(nextHour.toISOString().slice(0, 16));
    setScheduleMinutes(item.plannedMinutes ?? 25);
    setScheduleModalOpen(true);
  }, []);

  const createSchedule = useCallback(() => {
    if (!selectedItem) return;
    
    const startAt = new Date(scheduleStartAt).toISOString();
    scheduleMutation.mutate({
      workItemId: selectedItem.id,
      startAt,
      plannedMinutes: scheduleMinutes,
    });
  }, [selectedItem, scheduleStartAt, scheduleMinutes, scheduleMutation]);

  const openChecklistModal = useCallback((item: TodayItem) => {
    if (item.source !== "task" || !item.taskId) return;
    setSelectedTask(item);
    setChecklistItems([{ title: "" }]);
    setChecklistModalOpen(true);
  }, []);

  const addChecklistItem = useCallback(() => {
    setChecklistItems(prev => [...prev, { title: "" }]);
  }, []);

  const updateChecklistItem = useCallback((index: number, field: string, value: string | number | undefined) => {
    setChecklistItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeChecklistItem = useCallback((index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const createChecklist = useCallback(() => {
    if (!selectedTask?.taskId) return;
    
    const validItems = checklistItems.filter(item => item.title.trim());
    if (validItems.length === 0) return;
    
    checklistMutation.mutate({
      taskId: selectedTask.taskId,
      checklist: validItems,
    });
  }, [selectedTask, checklistItems, checklistMutation]);

  const openEditModal = useCallback((item: TodayItem) => {
    if (item.source !== "task" || !item.taskId) return;
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(""); // We don't have description in TodayItem, so start empty
    setEditDeadline(item.deadline ? new Date(item.deadline).toISOString().slice(0, 16) : "");
    setEditPriority(item.priority);
    setEditModalOpen(true);
  }, []);

  const saveTaskEdit = useCallback(() => {
    if (!editingItem?.taskId) return;
    
    editTaskMutation.mutate({
      taskId: editingItem.taskId,
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      deadline: editDeadline ? new Date(editDeadline).toISOString() : undefined,
      priority: editPriority || undefined,
    });
  }, [editingItem, editTitle, editDescription, editDeadline, editPriority, editTaskMutation]);

  const openStatusModal = useCallback((item: TodayItem) => {
    setStatusModalItem(item);
    setStatusModalOpen(true);
  }, []);

  const selectStatus = useCallback((status: StatusValue) => {
    if (!statusModalItem) return;
    
    statusMutation.mutate({ item: statusModalItem, status });
    setStatusModalOpen(false);
    setStatusModalItem(null);
  }, [statusModalItem, statusMutation]);

  const errorMessage = isError ? getErrorMessage(error) : null;

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);



  // Timer effects moved to useTodayTimer hook

  // Keyboard shortcuts
  useTodayKeyboardShortcuts({
    quickOpen,
    setQuickOpen,
    scheduleModalOpen,
    setScheduleModalOpen,
    checklistModalOpen,
    setChecklistModalOpen,
    editModalOpen,
    setEditModalOpen,
    statusModalOpen,
    setStatusModalOpen,
    timerOpen,
    isFullscreen,
    isFloating,
    setTimerRunning,
    closeTimer,
    enterFloatingMode,
    exitFloatingMode,
    statusModalItem,
    selectStatus,
  });



  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-slate-50">
      <NavigationBar onNavigate={onNavigate} activeNav="today" />
          
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Calm Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="text-sm font-medium tracking-wider text-slate-500 uppercase">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] ?? 'there'}
              </h1>
              <div className="h-1 w-24 bg-slate-300"></div>
              <p className="text-lg font-medium text-slate-600">
                Let's focus on what matters today.
              </p>
        </div>
            
            <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => timer.openTimer()}
              className="rounded-lg bg-blue-600 px-8 py-4 text-white transition-colors hover:bg-blue-700"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">◐</span>
                <span className="font-medium">Start Focus</span>
              </div>
            </button>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <div className="flex items-center justify-between gap-4">
              <div>
              <span>Unable to load today schedule: {errorMessage}</span>
                {errorMessage.includes("400") && (
                  <div className="mt-2 text-xs text-rose-500">
                    This might be due to validation errors (e.g., pageSize too large) or user doesn't exist in the database.
                    <br />
                    <span className="text-slate-500">
                      Solutions:
                      <br />
                      1. Check if pageSize parameter is within backend limits (max 100)
                      <br />
                      2. Run this SQL to seed the user: 
                      <code className="ml-1 bg-slate-100 px-1 rounded text-xs">
                        INSERT INTO dbo.Users (id, email, name) VALUES ('11111111-1111-1111-1111-111111111111','dev@example.com','Dev User');
                      </code>
                      <br />
                      3. Or use the "Create User" button above to create a new user
                      <br />
                      4. Check the console for detailed error information
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {statusError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {statusError}
          </div>
        )}

        {/* Progress Overview */}
        {isLoading ? (
          <ProgressOverviewSkeleton />
        ) : (
          <ProgressOverview
            totalTasks={items.length}
            inProgressCount={inProgress.length}
            completedCount={doneCount}
            progressValue={progressValue}
          />
        )}
        {/* Calm Task Sections */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Planned Column */}
          <DroppableColumn id="planned-column" className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <span className="text-sm">□</span>
                </div>
            <div>
                  <h2 className="text-xl font-bold text-slate-800">Planned</h2>
                  <p className="text-sm text-slate-500">Ready to start</p>
            </div>
                <div className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                  {planned.length}
              </div>
            </div>
              
              <SortableContext id="planned-column" items={planned.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <TaskCardSkeleton key={i} />
                      ))}
          </div>
                  ) : planned.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <span className="text-2xl text-slate-400">□</span>
          </div>
                      <h3 className="mb-2 font-semibold text-slate-800">No planned tasks</h3>
                      <p className="text-sm text-slate-500">Use the quick add button to create your first task</p>
              </div>
                  ) : (
                    planned.map((item) => {
                  const isUpdating = statusMutation.isPending && pendingStatusId === item.id;
                  return (
                        <DraggableTaskCard
                      key={item.id}
                          dragId={item.id}
                          item={item}
                          isUpdating={isUpdating}
                          onStatusChange={() => openStatusModal(item)}
                          onEdit={item.source === "task" ? () => openEditModal(item) : undefined}
                          onChecklist={item.source === "task" ? () => openChecklistModal(item) : undefined}
                          onSchedule={() => openScheduleModal(item)}
                          onStart={() => openTimer(item)}
                        />
                      );
                    })
                            )}
                          </div>
              </SortableContext>
                        </div>
          </DroppableColumn>

          {/* In Progress Column */}
          <DroppableColumn id="in-progress-column" className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <span className="text-sm">◐</span>
                      </div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800">In Progress</h2>
                  <p className="text-sm text-slate-500">Currently working on</p>
              </div>
                <div className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
                  {inProgress.length}
              </div>
            </div>
              
              <SortableContext id="in-progress-column" items={inProgress.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
            {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <TaskCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : inProgress.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <span className="text-2xl text-slate-400">◐</span>
                      </div>
                      <h3 className="mb-2 font-semibold text-slate-800">No active tasks</h3>
                      <p className="text-sm text-slate-500">Pick a task from the planned list to get started</p>
                    </div>
                  ) : (
                    inProgress.map((item) => {
                  const isUpdating = statusMutation.isPending && pendingStatusId === item.id;
                  return (
                        <DraggableTaskCard
                      key={item.id}
                          dragId={item.id}
                          item={item}
                          isUpdating={isUpdating}
                          onStatusChange={() => openStatusModal(item)}
                          onEdit={item.source === "task" ? () => openEditModal(item) : undefined}
                          onChecklist={item.source === "task" ? () => openChecklistModal(item) : undefined}
                          onSchedule={() => openScheduleModal(item)}
                          onStart={() => openTimer(item)}
                        />
                      );
                    })
                            )}
                          </div>
              </SortableContext>
                        </div>
          </DroppableColumn>

          {/* Completed Column */}
          <DroppableColumn id="completed-column" className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <span className="text-sm">●</span>
                      </div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800">Done</h2>
                <p className="text-sm text-slate-500">Completed tasks</p>
              </div>
                <div className="ml-auto rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                  {completed.length}
              </div>
              </div>
              
              <SortableContext id="completed-column" items={completed.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
            {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <TaskCardSkeleton key={i} />
                      ))}
                    </div>
            ) : completed.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <span className="text-2xl text-slate-400">●</span>
                      </div>
                      <h3 className="mb-2 font-semibold text-slate-800">No completed tasks</h3>
                      <p className="text-sm text-slate-500">Complete some tasks to see them here</p>
                    </div>
                  ) : (
                    completed.map((item) => {
                  const isUpdating = statusMutation.isPending && pendingStatusId === item.id;
                  return (
                        <DraggableTaskCard
                      key={item.id}
                          dragId={item.id}
                          item={item}
                          isUpdating={isUpdating}
                          onStatusChange={() => openStatusModal(item)}
                          onBack={() => handleStatusChange(item, STATUS.PLANNED)}
                        />
                      );
                    })
                  )}
                          </div>
              </SortableContext>
                        </div>
          </DroppableColumn>
                      </div>
      </main>
      </div>
      {/* Calm Quick Add */}
      <div className="fixed bottom-6 right-6 z-40">
        {quickOpen && (
          <div className="mb-4 w-80 rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <span className="text-sm font-bold">+</span>
              </div>
              <h3 className="font-semibold text-slate-800">Quick Add Task</h3>
            </div>
            <div className="space-y-3">
              <Input
                ref={quickRef}
                value={quickTitle}
                onChange={(event) => setQuickTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addQuickItem(quickTitle);
                  }
                }}
                placeholder="What needs to be done?"
                size="lg"
                className="bg-slate-50 focus:bg-white"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setQuickOpen(false)}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Cancel
                </Button>
              <Button
                type="button"
                onClick={() => addQuickItem(quickTitle)}
                disabled={quickAddMutation.isPending}
                variant="primary"
                size="md"
                loading={quickAddMutation.isPending}
                className="flex-1"
              >
                Add Task
              </Button>
            </div>
              {quickError && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                  {quickError}
                </div>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setQuickOpen((prev) => !prev);
            window.setTimeout(() => {
              if (!quickOpen) {
                quickRef.current?.focus();
              }
            }, 40);
          }}
          className="rounded-lg bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700"
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      </div>
      {/* Floating Widget */}
      {isFloating && <FloatingWidget />}

      {/* Fullscreen Timer - Theme Support */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-50 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex h-full flex-col items-center justify-center">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className={`text-xl font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Focus period ({currentSession} of {sessionPlan.length})
              </h1>
              </div>

            {/* Circular Timer */}
            <div className="mb-12 relative">
              <div className="relative w-80 h-80">
                {/* Background Circle */}
                <div className={`absolute inset-0 rounded-full border ${
                  isDarkTheme 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={isDarkTheme ? 'text-gray-600' : 'text-gray-300'}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - (timerRemain / timerDuration))}`}
                      className="text-blue-500 transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Time Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-light mb-1 ${
                      isDarkTheme ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.floor(timerRemain / (60 * 1000))}
                    </div>
                    <div className={`text-lg ${
                      isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      min
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              {/* Pause/Resume Button */}
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white transition hover:bg-blue-600"
              >
                {timerRunning ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              {/* More Options Button */}
              <button
                onClick={enterFloatingMode}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                  isDarkTheme 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            {/* Next Session Info */}
            <div className="mt-8 text-center">
              <div className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                Up next: <span className="font-semibold">
                  {currentSession < sessionPlan.length ? 
                    `${sessionPlan[currentSession]?.duration || 5} min break` : 
                    'Session complete'
                  }
                </span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => timer.setIsDarkTheme(!isDarkTheme)}
              className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition ${
                isDarkTheme 
                  ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300'
              }`}
              title={isDarkTheme ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDarkTheme ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={closeTimer}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition ${
                isDarkTheme 
                  ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal Timer (Setup Mode) */}
      {timerOpen && !isFullscreen && !isFloating && (
        <div className="fixed inset-x-0 bottom-0 z-50">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
              timerAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeTimer}
          />
          
          {/* Windows 11 Style Modal */}
          <div 
            className={`relative rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
              timerAnimating 
                ? 'translate-y-0' 
                : 'translate-y-full'
            }`}
          >
            <div className="mx-auto max-w-md px-8 py-8">
              {/* Header */}
              <div className="mb-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900">Focus Session</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {timerItem ? timerItem.title : "Select a task to focus on"}
                </p>
              </div>

              {/* Time Display - Only show when running */}
              {timerRunning && (
                <div className="mb-8 text-center">
                  <div className="text-4xl font-light text-gray-900">
                    {formatTime(timerRemain)}
                  </div>
                </div>
              )}

              {/* Duration Controls - Only show when not running */}
              {!timerRunning && (
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <label className="text-sm font-medium text-gray-700">Total Duration</label>
                    <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                        onClick={() => setCustomDuration(prev => Math.max(30, prev - 30))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="text-center">
                        <div className="text-2xl font-medium text-gray-900">{customDuration}</div>
                        <div className="text-sm text-gray-600">minutes</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomDuration(prev => Math.min(480, prev + 30))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => startCustomDuration(customDuration)}
                      className="flex items-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="font-medium">Start {customDuration}min Session</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons - Only show when running */}
              {timerRunning && (
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(false)}
                    className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-6 py-3 text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    <span className="font-medium">Pause</span>
                  </button>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={closeTimer}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Close
              </button>
            </div>
                    </div>
                  </div>
                </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Schedule Task</h3>
              <p className="text-sm text-slate-600">{selectedItem.title}</p>
              </div>
            
              <div className="space-y-4">
              <div>
                <label htmlFor="schedule-start" className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  id="schedule-start"
                  type="datetime-local"
                  value={scheduleStartAt}
                  onChange={(e) => setScheduleStartAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              <div>
                <label htmlFor="schedule-minutes" className="block text-sm font-medium text-slate-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  id="schedule-minutes"
                  value={scheduleMinutes}
                  onChange={(e) => setScheduleMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={15}>15 minutes</option>
                  <option value={25}>25 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
            
             <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                 onClick={() => setScheduleModalOpen(false)}
                 className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                 Cancel
                  </button>
                  <button
                    type="button"
                 onClick={createSchedule}
                 disabled={scheduleMutation.isPending}
                 className={clsx(
                   "flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700",
                   scheduleMutation.isPending && "cursor-not-allowed opacity-60"
                 )}
               >
                 {scheduleMutation.isPending ? "Creating..." : "Create Schedule"}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Checklist Modal */}
      {checklistModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add Checklist</h3>
              <p className="text-sm text-slate-600">{selectedTask.title}</p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Checklist item title"
                      value={item.title}
                      onChange={(e) => updateChecklistItem(index, "title", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        placeholder="Deadline (optional)"
                        value={item.deadline || ""}
                        onChange={(e) => updateChecklistItem(index, "deadline", e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <select
                        value={item.priority || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateChecklistItem(index, "priority", value ? Number(value) : undefined);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">Priority</option>
                        <option value={1}>High</option>
                        <option value={2}>Medium</option>
                        <option value={3}>Low</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(index)}
                    className="mt-2 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
                    <button
                      type="button"
                onClick={addChecklistItem}
                className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                + Add another item
              </button>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setChecklistModalOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createChecklist}
                disabled={checklistMutation.isPending}
                className={clsx(
                  "flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700",
                  checklistMutation.isPending && "cursor-not-allowed opacity-60"
                )}
              >
                {checklistMutation.isPending ? "Creating..." : "Create Checklist"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Task</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              <div>
                <label htmlFor="edit-deadline" className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline (optional)
                </label>
                <input
                  id="edit-deadline"
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              <div>
                <label htmlFor="edit-priority" className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  id="edit-priority"
                  value={editPriority || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditPriority(value ? (Number(value) as 1 | 2 | 3) : null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">No priority</option>
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTaskEdit}
                disabled={editTaskMutation.isPending}
                className={clsx(
                  "flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700",
                  editTaskMutation.isPending && "cursor-not-allowed opacity-60"
                )}
              >
                {editTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Selection Modal */}
      {statusModalOpen && statusModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Change Status</h3>
              <p className="text-sm text-slate-600">{statusModalItem.title}</p>
            </div>
            
            <div className="space-y-2">
              {[
                { value: STATUS.PLANNED, label: "Planned", description: "Task is planned but not started" },
                { value: STATUS.IN_PROGRESS, label: "In Progress", description: "Currently working on this task" },
                { value: STATUS.DONE, label: "Done", description: "Task has been completed" },
                { value: STATUS.SKIPPED, label: "Skipped", description: "Task was skipped or cancelled" },
              ].map((statusOption) => (
                <button
                  key={statusOption.value}
                  type="button"
                  onClick={() => selectStatus(statusOption.value)}
                  disabled={statusMutation.isPending}
                  className={clsx(
                    "w-full rounded-lg border p-3 text-left transition hover:bg-slate-50",
                    statusModalItem.status === statusOption.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200",
                    statusMutation.isPending && "cursor-not-allowed opacity-60"
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
                      <div className="text-xs text-slate-500">{statusOption.description}</div>
                    </div>
                    {statusModalItem.status === statusOption.value && (
                      <div className="ml-auto text-indigo-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                    </button>
                  ))}
                </div>
            
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              </div>
            </div>
          </div>
      )}
      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          (() => {
            const activeItem = items.find(item => item.id === activeId);
            if (!activeItem) return null;
            
            return (
              <div className="rotate-3 scale-105 rounded-lg bg-white p-4 shadow-lg border border-slate-200 opacity-90">
                <div className="mb-3 flex items-start justify-between">
                  <StatusChip
                    status={activeItem.status}
                    onOpenModal={() => {}}
                    disabled={true}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">{activeItem.title}</h3>
                  {activeItem.parentTitle && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                      </svg>
                      {activeItem.parentTitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Loading Skeleton Components
const TaskCardSkeleton = memo(function TaskCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200 animate-pulse">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-6 w-20 rounded-lg bg-slate-200"></div>
        <div className="flex gap-1">
          <div className="h-6 w-12 rounded-lg bg-slate-200"></div>
          <div className="h-6 w-16 rounded-lg bg-slate-200"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200"></div>
        <div className="flex items-center gap-4">
          <div className="h-3 w-16 rounded bg-slate-200"></div>
          <div className="h-3 w-20 rounded bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
});

const ProgressOverviewSkeleton = memo(function ProgressOverviewSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-4 shadow-sm border border-slate-200 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200"></div>
            <div>
              <div className="h-4 w-20 rounded bg-slate-200 mb-2"></div>
              <div className="h-6 w-8 rounded bg-slate-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default function TodayPage({ onNavigate }: TodayPageProps) {
  return (
    <ErrorBoundary>
      <TodayPageContent onNavigate={onNavigate} />
    </ErrorBoundary>
  );
}


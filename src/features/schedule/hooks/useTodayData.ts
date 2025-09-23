import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import api from "../../../lib/api";
import type { TaskRecord, ChecklistItemRecord, WorkItemRecord } from "../../../lib/types";

// Types
export type StatusValue = 0 | 1 | 2 | 3;

export const STATUS = {
  PLANNED: 0 as StatusValue,
  IN_PROGRESS: 1 as StatusValue,
  DONE: 2 as StatusValue,
  SKIPPED: 3 as StatusValue,
} as const;

export type TodayItem = {
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

export interface TaskListResponse {
  items: TaskRecord[];
}

export interface TodayDataResult {
  tasksQuery: ReturnType<typeof useQuery<TaskListResponse, unknown>>;
  items: TodayItem[];
  categories: {
    inProgress: TodayItem[];
    planned: TodayItem[];
    completed: TodayItem[];
    doneCount: number;
    progressValue: number;
  };
}

// Helper functions
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

// Normalization functions
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

  const status =
    toStatus(readField(workItemRecord, ["status"])) ??
    toStatus(readField(taskRecord, ["status"]));

  const priority =
    toPriority(readField(workItemRecord, ["priority"])) ??
    toPriority(readField(taskRecord, ["priority", "effectivePriority"]));

  const deadline =
    readField<string>(workItemRecord, ["deadline"]) ??
    readField<string>(taskRecord, ["effectiveDeadline", "deadline"]) ??
    null;

  const updatedAt =
    toDateValue(readField(workItemRecord, ["updatedAt", "updated_at"])) ??
    toDateValue(readField(taskRecord, ["updatedAt", "updated_at"]));

  const startAt = readField<string>(workItemRecord, ["startAt", "start_at"]) ?? null;
  const plannedMinutes = toNumber(readField(workItemRecord, ["plannedMinutes", "planned_minutes"])) ?? null;

  return {
    id: readField<string>(workItemRecord, ["workItemId", "work_item_id"]) ?? taskId ?? "(Unknown)",
    source: checklistItemId ? "checklist" : "task",
    title: readField<string>(workItemRecord, ["title"]) ?? "(Untitled)",
    parentTitle: readField<string>(taskRecord, ["title"]) ?? null,
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

// Main mapping function
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

// Data fetching hook
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

// Categories hook
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

// Main hook
export function useTodayData(userId: string | null): TodayDataResult {
  const tasksQuery = useTasksData(userId);
  
  const items = useMemo(() => {
    if (!tasksQuery.data) return [];
    return mapTodayItems(tasksQuery.data);
  }, [tasksQuery.data]);

  const categories = useTaskCategories(items);

  return {
    tasksQuery,
    items,
    categories,
  };
}

/**
 * Utility functions for normalizing and transforming task data for Today view
 * 
 * This module contains pure functions that handle:
 * - Field reading and type conversion
 * - Data normalization from API to UI format
 * - Schedule data augmentation
 * - Date-based filtering
 * 
 * These functions are designed to be reusable across different views and testable in isolation.
 */

import type { TaskRecord, ChecklistItemRecord, WorkItemRecord } from "../../../lib/types";
import type { TodayItem, StatusValue, TaskListResponse } from "../hooks/useTodayData";
import type { ScheduleEntry } from "../hooks/useScheduleData";
import { STATUS } from "../hooks/useTodayData";
import { ENTITY_PREFIXES, STATUS_PRIORITY_SCORE } from "../constants/cacheConfig";

/**
 * Safely reads a field from a source object, trying multiple possible key names
 * 
 * @param source - The object to read from
 * @param keys - Array of possible key names to try
 * @param fallback - Default value if no key is found
 * @returns The found value or fallback
 */
export function readField<T>(
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

/**
 * Converts a value to a number, handling various input types safely
 */
export function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

/**
 * Converts a value to a valid StatusValue
 */
export function toStatus(value: unknown): StatusValue {
  const numeric = toNumber(value);
  if (numeric === STATUS.IN_PROGRESS) return STATUS.IN_PROGRESS;
  if (numeric === STATUS.DONE) return STATUS.DONE;
  if (numeric === STATUS.SKIPPED) return STATUS.SKIPPED;
  if (numeric === STATUS.PLANNED) return STATUS.PLANNED;
  return STATUS.PLANNED;
}

/**
 * Converts a value to a valid priority (1, 2, 3, or null)
 */
export function toPriority(value: unknown): 1 | 2 | 3 | null {
  const numeric = toNumber(value);
  if (numeric === 1) return 1;
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return null;
}

/**
 * Converts a value to a timestamp number
 */
export function toDateValue(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const timestamp = Date.parse(String(value));
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

/**
 * Extracts updated_at timestamp from a schedule entry
 */
export function getUpdatedAt(entry: ScheduleEntry): number | undefined {
  const value = entry.updated_at ?? entry.updatedAt;
  if (!value) return undefined;
  try {
    const timestamp = Date.parse(String(value));
    return Number.isNaN(timestamp) ? undefined : timestamp;
  } catch {
    return undefined;
  }
}

/**
 * Determines which work item should be preferred when conflicts occur
 * 
 * Priority order:
 * 1. Status (IN_PROGRESS > PLANNED > DONE > SKIPPED)
 * 2. Earlier start time
 * 3. Newer updated_at
 */
export function shouldPreferWorkItem(a: TodayItem, b: TodayItem): boolean {
  // Prefer IN_PROGRESS > PLANNED > DONE > SKIPPED
  const score = (s: StatusValue) => {
    if (s === STATUS.IN_PROGRESS) return STATUS_PRIORITY_SCORE.IN_PROGRESS;
    if (s === STATUS.PLANNED) return STATUS_PRIORITY_SCORE.PLANNED;
    if (s === STATUS.DONE) return STATUS_PRIORITY_SCORE.DONE;
    return STATUS_PRIORITY_SCORE.SKIPPED;
  };
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

/**
 * Normalizes a work item record into a TodayItem
 * 
 * Handles fallback cascades for status, priority, deadline from work item to task
 */
export function normalizeWorkItem(
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

  // Use derived_status for consistency with TasksPage
  const status =
    toStatus(readField(taskRecord, ["derived_status"])) ??
    toStatus(readField(workItemRecord, ["status"])) ??
    toStatus(readField(taskRecord, ["status"]));

  // Use task priority for consistency with TasksPage
  const priority =
    toPriority(readField(taskRecord, ["priority", "effectivePriority"])) ??
    toPriority(readField(workItemRecord, ["priority"]));


  const deadline =
    readField<string>(workItemRecord, ["deadline"]) ??
    readField<string>(taskRecord, ["effectiveDeadline", "deadline"]) ??
    null;

  const updatedAt =
    toDateValue(readField(workItemRecord, ["updatedAt", "updated_at"])) ??
    toDateValue(readField(taskRecord, ["updatedAt", "updated_at"]));

  const startAt = readField<string>(workItemRecord, ["startAt", "start_at"]) ?? null;
  const plannedMinutes = toNumber(readField(workItemRecord, ["plannedMinutes", "planned_minutes"])) ?? null;

  const workItemId = readField<string>(workItemRecord, ["workItemId", "work_item_id", "work_id"]);
  const finalId = workItemId ?? checklistItemId ?? taskId ?? "(Unknown)";
  
  // Debug: Log when fallback happens
  if (!workItemId && checklistItemId) {
    console.warn('⚠️ normalizeWorkItem: workItemId missing, using checklistItemId as fallback:', {
      checklistItemId,
      taskId,
      title: readField<string>(workItemRecord, ["title"])
    });
  } else if (workItemId) {
    console.log('✅ normalizeWorkItem: Found workItemId:', workItemId);
  }

  return {
    id: finalId,
    source: checklistItemId ? "checklist" : "task",
    title: readField<string>(workItemRecord, ["title"]) ?? "(Untitled)",
    // Only show parent title badge for actual checklist children, not standalone work items
    parentTitle: checklistItemId ? (readField<string>(taskRecord, ["title"]) ?? null) : null,
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

/**
 * Normalizes a checklist item record into a TodayItem
 * 
 * Inherits properties from parent task when not specified
 */
export function normalizeChecklist(
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

  // Use derived_status for consistency with TasksPage
  const status =
    toStatus(readField(taskRecord, ["derived_status"])) ??
    toStatus(readField(checklistRecord, ["status"])) ??
    toStatus(readField(taskRecord, ["status"]));

  // Use task priority for consistency with TasksPage
  const priority =
    toPriority(readField(taskRecord, ["priority", "effectivePriority"])) ??
    toPriority(readField(checklistRecord, ["priority"]));


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

/**
 * Normalizes a task record into a TodayItem (atomic task with no checklist)
 */
export function normalizeTask(taskRecord: TaskRecord): TodayItem | null {
  const taskId = readField<string>(taskRecord, ["taskId", "task_id"]);
  if (!taskId) return null;

  // Use derived_status for consistency with TasksPage
  const status = toStatus(readField(taskRecord, ["derived_status"])) ?? toStatus(readField(taskRecord, ["status"]));
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

/**
 * Maps API task list response to TodayItems with deduplication
 * 
 * Handles complex scenarios:
 * - Work items that reference checklist items
 * - Checklist items without work items
 * - Atomic tasks without checklists
 * - Title-based checklist matching
 * - Multi-level deduplication
 */
export function mapTodayItems(payload: TaskListResponse | undefined): TodayItem[] {
  if (!payload?.items?.length) return [];
  
  // Debug: Log payload to diagnose duplicate key issues
  console.log('🔍 mapTodayItems called with payload:', {
    taskCount: payload.items.length,
    tasks: payload.items.map((t: any) => ({
      taskId: t.task_id ?? t.taskId,
      title: t.title,
      workItemsCount: (t.workItems ?? t.work_items ?? []).length,
      checklistCount: (t.checklist ?? []).length
    }))
  });
  
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
    
    // Debug: Log raw workItems structure to see what backend actually returns
    if (workItems.length > 0) {
      console.log('🔍 Raw workItems from backend:', {
        taskTitle: readField<string>(taskRecord, ["title"]),
        workItems: workItems.map((wi: any) => ({
          raw: wi,
          work_id: wi.work_id,
          work_item_id: wi.work_item_id,
          workItemId: wi.workItemId,
          checklist_item_id: wi.checklist_item_id,
          checklistItemId: wi.checklistItemId,
          title: wi.title
        }))
      });
    }
    
    // Track checklist items that already have scheduled work items to avoid duplicates
    const scheduledChecklistIds = new Set<string>(); // normalized (lowercase)
    const uniqueChecklistWork = new Map<string, TodayItem>();
    const seenWorkIds = new Set<string>();

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
      const wid = (readField<string>(workItem, ["workItemId", "work_item_id", "work_id"]) ?? normalized.id ?? "").toLowerCase();
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
      const dedupeKey = wid ? `${ENTITY_PREFIXES.WORK_ITEM}:${wid}` : `${ENTITY_PREFIXES.WORK_ITEM}:${normalized.id.toLowerCase?.() ?? String(normalized.id)}`;
      if (!globalSeenKeys.has(dedupeKey) && !seenWorkIds.has(dedupeKey)) {
        result.push(normalized);
        globalSeenKeys.add(dedupeKey);
        seenWorkIds.add(dedupeKey);
      }
    }

    // Push unique checklist work items
    for (const [, item] of uniqueChecklistWork) {
      const dedupeKey = `${ENTITY_PREFIXES.CHECKLIST}:${(item.checklistItemId ?? item.id).toLowerCase?.() ?? String(item.id)}`;
      if (!globalSeenKeys.has(dedupeKey)) {
        result.push(item);
        globalSeenKeys.add(dedupeKey);
      } else {
        console.warn('⚠️ Duplicate checklist work item skipped:', {
          id: item.id,
          checklistItemId: item.checklistItemId,
          title: item.title,
          dedupeKey
        });
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
          const dedupeKey = `${ENTITY_PREFIXES.CHECKLIST}:${checklistId}`;
          if (globalSeenKeys.has(dedupeKey)) {
            console.warn('⚠️ Duplicate checklist item skipped (already seen):', {
              id: normalized.id,
              checklistItemId: checklistId,
              title: normalized.title,
              dedupeKey
            });
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
        const dedupeKey = `${ENTITY_PREFIXES.TASK}:${tid}`;
        if (!globalSeenKeys.has(dedupeKey)) {
        result.push(normalized);
          globalSeenKeys.add(dedupeKey);
        }
      }
    }
  }

  // Final defensive dedupe across all items to ensure no visual duplicates remain
  const final: TodayItem[] = [];
  const score = (s: StatusValue) => {
    if (s === STATUS.IN_PROGRESS) return STATUS_PRIORITY_SCORE.IN_PROGRESS;
    if (s === STATUS.PLANNED) return STATUS_PRIORITY_SCORE.PLANNED;
    if (s === STATUS.DONE) return STATUS_PRIORITY_SCORE.DONE;
    return STATUS_PRIORITY_SCORE.SKIPPED;
  };

  console.log('🔍 Before final dedupe, result count:', result.length);

  // Keep the highest-priority item per logical entity key
  // CRITICAL: Dedupe by item.id to prevent React duplicate key errors
  const bestByKey = new Map<string, TodayItem>();
  for (const it of result) {
    // Use item.id directly as the deduplication key
    // This ensures no two items with the same ID reach React rendering
    const key = `item:${String(it.id).toLowerCase()}`;
    const prev = bestByKey.get(key);
    if (prev) {
      console.warn('⚠️ Final dedupe: Duplicate item.id found!', {
        key,
        existing: { id: prev.id, checklistItemId: prev.checklistItemId, title: prev.title, status: prev.status },
        new: { id: it.id, checklistItemId: it.checklistItemId, title: it.title, status: it.status }
      });
    }
    if (!prev || score(it.status) > score(prev.status)) {
      bestByKey.set(key, it);
    }
  }

  for (const [, it] of bestByKey) {
    final.push(it);
  }

  console.log('🔍 After final dedupe, final count:', final.length);

  return final;
}

/**
 * Builds a lookup map from schedule entries
 * 
 * Handles conflict resolution when multiple entries reference the same work item:
 * - Prefers newer updated_at
 * - Falls back to earlier start_at
 */
export function buildScheduleLookup(
  scheduleEntries: ScheduleEntry[],
  filterStatus: StatusValue = STATUS.PLANNED
): Map<string, ScheduleEntry> {
  const scheduleLookup = new Map<string, ScheduleEntry>();

  // Register helper: adds entry to map with multiple keys
  const register = (entry: ScheduleEntry) => {
    const keys: string[] = [];
    const workId = (entry as any).work_id ?? entry.work_item_id;
    if (workId) keys.push(workId.toLowerCase());
    if (entry.task_id) keys.push(entry.task_id.toLowerCase());
    if (entry.checklist_item_id) keys.push(entry.checklist_item_id.toLowerCase());

    for (const key of keys) {
      const existing = scheduleLookup.get(key);
      
      if (!existing) {
        scheduleLookup.set(key, entry);
        continue;
      }

      // Priority 1: If both have updated_at, prefer the newer one
      const incomingUpdatedAt = getUpdatedAt(entry);
      const existingUpdatedAt = getUpdatedAt(existing);
      
      if (incomingUpdatedAt !== undefined && existingUpdatedAt !== undefined) {
        if (incomingUpdatedAt > existingUpdatedAt) {
          scheduleLookup.set(key, entry);
        }
        continue;
      }

      // Priority 2: If only one has updated_at, prefer that one
      if (incomingUpdatedAt !== undefined && existingUpdatedAt === undefined) {
        scheduleLookup.set(key, entry);
        continue;
      }
      if (incomingUpdatedAt === undefined && existingUpdatedAt !== undefined) {
        continue;
      }

      // Priority 3: If neither has updated_at, prefer earlier start_at
      const incomingStart = new Date(entry.start_at).getTime();
      const existingStart = new Date(existing.start_at).getTime();
      if (incomingStart <= existingStart) {
        scheduleLookup.set(key, entry);
      }
    }
  };

  // Build schedule lookup map
  for (const entry of scheduleEntries) {
    if (entry.status !== undefined && entry.status !== filterStatus) continue;
    register(entry);
  }

  return scheduleLookup;
}

/**
 * Augments TodayItems with schedule data (startAt, plannedMinutes)
 */
export function augmentWithSchedule(
  items: TodayItem[],
  scheduleLookup: Map<string, ScheduleEntry>
): TodayItem[] {
  return items.map((item) => {
    let scheduleEntry: ScheduleEntry | undefined;

    // Try to find schedule entry by multiple keys
    if (item.id) {
      scheduleEntry = scheduleLookup.get(item.id.toLowerCase());
    }
    if (!scheduleEntry && item.taskId) {
      scheduleEntry = scheduleLookup.get(item.taskId.toLowerCase());
    }
    if (!scheduleEntry && item.checklistItemId) {
      scheduleEntry = scheduleLookup.get(item.checklistItemId.toLowerCase());
    }

    if (scheduleEntry?.start_at) {
      const plannedMinutes = 
        scheduleEntry.planned_minutes ?? 
        scheduleEntry.plannedMinutes ?? 
        item.plannedMinutes;
      return {
        ...item,
        startAt: scheduleEntry.start_at,
        plannedMinutes,
      };
    }

    return item;
  });
}

/**
 * Filters items to only include those relevant for today's view:
 * 1. Items without schedule (startAt = null) 
 * 2. Items with IN_PROGRESS status (work in progress, regardless of scheduled date)
 * 3. Items scheduled for today
 * 
 * Excludes: Items scheduled for other days (past/future) that are not in progress
 */
export function filterTodayItems(items: TodayItem[]): TodayItem[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  
  return items.filter(item => {
    // Always show items without a schedule
    if (!item.startAt) return true;
    
    // Always show items that are in progress (regardless of scheduled date)
    if (item.status === 1) return true; // STATUS.IN_PROGRESS = 1
    
    // For other items, only show if scheduled for today
    const scheduledAt = new Date(item.startAt);
    if (Number.isNaN(scheduledAt.getTime())) return true;
    return scheduledAt >= startOfToday && scheduledAt < startOfTomorrow;
  });
}

/**
 * Helper to find a schedule entry for a specific item
 */
export function findScheduleEntryForItem(
  item: TodayItem,
  scheduleLookup: Map<string, ScheduleEntry>
): ScheduleEntry | undefined {
  if (item.id) {
    const entry = scheduleLookup.get(item.id.toLowerCase());
    if (entry) return entry;
  }
  if (item.taskId) {
    const entry = scheduleLookup.get(item.taskId.toLowerCase());
    if (entry) return entry;
  }
  if (item.checklistItemId) {
    const entry = scheduleLookup.get(item.checklistItemId.toLowerCase());
    if (entry) return entry;
  }
  return undefined;
}


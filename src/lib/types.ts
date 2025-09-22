// Common types used across the application

export type StatusValue = 0 | 1 | 2 | 3;
export type PriorityValue = 1 | 2 | 3 | null;

export const STATUS = {
  PLANNED: 0 as StatusValue,
  IN_PROGRESS: 1 as StatusValue,
  DONE: 2 as StatusValue,
  SKIPPED: 3 as StatusValue,
} as const;

export const PRIORITY = {
  MUST: 1,
  SHOULD: 2,
  WANT: 3,
} as const;

// Task-related interfaces
export interface TaskRecord {
  task_id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority?: PriorityValue;
  status: StatusValue;
  is_atomic: boolean;
  created_at: string;
  updated_at: string;
  start_at?: string;
  planned_minutes?: number;
  checklist?: ChecklistItemRecord[];
  workItems?: WorkItemRecord[];
}

export interface ChecklistItemRecord {
  checklist_item_id: string;
  task_id: string;
  title: string;
  deadline?: string;
  priority?: PriorityValue;
  status: StatusValue;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WorkItemRecord {
  work_item_id: string;
  task_id: string;
  checklist_item_id?: string;
  start_at?: string;
  planned_minutes?: number;
  status: StatusValue;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: TaskRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaskFilters {
  search?: string;
  status?: StatusValue | 'all';
  priority?: PriorityValue | 'all';
  page?: number;
  pageSize?: number;
}

// TodayPage specific types
export interface TodayItem {
  id: string;
  source: "task" | "checklist";
  title: string;
  parentTitle: string | null;
  status: StatusValue;
  priority: PriorityValue;
  startAt: string | null;
  plannedMinutes: number | null;
  deadline: string | null;
  updatedAt?: number;
  taskId: string | null;
  checklistItemId: string | null;
}

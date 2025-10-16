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

/**
 * Get the display status for a task
 * For atomic tasks: uses manual status
 * For non-atomic tasks: uses derived status (computed from checklist items)
 */
export function getTaskDisplayStatus(task: TaskRecord): StatusValue {
  return task.derived_status;
}

// Task-related interfaces
export interface TaskRecord {
  id?: string; // Backend may return 'id' instead of 'task_id'
  task_id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority?: PriorityValue;
  status: StatusValue;
  derived_status: StatusValue; // Auto-computed from checklist items (for non-atomic tasks)
  is_atomic: boolean;
  total_items?: number; // Number of checklist items
  done_items?: number; // Number of completed checklist items
  created_at: string;
  updated_at: string;
  start_at?: string;
  planned_minutes?: number;
  checklist?: ChecklistItemRecord[];
  workItems?: WorkItemRecord[];
}

export interface ChecklistItemRecord {
  id?: string; // Backend may return 'id' instead of 'checklist_item_id'
  checklist_item_id: string;
  task_id: string;
  title: string;
  deadline?: string;
  priority?: PriorityValue;
  status: StatusValue;
  order_index: number;
  start_at?: string;
  planned_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkItemRecord {
  work_item_id: string;
  work_id?: string; // Alias for work_item_id (backend uses this field name)
  task_id: string;
  checklist_item_id?: string | null; // Populated for checklist items
  atomic_task_id?: string | null; // Populated for atomic tasks
  start_at?: string;
  planned_minutes?: number;
  status: StatusValue;
  is_atomic?: boolean;
  work_type?: 'checklist_item' | 'atomic_task'; // Source type identifier
  title?: string; // Work item title
  effective_deadline?: string;
  effective_priority?: number;
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

// Study Profile Enums
export const Chronotype = {
  MorningWarrior: 0,
  NightOwl: 1,
  Flexible: 2
} as const;

export const FocusStyle = {
  DeepFocus: 0,
  SprintWorker: 1,
  Multitasker: 2
} as const;

export const WorkStyle = {
  DeadlineDriven: 0,
  SteadyPacer: 1
  // NO VALUE 2 - Database constraint
} as const;

export type Chronotype = typeof Chronotype[keyof typeof Chronotype];
export type FocusStyle = typeof FocusStyle[keyof typeof FocusStyle];
export type WorkStyle = typeof WorkStyle[keyof typeof WorkStyle];

export interface StudyProfile {
  user_id: string;
  chronotype: Chronotype;
  focusStyle: FocusStyle;
  workStyle: WorkStyle;
  updated_at: string;
}

export interface StudyProfileFormData {
  chronotype: Chronotype;
  focusStyle: FocusStyle;
  workStyle: WorkStyle;
}

// Stats-related types
export interface StatsOverview {
  totalTasksCompleted: number;
  totalChecklistItemsCompleted: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  lastLoginAt: string;
  totalLoginCount: number;
}

export interface DailyActivity {
  date: string;
  tasksCompleted: number;
  checklistItemsCompleted: number;
  focusMinutes: number;
  sessionsCount: number;
}

export interface DailyActivityResponse {
  dailyActivity: DailyActivity[];
  meta: {
    fromDate: string;
    toDate: string;
    totalDays: number;
  };
}

export interface StreakPeriod {
  id: string;
  streakCount: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface StreakHistoryResponse {
  streakHistory: StreakPeriod[];
  meta: {
    totalCount: number;
    limit: number;
  };
}

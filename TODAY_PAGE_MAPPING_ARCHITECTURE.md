# Today Page - Kiến trúc Mapping và Mối quan hệ

## Tổng quan Entity trong hệ thống

### 1. Database Entities

```
Task (Atomic hoặc Composite)
  ├── ChecklistItem 1
  ├── ChecklistItem 2
  └── ChecklistItem 3

WorkItem (Schedule Entry - thực thể đặt lịch)
  ├── Có thể link với Task (atomic task)
  └── Hoặc link với ChecklistItem (từ composite task)

ScheduleEntry (legacy/alias của WorkItem)
  └── Chứa start_at và planned_minutes
```

### 2. Mối quan hệ giữa các Entity

```typescript
// Types từ src/lib/types.ts

TaskRecord {
  task_id: string
  title: string
  is_atomic: boolean        // TRUE = atomic task, FALSE = composite (có checklist)
  checklist?: ChecklistItemRecord[]   // Chỉ có nếu is_atomic = false
  workItems?: WorkItemRecord[]        // Schedule entries cho task này
}

ChecklistItemRecord {
  checklist_item_id: string
  task_id: string            // Parent task
  title: string
  // Kế thừa từ parent task nếu không có
  priority?: number
  deadline?: string
  status: number
}

WorkItemRecord {
  work_item_id: string
  task_id: string            // ALWAYS có
  checklist_item_id?: string // CHỈ có nếu schedule cho checklist item
  start_at?: string          // Thời gian đặt lịch
  planned_minutes?: number   // Duration
  status: number
}
```

### 3. TodayItem - Unified Model

Today page chuyển đổi TẤT CẢ entities thành `TodayItem`:

```typescript
TodayItem {
  id: string              // work_item_id HOẶC checklist_item_id HOẶC task_id
  source: "task" | "checklist"
  title: string
  parentTitle: string | null  // Tên parent task (chỉ có nếu là checklist item)
  
  // Metadata
  status: StatusValue
  priority: 1 | 2 | 3 | null
  startAt: string | null
  plannedMinutes: number | null
  deadline: string | null
  updatedAt?: number
  
  // Foreign keys để trace ngược
  taskId: string | null
  checklistItemId: string | null
}
```

## Chi tiết Mapping Logic

### Phase 1: Normalization (3 functions)

#### A. `normalizeWorkItem(taskRecord, workItemRecord)` 

**Mục đích:** Convert WorkItem thành TodayItem

**Logic quyết định source:**
```typescript
const checklistItemId = readField(workItemRecord, [
  "checklistItemId",
  "checklist_item_id",
  "checklistId", 
  "checklist_id"
]);

return {
  id: workItemRecord.work_item_id ?? taskId,
  source: checklistItemId ? "checklist" : "task",  // ← KEY DECISION
  parentTitle: checklistItemId ? taskRecord.title : null,  // ← Fix gần đây
  // ...
}
```

**Kịch bản:**
1. **WorkItem cho Atomic Task:**
   - `checklistItemId` = null
   - `source` = "task"
   - `parentTitle` = null
   - Hiển thị như một task độc lập

2. **WorkItem cho Checklist Item:**
   - `checklistItemId` = có giá trị
   - `source` = "checklist"
   - `parentTitle` = tên task cha
   - Hiển thị với badge parent task

**Fallback cascade (quan trọng!):**
```typescript
// Status: WorkItem status -> Task status
status: readField(workItemRecord, ["status"]) ?? readField(taskRecord, ["status"])

// Priority: WorkItem priority -> Task priority
priority: readField(workItemRecord, ["priority"]) ?? readField(taskRecord, ["priority"])

// Deadline: WorkItem deadline -> Task deadline
deadline: readField(workItemRecord, ["deadline"]) ?? readField(taskRecord, ["deadline"])
```

#### B. `normalizeChecklist(taskRecord, checklistRecord)`

**Mục đích:** Convert ChecklistItem RAW (chưa có schedule) thành TodayItem

**Logic:**
```typescript
return {
  id: checklistItemId,
  source: "checklist",           // ALWAYS checklist
  parentTitle: taskRecord.title, // ALWAYS có parent
  taskId: taskRecord.task_id,
  checklistItemId: checklistItemId,
  // Kế thừa từ task nếu không có
  status: checklistRecord.status ?? taskRecord.status,
  priority: checklistRecord.priority ?? taskRecord.priority,
  // ...
}
```

**Kịch bản:**
- ChecklistItem chưa được đặt lịch (không có WorkItem)
- Hiển thị với status/priority của chính nó hoặc kế thừa từ parent task

#### C. `normalizeTask(taskRecord)`

**Mục đích:** Convert Task RAW (atomic task không có schedule) thành TodayItem

**Logic:**
```typescript
return {
  id: taskId,
  source: "task",              // ALWAYS task
  parentTitle: null,           // NEVER có parent
  taskId: taskId,
  checklistItemId: null,
  // Chỉ lấy từ task record
  status: taskRecord.status,
  priority: taskRecord.priority,
  // ...
}
```

**Kịch bản:**
- Atomic task chưa được đặt lịch (không có WorkItem)
- Không có checklist
- Hiển thị như standalone task

### Phase 2: Main Mapping (`mapTodayItems`)

**Đây là phần QUAN TRỌNG NHẤT!** Logic xử lý duplicates và conflicts.

#### Step 1: Build Checklist Title Map

```typescript
// Lines 267-282
const checklistTitleMap = new Map<string, string>();
for (const checklistItem of task.checklist) {
  const title = checklistItem.title.trim().toLowerCase();
  checklistTitleMap.set(title, checklistItem.checklist_item_id);
}
```

**Mục đích:** WorkItem có thể thiếu `checklist_item_id` nhưng có title khớp với checklist item
→ Synthesize `checklist_item_id` từ title matching

#### Step 2: Process WorkItems

```typescript
// Lines 284-344
const scheduledChecklistIds = new Set<string>();
const uniqueChecklistWork = new Map<string, TodayItem>();

for (const workItem of taskRecord.workItems) {
  // 1. Title matching để synthesize checklist_item_id nếu thiếu
  let synthesized = null;
  if (!workItem.checklist_item_id) {
    const matchId = checklistTitleMap.get(workItem.title.toLowerCase());
    if (matchId) {
      synthesized = { ...workItem, checklist_item_id: matchId };
    }
  }
  
  const normalized = normalizeWorkItem(taskRecord, synthesized ?? workItem);
  
  // 2. Nếu là checklist work item
  if (normalized.source === "checklist" && normalized.checklistItemId) {
    const checklistId = normalized.checklistItemId.toLowerCase();
    
    // Conflict resolution: chọn item "tốt nhất"
    const prev = uniqueChecklistWork.get(checklistId);
    if (!prev || shouldPreferWorkItem(normalized, prev)) {
      uniqueChecklistWork.set(checklistId, normalized);
    }
    
    scheduledChecklistIds.add(checklistId); // Mark để skip raw checklist
    continue;
  }
  
  // 3. Non-checklist work items: add trực tiếp
  result.push(normalized);
}

// 4. Add unique checklist work items
for (const item of uniqueChecklistWork.values()) {
  result.push(item);
}
```

**Conflict Resolution Logic:**
```typescript
// Line 291-304
function shouldPreferWorkItem(a, b) {
  // Priority 1: Status score (IN_PROGRESS > PLANNED > DONE > SKIPPED)
  const scoreA = a.status === IN_PROGRESS ? 3 : a.status === PLANNED ? 2 : 1;
  const scoreB = b.status === IN_PROGRESS ? 3 : b.status === PLANNED ? 2 : 1;
  if (scoreA !== scoreB) return scoreA > scoreB;
  
  // Priority 2: Earlier startAt
  if (a.startAt !== b.startAt) return a.startAt < b.startAt;
  
  // Priority 3: Newer updatedAt
  return a.updatedAt > b.updatedAt;
}
```

**Ví dụ conflict:**
```
Checklist Item: "Chapter 1" (checklist_item_id: "abc-123")

WorkItem 1:
  - work_item_id: "work-1"
  - checklist_item_id: "abc-123"
  - status: PLANNED
  - start_at: "2025-10-10T09:00:00Z"

WorkItem 2:
  - work_item_id: "work-2"
  - checklist_item_id: "abc-123"  ← SAME!
  - status: IN_PROGRESS           ← Higher priority!
  - start_at: "2025-10-10T14:00:00Z"

→ Chọn WorkItem 2 vì status IN_PROGRESS > PLANNED
```

#### Step 3: Process Raw Checklist Items

```typescript
// Lines 356-386
for (const checklistItem of taskRecord.checklist) {
  const checklistId = checklistItem.checklist_item_id.toLowerCase();
  
  // Skip nếu đã có scheduled work item
  if (scheduledChecklistIds.has(checklistId)) {
    continue;
  }
  
  // Skip nếu đã emit (defensive against backend duplicates)
  if (globalSeenChecklistIds.has(checklistId)) {
    continue;
  }
  
  const normalized = normalizeChecklist(taskRecord, checklistItem);
  result.push(normalized);
  globalSeenChecklistIds.add(checklistId);
}
```

**Logic:**
- CHỈ hiển thị raw checklist item nếu chưa có scheduled work item
- Tránh duplicate: một checklist item chỉ xuất hiện MỘT LẦN

#### Step 4: Process Atomic Tasks

```typescript
// Lines 388-399
if (!workItems.length && !checklist.length) {
  const normalized = normalizeTask(taskRecord);
  result.push(normalized);
}
```

**Logic:**
- CHỈ hiển thị task nếu:
  1. Không có work items (chưa schedule)
  2. Không có checklist (is_atomic = true)
- Composite tasks (có checklist) KHÔNG BAO GIỜ hiển thị trực tiếp

#### Step 5: Final Deduplication

```typescript
// Lines 402-421
const bestByKey = new Map<string, TodayItem>();

for (const item of result) {
  const baseId = item.source === "checklist" 
    ? item.checklistItemId 
    : item.taskId;
  const key = `${item.source}:${baseId.toLowerCase()}`;
  
  const prev = bestByKey.get(key);
  if (!prev || score(item.status) > score(prev.status)) {
    bestByKey.set(key, item);
  }
}

return Array.from(bestByKey.values());
```

**Defensive layer cuối cùng:**
- Group theo logical entity (checklist_item_id hoặc task_id)
- Chọn item có status score cao nhất
- Đảm bảo KHÔNG CÓ DUPLICATE trên UI

### Phase 3: Schedule Augmentation

**Sau khi có TodayItems, merge với ScheduleEntries:**

```typescript
// Lines 525-626 trong useTodayData
const scheduleQuery = useQuery(["schedule", "upcoming"], ...);

const augmentedItems = mappedItems.map(item => {
  // Lookup schedule entry by multiple keys
  let scheduleEntry = 
    scheduleLookup.get(item.id) ??           // work_item_id
    scheduleLookup.get(item.taskId) ??       // task_id
    scheduleLookup.get(item.checklistItemId); // checklist_item_id
  
  if (scheduleEntry) {
    return {
      ...item,
      startAt: scheduleEntry.start_at,
      plannedMinutes: scheduleEntry.planned_minutes ?? item.plannedMinutes
    };
  }
  
  return item;
});
```

**Conflict resolution trong schedule lookup:**
```typescript
// Lines 533-575
function register(entry) {
  // Priority 1: Newer updated_at
  if (incomingUpdatedAt > existingUpdatedAt) {
    scheduleLookup.set(key, entry);
  }
  
  // Priority 2: Earlier start_at
  if (incomingStart < existingStart) {
    scheduleLookup.set(key, entry);
  }
}
```

## Các kịch bản thực tế

### Kịch bản 1: Atomic Task chưa schedule

```
Input:
  Task: "Write report"
    - is_atomic: true
    - status: PLANNED
    - workItems: []
    - checklist: []

Processing:
  → normalizeTask()
  → result.push(TodayItem)

Output:
  TodayItem {
    id: task_id
    source: "task"
    title: "Write report"
    parentTitle: null
    status: PLANNED
  }
```

### Kịch bản 2: Atomic Task đã schedule

```
Input:
  Task: "Write report"
    - task_id: "task-1"
    - is_atomic: true
    - workItems: [
        {
          work_item_id: "work-1"
          task_id: "task-1"
          checklist_item_id: null
          start_at: "2025-10-10T09:00"
          planned_minutes: 60
        }
      ]

Processing:
  1. normalizeWorkItem() → TodayItem (source: "task")
  2. Skip normalizeTask() vì có workItems

Output:
  TodayItem {
    id: "work-1"              ← work_item_id
    source: "task"
    title: "Write report"
    parentTitle: null
    startAt: "2025-10-10T09:00"
    plannedMinutes: 60
  }
```

### Kịch bản 3: Composite Task với Checklist (chưa schedule)

```
Input:
  Task: "Book project"
    - task_id: "task-2"
    - is_atomic: false
    - workItems: []
    - checklist: [
        {
          checklist_item_id: "check-1"
          title: "Chapter 1"
          status: PLANNED
        },
        {
          checklist_item_id: "check-2"
          title: "Chapter 2"
          status: PLANNED
        }
      ]

Processing:
  1. Skip workItems (empty)
  2. normalizeChecklist() for each → 2 TodayItems
  3. Skip normalizeTask() vì có checklist

Output:
  [
    TodayItem {
      id: "check-1"
      source: "checklist"
      title: "Chapter 1"
      parentTitle: "Book project"  ← Badge!
      taskId: "task-2"
      checklistItemId: "check-1"
    },
    TodayItem {
      id: "check-2"
      source: "checklist"
      title: "Chapter 2"
      parentTitle: "Book project"
      taskId: "task-2"
      checklistItemId: "check-2"
    }
  ]
```

### Kịch bản 4: Checklist Item đã schedule

```
Input:
  Task: "Book project"
    - task_id: "task-2"
    - workItems: [
        {
          work_item_id: "work-3"
          task_id: "task-2"
          checklist_item_id: "check-1"  ← Scheduled!
          start_at: "2025-10-10T09:00"
          planned_minutes: 120
          status: IN_PROGRESS
        }
      ]
    - checklist: [
        {
          checklist_item_id: "check-1"
          title: "Chapter 1"
          status: PLANNED  ← Older status
        },
        {
          checklist_item_id: "check-2"
          title: "Chapter 2"
        }
      ]

Processing:
  1. normalizeWorkItem(work-3) → TodayItem for check-1
     - scheduledChecklistIds.add("check-1")
  2. normalizeChecklist(check-1) → SKIP! (đã scheduled)
  3. normalizeChecklist(check-2) → TodayItem

Output:
  [
    TodayItem {
      id: "work-3"                 ← work_item_id
      source: "checklist"
      title: "Chapter 1"
      parentTitle: "Book project"
      status: IN_PROGRESS          ← From WorkItem, not checklist
      startAt: "2025-10-10T09:00"
      taskId: "task-2"
      checklistItemId: "check-1"
    },
    TodayItem {
      id: "check-2"
      source: "checklist"
      title: "Chapter 2"
      parentTitle: "Book project"
      startAt: null
      taskId: "task-2"
      checklistItemId: "check-2"
    }
  ]
```

### Kịch bản 5: Multiple WorkItems cho cùng Checklist Item

```
Input:
  Task: "Book project"
    - workItems: [
        {
          work_item_id: "work-1"
          checklist_item_id: "check-1"
          status: PLANNED
          start_at: "2025-10-10T09:00"
        },
        {
          work_item_id: "work-2"
          checklist_item_id: "check-1"  ← SAME!
          status: IN_PROGRESS           ← Better!
          start_at: "2025-10-10T14:00"
        },
        {
          work_item_id: "work-3"
          checklist_item_id: "check-1"  ← SAME!
          status: PLANNED
          start_at: "2025-10-09T09:00"  ← Earlier
        }
      ]
    - checklist: [
        {
          checklist_item_id: "check-1"
          title: "Chapter 1"
        }
      ]

Processing:
  1. Process work-1: add to uniqueChecklistWork["check-1"]
  2. Process work-2: shouldPreferWorkItem(work-2, work-1)
     - work-2.status (IN_PROGRESS=3) > work-1.status (PLANNED=2)
     - Replace: uniqueChecklistWork["check-1"] = work-2
  3. Process work-3: shouldPreferWorkItem(work-3, work-2)
     - work-3.status (PLANNED=2) < work-2.status (IN_PROGRESS=3)
     - Keep work-2
  4. Skip raw checklist (scheduledChecklistIds has "check-1")

Output:
  TodayItem {
    id: "work-2"               ← Chosen!
    source: "checklist"
    title: "Chapter 1"
    status: IN_PROGRESS        ← Best status
    startAt: "2025-10-10T14:00"
  }
```

## Design Principles & Trade-offs

### 1. **Prioritize Scheduled Items**
- WorkItem (đã schedule) luôn được ưu tiên hơn raw checklist/task
- Lý do: WorkItem có thông tin schedule (start_at, planned_minutes) quan trọng hơn

### 2. **Avoid UI Duplicates**
- Nhiều layer deduplication (per-task, global, final)
- Lý do: Backend có thể trả về duplicate data

### 3. **Status Priority**
- IN_PROGRESS > PLANNED > DONE > SKIPPED
- Lý do: User quan tâm nhất đến task đang làm

### 4. **Composite Task Hiding**
- Composite task (có checklist) KHÔNG BAO GIỜ hiển thị trực tiếp
- CHỈ hiển thị checklist items
- Lý do: Checklist items mới là unit of work thực sự

### 5. **Parent Badge Logic**
- CHỈ hiển thị parent badge cho checklist items
- KHÔNG hiển thị cho atomic tasks (dù có trong workItem)
- Lý do: Tránh confusion, atomic task không có "parent"

### 6. **Fallback Cascade**
- WorkItem/ChecklistItem kế thừa từ Task nếu thiếu data
- Lý do: Giảm redundancy trong database

## Performance Considerations

### Bottlenecks
1. **Triple loop:** tasks → workItems → checklist
2. **Multiple Maps/Sets:** deduplication overhead
3. **Title matching:** O(n) string comparison

### Optimizations đã có
1. **useMemo:** Chỉ recalculate khi data thay đổi
2. **Lowercase normalization:** Consistent key comparison
3. **Early returns:** Skip unnecessary processing

### Có thể cải thiện
1. **Index by ID:** Pre-build lookup maps
2. **Batch processing:** Group similar operations
3. **Memoize normalizers:** Cache normalized results

## Testing Checklist

- [ ] Atomic task without schedule
- [ ] Atomic task with schedule
- [ ] Composite task with checklist (no schedule)
- [ ] Checklist item with schedule
- [ ] Multiple schedules for same checklist item
- [ ] Duplicate checklist items from backend
- [ ] Missing checklist_item_id with title match
- [ ] Status priority selection
- [ ] Parent badge showing/hiding
- [ ] Schedule augmentation
- [ ] Today filter (only today's items)

---

## 🏗️ Current Architecture (Updated 2024)

### Data Layer Structure

The Today page data flow has been refactored into a clean, modular architecture:

```
src/features/schedule/
├── hooks/
│   ├── useTodayData.ts          (Main hook - 177 lines, orchestration only)
│   ├── useScheduleData.ts       (Centralized schedule fetching)
│   └── useTodayKeyboardShortcuts.ts
├── utils/
│   └── normalizeTodayData.ts    (Pure functions - 584 lines)
└── constants/
    └── cacheConfig.ts           (All magic numbers extracted)
```

### Key Hooks

#### 1. **useScheduleData()** - Centralized Schedule Fetching
**Location:** `src/features/schedule/hooks/useScheduleData.ts`

**Purpose:** Single source of truth for fetching schedule entries across all views.

**Usage:**
```typescript
const { data, isLoading, error } = useScheduleData(
  userId,
  { preset: 'today' },  // or { from: Date, to: Date }
  { 
    status: STATUS.PLANNED,
    order: 'asc',
    page: 1,
    pageSize: 100
  }
);
```

**Range Presets:**
- `'today'` - Current day only
- `'week'` - Current week
- `'month'` - Current month
- `'upcoming'` - Next 30 days
- `{ from: Date, to: Date }` - Custom range

**Query Keys:** Includes all parameters to prevent cache collisions
```typescript
["schedule", "entries", userId, from, to, status, page, pageSize, order]
```

**Helper Hooks:**
```typescript
useTodaySchedule(userId)      // Today's planned entries
useUpcomingSchedule(userId)   // All upcoming entries
```

#### 2. **useTodayData()** - Main Today Page Hook
**Location:** `src/features/schedule/hooks/useTodayData.ts`

**Simplified Flow:**
```typescript
export function useTodayData(userId: string | null): TodayDataResult {
  // Step 1: Fetch tasks and schedules
  const tasksQuery = useTasksData(userId);
  const { data: scheduleData } = useScheduleData(userId, { preset: 'today' });
  
  // Step 2: Process data through utils
  const { items, scheduleLookup } = useMemo(() => {
    const mapped = mapTodayItems(tasksQuery.data);           // Normalize
    const lookup = buildScheduleLookup(scheduleEntries);     // Index
    const augmented = augmentWithSchedule(mapped, lookup);   // Merge
    const filtered = filterTodayItems(augmented);            // Filter
    return { items: filtered, scheduleLookup: lookup };
  }, [tasksQuery.data, scheduleData]);
  
  // Step 3: Categorize and return
  return { items, categories, findScheduleEntry };
}
```

### Pure Utility Functions

**Location:** `src/features/schedule/utils/normalizeTodayData.ts`

All helper functions extracted for **reusability** and **testability**.

#### Data Type Converters (6 functions)
```typescript
readField()       // Safe field reading with fallback keys
toNumber()        // Convert to number safely
toStatus()        // Convert to StatusValue
toPriority()      // Convert to priority (1, 2, 3, or null)
toDateValue()     // Convert to timestamp
getUpdatedAt()    // Extract updated_at from schedule entries
```

#### Normalization Functions (3 functions)
```typescript
normalizeWorkItem()    // WorkItemRecord → TodayItem
normalizeChecklist()   // ChecklistItemRecord → TodayItem
normalizeTask()        // TaskRecord → TodayItem (atomic)
```

#### Mapping & Deduplication (2 functions)
```typescript
mapTodayItems()           // Main mapping with deduplication
shouldPreferWorkItem()    // Conflict resolution logic
```

#### Schedule Integration (4 functions)
```typescript
buildScheduleLookup()        // Create schedule lookup map
augmentWithSchedule()        // Merge schedule data into items
filterTodayItems()           // Filter to today's date range
findScheduleEntryForItem()   // Lookup helper
```

### Constants Configuration

**Location:** `src/features/schedule/constants/cacheConfig.ts`

All magic numbers extracted into documented constants:

```typescript
// Cache timings (5 min stale, 10 min GC)
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000,
  GC_TIME: 10 * 60 * 1000,
} as const;

// Timer intervals
export const TIMER_INTERVALS = {
  COUNTDOWN_TICK_MS: 1000,
  ANIMATION_DELAY_MS: 10,
  SESSION_TRANSITION_DELAY_MS: 1000,
  CLOSE_TIMER_DELAY_MS: 300,
  FOCUS_INPUT_DELAY_MS: 40,
} as const;

// Entity key prefixes for deduplication
export const ENTITY_PREFIXES = {
  WORK_ITEM: 'work',
  CHECKLIST: 'check',
  TASK: 'task',
} as const;

// Default values
export const DEFAULT_VALUES = {
  FOCUS_DURATION_MINUTES: 25,
  SHORT_BREAK_MINUTES: 5,
  LONG_BREAK_MINUTES: 15,
  SESSIONS_BEFORE_LONG_BREAK: 4,
  DEFAULT_PRIORITY: 2,
  WIDGET_EDGE_MARGIN: 20,
  WIDGET_WIDTH: 200,
  WIDGET_HEIGHT: 150,
} as const;

// Status priority for conflict resolution
export const STATUS_PRIORITY_SCORE = {
  IN_PROGRESS: 3,
  PLANNED: 2,
  DONE: 1,
  SKIPPED: 0,
} as const;

// Pagination defaults (used in all data hooks)
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 100,
} as const;
```

**Usage Locations:**
- `useTodayData.ts` - Cache config, pagination, entity prefixes
- `useTasksData.ts` - Cache config, pagination
- `CalendarView.tsx` - Cache config, pagination
- `useTodayTimer.ts` - Timer intervals, default values
- `TodayPage.tsx` - Default values, timer intervals
- `constants.ts` - Default values for focus duration helpers

### Data Fetching Hooks Using Constants

#### Tasks Hooks
```typescript
// src/features/schedule/hooks/useTodayData.ts (Today page)
useTasksData(userId) {
  queryFn: () => api.get("/tasks/by-user/" + userId, {
    params: {
      page: PAGINATION.DEFAULT_PAGE,        // = 1
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE, // = 100
    }
  }),
  staleTime: CACHE_CONFIG.STALE_TIME,
  gcTime: CACHE_CONFIG.GC_TIME
}

// src/features/tasks/hooks/useTasksData.ts (Tasks page)
useTasksData(userId, filters) {
  queryFn: () => api.get(`/tasks/by-user/${userId}`, {
    params: {
      page: filters.page || PAGINATION.DEFAULT_PAGE,
      pageSize: filters.pageSize || 20,  // UI pagination
    }
  }),
  staleTime: CACHE_CONFIG.STALE_TIME
}

// src/components/ui/CalendarView.tsx (Planner)
useInfiniteQuery({
  initialPageParam: PAGINATION.DEFAULT_PAGE,
  queryFn: ({ pageParam }) => api.get(`/tasks/by-user/${userId}`, {
    params: {
      page: pageParam,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    }
  }),
  staleTime: CACHE_CONFIG.STALE_TIME
})
```

### ⚡ Cache Invalidation Pattern (FIXED)

#### Problem: Stale Data After Mutations
**Issue:** Schedule data uses `staleTime: 5 * 60 * 1000` (5 minutes). After PATCH `start_at` or `planned_minutes`, the cache is still "fresh" → React Query doesn't refetch → UI shows old values until:
- Component remounts
- Browser window loses/gains focus  
- staleTime expires (5 minutes)

**Solution:** Force immediate refetch in mutation `onSuccess`:
```typescript
import { SCHEDULE_QUERY_KEY } from "./hooks/useScheduleData";

const updateScheduleMutation = useMutation({
  mutationFn: async ({ entryId, startAt, plannedMinutes }) => {
    await api.patch(`/schedule-entries/${entryId}`, {
      startAt,
      plannedMinutes,
    });
  },
  onSuccess: () => {
    // ✅ Force immediate refetch of ALL active schedule queries
    // Bypasses 5min staleTime → data updates instantly
    queryClient.refetchQueries({ 
      queryKey: SCHEDULE_QUERY_KEY,  // = ["schedule", "entries"]
      type: "active" 
    });
    
    // Also invalidate related queries
    queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }
});
```

**Alternative: Use Helper Hook**
```typescript
import { useScheduleCacheHelpers } from "./hooks/useScheduleData";

function TodayPage() {
  const { refetchScheduleQueries } = useScheduleCacheHelpers();
  
  const updateMutation = useMutation({
    mutationFn: updateScheduleEntry,
    onSuccess: () => {
      refetchScheduleQueries(); // One-liner helper
    }
  });
}
```

**What Changed:**
- ❌ Before: `queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] })` (wrong key!)
- ✅ After: `queryClient.refetchQueries({ queryKey: SCHEDULE_QUERY_KEY, type: "active" })`

**Files Updated:**
- ✅ `src/features/schedule/hooks/useScheduleData.ts` - Exported `SCHEDULE_QUERY_KEY` and `useScheduleCacheHelpers()`
- ✅ `src/features/schedule/TodayPage.tsx` - Fixed `scheduleMutation` and `updateScheduleMutation`

---

### 🔮 TODO: Backend Optimization

#### Current Limitation
**Problem:** Today page fetches ALL tasks (100 per page) and filters to today client-side.

**Current Flow:**
```
1. Frontend: Fetch /tasks/by-user/{userId}?pageSize=100
2. Backend: Returns ALL tasks
3. Frontend: Filter to today in filterTodayItems()
   → Wasteful if user has 500 tasks but only 5 scheduled for today
```

#### Proposed Backend Enhancement

**New API Parameters:**
```typescript
GET /tasks/by-user/{userId}
  ?scheduledFrom=2024-10-05T00:00:00Z  // Filter by schedule date
  &scheduledTo=2024-10-06T00:00:00Z
  &includeUnscheduled=true             // Include items without startAt
  &page=1
  &pageSize=100
```

**Backend Should:**
1. Join with `work_items` table
2. Filter by `work_items.start_at` BETWEEN scheduledFrom AND scheduledTo
3. Include tasks/checklist items without work_items if `includeUnscheduled=true`
4. Return only relevant tasks

**Frontend Changes (when backend ready):**
```typescript
// src/features/schedule/hooks/useTodayData.ts
function useTasksData(userId: string | null) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return useQuery({
    queryFn: async () => {
      const response = await api.get("/tasks/by-user/" + userId, {
        params: {
          // NEW PARAMETERS ↓
          scheduledFrom: startOfToday.toISOString(),
          scheduledTo: startOfTomorrow.toISOString(),
          includeUnscheduled: true,
          // Existing parameters
          page: PAGINATION.DEFAULT_PAGE,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          includeChecklist: true,
          includeWorkItems: true,
        },
      });
      return response.data;
    },
  });
}
```

**Remove client-side filtering:**
```typescript
// Can remove filterTodayItems() call since backend does it
const { items, scheduleLookup } = useMemo(() => {
  const mapped = mapTodayItems(tasksQuery.data);
  const lookup = buildScheduleLookup(scheduleEntries);
  const augmented = augmentWithSchedule(mapped, lookup);
  // const filtered = filterTodayItems(augmented);  ← REMOVE THIS
  return { items: augmented, scheduleLookup: lookup };
}, [tasksQuery.data, scheduleData]);
```

**Benefits:**
- ✅ Reduced payload size (only today's tasks)
- ✅ Faster response time
- ✅ Less client-side processing
- ✅ Scalable to users with 1000+ tasks

**Migration Path:**
1. Add backend support for new parameters (backward compatible)
2. Update `useTasksData()` to use new parameters
3. Keep `filterTodayItems()` as fallback if backend doesn't support it
4. Monitor performance improvements
5. Remove client-side filtering once backend is stable

---

## 🔍 Today Page Filtering Logic (Updated)

### Current Implementation

**Function:** `filterTodayItems()` in `src/features/schedule/utils/normalizeTodayData.ts`

**Behavior:** Shows items relevant to today's work:

```typescript
export function filterTodayItems(items: TodayItem[]): TodayItem[] {
  return items.filter(item => {
    // 1. Always show items without a schedule (startAt = null)
    if (!item.startAt) return true;
    
    // 2. Always show items that are IN_PROGRESS (work in progress)
    if (item.status === STATUS.IN_PROGRESS) return true;
    
    // 3. For other items, only show if scheduled for today
    const scheduledAt = new Date(item.startAt);
    return scheduledAt >= startOfToday && scheduledAt < startOfTomorrow;
  });
}
```

### Filter Rules

| Condition | Example | Show on Today? | Reason |
|-----------|---------|----------------|--------|
| `startAt = null` | Unscheduled task | ✅ YES | Can be scheduled today |
| `startAt = null` + `status = IN_PROGRESS` | Working on it now | ✅ YES | Currently active |
| `startAt = 2024-10-05` (today) | Scheduled for today | ✅ YES | Today's plan |
| `startAt = 2024-10-10` (future) + `status = PLANNED` | Future task | ❌ NO | Not relevant today |
| `startAt = 2024-10-10` (future) + `status = IN_PROGRESS` | Started early | ✅ YES | Work in progress |
| `startAt = 2024-10-01` (past) + `status = PLANNED` | Overdue | ❌ NO | Should be rescheduled |
| `startAt = 2024-10-01` (past) + `status = IN_PROGRESS` | Ongoing work | ✅ YES | Still working on it |

### Design Philosophy

**Show on Today page:**
- ✅ Unscheduled items (user can schedule them today)
- ✅ In-progress items (regardless of scheduled date - track ongoing work)
- ✅ Items scheduled for today

**Hide from Today page:**
- ❌ Items scheduled for other days (unless in progress)
- ❌ Past scheduled items that are still PLANNED (stale data)
- ❌ Future scheduled items (appear on their scheduled day)

### Why Include Unscheduled Items?

**Purpose:** Today page serves as a **triage view** where users can:
1. See what's planned for today
2. Track ongoing work
3. **Schedule unscheduled tasks** that need attention

Without showing `startAt = null` items, users would need to go to Tasks page to find items to schedule, breaking the workflow.

### Alternative: Strict Today-Only Mode

If you want to show ONLY items explicitly scheduled for today:

```typescript
export function filterTodayItems(items: TodayItem[]): TodayItem[] {
  return items.filter(item => {
    // Only show in-progress items
    if (item.status === STATUS.IN_PROGRESS) return true;
    
    // Or items scheduled for today
    if (!item.startAt) return false; // ← Hide unscheduled items
    const scheduledAt = new Date(item.startAt);
    return scheduledAt >= startOfToday && scheduledAt < startOfTomorrow;
  });
}
```

**Trade-off:** Cleaner today view, but users lose quick access to schedule unscheduled tasks.

---

## ⚠️ Critical Bug Fix: Schedule Range Issue (RESOLVED)

### 🐛 Problem

**Symptom:** When scheduling a task for tomorrow with `status = PLANNED`, the task:
- ✅ Still appears on Today page (should be hidden)
- ❌ Shows with `startAt = null` and no `plannedMinutes` (data loss)

### 🔍 Root Cause

**File:** `src/features/schedule/hooks/useTodayData.ts`

**Original code (line 134-138):**
```typescript
const { data: scheduleData } = useScheduleData(
  userId,
  { preset: 'today' },  // ❌ Only fetches schedule entries for TODAY
  { status: STATUS.PLANNED }
);
```

**Problem flow:**
1. User updates schedule entry: `start_at = tomorrow`
2. Mutation refetches schedule data with `preset: 'today'`
3. Backend returns only schedules with `start_at` between `today 00:00` and `tomorrow 00:00`
4. Tomorrow's schedule entry **NOT included** in response
5. `buildScheduleLookup()` doesn't have this entry
6. `augmentWithSchedule()` can't find schedule → item keeps `startAt = null` from task
7. `filterTodayItems()` sees `!item.startAt` → returns `true` → **shows item**
8. **Result:** Task appears without schedule info

### ✅ Solution (Updated)

**Updated code:**
```typescript
// Custom range from START OF TODAY to +30 days
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const endDate = new Date(startOfToday);
endDate.setDate(endDate.getDate() + 30);

const { data: scheduleData } = useScheduleData(
  userId,
  { from: startOfToday, to: endDate }, // ✅ Custom range, not preset
  { status: STATUS.PLANNED }
);
```

**Why custom range instead of preset:**
- ❌ `preset: 'today'` → Too narrow (only today, misses tomorrow's schedules)
- ❌ `preset: 'upcoming'` → Starts from **NOW** (e.g., 3PM), misses morning schedules (8AM, 10AM)
- ✅ Custom `{ from: startOfToday, to: +30days }` → Includes ALL schedules from 00:00 today

**Why this works:**
- Fetches ALL schedule entries from start of today to +30 days
- Includes morning schedules (8AM) even if current time is afternoon (3PM)
- Items scheduled for tomorrow/next week are included
- `augmentWithSchedule()` can properly set `startAt` and `plannedMinutes`
- `filterTodayItems()` correctly filters out items with `startAt` outside today

**New flow:**
1. User updates schedule entry: `start_at = tomorrow 10AM`
2. Mutation refetches with custom range: `{ from: startOfToday, to: +30days }`
3. Backend returns schedule entries from today 00:00 to +30 days (including tomorrow)
4. `buildScheduleLookup()` has tomorrow's entry
5. `augmentWithSchedule()` sets correct `startAt = tomorrow 10AM` and `plannedMinutes`
6. `filterTodayItems()` sees `startAt = tomorrow` → returns `false` → **hides item** ✅
7. **Result:** Task correctly hidden from today view

**Example with today's schedule:**
1. User creates schedule: `start_at = today 8AM`
2. Current time: 3PM (afternoon)
3. Query fetches from `startOfToday (00:00)` to `+30days`
4. 8AM schedule **IS included** in response (even though it's before 3PM)
5. `augmentWithSchedule()` sets `startAt = today 8AM`
6. `filterTodayItems()` sees today → **shows item** ✅

### 📊 Before/After Comparison

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| Schedule task for tomorrow | ❌ Still shows on Today (no schedule info) | ✅ Hidden from Today |
| Schedule task for today | ✅ Shows correctly | ✅ Shows correctly |
| Unscheduled task | ✅ Shows on Today | ✅ Shows on Today |
| Task IN_PROGRESS scheduled tomorrow | ✅ Shows (but no schedule info) | ✅ Shows with schedule info |

### 🔄 Performance Note

**Trade-off:** Fetching 30 days of schedules instead of just today's
- **Data size:** Slightly larger payload (typically 10-50 entries vs 5-10)
- **Benefit:** Correct filtering logic + proper data display
- **Acceptable:** Schedule entries are lightweight objects

**Future optimization:** Backend could support a "broad filter" mode that returns:
- All schedules for items in the task list (regardless of date)
- More efficient than fetching 30 days if user has sparse schedules

### 📝 Files Modified

- ✅ `src/features/schedule/hooks/useTodayData.ts` - Changed `preset: 'today'` to `preset: 'upcoming'`
- ✅ Added comprehensive documentation of the issue


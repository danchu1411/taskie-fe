# Today Page - Prompts Cải Thiện Từng Bước

## 🎯 Mục tiêu
Refactor Today page để cải thiện performance, maintainability và testability mà không làm thay đổi functionality hiện tại.

---

## 🎉 COMPLETED IMPROVEMENTS

### ✅ Task 1.1: Extract Constants (COMPLETED)
**Priority:** HIGH | **Effort:** 30 minutes | **Impact:** Maintainability | **Status:** ✅ DONE

**What was done:**
- Created `src/features/schedule/constants/cacheConfig.ts`
- Extracted all magic numbers:
  - `CACHE_CONFIG` - staleTime, gcTime
  - `TIMER_INTERVALS` - countdown tick, animation delays, transitions
  - `ENTITY_PREFIXES` - work, check, task
  - `DEFAULT_VALUES` - focus duration, break times, priority, widget dimensions
  - `STATUS_PRIORITY_SCORE` - IN_PROGRESS=3, PLANNED=2, DONE=1, SKIPPED=0
  - `PAGINATION` - DEFAULT_PAGE=1, DEFAULT_PAGE_SIZE=100
- Updated all usage locations: useTodayData.ts, useTasksData.ts, CalendarView.tsx, useTodayTimer.ts, TodayPage.tsx
- All constants have JSDoc documentation

**Files Modified:**
- ✅ `src/features/schedule/constants/cacheConfig.ts` (NEW - 105 lines)
- ✅ `src/features/schedule/hooks/useTodayData.ts`
- ✅ `src/features/tasks/hooks/useTasksData.ts`
- ✅ `src/components/ui/CalendarView.tsx`
- ✅ `src/features/schedule/useTodayTimer.ts`
- ✅ `src/features/schedule/TodayPage.tsx`
- ✅ `src/features/schedule/constants.ts`

---

### ✅ Task: Centralized Schedule Hook (COMPLETED)
**Priority:** HIGH | **Effort:** 2 hours | **Impact:** Architecture | **Status:** ✅ DONE

**What was done:**
- Created `useScheduleData()` hook as single source of truth for schedule fetching
- Supports flexible range specification: presets ('today', 'week', 'month', 'upcoming') or custom dates
- Proper query key structure to prevent cache collisions: `["schedule", "entries", userId, from, to, status...]`
- Added helper hooks: `useTodaySchedule()`, `useUpcomingSchedule()`
- Migrated all components to use centralized hook:
  - TodayPage.tsx → uses `useScheduleData(userId, { preset: 'today' })`
  - CalendarView.tsx → uses custom range
  - Upcomming.tsx → uses `useUpcomingSchedule()`

**Files Created:**
- ✅ `src/features/schedule/hooks/useScheduleData.ts` (NEW - 254 lines)

**Files Modified:**
- ✅ `src/features/schedule/hooks/useTodayData.ts`
- ✅ `src/components/ui/CalendarView.tsx`
- ✅ `src/features/schedule/Upcomming.tsx`

---

### ✅ Task: Extract Pure Functions (COMPLETED)
**Priority:** HIGH | **Effort:** 3 hours | **Impact:** Testability + Reusability | **Status:** ✅ DONE

**What was done:**
- Extracted ALL helper functions from `useTodayData.ts` into `utils/normalizeTodayData.ts`
- 15 pure functions organized into categories:
  - Data Type Converters (6): readField, toNumber, toStatus, toPriority, toDateValue, getUpdatedAt
  - Normalization (3): normalizeWorkItem, normalizeChecklist, normalizeTask
  - Mapping & Deduplication (2): mapTodayItems, shouldPreferWorkItem
  - Schedule Integration (4): buildScheduleLookup, augmentWithSchedule, filterTodayItems, findScheduleEntryForItem
- Reduced `useTodayData.ts` from 638 lines to 177 lines (72% reduction)
- All functions are pure, testable, and reusable across views
- Comprehensive JSDoc documentation for each function

**Files Created:**
- ✅ `src/features/schedule/utils/normalizeTodayData.ts` (NEW - 584 lines)

**Files Modified:**
- ✅ `src/features/schedule/hooks/useTodayData.ts` (simplified to 177 lines)

---

### 📝 Documentation Updates (COMPLETED)
**Status:** ✅ DONE

**What was done:**
- Added comprehensive architecture section to `TODAY_PAGE_MAPPING_ARCHITECTURE.md`
- Documented:
  - New data layer structure
  - All hook locations and usage examples
  - Constants configuration and usage locations
  - Pure utility functions by category
  - Data fetching patterns with pagination constants
  - TODO for backend optimization (scheduledFrom/scheduledTo parameters)

**Files Modified:**
- ✅ `TODAY_PAGE_MAPPING_ARCHITECTURE.md` (added "Current Architecture" section)

---

### ✅ Task: Cache Invalidation Fix (COMPLETED)
**Priority:** CRITICAL | **Effort:** 1 hour | **Impact:** User Experience | **Status:** ✅ DONE

**Problem:**
Schedule data was showing stale values after mutations because:
- React Query used `staleTime: 5 minutes`
- Mutations didn't properly invalidate schedule cache
- Used wrong query key: `["schedule", "upcoming"]` instead of `["schedule", "entries", ...]`

**What was done:**
1. **Exported `SCHEDULE_QUERY_KEY`** in `useScheduleData.ts`
   - Base key: `["schedule", "entries"]`
   - Ensures consistent cache invalidation across all mutations

2. **Created `useScheduleCacheHelpers()` hook** with helper functions:
   - `refetchScheduleQueries()` - Force immediate refetch (bypasses staleTime)
   - `invalidateScheduleQueries()` - Mark stale and refetch active
   - Provides clean API for mutations

3. **Fixed mutations in TodayPage**:
   - `scheduleMutation` - Create schedule entry
   - `updateScheduleMutation` - Update schedule entry
   - Both now use: `queryClient.refetchQueries({ queryKey: SCHEDULE_QUERY_KEY, type: "active" })`

4. **Documented the pattern** for future engineers

**Result:**
✅ Schedule updates now appear **instantly** in UI (no 5-minute delay)
✅ Works across all views: Today, Planner, Upcoming
✅ Consistent pattern for all schedule mutations

**Files Modified:**
- ✅ `src/features/schedule/hooks/useScheduleData.ts` (added SCHEDULE_QUERY_KEY + useScheduleCacheHelpers)
- ✅ `src/features/schedule/TodayPage.tsx` (fixed scheduleMutation + updateScheduleMutation)
- ✅ `TODAY_PAGE_MAPPING_ARCHITECTURE.md` (added "Cache Invalidation Pattern" section)

---

### ✅ Task: Schedule Range Bug Fix (COMPLETED)
**Priority:** CRITICAL | **Effort:** 30 minutes | **Impact:** Correctness | **Status:** ✅ DONE

**Problem:**
Tasks scheduled for tomorrow/future dates still appeared on Today page with missing schedule info:
- Item showed `startAt = null` and no `plannedMinutes`
- Should be hidden from Today view entirely

**Root Cause:**
`useTodayData` fetched schedule entries with `preset: 'today'` (only today's range):
- Tomorrow's schedule entry NOT included in response
- `augmentWithSchedule` couldn't find entry → kept `startAt = null`
- `filterTodayItems` saw null → showed item (wrong!)

**Solution:**
Use custom date range from **start of today** to +30 days (not preset):
```typescript
// ❌ BAD: preset: 'today' (too narrow, misses tomorrow)
useScheduleData(userId, { preset: 'today' })

// ❌ BAD: preset: 'upcoming' (from NOW, misses morning schedules)
useScheduleData(userId, { preset: 'upcoming' })

// ✅ GOOD: Custom range from start of today
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const endDate = new Date(startOfToday);
endDate.setDate(endDate.getDate() + 30);

useScheduleData(userId, { from: startOfToday, to: endDate })
```

**Why custom range is needed:**
- `preset: 'today'` → Only fetches today's schedules, can't detect tomorrow's items
- `preset: 'upcoming'` → Starts from current time (e.g., 3PM), **misses morning schedules** (8AM)
- Custom `{ from: startOfToday, to: +30days }` → Includes all schedules from 00:00 today

**Why it works:**
- Fetches from **start of today** (00:00), not current time
- Includes morning schedules even if checked in afternoon
- Includes tomorrow/future schedule entries for proper filtering
- `augmentWithSchedule` properly sets `startAt` and `plannedMinutes`
- `filterTodayItems` correctly filters out non-today items
- IN_PROGRESS items still show regardless of schedule date

**Example scenarios:**
- Schedule at 8AM, checked at 3PM → ✅ Shows correctly (included in fetch)
- Schedule at tomorrow 10AM → ✅ Hidden from today (filtered out)
- Unscheduled task → ✅ Shows on today (filter rule allows null)

**Trade-off:**
- Slightly larger payload (10-50 entries vs 5-10)
- But essential for correct behavior across all times of day

**Files Modified:**
- ✅ `src/features/schedule/hooks/useTodayData.ts` (custom date range from startOfToday)
- ✅ `src/features/schedule/utils/normalizeTodayData.ts` (improved filterTodayItems comments)
- ✅ `TODAY_PAGE_MAPPING_ARCHITECTURE.md` (added "Critical Bug Fix" section with examples)

---

## 📋 PHASE 1: QUICK WINS (1-2 ngày)

### Task 1.1: Extract Constants (COMPLETED - See above)
**Priority:** HIGH | **Effort:** 30 minutes | **Impact:** Maintainability

**Original Prompt:**
```
Tạo file src/features/schedule/constants/cacheConfig.ts và extract tất cả magic numbers trong useTodayData.ts và TodayPage.tsx thành named constants.

Cụ thể:
1. Cache times (staleTime, gcTime)
2. Timer intervals
3. Entity prefixes ("work:", "check:", "task:")
4. Default values (25 minutes, etc.)
5. Status scores cho priority logic

Format:
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000,
  GC_TIME: 10 * 60 * 1000,
} as const;

export const ENTITY_PREFIXES = {
  WORK_ITEM: 'work',
  CHECKLIST: 'check',
  TASK: 'task',
} as const;

Sau đó replace tất cả usages với constants mới.
```

**Validation:**
- [ ] No magic numbers in code
- [ ] Constants có JSDoc comments
- [ ] TypeScript compilation passes

---

### ✅ Task 1.2: Add JSDoc Comments
**Priority:** HIGH | **Effort:** 1 hour | **Impact:** Maintainability

**Prompt:**
```
Thêm JSDoc comments chi tiết cho các functions phức tạp trong src/features/schedule/hooks/useTodayData.ts:

1. shouldPreferWorkItem(): Giải thích priority logic và lý do
2. normalizeWorkItem(): Giải thích fallback cascade
3. normalizeChecklist(): Giải thích inheritance logic
4. mapTodayItems(): Giải thích overall flow và các phases
5. register() trong schedule lookup: Giải thích conflict resolution

Format:
/**
 * Determines which work item to prefer when conflicts occur.
 * 
 * Priority order:
 * 1. Status (IN_PROGRESS > PLANNED > DONE > SKIPPED)
 *    Rationale: User cares about current work
 * 2. Earlier start time
 *    Rationale: Scheduled sessions should be chronological
 * 3. Newer updated_at
 *    Rationale: Latest data is most accurate
 * 
 * @param a - First work item
 * @param b - Second work item
 * @returns true if 'a' should be preferred
 * @example
 * const better = shouldPreferWorkItem(inProgressItem, plannedItem);
 */
```

**Validation:**
- [ ] All complex functions documented
- [ ] Examples included
- [ ] Rationale explained

---

### ✅ Task 1.3: Add Error Boundaries
**Priority:** MEDIUM | **Effort:** 45 minutes | **Impact:** Reliability

**Prompt:**
```
Thêm error handling và graceful degradation vào useTodayData.ts:

1. Wrap mapTodayItems() trong try-catch
2. Return error state nếu mapping fails
3. Add development warnings cho invalid data
4. Update TodayDataResult type để include error

Example:
export interface TodayDataResult {
  tasksQuery: ...;
  items: TodayItem[];
  categories: {...};
  findScheduleEntry: ...;
  error: string | null;  // ← Add this
}

Trong useMemo:
try {
  const mapped = mapTodayItems(tasksQuery.data);
  return { items: mapped, error: null };
} catch (error) {
  console.error('Today items mapping failed:', error);
  if (process.env.NODE_ENV === 'development') {
    console.warn('Invalid data:', tasksQuery.data);
  }
  return { 
    items: [], 
    error: 'Unable to load tasks. Please refresh.' 
  };
}
```

**Validation:**
- [ ] Error state in return type
- [ ] Try-catch around mapping
- [ ] User-friendly error message
- [ ] Development warnings

---

## 📋 PHASE 2: PERFORMANCE (2-3 ngày)

### ✅ Task 2.1: Index WorkItems by ChecklistId
**Priority:** CRITICAL | **Effort:** 2 hours | **Impact:** Performance (30% faster)

**Prompt:**
```
Optimize nested loop trong mapTodayItems() bằng cách pre-build indexed maps.

Tạo helper function trong useTodayData.ts:
/**
 * Builds indexed maps for fast lookup of work items.
 * Replaces O(n) nested loops with O(1) map lookups.
 */
function buildWorkItemIndices(tasks: TaskRecord[]) {
  const byChecklistId = new Map<string, WorkItemRecord[]>();
  const byTaskId = new Map<string, WorkItemRecord[]>();
  
  for (const task of tasks) {
    for (const wi of task.workItems ?? []) {
      // Index by checklist_item_id
      if (wi.checklist_item_id) {
        const key = wi.checklist_item_id.toLowerCase();
        const items = byChecklistId.get(key) ?? [];
        items.push(wi);
        byChecklistId.set(key, items);
      }
      
      // Index by task_id
      const taskKey = (wi.task_id ?? task.task_id).toLowerCase();
      const taskItems = byTaskId.get(taskKey) ?? [];
      taskItems.push(wi);
      byTaskId.set(taskKey, taskItems);
    }
  }
  
  return { byChecklistId, byTaskId };
}

Sau đó refactor mapTodayItems() để sử dụng indices thay vì nested loops.

Before:
for (const workItem of workItems) {
  for (const checklistItem of checklist) {  // O(n²)
    if (match) { ... }
  }
}

After:
const indices = buildWorkItemIndices(tasks);
const workItems = indices.byChecklistId.get(checklistId);  // O(1)
```

**Validation:**
- [ ] No nested loops for matching
- [ ] Performance test: 100 tasks < 150ms
- [ ] Functionality unchanged
- [ ] Unit tests pass

---

### ✅ Task 2.2: Split Large useMemo
**Priority:** HIGH | **Effort:** 1.5 hours | **Impact:** Performance (re-render optimization)

**Prompt:**
```
Split large useMemo trong useTodayData.ts thành multiple smaller memos để tránh unnecessary recalculation.

Current (BAD):
const { items, scheduleLookup } = useMemo(() => {
  const mapped = mapTodayItems(tasksQuery.data);
  const lookup = buildScheduleLookup(scheduleQuery.data);
  const augmented = augmentWithSchedule(mapped, lookup);
  return { items: augmented, scheduleLookup: lookup };
}, [tasksQuery.data, scheduleQuery.data]);  // ← Both deps

Refactor to:
// Step 1: Map tasks (only when tasks change)
const mappedItems = useMemo(() => {
  return mapTodayItems(tasksQuery.data);
}, [tasksQuery.data]);

// Step 2: Build schedule lookup (only when schedules change)
const scheduleLookup = useMemo(() => {
  return buildScheduleLookup(scheduleQuery.data);
}, [scheduleQuery.data]);

// Step 3: Augment (only when either changes)
const augmentedItems = useMemo(() => {
  return augmentWithSchedule(mappedItems, scheduleLookup);
}, [mappedItems, scheduleLookup]);

// Step 4: Filter today (only when augmented changes)
const todayItems = useMemo(() => {
  return filterTodayItems(augmentedItems);
}, [augmentedItems]);

This way:
- scheduleQuery.data change → only step 2 & 3 recalculate
- tasksQuery.data change → only step 1 & 3 recalculate
```

**Validation:**
- [ ] Multiple smaller memos
- [ ] Correct dependency arrays
- [ ] No unnecessary recalculations
- [ ] Performance improved

---

### ✅ Task 2.3: Cache Normalized Results
**Priority:** MEDIUM | **Effort:** 1 hour | **Impact:** Performance (repeated renders)

**Prompt:**
```
Add WeakMap caching cho normalized results để tránh re-normalize cùng data.

Tạo cache ở top level của useTodayData:
const normalizedCache = useRef(new WeakMap<TaskRecord, TodayItem[]>());

Update normalizers:
function normalizeWorkItem(taskRecord, workItemRecord) {
  // Check cache first
  const cacheKey = taskRecord;
  const cached = normalizedCache.current.get(cacheKey);
  if (cached) {
    const found = cached.find(item => item.id === workItemRecord.work_item_id);
    if (found) return found;
  }
  
  // Normalize as before
  const result = { ... };
  
  // Cache result
  const existing = normalizedCache.current.get(cacheKey) ?? [];
  existing.push(result);
  normalizedCache.current.set(cacheKey, existing);
  
  return result;
}

Clear cache khi data changes:
useEffect(() => {
  normalizedCache.current = new WeakMap();
}, [tasksQuery.data]);
```

**Validation:**
- [ ] WeakMap caching implemented
- [ ] Cache cleared on data change
- [ ] No memory leaks
- [ ] Performance improved

---

## 📋 PHASE 3: REFACTORING (3-4 ngày)

### ✅ Task 3.1: Extract Pure Functions - Part 1
**Priority:** HIGH | **Effort:** 3 hours | **Impact:** Testability + Maintainability

**Prompt:**
```
Extract các pure functions từ mapTodayItems() vào separate file:
src/features/schedule/hooks/utils/todayItemMappers.ts

Functions to extract:

1. buildChecklistTitleMap
/**
 * Builds a map of checklist item titles to IDs for title-based matching.
 */
export function buildChecklistTitleMap(
  checklist: ChecklistItemRecord[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of checklist) {
    const id = readField(item, ['checklist_item_id', 'itemId', 'id']);
    const title = (readField(item, ['title']) ?? '').trim().toLowerCase();
    if (id && title) {
      map.set(title, id);
    }
  }
  return map;
}

2. synthesizeChecklistId
/**
 * Attempts to match work item to checklist item by title if ID missing.
 */
export function synthesizeChecklistId(
  workItem: WorkItemRecord,
  titleMap: Map<string, string>
): string | null {
  const rawId = readField(workItem, ['checklist_item_id', 'checklistId']);
  if (rawId) return rawId;
  
  const title = (readField(workItem, ['title']) ?? '').trim().toLowerCase();
  return titleMap.get(title) ?? null;
}

3. selectBestItem
/**
 * Selects the best item from a list based on priority rules.
 */
export function selectBestItem(
  items: TodayItem[],
  strategy: ConflictResolutionStrategy = 'status-time-updated'
): TodayItem | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  
  return items.reduce((best, current) => 
    shouldPreferWorkItem(current, best) ? current : best
  );
}

4. Move shouldPreferWorkItem to this file

Refactor mapTodayItems() để sử dụng các functions này.
```

**Validation:**
- [ ] Pure functions extracted
- [ ] mapTodayItems simplified
- [ ] Unit tests for each function
- [ ] TypeScript passes

---

### ✅ Task 3.2: Extract Pure Functions - Part 2
**Priority:** HIGH | **Effort:** 3 hours | **Impact:** Testability

**Prompt:**
```
Continue extracting pure functions vào todayItemMappers.ts:

5. deduplicateByKey
/**
 * Removes duplicate items, keeping best version of each entity.
 */
export function deduplicateByKey(
  items: TodayItem[]
): TodayItem[] {
  const bestByKey = new Map<string, TodayItem>();
  
  for (const item of items) {
    const key = buildEntityKey(item);
    const existing = bestByKey.get(key);
    
    if (!existing || shouldPreferWorkItem(item, existing)) {
      bestByKey.set(key, item);
    }
  }
  
  return Array.from(bestByKey.values());
}

6. buildEntityKey
/**
 * Creates unique key for an entity (task, checklist item, work item).
 */
export function buildEntityKey(item: TodayItem): string {
  const prefix = ENTITY_PREFIXES[
    item.source === 'checklist' ? 'CHECKLIST' : 'TASK'
  ];
  const id = (
    item.source === 'checklist' 
      ? item.checklistItemId 
      : item.taskId
  ) ?? item.id;
  return `${prefix}:${id.toLowerCase()}`;
}

7. processWorkItemsBatch
/**
 * Processes all work items for a task in one batch.
 */
export function processWorkItemsBatch(
  taskRecord: TaskRecord,
  workItems: WorkItemRecord[],
  titleMap: Map<string, string>
): {
  normalized: TodayItem[];
  scheduledChecklistIds: Set<string>;
} {
  const normalized: TodayItem[] = [];
  const scheduledChecklistIds = new Set<string>();
  const byChecklistId = new Map<string, TodayItem[]>();
  
  for (const wi of workItems) {
    const checklistId = synthesizeChecklistId(wi, titleMap);
    const item = normalizeWorkItem(taskRecord, wi, checklistId);
    
    if (item.source === 'checklist' && checklistId) {
      const items = byChecklistId.get(checklistId) ?? [];
      items.push(item);
      byChecklistId.set(checklistId, items);
      scheduledChecklistIds.add(checklistId.toLowerCase());
    } else {
      normalized.push(item);
    }
  }
  
  // Select best for each checklist
  for (const [, items] of byChecklistId) {
    const best = selectBestItem(items);
    if (best) normalized.push(best);
  }
  
  return { normalized, scheduledChecklistIds };
}

Update mapTodayItems() để sử dụng processWorkItemsBatch().
```

**Validation:**
- [ ] All processing logic extracted
- [ ] mapTodayItems < 80 lines
- [ ] Unit tests for all functions
- [ ] Performance maintained

---

### ✅ Task 3.3: Create Comprehensive Tests
**Priority:** HIGH | **Effort:** 4 hours | **Impact:** Confidence for refactoring

**Prompt:**
```
Tạo file tests cho all pure functions:
src/features/schedule/hooks/utils/__tests__/todayItemMappers.test.ts

Test cases:

describe('buildChecklistTitleMap', () => {
  it('should create map with lowercase titles', () => { ... });
  it('should handle empty checklist', () => { ... });
  it('should skip items without title', () => { ... });
  it('should handle duplicate titles (last wins)', () => { ... });
});

describe('synthesizeChecklistId', () => {
  it('should return existing checklist_item_id if present', () => { ... });
  it('should match by title if ID missing', () => { ... });
  it('should return null if no match', () => { ... });
  it('should handle case-insensitive matching', () => { ... });
});

describe('shouldPreferWorkItem', () => {
  it('should prefer IN_PROGRESS over PLANNED', () => { ... });
  it('should prefer PLANNED over DONE', () => { ... });
  it('should prefer earlier startAt for same status', () => { ... });
  it('should prefer newer updatedAt as last resort', () => { ... });
});

describe('selectBestItem', () => {
  it('should return null for empty array', () => { ... });
  it('should return single item as-is', () => { ... });
  it('should select highest priority from multiple', () => { ... });
});

describe('deduplicateByKey', () => {
  it('should remove duplicates by entity key', () => { ... });
  it('should keep best version of duplicates', () => { ... });
  it('should preserve non-duplicates', () => { ... });
});

describe('processWorkItemsBatch', () => {
  it('should separate checklist and task work items', () => { ... });
  it('should track scheduled checklist IDs', () => { ... });
  it('should select best work item per checklist', () => { ... });
  it('should synthesize checklist IDs from titles', () => { ... });
});

Mỗi test case cần:
- Mock data helpers (createMockTask, createMockWorkItem, etc.)
- Clear assertions
- Edge case coverage
```

**Validation:**
- [ ] All pure functions tested
- [ ] >80% code coverage
- [ ] Edge cases covered
- [ ] Tests pass

---

### ✅ Task 3.4: Refactor mapTodayItems
**Priority:** HIGH | **Effort:** 2 hours | **Impact:** Maintainability

**Prompt:**
```
Refactor mapTodayItems() thành orchestration function sử dụng pure functions đã extract.

Target structure:

function mapTodayItems(payload: TaskListResponse | undefined): TodayItem[] {
  if (!payload?.items?.length) return [];
  
  const result: TodayItem[] = [];
  const globalSeenChecklistIds = new Set<string>();
  const globalSeenKeys = new Set<string>();
  
  for (const task of payload.items) {
    // Phase 1: Build indices
    const titleMap = buildChecklistTitleMap(task.checklist ?? []);
    
    // Phase 2: Process work items
    const { 
      normalized: workItemResults, 
      scheduledChecklistIds 
    } = processWorkItemsBatch(task, task.workItems ?? [], titleMap);
    
    // Phase 3: Add work items with deduplication
    for (const item of workItemResults) {
      const key = buildEntityKey(item);
      if (!globalSeenKeys.has(key)) {
        result.push(item);
        globalSeenKeys.add(key);
        if (item.checklistItemId) {
          globalSeenChecklistIds.add(item.checklistItemId.toLowerCase());
        }
      }
    }
    
    // Phase 4: Process raw checklist (unscheduled items)
    const rawChecklistItems = processRawChecklist(
      task,
      task.checklist ?? [],
      scheduledChecklistIds,
      globalSeenChecklistIds
    );
    result.push(...rawChecklistItems);
    
    // Phase 5: Process atomic task (if applicable)
    const atomicTask = processAtomicTask(task, globalSeenKeys);
    if (atomicTask) result.push(atomicTask);
  }
  
  // Phase 6: Final deduplication
  return deduplicateByKey(result);
}

Target: < 60 lines, McCabe complexity < 10
```

**Validation:**
- [ ] mapTodayItems < 60 lines
- [ ] Complexity < 10
- [ ] All tests pass
- [ ] Functionality unchanged

---

## 📋 PHASE 4: ARCHITECTURE (2-3 ngày)

### ✅ Task 4.1: Create Domain Layer
**Priority:** MEDIUM | **Effort:** 3 hours | **Impact:** Architecture

**Prompt:**
```
Tạo domain layer để encapsulate business logic:
src/features/schedule/domain/

Structure:
domain/
├── types.ts                    # Domain types
├── TodayItemMapper.ts          # Main mapper class
├── ConflictResolver.ts         # Conflict resolution strategies
└── ScheduleAugmenter.ts        # Schedule data augmentation

File: TodayItemMapper.ts

export class TodayItemMapper {
  private titleMapCache = new Map<string, Map<string, string>>();
  
  constructor(
    private conflictResolver: ConflictResolver,
    private cacheEnabled = true
  ) {}
  
  /**
   * Maps raw API response to TodayItems.
   */
  mapFromResponse(payload: TaskListResponse): TodayItem[] {
    if (!payload?.items?.length) return [];
    
    const items: TodayItem[] = [];
    const globalContext = this.createGlobalContext();
    
    for (const task of payload.items) {
      const taskItems = this.mapTask(task, globalContext);
      items.push(...taskItems);
    }
    
    return this.finalizeItems(items);
  }
  
  private mapTask(
    task: TaskRecord, 
    context: GlobalContext
  ): TodayItem[] {
    // Use extracted pure functions
  }
  
  private finalizeItems(items: TodayItem[]): TodayItem[] {
    return deduplicateByKey(items);
  }
  
  clearCache(): void {
    this.titleMapCache.clear();
  }
}

File: ConflictResolver.ts

export class ConflictResolver {
  constructor(private strategy: ConflictStrategy = 'status-time-updated') {}
  
  resolve(items: TodayItem[]): TodayItem | null {
    return selectBestItem(items, this.strategy);
  }
  
  setStrategy(strategy: ConflictStrategy): void {
    this.strategy = strategy;
  }
}

Update useTodayData để sử dụng TodayItemMapper:

const mapper = useMemo(() => new TodayItemMapper(
  new ConflictResolver()
), []);

const mappedItems = useMemo(() => {
  return mapper.mapFromResponse(tasksQuery.data);
}, [tasksQuery.data, mapper]);
```

**Validation:**
- [ ] Domain layer created
- [ ] Class-based architecture
- [ ] Testable in isolation
- [ ] Hook uses domain layer

---

### ✅ Task 4.2: Add Performance Monitoring
**Priority:** MEDIUM | **Effort:** 2 hours | **Impact:** Observability

**Prompt:**
```
Add performance monitoring để track performance trong production.

Tạo file: src/features/schedule/hooks/utils/performance.ts

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      
      if (duration > this.getThreshold(name)) {
        console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
    }
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    }
  }
  
  private recordMetric(name: string, duration: number): void {
    const metrics = this.metrics.get(name) ?? [];
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.metrics.set(name, metrics);
  }
  
  private getThreshold(name: string): number {
    const thresholds: Record<string, number> = {
      'mapTodayItems': 150,
      'buildScheduleLookup': 50,
      'augmentWithSchedule': 30,
    };
    return thresholds[name] ?? 100;
  }
  
  getStats(name: string) {
    const metrics = this.metrics.get(name) ?? [];
    if (metrics.length === 0) return null;
    
    const sorted = [...metrics].sort((a, b) => a - b);
    return {
      count: metrics.length,
      avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      max: sorted[sorted.length - 1],
    };
  }
  
  printStats(): void {
    console.group('Performance Stats');
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, stats);
      }
    }
    console.groupEnd();
  }
}

Update useTodayData:

const perfMonitor = useMemo(() => new PerformanceMonitor(), []);

const mappedItems = useMemo(() => {
  return perfMonitor.measure('mapTodayItems', () => {
    return mapper.mapFromResponse(tasksQuery.data);
  });
}, [tasksQuery.data, mapper, perfMonitor]);

// Expose stats to window for debugging
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    (window as any).__todayPagePerf = perfMonitor;
  }
}, [perfMonitor]);
```

**Validation:**
- [ ] Performance monitoring added
- [ ] Metrics recorded
- [ ] Thresholds configured
- [ ] Dev tools access

---

### ✅ Task 4.3: Add Integration Tests
**Priority:** MEDIUM | **Effort:** 3 hours | **Impact:** Confidence

**Prompt:**
```
Tạo integration tests cho useTodayData hook:
src/features/schedule/hooks/__tests__/useTodayData.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodayData } from '../useTodayData';

describe('useTodayData', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });
  
  it('should return empty items initially', () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useTodayData('user-123'), { wrapper });
    
    expect(result.current.items).toEqual([]);
  });
  
  it('should map tasks correctly after data loads', async () => {
    // Mock API response
    queryClient.setQueryData(['today-tasks', 'user-123'], {
      items: [createMockTask({ ... })],
    });
    
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useTodayData('user-123'), { wrapper });
    
    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0);
    });
    
    expect(result.current.items[0]).toMatchObject({
      source: 'task',
      title: expect.any(String),
    });
  });
  
  it('should handle work items with checklist', async () => { ... });
  it('should deduplicate items', async () => { ... });
  it('should augment with schedule data', async () => { ... });
  it('should filter to today items only', async () => { ... });
  it('should categorize by status', async () => { ... });
});
```

**Validation:**
- [ ] Integration tests created
- [ ] Hook behavior tested
- [ ] Edge cases covered
- [ ] Tests pass

---

## 📋 PHASE 5: OPTIMIZATION (1-2 ngày)

### ✅ Task 5.1: Add Virtualization
**Priority:** LOW | **Effort:** 2 hours | **Impact:** Performance (large lists)

**Prompt:**
```
Add react-window virtualization cho TodaySection khi có nhiều items.

Install: npm install react-window @types/react-window

Update TodaySection.tsx:

import { FixedSizeList } from 'react-window';

export const TodaySection = ({ items, ... }) => {
  const ITEM_HEIGHT = 120; // Adjust based on TodayTaskCard height
  const MAX_HEIGHT = 600;
  
  // Use virtualization if more than 10 items
  if (items.length > 10) {
    return (
      <div>
        <Header />
        <FixedSizeList
          height={Math.min(items.length * ITEM_HEIGHT, MAX_HEIGHT)}
          itemCount={items.length}
          itemSize={ITEM_HEIGHT}
          width="100%"
        >
          {({ index, style }) => (
            <div style={style}>
              <TodayTaskCard item={items[index]} {...props} />
            </div>
          )}
        </FixedSizeList>
      </div>
    );
  }
  
  // Regular rendering for small lists
  return (
    <div>
      <Header />
      {items.map(item => (
        <TodayTaskCard key={item.id} item={item} {...props} />
      ))}
    </div>
  );
};
```

**Validation:**
- [ ] Virtualization for >10 items
- [ ] Smooth scrolling
- [ ] No visual glitches
- [ ] Performance improved

---

### ✅ Task 5.2: Add Memoization to Components
**Priority:** LOW | **Effort:** 1 hour | **Impact:** Re-render optimization

**Prompt:**
```
Wrap expensive components với React.memo và optimize props.

Files to update:
1. TodayTaskCard.tsx
2. TodaySection.tsx
3. StatusChip.tsx

Example for TodayTaskCard:

import { memo } from 'react';

// Extract callback props to avoid inline functions
interface TodayTaskCardProps {
  item: TodayItem;
  onStatusChange: (item: TodayItem) => void;  // ← Pre-bound
  onStart: (item: TodayItem) => void;
  // ...
}

export const TodayTaskCard = memo(function TodayTaskCard({
  item,
  onStatusChange,
  onStart,
  ...props
}: TodayTaskCardProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for deep equality on item
  return (
    prevProps.item === nextProps.item &&
    prevProps.isUpdating === nextProps.isUpdating
  );
});

In TodayPage.tsx, use useCallback:

const handleStatusChange = useCallback((item: TodayItem) => {
  statusMutation.mutate({ item, status: nextStatus });
}, [statusMutation]);

const handleStart = useCallback((item: TodayItem) => {
  timer.openTimer(item);
}, [timer]);
```

**Validation:**
- [ ] Components memoized
- [ ] Callbacks stable
- [ ] No unnecessary re-renders
- [ ] React DevTools profiling

---

## 📊 Success Metrics

Sau khi hoàn thành tất cả phases, measure improvements:

### Performance
- [ ] 100 tasks render time: < 150ms (from 450ms)
- [ ] 200 tasks render time: < 300ms (from 1200ms)
- [ ] P95 latency: < 200ms

### Code Quality
- [ ] McCabe Complexity: < 10 (from 32)
- [ ] Max function length: < 50 lines (from 164)
- [ ] Test coverage: > 80% (from 0%)

### Maintainability
- [ ] No magic numbers
- [ ] All complex logic documented
- [ ] Pure functions extracted
- [ ] Domain layer created

---

## 🔄 Rollback Plan

Nếu có issues sau refactor:

1. **Git branches:** Mỗi phase là một branch riêng
2. **Feature flags:** Wrap new code với feature flag
3. **A/B testing:** Test với small % users first
4. **Monitoring:** Watch error rates và performance metrics
5. **Quick rollback:** `git revert` if needed

---

## 📝 Notes

- Mỗi task nên được implement trên branch riêng
- Run tests sau mỗi task
- Profile performance sau Phase 2
- Code review sau mỗi phase
- Document breaking changes


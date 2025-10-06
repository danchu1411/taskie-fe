# Today Page Mapping - Visual Diagrams

## Diagram 1: Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      Task Record     │
│  ┌────────────────┐  │         ┌──────────────────────┐
│  │   task_id      │  │◄────────│  ChecklistItemRecord │
│  │   title        │  │         │  ┌────────────────┐  │
│  │   is_atomic    │  │         │  │checklist_item_id│ │
│  │   status       │  │         │  │task_id (FK)    │  │
│  │   priority     │  │         │  │title           │  │
│  └────────────────┘  │         │  │status          │  │
│                      │         │  │priority        │  │
│  ┌────────────────┐  │         │  └────────────────┘  │
│  │ checklist[]    │──┼────────>└──────────────────────┘
│  │ workItems[]    │──┼────┐
│  └────────────────┘  │    │
└──────────────────────┘    │
                            │    ┌──────────────────────┐
                            └───>│   WorkItemRecord     │
                                 │  ┌────────────────┐  │
                                 │  │work_item_id    │  │
                                 │  │task_id (FK)    │  │
                                 │  │checklist_item_id│ │ (nullable)
                                 │  │start_at        │  │
                                 │  │planned_minutes │  │
                                 │  │status          │  │
                                 │  └────────────────┘  │
                                 └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      NORMALIZATION LAYER                         │
└─────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────┐
         │      mapTodayItems() Function            │
         └──────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│normalizeTask │  │normalizeWork │  │normalizeCheck│
│              │  │   Item       │  │   list       │
└──────────────┘  └──────────────┘  └──────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                  ┌────────────────┐
                  │   TodayItem    │
                  │  (Unified)     │
                  └────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           UI LAYER                               │
└─────────────────────────────────────────────────────────────────┘

                  ┌────────────────┐
                  │  TodayItem[]   │
                  └────────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ Planned │  │   In    │  │  Done   │
        │ Column  │  │Progress │  │ Column  │
        └─────────┘  └─────────┘  └─────────┘
```

## Diagram 2: Data Flow Timeline

```
TIME ──────────────────────────────────────────────────────────>

T0: User opens Today page
    │
    ├─> useQuery["today-tasks", userId]
    │   └─> GET /tasks/by-user/:userId
    │       - includeChecklist: true
    │       - includeWorkItems: true
    │
    └─> useQuery["schedule", "upcoming"]
        └─> GET /schedule-entries/upcoming
            - from: today 00:00
            - to: tomorrow 00:00

T1: Data arrives
    │
    TaskRecord[] ──> mapTodayItems() ──> TodayItem[]
                            │
                            ├─> Process WorkItems
                            ├─> Process Checklist
                            └─> Process Tasks
    
    ScheduleEntry[] ──> scheduleLookup Map

T2: Merge schedule data
    │
    TodayItem[] + scheduleLookup ──> Augmented TodayItem[]
                                      (with startAt, plannedMinutes)

T3: Filter today's items
    │
    Filter by startAt ──> Final TodayItem[]

T4: Categorize by status
    │
    ├─> planned: status === 0
    ├─> inProgress: status === 1
    └─> completed: status === 2 || status === 3

T5: Render UI
    │
    TodaySection components display items
```

## Diagram 3: Decision Tree - Item Mapping

```
                    ┌──────────────┐
                    │  Task Record │
                    └──────┬───────┘
                           │
                    ┌──────▼──────┐
                    │ Has WorkItems?│
                    └──────┬───────┘
                      Yes  │  No
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐       │
              │ WorkItem  │       │
              │ Loop      │       │
              └─────┬─────┘       │
                    │             │
            ┌───────▼────────┐    │
            │checklistItemId?│    │
            └───────┬────────┘    │
              Yes   │   No        │
            ┌───────┴──────┐      │
            │              │      │
       ┌────▼────┐    ┌────▼────┐ │
       │Normalize│    │Normalize│ │
       │Checklist│    │  Task   │ │
       │WorkItem │    │WorkItem │ │
       └────┬────┘    └────┬────┘ │
            │              │      │
            │         ┌────▼──────▼─────┐
            │         │  Has Checklist? │
            │         └────┬────────────┘
            │         Yes  │  No
            │    ┌─────────┴────┐
            │    │              │
            │ ┌──▼──────┐  ┌────▼────┐
            │ │Checklist│  │   Task  │
            │ │  Loop   │  │normalize│
            │ └──┬──────┘  └────┬────┘
            │    │              │
            │ ┌──▼──────────┐   │
            │ │Is Scheduled?│   │
            │ └──┬──────────┘   │
            │Yes │  No          │
            │ ┌──┴──┐           │
            │ │SKIP │           │
            │ └─────┘    ┌──────▼──────┐
            │            │  Normalize  │
            └────────────┤  Checklist  │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │  TodayItem  │
                         └─────────────┘
```

## Diagram 4: Deduplication Layers

```
Layer 1: Per-Task Deduplication
┌───────────────────────────────────────────┐
│  Task 1                                   │
│  ┌─────────────────────────────────────┐  │
│  │ scheduledChecklistIds Set           │  │
│  │ - Tracks which checklist items      │  │
│  │   already have work items           │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ uniqueChecklistWork Map             │  │
│  │ - One best work item per checklist  │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘

Layer 2: Global Deduplication
┌───────────────────────────────────────────┐
│ globalSeenChecklistIds Set                │
│ - Ensures checklist item appears once     │
│   across ALL tasks                        │
└───────────────────────────────────────────┘
┌───────────────────────────────────────────┐
│ globalSeenKeys Set                        │
│ - Tracks: "work:id", "check:id", "task:id"│
└───────────────────────────────────────────┘

Layer 3: Final Deduplication
┌───────────────────────────────────────────┐
│ bestByKey Map                             │
│ - One TodayItem per logical entity        │
│ - Chooses highest status score            │
└───────────────────────────────────────────┘

                    │
                    ▼
            ┌───────────────┐
            │ Final Result  │
            │ NO DUPLICATES │
            └───────────────┘
```

## Diagram 5: Conflict Resolution Example

```
Scenario: Multiple WorkItems for same Checklist Item

Input:
┌──────────────────────────────────────────────────────┐
│ Checklist Item: "Chapter 1" (check-1)               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  WorkItem A                    WorkItem B           │
│  ├─ work_item_id: work-1      ├─ work_item_id: work-2│
│  ├─ checklist_item_id: check-1├─ checklist_item_id: check-1│
│  ├─ status: PLANNED (2)       ├─ status: IN_PROGRESS (3)  │
│  ├─ start_at: 09:00           ├─ start_at: 14:00         │
│  └─ updated_at: 10:00         └─ updated_at: 11:00       │
│                                                      │
│  WorkItem C                                         │
│  ├─ work_item_id: work-3                           │
│  ├─ checklist_item_id: check-1                     │
│  ├─ status: PLANNED (2)                            │
│  ├─ start_at: 08:00  ← Earlier!                   │
│  └─ updated_at: 09:00                              │
└──────────────────────────────────────────────────────┘

Resolution Process:
┌─────────────────────────────────────┐
│ Step 1: Compare A vs B              │
│ ┌─────────────────────────────────┐ │
│ │ Status: B (3) > A (2)           │ │
│ │ → B WINS                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Step 2: Compare B vs C              │
│ ┌─────────────────────────────────┐ │
│ │ Status: B (3) > C (2)           │ │
│ │ → B WINS (C ignored)            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Result: WorkItem B selected         │
│ ┌─────────────────────────────────┐ │
│ │ id: "work-2"                    │ │
│ │ source: "checklist"             │ │
│ │ title: "Chapter 1"              │ │
│ │ status: IN_PROGRESS             │ │
│ │ startAt: "14:00"                │ │
│ │ parentTitle: "Book project"     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Diagram 6: Today Filter Logic

```
All TodayItems from mapping
         │
         ▼
┌─────────────────────────────────────┐
│ Filter: Only today's items          │
└─────────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐   ┌──────────────────────┐
│ No  │   │ Has startAt?         │
│Start│   └──────────────────────┘
│ At  │            │
└──┬──┘       Yes  │  No
   │          ┌────┴────┐
   │          │         │
   │     ┌────▼────┐    │
   │     │Parse    │    │
   │     │startAt  │    │
   │     └────┬────┘    │
   │          │         │
   │     ┌────▼────────────┐
   │     │ startOfToday <= │
   │     │   startAt <     │
   │     │ startOfTomorrow?│
   │     └────┬────────────┘
   │     Yes  │  No
   │     ┌────┴────┐
   │     │         │
   └─────┤ INCLUDE │   EXCLUDE
         │         │
         └─────────┘

Result: Only items without startAt OR with today's startAt
```

## Diagram 7: Parent Badge Logic

```
TodayItem Processing
         │
         ▼
┌─────────────────────────┐
│ Is source "checklist"?  │
└─────────────────────────┘
    Yes  │  No
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│Has      │ │ No      │
│parent   │ │ Badge   │
│Title    │ └─────────┘
└────┬────┘
     │
     ▼
┌──────────────────────────┐
│ Display Badge:           │
│ ┌──────────────────────┐ │
│ │ 📁 Book Project      │ │
│ └──────────────────────┘ │
└──────────────────────────┘

Examples:
┌─────────────────────────────────────────────────┐
│ Atomic Task (scheduled)                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ ✓ Write Report                              │ │
│ │   No badge (source: "task")                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Checklist Item (scheduled)                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ ✓ Chapter 1                                 │ │
│ │   📁 Book Project ← Badge!                  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Diagram 8: Memory/Performance Profile

```
Input Size Analysis:
┌────────────────────────────────────────┐
│ 100 Tasks                              │
│  ├─ 30 Atomic (no checklist)          │
│  │   └─ 15 have WorkItems (scheduled) │
│  │                                     │
│  └─ 70 Composite (with checklist)     │
│      ├─ Avg 3 checklist items each    │
│      │   = 210 checklist items total  │
│      └─ 50 checklist items scheduled  │
│          = 50 WorkItems                │
└────────────────────────────────────────┘

Processing Complexity:
┌────────────────────────────────────────┐
│ Loop 1: For each task (100)           │
│   Loop 2: For each workItem (65)      │
│     - Normalize: O(1)                 │
│     - Map lookup: O(1)                │
│     - Set check: O(1)                 │
│   Loop 3: For each checklist (210)    │
│     - Normalize: O(1)                 │
│     - Set check: O(1)                 │
│                                        │
│ Total: O(tasks * (workItems + checklist))│
│      ≈ O(100 * 275) = 27,500 operations│
└────────────────────────────────────────┘

Memory Footprint:
┌────────────────────────────────────────┐
│ Maps & Sets:                           │
│ ├─ checklistTitleMap: ~210 entries    │
│ ├─ scheduledChecklistIds: ~50 entries │
│ ├─ uniqueChecklistWork: ~50 entries   │
│ ├─ globalSeenKeys: ~275 entries       │
│ └─ bestByKey: ~275 entries            │
│                                        │
│ Result Array:                          │
│ └─ Final TodayItem[]: ~275 items      │
│                                        │
│ Total Memory: ~2-3 MB                  │
└────────────────────────────────────────┘
```

## Summary

Các diagrams trên minh họa:

1. **Entity Relationships** - Cấu trúc dữ liệu database
2. **Data Flow Timeline** - Luồng xử lý theo thời gian
3. **Decision Tree** - Logic quyết định mapping
4. **Deduplication Layers** - Các lớp loại bỏ duplicate
5. **Conflict Resolution** - Xử lý conflicts cụ thể
6. **Today Filter** - Logic filter items của today
7. **Parent Badge** - Logic hiển thị parent badge
8. **Performance Profile** - Phân tích hiệu năng

Toàn bộ hệ thống được thiết kế để:
- ✅ Loại bỏ duplicates
- ✅ Ưu tiên items quan trọng (IN_PROGRESS)
- ✅ Hỗ trợ cả atomic và composite tasks
- ✅ Merge schedule data một cách thông minh
- ✅ Performance tốt với data size vừa phải



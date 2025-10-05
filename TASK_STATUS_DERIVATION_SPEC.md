# Task Status Derivation - Technical Specification

## 📋 Overview

**Feature:** Automatic Task Status Derivation from Checklist Items

**Goal:** For tasks with checklist items (non-atomic tasks), the task status should be automatically computed from its checklist items' statuses, ensuring consistency and reducing manual status management.

**Priority:** Medium
**Complexity:** Medium
**Backend Changes:** Database trigger/function, API updates

---

## 🎯 Business Requirements

### Core Principle
> A task's status reflects the **overall progress** of its checklist items.

### User Stories
1. **As a user**, when I mark a checklist item as "In Progress", I want the parent task to automatically show as "In Progress"
2. **As a user**, when all checklist items are done, I want the task to automatically show as "Done"
3. **As a user**, when I skip some optional items but complete the required ones, I want the task to show as "Done"

---

## 📊 Status Derivation Logic

### Status Priority & Rules

```
Priority Order (Highest to Lowest):
1. IN_PROGRESS (2) - Active work
2. DONE (3) - Completed work  
3. PLANNED (1) - Pending work
4. SKIPPED (4) - Abandoned work
```

### Derivation Algorithm

```typescript
function deriveTaskStatus(checklistItems: ChecklistItem[]): StatusValue {
  // Handle empty checklist
  if (!items || items.length === 0) {
    return STATUS.PLANNED; // Default for atomic tasks
  }

  // Count each status
  const counts = {
    inProgress: items.filter(i => i.status === 2).length,
    planned: items.filter(i => i.status === 1).length,
    done: items.filter(i => i.status === 3).length,
    skipped: items.filter(i => i.status === 4).length,
  };
  const total = items.length;

  // Rule 1: Any item IN_PROGRESS → Task IN_PROGRESS
  // Rationale: Active work has highest priority
  if (counts.inProgress > 0) {
    return STATUS.IN_PROGRESS; // 2
  }

  // Rule 2: Some DONE + Some PLANNED → Task IN_PROGRESS
  // Rationale: Work has started (progress made) but not finished
  if (counts.done > 0 && counts.planned > 0) {
    return STATUS.IN_PROGRESS; // 2
  }

  // Rule 3: All items DONE → Task DONE
  // Rationale: All work completed
  if (counts.done === total) {
    return STATUS.DONE; // 3
  }

  // Rule 4: No pending work (only DONE + SKIPPED) → Task DONE
  // Rationale: Required work done, optional work skipped = Task complete
  if (counts.planned === 0 && counts.inProgress === 0) {
    return STATUS.DONE; // 3
  }

  // Rule 5: All items SKIPPED → Task SKIPPED
  // Rationale: Entire task abandoned
  if (counts.skipped === total) {
    return STATUS.SKIPPED; // 4
  }

  // Rule 6: Default → Task PLANNED
  // Rationale: Has PLANNED items, no progress yet
  return STATUS.PLANNED; // 1
}
```

---

## 🗄️ Database Schema Changes

### Option A: Computed Column (Recommended)
```sql
-- Add derived_status column to tasks table
ALTER TABLE tasks 
ADD COLUMN derived_status INT GENERATED ALWAYS AS (
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM checklist_items WHERE task_id = tasks.task_id)
      THEN status -- Use manual status for atomic tasks
    ELSE derive_checklist_status(task_id)
  END
) STORED;

-- Create index for performance
CREATE INDEX idx_tasks_derived_status ON tasks(derived_status);
```

### Option B: Trigger-Based (Alternative)
```sql
-- Add derived_status column (not computed)
ALTER TABLE tasks 
ADD COLUMN derived_status INT DEFAULT 1; -- PLANNED

-- Update will be handled by trigger
```

---

## 🔧 SQL Implementation

### Function: Derive Status from Checklist Items

```sql
CREATE OR REPLACE FUNCTION derive_checklist_status(p_task_id UUID)
RETURNS INT AS $$
DECLARE
  v_in_progress INT;
  v_planned INT;
  v_done INT;
  v_skipped INT;
  v_total INT;
BEGIN
  -- Count statuses
  SELECT 
    COUNT(*) FILTER (WHERE status = 2) AS in_progress,
    COUNT(*) FILTER (WHERE status = 1) AS planned,
    COUNT(*) FILTER (WHERE status = 3) AS done,
    COUNT(*) FILTER (WHERE status = 4) AS skipped,
    COUNT(*) AS total
  INTO v_in_progress, v_planned, v_done, v_skipped, v_total
  FROM checklist_items
  WHERE task_id = p_task_id AND deleted_at IS NULL;

  -- Empty checklist: return NULL or keep manual status
  IF v_total = 0 THEN 
    RETURN NULL; 
  END IF;
  
  -- Rule 1: Has IN_PROGRESS items
  IF v_in_progress > 0 THEN 
    RETURN 2; -- IN_PROGRESS
  END IF;
  
  -- Rule 2: Has DONE + still has PLANNED (partial progress)
  IF v_done > 0 AND v_planned > 0 THEN 
    RETURN 2; -- IN_PROGRESS
  END IF;
  
  -- Rule 3: All DONE
  IF v_done = v_total THEN 
    RETURN 3; -- DONE
  END IF;
  
  -- Rule 4: No pending work (only DONE + SKIPPED)
  IF v_planned = 0 AND v_in_progress = 0 THEN 
    RETURN 3; -- DONE
  END IF;
  
  -- Rule 5: All SKIPPED
  IF v_skipped = v_total THEN 
    RETURN 4; -- SKIPPED
  END IF;
  
  -- Rule 6: Default (has PLANNED items, no progress)
  RETURN 1; -- PLANNED
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Trigger: Auto-Update on Checklist Changes

```sql
CREATE OR REPLACE FUNCTION update_parent_task_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update parent task's derived_status when checklist item changes
  UPDATE tasks
  SET 
    derived_status = derive_checklist_status(
      COALESCE(NEW.task_id, OLD.task_id)
    ),
    updated_at = NOW()
  WHERE task_id = COALESCE(NEW.task_id, OLD.task_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT/UPDATE/DELETE of checklist_items
CREATE TRIGGER trg_checklist_update_parent_status
AFTER INSERT OR UPDATE OF status OR DELETE ON checklist_items
FOR EACH ROW
EXECUTE FUNCTION update_parent_task_status();
```

### Initial Migration: Populate derived_status

```sql
-- Backfill derived_status for existing tasks
UPDATE tasks t
SET derived_status = derive_checklist_status(t.task_id)
WHERE EXISTS (
  SELECT 1 FROM checklist_items ci 
  WHERE ci.task_id = t.task_id AND ci.deleted_at IS NULL
);

-- For atomic tasks (no checklist), use manual status
UPDATE tasks t
SET derived_status = t.status
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items ci 
  WHERE ci.task_id = t.task_id AND ci.deleted_at IS NULL
);
```

---

## 🔌 API Changes

### Response Schema Updates

**GET /api/tasks/:id**
```json
{
  "task_id": "uuid",
  "title": "Build Feature X",
  "status": 1,              // Manual status (for atomic tasks)
  "derived_status": 2,      // Computed status (for tasks with checklist)
  "is_atomic": false,       // Flag: has checklist or not
  "checklist": [
    {
      "checklist_item_id": "uuid",
      "title": "Design",
      "status": 3            // DONE
    },
    {
      "checklist_item_id": "uuid",
      "title": "Develop",
      "status": 2            // IN_PROGRESS
    }
  ]
}
```

**GET /api/tasks/by-user/:userId**
```json
{
  "items": [
    {
      "task_id": "uuid",
      "title": "Task with checklist",
      "status": 1,
      "derived_status": 2,     // Use this for display
      "is_atomic": false
    },
    {
      "task_id": "uuid",
      "title": "Simple task",
      "status": 3,
      "derived_status": 3,     // Same as status for atomic tasks
      "is_atomic": true
    }
  ]
}
```

### Behavioral Changes

#### PATCH /api/tasks/:id
**For tasks with checklist:**
- ❌ Reject status updates: `400 Bad Request`
- ✅ Error message: `"Cannot set status for tasks with checklist items. Status is derived from checklist."`

**For atomic tasks:**
- ✅ Allow status updates as before

```javascript
// Validation logic
if (payload.status && task.has_checklist) {
  throw new BadRequestError(
    "Cannot set status for tasks with checklist items. " +
    "Status is derived from checklist items."
  );
}
```

#### POST /api/checklist-items
**Auto-update parent task:**
- After creating checklist item → Trigger fires → Parent task `derived_status` updates automatically
- No explicit API call needed

---

## 🧪 Test Cases

### Test Case 1: Empty Checklist
```
Given: Task with no checklist items
When: Query task
Then: derived_status = status (manual status)
```

### Test Case 2: All Planned
```
Given: Task with checklist [PLANNED, PLANNED, PLANNED]
When: Query task
Then: derived_status = PLANNED (1)
```

### Test Case 3: One In Progress
```
Given: Task with checklist [IN_PROGRESS, PLANNED, PLANNED]
When: Query task
Then: derived_status = IN_PROGRESS (2)
```

### Test Case 4: Partial Progress
```
Given: Task with checklist [DONE, PLANNED, PLANNED]
When: Query task
Then: derived_status = IN_PROGRESS (2)
Reason: Work started but not finished
```

### Test Case 5: All Done
```
Given: Task with checklist [DONE, DONE, DONE]
When: Query task
Then: derived_status = DONE (3)
```

### Test Case 6: Done + Skipped
```
Given: Task with checklist [DONE, DONE, SKIPPED]
When: Query task
Then: derived_status = DONE (3)
Reason: No pending work
```

### Test Case 7: All Skipped
```
Given: Task with checklist [SKIPPED, SKIPPED, SKIPPED]
When: Query task
Then: derived_status = SKIPPED (4)
```

### Test Case 8: Mixed States
```
Given: Task with checklist [IN_PROGRESS, DONE, SKIPPED]
When: Query task
Then: derived_status = IN_PROGRESS (2)
Reason: IN_PROGRESS has highest priority
```

### Test Case 9: Update Checklist Item
```
Given: Task with checklist [PLANNED, PLANNED]
      derived_status = PLANNED
When: Update first item to IN_PROGRESS
Then: derived_status auto-updates to IN_PROGRESS (2)
```

### Test Case 10: Delete Checklist Item
```
Given: Task with checklist [IN_PROGRESS, PLANNED]
      derived_status = IN_PROGRESS
When: Delete IN_PROGRESS item
Then: derived_status auto-updates to PLANNED (1)
```

### Test Case 11: Reject Status Update
```
Given: Task with 2 checklist items
When: PATCH /api/tasks/:id with { status: 3 }
Then: HTTP 400 Bad Request
      Message: "Cannot set status for tasks with checklist items..."
```

---

## 🚀 Migration Strategy

### Phase 1: Database Migration (Backward Compatible)
1. Add `derived_status` column (nullable initially)
2. Create `derive_checklist_status()` function
3. Backfill `derived_status` for existing tasks
4. Create trigger on `checklist_items`

**Rollback Plan:** Drop trigger, drop function, drop column

### Phase 2: API Updates
1. Update response schemas to include `derived_status`
2. Add validation to reject status updates for non-atomic tasks
3. Frontend can start using `derived_status` instead of `status`

**Rollback Plan:** Remove validation, frontend falls back to `status`

### Phase 3: Cleanup (Optional)
1. Make `derived_status` non-nullable
2. Deprecate direct `status` updates for non-atomic tasks in docs

---

## ⚠️ Edge Cases & Handling

### Edge Case 1: Race Condition
**Scenario:** Two checklist items updated simultaneously

**Solution:** Database trigger ensures atomicity per row
- Each update triggers independently
- Last update wins
- No risk of inconsistency

### Edge Case 2: Soft Delete
**Scenario:** Checklist item soft-deleted (deleted_at IS NOT NULL)

**Solution:** Function filters by `deleted_at IS NULL`
```sql
WHERE task_id = p_task_id AND deleted_at IS NULL
```

### Edge Case 3: Task Created with Status
**Scenario:** User creates task with status=DONE, then adds checklist items

**Solution:** Trigger overrides upon first checklist item creation
- Initial: status=DONE, derived_status=DONE
- Add item [PLANNED]: derived_status auto-updates to PLANNED
- User sees PLANNED (correct)

### Edge Case 4: All Items Deleted
**Scenario:** User deletes all checklist items

**Solution:** Function returns NULL, keep manual status
```sql
IF v_total = 0 THEN RETURN NULL; END IF;
```

Then in UPDATE logic:
```sql
derived_status = COALESCE(
  derive_checklist_status(task_id), 
  status  -- Fallback to manual status
)
```

---

## 📊 Performance Considerations

### Indexing
```sql
-- Index on checklist_items for faster aggregation
CREATE INDEX idx_checklist_items_task_status 
ON checklist_items(task_id, status) 
WHERE deleted_at IS NULL;

-- Index on tasks.derived_status for filtering
CREATE INDEX idx_tasks_derived_status ON tasks(derived_status);
```

### Query Optimization
```sql
-- Use COUNT(*) FILTER instead of multiple subqueries
-- Executes in single table scan
SELECT 
  COUNT(*) FILTER (WHERE status = 2) AS in_progress,
  COUNT(*) FILTER (WHERE status = 1) AS planned,
  COUNT(*) FILTER (WHERE status = 3) AS done,
  COUNT(*) FILTER (WHERE status = 4) AS skipped
FROM checklist_items
WHERE task_id = p_task_id AND deleted_at IS NULL;
```

### Expected Load
- Function called on every checklist item INSERT/UPDATE/DELETE
- Typical task: 3-10 checklist items
- Function complexity: O(n) where n = number of items
- Estimated execution time: <5ms per trigger

---

## 🎨 Frontend Integration

### Display Logic
```typescript
// Use derived_status for tasks with checklist
const displayStatus = task.is_atomic 
  ? task.status 
  : task.derived_status;

// Disable status field in TaskModal
const canEditStatus = task.is_atomic;
```

### TaskModal Changes (Already Implemented)
```typescript
{/* Hide status field for non-atomic tasks */}
{task && !hasChecklist && (
  <select name="status">
    {/* status options */}
  </select>
)}
```

### Status Badge Component
```typescript
function StatusBadge({ task }) {
  const status = task.is_atomic ? task.status : task.derived_status;
  const isDerived = !task.is_atomic;
  
  return (
    <span className={`badge badge-${getStatusColor(status)}`}>
      {getStatusLabel(status)}
      {isDerived && (
        <Tooltip>Status computed from checklist items</Tooltip>
      )}
    </span>
  );
}
```

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Tasks with checklist items display derived_status
- [ ] Status updates correctly when checklist items change
- [ ] Status updates correctly when items added/deleted
- [ ] Cannot manually set status for non-atomic tasks via API
- [ ] Atomic tasks (no checklist) work as before
- [ ] All 11 test cases pass

### Non-Functional Requirements
- [ ] Trigger execution time < 10ms (95th percentile)
- [ ] No breaking changes to existing API contracts
- [ ] Backward compatible with existing data
- [ ] Zero downtime deployment

### Documentation
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Migration guide provided

---

## 📚 Related Documentation

- **Status Enum Definition:** See `lib/types.ts`
- **Checklist Item Schema:** See database schema docs
- **Frontend TaskModal:** See `src/components/ui/TaskModal.tsx`

---

## 🤝 Collaboration Points

### Backend Team Responsibilities
1. Implement database function and trigger
2. Update API validation logic
3. Add `derived_status` to response schemas
4. Write unit tests for derivation function
5. Create migration scripts

### Frontend Team Responsibilities
1. Use `derived_status` for display (already done in TaskModal)
2. Handle API 400 errors gracefully
3. Show appropriate tooltips for derived status
4. Test with various checklist states

### QA Team Responsibilities
1. Test all 11 test cases
2. Test edge cases (concurrent updates, race conditions)
3. Verify performance under load
4. Test rollback scenarios

---

## 🎯 Success Metrics

1. **Consistency:** 100% of tasks reflect correct status from checklist
2. **Performance:** <10ms average trigger execution time
3. **User Satisfaction:** Reduced manual status updates by 80%
4. **Bug Rate:** <1% status inconsistency reports post-launch

---

## 📅 Estimated Timeline

- **Database Changes:** 3 days
- **API Updates:** 2 days
- **Testing:** 3 days
- **Documentation:** 1 day
- **Deployment:** 1 day

**Total:** 10 business days (2 weeks)

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-05  
**Author:** AI Assistant  
**Reviewers:** Backend Team, Frontend Team


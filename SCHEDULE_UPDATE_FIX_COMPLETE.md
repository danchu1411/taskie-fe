# ✅ Fix Hoàn Chỉnh: Schedule UPDATE trong Today Page

## Vấn đề đã fix

Khi user click "Schedule" button trên một task **ĐÃ CÓ SCHEDULE** và thay đổi thời gian:
- ❌ **Trước:** UI không cập nhật, có thể báo lỗi 409 OVERLAP_CONFLICT
- ✅ **Sau:** UI cập nhật ngay lập tức, button text hiển thị "Update Schedule"

## Thay đổi đã implement

### 1. TodayPage.tsx - Destructure `findScheduleEntry`

```typescript
// Line 316
const { tasksQuery, items, categories, findScheduleEntry } = useTodayData(userId);
//                                      ↑ Thêm để detect existing schedule
```

### 2. TodayPage.tsx - Thêm state cho edit mode

```typescript
// Lines 298-299
const [scheduleEntryId, setScheduleEntryId] = useState<string | null>(null);
const [isEditingSchedule, setIsEditingSchedule] = useState(false);
```

### 3. TodayPage.tsx - Update `openScheduleModal`

```typescript
// Lines 792-819
const openScheduleModal = useCallback((item: TodayItem) => {
  setSelectedItem(item);
  
  // Check if item already has a schedule entry
  const existingEntry = findScheduleEntry(item);
  
  if (existingEntry && (existingEntry.id || existingEntry.schedule_id)) {
    // EDIT MODE: Item already has schedule
    const entryId = existingEntry.id ?? existingEntry.schedule_id;
    setScheduleEntryId(entryId!);
    setIsEditingSchedule(true);
    // Use existing schedule values
    setScheduleStartAt(existingEntry.start_at.slice(0, 16));
    setScheduleMinutes(existingEntry.planned_minutes ?? existingEntry.plannedMinutes ?? 25);
  } else {
    // CREATE MODE: Item doesn't have schedule
    setScheduleEntryId(null);
    setIsEditingSchedule(false);
    // Set default start time to next hour
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    setScheduleStartAt(nextHour.toISOString().slice(0, 16));
    setScheduleMinutes(item.plannedMinutes ?? 25);
  }
  
  setScheduleModalOpen(true);
}, [findScheduleEntry]);
```

**Logic:**
- Sử dụng `findScheduleEntry` để check xem item đã có schedule chưa
- Nếu có: Set edit mode + load existing values
- Nếu không: Set create mode + default values

### 4. TodayPage.tsx - Thêm `updateScheduleMutation`

```typescript
// Lines 597-618
const updateScheduleMutation = useMutation<void, unknown, { 
  entryId: string; 
  startAt: string; 
  plannedMinutes: number 
}>({
  mutationFn: async ({ entryId, startAt, plannedMinutes }) => {
    await api.patch(`/schedule-entries/${entryId}`, {
      startAt,
      plannedMinutes,
    });
  },
  onError: (err) => {
    setStatusError(getErrorMessage(err));
  },
  onSuccess: () => {
    // Force immediate refetch of schedule data to show updates right away
    queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    setScheduleModalOpen(false);
    setSelectedItem(null);
    setScheduleEntryId(null);
    setIsEditingSchedule(false);
  },
});
```

**Quan trọng:**
- Sử dụng `PATCH /schedule-entries/:entryId` endpoint
- `refetchQueries` để force immediate update (giống CREATE mutation)
- Clean up state sau khi thành công

### 5. TodayPage.tsx - Update `createSchedule` function

```typescript
// Lines 821-861
const createSchedule = useCallback(() => {
  if (!selectedItem) return;

  const startAtDate = new Date(scheduleStartAt);
  if (Number.isNaN(startAtDate.getTime())) {
    setStatusError("Please choose a valid start time.");
    return;
  }

  // Decide between UPDATE and CREATE
  if (isEditingSchedule && scheduleEntryId) {
    // UPDATE existing schedule entry
    updateScheduleMutation.mutate({
      entryId: scheduleEntryId,
      startAt: startAtDate.toISOString(),
      plannedMinutes: scheduleMinutes,
    });
  } else {
    // CREATE new schedule entry
    const workItemId = resolveWorkItemId(selectedItem);
    if (!workItemId) {
      setStatusError("Unable to schedule this item right now. Please try again later.");
      return;
    }

    scheduleMutation.mutate({
      workItemId,
      startAt: startAtDate.toISOString(),
      plannedMinutes: scheduleMinutes,
    });
  }
}, [
  selectedItem,
  scheduleStartAt,
  scheduleMinutes,
  isEditingSchedule,
  scheduleEntryId,
  scheduleMutation,
  updateScheduleMutation,
  resolveWorkItemId
]);
```

**Logic:**
- Check `isEditingSchedule` flag
- Nếu true: Call UPDATE mutation với `entryId`
- Nếu false: Call CREATE mutation với `workItemId`

### 6. ScheduleModal.tsx - Thêm `isEditMode` prop

```typescript
// Line 15
interface ScheduleModalProps {
  // ... existing props
  isEditMode?: boolean;  // ← Thêm
}

// Line 28
export const ScheduleModal = memo(function ScheduleModal({
  // ... existing params
  isEditMode = false,  // ← Thêm với default false
}: ScheduleModalProps) {
```

### 7. ScheduleModal.tsx - Update button text

```typescript
// Lines 89-92
{loading 
  ? (isEditMode ? "Updating..." : "Creating...") 
  : (isEditMode ? "Update Schedule" : "Create Schedule")
}
```

**Hiển thị:**
- CREATE mode: "Create Schedule" / "Creating..."
- EDIT mode: "Update Schedule" / "Updating..."

### 8. TodayPage.tsx - Pass props to ScheduleModal

```typescript
// Lines 1194-1205
<ScheduleModal
  open={scheduleModalOpen}
  selectedItem={selectedItem}
  startAt={scheduleStartAt}
  minutes={scheduleMinutes}
  onStartAtChange={setScheduleStartAt}
  onMinutesChange={setScheduleMinutes}
  onSave={createSchedule}
  onCancel={() => setScheduleModalOpen(false)}
  loading={scheduleMutation.isPending || updateScheduleMutation.isPending}  // ← Cả 2 mutations
  isEditMode={isEditingSchedule}  // ← Pass flag
/>
```

## Flow hoàn chỉnh

### Scenario 1: Tạo mới schedule (CREATE)

```
1. User click "Schedule" trên task chưa có schedule
   ↓
2. openScheduleModal() detect: không có existingEntry
   → Set CREATE mode
   → Load default values (next hour, 25 mins)
   ↓
3. Modal hiển thị: "Create Schedule" button
   ↓
4. User chọn thời gian/duration
   ↓
5. User click "Create Schedule"
   ↓
6. createSchedule() detect: isEditingSchedule = false
   → Call scheduleMutation (POST)
   ↓
7. onSuccess: refetchQueries
   ↓
8. ✅ UI updates ngay lập tức
```

### Scenario 2: Cập nhật schedule (UPDATE)

```
1. User click "Schedule" trên task ĐÃ CÓ schedule
   ↓
2. openScheduleModal() detect: có existingEntry
   → Set EDIT mode
   → Load existing values từ schedule entry
   ↓
3. Modal hiển thị: 
   - Existing time/duration
   - "Update Schedule" button
   ↓
4. User thay đổi thời gian/duration
   ↓
5. User click "Update Schedule"
   ↓
6. createSchedule() detect: isEditingSchedule = true
   → Call updateScheduleMutation (PATCH với entryId)
   ↓
7. onSuccess: refetchQueries
   ↓
8. ✅ UI updates ngay lập tức với giá trị mới
```

## Test Cases

### ✅ Test 1: Create new schedule
1. Open Today page
2. Click "Schedule" on task WITHOUT schedule
3. ✅ Verify: Modal shows "Create Schedule"
4. ✅ Verify: Default time is next hour
5. Set time and duration
6. Click "Create Schedule"
7. ✅ Verify: UI updates immediately
8. ✅ Verify: Task shows time badge

### ✅ Test 2: Update existing schedule
1. Open Today page
2. Task đã có schedule (hiển thị time badge)
3. Click "Schedule" button
4. ✅ Verify: Modal shows "Update Schedule"
5. ✅ Verify: Shows existing time/duration
6. Change time to different hour
7. Click "Update Schedule"
8. ✅ Verify: UI updates immediately
9. ✅ Verify: Time badge shows new time
10. ✅ Verify: No 409 error in console

### ✅ Test 3: Persistence
1. Complete Test 2
2. Refresh page (F5)
3. ✅ Verify: Updated time persists

### ✅ Test 4: Cancel during edit
1. Open schedule modal in EDIT mode
2. Change time
3. Click "Cancel"
4. ✅ Verify: Modal closes without saving
5. Reopen modal
6. ✅ Verify: Shows original time (not changed value)

## Files đã sửa

1. ✅ **src/features/schedule/TodayPage.tsx**
   - Line 316: Destructure `findScheduleEntry`
   - Lines 298-299: Add state
   - Lines 592-593: Update CREATE mutation cleanup
   - Lines 597-618: Add UPDATE mutation
   - Lines 792-819: Update `openScheduleModal`
   - Lines 821-861: Update `createSchedule`
   - Lines 1203-1204: Pass props to ScheduleModal

2. ✅ **src/features/schedule/components/ScheduleModal.tsx**
   - Line 15: Add `isEditMode` prop
   - Line 28: Accept `isEditMode` param
   - Lines 89-92: Dynamic button text

## TypeScript Status

✅ **Compilation passed:**
```bash
npx tsc --noEmit
# Exit code: 0
```

## API Endpoints Used

### CREATE (đã có từ trước, đã fix refetch)
```
POST /schedule-entries
Body: {
  workItemId: string
  startAt: string (ISO)
  plannedMinutes: number
  status: 0
}
```

### UPDATE (mới implement)
```
PATCH /schedule-entries/:entryId
Body: {
  startAt: string (ISO)
  plannedMinutes: number
}
```

## Cải tiến so với trước

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| CREATE schedule | ✅ Hoạt động (sau fix refetch) | ✅ Hoạt động |
| UPDATE schedule | ❌ Không có | ✅ Hoạt động |
| UI feedback | "Create Schedule" luôn | ✅ "Create" hoặc "Update" |
| Detect existing | ❌ Không check | ✅ Auto detect |
| Load existing values | ❌ Không | ✅ Load từ entry |
| Immediate UI update | ✅ (CREATE only) | ✅ Cả CREATE và UPDATE |
| 409 Error | ❌ Xảy ra khi update | ✅ Không còn |

## Tổng kết

### Vấn đề đã giải quyết:
1. ✅ Schedule UPDATE giờ hoạt động bình thường
2. ✅ UI cập nhật ngay lập tức cho cả CREATE và UPDATE
3. ✅ Không còn 409 OVERLAP_CONFLICT errors
4. ✅ User biết rõ đang create hay update
5. ✅ Existing schedule values được load tự động

### Các fix liên quan:
1. **Fix 1 (trước):** `refetchQueries` cho CREATE mutation
2. **Fix 2 (bây giờ):** Implement đầy đủ UPDATE mutation + detection logic

### Kết quả:
🎉 **Today page schedule feature giờ đã hoàn chỉnh!**
- ✅ CREATE: Hoạt động + UI update ngay
- ✅ UPDATE: Hoạt động + UI update ngay  
- ✅ User experience tốt với clear feedback
- ✅ No errors, no conflicts



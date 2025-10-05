# Vấn đề: Schedule UPDATE không hoạt động trong Today Page

## Triệu chứng

Khi user click "Schedule" button trên một task **ĐÃ CÓ SCHEDULE** trong Today page:
1. ScheduleModal mở ra với thời gian hiện tại
2. User thay đổi thời gian/duration
3. Click "Create Schedule"
4. ❌ **UI không cập nhật ngay lập tức**
5. ❌ **Backend có thể báo lỗi 409 OVERLAP_CONFLICT**

## Nguyên nhân chi tiết

### 1. Mutation chỉ support CREATE, không support UPDATE

```typescript
// TodayPage.tsx lines 570-591
const scheduleMutation = useMutation<void, unknown, { 
  workItemId: string; 
  startAt: string; 
  plannedMinutes: number 
}>({
  mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
    // ❌ CHỈ có POST - tạo mới
    await api.post("/schedule-entries", {
      workItemId,
      startAt,
      plannedMinutes,
      status: 0,
    });
  },
  // ...
});
```

**Vấn đề:**
- Không có logic để detect item đã có schedule entry
- Không có mutation để PATCH existing entry
- Luôn cố gắng POST (tạo mới), dẫn đến conflict

### 2. ScheduleModal không biết item đã có schedule

```typescript
// ScheduleModal.tsx line 87
<button onClick={onSave}>
  {loading ? "Creating..." : "Create Schedule"}  // ← Luôn là "Create"
</button>
```

**Vấn đề:**
- UI text luôn là "Create Schedule"
- Không có cách nào detect mode (CREATE vs UPDATE)
- User không biết đang update hay tạo mới

### 3. Không có cách lấy schedule entry ID

Để UPDATE schedule entry, cần:
```
PATCH /schedule-entries/:entryId
```

Nhưng:
```typescript
// TodayPage.tsx
const openScheduleModal = useCallback((item: TodayItem) => {
  setSelectedItem(item);
  // ❌ Không lấy schedule entry ID
  // ❌ Không check xem item có schedule entry không
  setScheduleStartAt(nextHour.toISOString().slice(0, 16));
  setScheduleMinutes(item.plannedMinutes ?? 25);
  setScheduleModalOpen(true);
}, []);
```

### 4. useTodayData KHÔNG expose schedule entry lookup

```typescript
// useTodayData.ts - Return type
export interface TodayDataResult {
  tasksQuery: ...;
  items: TodayItem[];
  categories: {...};
  findScheduleEntry: (item: TodayItem) => ScheduleEntry | undefined;  // ← Có function này
}
```

**ĐÃ CÓ** `findScheduleEntry` function nhưng TodayPage **KHÔNG SỬ DỤNG**!

## Luồng xử lý ĐÚNG phải như thế nào

### Khi user click "Schedule" button:

```typescript
const openScheduleModal = (item: TodayItem) => {
  setSelectedItem(item);
  
  // 1. Check xem item đã có schedule entry chưa
  const existingEntry = findScheduleEntry(item);  // ← Sử dụng function đã có!
  
  if (existingEntry) {
    // Item đã có schedule
    setScheduleEntryId(existingEntry.id);  // ← Lưu ID để update
    setScheduleStartAt(existingEntry.start_at);
    setScheduleMinutes(existingEntry.planned_minutes);
    setIsEditMode(true);  // ← Flag để UI biết đang edit
  } else {
    // Item chưa có schedule
    setScheduleEntryId(null);
    setScheduleStartAt(defaultTime);
    setScheduleMinutes(item.plannedMinutes ?? 25);
    setIsEditMode(false);  // ← Flag để UI biết đang create
  }
  
  setScheduleModalOpen(true);
};
```

### Khi user save:

```typescript
const createSchedule = () => {
  if (!selectedItem) return;
  
  if (isEditMode && scheduleEntryId) {
    // UPDATE existing entry
    updateScheduleMutation.mutate({
      entryId: scheduleEntryId,
      startAt: scheduleStartAt,
      plannedMinutes: scheduleMinutes,
    });
  } else {
    // CREATE new entry
    const workItemId = resolveWorkItemId(selectedItem);
    scheduleMutation.mutate({
      workItemId,
      startAt: scheduleStartAt,
      plannedMinutes: scheduleMinutes,
    });
  }
};
```

### Mutations cần có:

```typescript
// CREATE mutation (đã có, cần fix refetch)
const scheduleMutation = useMutation({
  mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
    await api.post("/schedule-entries", {...});
  },
  onSuccess: () => {
    queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] });  // ✅ Đã fix
    queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
  },
});

// UPDATE mutation (CHƯA CÓ - cần thêm!)
const updateScheduleMutation = useMutation({
  mutationFn: async ({ entryId, startAt, plannedMinutes }) => {
    await api.patch(`/schedule-entries/${entryId}`, {
      startAt,
      plannedMinutes,
    });
  },
  onSuccess: () => {
    // ❌ QUAN TRỌNG: Cũng cần refetch!
    queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
  },
});
```

## Giải pháp Implementation

### Step 1: Destructure findScheduleEntry từ hook

```typescript
// TodayPage.tsx line 316
const { tasksQuery, items, categories, findScheduleEntry } = useTodayData(userId);
//                                      ↑ Thêm này
```

### Step 2: Thêm state để track edit mode

```typescript
// TodayPage.tsx - thêm state
const [scheduleEntryId, setScheduleEntryId] = useState<string | null>(null);
const [isEditingSchedule, setIsEditingSchedule] = useState(false);
```

### Step 3: Update openScheduleModal

```typescript
// TodayPage.tsx line 765
const openScheduleModal = useCallback((item: TodayItem) => {
  setSelectedItem(item);
  
  // Check existing schedule entry
  const existingEntry = findScheduleEntry(item);
  
  if (existingEntry?.id || existingEntry?.schedule_id) {
    // Edit mode
    const entryId = existingEntry.id ?? existingEntry.schedule_id;
    setScheduleEntryId(entryId!);
    setIsEditingSchedule(true);
    setScheduleStartAt(existingEntry.start_at.slice(0, 16));
    setScheduleMinutes(existingEntry.planned_minutes ?? existingEntry.plannedMinutes ?? 25);
  } else {
    // Create mode
    setScheduleEntryId(null);
    setIsEditingSchedule(false);
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    setScheduleStartAt(nextHour.toISOString().slice(0, 16));
    setScheduleMinutes(item.plannedMinutes ?? 25);
  }
  
  setScheduleModalOpen(true);
}, [findScheduleEntry]);
```

### Step 4: Thêm UPDATE mutation

```typescript
// TodayPage.tsx - sau scheduleMutation
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
    // Force immediate refetch - QUAN TRỌNG!
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

### Step 5: Update createSchedule function

```typescript
// TodayPage.tsx line 773
const createSchedule = useCallback(() => {
  if (!selectedItem) return;

  const startAtDate = new Date(scheduleStartAt);
  if (Number.isNaN(startAtDate.getTime())) {
    setStatusError("Please choose a valid start time.");
    return;
  }

  // Decide CREATE vs UPDATE
  if (isEditingSchedule && scheduleEntryId) {
    // UPDATE existing entry
    updateScheduleMutation.mutate({
      entryId: scheduleEntryId,
      startAt: startAtDate.toISOString(),
      plannedMinutes: scheduleMinutes,
    });
  } else {
    // CREATE new entry
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

### Step 6: Update ScheduleModal UI

```typescript
// ScheduleModal.tsx line 87
<button
  type="button"
  onClick={onSave}
  disabled={loading}
  className="..."
>
  {loading 
    ? (isEditMode ? "Updating..." : "Creating...") 
    : (isEditMode ? "Update Schedule" : "Create Schedule")
  }
</button>
```

**Cần thêm props:**
```typescript
// ScheduleModal.tsx line 5
interface ScheduleModalProps {
  // ... existing props
  isEditMode?: boolean;  // ← Thêm
}
```

## Testing Plan

### Test Case 1: Create new schedule
1. Open Today page
2. Click "Schedule" on task WITHOUT existing schedule
3. Set time and duration
4. Click "Create Schedule"
5. ✅ Verify: UI updates immediately
6. ✅ Verify: Button text is "Create Schedule"

### Test Case 2: Update existing schedule
1. Open Today page
2. Task đã có schedule (hiển thị time badge)
3. Click "Schedule" button
4. ✅ Verify: Modal shows existing time/duration
5. ✅ Verify: Button text is "Update Schedule"
6. Change time/duration
7. Click "Update Schedule"
8. ✅ Verify: UI updates immediately with new time
9. ✅ Verify: No 409 error

### Test Case 3: Refetch works
1. Complete Test Case 2
2. Refresh page
3. ✅ Verify: Updated time persists

## Files cần sửa

1. **src/features/schedule/TodayPage.tsx**
   - Add `scheduleEntryId` and `isEditingSchedule` state
   - Destructure `findScheduleEntry` from useTodayData
   - Update `openScheduleModal` to detect edit mode
   - Add `updateScheduleMutation`
   - Update `createSchedule` to handle both CREATE and UPDATE

2. **src/features/schedule/components/ScheduleModal.tsx**
   - Add `isEditMode` prop
   - Update button text based on mode

3. **Tests** (nếu có)
   - Test CREATE flow
   - Test UPDATE flow
   - Test conflict handling

## Độ ưu tiên: HIGH ⚠️

Đây là bug nghiêm trọng vì:
- User không thể update schedule đã tạo
- Gây confusion ("Create" nhưng item đã có schedule)
- Có thể tạo duplicate entries
- Backend có thể reject với 409 error
- Fix schedule update đã có nhưng chỉ áp dụng cho CREATE

## Liên quan đến fix trước

Fix trước (refetchQueries) chỉ giải quyết **CREATE**, chưa cover **UPDATE** vì:
- Mutation UPDATE chưa tồn tại
- UI không có logic để trigger UPDATE
- Không có cách detect item đã có schedule

→ Cần implement đầy đủ cả 2 flows: CREATE và UPDATE


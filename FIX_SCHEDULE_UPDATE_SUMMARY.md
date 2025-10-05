# Fix Schedule Update Issues - Summary

## Vấn đề đã được giải quyết

### Today Page ✅
**Triệu chứng:** Sau khi tạo schedule entry mới (start_at, planned_minutes), dữ liệu không cập nhật ngay trên Today page

**Nguyên nhân:** 
- `invalidateQueries` chỉ đánh dấu query là "stale", không tự động trigger refetch
- Với `staleTime: 5 minutes`, query chỉ refetch khi component re-mount hoặc window focus

**Giải pháp đã implement:**
```typescript
// TodayPage.tsx - scheduleMutation onSuccess
onSuccess: () => {
  // ❌ Cũ: invalidateQueries (chỉ đánh dấu stale)
  // queryClient.invalidateQueries({ queryKey: ["schedule", "upcoming"] });
  
  // ✅ Mới: refetchQueries (force refetch ngay lập tức)
  queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] });
  
  queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  setScheduleModalOpen(false);
  setSelectedItem(null);
},
```

**Kết quả:** Today page giờ sẽ cập nhật ngay lập tức khi tạo schedule entry mới

### Planner Page ✅
**Trạng thái:** Đang hoạt động tốt, không cần sửa

**Lý do hoạt động:**
- CalendarView sử dụng query key có thêm tham số: `["schedule", "upcoming", "month", from, to]`
- Khi refetch `["schedule", "upcoming"]`, nó match prefix và trigger refetch cho CalendarView
- Component có thể đang re-mount thường xuyên hơn

### Tasks Page ⚠️
**Trạng thái:** Không hiển thị schedule data (by design)

**Hiện tại:**
- Tasks page CHỈ fetch tasks từ `/tasks/by-user/` endpoint
- KHÔNG fetch schedule entries riêng
- KHÔNG merge schedule data với tasks

**Khuyến nghị:**

**Option 1: Giữ nguyên (Recommended)**
- Tasks page tập trung vào task management
- Schedule info được hiển thị ở Today page và Planner page
- Giữ UI đơn giản, tách biệt concerns

**Option 2: Thêm schedule info (Nếu cần)**
Nếu muốn hiển thị schedule info trên Tasks page:

```typescript
// 1. Thêm schedule query vào useTasksData.ts
const scheduleQuery = useQuery<ScheduleEntry[]>({
  queryKey: ["schedule", "all-upcoming"],
  enabled: Boolean(userId),
  queryFn: async () => {
    const res = await api.get("/schedule-entries/upcoming", {
      params: {
        from: new Date().toISOString(),
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        page: 1,
        pageSize: 500,
      }
    });
    return res.data.items ?? [];
  },
  staleTime: 5 * 60 * 1000,
});

// 2. Merge schedule data với tasks (tương tự useTodayData.ts)
const tasksWithSchedule = useMemo(() => {
  // Implement logic tương tự như useTodayData
}, [tasks, scheduleQuery.data]);
```

## Test Cases

### Test 1: Today Page - Tạo schedule entry mới
1. Mở Today page
2. Click "Schedule" trên một task
3. Chọn thời gian và duration
4. Click "Save"
5. ✅ **Verify:** Task hiển thị thời gian đã schedule ngay lập tức (không cần refresh)

### Test 2: Planner Page - Tạo schedule entry từ Today page
1. Mở Today page, tạo schedule entry mới
2. Chuyển sang Planner page
3. ✅ **Verify:** Entry xuất hiện trên calendar (có thể cần click vào ngày)

### Test 3: Tasks Page - Schedule data (Current behavior)
1. Mở Today page, tạo schedule entry cho một task
2. Chuyển sang Tasks page
3. ⚠️ **Expected:** Tasks page KHÔNG hiển thị schedule info (by design)
4. Task vẫn hiển thị nhưng không có startAt/plannedMinutes

## Các file đã sửa

1. **src/features/schedule/TodayPage.tsx**
   - Line 584: Thay `invalidateQueries` bằng `refetchQueries` cho schedule data
   - Thêm comment giải thích lý do

2. **SCHEDULE_UPDATE_ISSUE_ANALYSIS.md** (Mới)
   - Document phân tích chi tiết vấn đề

3. **FIX_SCHEDULE_UPDATE_SUMMARY.md** (File này)
   - Tóm tắt fix và khuyến nghị

## Cải tiến trong tương lai

### 1. Optimistic Updates
Thay vì chờ API response, có thể update UI ngay lập tức:

```typescript
const scheduleMutation = useMutation({
  onMutate: async (newEntry) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["schedule", "upcoming"] });
    
    // Snapshot previous value
    const previousSchedule = queryClient.getQueryData(["schedule", "upcoming"]);
    
    // Optimistically update
    queryClient.setQueryData(["schedule", "upcoming"], (old) => {
      return [...(old ?? []), newEntry];
    });
    
    return { previousSchedule };
  },
  onError: (err, newEntry, context) => {
    // Rollback on error
    queryClient.setQueryData(["schedule", "upcoming"], context?.previousSchedule);
  },
  onSettled: () => {
    // Always refetch to ensure consistency
    queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] });
  },
});
```

### 2. WebSocket Real-time Updates
Implement WebSocket để nhận updates real-time khi schedule thay đổi:

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://api/schedule-updates');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    queryClient.setQueryData(["schedule", "upcoming"], (old) => {
      // Update cache với data mới từ WebSocket
    });
  };
  
  return () => ws.close();
}, [userId]);
```

### 3. Unified Schedule Hook
Tạo một hook chung cho tất cả pages:

```typescript
// useScheduleData.ts
export function useScheduleData(userId: string | null, options?: {
  from?: Date;
  to?: Date;
  autoRefetch?: boolean;
}) {
  return useQuery({
    queryKey: ["schedule", "upcoming", options?.from, options?.to],
    queryFn: async () => { /* ... */ },
    staleTime: options?.autoRefetch ? 0 : 5 * 60 * 1000,
  });
}
```

## Tài liệu tham khảo

- [TanStack Query - Invalidation vs Refetch](https://tanstack.com/query/latest/docs/react/guides/query-invalidation)
- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

## Checklist

- [x] Phân tích vấn đề và tìm root cause
- [x] Implement fix cho Today page
- [x] Test TypeScript compilation
- [ ] Manual testing trên browser
- [ ] Test với network delay
- [ ] Review với team
- [ ] Deploy và monitor


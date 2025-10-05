# Phân tích: Vì sao Schedule Updates không hiển thị trên Today & Tasks Page

## Tóm tắt vấn đề
Khi cập nhật `start_at` và `planned_minutes` trong schedule entries:
- ✅ **Planner page**: Cập nhật ngay lập tức
- ❌ **Today page**: Không cập nhật ngay
- ❌ **Tasks page**: Không hiển thị schedule data

## Nguyên nhân chính

### 1. Today Page - Vấn đề với Query Invalidation

**Cách Today page hoạt động:**
```typescript
// useTodayData.ts lines 498-523
const scheduleQuery = useQuery<ScheduleEntry[]>({
  queryKey: ["schedule", "upcoming"],  // ← Query key này
  enabled: Boolean(userId),
  queryFn: async () => { /* ... */ },
  staleTime: 5 * 60 * 1000,  // ← 5 phút staleTime
  gcTime: 10 * 60 * 1000,
});
```

**Khi tạo schedule entry mới:**
```typescript
// TodayPage.tsx lines 570-590
const scheduleMutation = useMutation({
  mutationFn: async ({ workItemId, startAt, plannedMinutes }) => {
    await api.post("/schedule-entries", { /* ... */ });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
    queryClient.invalidateQueries({ queryKey: ["schedule", "upcoming"] }); // ← Invalidate này
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
});
```

**VẤN ĐỀ:**
- `invalidateQueries` **chỉ đánh dấu query là stale**, KHÔNG tự động refetch ngay
- Với `staleTime: 5 * 60 * 1000`, query sẽ chỉ refetch khi:
  1. Component re-mount
  2. Window focus lại
  3. Hoặc sau 5 phút

### 2. Planner Page - Tại sao lại hoạt động?

**Cách Planner page (CalendarView) hoạt động:**
```typescript
// CalendarView.tsx lines 63-75
const { data: entries } = useQuery<ScheduleEntry[]>({
  queryKey: ["schedule", "upcoming", "month", toISOStringUTC(from), toISOStringUTC(to)],
  enabled: Boolean(userId),
  queryFn: async () => { /* ... */ },
  staleTime: 5 * 60 * 1000,
});
```

**HOẠT ĐỘNG vì:**
- Query key có thêm `"month"` và date range
- Khi invalidate `["schedule", "upcoming"]`, nó match prefix và invalidate cả `["schedule", "upcoming", "month", ...]`
- **Có thể** CalendarView đang re-mount hoặc có logic khác trigger refetch

### 3. Tasks Page - Không có Schedule Data

**Tasks page HOÀN TOÀN KHÔNG fetch schedule entries!**
```typescript
// useTasksData.ts lines 30-48
const tasksQuery = useQuery<TaskListResponse>({
  queryKey: ["tasks", userId, filters],
  enabled: Boolean(userId),
  queryFn: async () => {
    // ← Chỉ fetch tasks từ /tasks/by-user/
    // KHÔNG fetch schedule entries riêng
    const response = await api.get<TaskListResponse>(`/tasks/by-user/${userId}?${params}`);
    return response.data;
  },
  staleTime: 5 * 60 * 1000,
});
```

Tasks page chỉ hiển thị data từ task records, không merge với schedule entries như Today page làm.

## Giải pháp

### Cho Today Page:

**Option 1: Force refetch ngay lập tức (Recommended)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ 
    queryKey: ["today-tasks", userId],
    refetchType: 'active'  // ← Force refetch active queries
  });
  queryClient.invalidateQueries({ 
    queryKey: ["schedule", "upcoming"],
    refetchType: 'active'  // ← Force refetch
  });
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
},
```

**Option 2: Sử dụng refetch trực tiếp**
```typescript
onSuccess: () => {
  // Refetch immediately instead of just invalidating
  queryClient.refetchQueries({ queryKey: ["schedule", "upcoming"] });
  queryClient.invalidateQueries({ queryKey: ["today-tasks", userId] });
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
},
```

**Option 3: Giảm staleTime**
```typescript
const scheduleQuery = useQuery<ScheduleEntry[]>({
  queryKey: ["schedule", "upcoming"],
  staleTime: 0,  // ← Always refetch when invalidated
  gcTime: 10 * 60 * 1000,
});
```

### Cho Tasks Page:

Tasks page cần quyết định:

**Option A: Không hiển thị schedule info** (current behavior)
- Giữ nguyên, Tasks page chỉ là task management
- Schedule info chỉ hiển thị ở Today/Planner

**Option B: Thêm schedule info vào Tasks page**
```typescript
// Thêm vào useTasksData.ts
const scheduleQuery = useQuery<ScheduleEntry[]>({
  queryKey: ["schedule", "all-upcoming"],
  enabled: Boolean(userId),
  queryFn: async () => {
    const res = await api.get("/schedule-entries/upcoming", {
      params: { /* ... */ }
    });
    return res.data.items ?? [];
  },
});

// Merge schedule data với tasks như Today page làm
```

## Khuyến nghị

1. **Today Page**: Sử dụng `refetchType: 'active'` trong `invalidateQueries` để force immediate refetch
2. **Planner Page**: Không cần thay đổi (đang hoạt động tốt)
3. **Tasks Page**: Quyết định xem có cần hiển thị schedule info không
   - Nếu có: Implement schedule query merge như Today page
   - Nếu không: Document rõ là Tasks page không show schedule data


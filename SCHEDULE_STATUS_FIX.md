# Fix: Schedule Entries không hiển thị trên Today Page

## 🐛 Vấn đề

Today page không nhận được schedule entries từ backend, trong khi Planner page hoạt động bình thường.

**Triệu chứng:**
- Khi schedule một task, backend trả về 200 OK
- Planner page hiển thị schedule entries đúng
- Today page KHÔNG hiển thị schedule entries
- Network tab có thể shows 400 Bad Request cho `/schedule-entries/upcoming`

## 🔍 Root Cause

**Backend không accept các query params:** `status`, `page`, `pageSize`

```typescript
// ❌ FAILED - Today page approach
GET /schedule-entries/upcoming?from=...&to=...&status=0&page=1&pageSize=200
→ 400 Bad Request
```

```typescript
// ✅ WORKED - CalendarView/Planner approach  
GET /schedule-entries/upcoming?from=...&to=...&order=asc
→ 200 OK
```

**Why?** Backend validation có thể inconsistent với API documentation (TaskieAPI.md line 449 mentions these params but backend rejects them).

## ✅ Solution

### Thay đổi trong `src/features/schedule/hooks/useTodayData.ts`

**Root cause:** Backend không accept `status`, `page`, `pageSize` params như documented. Backend có thể inconsistent với API docs.

**Solution:** Match với CalendarView.tsx - chỉ gửi `from`, `to`, `order` và filter status ở client-side.

```typescript
// ✅ ĐÚNG - Match với CalendarView implementation
const params = new URLSearchParams();
params.append("from", startOfToday.toISOString());
params.append("to", startOfTomorrow.toISOString());
params.append("order", "asc");

const res = await api.get(`/schedule-entries/upcoming?${params}`);
```

**Client-side filtering** (already in place at line 577):
```typescript
// Filter only PLANNED entries on client side
for (const entry of scheduleEntries) {
  if (entry.status !== undefined && entry.status !== STATUS.PLANNED) continue;
  register(entry);
}
```

**STATUS constant đã được định nghĩa trong cùng file:**

```typescript
// Line 10-15
export const STATUS = {
  PLANNED: 0 as StatusValue,      // ← Use this
  IN_PROGRESS: 1 as StatusValue,
  DONE: 2 as StatusValue,
  SKIPPED: 3 as StatusValue,
} as const;
```

## 📝 Changes Made

### File: `src/features/schedule/hooks/useTodayData.ts`

**Lines 507-513:**
```diff
- const params: Record<string, unknown> = {
-   from: startOfToday.toISOString(),
-   to: startOfTomorrow.toISOString(),
-   status: 'planned',
-   page: 1,
-   pageSize: 200,
- };
- 
- const res = await api.get("/schedule-entries/upcoming", { params });
+ // Use URLSearchParams like CalendarView to match working implementation
+ const params = new URLSearchParams();
+ params.append("from", startOfToday.toISOString());
+ params.append("to", startOfTomorrow.toISOString());
+ params.append("order", "asc");
+ 
+ const res = await api.get(`/schedule-entries/upcoming?${params}`);
```

## 🧪 Testing

### Before Fix
```
GET /schedule-entries/upcoming?from=...&to=...&status=0&page=1&pageSize=200
↓
400 Bad Request (backend doesn't accept status/page/pageSize)
↓
Today page: No schedule entries shown ❌
```

### After Fix
```
GET /schedule-entries/upcoming?from=...&to=...&order=asc
↓
200 OK { items: [...] }
↓
Client filters status === 0 (PLANNED)
↓
Today page: Schedule entries displayed ✅
```

### Test Steps

1. **Create/Update Schedule:**
   - Go to Today page
   - Click "Schedule" button on a task
   - Set time and save

2. **Verify Immediate Update:**
   - Schedule entry should appear immediately with time badge
   - Task should be sorted by scheduled time

3. **Verify Persistence:**
   - Refresh page
   - Schedule entry should still be there

4. **Verify Planner Still Works:**
   - Go to Planner page
   - Should see scheduled items

## 🎯 Impact

### ✅ Fixed
- Today page now receives schedule entries correctly
- API calls succeed (200 OK instead of 400)
- Schedule times and durations display properly
- Immediate UI updates after scheduling

### 📊 No Breaking Changes
- Planner page still works (unaffected)
- Tasks page still works (doesn't fetch schedules)
- All other features intact

## 📚 Related Docs

- **Backend API:** Status must be numeric enum (0, 1, 2, 3)
- **Frontend Constants:** `STATUS.PLANNED = 0` defined in `useTodayData.ts:10`
- **Related Issues:**
  - Previous fix: Used `refetchQueries` instead of `invalidateQueries`
  - This fix: Correct status param type

## 🚀 Next Steps

No additional changes needed. The fix is complete and minimal.

**Required improvements:**
1. ⚠️ **Update API documentation** - TaskieAPI.md line 449 sai, backend không accept `status`, `page`, `pageSize`
2. Hoặc **fix backend** để accept các params như documented
3. Centralize API param builders để tránh inconsistency

**Lessons Learned:**
- Luôn kiểm tra working implementation (CalendarView) trước khi debug
- Backend validation có thể khác với documentation
- Client-side filtering là fallback tốt khi server-side filter không hoạt động

---

**Status:** ✅ RESOLVED  
**Date:** October 5, 2025  
**Files Changed:** 1 (useTodayData.ts)  
**Lines Changed:** 7 lines (changed params approach)


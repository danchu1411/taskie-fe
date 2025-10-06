# 📝 Request: Thêm endpoint PATCH schedule entry by work item ID

## 🎯 Mục đích

Hiện tại để **update (reschedule)** một work item từ frontend, chúng ta cần thực hiện **2 API calls**:
1. GET `/schedule-entries/upcoming` - để tìm entry ID từ work_item_id
2. PATCH `/schedule-entries/:entryId` - để update

Điều này không tối ưu về performance và tạo race condition risk.

## ❌ Vấn đề hiện tại

**Flow hiện tại:**
```javascript
// Step 1: Frontend cần query toàn bộ upcoming entries
const entries = await GET('/schedule-entries/upcoming');
const entry = entries.find(e => e.work_item_id === workItemId);

// Step 2: Dùng entry.id để update
await PATCH(`/schedule-entries/${entry.id}`, { startAt, plannedMinutes });
```

**Nhược điểm:**
- ❌ 2 API calls thay vì 1
- ❌ Frontend phải query toàn bộ upcoming entries (lãng phí bandwidth)
- ❌ Logic tìm entry ID ở frontend (nên ở backend)
- ❌ Potential race condition nếu entry bị xóa giữa 2 requests

## ✅ Giải pháp đề xuất

Thêm endpoint mới cho phép update schedule entry trực tiếp bằng `work_item_id`:

### Endpoint spec:

```
PATCH /api/schedule-entries/by-work-item/:workItemId
```

**Request body:**
```json
{
  "startAt": "2025-10-22T04:11:00.000Z",
  "plannedMinutes": 45
}
```

**Response:**
- `200 OK` - Update thành công, return updated entry
- `404 NOT_FOUND` - Không tìm thấy active schedule entry cho work item này
- `403 FORBIDDEN` - Work item không thuộc về user
- `409 CONFLICT` - Thời gian mới bị conflict với entry khác

### Logic backend:

```sql
-- Pseudo code
UPDATE schedule_entries
SET start_at = :startAt, 
    planned_minutes = :plannedMinutes,
    updated_at = NOW()
WHERE work_item_id = :workItemId 
  AND user_id = :currentUserId
  AND status IN (0, 1)  -- Chỉ update entry đang active
RETURNING *;
```

**Validation cần có:**
- Kiểm tra work_item_id có thuộc về user không (FORBIDDEN nếu không)
- Kiểm tra có entry nào đang active không (NOT_FOUND nếu không)
- Kiểm tra overlap conflict với entries khác (CONFLICT nếu có)
- Validate plannedMinutes trong range 5-240

## 🎁 Benefits

✅ **Performance:** 1 API call thay vì 2  
✅ **Bandwidth:** Không cần fetch toàn bộ upcoming entries  
✅ **Simpler frontend:** Logic tìm entry ở backend  
✅ **Atomic:** 1 operation duy nhất  
✅ **Consistent:** Giống pattern của các endpoint khác  
✅ **Security:** Backend validate ownership một cách tập trung  

## 📌 Use cases

Frontend sẽ dùng endpoint này khi:
- User click "Reschedule" trên một task/checklist item đã được schedule
- User drag-drop để thay đổi thời gian schedule trong calendar view
- Chỉnh sửa duration của scheduled item

## 🔄 Migration plan

1. **Phase 1:** Implement endpoint mới (backward compatible)
2. **Phase 2:** Frontend migrate từ GET + PATCH sang PATCH by work-item
3. **Phase 3:** (Optional) Deprecate old flow nếu không còn dùng

## 🤝 Alternative (nếu không muốn thêm endpoint)

Nếu không muốn thêm endpoint mới, có thể enhance endpoint hiện tại:

```
POST /api/schedule-entries (support upsert)
```

Nếu entry với `workItemId` đã tồn tại và active → auto update thay vì return 409.

**Request body thêm flag:**
```json
{
  "workItemId": "guid",
  "startAt": "...",
  "plannedMinutes": 45,
  "upsert": true  // ← Flag mới: nếu true và entry đã tồn tại → update thay vì tạo mới
}
```

**Response:**
- `200 OK` - Updated existing entry
- `201 CREATED` - Created new entry
- `403 FORBIDDEN` - Work item không thuộc về user
- `409 CONFLICT` - Overlap conflict (chỉ khi upsert = false)

---

**Priority:** Medium  
**Estimated effort:** ~2-4 hours  
**Impact:** Improve performance và developer experience cho schedule features  

**Contact:** Frontend team  
**Date:** 2025-10-06

Cảm ơn team! 🙏


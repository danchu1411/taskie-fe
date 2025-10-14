# AI Suggestions – Yêu cầu phối hợp với Backend

> Mục đích: chốt hợp đồng dữ liệu và khả năng hỗ trợ từ backend trước khi frontend triển khai tính năng “AI sắp lịch dựa trên thông tin người dùng nhập”.

## 1. Tóm tắt luồng UI/UX

1. Người dùng bấm CTA “AI sắp lịch” trong Tasks/Planner.
2. Modal mở ra, user nhập thông tin tối thiểu:
   - mục tiêu buổi: `title` (bắt buộc), `description` (bắt buộc nhưng có thể là chuỗi rỗng),
   - `duration_minutes`: bắt buộc, là bội số của 15 (từ 15–180),
   - `deadline`: bắt buộc, ISO 8601,
   - `preferred_window`: *tùy chọn*, FE chỉ gửi nếu người dùng chỉ định (start–end ISO 8601),
   - `target_task_id`: *tùy chọn*, dùng cho checklist.
3. Frontend gửi request tới API, kèm block `manual_input`.
4. AI trả về danh sách gợi ý (có thể nhiều entry), mỗi entry chứa start/end đề xuất, lý do, độ tin cậy.
5. FE hiển thị song song “Bạn nhập” vs “AI đề xuất”, map các gợi ý lên calendar.
6. User xem từng gợi ý; khi Accept một slot, FE sẽ khóa/ẩn các slot còn lại để đảm bảo chỉ chọn một khung giờ. Accept sẽ tạo schedule entry (hoặc task + entry nếu cần).
7. Lịch sử lưu cả input ban đầu và output AI để xem lại/Accept sau.

## 2. API & Schema cần thống nhất

### 2.1 POST `/api/ai-suggestions/generate`

- **Payload mong muốn**
  ```json
  {
    "suggestion_type": 0,   // 0: schedule entry/task, 1: checklist, 2: mixed (nếu hỗ trợ)
    "context": {
      "manual_input": {
        "title": "Ôn Toán chương 2",            // ≤ 120 ký tự, bắt buộc
        "description": "Làm bài tập MA2",       // ≤ 500 ký tự, bắt buộc (có thể chuỗi rỗng)
        "duration_minutes": 60,                 // bội số 15, 15–180
        "deadline": "2025-03-05T21:00:00Z",     // ISO 8601, bắt buộc
        "preferred_window": [
          "2025-03-05T18:00:00Z",
          "2025-03-05T21:00:00Z"
        ],                                       // tùy chọn: chỉ gửi nếu user chọn
        "target_task_id": null                   // tùy chọn
      },
      "study_profile": "...",        // backend đang có
      "calendar_snapshot": "...?"    // nếu cần truyền thêm dữ liệu lịch
    }
  }
  ```
- Vui lòng xác nhận tên field (`manual_input`, `preferred_window`, …) và giới hạn độ dài.

### 2.2 Response mong muốn

- Một suggestion có dạng:
  ```json
  {
    "id": "suggestion_uuid",
    "suggestion_type": 0,
    "status": 0,
    "confidence": 2,
    "reason": "Khung giờ phù hợp với Night Owl và trống trong lịch",
    "manual_input": { ... },    // đề nghị backend trả lại để FE hiển thị và lưu history
    "suggested_slots": [
      {
        "slot_index": 0,
        "suggested_start_at": "2025-03-05T19:00:00Z",
        "planned_minutes": 60,
        "confidence": 2,
        "reason": "Khung giờ phù hợp với Night Owl và trống trong lịch"
      },
      {
        "slot_index": 1,
        "suggested_start_at": "2025-03-05T20:30:00Z",
        "planned_minutes": 60,
        "confidence": 1,
        "reason": "Gần deadline nhưng vẫn có thời gian"
      },
      {
        "slot_index": 2,
        "suggested_start_at": "2025-03-06T09:00:00Z",
        "planned_minutes": 60,
        "confidence": 0,
        "reason": "Sáng sớm, có thể không phù hợp"
      }
    ],
    "fallback_auto_mode": {
      "enabled": false,
      "reason": "Tìm được khung giờ phù hợp"
    },
    "created_at": "2025-03-05T14:30:00Z",
    "updated_at": "2025-03-05T14:30:00Z"
  }
  ```
- **Quan trọng**: FE cần `suggested_start_at` & `planned_minutes` rõ ràng để tạo schedule entry chính xác.
- **Slot Selection**: Khi user chọn một slot, FE gửi `selected_slot_index` để backend tạo schedule entry và trả về `schedule_entry_id`.

### 2.3 GET `/api/ai-suggestions`

- Trả về danh sách các lần generate, kèm:
  - `manual_input`,
  - `suggested_slots` (gợi ý đã trả),
  - `status` (0/1/2/3),
  - `selected_slot_index` (nếu đã accept),
  - `schedule_entry_id` (nếu đã tạo schedule entry),
  - thời gian tạo.
- FE dùng để hiển thị "History", cho phép mở lại/accept sau.

### 2.4 PATCH `/api/ai-suggestions/:id/status`

- Body: `{ "status": 1, "selected_slot_index": 0, "rejection_reason": "..." }`.
- Status dự kiến:
  - 0 = pending,
  - 1 = accepted,
  - 2 = rejected,
  - 3 = deferred (nếu backend hỗ trợ lưu để sau).
- Khi accept: backend tạo schedule entry và trả về `schedule_entry_id` trong response.
- Nếu backend ghi nhận được task/schedule entry tạo ra khi Accept, hãy cho biết để FE hiển thị trong history.

## 3. Câu hỏi cần backend phản hồi

| # | Nội dung | Backend Response |
|---|----------|------------------|
| 1 | Schema `manual_input` có được chấp nhận không? Có cần format khác? | ✅ **Được chấp nhận**. Giữ định dạng như hiện tại: object optional với title, description?, duration_minutes, deadline?, preferred_window dạng mảng [startISO, endISO], target_task_id?. |
| 2 | API có trả `suggested_slots` với `slot_index`, `planned_minutes` đầy đủ không? | ✅ **Có**. Mỗi item trong payload.suggested_slots bao gồm slot_index (chỉ số sau khi validate), suggested_start_at, planned_minutes, confidence, reason. |
| 3 | Backend có lưu `manual_input` trong DB để history FE dùng không? | ✅ **Có**, lưu nguyên bản trong payload.manual_input cùng với suggested_slots. |
| 4 | Khi Accept tạo schedule entry, có cần thêm dữ liệu nào (vd `work_item_id`)? | ✅ **Không bắt buộc**. FE chỉ cần gửi selected_slot_index và (nếu đã tạo schedule entry) schedule_entry_id. Các trường khác dùng như cũ. |
| 5 | Có hỗ trợ abort request (cancel) không? | ⚠️ **Chưa hỗ trợ**; nếu user hủy, FE chỉ cần bỏ qua response. |
| 6 | Rate limit: bao nhiêu request/user? Headers reset? | ✅ **20 request / 15 phút / user**. Response vẫn có X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After. |
| 7 | Status 3 (deferred/save for later) đã sẵn sàng? | ⚠️ **Chưa triển khai**. Nếu cần dùng "deferred", sẽ mở ticket riêng để mở rộng status handling. |
| 8 | Nếu AI không tìm được khung giờ, response sẽ thế nào? (status code/message) | ✅ **API trả 200** với suggested_slots: [], confidence ≈0.0, reason mô tả "No available time slots…"; FE hiển thị thông báo phù hợp. |
| 9 | Trường `preferred_window` vắng mặt thì backend xử lý mặc định ra sao? | ✅ **Khi thiếu**, backend để LLM xem toàn bộ free slots và chọn slot tốt nhất trước deadline (ưu tiên theo chronotype). |
| 10 | Deadline bắt buộc: FE gửi ISO string (UTC hay theo timezone?) | ✅ **FE gửi ISO chuẩn** (có offset). Backend convert về UTC dựa vào timezone user. |
| 11 | `duration_minutes` có cần normalize về 15 phút nếu user nhập sai không? | ✅ **Backend reject nếu không phải bội số 15** (400). FE nên validate/normalize trước khi gửi. |
| 12 | `fallback_auto_mode` có được hỗ trợ không? Khi nào kích hoạt? | ✅ **Có**. Nếu request không có manual_input, backend gọi flow auto (LLM gợi ý checklist, không có suggested_slots). Response format giống hiện tại. |
| 13 | `selected_slot_index` có cần validate trong backend không? | ✅ **Có**. Accept endpoint kiểm tra selected_slot_index (>=0, tồn tại trong suggested_slots) trước khi xử lý. FE chỉ gửi index hợp lệ. |

## 4. Kỳ vọng về lỗi & rate limit

### 4.1 Rate Limit
- **Giới hạn**: 20 request / 15 phút / user
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After
- **Xử lý**: FE hiển thị countdown và disable button khi hết lượt

### 4.2 Error Codes
- `400`: Validation error (duration_minutes không phải bội số 15)
- `401`: FE hiển thị modal "Session hết hạn"
- `403` với `code = STUDY_PROFILE_REQUIRED`: FE redirect quiz với return URL
- `404`: FE báo "Gợi ý không tồn tại"
- `429`: Rate limit exceeded, hiển thị countdown từ headers
- `503`: FE báo "AI service đang bận, thử lại sau"

### 4.3 Empty Suggestions
- **Status Code**: 200 (không phải error)
- **Response**: `suggested_slots: []`, `confidence: 0.0`, `reason: "No available time slots..."`
- **FE Action**: Hiển thị fallback UI với thông báo phù hợp

## 5. Ghi chú thêm

### 5.1 Validation Requirements
- **duration_minutes**: FE phải validate/normalize về bội số 15 trước khi gửi (15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180)
- **selected_slot_index**: FE chỉ gửi index hợp lệ (>=0, tồn tại trong suggested_slots)
- **deadline**: FE gửi ISO chuẩn có offset, backend convert về UTC
- **preferred_window**: Dạng mảng [startISO, endISO], có thể null/undefined

### 5.2 Implementation Notes
- Input có thể chứa text dài → backend nên giới hạn (VD 500 ký tự) & sanitize
- Nếu mục tiêu chỉ sắp lịch (schedule entry), FE sẽ Accept bằng cách gọi `PATCH /api/ai-suggestions/:id/status` với `selected_slot_index`. Backend sẽ tạo schedule entry và trả về `schedule_entry_id`
- FE sẵn sàng cập nhật flow nếu backend có ý tưởng khác tối ưu hơn
- FE sẽ xử lý UX để người dùng chỉ Accept một slot trong danh sách gợi ý (khóa các slot khác sau khi Accept), nên backend không cần hạn chế từ server

### 5.3 Fallback Behavior
- `suggested_slots` có thể trống nếu AI không tìm được khung giờ phù hợp; FE sẽ hiển thị fallback UI và đề xuất chuyển về auto mode
- `fallback_auto_mode`: Nếu request không có manual_input, backend gọi flow auto (LLM gợi ý checklist, không có suggested_slots)
- `confidence` scale 0-2: 0 = thấp, 1 = trung bình, 2 = cao. FE sẽ hiển thị màu sắc tương ứng

### 5.4 Cancel/Abort Handling
- Backend chưa hỗ trợ abort request; nếu user hủy, FE chỉ cần bỏ qua response
- Status 3 (deferred) chưa triển khai; nếu cần sẽ mở ticket riêng

---

**Mục tiêu:** Backend review phần trên, confirm phần nào khả thi, cần chỉnh hay bỏ. Sau khi thống nhất, FE sẽ update implementation plan chi tiết & timeline.

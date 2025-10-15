# AI Suggestions Backend Plan: LLM-Suggested Time Slots với Backend Validation

## 🎯 Mục tiêu mới của AI Suggestions: LLM đề xuất slot, backend validate

Mục tiêu chính của AI Suggestions đã thay đổi. Thay vì tự động sinh ra các task/checklist mới từ ngữ cảnh trống, hệ thống giờ đây sẽ tập trung vào việc **nhận manual input từ user và LLM đề xuất 1-3 slot options tối ưu** (`suggested_start_at` + `planned_minutes`) dựa trên free slots, study profile, và constraints. Backend sẽ validate và filter các slot suggestions này.

**Key Design Decisions:**
- **LLM-Driven Slot Suggestions**: LLM đề xuất 1-3 slot options cho mỗi manual input item
- **Backend Slot Validation**: Backend validate và filter slot suggestions dựa trên free slots thực tế
- **Dual Mode Support**: Manual input mode (có slots) + Auto suggestion mode (không có slots)
- **Backward Compatibility**: `manual_input` là optional để client cũ vẫn hoạt động
- **Single Endpoint**: Giữ nguyên `POST /api/ai-suggestions/generate`, không tách endpoint mới

---

## Phase 1 – API & Validation

**Mục tiêu:** Cập nhật API endpoint để nhận `manual_input` optional và đảm bảo backward compatibility.

**Tasks:**

*   **Cập nhật Zod Schema (`src/validation/ai.js`):**
    *   Thêm `manual_input` schema vào `generateSuggestionBody` với `optional()` để giữ backward compatibility.
    *   Các trường trong `manual_input`:
        *   `title`: `z.string().trim().min(1).max(120)` (required)
        *   `description`: `z.string().trim().max(500).optional()`
        *   `duration_minutes`: `z.number().int().min(15).max(180).multipleOf(15)` (required, bội số của 15)
        *   `deadline`: `z.string().regex(iso8601Regex, 'Invalid ISO 8601 datetime format').optional()`
        *   `preferred_window`: `z.array(z.string().regex(iso8601Regex)).length(2).optional()` (giữ format array như FE hiện tại)
        *   `target_task_id`: `z.string().uuid().optional()` (dùng cho checklist item mới)
    *   Validation: `preferred_window[0]` < `preferred_window[1]`
    *   `suggestionType` sẽ được suy luận: có `target_task_id` → 1 (checklist), ngược lại → 0 (task)

*   **Cập nhật Controller (`src/controllers/aiSuggestions.controller.js`):**
    *   Log manual input usage để tracking
    *   Xử lý lỗi validation với thông báo rõ ràng
    *   **Cập nhật Accept Endpoint (`PATCH /api/ai-suggestions/:id/status`):**
        - Validate `selected_slot_index` và `schedule_entry_id` theo schema mới
        - Handle slot selection logic trong accept flow

**Backward Compatibility Strategy:**

*   **Client cũ (không gửi `manual_input`)**: Fallback về auto suggestion mode (LLM generate tasks từ context, không có slots)
*   **Client mới (có `manual_input`)**: Manual input mode (LLM đề xuất slots cho manual input)
*   **Fallback Logic**: Nếu `manual_input` undefined → auto suggestion mode
*   **Rollout Plan**: 
    1. Deploy backend với `manual_input` optional
    2. Thông báo FE team về tính năng mới
    3. FE implement manual input UI
    4. Monitor usage metrics

**Rủi ro:**

*   Client cũ có thể bị confused khi thấy response format khác nhau
*   Validation logic phức tạp cho `preferred_window` constraints

**Phụ thuộc:**

*   Frontend team cần update để sử dụng `manual_input`
*   Cần có migration guide cho client cũ

---

## Phase 2 – Service & LLM Slot Suggestions

**Mục tiêu:** Implement LLM-driven slot suggestions và backend validation cho manual input.

**Tasks:**

*   **LLM Prompt Template cho Manual Input:**
    *   LLM nhận `manual_input` + `freeSlots` + `studyProfile` + `scheduleEntries`
    *   Yêu cầu LLM đề xuất 1-3 slot options cho item đó
    *   **Lưu ý**: Prompt chỉ chạy khi có `manual_input`, không chạy trong auto mode
    *   Prompt template:
        ```javascript
        function getManualInputPromptTemplate({ suggestionType, hasTargetTask }) {
          return `You are a smart scheduling assistant. Suggest optimal time slots for the user's manual input.

        **User's Manual Input:**
        {{manualInput}}

        **Available Free Slots:**
        {{freeSlots}}

        **User's Study Profile:**
        {{studyProfile}}

        **Current Schedule (busy times):**
        {{scheduleEntries}}

        **Instructions:**
        1. Analyze the manual input and available free slots
        2. Suggest 1-3 optimal time slots for this task/checklist item
        3. Consider user's chronotype, deadline, and preferred window
        4. Each slot should be realistic and non-overlapping
        5. Return valid JSON:

        {
          "items": [
            {
              "item_type": ${suggestionType},
              "title": "refined title from manual_input",
              "description": "refined description", 
              "estimated_minutes": {{manualInput.duration_minutes}},
              "deadline": "from manual_input.deadline or null",
              "suggested_slots": [
                {
                  "suggested_start_at": "2024-01-15T09:00:00Z",
                  "planned_minutes": 60,
                  "confidence": 0.9,
                  "reason": "Morning slot matches your chronotype"
                },
                {
                  "suggested_start_at": "2024-01-15T14:00:00Z", 
                  "planned_minutes": 60,
                  "confidence": 0.7,
                  "reason": "Afternoon slot, good focus time"
                }
              ],
              "metadata": {
                ${hasTargetTask ? '"parentTaskId": "manual_input.target_task_id",' : ''}
                "source": "manual_input"
              }
            }
          ],
          "confidence": number (0.0-1.0),
          "reason": "Overall explanation of slot suggestions"
        }

        **CRITICAL:** Return ONLY valid JSON, no extra text.`;
        }
        ```

*   **Backend Slot Validation (`src/services/aiSuggestions.service.js`):**
    *   Implement `validateSlotSuggestions()` function
    *   Check LLM suggestions against actual `freeSlots`
    *   **Chỉ filter out invalid slots** (overlapping, outside free time) - KHÔNG sửa slot
    *   Reorder by confidence score
    *   **Fallback**: nếu không có slot hợp lệ → trả về `items: []` và `reason` giải thích
    *   **Lưu ý**: Backend chỉ loại bỏ slot không hợp lệ, không sửa slot từ LLM
    *   **Format Conversion**: Convert `preferred_window` array sang object để so sánh với free slots

*   **Service Integration (Dual Mode):**
    *   **Manual Input Mode**: 
        - Guard check: `if (manual_input)` → gọi LLM với manual input prompt → validate slots → return validated suggestions
        - Prompt template: `getManualInputPromptTemplate()` (có `suggested_slots`)
    *   **Auto Suggestion Mode**: 
        - Fallback: `if (!manual_input)` → gọi LLM với auto suggestion prompt → generate tasks từ context (không có slot)
        - Prompt template: `getDefaultPromptTemplate()` (không có `suggested_slots`)
    *   **Guard Logic**: Tránh crash khi `manualInput.duration_minutes` undefined

**Rủi ro:**

*   LLM có thể đề xuất slot không hợp lệ (overlapping, outside free time)
*   Slot validation logic có thể phức tạp với edge cases

**Phụ thuộc:**

*   `computeFreeSlots()` function phải chính xác
*   Study profile data phải có sẵn cho LLM context

---

## Phase 3 – Persistence & History

**Mục tiêu:** Lưu trữ `manual_input` và `suggested_slots` vào database để duy trì lịch sử và hỗ trợ Accept flow.

**Tasks:**

*   **Lưu `manual_input` và `suggested_slots` vào `AISuggestions` table (`src/repositories/aiSuggestions.repo.js`):**
    *   Lưu toàn bộ `manual_input` vào `payload.manual_input`
    *   Lưu array `suggested_slots` vào `payload.suggested_slots` cho mỗi item
    *   Format JSON cuối cùng:
        ```json
        {
          "payload": {
            "manual_input": {
              "title": "Study React",
              "description": "Learn hooks and state",
              "duration_minutes": 60,
              "deadline": "2024-01-20T18:00:00Z",
              "preferred_window": ["2024-01-15T09:00:00Z", "2024-01-15T17:00:00Z"],
              "target_task_id": "uuid-optional"
            },
            "suggested_slots": [
              {
                "suggested_start_at": "2024-01-15T09:00:00Z",
                "planned_minutes": 60,
                "confidence": 0.9,
                "reason": "Morning slot matches chronotype"
              }
            ]
          }
        }
        ```

*   **Accept Flow (`src/services/aiSuggestions.service.js`):**
    *   User chọn 1 slot từ `suggested_slots` array
    *   Backend tạo task/checklist item như cũ
    *   FE sử dụng `suggested_start_at` + `planned_minutes` để tạo `schedule_entry`
    *   Backend lưu `schedule_entry_id` vào `metadata` để liên kết

*   **Cập nhật Accept Endpoint (`PATCH /api/ai-suggestions/:id/status`):**
    *   Thêm `selected_slot_index` vào payload để user chọn slot cụ thể
    *   Thêm `schedule_entry_id` vào payload để liên kết với schedule entry đã tạo
    *   Schema validation:
        ```javascript
        const acceptSuggestionSchema = z.object({
          status: z.enum(['accepted', 'rejected']),
          selected_slot_index: z.number().int().min(0).optional(), // chỉ khi có suggested_slots
          schedule_entry_id: z.string().uuid().optional()
        });
        ```
    *   **Controller Update**: Validate schema mới trong `acceptSuggestion` function

**Rủi ro:**

*   `suggested_slots` array có thể lớn, cần optimize storage
*   Accept flow cần handle việc user chọn slot cụ thể

**Phụ thuộc:**

*   Frontend cần UI để user chọn từ multiple slot options
*   Cần API để FE gửi `selected_slot_index` khi accept

---

## Phase 4 – Tests & Docs

**Mục tiêu:** Đảm bảo tính năng mới hoạt động đúng, không phá vỡ các tính năng cũ và được tài liệu hóa đầy đủ.

**Tasks:**

*   **Unit Tests (`tests/unit/aiSuggestions.service.test.js`):**
    *   Test validation cho `manual_input` (valid, invalid duration, missing fields)
    *   Test LLM prompt generation với `manual_input` + `freeSlots` + `studyProfile`
    *   Test `validateSlotSuggestions()` function với various scenarios
    *   Test LLM response parsing với `suggested_slots` array
    *   Test fallback khi LLM trả về invalid slots
    *   **Backward Compatibility Tests:**
        *   Test `manual_input = undefined` → fallback về auto suggestion mode
        *   Test response format consistency giữa manual input mode và auto mode
    *   **Slot Validation Tests:**
        *   Test LLM trả slot invalid → backend lọc bỏ & reason
        *   Test slot overlapping → backend filter out
        *   Test slot outside free time → backend reject
        *   Test LLM trả ít hơn 3 slot hoặc rỗng → backend handle gracefully
        *   Test `preferred_window` array conversion sang object

*   **Integration Tests (`tests/integration/aiSuggestions.api.test.js`):**
    *   Test `POST /api/ai-suggestions/generate` với `manual_input` → nhận về `suggested_slots` array
    *   Test trường hợp không có slot hợp lệ (empty `suggested_slots`, confidence thấp)
    *   Test Accept flow với `selected_slot_index` parameter
    *   **Backward Compatibility Tests:**
        *   Test client cũ (không gửi `manual_input`) → fallback về auto suggestion mode
        *   Test response format consistency giữa manual input mode và auto mode
    *   **Manual Input Tests:**
        *   Test `manual_input = undefined` → auto mode (không có slots)
        *   Test `manual_input` có data → manual mode (có slots)
    *   **Slot Edge Cases:**
        *   Test LLM trả 0 slot → `items: []` với reason
        *   Test LLM trả 1 slot → backend validate và return
        *   Test LLM trả 2 slot → backend validate và return cả 2

*   **Cập nhật Tài liệu:**
    *   **`README.md`:** Cập nhật phần AI Suggestions API để phản ánh `manual_input` là optional và cấu trúc response mới (có `suggested_slots` array)
    *   **`docs/AI/AI_SUGGESTIONS_API_GUIDE.md`:** Chi tiết hóa API mới, ví dụ request/response với `suggested_slots`
    *   **`docs/AI/AI_SUGGESTIONS_FRONTEND_INTEGRATION.md`:** Hướng dẫn frontend cách gửi `manual_input` và handle multiple slot options
    *   **`docs/AI/AI_SUGGESTIONS_EXAMPLES.md`:** Thêm ví dụ cụ thể cho manual input flow với slot selection

**Rủi ro:**

*   Quên cập nhật một phần tài liệu hoặc test case.
*   Các test case cũ có thể cần điều chỉnh do thay đổi mục tiêu của AI.

**Phụ thuộc:**

*   Hoàn thành các phase trước.

---

## Kết luận

Kế hoạch này định hướng rõ ràng cho việc chuyển đổi AI Suggestions từ một tính năng tự động sinh task sang một công cụ hỗ trợ lập lịch trình mạnh mẽ hơn, dựa trên input trực tiếp từ người dùng. 

**Tóm tắt Flow:**
1. **LLM đề xuất 1-3 slot options** cho mỗi manual input item
2. **Backend validate và filter** slot suggestions dựa trên free slots thực tế  
3. **Frontend nhận validated slots** và cho user chọn option phù hợp nhất
4. **Backward compatibility** được đảm bảo: client cũ fallback về auto suggestion mode

Việc tập trung vào **LLM → 1-3 slot, backend validate & trả FE** sẽ mang lại giá trị trực tiếp và dễ đo lường hơn cho người dùng.
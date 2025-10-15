<!-- a9e9c696-e08c-4153-b0fb-548848bbc268 df029e63-3710-4523-bea1-e1bd943e79a3 -->
# Manual Input Mode Integration Plan

## Tổng quan tích hợp

UI/UX AI Scheduling đã có sẵn:

- ManualInputForm với validation
- SuggestionsDisplay để hiển thị suggestions
- SuggestionCard để hiển thị từng slot
- Modal flow management (form → loading → suggestions)
- Accept/reject logic cơ bản

Cần bổ sung:

- Tích hợp real backend API
- Slot selection UI và logic
- Schedule entry creation
- Error handling cho API scenarios mới

## Phase 1: Backend API Service Integration

### 1.1 Tạo Real API Service

**File**: `components/AISuggestionsModal/services/realAISuggestionsService.ts`

Implement `RealAISuggestionsService` class:

- Method `generateSuggestions(input: ManualInput)` call `POST /api/ai-suggestions/generate`
- Handle authentication với JWT token từ auth context
- Parse response theo format backend: `data.suggestion.items[]`
- Transform TẤT CẢ items (không chỉ item đầu), preserve `original_index` → `slot_index`
- Backend confidence là 0.0-1.0, **giữ nguyên format** (không convert sang 0-2)
- Extract metadata: `adjusted_duration`, `adjusted_deadline`, `source`
```typescript
// Transform logic: handle multiple items
const transformedSlots = response.data.suggestion.items.flatMap(item =>
  item.suggested_slots?.map(slot => ({
    slot_index: slot.original_index,
    suggested_start_at: slot.suggested_start_at,
    planned_minutes: slot.planned_minutes,
    confidence: slot.confidence, // Keep 0.0-1.0 as-is
    reason: slot.reason,
    metadata: item.metadata
  })) || []
);
```


### 1.2 Tạo Real Accept Service

**File**: `components/AISuggestionsModal/services/realAcceptService.ts`

Implement accept API:

- Method `acceptSuggestion(suggestionId, slotIndex, scheduleEntryId?)` 
- Call `POST /api/ai-suggestions/{id}/accept`
- Request body: `{ status: 'accepted', selected_slot_index: number, schedule_entry_id?: string }`
- Response: `{ suggestion_id, status, created_items, updated_at }`

### 1.3 Update Service Manager

**File**: `components/AISuggestionsModal/services/mockAISuggestionsService.ts`

Thêm service toggle:

```typescript
const USE_REAL_API = process.env.REACT_APP_USE_REAL_API === 'true';
export const aiSuggestionsService = USE_REAL_API 
  ? new RealAISuggestionsService() 
  : new MockAISuggestionsService();
```

## Phase 2: API Types & Validation Updates

### 2.1 Update Types cho Backend Format

**File**: `components/AISuggestionsModal/types.ts`

Thêm backend response types:

```typescript
interface BackendSuggestionResponse {
  message: string;
  data: {
    suggestion: {
      suggestion_id: string;
      items: BackendSuggestionItem[];
      confidence: number;
      reason: string;
      created_at: string;
    };
  };
  meta: {
    cost: number;
    tokens: number;
    latency_ms: number;
  };
}

interface BackendSuggestionItem {
  item_type: 0 | 1;
  title: string;
  description: string;
  estimated_minutes: number;
  deadline?: string;
  suggested_slots?: BackendSuggestedSlot[];
  metadata: {
    source?: 'manual_input' | 'auto_suggestion';
    adjusted_duration?: boolean;
  };
}

interface BackendSuggestedSlot {
  suggested_start_at: string;
  planned_minutes: number;
  confidence: number; // 0.0-1.0
  reason: string;
  original_index: number;
}
```

### 2.2 Update ManualInput Validation

**File**: `components/AISuggestionsModal/hooks/useFormValidation.ts`

Đảm bảo validation khớp với backend requirements:

- `title`: 1-120 chars, required
- `description`: max 500 chars, optional
- `duration_minutes`: 15-180, multiple of 15
- `deadline`: ISO 8601 format, must be in future
- `preferred_window`: [start, end], start < end, both ISO 8601

## Phase 3: Slot Selection Enhancement

### 3.1 Update SuggestionCard UI

**File**: `components/AISuggestionsModal/SuggestionCard.tsx`

Hiện tại card đã có `isSelected` prop. Cần đảm bảo:

- Visual feedback rõ ràng khi selected (checkmark, border highlight)
- Hiển thị confidence với format backend (0.0-1.0) - **KHÔNG convert sang 0-2**:
  - High: >= 0.7 → "High Confidence" (green)
  - Medium: >= 0.4 và < 0.7 → "Medium Confidence" (yellow)  
  - Low: < 0.4 → "Low Confidence" (red)
- Hiển thị `reason` từ backend
- Hiển thị metadata flags nếu có:
  - `adjusted_duration`: Badge "Duration Adjusted" 
  - `adjusted_deadline`: Badge "Deadline Adjusted"
  - Tooltip giải thích tại sao bị adjust

### 3.2 Update SuggestionsDisplay Logic

**File**: `components/AISuggestionsModal/SuggestionsDisplay.tsx`

Đã có `selectedSlotIndex` và `onSlotSelect` props. Verify:

- Render từng slot trong `suggested_slots` array
- Pass `isSelected={selectedSlotIndex === slot.slot_index}` xuống SuggestionCard
- Handle click để select slot
- Hiển thị message nếu không có slots (fallback UI)

### 3.3 Update Modal State Management

**File**: `components/AISuggestionsModal/index.tsx`

Modal đã có `selectedSlotIndex` state. Cần:

- Đảm bảo `handleSlotSelect` update state correctly
- Reset `selectedSlotIndex` khi tạo suggestion mới
- Validate có slot được select trước khi accept
- Show error nếu user chưa chọn slot khi bấm accept

## Phase 4: Accept Flow với Schedule Creation

### 4.1 Update Accept Handler

**File**: `components/AISuggestionsModal/index.tsx`

Update `handleAcceptSuggestion`:

```typescript
const handleAcceptSuggestion = async () => {
  if (!hasSelectedSlot() || !modalState.aiSuggestion) return;
  
  try {
    // Call real accept API
    const response = await acceptSuggestion(
      modalState.aiSuggestion.id, 
      modalState.selectedSlotIndex!
    );
    
    // response.created_items[0] chứa schedule entry mới
    const scheduleEntry = response.created_items[0];
    
    // Call onSuccess callback để refresh TasksPage
    if (onSuccess) {
      onSuccess(scheduleEntry.item_id);
    }
    
    // Close modal
    onClose();
  } catch (error) {
    // Handle errors
  }
};
```

### 4.2 Update TasksPage Integration

**File**: `src/features/tasks/TasksPage.tsx`

`handleAISuggestionsSuccess` đã có, verify invalidate queries:

```typescript
const handleAISuggestionsSuccess = useCallback((scheduleEntryId: string) => {
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id] });
  queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
  setAiSuggestionsModalOpen(false);
}, [queryClient, user?.id]);
```

## Phase 5: Error Handling & Edge Cases

### 5.1 Handle Rate Limiting (429)

**Files**:

- `components/AISuggestionsModal/index.tsx`
- `components/AISuggestionsModal/services/realAISuggestionsService.ts`

Implement retry logic:

- Catch 429 response
- Extract `retryAfter` từ response body
- Show user-friendly message với countdown
- Disable generate button during cooldown

### 5.2 Handle Validation Errors (400)

Show specific field errors từ backend:

```typescript
// Backend response
{
  "message": "Validation failed",
  "errors": {
    "duration_minutes": "Must be between 15 and 180",
    "deadline": "Must be in the future"
  }
}
```

Map errors xuống form fields.

### 5.3 Handle Empty Slots Scenario

Backend có thể return suggestion với empty `suggested_slots`:

- Check `suggested_slots.length === 0`
- Show FallbackUI component
- Display `fallback_auto_mode` information nếu có

### 5.4 Handle Network Errors

- Timeout (30s recommended per docs)
- Network failure
- 500 Internal Server Error
- Show retry button

## Phase 6: Testing & Validation

### 6.1 Manual Testing Checklist

Test cases cần verify:

1. **Happy path**: Input → Loading → Slots → Select → Accept → Schedule created
2. **No slots available**: Show fallback UI with suggestions
3. **Rate limiting**: Show countdown, retry after cooldown
4. **Validation errors**: Field-level error messages
5. **Network errors**: Retry mechanism works
6. **Preferred window**: Slots respect preferred_window if provided
7. **Duration adjustment**: Backend adjusts duration, show metadata
8. **Multiple slots**: Can select different slots
9. **Cancel flow**: Reset state correctly

### 6.2 API Integration Testing

Test với real backend:

```bash
# Set environment variable
REACT_APP_USE_REAL_API=true npm run dev

# Test endpoints manually
curl -X POST http://localhost:3000/api/ai-suggestions/generate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"suggestionType": 0, "manual_input": {...}, "timezone": "Asia/Ho_Chi_Minh"}'
```

### 6.3 Error Scenarios Testing

Test tất cả error paths:

- Invalid JWT token → 401
- Rate limit exceeded → 429
- Invalid input → 400
- Backend down → 503
- Slow response → Timeout handling

## Phase 7: Documentation Updates

### 7.1 Update Component Documentation

**Files**:

- `components/AISuggestionsModal/README.md` (create if not exists)

Document:

- Manual Input Mode usage
- Props for components
- API service integration
- Error handling patterns

### 7.2 Update Integration Docs

**File**: `docs/AI suggestions/FRONTEND_INTEGRATION_CHECKLIST.md`

Update checklist items:

- [x] Manual Input Mode implemented
- [x] Slot selection functional
- [x] Real API integrated
- [x] Error handling complete

## Implementation Order

1. **Phase 1 & 2 first**: Backend service + types (foundation)
2. **Phase 3**: UI updates for slot selection (visible progress)
3. **Phase 4**: Accept flow with schedule creation (core feature)
4. **Phase 5**: Error handling (robustness)
5. **Phase 6**: Testing (verification)
6. **Phase 7**: Documentation (maintenance)

## Files to Modify

Core changes:

- `components/AISuggestionsModal/services/realAISuggestionsService.ts` (new)
- `components/AISuggestionsModal/services/realAcceptService.ts` (new)
- `components/AISuggestionsModal/services/mockAISuggestionsService.ts` (update toggle)
- `components/AISuggestionsModal/types.ts` (add backend types)
- `components/AISuggestionsModal/SuggestionCard.tsx` (confidence display)
- `components/AISuggestionsModal/index.tsx` (accept handler)
- `src/features/tasks/TasksPage.tsx` (verify refresh logic)

Minor changes:

- `components/AISuggestionsModal/hooks/useFormValidation.ts` (validation rules)
- `.env.development` (add REACT_APP_USE_REAL_API flag)
- `docs/AI suggestions/FRONTEND_INTEGRATION_CHECKLIST.md` (update status)

## Success Criteria

- [ ] User có thể nhập manual input và nhận được suggested slots từ backend
- [ ] User có thể select một slot và accept
- [ ] Accept tạo schedule entry thành công trong database
- [ ] TasksPage refresh và hiển thị schedule entry mới
- [ ] Tất cả error scenarios được handle gracefully
- [ ] Rate limiting work correctly với countdown UI
- [ ] No breaking changes to existing mock mode

### To-dos

- [ ] Create RealAISuggestionsService and RealAcceptService with API integration
- [ ] Add backend response types and transform logic
- [ ] Implement service manager toggle between mock and real API
- [ ] Update SuggestionCard confidence display for backend format (0.0-1.0)
- [ ] Update handleAcceptSuggestion to call real API and create schedule entry
- [ ] Implement rate limiting, validation errors, and network error handling
- [ ] Execute manual testing checklist for all scenarios
- [ ] Test with real backend API endpoints
- [ ] Update component docs and integration checklist
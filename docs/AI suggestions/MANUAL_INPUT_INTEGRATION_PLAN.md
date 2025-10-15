# Manual Input Mode Integration Plan

## Tổng quan tích hợp

UI/UX AI Scheduling đã có sẵn:
- ManualInputForm với validation (đã chuyển sang tiếng Anh)
- SuggestionsDisplay để hiển thị suggestions
- SuggestionCard để hiển thị từng slot
- Modal flow management (form → loading → suggestions)
- Accept/reject logic cơ bản

Cần bổ sung:
- Tích hợp real backend API
- Slot selection UI và logic
- Schedule entry creation
- Error handling cho API scenarios mới

---

## Phase 1: Backend API Service Integration

### 1.1 Tạo Real API Service

**File**: `components/AISuggestionsModal/services/realAISuggestionsService.ts`

Implement `RealAISuggestionsService` class:

- Method `generateSuggestions(input: ManualInput)` call `POST /api/ai-suggestions/generate`
- Handle authentication với JWT token từ auth context
- Parse response theo format backend: `data.suggestion.items[]`
- Transform **TẤT CẢ items** (không chỉ item đầu), preserve `original_index` → `slot_index`
- Backend confidence là **0.0-1.0, giữ nguyên format** (KHÔNG convert sang 0-2)
- Extract metadata: `adjusted_duration`, `adjusted_deadline`, `source`

```typescript
class RealAISuggestionsService implements AISuggestionsService {
  async generateSuggestions(input: ManualInput): Promise<AISuggestion> {
    const response = await api.post('/api/ai-suggestions/generate', {
      suggestionType: 0,
      manual_input: input,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // Transform ALL items (hỗ trợ future checklist tasks)
    const items = response.data.suggestion.items;
    const transformedSlots = items.flatMap(item =>
      item.suggested_slots?.map(slot => ({
        slot_index: slot.original_index,
        suggested_start_at: slot.suggested_start_at,
        planned_minutes: slot.planned_minutes,
        confidence: slot.confidence, // Keep 0.0-1.0 as-is, NO conversion
        reason: slot.reason,
        metadata: item.metadata // adjusted_duration, adjusted_deadline, source
      })) || []
    );
    
    return {
      id: response.data.suggestion.suggestion_id,
      suggestion_type: 0,
      status: 0,
      confidence: response.data.suggestion.confidence,
      reason: response.data.suggestion.reason,
      manual_input: input,
      suggested_slots: transformedSlots,
      fallback_auto_mode: response.data.suggestion.fallback_auto_mode || {
        enabled: false,
        reason: ''
      },
      created_at: response.data.suggestion.created_at,
      updated_at: response.data.suggestion.updated_at
    };
  }
}

export const realAISuggestionsService = new RealAISuggestionsService();
```

### 1.2 Tạo Real Accept Service

**File**: `components/AISuggestionsModal/services/realAcceptService.ts`

Implement accept API theo ĐÚNG spec backend:

- Method `acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse>`
- Call `PATCH /api/ai-suggestions/{id}/status` (**KHÔNG PHẢI** POST .../accept)
- Request body: `{ status: 'accepted', selected_slot_index: number, schedule_entry_id?: string }`
- Response: `{ id, status, selected_slot_index, schedule_entry_id, message, created_at, updated_at }`
- **Backend KHÔNG trả `created_items` array** - chỉ có `schedule_entry_id` string ở top level

```typescript
class RealAISuggestionsAcceptService implements AISuggestionsAcceptService {
  async acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse> {
    const response = await api.patch(
      `/api/ai-suggestions/${suggestionId}/status`,
      {
        status: 'accepted',
        selected_slot_index: request.selected_slot_index,
        schedule_entry_id: request.schedule_entry_id
      }
    );
    
    // Response trả schedule_entry_id trực tiếp, KHÔNG có created_items[]
    return {
      id: response.data.id,
      status: response.data.status,
      selected_slot_index: response.data.selected_slot_index,
      schedule_entry_id: response.data.schedule_entry_id,
      message: response.data.message,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  }
}

export const realAcceptService = new RealAISuggestionsAcceptService();
```

### 1.3 Update Service Toggle

**File**: `components/AISuggestionsModal/index.tsx`

Sử dụng `serviceManager.switchService()` đã có sẵn trong `useAISuggestions.ts`:

```typescript
import { serviceManager } from './hooks/useAISuggestions';
import { realAISuggestionsService } from './services/realAISuggestionsService';

// In modal component
useEffect(() => {
  if (process.env.REACT_APP_USE_REAL_API === 'true') {
    serviceManager.switchService(realAISuggestionsService);
  }
}, []);
```

**File**: `components/AISuggestionsModal/services/acceptService.ts`

Tương tự, thêm service manager pattern nếu chưa có:

```typescript
class AISuggestionsAcceptServiceManager {
  private service: AISuggestionsAcceptService;
  
  constructor(service: AISuggestionsAcceptService) {
    this.service = service;
  }
  
  async acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse> {
    return this.service.acceptSuggestion(suggestionId, request);
  }
  
  switchService(newService: AISuggestionsAcceptService) {
    this.service = newService;
  }
}

export const acceptServiceManager = new AISuggestionsAcceptServiceManager(
  new MockAISuggestionsAcceptService()
);
```

**KHÔNG chỉnh `mockAISuggestionsService.ts`** - service toggle được quản lý bởi serviceManager.

---

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
      fallback_auto_mode?: {
        enabled: boolean;
        reason: string;
      };
      created_at: string;
      updated_at: string;
    };
  };
  meta: {
    cost: number;
    tokens: number;
    latency_ms: number;
  };
}

interface BackendSuggestionItem {
  item_type: 0 | 1; // 0: task, 1: checklist
  title: string;
  description: string;
  estimated_minutes: number;
  deadline?: string;
  suggested_slots?: BackendSuggestedSlot[];
  metadata: {
    source?: 'manual_input' | 'auto_suggestion';
    adjusted_duration?: boolean;
    adjusted_deadline?: boolean;
    duration_adjustment_reason?: string;
    deadline_adjustment_reason?: string;
  };
}

interface BackendSuggestedSlot {
  suggested_start_at: string; // ISO 8601 UTC
  planned_minutes: number;
  confidence: number; // 0.0-1.0 (KHÔNG phải 0-2)
  reason: string;
  original_index: number; // Transform thành slot_index
}

// Update existing SuggestedSlot to include metadata
export interface SuggestedSlot {
  slot_index: number;
  suggested_start_at: string;
  planned_minutes: number;
  confidence: number; // 0.0-1.0 format
  reason: string;
  metadata?: {
    adjusted_duration?: boolean;
    adjusted_deadline?: boolean;
    duration_adjustment_reason?: string;
    deadline_adjustment_reason?: string;
  };
}
```

### 2.2 Update ManualInput Validation

**File**: `components/AISuggestionsModal/hooks/useFormValidation.ts`

Validation đã có, verify khớp với backend requirements:

- `title`: 1-120 chars, required
- `description`: max 500 chars, optional
- `duration_minutes`: 15-180, multiple of 15
- `deadline`: ISO 8601 format, must be in future
- `preferred_window`: [start, end], start < end, both ISO 8601

---

## Phase 3: Slot Selection Enhancement

### 3.1 Update SuggestionCard UI

**File**: `components/AISuggestionsModal/SuggestionCard.tsx`

Hiện tại card đã có `isSelected` prop. Cần cập nhật:

1. **Visual feedback** rõ ràng khi selected (checkmark, border highlight)

2. **Hiển thị confidence** với format backend (0.0-1.0) - **KHÔNG convert sang 0-2**:
   - High: >= 0.7 → "High Confidence" (green)
   - Medium: >= 0.4 và < 0.7 → "Medium Confidence" (yellow)  
   - Low: < 0.4 → "Low Confidence" (red)

```typescript
const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.7) return { label: 'High Confidence', color: 'green' };
  if (confidence >= 0.4) return { label: 'Medium Confidence', color: 'yellow' };
  return { label: 'Low Confidence', color: 'red' };
};
```

3. **Hiển thị metadata flags** nếu có:
   - `adjusted_duration`: Badge "Duration Adjusted" 
   - `adjusted_deadline`: Badge "Deadline Adjusted"
   - Tooltip giải thích tại sao bị adjust

```tsx
{slot.metadata?.adjusted_duration && (
  <Tooltip content={slot.metadata.duration_adjustment_reason}>
    <Badge variant="warning">Duration Adjusted</Badge>
  </Tooltip>
)}
```

### 3.2 Update SuggestionsDisplay Logic

**File**: `components/AISuggestionsModal/SuggestionsDisplay.tsx`

Đã có `selectedSlotIndex` và `onSlotSelect` props. Verify:

- Render từng slot trong `suggested_slots` array
- Pass `isSelected={selectedSlotIndex === slot.slot_index}` xuống SuggestionCard
- Handle click để select slot
- Hiển thị message nếu không có slots (fallback UI)

### 3.3 Update FallbackUI

**File**: `components/AISuggestionsModal/FallbackUI.tsx`

Hiển thị metadata adjustments trong fallback reasons:

```tsx
{aiSuggestion.metadata?.adjusted_duration && (
  <div className="adjustment-notice">
    <p>Duration was adjusted: {aiSuggestion.metadata.duration_adjustment_reason}</p>
  </div>
)}
```

### 3.4 Update Modal State Management

**File**: `components/AISuggestionsModal/index.tsx`

Modal đã có `selectedSlotIndex` state. Cần:

- Đảm bảo `handleSlotSelect` update state correctly
- Reset `selectedSlotIndex` khi tạo suggestion mới
- Validate có slot được select trước khi accept
- Show error nếu user chưa chọn slot khi bấm accept

---

## Phase 4: Accept Flow với Schedule Creation

### 4.1 Update Accept Handler

**File**: `components/AISuggestionsModal/index.tsx`

Update `handleAcceptSuggestion` để dùng ĐÚNG response format:

```typescript
const handleAcceptSuggestion = async () => {
  if (selectedSlotIndex === null || !aiSuggestion) {
    setError('Please select a time slot');
    return;
  }
  
  try {
    setIsAccepting(true);
    
    // Call real accept API (PATCH /api/ai-suggestions/{id}/status)
    const response = await acceptServiceManager.acceptSuggestion(
      aiSuggestion.id,
      {
        status: 1,
        selected_slot_index: selectedSlotIndex
      }
    );
    
    // Backend trả schedule_entry_id trực tiếp, KHÔNG có created_items[]
    const scheduleEntryId = response.schedule_entry_id;
    
    // Call onSuccess callback để refresh TasksPage
    if (onSuccess) {
      onSuccess(scheduleEntryId);
    }
    
    // Close modal (không cần goToSuccess nữa)
    onClose();
    
  } catch (error: any) {
    console.error('Error accepting suggestion:', error);
    setError(error.message || 'Failed to accept suggestion');
  } finally {
    setIsAccepting(false);
  }
};
```

### 4.2 Update TasksPage Integration

**File**: `src/features/tasks/TasksPage.tsx`

`handleAISuggestionsSuccess` đã có, verify invalidate queries:

```typescript
const handleAISuggestionsSuccess = useCallback((scheduleEntryId: string) => {
  // Invalidate all relevant queries
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id] });
  queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
  
  // Close modal
  setAiSuggestionsModalOpen(false);
  
  // Optional: Show toast notification (KHÔNG dùng alert)
  // toast.success('Schedule entry created successfully');
}, [queryClient, user?.id]);
```

---

## Phase 5: Error Handling & Edge Cases

### 5.1 Handle Rate Limiting (429)

**Files**: 
- `components/AISuggestionsModal/index.tsx`
- `components/AISuggestionsModal/services/realAISuggestionsService.ts`

Implement retry logic theo ĐÚNG spec backend - **Đọc từ HEADERS, KHÔNG phải response body**:

```typescript
try {
  const result = await serviceManager.generateSuggestions(input);
  // ...
} catch (error: any) {
  if (error.response?.status === 429) {
    // Backend trả rate limit info trong HEADERS
    const retryAfter = parseInt(error.response.headers['retry-after'] || '900');
    const resetTime = parseInt(error.response.headers['x-ratelimit-reset'] || '0');
    const remaining = parseInt(error.response.headers['x-ratelimit-remaining'] || '0');
    
    // Show countdown UI
    setError(`Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
    setRetryAfter(retryAfter);
    
    // Disable generate button và show countdown
    startCountdown(retryAfter);
  }
}
```

### 5.2 Handle Validation Errors (400)

Show specific field errors từ backend:

```typescript
if (error.response?.status === 400) {
  const backendErrors = error.response.data.errors;
  
  // Map backend errors to form fields
  if (backendErrors) {
    setFormErrors({
      title: backendErrors.title,
      duration_minutes: backendErrors.duration_minutes,
      deadline: backendErrors.deadline,
      preferred_window: backendErrors.preferred_window
    });
  }
  
  setError(error.response.data.message || 'Validation failed');
}
```

### 5.3 Handle Empty Slots Scenario

Backend có thể return suggestion với empty `suggested_slots`:

```typescript
if (aiSuggestion.suggested_slots.length === 0) {
  // Show FallbackUI component
  return (
    <FallbackUI 
      aiSuggestion={aiSuggestion}
      onSwitchToAutoMode={handleSwitchToAutoMode}
    />
  );
}
```

Trong FallbackUI, hiển thị:
- `fallback_auto_mode.reason` nếu có
- Metadata adjustments (adjusted_duration, adjusted_deadline)
- Suggestions để fix (adjust duration, extend deadline, remove preferred window)

### 5.4 Handle Network Errors

```typescript
catch (error: any) {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    setError('Request timeout. Please try again.');
  } else if (error.response?.status === 500) {
    setError('Server error. Please try again later.');
  } else if (error.response?.status === 503) {
    setError('AI service is currently unavailable. Please try again later.');
  } else if (!error.response) {
    setError('Network error. Please check your connection.');
  }
}
```

Timeout configuration:
```typescript
const api = axios.create({
  timeout: 30000, // 30 seconds as recommended
});
```

---

## Phase 6: Testing & Validation

### 6.1 Manual Testing Checklist

Test cases cần verify:

1. **Happy path**: Input → Loading → Slots → Select → Accept → Schedule created ✓
2. **No slots available**: Show fallback UI with suggestions ✓
3. **Rate limiting**: Show countdown từ headers, retry after cooldown ✓
4. **Validation errors**: Field-level error messages từ backend ✓
5. **Network errors**: Retry mechanism works ✓
6. **Preferred window**: Slots respect preferred_window if provided ✓
7. **Duration/deadline adjustment**: Show metadata badges và reasons ✓
8. **Multiple slots**: Can select different slots ✓
9. **Cancel flow**: Reset state correctly ✓
10. **Confidence display**: 0.0-1.0 scale, correct color coding ✓

### 6.2 API Integration Testing

Test với real backend:

```bash
# Set environment variable
REACT_APP_USE_REAL_API=true npm run dev

# Test generate endpoint
curl -X POST http://localhost:3000/api/ai-suggestions/generate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suggestionType": 0,
    "manual_input": {
      "title": "Study React Hooks",
      "duration_minutes": 60,
      "deadline": "2025-01-20T23:59:59Z"
    },
    "timezone": "Asia/Ho_Chi_Minh"
  }'

# Test accept endpoint (PATCH not POST)
curl -X PATCH http://localhost:3000/api/ai-suggestions/{id}/status \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "selected_slot_index": 0
  }'
```

### 6.3 Error Scenarios Testing

Test tất cả error paths:

- Invalid JWT token → 401
- Rate limit exceeded → 429 (check headers)
- Invalid input → 400 (check field errors)
- Backend down → 503
- Slow response → Timeout handling
- Network failure → Connection error

---

## Phase 7: Documentation Updates

### 7.1 Update Component Documentation

**File**: `components/AISuggestionsModal/README.md` (create if not exists)

Document:
- Manual Input Mode usage
- Props for components
- API service integration
- Error handling patterns
- Service toggle configuration

### 7.2 Update Integration Docs

**File**: `docs/AI suggestions/FRONTEND_INTEGRATION_CHECKLIST.md`

Update checklist items:
- [x] Manual Input Mode implemented
- [x] Slot selection functional
- [x] Real API integrated (PATCH endpoint)
- [x] Error handling complete (headers for rate limit)
- [x] Confidence display correct (0.0-1.0)
- [x] Metadata adjustments shown

---

## Implementation Order

1. **Phase 1 & 2 first**: Backend service + types (foundation)
2. **Phase 3**: UI updates for slot selection + metadata display (visible progress)
3. **Phase 4**: Accept flow with schedule creation (core feature)
4. **Phase 5**: Error handling (robustness)
5. **Phase 6**: Testing (verification)
6. **Phase 7**: Documentation (maintenance)

---

## Files to Modify

### Core changes:
- `components/AISuggestionsModal/services/realAISuggestionsService.ts` (new)
- `components/AISuggestionsModal/services/realAcceptService.ts` (new)
- `components/AISuggestionsModal/types.ts` (add backend types + metadata)
- `components/AISuggestionsModal/SuggestionCard.tsx` (confidence + metadata display)
- `components/AISuggestionsModal/index.tsx` (accept handler + service toggle)
- `components/AISuggestionsModal/services/acceptService.ts` (add service manager)

### Minor changes:
- `components/AISuggestionsModal/FallbackUI.tsx` (metadata adjustments)
- `components/AISuggestionsModal/hooks/useFormValidation.ts` (verify validation rules)
- `.env.development` (add REACT_APP_USE_REAL_API flag)
- `docs/AI suggestions/FRONTEND_INTEGRATION_CHECKLIST.md` (update status)

### NO changes needed:
- `components/AISuggestionsModal/ManualInputForm.tsx` (đã tiếng Anh, giữ nguyên)
- `components/AISuggestionsModal/services/mockAISuggestionsService.ts` (KHÔNG chỉnh)
- `src/features/tasks/TasksPage.tsx` (đã có refresh logic đúng)

---

## Success Criteria

- [ ] User có thể nhập manual input và nhận được suggested slots từ backend
- [ ] Confidence hiển thị đúng format 0.0-1.0 (không convert)
- [ ] Metadata adjustments (duration/deadline) hiển thị rõ ràng
- [ ] User có thể select một slot và accept
- [ ] Accept call đúng endpoint PATCH /api/ai-suggestions/{id}/status
- [ ] Accept tạo schedule entry thành công trong database
- [ ] TasksPage refresh và hiển thị schedule entry mới
- [ ] Rate limiting đọc đúng từ headers (Retry-After, X-RateLimit-Reset)
- [ ] Tất cả error scenarios được handle gracefully
- [ ] Transform tất cả items từ backend (không chỉ item đầu)
- [ ] No breaking changes to existing mock mode

---

## Key Differences from Initial Plan

1. **API endpoint**: PATCH .../status thay vì POST .../accept
2. **Response format**: schedule_entry_id trực tiếp, không có created_items[]
3. **Confidence scale**: Giữ 0.0-1.0, không convert sang 0-2
4. **Multiple items**: Transform tất cả items, không chỉ item đầu
5. **Service toggle**: Dùng serviceManager có sẵn, không chỉnh mock service
6. **Rate limit**: Đọc từ headers, không phải response body
7. **Language**: Form đã tiếng Anh, không cần translate


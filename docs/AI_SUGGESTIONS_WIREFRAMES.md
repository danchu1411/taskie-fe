# AI Suggestions Modal - Visual Wireframes

## Modal Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI SUGGESTIONS FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [User clicks "AI Sắp lịch" button]                            │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    MANUAL INPUT FORM                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ Title* (≤120 chars)                                     │ │ │
│  │  │ Description (≤500 chars)                               │ │ │
│  │  │ Duration* (15-180 min, 15min steps)                    │ │ │
│  │  │ Deadline* (ISO 8601)                                   │ │ │
│  │  │ Preferred Window (optional)                            │ │ │
│  │  │ Target Task (optional)                                 │ │ │
│  │  │ [🤖 Tạo gợi ý AI]                                      │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    LOADING STATE                            │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 🤖 AI đang phân tích lịch của bạn...                    │ │ │
│  │  │ ⏳ Đang tìm khung giờ phù hợp...                        │ │ │
│  │  │ • Phân tích lịch học hiện tại                          │ │ │
│  │  │ • Xem xét thói quen học tập                            │ │ │
│  │  │ • Tìm khung giờ tối ưu                                │ │ │
│  │  │ [❌ Hủy]                                               │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                SUGGESTIONS DISPLAY                         │ │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────┐ │ │
│  │  │ 📝 Bạn nhập         │  │ 🤖 AI đề xuất (3 gợi ý)        │ │ │
│  │  │ ┌─────────────────┐ │  │ ┌─────────────────────────────┐ │ │ │
│  │  │ │ Title: ...      │ │  │ │ 🟢 Gợi ý 1 (Tin cậy cao)    │ │ │ │
│  │  │ │ Description: ..│ │  │ │ 📅 05/03/2025 19:00          │ │ │ │
│  │  │ │ Duration: 60min │ │  │ │ ⏱️ 60 phút                   │ │ │ │
│  │  │ │ Deadline: ...   │ │  │ │ 🎯 Khung giờ phù hợp...      │ │ │ │
│  │  │ │ Preferred: ...  │ │  │ └─────────────────────────────┘ │ │ │
│  │  │ └─────────────────┘ │  │ ┌─────────────────────────────┐ │ │ │
│  │  └─────────────────────┘  │ │ 🟡 Gợi ý 2 (Tin cậy TB)     │ │ │ │
│  │                           │ │ 📅 05/03/2025 20:30          │ │ │ │
│  │                           │ │ ⏱️ 60 phút                   │ │ │ │
│  │                           │ │ 🎯 Gần deadline...           │ │ │ │
│  │                           │ └─────────────────────────────┘ │ │ │
│  │                           │ ┌─────────────────────────────┐ │ │ │
│  │                           │ │ 🔴 Gợi ý 3 (Tin cậy thấp)   │ │ │ │
│  │                           │ │ 📅 06/03/2025 09:00          │ │ │ │
│  │                           │ │ ⏱️ 60 phút                   │ │ │ │
│  │                           │ │ 🎯 Sáng sớm...               │ │ │ │
│  │                           │ └─────────────────────────────┘ │ │ │
│  │                           └─────────────────────────────────┘ │ │
│  │  [🔄 Tạo gợi ý mới]                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  SELECTION STATE                           │ │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────┐ │ │
│  │  │ 📝 Bạn nhập         │  │ 🤖 AI đề xuất                  │ │ │
│  │  │ [User input display]│  │ ✅ Gợi ý 1 (Đã chọn)           │ │ │
│  │  │                     │  │ 🔒 Gợi ý 2 (Đã khóa)           │ │ │
│  │  │                     │  │ 🔒 Gợi ý 3 (Đã khóa)           │ │ │
│  │  └─────────────────────┘  └─────────────────────────────────┘ │ │
│  │  [✅ Xác nhận tạo lịch]                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                CONFIRMATION STATE                          │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 🎉 Đã tạo lịch thành công!                             │ │ │
│  │  │ ✅ Ôn Toán chương 2                                    │ │ │
│  │  │ 📅 05/03/2025 19:00 - 20:00                           │ │ │
│  │  │ ⏱️ 60 phút                                             │ │ │
│  │  │ Lịch đã được thêm vào Schedule của bạn.                │ │ │
│  │  │ [📅 Mở Schedule] [🔄 Tạo lịch mới]                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    HISTORY SECTION                         │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 📚 Lịch sử gợi ý AI                                    │ │ │
│  │  │ 📅 Hôm nay                                             │ │ │
│  │  │ ┌─────────────────────────────────────────────────────┐ │ │ │
│  │  │ │ ✅ Ôn Toán chương 2                                 │ │ │ │
│  │  │ │ 📅 05/03/2025 19:00 - 20:00                        │ │ │ │
│  │  │ │ 🕐 14:30                                            │ │ │ │
│  │  │ │ [Xem lại] [Chấp nhận]                              │ │ │ │
│  │  │ └─────────────────────────────────────────────────────┘ │ │ │
│  │  │ ┌─────────────────────────────────────────────────────┐ │ │ │
│  │  │ │ ⏳ Làm bài tập Vật lý                               │ │ │ │
│  │  │ │ 📅 06/03/2025 15:00 - 16:30                        │ │ │ │
│  │  │ │ 🕐 10:15                                            │ │ │ │
│  │  │ │ [Xem lại] [Chấp nhận]                              │ │ │ │
│  │  │ └─────────────────────────────────────────────────────┘ │ │ │
│  │  │ [➕ Tạo gợi ý mới]                                    │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Error States & Fallbacks

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERROR STATES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    NO SUGGESTIONS                         │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 😔 Không tìm được khung giờ phù hợp                    │ │ │
│  │  │ 🤖 AI không thể tìm được khung giờ phù hợp vì:         │ │ │
│  │  │ • Lịch của bạn quá đầy trong khoảng thời gian yêu cầu  │ │ │
│  │  │ • Deadline quá gần so với thời lượng cần thiết         │ │ │
│  │  │ • Không có khung giờ trống phù hợp với thói quen học   │ │ │
│  │  │ [🔄 Chuyển về chế độ tự động]                          │ │ │
│  │  │ [✏️ Chỉnh lại thông tin]                               │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API ERRORS                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ ❌ Lỗi kết nối                                         │ │ │
│  │  │ Không thể kết nối đến AI service. Vui lòng thử lại.     │ │ │
│  │  │ [🔄 Thử lại] [❌ Đóng]                                 │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ ⏰ Rate limit exceeded                                  │ │ │
│  │  │ Bạn đã sử dụng hết lượt gợi ý hôm nay.                 │ │ │
│  │  │ Thử lại sau: 2 giờ 30 phút                             │ │ │
│  │  │ [⏰ Đặt nhắc nhở] [❌ Đóng]                            │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE DESIGN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DESKTOP (≥1024px)                    TABLET (768px-1023px)     │
│  ┌─────────────────────────────┐     ┌─────────────────────────┐ │
│  │ ┌─────────┐ ┌─────────────┐ │     │ ┌─────────────────────┐ │ │
│  │ │ Manual  │ │ Suggestions │ │     │ │ Manual Input        │ │ │
│  │ │ Input   │ │ Display     │ │     │ └─────────────────────┘ │ │
│  │ └─────────┘ └─────────────┘ │     │ ┌─────────────────────┐ │ │
│  │                             │     │ │ Suggestions Display │ │ │
│  │ Two-column layout           │     │ └─────────────────────┘ │ │
│  │ 800px width                 │     │ Stacked layout         │ │
│  │ 24px spacing                │     │ 90% width             │ │
│  └─────────────────────────────┘     │ 20px spacing          │ │
│                                      └─────────────────────────┘ │
│                                                                 │
│  MOBILE (<768px)                                               │
│  ┌─────────────────────────────┐                               │
│  │ ┌─────────────────────────┐ │                               │
│  │ │ Manual Input             │ │                               │
│  │ └─────────────────────────┘ │                               │
│  │ ┌─────────────────────────┐ │                               │
│  │ │ Suggestions Display     │ │                               │
│  │ └─────────────────────────┘ │                               │
│  │                             │                               │
│  │ Full screen modal          │                               │
│  │ Single column              │                               │
│  │ 48px touch targets         │                               │
│  └─────────────────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT STRUCTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AISuggestionsModal/                                            │
│  ├── index.tsx                    # Main modal container      │
│  ├── types.ts                     # TypeScript interfaces      │
│  ├── hooks/                       # Custom hooks               │
│  │   ├── useAISuggestions.ts      # API integration           │
│  │   ├── useFormValidation.ts     # Form validation logic     │
│  │   └── useModalState.ts         # Modal state management    │
│  ├── components/                  # UI components              │
│  │   ├── ManualInputForm.tsx      # User input form           │
│  │   ├── SuggestionsDisplay.tsx   # Comparison view          │
│  │   ├── SuggestionCard.tsx       # Individual suggestion     │
│  │   ├── HistorySection.tsx       # Past suggestions          │
│  │   ├── LoadingState.tsx         # AI processing state      │
│  │   ├── ConfirmationState.tsx    # Success confirmation      │
│  │   ├── FallbackUI.tsx           # No suggestions state      │
│  │   └── ErrorBoundary.tsx        # Error handling            │
│  ├── utils/                       # Utility functions          │
│  │   ├── validation.ts            # Form validation rules    │
│  │   ├── formatting.ts            # Date/time formatting     │
│  │   └── api.ts                   # API helper functions      │
│  └── styles/                      # Styling                   │
│      ├── AISuggestionsModal.css   # Main styles               │
│      ├── Form.css                 # Form-specific styles      │
│      ├── Suggestions.css          # Suggestions display       │
│      ├── History.css              # History section styles    │
│      └── Responsive.css           # Responsive breakpoints   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INITIAL STATE                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ {                                                           │ │
│  │   isOpen: false,                                           │ │
│  │   currentStep: 'form',                                     │ │
│  │   formData: {                                              │ │
│  │     title: '',                                             │ │
│  │     description: '',                                       │ │
│  │     duration_minutes: 60,                                  │ │
│  │     deadline: '',                                          │ │
│  │     preferred_window: null,                                │ │
│  │     target_task_id: null                                   │ │
│  │   },                                                       │ │
│  │   suggestions: [],                                         │ │
│  │   selectedSuggestion: null,                                │ │
│  │   isLoading: false,                                        │ │
│  │   error: null,                                             │ │
│  │   history: []                                              │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  FORM SUBMISSION                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ {                                                           │ │
│  │   isOpen: true,                                            │ │
│  │   currentStep: 'loading',                                  │ │
│  │   isLoading: true,                                         │ │
│  │   formData: { /* validated data */ }                      │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  SUGGESTIONS RECEIVED                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ {                                                           │ │
│  │   currentStep: 'suggestions',                               │ │
│  │   isLoading: false,                                        │ │
│  │   suggestions: [                                           │ │
│  │     {                                                       │ │
│  │       id: 'uuid',                                           │ │
│  │       suggested_start_at: '2025-03-05T19:00:00Z',          │ │
│  │       planned_minutes: 60,                                  │ │
│  │       confidence: 2,                                        │ │
│  │       reason: 'Khung giờ phù hợp...'                       │ │
│  │     }                                                       │ │
│  │   ]                                                         │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  SUGGESTION SELECTED                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ {                                                           │ │
│  │   currentStep: 'confirmation',                             │ │
│  │   selectedSuggestion: 0,                                  │ │
│  │   suggestions: [ /* locked suggestions */ ]                │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  CONFIRMATION COMPLETE                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ {                                                           │ │
│  │   currentStep: 'success',                                   │ │
│  │   history: [ /* updated with new entry */ ]                │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    API INTEGRATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/ai-suggestions/generate                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Request:                                                    │ │
│  │ {                                                           │ │
│  │   "suggestion_type": 0,                                     │ │
│  │   "context": {                                              │ │
│  │     "manual_input": {                                       │ │
│  │       "title": "Ôn Toán chương 2",                         │ │
│  │       "description": "Làm bài tập MA2",                    │ │
│  │       "duration_minutes": 60,                               │ │
│  │       "deadline": "2025-03-05T21:00:00Z",                  │ │
│  │       "preferred_window": [                                 │ │
│  │         "2025-03-05T18:00:00Z",                            │ │
│  │         "2025-03-05T21:00:00Z"                             │ │
│  │       ],                                                    │ │
│  │       "target_task_id": null                                │ │
│  │     }                                                       │ │
│  │   }                                                         │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Response:                                                   │ │
│  │ {                                                           │ │
│  │   "id": "suggestion_uuid",                                  │ │
│  │   "suggestion_type": 0,                                     │ │
│  │   "status": 0,                                              │ │
│  │   "confidence": 2,                                           │ │
│  │   "reason": "Khung giờ phù hợp với Night Owl...",          │ │
│  │   "manual_input": { /* original input */ },                │ │
│  │   "suggested_slots": [                                      │ │
│  │     {                                                       │ │
│  │       "slot_index": 0,                                      │ │
│  │       "suggested_start_at": "2025-03-05T19:00:00Z",        │ │
│  │       "planned_minutes": 60,                                │ │
│  │       "confidence": 2,                                      │ │
│  │       "reason": "Khung giờ phù hợp với Night Owl..."       │ │
│  │     },                                                      │ │
│  │     {                                                       │ │
│  │       "slot_index": 1,                                      │ │
│  │       "suggested_start_at": "2025-03-05T20:30:00Z",        │ │
│  │       "planned_minutes": 60,                                │ │
│  │       "confidence": 1,                                      │ │
│  │       "reason": "Gần deadline nhưng vẫn có thời gian"       │ │
│  │     },                                                      │ │
│  │     {                                                       │ │
│  │       "slot_index": 2,                                      │ │
│  │       "suggested_start_at": "2025-03-06T09:00:00Z",        │ │
│  │       "planned_minutes": 60,                                │ │
│  │       "confidence": 0,                                      │ │
│  │       "reason": "Sáng sớm, có thể không phù hợp"            │ │
│  │     }                                                       │ │
│  │   ],                                                        │ │
│  │   "fallback_auto_mode": {                                   │ │
│  │     "enabled": false,                                       │ │
│  │     "reason": "Tìm được khung giờ phù hợp"                  │ │
│  │   },                                                        │ │
│  │   "created_at": "2025-03-05T14:30:00Z",                    │ │
│  │   "updated_at": "2025-03-05T14:30:00Z"                     │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GET /api/ai-suggestions                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Response:                                                   │ │
│  │ {                                                           │ │
│  │   "suggestions": [                                          │ │
│  │     {                                                       │ │
│  │       "id": "uuid",                                         │ │
│  │       "status": 1,                                          │ │
│  │       "manual_input": { /* original input */ },            │ │
│  │       "suggested_slots": [ /* suggestions */ ],            │ │
│  │       "selected_slot_index": 0,                            │ │
│  │       "schedule_entry_id": "schedule_uuid",                │ │
│  │       "created_at": "2025-03-05T14:30:00Z"                 │ │
│  │     }                                                       │ │
│  │   ]                                                         │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  PATCH /api/ai-suggestions/:id/status                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Request:                                                    │ │
│  │ {                                                           │ │
│  │   "status": 1,                                              │ │
│  │   "selected_slot_index": 0,                                 │ │
│  │   "rejection_reason": null                                  │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Response:                                                   │ │
│  │ {                                                           │ │
│  │   "id": "suggestion_uuid",                                  │ │
│  │   "status": 1,                                              │ │
│  │   "selected_slot_index": 0,                                 │ │
│  │   "schedule_entry_id": "schedule_uuid",                     │ │
│  │   "message": "Schedule entry created successfully"          │ │
│  │ }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Confirmed Behavior

### API Response Format
- **Empty Suggestions**: Status 200 với `suggested_slots: []`, `confidence: 0.0`
- **Rate Limit**: 20 requests / 15 phút / user với headers X-RateLimit-*
- **Validation**: Backend reject duration_minutes không phải bội số 15 (400)
- **Cancel Support**: Chưa hỗ trợ abort request; FE bỏ qua response nếu user hủy

### Error Handling
- **400**: Validation error (duration_minutes invalid)
- **401**: Session expired
- **403**: Study profile required
- **404**: Suggestion not found
- **429**: Rate limit exceeded
- **503**: AI service busy

### Fallback Behavior
- **Empty slots**: Show fallback UI with "No available time slots" message
- **Auto mode**: Triggered when no manual_input provided
- **Deferred status**: Not implemented yet (future ticket)

## Additional Design Considerations

### Mini Calendar vs Card View Options

The wireframes above show a **card-based comparison view** ("Bạn nhập" vs "AI đề xuất") which is the primary design approach. However, there are alternative visualization options to consider:

#### Option 1: Card View (Current Design)
- **Pros**: Clear comparison, easy to scan, works well on all screen sizes
- **Cons**: Doesn't show temporal context of suggestions
- **Best for**: Users who want quick comparison and selection

#### Option 2: Mini Calendar Integration
- **Pros**: Shows suggestions in temporal context, familiar calendar interface
- **Cons**: More complex to implement, requires calendar component integration
- **Best for**: Users who want to see suggestions in context of their existing schedule

#### Option 3: Hybrid Approach
- **Pros**: Combines benefits of both approaches
- **Cons**: More complex UI, potential for confusion
- **Implementation**: Show mini calendar alongside card view, highlight suggested slots

### Implementation Recommendation

**Phase 1**: Implement the card-based design as shown in wireframes
- Faster to implement and test
- Clear user flow and interaction patterns
- Responsive design works well across devices

**Phase 2**: Consider adding mini calendar option
- User feedback will inform if temporal context is needed
- Can be added as an optional view toggle
- Requires integration with existing calendar components

### Terminology Consistency

To ensure consistency between requirements and wireframes documents:

- **`suggested_slots`**: Array of suggestion objects (not `items`)
- **`slot_index`**: Index of the selected slot (0-based)
- **`planned_minutes`**: Duration in minutes (not `estimated_minutes`)
- **`suggested_start_at`**: Start time in UTC ISO format
- **`confidence`**: Scale 0-2 (0=low, 1=medium, 2=high)
- **`selected_slot_index`**: Index of accepted slot for backend processing
- **`schedule_entry_id`**: ID of created schedule entry after acceptance
- **`fallback_auto_mode`**: Object indicating if auto mode should be suggested

### Validation Requirements

- **duration_minutes**: Must be multiple of 15 (15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180)
- **selected_slot_index**: Must be >=0 and exist in suggested_slots array
- **deadline**: ISO format with timezone offset (backend converts to UTC)
- **preferred_window**: Array format [startISO, endISO] or null/undefined

---

## Implementation Roadmap - AI Suggestions Modal

### Team Structure
- **Tech Lead AI**: Specification, architecture, code review, testing strategy
- **Developer AI**: Implementation, debugging, feature development

### Phase 0 – Finalize Specs (0.5-1 day)
**Owner**: Tech Lead AI  
**Goal**: Hoàn thiện specifications và chuẩn bị development environment

#### Deliverables:
- **Clean up encoding issues** (0.25 day)
  - Fix encoding characters (E → space, standardize emojis)
  - Ensure consistent UTF-8 encoding across all docs
  - **Files**: docs/AI_SUGGESTIONS_REQUIREMENTS.md, docs/AI_SUGGESTIONS_WIREFRAMES.md

- **Terminology synchronization** (0.25 day)
  - Cross-reference terminology between REQUIREMENTS & WIREFRAMES
  - Create implementation checklist
  - **Files**: Both specification documents

- **Development setup** (0.5 day)
  - Create component structure and file organization
  - Set up TypeScript interfaces and types
  - **Files**: `types/aiSuggestions.ts`, `components/AISuggestionsModal/`

---

### Phase 1 – Core Manual Flow (1-2 weeks)
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Implement core manual input flow with AI suggestions

#### Week 1: Foundation & Form

- **Modal structure & form implementation** (2-3 days)
  - Create AISuggestionsModal component structure
  - Implement ManualInputForm with validation
  - Add form state management and error handling
  - **Owner**: Developer AI
  - **Files**: 
    - `components/AISuggestionsModal/index.tsx`
    - `components/AISuggestionsModal/ManualInputForm.tsx`
    - `hooks/useFormValidation.ts`
  - **Deliverable**: Working form with validation

- **Mock API service** (1-2 days)
  - Create mock service for `/api/ai-suggestions/generate`
  - Implement realistic suggested_slots response
  - Add loading states and error simulation
  - **Owner**: Developer AI
  - **Files**: `services/mockAISuggestionsService.ts`
  - **Deliverable**: Mock API with test data

#### Week 2: Suggestions & Integration

- **Suggestion display & selection** (3-4 days)
  - Build SuggestionsDisplay component
  - Implement SuggestionCard with confidence indicators
  - Add slot selection and locking mechanism
  - **Owner**: Developer AI
  - **Files**: 
    - `components/AISuggestionsModal/SuggestionsDisplay.tsx`
    - `components/AISuggestionsModal/SuggestionCard.tsx`
  - **Deliverable**: Interactive suggestion selection

- **Accept flow & confirmation** (2-3 days)
  - Implement PATCH status integration
  - Create confirmation state with schedule_entry_id
  - Add empty slots fallback UI
  - **Owner**: Developer AI
  - **Files**: 
    - `components/AISuggestionsModal/ConfirmationState.tsx`
    - `components/AISuggestionsModal/FallbackUI.tsx`
  - **Deliverable**: Complete accept flow

#### Tech Lead AI Tasks:
- **Code review** (ongoing)
  - Review each component implementation
  - Ensure adherence to design specifications
  - Validate TypeScript types and interfaces

- **Testing strategy** (1 day)
  - Create test cases for validation scenarios
  - Define error handling test cases
  - **Files**: `__tests__/AISuggestionsModal.test.tsx`

---

### Phase 2 – History & Tracking (0.5-1 week)
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Implement suggestion history and basic analytics

#### Frontend Implementation:

- **History section** (2-3 days)
  - Implement GET `/api/ai-suggestions` integration
  - Build HistorySection component
  - Add reopening flow for pending suggestions
  - **Owner**: Developer AI
  - **Files**: `components/AISuggestionsModal/HistorySection.tsx`
  - **Deliverable**: Complete history management

- **Analytics tracking** (1 day)
  - Add basic usage analytics
  - Track suggestion acceptance rates
  - **Owner**: Developer AI
  - **Files**: `utils/analytics.ts`
  - **Deliverable**: Analytics implementation

#### Tech Lead AI Tasks:
- **Integration testing** (1 day)
  - Test history flow end-to-end
  - Verify analytics data collection
  - **Deliverable**: Test results and recommendations

---

### Phase 3 – Enhanced Visualization (Optional) (0.5-1 week)
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Add advanced features and polish

#### Optional Enhancements:

- **Mini calendar integration** (2-3 days)
  - Add calendar view toggle
  - Sync calendar selection with cards
  - **Owner**: Developer AI
  - **Files**: `components/AISuggestionsModal/MiniCalendar.tsx`
  - **Deliverable**: Calendar visualization option

- **UI polish & micro-interactions** (1-2 days)
  - Enhance confidence indicators
  - Add tooltips and animations
  - **Owner**: Developer AI
  - **Files**: Various component updates
  - **Deliverable**: Polished UI

#### Tech Lead AI Tasks:
- **Performance optimization** (1 day)
  - Review component performance
  - Optimize rendering and state management
  - **Deliverable**: Performance recommendations

---

## Development Workflow

### Daily Process:
1. **Developer AI**: Implement features according to specifications
2. **Tech Lead AI**: Review code, provide feedback, update specs if needed
3. **Collaboration**: Discuss complex implementation decisions

### Quality Assurance:
- **Code Review**: Tech Lead AI reviews all implementations
- **Testing**: Both agents collaborate on test case creation
- **Documentation**: Tech Lead AI maintains implementation docs

### Risk Mitigation:
- **Specification Changes**: Tech Lead AI manages scope changes
- **Technical Debt**: Regular refactoring sessions
- **Performance**: Monitor and optimize as needed

## Success Metrics

### Phase 1:
- Modal loads in <2 seconds
- Form validation works correctly
- Suggestion selection flow is intuitive
- All error scenarios handled properly

### Phase 2:
- History loads in <1 second
- Analytics data collected accurately
- Users can manage previous suggestions

### Phase 3:
- Calendar view works smoothly
- UI feels polished and responsive
- All features work together seamlessly

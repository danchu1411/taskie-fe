# Phase 1 – Core Manual Flow - Detailed Plan

## Overview
**Duration**: 1-2 weeks  
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Implement core manual input flow with AI suggestions

---

## Week 1: Foundation & Form

### Day 1-2: Modal Structure & Form Implementation

#### Task 1.1: Create Modal Container (Day 1 morning)
**Time**: 0.5 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `components/AISuggestionsModal/index.tsx`
- [ ] Set up basic modal structure with React Portal
- [ ] Implement modal open/close functionality
- [ ] Add backdrop and escape key handling
- [ ] Set up responsive modal sizing

##### Implementation Details:
```typescript
// components/AISuggestionsModal/index.tsx
interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (scheduleEntryId: string) => void;
}

const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Modal implementation
};
```

##### Deliverable:
- Working modal container with open/close functionality
- Responsive design (desktop: 800px, tablet: 90%, mobile: full screen)

#### Task 1.2: Form Component Implementation (Day 1 afternoon - Day 2)
**Time**: 1.5 days  
**Owner**: Developer AI

##### Actions:
- [ ] Create `components/AISuggestionsModal/ManualInputForm.tsx`
- [ ] Implement form fields with validation
- [ ] Add character counters for title/description
- [ ] Create duration dropdown (15-minute increments)
- [ ] Implement deadline picker with ISO format
- [ ] Add optional preferred window picker
- [ ] Add optional target task search

##### Form Fields:
```typescript
interface ManualInput {
  title: string;                    // ≤120 chars, required
  description?: string;             // ≤500 chars, optional
  duration_minutes: number;        // 15-180, multiple of 15
  deadline: string;                 // ISO 8601, required
  preferred_window?: [string, string]; // Optional [startISO, endISO]
  target_task_id?: string;         // Optional
}
```

##### Validation Rules:
- **Title**: Required, max 120 characters
- **Description**: Optional, max 500 characters
- **Duration**: Required, must be multiple of 15 (15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180)
- **Deadline**: Required, must be future date, ISO format with timezone
- **Preferred Window**: Optional, start must be before end

##### Deliverable:
- Complete form with all fields and validation
- Real-time validation feedback
- Character counters and error messages

#### Task 1.3: Form State Management (Day 2 afternoon)
**Time**: 0.5 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `hooks/useFormValidation.ts`
- [ ] Implement form state management
- [ ] Add validation logic
- [ ] Handle form submission
- [ ] Add loading states

##### Hook Implementation:
```typescript
// hooks/useFormValidation.ts
interface UseFormValidationReturn {
  formData: ManualInput;
  errors: FormErrors;
  isValid: boolean;
  updateField: (field: keyof ManualInput, value: any) => void;
  validateForm: () => boolean;
  submitForm: () => Promise<void>;
}
```

##### Deliverable:
- Form validation hook
- State management for form data
- Validation logic for all fields

---

### Day 3-4: Mock API Service & Integration

#### Task 1.4: Mock API Implementation (Day 3)
**Time**: 1 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `services/mockAISuggestionsService.ts`
- [ ] Implement POST `/api/ai-suggestions/generate` mock
- [ ] Create realistic suggested_slots response
- [ ] Add loading simulation (2-3 seconds)
- [ ] Add error simulation for testing

##### Mock Response Structure:
```typescript
interface MockAISuggestionResponse {
  id: string;
  suggestion_type: 0;
  status: 0;
  confidence: number;
  reason: string;
  manual_input: ManualInput;
  suggested_slots: SuggestedSlot[];
  fallback_auto_mode: {
    enabled: boolean;
    reason: string;
  };
  created_at: string;
  updated_at: string;
}
```

##### Mock Data Examples:
- **High confidence**: Evening slots matching user's chronotype
- **Medium confidence**: Morning slots with some concerns
- **Low confidence**: Early morning slots with warnings
- **Empty slots**: When no suitable time found

##### Deliverable:
- Mock API service with realistic data
- Loading and error simulation
- Test data for different scenarios

#### Task 1.5: API Integration Hook (Day 4)
**Time**: 1 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `hooks/useAISuggestions.ts`
- [ ] Implement API integration with mock service
- [ ] Add loading states
- [ ] Handle error scenarios
- [ ] Add retry logic
- [ ] **Design for easy backend switch**: Use service abstraction pattern

##### Hook Implementation:
```typescript
// hooks/useAISuggestions.ts
interface UseAISuggestionsReturn {
  generateSuggestions: (input: ManualInput) => Promise<AISuggestion>;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

// Service abstraction for easy backend switch
interface AISuggestionsService {
  generateSuggestions(input: ManualInput): Promise<AISuggestion>;
}
```

##### Deliverable:
- API integration hook with service abstraction
- Error handling and retry logic
- Loading state management
- **Ready for backend integration**: Service layer designed for easy switch

---

## Week 2: Suggestions & Integration

### Day 5-7: Suggestion Display & Selection

#### Task 1.6: Suggestions Display Component (Day 5-6)
**Time**: 2 days  
**Owner**: Developer AI

##### Actions:
- [ ] Create `components/AISuggestionsModal/SuggestionsDisplay.tsx`
- [ ] Implement two-column layout (Manual Input vs AI Suggestions)
- [ ] Add responsive design for tablet/mobile
- [ ] Implement suggestion cards
- [ ] Add confidence indicators with colors

##### Layout Structure:
```
┌─────────────────────┐  ┌─────────────────────────────────┐
│ 📝 Bạn nhập         │  │ 🤖 AI đề xuất (3 gợi ý)        │
│ ┌─────────────────┐ │  │ ┌─────────────────────────────┐ │
│ │ Title: ...      │ │  │ │ 🟢 Gợi ý 1 (Tin cậy cao)    │ │
│ │ Description: ..│ │  │ │ 📅 05/03/2025 19:00          │ │
│ │ Duration: 60min │ │  │ │ ⏱️ 60 phút                   │ │
│ │ Deadline: ...   │ │  │ │ 🎯 Khung giờ phù hợp...      │ │
│ │ Preferred: ...  │ │  │ └─────────────────────────────┘ │
│ └─────────────────┘ │  │ ┌─────────────────────────────┐ │
└─────────────────────┘  │ │ 🟡 Gợi ý 2 (Tin cậy TB)     │ │
                         │ │ 📅 05/03/2025 20:30          │ │
                         │ │ ⏱️ 60 phút                   │ │
                         │ │ 🎯 Gần deadline...           │ │
                         │ └─────────────────────────────┘ │
                         │ ┌─────────────────────────────┐ │
                         │ │ 🔴 Gợi ý 3 (Tin cậy thấp)   │ │
                         │ │ 📅 06/03/2025 09:00          │ │
                         │ │ ⏱️ 60 phút                   │ │
                         │ │ 🎯 Sáng sớm...               │ │
                         │ └─────────────────────────────┘ │
                         └─────────────────────────────────┘
```

##### Deliverable:
- Two-column comparison layout
- Responsive design for all screen sizes
- Visual confidence indicators

#### Task 1.7: Suggestion Card Component (Day 6-7)
**Time**: 1.5 days  
**Owner**: Developer AI

##### Actions:
- [ ] Create `components/AISuggestionsModal/SuggestionCard.tsx`
- [ ] Implement individual suggestion cards
- [ ] Add hover effects and selection states
- [ ] Implement slot locking mechanism
- [ ] Add confidence color coding

##### Card States:
- **Default**: Normal appearance
- **Hover**: Subtle lift and shadow
- **Selected**: Green border, checkmark icon
- **Locked**: Grayed out, lock icon

##### Confidence Colors:
- **High (2)**: Green border (`#10B981`)
- **Medium (1)**: Yellow border (`#F59E0B`)
- **Low (0)**: Red border (`#EF4444`)

##### Deliverable:
- Interactive suggestion cards
- Selection and locking mechanism
- Visual feedback for all states

#### Task 1.8: Modal State Management (Day 7 afternoon)
**Time**: 0.5 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `hooks/useModalState.ts`
- [ ] Implement modal state transitions
- [ ] Handle step navigation
- [ ] Manage selected suggestion state

##### State Transitions:
```
form → loading → suggestions → confirmation → success
  ↓       ↓         ↓            ↓          ↓
  ↓       ↓         ↓            ↓          ↓
  ↓       ↓         ↓            ↓          ↓
  ↓       ↓         ↓            ↓          ↓
  ↓       ↓         ↓            ↓          ↓
```

##### Deliverable:
- Modal state management hook
- Step navigation logic
- State persistence

---

### Day 8-9: Accept Flow & Confirmation

#### Task 1.9: Accept Flow Implementation (Day 8)
**Time**: 1 day  
**Owner**: Developer AI

##### Actions:
- [ ] Implement PATCH `/api/ai-suggestions/:id/status` integration
- [ ] Create accept flow with selected_slot_index
- [ ] Add loading states during acceptance
- [ ] Handle success/error responses
- [ ] Update modal state after acceptance

##### API Integration:
```typescript
// PATCH /api/ai-suggestions/:id/status
interface AcceptRequest {
  status: 1;
  selected_slot_index: number;
  rejection_reason?: string;
}

interface AcceptResponse {
  id: string;
  status: number;
  selected_slot_index: number;
  schedule_entry_id: string;
  message: string;
}
```

##### Deliverable:
- Complete accept flow
- API integration with PATCH endpoint
- Success/error handling

#### Task 1.10: Confirmation State (Day 9)
**Time**: 1 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `components/AISuggestionsModal/ConfirmationState.tsx`
- [ ] Implement success confirmation UI
- [ ] Display created schedule entry details
- [ ] Add action buttons (Open Schedule, Create New)
- [ ] Implement auto-close after 3 seconds

##### Confirmation UI:
```
┌─────────────────────────────────────────────────────────┐
│ 🎉 Đã tạo lịch thành công!                             │
│ ✅ Ôn Toán chương 2                                    │
│ 📅 05/03/2025 19:00 - 20:00                           │
│ ⏱️ 60 phút                                             │
│ Lịch đã được thêm vào Schedule của bạn.                │
│ [📅 Mở Schedule] [🔄 Tạo lịch mới]                     │
└─────────────────────────────────────────────────────────┘
```

##### Deliverable:
- Success confirmation UI
- Schedule entry display
- Action buttons and navigation

### Day 10: Fallback UI & Buffer

#### Task 1.11: Fallback UI (Day 10 morning)
**Time**: 0.5 day  
**Owner**: Developer AI

##### Actions:
- [ ] Create `components/AISuggestionsModal/FallbackUI.tsx`
- [ ] Implement empty suggestions UI
- [ ] Add fallback message and suggestions
- [ ] Add action buttons (Switch to Auto Mode, Edit Input)

##### Fallback UI:
```
┌─────────────────────────────────────────────────────────┐
│ 😔 Không tìm được khung giờ phù hợp                    │
│ 🤖 AI không thể tìm được khung giờ phù hợp vì:         │
│ • Lịch của bạn quá đầy trong khoảng thời gian yêu cầu  │
│ • Deadline quá gần so với thời lượng cần thiết         │
│ • Không có khung giờ trống phù hợp với thói quen học   │
│ [🔄 Chuyển về chế độ tự động]                          │
│ [✏️ Chỉnh lại thông tin]                               │
└─────────────────────────────────────────────────────────┘
```

##### Deliverable:
- Fallback UI for empty suggestions
- Helpful error messages
- Alternative action options

#### Task 1.12: Buffer & Polish (Day 10 afternoon)
**Time**: 0.5 day  
**Owner**: Developer AI

##### Actions:
- [ ] **Buffer time**: Handle any unexpected issues
- [ ] **Toolchain setup**: Ensure build/test pipeline works
- [ ] **Code review**: Self-review and cleanup
- [ ] **Documentation**: Add component comments
- [ ] **Testing**: Manual testing of core flows

##### Deliverable:
- Polished implementation
- Working build/test pipeline
- Core flows tested manually

---

## Tech Lead AI Tasks (Ongoing)

### Code Review (Daily)
- [ ] Review each component implementation
- [ ] Ensure adherence to design specifications
- [ ] Validate TypeScript types and interfaces
- [ ] Check responsive design implementation
- [ ] Verify accessibility compliance

### Testing Strategy (Day 5)
- [ ] Create test cases for validation scenarios
- [ ] Define error handling test cases
- [ ] Set up component testing framework
- [ ] Create integration test scenarios

### Performance Review (Day 10)
- [ ] Review component performance
- [ ] Check for memory leaks
- [ ] Optimize rendering performance
- [ ] Validate loading states

---

## Quality Checklist

### Week 1 Completion:
- [ ] Modal container working with open/close
- [ ] Form component with all fields and validation
- [ ] Form state management hook
- [ ] Mock API service with realistic data
- [ ] API integration hook with service abstraction

### Week 2 Completion:
- [ ] Suggestions display with two-column layout
- [ ] Suggestion cards with selection mechanism
- [ ] Modal state management
- [ ] Accept flow with API integration
- [ ] Confirmation state UI
- [ ] Fallback UI for empty suggestions
- [ ] Buffer time for toolchain and testing

### Overall Phase 1 Completion:
- [ ] **Core flow works**: Form → Suggestions → Selection → Accept → Confirmation
- [ ] **Error handling**: All error scenarios covered
- [ ] **Service abstraction**: Ready for backend integration
- [ ] **Manual testing**: Core flows tested manually
- [ ] **Code quality**: TypeScript best practices followed

---

## Risk Mitigation

### Technical Risks:
- **API Integration**: Use mock service first, then integrate with real API
- **State Management**: Keep state simple, avoid over-engineering
- **Performance**: Monitor component re-renders, use React.memo where needed
- **Responsive Design**: Test on actual devices, not just browser dev tools

### Timeline Risks:
- **Scope Creep**: Stick to core functionality, defer enhancements to Phase 2
- **Complexity**: Start with basic implementation, add polish later
- **Dependencies**: Mock API first to avoid backend dependencies

---

## Success Metrics

### Functional Requirements (Priority 1):
- [ ] Modal opens and closes properly
- [ ] Form validation prevents invalid submissions
- [ ] Suggestions display with correct confidence indicators
- [ ] Selection mechanism works intuitively
- [ ] Accept flow creates schedule entry successfully
- [ ] Error states display helpful messages

### UX Requirements (Priority 2):
- [ ] Form is easy to fill out
- [ ] Suggestions are easy to compare
- [ ] Selection process is clear
- [ ] Success state provides clear next steps
- [ ] Error states offer helpful alternatives

### Performance Requirements (Priority 3 - Measure Later):
- [ ] Modal opens in <2 seconds (measure after backend integration)
- [ ] Form validation responds in <100ms
- [ ] Suggestions load in <3 seconds (measure with real API)
- [ ] Accept flow completes in <2 seconds (measure with real API)

---

## Deliverables Summary

### Components:
1. `components/AISuggestionsModal/index.tsx` - Main modal container
2. `components/AISuggestionsModal/ManualInputForm.tsx` - Form component
3. `components/AISuggestionsModal/SuggestionsDisplay.tsx` - Suggestions layout
4. `components/AISuggestionsModal/SuggestionCard.tsx` - Individual suggestion
5. `components/AISuggestionsModal/ConfirmationState.tsx` - Success confirmation
6. `components/AISuggestionsModal/FallbackUI.tsx` - Empty suggestions fallback

### Hooks:
1. `hooks/useFormValidation.ts` - Form validation logic
2. `hooks/useAISuggestions.ts` - API integration
3. `hooks/useModalState.ts` - Modal state management

### Services:
1. `services/mockAISuggestionsService.ts` - Mock API service

### Styles:
1. `styles/AISuggestionsModal.css` - Main modal styles
2. `styles/Form.css` - Form-specific styles
3. `styles/Suggestions.css` - Suggestions display styles
4. `styles/Responsive.css` - Responsive breakpoints

---

*Created: [Current Date]*  
*Owner: Developer AI*  
*Status: Ready for Execution*

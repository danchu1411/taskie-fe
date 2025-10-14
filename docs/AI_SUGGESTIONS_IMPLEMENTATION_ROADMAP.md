# AI Suggestions Modal - Implementation Roadmap

## Team Structure
- **Tech Lead AI**: Specification, architecture, code review, testing strategy
- **Developer AI**: Implementation, debugging, feature development

---

## Phase 0 – Finalize Specs (0.5-1 day)
**Owner**: Tech Lead AI  
**Goal**: Hoàn thiện specifications và chuẩn bị development environment

### Deliverables:

#### Clean up encoding issues (0.25 day)
- Fix encoding characters (E → space, standardize emojis)
- Ensure consistent UTF-8 encoding across all docs
- **Files**: 
  - `docs/AI_SUGGESTIONS_REQUIREMENTS.md`
  - `docs/AI_SUGGESTIONS_WIREFRAMES.md`

#### Terminology synchronization (0.25 day)
- Cross-reference terminology between REQUIREMENTS & WIREFRAMES
- Create implementation checklist
- **Files**: Both specification documents

#### Development setup (0.5 day)
- Create component structure and file organization
- Set up TypeScript interfaces and types
- **Files**: 
  - `types/aiSuggestions.ts`
  - `components/AISuggestionsModal/`

---

## Phase 1 – Core Manual Flow (1-2 weeks)
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Implement core manual input flow with AI suggestions

### Week 1: Foundation & Form

#### Modal structure & form implementation (2-3 days)
- Create AISuggestionsModal component structure
- Implement ManualInputForm with validation
- Add form state management and error handling
- **Owner**: Developer AI
- **Files**: 
  - `components/AISuggestionsModal/index.tsx`
  - `components/AISuggestionsModal/ManualInputForm.tsx`
  - `hooks/useFormValidation.ts`
- **Deliverable**: Working form with validation

#### Mock API service (1-2 days)
- Create mock service for `/api/ai-suggestions/generate`
- Implement realistic suggested_slots response
- Add loading states and error simulation
- **Owner**: Developer AI
- **Files**: `services/mockAISuggestionsService.ts`
- **Deliverable**: Mock API with test data

### Week 2: Suggestions & Integration

#### Suggestion display & selection (3-4 days)
- Build SuggestionsDisplay component
- Implement SuggestionCard with confidence indicators
- Add slot selection and locking mechanism
- **Owner**: Developer AI
- **Files**: 
  - `components/AISuggestionsModal/SuggestionsDisplay.tsx`
  - `components/AISuggestionsModal/SuggestionCard.tsx`
- **Deliverable**: Interactive suggestion selection

#### Accept flow & confirmation (2-3 days)
- Implement PATCH status integration
- Create confirmation state with schedule_entry_id
- Add empty slots fallback UI
- **Owner**: Developer AI
- **Files**: 
  - `components/AISuggestionsModal/ConfirmationState.tsx`
  - `components/AISuggestionsModal/FallbackUI.tsx`
- **Deliverable**: Complete accept flow

### Tech Lead AI Tasks:

#### Code review (ongoing)
- Review each component implementation
- Ensure adherence to design specifications
- Validate TypeScript types and interfaces

#### Testing strategy (1 day)
- Create test cases for validation scenarios
- Define error handling test cases
- **Files**: `__tests__/AISuggestionsModal.test.tsx`

---

## Phase 2 – History & Tracking (0.5-1 week)
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Implement suggestion history and basic analytics

### Frontend Implementation:

#### History section (2-3 days)
- Implement GET `/api/ai-suggestions` integration
- Build HistorySection component
- Add reopening flow for pending suggestions
- **Owner**: Developer AI
- **Files**: `components/AISuggestionsModal/HistorySection.tsx`
- **Deliverable**: Complete history management

#### Analytics tracking (1 day)
- Add basic usage analytics
- Track suggestion acceptance rates
- **Owner**: Developer AI
- **Files**: `utils/analytics.ts`
- **Deliverable**: Analytics implementation

### Tech Lead AI Tasks:

#### Integration testing (1 day)
- Test history flow end-to-end
- Verify analytics data collection
- **Deliverable**: Test results and recommendations

---

## Phase 3 – Enhanced Visualization (Optional) (0.5-1 week)
**Owner**: Developer AI (with Tech Lead AI review)  
**Goal**: Add advanced features and polish

### Optional Enhancements:

#### Mini calendar integration (2-3 days)
- Add calendar view toggle
- Sync calendar selection with cards
- **Owner**: Developer AI
- **Files**: `components/AISuggestionsModal/MiniCalendar.tsx`
- **Deliverable**: Calendar visualization option

#### UI polish & micro-interactions (1-2 days)
- Enhance confidence indicators
- Add tooltips and animations
- **Owner**: Developer AI
- **Files**: Various component updates
- **Deliverable**: Polished UI

### Tech Lead AI Tasks:

#### Performance optimization (1 day)
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

---

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

---

## Technical Requirements

### Validation Requirements:
- **duration_minutes**: Must be multiple of 15 (15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180)
- **selected_slot_index**: Must be >=0 and exist in suggested_slots array
- **deadline**: ISO format with timezone offset (backend converts to UTC)
- **preferred_window**: Array format [startISO, endISO] or null/undefined

### API Endpoints:
- **POST** `/api/ai-suggestions/generate` - Generate suggestions
- **GET** `/api/ai-suggestions` - Get history
- **PATCH** `/api/ai-suggestions/:id/status` - Accept/reject suggestion

### Error Handling:
- **400**: Validation error (duration_minutes invalid)
- **401**: Session expired
- **403**: Study profile required
- **404**: Suggestion not found
- **429**: Rate limit exceeded
- **503**: AI service busy

### Rate Limiting:
- **Limit**: 20 requests / 15 phút / user
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After

---

## Component Architecture

```
components/AISuggestionsModal/
├── index.tsx                    # Main modal container
├── ManualInputForm.tsx          # User input form
├── SuggestionsDisplay.tsx       # Comparison view
├── SuggestionCard.tsx          # Individual suggestion
├── HistorySection.tsx           # Past suggestions
├── LoadingState.tsx             # AI processing state
├── ConfirmationState.tsx        # Success confirmation
├── FallbackUI.tsx               # No suggestions state
└── styles/
    ├── AISuggestionsModal.css   # Main styles
    ├── Form.css                 # Form-specific styles
    ├── Suggestions.css          # Suggestions display styles
    └── Responsive.css           # Responsive breakpoints
```

---

## Dependencies

### Required Packages:
- React 18+
- TypeScript 4.9+
- CSS Modules or Styled Components
- Date manipulation library (date-fns or dayjs)
- HTTP client (axios or fetch)

### Optional Packages:
- React Hook Form (for form management)
- React Query (for API state management)
- Framer Motion (for animations)

---

## Testing Strategy

### Unit Tests:
- Component rendering
- Form validation logic
- State management
- Error handling

### Integration Tests:
- API integration
- User flow completion
- Error scenarios

### E2E Tests:
- Complete user journey
- Cross-browser compatibility
- Mobile responsiveness

---

## Deployment Checklist

### Pre-deployment:
- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Accessibility compliance
- [ ] Cross-browser testing

### Post-deployment:
- [ ] Monitor error rates
- [ ] Track user engagement
- [ ] Performance monitoring
- [ ] User feedback collection

---

*Last updated: [Current Date]*
*Version: 1.0*
*Status: Ready for Implementation*

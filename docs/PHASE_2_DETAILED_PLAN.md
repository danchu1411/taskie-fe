# 📋 **PHASE 2 DETAILED PLAN**
**History & Tracking - Implementation Plan**

---

## 🎯 **Phase Overview**

**Phase**: History & Tracking  
**Duration**: 0.5-1 week  
**Owner**: Developer AI  
**Goal**: Implement suggestion history and basic analytics

---

## 📊 **Phase 2 Tasks**

### **Task 2.1: History API Integration (Day 1)**
**Time**: 0.5 day  
**Owner**: Developer AI

#### Actions:
- [ ] Create `services/historyService.ts`
- [ ] Implement GET `/api/ai-suggestions` integration
- [ ] Add history data types and interfaces
- [ ] Create mock history service for development
- [ ] Add error handling for history API

#### API Integration:
```typescript
// GET /api/ai-suggestions
interface HistoryRequest {
  page?: number;
  limit?: number;
  status?: number; // 0: pending, 1: accepted, 2: rejected
  date_from?: string;
  date_to?: string;
}

interface HistoryResponse {
  suggestions: AISuggestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### Deliverable:
- History API service
- Mock history service
- Error handling

---

### **Task 2.2: HistorySection Component (Day 1-2)**
**Time**: 1 day  
**Owner**: Developer AI

#### Actions:
- [ ] Create `components/AISuggestionsModal/HistorySection.tsx`
- [ ] Implement history list display
- [ ] Add suggestion status indicators
- [ ] Implement reopening flow for pending suggestions
- [ ] Add pagination controls
- [ ] Add filtering options

#### History UI:
```
┌─────────────────────────────────────────────────────────┐
│ 📚 Lịch sử gợi ý                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✅ Ôn Toán chương 2                   05/03/2025    │ │
│ │ 📅 19:00 - 20:00 | ⏱️ 60 phút | 🟢 Đã chấp nhận   │ │
│ │ [👁️ Xem] [🔄 Tạo lại]                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⏳ Làm bài tập Vật lý                06/03/2025    │ │
│ │ 📅 20:00 - 21:00 | ⏱️ 60 phút | 🟡 Đang chờ      │ │
│ │ [👁️ Xem] [✅ Chấp nhận] [❌ Từ chối]              │ │
│ └─────────────────────────────────────────────────────┘ │
│ [← Trang trước] [1] [2] [3] [Trang sau →]             │
└─────────────────────────────────────────────────────────┘
```

#### Deliverable:
- Complete history section component
- Reopening flow
- Pagination and filtering

---

### **Task 2.3: History Integration (Day 2)**
**Time**: 0.5 day  
**Owner**: Developer AI

#### Actions:
- [ ] Integrate HistorySection into main modal
- [ ] Add history tab/section toggle
- [ ] Implement history state management
- [ ] Add history loading states
- [ ] Handle history errors

#### Integration Points:
- Modal state management
- History tab navigation
- Loading states
- Error handling

#### Deliverable:
- History integrated into modal
- Complete history flow

---

### **Task 2.4: Analytics Tracking (Day 3)**
**Time**: 0.5 day  
**Owner**: Developer AI

#### Actions:
- [ ] Create `utils/analytics.ts`
- [ ] Implement basic usage analytics
- [ ] Track suggestion acceptance rates
- [ ] Add user interaction tracking
- [ ] Create analytics dashboard (basic)

#### Analytics Events:
```typescript
interface AnalyticsEvent {
  event: string;
  properties: {
    suggestion_id?: string;
    status?: number;
    duration_minutes?: number;
    confidence?: number;
    timestamp: string;
  };
}

// Events to track:
// - suggestion_generated
// - suggestion_accepted
// - suggestion_rejected
// - suggestion_reopened
// - history_viewed
// - filter_applied
```

#### Deliverable:
- Analytics implementation
- Event tracking
- Basic dashboard

---

### **Task 2.5: Testing & Polish (Day 3)**
**Time**: 0.5 day  
**Owner**: Developer AI

#### Actions:
- [ ] Create comprehensive tests for history
- [ ] Test history API integration
- [ ] Test reopening flow
- [ ] Test analytics tracking
- [ ] Polish UI/UX
- [ ] Performance optimization

#### Testing Coverage:
- History API integration
- HistorySection component
- Reopening flow
- Analytics tracking
- Error handling

#### Deliverable:
- Complete test coverage
- Polished implementation

---

## 🏗️ **Technical Implementation**

### **History Service Architecture**
```typescript
export interface HistoryService {
  getHistory(request: HistoryRequest): Promise<HistoryResponse>;
  getSuggestionById(id: string): Promise<AISuggestion>;
  reopenSuggestion(id: string): Promise<AISuggestion>;
}

export class MockHistoryService implements HistoryService {
  // Mock implementation for development
}

export class RealHistoryService implements HistoryService {
  // Production implementation
}
```

### **History State Management**
```typescript
interface HistoryState {
  suggestions: AISuggestion[];
  pagination: PaginationInfo;
  filters: HistoryFilters;
  isLoading: boolean;
  error: string | null;
}

interface HistoryFilters {
  status?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
```

### **Analytics Implementation**
```typescript
interface AnalyticsService {
  track(event: string, properties: any): void;
  getMetrics(): Promise<AnalyticsMetrics>;
}

interface AnalyticsMetrics {
  totalSuggestions: number;
  acceptanceRate: number;
  averageConfidence: number;
  popularTimeSlots: TimeSlot[];
}
```

---

## 🎨 **UI/UX Features**

### **History Section Features**
- **Suggestion List**: Chronological list of suggestions
- **Status Indicators**: Visual status indicators (accepted, pending, rejected)
- **Quick Actions**: View, reopen, accept, reject actions
- **Pagination**: Navigate through history pages
- **Filtering**: Filter by status, date range, search
- **Responsive Design**: Mobile-friendly layout

### **Reopening Flow**
- **Pending Suggestions**: Can be accepted or rejected
- **Accepted Suggestions**: Can be viewed or recreated
- **Rejected Suggestions**: Can be viewed or recreated
- **Status Updates**: Real-time status updates

### **Analytics Dashboard**
- **Usage Statistics**: Total suggestions, acceptance rate
- **Performance Metrics**: Average confidence, popular time slots
- **User Insights**: Usage patterns and preferences

---

## 📈 **Success Metrics**

### **Performance Metrics**
- **History Load Time**: <1 second
- **Reopening Response**: <500ms
- **Analytics Accuracy**: 100% event tracking
- **User Engagement**: Increased usage of history

### **Quality Metrics**
- **Test Coverage**: 100% for history features
- **Error Handling**: Comprehensive error management
- **User Experience**: Intuitive history management
- **Performance**: Optimized for production use

---

## 🔗 **Integration Points**

### **Phase 1 Integration**
- **Modal State**: Extend modal state for history
- **API Services**: Integrate with existing API services
- **Component Architecture**: Extend existing component structure
- **Testing**: Extend existing test infrastructure

### **Future Phase Integration**
- **Phase 3**: Enhanced visualization with history
- **Analytics**: Extended analytics and reporting
- **Performance**: Performance monitoring and optimization

---

## 📋 **Deliverables Summary**

### **Files Created**
- `services/historyService.ts` - History API service
- `components/AISuggestionsModal/HistorySection.tsx` - History component
- `utils/analytics.ts` - Analytics service
- `styles/HistorySection.css` - History styles
- Test files for all components

### **Features Implemented**
- Complete history management
- Suggestion reopening flow
- Basic analytics tracking
- History filtering and pagination
- Comprehensive testing

### **Quality Assurance**
- 100% test coverage
- Performance optimization
- Error handling
- User experience polish

---

## 🚀 **Next Steps**

### **Phase 2 Completion**
1. ✅ **Task 2.1**: History API Integration
2. ✅ **Task 2.2**: HistorySection Component
3. ✅ **Task 2.3**: History Integration
4. ✅ **Task 2.4**: Analytics Tracking
5. ✅ **Task 2.5**: Testing & Polish

### **Phase 3 Preparation**
- Enhanced visualization planning
- Mini calendar view design
- Performance optimization
- Advanced analytics

---

*Created on: October 14, 2025*  
*Phase Duration: 0.5-1 week*  
*Total Tasks: 5*  
*Estimated Lines of Code: ~1500*

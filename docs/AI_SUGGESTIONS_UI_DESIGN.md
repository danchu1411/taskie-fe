# AI Suggestions Modal - UI/UX Design Specification

## Overview
This document outlines the complete UI/UX design for the AI Suggestions modal, following Taskie's design system with pastel green/purple color scheme and responsive design for desktop and tablet.

## Design Principles
- **Progressive Disclosure**: Show information step by step to avoid overwhelming users
- **Clear Visual Hierarchy**: Use typography and spacing to guide user attention
- **Consistent with Taskie**: Maintain existing design patterns and color scheme
- **Responsive Design**: Optimized for desktop and tablet viewports
- **Accessibility**: Ensure keyboard navigation and screen reader compatibility

## Color Palette
- **Primary Green**: `#7DD3FC` (pastel blue-green)
- **Primary Purple**: `#C4B5FD` (pastel purple)
- **Success**: `#10B981` (emerald)
- **Warning**: `#F59E0B` (amber)
- **Error**: `#EF4444` (red)
- **Neutral**: `#6B7280` (gray)
- **Background**: `#F9FAFB` (light gray)
- **Surface**: `#FFFFFF` (white)

## Typography
- **Headings**: Inter, font-weight 600-700
- **Body Text**: Inter, font-weight 400-500
- **Small Text**: Inter, font-weight 400, size 14px
- **Code/Time**: JetBrains Mono, font-weight 400

---

## Modal States & Flow

### 1. Initial State - Manual Input Form

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📝 Thông tin buổi học                                  │
│                                                         │
│  Tiêu đề *                                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Ôn Toán chương 2                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│  (120/120 ký tự)                                        │
│                                                         │
│  Mô tả                                                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Làm bài tập MA2, chuẩn bị cho kỳ thi...            │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│  (245/500 ký tự)                                        │
│                                                         │
│  Thời lượng *                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ▼ 60 phút                                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Hạn chót *                                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 📅 05/03/2025 21:00                                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Khung giờ ưa thích (tùy chọn)                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 📅 Từ: 05/03/2025 18:00                            │ │
│  │ 📅 Đến: 05/03/2025 21:00                           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Liên kết với task (tùy chọn)                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔍 Tìm kiếm task...                                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🤖 Tạo gợi ý AI                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Form Validation Rules
- **Title**: Required, max 120 characters, real-time character count
- **Description**: Optional, max 500 characters, real-time character count
- **Duration**: Required, dropdown with 15-minute increments (15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180)
- **Deadline**: Required, ISO 8601 format, must be future date
- **Preferred Window**: Optional, start and end datetime pickers
- **Target Task**: Optional, searchable dropdown with existing tasks

#### Visual Design Details
- **Form Fields**: White background, subtle border (`#E5E7EB`), rounded corners (8px)
- **Focus State**: Border color changes to primary green (`#7DD3FC`)
- **Error State**: Border color changes to error red (`#EF4444`) with error message below
- **Character Counter**: Small gray text, turns red when approaching limit
- **CTA Button**: Primary green background, white text, rounded corners (8px), hover effect

### 2. Loading State - AI Processing

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🤖 AI đang phân tích lịch của bạn...                   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  ⏳ Đang tìm khung giờ phù hợp...                   │ │
│  │                                                     │ │
│  │  • Phân tích lịch học hiện tại                      │ │
│  │  • Xem xét thói quen học tập                        │ │
│  │  • Tìm khung giờ tối ưu                            │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ❌ Hủy                                              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Visual Design Details
- **Loading Animation**: Pulsing dot animation with primary green color
- **Progress Text**: Rotating through different analysis steps
- **Cancel Button**: Secondary button style, allows user to abort request

### 3. Suggestions Display - Comparison View

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 So sánh: Bạn nhập vs AI đề xuất                     │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │ 📝 Bạn nhập         │  │ 🤖 AI đề xuất (3 gợi ý)    │ │
│  ├─────────────────────┤  ├─────────────────────────────┤ │
│  │ Tiêu đề:            │  │                             │ │
│  │ Ôn Toán chương 2     │  │ 🟢 Gợi ý 1 (Tin cậy cao)   │ │
│  │                     │  │ ┌─────────────────────────┐ │ │
│  │ Mô tả:              │  │ │ 📅 05/03/2025 19:00     │ │ │
│  │ Làm bài tập MA2     │  │ │ ⏱️ 60 phút               │ │ │
│  │                     │  │ │ 🎯 Khung giờ phù hợp     │ │ │
│  │ Thời lượng: 60 phút │  │ │    với Night Owl và      │ │ │
│  │                     │  │ │    trống trong lịch      │ │ │
│  │ Hạn chót:           │  │ └─────────────────────────┘ │ │
│  │ 05/03/2025 21:00    │  │                             │ │
│  │                     │  │ 🟡 Gợi ý 2 (Tin cậy TB)    │ │
│  │ Khung giờ:          │  │ ┌─────────────────────────┐ │ │
│  │ 18:00 - 21:00       │  │ │ 📅 05/03/2025 20:30     │ │ │
│  └─────────────────────┘  │ │ ⏱️ 60 phút               │ │ │
│                           │ │ 🎯 Gần deadline nhưng    │ │ │
│                           │ │    vẫn có thời gian      │ │ │
│                           │ └─────────────────────────┘ │ │
│                           │                             │ │
│                           │ 🔴 Gợi ý 3 (Tin cậy thấp)   │ │
│                           │ ┌─────────────────────────┐ │ │
│                           │ │ 📅 06/03/2025 09:00     │ │ │
│                           │ │ ⏱️ 60 phút               │ │ │
│                           │ │ 🎯 Sáng sớm, có thể      │ │ │
│                           │ │    không phù hợp         │ │ │
│                           │ └─────────────────────────┘ │ │
│                           └─────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔄 Tạo gợi ý mới                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Visual Design Details
- **Two-Column Layout**: Left side shows user input, right side shows AI suggestions
- **Suggestion Cards**: Each suggestion has a colored border indicating confidence level
  - 🟢 Green: High confidence (2)
  - 🟡 Yellow: Medium confidence (1)
  - 🔴 Red: Low confidence (0)
- **Hover Effects**: Cards lift slightly and show subtle shadow
- **Selection State**: Selected card gets a thicker border and different background
- **Time Format**: 24-hour format with date, easy to read
- **Reason Text**: Italicized, smaller font, explains AI's reasoning

### 4. Selection State - Slot Locked

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ Đã chọn gợi ý 1                                     │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │ 📝 Bạn nhập         │  │ 🤖 AI đề xuất              │ │
│  ├─────────────────────┤  ├─────────────────────────────┤ │
│  │ [User input display]│  │                             │ │
│  │                     │  │ ✅ Gợi ý 1 (Đã chọn)        │ │
│  │                     │  │ ┌─────────────────────────┐ │ │
│  │                     │  │ │ 📅 05/03/2025 19:00     │ │ │
│  │                     │  │ │ ⏱️ 60 phút               │ │ │
│  │                     │  │ │ 🎯 Khung giờ phù hợp     │ │ │
│  │                     │  │ │    với Night Owl và      │ │ │
│  │                     │  │ │    trống trong lịch      │ │ │
│  │                     │  │ └─────────────────────────┘ │ │
│  │                     │  │                             │ │
│  │                     │  │ 🔒 Gợi ý 2 (Đã khóa)        │ │
│  │                     │  │ 🔒 Gợi ý 3 (Đã khóa)        │ │
│  └─────────────────────┘  └─────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✅ Xác nhận tạo lịch                                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Visual Design Details
- **Selected Card**: Green background with checkmark icon
- **Locked Cards**: Grayed out with lock icon, non-interactive
- **Confirmation Button**: Primary green, prominent placement
- **Unlock Option**: Small "Mở khóa" link to allow reselection

### 5. Confirmation State - Success

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🎉 Đã tạo lịch thành công!                             │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  ✅ Ôn Toán chương 2                                │ │
│  │  📅 05/03/2025 19:00 - 20:00                       │ │
│  │  ⏱️ 60 phút                                         │ │
│  │                                                     │ │
│  │  Lịch đã được thêm vào Schedule của bạn.            │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 📅 Mở Schedule                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔄 Tạo lịch mới                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Visual Design Details
- **Success Icon**: Large checkmark with green color
- **Schedule Info**: Clear display of created schedule entry
- **Action Buttons**: Primary button for "Mở Schedule", secondary for "Tạo lịch mới"
- **Auto-close**: Modal closes after 3 seconds if user doesn't interact

### 6. Fallback State - No Suggestions

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  😔 Không tìm được khung giờ phù hợp                    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  🤖 AI không thể tìm được khung giờ phù hợp vì:     │ │
│  │                                                     │ │
│  │  • Lịch của bạn quá đầy trong khoảng thời gian     │ │
│  │    yêu cầu                                         │ │
│  │  • Deadline quá gần so với thời lượng cần thiết    │ │
│  │  • Không có khung giờ trống phù hợp với thói quen  │ │
│  │    học tập                                         │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔄 Chuyển về chế độ tự động                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✏️ Chỉnh lại thông tin                              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Visual Design Details
- **Sad Face Icon**: Large emoji to convey disappointment
- **Reason List**: Bullet points explaining why AI couldn't find suggestions
- **Action Buttons**: Clear options for next steps
- **Helpful Tips**: Additional suggestions for improving input

### 7. History Section - Past Suggestions

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ AI Sắp Lịch Thông Minh                    [×] Close    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📚 Lịch sử gợi ý AI                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  📅 Hôm nay                                         │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │ ✅ Ôn Toán chương 2                             │ │ │
│  │  │ 📅 05/03/2025 19:00 - 20:00                    │ │ │
│  │  │ 🕐 14:30                                        │ │ │
│  │  │ [Xem lại] [Chấp nhận]                          │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │ ⏳ Làm bài tập Vật lý                           │ │ │
│  │  │ 📅 06/03/2025 15:00 - 16:30                    │ │ │
│  │  │ 🕐 10:15                                        │ │ │
│  │  │ [Xem lại] [Chấp nhận]                          │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │  📅 Hôm qua                                         │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │ ❌ Ôn tập Hóa học                               │ │ │
│  │  │ 📅 04/03/2025 20:00 - 21:00                    │ │ │
│  │  │ 🕐 09:45                                        │ │ │
│  │  │ [Xem lại] [Tạo lại]                            │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ➕ Tạo gợi ý mới                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Visual Design Details
- **Status Icons**: 
  - ✅ Accepted
  - ⏳ Pending
  - ❌ Rejected
- **Grouped by Date**: Today, Yesterday, Older
- **Action Buttons**: Context-sensitive actions for each suggestion
- **Timestamp**: When the suggestion was created
- **Compact Layout**: Efficient use of space for multiple entries

---

## Responsive Design

### Desktop (≥1024px)
- **Modal Width**: 800px
- **Two-Column Layout**: Side-by-side comparison
- **Large Touch Targets**: 44px minimum
- **Comfortable Spacing**: 24px between sections

### Tablet (768px - 1023px)
- **Modal Width**: 90% of viewport width
- **Stacked Layout**: Suggestions below input form
- **Touch-Friendly**: Larger buttons and form elements
- **Optimized Spacing**: 20px between sections

### Mobile (<768px)
- **Full Screen**: Modal takes full viewport
- **Single Column**: All content stacked vertically
- **Large Touch Targets**: 48px minimum
- **Simplified Layout**: Reduced visual complexity

---

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical flow through form elements
- **Enter Key**: Submits forms and selects suggestions
- **Escape Key**: Closes modal
- **Arrow Keys**: Navigate between suggestions

### Screen Reader Support
- **ARIA Labels**: All interactive elements properly labeled
- **Live Regions**: Announce loading states and results
- **Semantic HTML**: Proper heading hierarchy and landmarks

### Visual Accessibility
- **High Contrast**: Sufficient color contrast ratios
- **Focus Indicators**: Clear visual focus states
- **Text Scaling**: Supports up to 200% zoom
- **Color Independence**: Information not conveyed by color alone

---

## Animation & Transitions

### Micro-interactions
- **Form Validation**: Smooth error state transitions
- **Suggestion Cards**: Subtle hover and selection animations
- **Loading States**: Pulsing and rotating animations
- **Success States**: Checkmark animation on confirmation

### Page Transitions
- **Modal Open/Close**: Fade and scale animation
- **State Changes**: Smooth transitions between different modal states
- **Loading to Results**: Fade transition with loading spinner

### Performance Considerations
- **Hardware Acceleration**: Use transform and opacity for animations
- **Reduced Motion**: Respect user's motion preferences
- **Smooth 60fps**: All animations maintain smooth frame rate

---

## Implementation Guidelines

### Component Structure
```
AISuggestionsModal/
├── AISuggestionsModal.tsx          # Main modal component
├── ManualInputForm.tsx             # Form for user input
├── SuggestionsDisplay.tsx          # Comparison view
├── SuggestionCard.tsx              # Individual suggestion
├── HistorySection.tsx              # Past suggestions
├── FallbackUI.tsx                  # No suggestions state
├── LoadingState.tsx                # AI processing state
├── ConfirmationState.tsx           # Success confirmation
└── styles/
    ├── AISuggestionsModal.css      # Main styles
    ├── Form.css                    # Form-specific styles
    ├── Suggestions.css             # Suggestions display styles
    └── Responsive.css              # Responsive breakpoints
```

### State Management
- **Form State**: Controlled components with validation
- **API State**: Loading, success, error states
- **Selection State**: Track selected suggestion
- **History State**: Cache and display past suggestions

### API Integration
- **Request Format**: Follow the schema defined in requirements
- **Error Handling**: Graceful handling of all error states
- **Rate Limiting**: Display countdown and retry options
- **Caching**: Store successful responses for history

### Testing Considerations
- **Unit Tests**: Test individual components
- **Integration Tests**: Test complete user flows
- **Accessibility Tests**: Ensure WCAG compliance
- **Visual Tests**: Screenshot testing for different states

---

## Future Enhancements

### Phase 2 Features
- **Calendar Integration**: Show suggestions on actual calendar
- **Smart Suggestions**: Learn from user preferences
- **Bulk Scheduling**: Multiple tasks at once
- **Conflict Resolution**: Handle scheduling conflicts

### Phase 3 Features
- **Voice Input**: Speech-to-text for form filling
- **Smart Templates**: Pre-filled forms based on patterns
- **Collaborative Scheduling**: Share suggestions with others
- **Advanced Analytics**: Insights into scheduling patterns

---

This design specification provides a comprehensive foundation for implementing the AI Suggestions modal while maintaining consistency with Taskie's design system and ensuring excellent user experience across all devices.

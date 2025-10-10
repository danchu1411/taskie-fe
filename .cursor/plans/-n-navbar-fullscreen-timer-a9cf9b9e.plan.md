<!-- a9cf9b9e-7b52-4edc-87b8-315634396804 a7af3d25-c129-4a99-ba5e-5d4b9fa35606 -->
# Tối ưu TodayPage - Code Review & Improvements

## Các vấn đề đã phát hiện:

### 1. **Imports không sử dụng**

- `FocusTimerFullscreen` và `FocusTimerBottomSheet` đã được import nhưng không còn dùng (đã chuyển sang TimerManager)
- Có thể loại bỏ để giảm bundle size

### 2. **Missing useMemo cho callbacks**

- `useTimerCallbacks` được gọi mỗi render với object mới
- Nên wrap callbacks trong `useMemo` để tránh re-render không cần thiết

### 3. **Duplicate destructuring**

- Timer context được destructure 2 lần (dòng 430-431 và 437-458)
- Nên gộp lại thành 1 lần

### 4. **Console.log statements**

- Nhiều console.log debug statements còn sót lại trong production code
- Nên loại bỏ hoặc wrap trong `if (__DEV__)` condition

### 5. **Unused variables**

- `timerItems` được tạo nhưng không dùng trực tiếp
- `customDuration` state không còn cần thiết sau khi chuyển sang TimerContext

### 6. **Handler functions có thể memoize**

- `handleTimerClose`, `handleTaskSelect`, `guardedNavigate` có thể optimize với useCallback dependencies

### 7. **StatusMutation callbacks**

- Timer callbacks tìm kiếm items mỗi lần gọi
- Có thể optimize bằng cách dùng Map lookup

### 8. **Missing error boundaries**

- Một số components lớn không có error boundary
- Nên wrap critical sections

### 9. **Large component**

- TodayPageContent quá lớn (~1200 lines)
- Có thể extract một số logic thành custom hooks

### 10. **Keyboard shortcuts dependencies**

- useTodayKeyboardShortcuts nhận quá nhiều dependencies
- Có thể optimize bằng cách dùng refs

## Các cải thiện đề xuất:

### A. **Cleanup Imports** (Priority: High)

```typescript
// Remove unused imports
- import { FocusTimerFullscreen } from "./components/FocusTimerFullscreen";
- import { FocusTimerBottomSheet } from "./components/FocusTimerBottomSheet";
```

### B. **Optimize Timer Callbacks** (Priority: High)

```typescript
// Memoize callbacks to prevent re-creation
const timerCallbacks = useMemo(() => ({
  onStartFocus: (item: TimerItem) => {
    const todayItem = items.find(i => i.id === item.id);
    if (todayItem && todayItem.status !== STATUS.IN_PROGRESS) {
      statusMutation.mutate({ item: todayItem, status: STATUS.IN_PROGRESS });
    }
  },
  onComplete: (item: TimerItem | null) => {
    const todayItem = items.find(i => i.id === item?.id);
    if (todayItem && todayItem.status !== STATUS.DONE) {
      statusMutation.mutate({ item: todayItem, status: STATUS.DONE });
    }
  }
}), [items, statusMutation]);

useTimerCallbacks(timerCallbacks);
```

### C. **Consolidate Timer Context** (Priority: Medium)

```typescript
// Single destructure instead of two
const timer = useTimerContext();
const {
  setItems,
  timerOpen,
  // ... all other props
} = timer;
```

### D. **Remove Debug Logs** (Priority: Medium)

- Remove or wrap console.log statements
- Use proper logging library if needed

### E. **Optimize Items Lookup** (Priority: Medium)

```typescript
// Create items Map for O(1) lookup
const itemsMap = useMemo(() => 
  new Map(items.map(item => [item.id, item])),
  [items]
);

// Use in callbacks
const todayItem = itemsMap.get(item.id);
```

### F. **Extract Custom Hooks** (Priority: Low)

- Extract mutation logic into `useTodayMutations` hook
- Extract modal state into `useTodayModals` hook
- Reduce component complexity

### G. **Remove Unused State** (Priority: Low)

- Remove `customDuration` if not used
- Clean up any other unused state variables

## Implementation Priority:

1. ✅ Cleanup imports (quick win)
2. ✅ Optimize timer callbacks (performance impact)
3. ✅ Consolidate destructuring (code quality)
4. ⚠️ Remove debug logs (production ready)
5. ⚠️ Optimize lookups (performance)
6. 📝 Extract hooks (maintainability)

## Expected Benefits:

- 🚀 Reduced re-renders
- 📦 Smaller bundle size
- 🧹 Cleaner code
- 🐛 Easier debugging
- 🔧 Better maintainability

### To-dos

- [ ] Loại bỏ imports không dùng (FocusTimerFullscreen, FocusTimerBottomSheet)
- [ ] Wrap timer callbacks trong useMemo để tránh re-creation
- [ ] Gộp timer context destructuring thành 1 lần duy nhất
- [ ] Tạo items Map để tối ưu lookup O(1)
- [ ] Loại bỏ console.log debug statements
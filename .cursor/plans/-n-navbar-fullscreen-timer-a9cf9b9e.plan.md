<!-- a9cf9b9e-7b52-4edc-87b8-315634396804 2a0f7fa4-a897-4798-b4fb-761f71621367 -->
# Tự động hoàn thành task khi timer kết thúc

## Yêu cầu

Khi đồng hồ Pomodoro chạy xong một task/checklist item cụ thể, tự động cập nhật status của item đó thành "Done".

## Phân tích hiện tại

### 1. Timer hook (`useTodayTimer.ts`)

- Dòng 68: `timerItemId` lưu ID của item đang focus
- Dòng 90-93: `timerItem` tìm item từ `timerItemId`
- Dòng 280-282: Khi all sessions complete, chỉ play sound và stop timer

### 2. TodayPage (`TodayPage.tsx`)

- Dòng 412-419: Timer được khởi tạo với callback `onStartFocus` để set status IN_PROGRESS
- Dòng 442: `statusMutation` có sẵn để cập nhật status

## Giải pháp

### Bước 1: Thêm callback `onComplete` vào `useTodayTimer`

**File:** `src/features/schedule/useTodayTimer.ts`

1. Thêm `onComplete` vào `TodayTimerHookParams` interface (dòng ~10)
2. Destructure `onComplete` từ params (dòng 60)
3. Gọi `onComplete(timerItem)` khi timer kết thúc (dòng ~280-282)

### Bước 2: Truyền callback từ TodayPage

**File:** `src/features/schedule/TodayPage.tsx`

Thêm `onComplete` callback vào timer initialization (dòng 412-419):

```typescript
const timer = useTodayTimer({
  items,
  onStartFocus: (item) => {
    if (item.status !== STATUS.IN_PROGRESS) {
      statusMutation.mutate({ item, status: STATUS.IN_PROGRESS });
    }
  },
  onComplete: (item) => {
    if (item && item.status !== STATUS.DONE) {
      statusMutation.mutate({ item, status: STATUS.DONE });
    }
  }
});
```

## Lưu ý

- Chỉ auto-complete khi có `timerItem` (đang focus một item cụ thể)
- Không auto-complete nếu timer chạy không gắn với item nào
- Kiểm tra status trước khi mutate để tránh update không cần thiết

### To-dos

- [ ] Thêm điều kiện ẩn NavigationBar khi isFullscreen === true trong TodayPage.tsx
- [ ] Kiểm tra TasksPage và PlannerPage có cùng vấn đề không
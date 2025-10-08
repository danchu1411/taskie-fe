import { lazy, Suspense } from 'react';

// Lazy load các component lớn và phức tạp
export const DynamicTaskModal = lazy(() => import('../ui/TaskModal'));
export const DynamicScheduleModal = lazy(() => import('../ui/ScheduleModal'));
export const DynamicChecklistItemModal = lazy(() => import('../ui/ChecklistItemModal'));
// export const DynamicStatusPickerModal = lazy(() => import('../ui/StatusPickerModal'));
export const DynamicCalendarView = lazy(() => import('../ui/CalendarView'));

// Timer components (rất lớn)
// export const DynamicFocusTimerFullscreen = lazy(() => 
//   import('../../features/schedule/components/FocusTimerFullscreen')
// );
// export const DynamicFocusTimerBottomSheet = lazy(() => 
//   import('../../features/schedule/components/FocusTimerBottomSheet')
// );

// Board view components
export const DynamicBoardView = lazy(() => import('../ui/BoardView'));
// export const DynamicTaskBoardView = lazy(() => import('../components/TaskBoardView'));

// Loading fallback
const ComponentLoading = () => (
  <div className="flex items-center justify-center p-4">
    <div className="flex items-center gap-2 text-slate-500">
      <span className="relative flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
        <span className="relative inline-flex h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </span>
      <span className="text-sm">Loading component...</span>
    </div>
  </div>
);

// Wrapper với Suspense
export const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <Suspense fallback={<ComponentLoading />}>
    <Component {...props} />
  </Suspense>
);

// Pre-configured components với Suspense
export const SuspenseTaskModal = withSuspense(DynamicTaskModal);
export const SuspenseScheduleModal = withSuspense(DynamicScheduleModal);
export const SuspenseChecklistItemModal = withSuspense(DynamicChecklistItemModal);
export const SuspenseStatusPickerModal = withSuspense(DynamicStatusPickerModal);
export const SuspenseCalendarView = withSuspense(DynamicCalendarView);
export const SuspenseFocusTimerFullscreen = withSuspense(DynamicFocusTimerFullscreen);
export const SuspenseFocusTimerBottomSheet = withSuspense(DynamicFocusTimerBottomSheet);
export const SuspenseBoardView = withSuspense(DynamicBoardView);
export const SuspenseTaskBoardView = withSuspense(DynamicTaskBoardView);

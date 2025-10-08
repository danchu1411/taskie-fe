import { lazy } from 'react';

// Lazy load các component lớn để giảm bundle size ban đầu
export const LazyCalendarView = lazy(() => import('../ui/CalendarView'));
export const LazyTaskModal = lazy(() => import('../ui/TaskModal'));
export const LazyScheduleModal = lazy(() => import('../ui/ScheduleModal'));
export const LazyChecklistItemModal = lazy(() => import('../ui/ChecklistItemModal'));

// Lazy load các page components
export const LazyTodayPage = lazy(() => import('../../features/schedule/TodayPage'));
export const LazyTasksPage = lazy(() => import('../../features/tasks/TasksPage'));
export const LazyPlannerPage = lazy(() => import('../../features/schedule/PlannerPage'));

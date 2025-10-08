import { lazy, Suspense } from 'react';
import { NavigationBar } from '../components/ui';

// Lazy load các page components
const TodayPage = lazy(() => import('../features/schedule/TodayPage'));
const TasksPage = lazy(() => import('../features/tasks/TasksPage'));
const PlannerPage = lazy(() => import('../features/schedule/PlannerPage'));

// Loading component
const PageLoading = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationBar />
    <div className="flex h-96 items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="relative flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
        </span>
        <span>Loading page...</span>
      </div>
    </div>
  </div>
);

// Wrapper components với Suspense
export const LazyTodayPage = (props: any) => (
  <Suspense fallback={<PageLoading />}>
    <TodayPage {...props} />
  </Suspense>
);

export const LazyTasksPage = (props: any) => (
  <Suspense fallback={<PageLoading />}>
    <TasksPage {...props} />
  </Suspense>
);

export const LazyPlannerPage = (props: any) => (
  <Suspense fallback={<PageLoading />}>
    <PlannerPage {...props} />
  </Suspense>
);

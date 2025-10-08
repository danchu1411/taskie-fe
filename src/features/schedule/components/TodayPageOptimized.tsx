import React, { memo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTodayData } from '../hooks/useTodayData';
import { useOptimizedQueries } from '../../../hooks/useOptimizedQueries';
import TodayTaskCard from '../../../components/optimized/TodayTaskCard';
import { NavigationBar, SystemError } from '../../../components/ui';
import type { TodayItem } from '../../../lib';

interface TodayPageOptimizedProps {
  onNavigate?: (path: string) => void;
}

// Memoized Progress Overview Component
const ProgressOverview = memo(function ProgressOverview({
  totalTasks,
  inProgressCount,
  completedCount,
  progressValue,
}: {
  totalTasks: number;
  inProgressCount: number;
  completedCount: number;
  progressValue: number;
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Total Tasks</p>
            <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">In Progress</p>
            <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <div className="text-2xl font-bold">{progressValue}%</div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Progress</p>
            <p className="text-2xl font-bold text-slate-900">{progressValue}%</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Memoized Task Section Component
const TaskSection = memo(function TaskSection({
  title,
  subtitle,
  icon,
  iconBg,
  iconText,
  countBg,
  countText,
  items,
  isLoading,
  onStart,
  onSchedule,
  onEdit,
  onStatusModal,
  isUpdating,
  className,
}: {
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconText: string;
  countBg: string;
  countText: string;
  items: TodayItem[];
  isLoading: boolean;
  onStart?: (item: TodayItem) => void;
  onSchedule?: (item: TodayItem) => void;
  onEdit?: (item: TodayItem) => void;
  onStatusModal?: (item: TodayItem) => void;
  isUpdating: (itemId: string) => boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${iconText}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className={`ml-auto rounded-full px-3 py-1 ${countBg} ${countText}`}>
          <span className="text-sm font-medium">{items.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-4 w-3/4 rounded bg-slate-200 mb-2"></div>
              <div className="h-3 w-1/2 rounded bg-slate-200"></div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">No {title.toLowerCase()} tasks</p>
          </div>
        ) : (
          items.map((item) => (
            <TodayTaskCard
              key={item.id}
              item={item}
              onStart={onStart}
              onSchedule={onSchedule}
              onEdit={onEdit}
              onStatusModal={onStatusModal}
              isUpdating={isUpdating(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
});

// Main TodayPageOptimized Component
function TodayPageOptimized({ onNavigate }: TodayPageOptimizedProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { prefetchPageData } = useOptimizedQueries();

  const { tasksQuery, items, categories } = useTodayData(userId);
  const { inProgress, planned, completed, doneCount, progressValue } = categories;

  // Prefetch data for other pages
  React.useEffect(() => {
    prefetchPageData(userId, 'tasks');
    prefetchPageData(userId, 'planner');
  }, [userId, prefetchPageData]);

  // Memoized handlers
  const handleStart = useCallback((item: TodayItem) => {
    console.log('Start task:', item.title);
    // TODO: Implement timer functionality
  }, []);

  const handleSchedule = useCallback((item: TodayItem) => {
    console.log('Schedule task:', item.title);
    // TODO: Implement schedule functionality
  }, []);

  const handleEdit = useCallback((item: TodayItem) => {
    console.log('Edit task:', item.title);
    // TODO: Implement edit functionality
  }, []);

  const handleStatusModal = useCallback((item: TodayItem) => {
    console.log('Open status modal for:', item.title);
    // TODO: Implement status modal
  }, []);

  const isUpdating = useCallback((_itemId: string) => {
    return false; // TODO: Implement actual updating state
  }, []);

  const errorMessage = tasksQuery.isError ? 'Failed to load tasks' : null;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationBar onNavigate={onNavigate} activeNav="today" />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <SystemError
            variant="error"
            title="Unable to load today schedule"
            message={errorMessage}
            actions={[
              {
                label: 'Retry',
                onClick: () => tasksQuery.refetch(),
                variant: 'primary'
              }
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar onNavigate={onNavigate} activeNav="today" />
      
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="text-sm font-medium tracking-wider text-slate-500 uppercase">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] ?? 'there'}
              </h1>
              <div className="h-1 w-24 bg-slate-300"></div>
              <p className="text-lg font-medium text-slate-600">
                Let's focus on what matters today.
              </p>
            </div>
          </div>
        </section>

        {/* Progress Overview */}
        {tasksQuery.isLoading ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-200"></div>
                  <div>
                    <div className="h-4 w-20 rounded bg-slate-200 mb-2"></div>
                    <div className="h-6 w-8 rounded bg-slate-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProgressOverview
            totalTasks={items.length}
            inProgressCount={inProgress.length}
            completedCount={doneCount}
            progressValue={progressValue}
          />
        )}

        {/* Task Sections */}
        <div className="grid gap-8 lg:grid-cols-3">
          <TaskSection
            title="Planned"
            subtitle="Ready to start"
            icon="📋"
            iconBg="bg-blue-50"
            iconText="text-blue-600"
            countBg="bg-blue-50"
            countText="text-blue-600"
            items={planned}
            isLoading={tasksQuery.isLoading}
            onStart={handleStart}
            onSchedule={handleSchedule}
            onEdit={handleEdit}
            onStatusModal={handleStatusModal}
            isUpdating={isUpdating}
            className="lg:col-span-1"
          />

          <TaskSection
            title="In Progress"
            subtitle="Currently working on"
            icon="⏳"
            iconBg="bg-amber-50"
            iconText="text-amber-600"
            countBg="bg-amber-50"
            countText="text-amber-600"
            items={inProgress}
            isLoading={tasksQuery.isLoading}
            onStart={handleStart}
            onSchedule={handleSchedule}
            onEdit={handleEdit}
            onStatusModal={handleStatusModal}
            isUpdating={isUpdating}
            className="lg:col-span-1"
          />

          <TaskSection
            title="Done"
            subtitle="Completed tasks"
            icon="✓"
            iconBg="bg-green-50"
            iconText="text-green-600"
            countBg="bg-green-50"
            countText="text-green-600"
            items={completed}
            isLoading={tasksQuery.isLoading}
            onStart={undefined}
            onSchedule={handleSchedule}
            onEdit={handleEdit}
            onStatusModal={handleStatusModal}
            isUpdating={isUpdating}
            className="lg:col-span-1"
          />
        </div>
      </main>
    </div>
  );
}

export default memo(TodayPageOptimized);

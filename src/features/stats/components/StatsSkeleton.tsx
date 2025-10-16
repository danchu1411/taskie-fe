import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style: React.CSSProperties = {};
  
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`stats-skeleton ${className}`}
      style={style}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 stats-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={20} />
        <Skeleton width={24} height={24} className="rounded" />
      </div>
      <div className="text-center">
        <Skeleton width={80} height={32} className="mx-auto mb-2" />
        <Skeleton width={100} height={16} className="mx-auto" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 stats-chart-container">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width={200} height={24} />
        <div className="flex gap-2">
          <Skeleton width={60} height={32} className="rounded" />
          <Skeleton width={60} height={32} className="rounded" />
        </div>
      </div>
      <div className="h-64">
        <Skeleton width="100%" height="100%" />
      </div>
    </div>
  );
}

export function StreakSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 stats-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={150} height={24} />
        <Skeleton width={24} height={24} className="rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton width={100} height={16} />
            <Skeleton width={60} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation skeleton */}
      <div className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">
            <Skeleton width={120} height={32} />
            <div className="flex items-center gap-4">
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <Skeleton width={200} height={36} className="mb-8" />
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartSkeleton />
          <StreakSkeleton />
        </div>
      </main>
    </div>
  );
}

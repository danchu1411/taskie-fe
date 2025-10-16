import { useState, useEffect } from 'react';
import type { StatsOverview } from '../../../lib/types';

interface StatsOverviewCardsProps {
  data: StatsOverview | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, color, isLoading }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setDisplayValue(0);
      return;
    }

    // Animate counter from 0 to target value
    const duration = 1000; // 1 second
    const steps = 60; // 60fps
    const increment = value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newValue = Math.min(Math.floor(increment * currentStep), value);
      setDisplayValue(newValue);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isLoading]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>
            {isLoading ? '...' : displayValue.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-50')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StatsOverviewCards({ data, isLoading }: StatsOverviewCardsProps) {
  if (!data && !isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="text-center">
            <p className="text-slate-600">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Tasks Completed"
        value={data?.totalTasksCompleted || 0}
        icon={
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        color="text-blue-600"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Focus Time"
        value={Math.round((data?.totalFocusMinutes || 0) / 60)}
        icon={
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        color="text-green-600"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Current Streak"
        value={data?.currentStreak || 0}
        icon={
          <span className="text-2xl">🔥</span>
        }
        color="text-orange-600"
        isLoading={isLoading}
      />
      
      <StatCard
        title="Checklist Items"
        value={data?.totalChecklistItemsCompleted || 0}
        icon={
          <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        }
        color="text-purple-600"
        isLoading={isLoading}
      />
    </div>
  );
}

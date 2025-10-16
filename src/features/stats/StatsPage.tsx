import { NavigationBar } from '../../components/ui';
import { useStatsOverview, useDailyActivity, useStreakHistory } from './hooks/useStatsData';
import StatsOverviewCards from './components/StatsOverviewCards';
import ActivityChart from './components/ActivityChart';
import StreakVisualization from './components/StreakVisualization';
import StatsError from './components/StatsError';

interface StatsPageProps {
  onNavigate?: (path: string) => void;
}

export default function StatsPage({ onNavigate }: StatsPageProps) {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useStatsOverview();
  const { data: dailyData, isLoading: dailyLoading, error: dailyError } = useDailyActivity(7);
  const { data: streakData, isLoading: streakLoading, error: streakError } = useStreakHistory(10);

  const isLoading = overviewLoading || dailyLoading || streakLoading;
  const hasError = overviewError || dailyError || streakError;

  if (hasError) {
    return (
      <>
        <NavigationBar onNavigate={onNavigate} activeNav="stats" />
        <StatsError 
          onRetry={() => window.location.reload()}
          onGoHome={() => onNavigate?.('/today')}
        />
      </>
    );
  }

  return (
    <>
      <NavigationBar onNavigate={onNavigate} activeNav="stats" />
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-7xl px-6 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Stats</h1>
            <p className="text-slate-600">Track your productivity and progress over time</p>
          </div>

          {/* Overview Cards */}
          <div className="mb-8">
            <StatsOverviewCards data={overview || null} isLoading={isLoading} />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Chart - Takes 2/3 width on large screens */}
            <div className="lg:col-span-2">
              <ActivityChart 
                data={dailyData?.dailyActivity || null} 
                isLoading={isLoading} 
              />
            </div>

            {/* Streak Visualization - Takes 1/3 width on large screens */}
            <div className="lg:col-span-1">
              <StreakVisualization 
                overview={overview || null}
                streakHistory={streakData?.streakHistory || null}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Empty State */}
          {!isLoading && (!overview || overview.totalTasksCompleted === 0) && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Start Your Journey</h3>
                <p className="text-slate-600 mb-6">
                  Complete your first task to see your productivity stats here!
                </p>
                <button
                  onClick={() => onNavigate?.('/tasks')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Tasks
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

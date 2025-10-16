import { NavigationBar, SystemError } from '../../components/ui';
import { useStatsOverview, useDailyActivity } from './hooks/useStatsData';

interface StatsPageProps {
  onNavigate?: (path: string) => void;
}

export default function StatsPage({ onNavigate }: StatsPageProps) {
  const { data: overview, isLoading, error } = useStatsOverview();
  const { data: dailyData } = useDailyActivity(7);

  if (error) {
    return (
      <>
        <NavigationBar onNavigate={onNavigate} activeNav="stats" />
        <div className="min-h-screen bg-slate-50">
          <main className="mx-auto max-w-7xl px-6 py-12">
            <SystemError
              variant="error"
              title="Failed to load stats"
              message="Please try again later"
              actions={[
                {
                  label: 'Retry',
                  onClick: () => window.location.reload(),
                  variant: 'primary'
                }
              ]}
            />
          </main>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <NavigationBar onNavigate={onNavigate} activeNav="stats" />
        <div className="min-h-screen bg-slate-50">
          <main className="mx-auto max-w-7xl px-6 py-12">
            <div className="text-center">
              <p className="text-slate-600">Loading stats...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationBar onNavigate={onNavigate} activeNav="stats" />
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-7xl px-6 py-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Stats</h1>
          
          {/* Temporary debug output */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Debug: Stats Overview</h2>
            <pre className="text-sm bg-slate-100 p-4 rounded overflow-auto">
              {JSON.stringify(overview, null, 2)}
            </pre>
            
            <h2 className="text-xl font-semibold mb-4 mt-6">Debug: Daily Activity (Last 7 days)</h2>
            <pre className="text-sm bg-slate-100 p-4 rounded overflow-auto">
              {JSON.stringify(dailyData, null, 2)}
            </pre>
          </div>
        </main>
      </div>
    </>
  );
}

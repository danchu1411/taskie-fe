import { useState, useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyActivity } from '../../../lib/types';

interface ActivityChartProps {
  data: DailyActivity[] | null;
  isLoading?: boolean;
}

interface ChartDataPoint {
  date: string;
  tasks: number;
  focus: number;
  sessions: number;
}

const ActivityChart = memo(function ActivityChart({ data, isLoading }: ActivityChartProps) {
  const [period, setPeriod] = useState<'7' | '30'>('7');

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];

    return data.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      tasks: day.tasksCompleted,
      focus: day.focusMinutes,
      sessions: day.sessionsCount
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'focus' && ' min'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Activity Chart</h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <div className="px-3 py-1 bg-white rounded text-sm font-medium text-slate-600">7 days</div>
            <div className="px-3 py-1 text-sm text-slate-500">30 days</div>
          </div>
        </div>
        <div className="h-[300px] bg-slate-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Activity Chart</h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod('7')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                period === '7' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setPeriod('30')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                period === '30' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              30 days
            </button>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-slate-500">
          <p>No activity data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Activity Chart</h3>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setPeriod('7')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              period === '7' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setPeriod('30')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              period === '30' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            30 days
          </button>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="tasks" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Tasks Completed"
            />
            <Line 
              type="monotone" 
              dataKey="focus" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="Focus Minutes"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default ActivityChart;

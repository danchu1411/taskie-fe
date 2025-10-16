import api from './api';
import type { 
  StatsOverview, 
  DailyActivityResponse, 
  StreakHistoryResponse 
} from './types';

// Get stats overview
export async function getStatsOverview(): Promise<StatsOverview> {
  const response = await api.get('/user-stats');
  return response.data.overview;
}

// Get daily activity
export async function getDailyActivity(
  days?: number,
  fromDate?: string,
  toDate?: string
): Promise<DailyActivityResponse> {
  const params = new URLSearchParams();
  if (days) params.append('days', days.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const response = await api.get(`/user-stats/daily?${params.toString()}`);
  return response.data;
}

// Get streak history
export async function getStreakHistory(limit?: number): Promise<StreakHistoryResponse> {
  const params = limit ? `?limit=${limit}` : '';
  const response = await api.get(`/user-stats/streak-history${params}`);
  return response.data;
}

// Record focus session
export async function recordFocusSession(
  plannedMinutes: number,
  completedAt?: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post('/user-stats/record-focus-session', {
    plannedMinutes,
    completedAt: completedAt || new Date().toISOString()
  });
  return response.data;
}

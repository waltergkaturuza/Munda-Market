import { api } from './auth';

export async function fetchAnalyticsSummary(params) {
  const { data } = await api.get('/analytics/summary', { params });
  return data;
}



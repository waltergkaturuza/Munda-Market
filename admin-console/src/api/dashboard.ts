import apiClient from './client';
import { DashboardStats } from '@/types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getRevenueChart: async (period: 'week' | 'month' | 'year') => {
    const response = await apiClient.get(`/dashboard/revenue-chart?period=${period}`);
    return response.data;
  },

  getOrdersChart: async (period: 'week' | 'month' | 'year') => {
    const response = await apiClient.get(`/dashboard/orders-chart?period=${period}`);
    return response.data;
  },
};


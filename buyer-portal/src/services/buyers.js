import { api } from './auth';

export const buyersApi = {
  // Dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/buyers/dashboard/stats');
    return response.data;
  },

  // Recent orders
  getRecentOrders: async (limit = 5) => {
    const response = await api.get('/buyers/orders/recent', {
      params: { limit },
    });
    return response.data;
  },

  // Buyer profile
  getProfile: async () => {
    const response = await api.get('/buyers/profile');
    return response.data;
  },
};


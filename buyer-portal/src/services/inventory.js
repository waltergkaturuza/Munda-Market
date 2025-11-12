import { api } from './auth';

export const inventoryApi = {
  // Preferences
  createPreference: async (data) => {
    const response = await api.post('/inventory/preferences', data);
    return response.data;
  },

  listPreferences: async (favoriteOnly = false) => {
    const response = await api.get('/inventory/preferences', {
      params: { favorite_only: favoriteOnly },
    });
    return response.data;
  },

  updatePreference: async (preferenceId, data) => {
    const response = await api.put(`/inventory/preferences/${preferenceId}`, data);
    return response.data;
  },

  deletePreference: async (preferenceId) => {
    await api.delete(`/inventory/preferences/${preferenceId}`);
  },

  // Alerts
  getAlerts: async (params = {}) => {
    const response = await api.get('/inventory/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (alertId) => {
    const response = await api.post(`/inventory/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  dismissAlert: async (alertId) => {
    const response = await api.post(`/inventory/alerts/${alertId}/dismiss`);
    return response.data;
  },

  // Stock Levels
  getStockLevels: async (favoriteOnly = false) => {
    const response = await api.get('/inventory/stock-levels', {
      params: { favorite_only: favoriteOnly },
    });
    return response.data;
  },

  // Stock History
  getStockHistory: async (cropId, days = 30) => {
    const response = await api.get(`/inventory/stock-history/${cropId}`, {
      params: { days },
    });
    return response.data;
  },
};


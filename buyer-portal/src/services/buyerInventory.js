import { api } from './auth';

export const buyerInventoryApi = {
  // Dashboard Metrics
  getDashboardMetrics: async () => {
    const response = await api.get('/buyer-inventory/dashboard/metrics');
    return response.data;
  },

  // Stock Items
  getStockItems: async (includeExpired = false, statusFilter = null) => {
    const params = {};
    if (includeExpired) params.include_expired = true;
    if (statusFilter) params.status_filter = statusFilter;
    const response = await api.get('/buyer-inventory/stock', { params });
    return response.data;
  },

  // Stock Movements
  createStockMovement: async (movementData) => {
    const response = await api.post('/buyer-inventory/stock/movements', movementData);
    return response.data;
  },

  getStockMovements: async (cropId = null, movementType = null, days = 30) => {
    const params = { days };
    if (cropId) params.crop_id = cropId;
    if (movementType) params.movement_type = movementType;
    const response = await api.get('/buyer-inventory/stock/movements', { params });
    return response.data;
  },

  // Reorder Point Calculation
  calculateReorderPoint: async (cropId, leadTimeDays = null, safetyStockDays = null) => {
    const params = {};
    if (leadTimeDays) params.lead_time_days = leadTimeDays;
    if (safetyStockDays) params.safety_stock_days = safetyStockDays;
    const response = await api.post(`/buyer-inventory/stock/calculate-reorder-point?crop_id=${cropId}`, {}, { params });
    return response.data;
  },

  // Sales Intensity Analysis
  getSalesIntensityAnalysis: async (days = 30) => {
    const response = await api.get('/buyer-inventory/stock/sales-intensity', { params: { days } });
    return response.data;
  },

  // Reorder Suggestions
  getReorderSuggestions: async () => {
    const response = await api.get('/buyer-inventory/stock/reorder-suggestions');
    return response.data;
  },
};


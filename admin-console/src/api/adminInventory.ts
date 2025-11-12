import apiClient from './client';

export interface AdminInventoryMetrics {
  total_buyers_with_stock: number;
  total_stock_items: number;
  total_stock_value: number;
  total_quantity_kg: number;
  items_low_stock: number;
  items_expiring_soon: number;
  items_expired: number;
  total_movements_today: number;
  total_movements_week: number;
  average_days_cover: number;
}

export interface BuyerStockSummary {
  buyer_id: number;
  buyer_name: string;
  buyer_company?: string;
  total_items: number;
  total_stock_value: number;
  total_quantity_kg: number;
  items_low_stock: number;
  items_expiring_soon: number;
  items_expired: number;
  last_movement_date?: string;
}

export interface AdminStockItem {
  stock_id: number;
  buyer_id: number;
  buyer_name: string;
  buyer_company?: string;
  crop_id: number;
  crop_name: string;
  current_quantity_kg: number;
  reorder_point_kg?: number;
  days_of_stock_cover?: number;
  stock_status: string;
  expiry_date?: string;
  days_until_expiry?: number;
  expiry_status: string;
  total_value_usd?: number;
  sales_intensity_code?: string;
  inventory_turnover?: number;
  last_movement_date?: string;
}

export interface AdminStockMovement {
  movement_id: number;
  buyer_id: number;
  buyer_name: string;
  buyer_company?: string;
  crop_id: number;
  crop_name: string;
  movement_type: string;
  quantity_kg: number;
  unit_cost_usd?: number;
  total_cost_usd?: number;
  movement_date: string;
  notes?: string;
  order_id?: number;
}

export interface SalesIntensityAnalysis {
  crop_id: number;
  crop_name: string;
  total_buyers: number;
  total_consumption_kg: number;
  average_daily_consumption_kg: number;
  total_stock_kg: number;
  total_value_usd: number;
  average_inventory_turnover: number;
  average_days_of_inventory: number;
  days_to_sellout?: number;
  sales_intensity_code: string;
  recommendation: string;
}

export const adminInventoryApi = {
  getMetrics: async (): Promise<AdminInventoryMetrics> => {
    const response = await apiClient.get<AdminInventoryMetrics>('/admin/inventory/metrics');
    return response.data;
  },

  getBuyerSummaries: async (): Promise<BuyerStockSummary[]> => {
    const response = await apiClient.get<BuyerStockSummary[]>('/admin/inventory/buyers');
    return response.data;
  },

  getStockItems: async (
    buyerId?: number,
    cropId?: number,
    statusFilter?: string,
    includeExpired?: boolean
  ): Promise<AdminStockItem[]> => {
    const params: any = {};
    if (buyerId) params.buyer_id = buyerId;
    if (cropId) params.crop_id = cropId;
    if (statusFilter) params.status_filter = statusFilter;
    if (includeExpired) params.include_expired = true;
    const response = await apiClient.get<AdminStockItem[]>('/admin/inventory/stock-items', { params });
    return response.data;
  },

  getMovements: async (
    buyerId?: number,
    cropId?: number,
    movementType?: string,
    days?: number
  ): Promise<AdminStockMovement[]> => {
    const params: any = { days: days || 30 };
    if (buyerId) params.buyer_id = buyerId;
    if (cropId) params.crop_id = cropId;
    if (movementType) params.movement_type = movementType;
    const response = await apiClient.get<AdminStockMovement[]>('/admin/inventory/movements', { params });
    return response.data;
  },

  getSalesIntensity: async (days?: number): Promise<SalesIntensityAnalysis[]> => {
    const params = days ? { days } : {};
    const response = await apiClient.get<SalesIntensityAnalysis[]>('/admin/inventory/sales-intensity', { params });
    return response.data;
  },
};


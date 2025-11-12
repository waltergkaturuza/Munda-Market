import apiClient from './client';
import { Farm } from '@/types';

export interface Farmer {
  user_id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  farms_count?: number;
  total_production_kg?: number;
  total_earnings_usd?: number;
}

export interface FarmerDetail extends Farmer {
  farms: Farm[];
  production_plans: any[];
  payouts: any[];
  profile_data?: any;
}

export interface UpdateFarmerRequest {
  status?: string;
  is_verified?: boolean;
}

export const farmersApi = {
  getAll: async (): Promise<Farmer[]> => {
    const response = await apiClient.get<Farmer[]>('/admin/farmers');
    return response.data;
  },

  getById: async (id: number): Promise<FarmerDetail> => {
    const response = await apiClient.get<FarmerDetail>(`/admin/farmers/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateFarmerRequest): Promise<void> => {
    await apiClient.patch(`/admin/farmers/${id}`, data);
  },

  suspend: async (id: number, reason: string): Promise<void> => {
    await apiClient.post(`/admin/farmers/${id}/suspend`, { reason });
  },

  activate: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/farmers/${id}/activate`);
  },

  getFarms: async (farmerId: number): Promise<Farm[]> => {
    const response = await apiClient.get<Farm[]>(`/admin/farmers/${farmerId}/farms`);
    return response.data;
  },
};


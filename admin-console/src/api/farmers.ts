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

export interface CreateFarmerRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
  auto_activate?: boolean;
  gov_id?: string;
  bio?: string;
  home_address_line1?: string;
  home_address_line2?: string;
  home_district?: string;
  home_province?: string;
  home_postal_code?: string;
  farm_name?: string;
  farm_latitude?: number;
  farm_longitude?: number;
  farm_geohash?: string;
  farm_district?: string;
  farm_province?: string;
  farm_ward?: string;
  farm_address_line1?: string;
  farm_address_line2?: string;
  farm_postal_code?: string;
  farm_total_hectares?: number;
  farm_type?: string;
  irrigation_available?: string;
  preferred_crops?: number[];
  association_name?: string;
  association_membership_id?: string;
}

export interface CreateFarmRequest {
  name: string;
  geohash: string;
  latitude: number;
  longitude: number;
  ward?: string;
  district: string;
  province: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  total_hectares?: number;
  farm_type?: string;
  irrigation_available?: string;
  association_name?: string;
  association_membership_id?: string;
}

export const farmersApi = {
  getAll: async (): Promise<Farmer[]> => {
    const response = await apiClient.get<Farmer[]>('/admin/farmers');
    return response.data;
  },

  create: async (data: CreateFarmerRequest): Promise<void> => {
    await apiClient.post('/admin/farmers/create', data);
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

  createFarm: async (farmerId: number, data: CreateFarmRequest): Promise<void> => {
    await apiClient.post(`/admin/farmers/${farmerId}/farms`, data);
  },
};


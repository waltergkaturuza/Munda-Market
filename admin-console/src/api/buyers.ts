import apiClient from './client';

export interface Buyer {
  user_id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  total_orders?: number;
  total_spent_usd?: number;
  company_name?: string;
}

export interface BuyerDetail extends Buyer {
  orders: any[];
  payments: any[];
  profile_data?: any;
}

export interface UpdateBuyerRequest {
  status?: string;
  is_verified?: boolean;
}

export interface CreateBuyerProfileRequest {
  company_name: string;
  business_type?: string;
  business_phone?: string;
  business_email?: string;
  tax_number?: string;
  vat_number?: string;
  business_registration_number?: string;
}

export interface CreateBuyerRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
  company_name?: string;
  business_type?: string;
  auto_activate?: boolean;
}

export const buyersApi = {
  getAll: async (): Promise<Buyer[]> => {
    const response = await apiClient.get<Buyer[]>('/admin/buyers');
    return response.data;
  },

  create: async (data: CreateBuyerRequest): Promise<void> => {
    await apiClient.post('/admin/buyers/create', data);
  },

  getById: async (id: number): Promise<BuyerDetail> => {
    const response = await apiClient.get<BuyerDetail>(`/admin/buyers/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateBuyerRequest): Promise<void> => {
    await apiClient.patch(`/admin/buyers/${id}`, data);
  },

  createProfile: async (id: number, data: CreateBuyerProfileRequest): Promise<void> => {
    await apiClient.post(`/admin/buyers/${id}/create-profile`, data);
  },

  suspend: async (id: number, reason: string): Promise<void> => {
    await apiClient.post(`/admin/buyers/${id}/suspend`, { reason });
  },

  activate: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/buyers/${id}/activate`);
  },
};


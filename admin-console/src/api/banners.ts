import apiClient from './client';
import { Banner, BannerCreate, BannerUpdate, BannerPlatform } from '@/types';

export const bannersApi = {
  // Get active banners for a platform
  getActiveBanners: async (platform: BannerPlatform = 'admin'): Promise<Banner[]> => {
    const response = await apiClient.get<Banner[]>(`/banners/active/${platform}`);
    return response.data;
  },

  // Admin CRUD operations
  listBanners: async (params?: {
    platform?: BannerPlatform;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<Banner[]> => {
    const response = await apiClient.get<Banner[]>('/banners', { params });
    return response.data;
  },

  getBanner: async (bannerId: number): Promise<Banner> => {
    const response = await apiClient.get<Banner>(`/banners/${bannerId}`);
    return response.data;
  },

  createBanner: async (data: BannerCreate): Promise<Banner> => {
    const response = await apiClient.post<Banner>('/banners', data);
    return response.data;
  },

  updateBanner: async (bannerId: number, data: BannerUpdate): Promise<Banner> => {
    const response = await apiClient.put<Banner>(`/banners/${bannerId}`, data);
    return response.data;
  },

  deleteBanner: async (bannerId: number): Promise<void> => {
    await apiClient.delete(`/banners/${bannerId}`);
  },
};


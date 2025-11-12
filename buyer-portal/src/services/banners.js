import { api } from './auth';

export const bannersApi = {
  // Get active banners for buyer platform
  getActiveBanners: async () => {
    const response = await api.get('/banners/active/buyer');
    return response.data;
  },
};


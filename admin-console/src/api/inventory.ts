import apiClient from './client';
import { Crop } from '@/types';

export interface InventoryItem {
  crop_id: number;
  crop_name: string;
  available_quantity_kg: number;
  farms_growing: number;
  avg_harvest_days: number;
  base_price_usd_per_kg: number;
}

export const inventoryApi = {
  getAvailableInventory: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get<InventoryItem[]>('/admin/inventory/available');
    return response.data;
  },

  getCrops: async (): Promise<Crop[]> => {
    const response = await apiClient.get<Crop[]>('/crops');
    return response.data;
  },

  updateCropPrice: async (cropId: number, newPrice: number): Promise<void> => {
    await apiClient.patch(`/crops/${cropId}`, {
      base_price_usd_per_kg: newPrice,
    });
  },
};


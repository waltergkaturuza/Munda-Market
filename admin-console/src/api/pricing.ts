import apiClient from './client';
import { PricingRule, Crop } from '@/types';

export interface CreatePricingRuleRequest {
  crop_id: number;
  min_quantity_kg?: number;
  max_quantity_kg?: number;
  markup_percentage: number;
  priority: number;
  active: boolean;
}

export const pricingApi = {
  getRules: async (): Promise<PricingRule[]> => {
    const response = await apiClient.get<PricingRule[]>('/admin/pricing/rules');
    return response.data;
  },

  createRule: async (data: CreatePricingRuleRequest): Promise<PricingRule> => {
    const response = await apiClient.post<PricingRule>('/admin/pricing/rules', data);
    return response.data;
  },

  updateRule: async (ruleId: number, data: Partial<CreatePricingRuleRequest>): Promise<void> => {
    await apiClient.patch(`/admin/pricing/rules/${ruleId}`, data);
  },

  deleteRule: async (ruleId: number): Promise<void> => {
    await apiClient.delete(`/admin/pricing/rules/${ruleId}`);
  },

  getCrops: async (): Promise<Crop[]> => {
    const response = await apiClient.get<Crop[]>('/crops');
    return response.data;
  },
};


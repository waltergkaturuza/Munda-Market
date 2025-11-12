import apiClient from './client';
import { Payout } from '@/types';

export interface ProcessPayoutRequest {
  payout_id: number;
  transaction_reference?: string;
}

export const payoutsApi = {
  getPending: async (): Promise<Payout[]> => {
    const response = await apiClient.get<Payout[]>('/admin/payouts/pending');
    return response.data;
  },

  getAll: async (): Promise<Payout[]> => {
    const response = await apiClient.get<Payout[]>('/admin/payouts');
    return response.data;
  },

  process: async (data: ProcessPayoutRequest): Promise<void> => {
    await apiClient.post(`/admin/payouts/${data.payout_id}/process`, {
      transaction_reference: data.transaction_reference,
    });
  },

  reject: async (payoutId: number, reason: string): Promise<void> => {
    await apiClient.post(`/admin/payouts/${payoutId}/reject`, { reason });
  },
};


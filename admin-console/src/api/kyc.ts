import apiClient from './client';
import { KYCSubmission } from '@/types';

export interface KYCApprovalRequest {
  user_id: number;
  approved: boolean;
  notes?: string;
}

export const kycApi = {
  getPendingSubmissions: async (): Promise<KYCSubmission[]> => {
    const response = await apiClient.get<KYCSubmission[]>('/admin/kyc/pending');
    return response.data;
  },

  getSubmissionById: async (userId: number): Promise<KYCSubmission> => {
    const response = await apiClient.get<KYCSubmission>(`/admin/kyc/${userId}`);
    return response.data;
  },

  approveSubmission: async (data: KYCApprovalRequest): Promise<void> => {
    await apiClient.post('/admin/kyc/review', data);
  },

  rejectSubmission: async (data: KYCApprovalRequest): Promise<void> => {
    await apiClient.post('/admin/kyc/review', data);
  },
};


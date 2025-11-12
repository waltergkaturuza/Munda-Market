import apiClient from './client';

export interface Payment {
  payment_id: number;
  order_id: number;
  buyer_user_id: number;
  buyer_name?: string;
  amount_usd: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_reference?: string;
  created_at: string;
  processed_at?: string;
}

export interface PaymentDetail extends Payment {
  order_details?: any;
  buyer_details?: any;
}

export const paymentsApi = {
  getAll: async (): Promise<Payment[]> => {
    const response = await apiClient.get<Payment[]>('/admin/payments');
    return response.data;
  },

  getById: async (id: number): Promise<PaymentDetail> => {
    const response = await apiClient.get<PaymentDetail>(`/admin/payments/${id}`);
    return response.data;
  },

  reconcile: async (paymentId: number, transactionRef: string): Promise<void> => {
    await apiClient.post(`/admin/payments/${paymentId}/reconcile`, {
      transaction_reference: transactionRef,
    });
  },

  refund: async (paymentId: number, reason: string): Promise<void> => {
    await apiClient.post(`/admin/payments/${paymentId}/refund`, { reason });
  },
};


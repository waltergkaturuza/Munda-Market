import apiClient from './client';
import { Order } from '@/types';

export interface UpdateOrderStatusRequest {
  order_id: number;
  status: string;
  notes?: string;
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (data: UpdateOrderStatusRequest): Promise<void> => {
    await apiClient.patch(`/orders/${data.order_id}/status`, {
      status: data.status,
      notes: data.notes,
    });
  },

  getByStatus: async (status: string): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(`/orders?status=${status}`);
    return response.data;
  },
};


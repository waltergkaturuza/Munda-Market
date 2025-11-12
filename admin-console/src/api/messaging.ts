import apiClient from './client';
import { Message } from '@/types';

export interface SendMessageRequest {
  recipient_user_ids: number[];
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  message_body: string;
  template_id?: string;
}

export const messagingApi = {
  getMessages: async (): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>('/admin/messages');
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<void> => {
    await apiClient.post('/admin/messages/send', data);
  },

  getTemplates: async () => {
    const response = await apiClient.get('/admin/messages/templates');
    return response.data;
  },
};


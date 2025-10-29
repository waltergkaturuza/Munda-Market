import { api } from './auth';

export async function previewOrder(payload) {
  const { data } = await api.post('/orders/preview', payload);
  return data;
}

export async function submitOrder(payload) {
  const { data } = await api.post('/orders', payload);
  return data;
}



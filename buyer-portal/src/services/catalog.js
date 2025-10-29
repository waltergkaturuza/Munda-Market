import { api } from './auth';

export async function fetchListings(params) {
  const response = await api.get('/listings', { params });
  return response.data;
}



import { api } from './auth';

export async function fetchInvoices(params) {
  const { data } = await api.get('/invoices', { params });
  return data;
}

export async function fetchInvoiceDetail(id) {
  const { data } = await api.get(`/invoices/${id}`);
  return data;
}

export async function downloadInvoice(id) {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}



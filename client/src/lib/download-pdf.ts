import { api } from './axios';

export async function downloadQuotationPdf(quotationId: string, filename: string) {
  const res = await api.get(`/quotations/${quotationId}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function downloadClientPdf(filename: string) {
  const clientToken = localStorage.getItem('clientToken');
  const res = await api.get('/client/pdf', {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

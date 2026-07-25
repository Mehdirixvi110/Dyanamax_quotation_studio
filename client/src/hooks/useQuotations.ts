import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Quotation, QuotationItem, QuotationStatus, PaginationMeta } from '../types';
import toast from 'react-hot-toast';

// ===== Types =====

interface UseQuotationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuotationStatus | '';
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface QuotationsResponse {
  quotations: Quotation[];
  meta: PaginationMeta;
}

interface QuotationDetailResponse extends Quotation {
  items?: QuotationItem[];
  clientAccess?: {
    accessCode: string;
    isEnabled: boolean;
    isLocked: boolean;
    accessCount: number;
    lastAccessedAt?: string;
  };
  versions?: Array<{
    id: string;
    versionNumber: number;
    publishedAt: string;
    publisher?: { fullName: string };
  }>;
}

interface CreateQuotationData {
  title: string;
  customerName: string;
  currencyId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxPercent?: number;
  taxApplication?: 'on_total' | 'on_line_items' | 'none';
  expiryDays?: number;
  notes?: string;
  termsAndConditions?: string;
}

interface UpdateQuotationData extends Partial<CreateQuotationData> {}

interface AddQuotationItemData {
  itemId?: string;
  title?: string;
  description?: string;
  unitName?: string;
  quantity?: number;
  rates?: Array<{
    rateTierId: string;
    brandId?: string;
    brandName?: string;
    rate: number;
    isSelected?: boolean;
  }>;
}

interface UpdateQuotationItemData {
  quantity?: number;
  isSelected?: boolean;
  isLocked?: boolean;
  title?: string;
  description?: string;
}

interface PublishResponse {
  accessCode: string;
  password: string;
}

// ===== Quotation List =====

export function useQuotations({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  customerId = '',
  dateFrom = '',
  dateTo = '',
}: UseQuotationsParams = {}) {
  return useQuery<QuotationsResponse>({
    queryKey: ['quotations', { page, limit, search, status, customerId, dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (customerId) params.set('customerId', customerId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await api.get(`/quotations?${params.toString()}`);
      const result = res.data.data;
      return {
        quotations: Array.isArray(result) ? result : (result?.data ?? []),
        meta: result?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    },
  });
}

// ===== Quotation Detail =====

export function useQuotation(id: string) {
  return useQuery<QuotationDetailResponse>({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const res = await api.get(`/quotations/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

// ===== Create Quotation =====

export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      const res = await api.post('/quotations', data);
      return res.data.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create quotation');
    },
  });
}

// ===== Update Quotation =====

export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuotationData }) => {
      const res = await api.put(`/quotations/${id}`, data);
      return res.data.data as Quotation;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] });
      toast.success('Quotation updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update quotation');
    },
  });
}

// ===== Delete Quotation =====

export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete quotation');
    },
  });
}

// ===== Duplicate Quotation =====

export function useDuplicateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/duplicate`);
      return res.data.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation duplicated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to duplicate quotation');
    },
  });
}

// ===== Quotation Items =====

export function useAddQuotationItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotationId, data }: { quotationId: string; data: AddQuotationItemData }) => {
      const res = await api.post(`/quotations/${quotationId}/items`, data);
      return res.data.data as QuotationItem;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.quotationId] });
      toast.success('Item added to quotation');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to add item');
    },
  });
}

export function useUpdateQuotationItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quotationId,
      itemId,
      data,
    }: {
      quotationId: string;
      itemId: string;
      data: UpdateQuotationItemData;
    }) => {
      const res = await api.put(`/quotations/${quotationId}/items/${itemId}`, data);
      return res.data.data as QuotationItem;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.quotationId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update item');
    },
  });
}

export function useDeleteQuotationItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotationId, itemId }: { quotationId: string; itemId: string }) => {
      await api.delete(`/quotations/${quotationId}/items/${itemId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.quotationId] });
      toast.success('Item removed from quotation');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to remove item');
    },
  });
}

// ===== Quotation Actions =====

export function usePublishQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/publish`);
      return res.data.data as PublishResponse;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      toast.success('Quotation published successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to publish quotation');
    },
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/approve`);
      return res.data.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      toast.success('Quotation approved');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to approve quotation');
    },
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/reject`);
      return res.data.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      toast.success('Quotation rejected');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to reject quotation');
    },
  });
}

export function useArchiveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/quotations/${id}/archive`);
      return res.data.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      toast.success('Quotation archived');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to archive quotation');
    },
  });
}

// ===== Client Portal Hooks =====

interface ClientQuotationResponse {
  quotation: QuotationDetailResponse;
  companySettings: {
    companyName: string;
    companyEmail: string | null;
    companyPhone: string | null;
    companyAddress: string | null;
    logoUrl: string | null;
  };
}

export function useClientQuotation() {
  return useQuery<ClientQuotationResponse>({
    queryKey: ['client-quotation'],
    queryFn: async () => {
      const clientToken = localStorage.getItem('clientToken');
      const res = await api.get('/client/quotation', {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      return res.data.data;
    },
    enabled: !!localStorage.getItem('clientToken'),
  });
}

export function useUpdateClientSelections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selections: Array<{ quotationItemId: string; isSelected: boolean; selectedRateId?: string }>) => {
      const clientToken = localStorage.getItem('clientToken');
      const res = await api.put(
        '/client/selections',
        { selections },
        { headers: { Authorization: `Bearer ${clientToken}` } },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-quotation'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update selections');
    },
  });
}

export function useSubmitClientQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const clientToken = localStorage.getItem('clientToken');
      const res = await api.post(
        '/client/submit',
        {},
        { headers: { Authorization: `Bearer ${clientToken}` } },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-quotation'] });
      toast.success('Quotation submitted successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to submit quotation');
    },
  });
}

// ===== Search Items (for Add Item Dialog) =====

export function useSearchItems(query: string) {
  return useQuery({
    queryKey: ['items-search', query],
    queryFn: async () => {
      const res = await api.get(`/items?search=${encodeURIComponent(query)}&limit=20`);
      const result = res.data.data;
      const items = Array.isArray(result) ? result : (result?.data ?? []);
      return items as Array<{
        id: string;
        title: string;
        description: string | null;
        category?: { name: string };
        unit?: { name: string };
        rates?: Array<{
          id: string;
          rateTierId: string;
          brandId: string | null;
          rate: number;
          rateTier?: { name: string };
          brand?: { name: string };
        }>;
      }>;
    },
    enabled: query.length >= 1,
  });
}

// ===== Currencies =====

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await api.get('/currencies');
      const result = res.data.data;
      const currencies = Array.isArray(result) ? result : (result?.data ?? []);
      return currencies as Array<{ id: string; code: string; symbol: string; name: string }>;
    },
  });
}

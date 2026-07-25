import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { Item, PaginationMeta, RateTier, Brand, Unit } from '../types';
import toast from 'react-hot-toast';

interface UseItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

interface ItemsResponse {
  items: Item[];
  meta: PaginationMeta;
}

export function useItems({ page = 1, limit = 20, search = '', categoryId = '' }: UseItemsParams = {}) {
  return useQuery<ItemsResponse>({
    queryKey: ['items', { page, limit, search, categoryId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);

      const res = await api.get(`/items?${params.toString()}`);
      const result = res.data.data;
      return {
        items: Array.isArray(result) ? result : (result?.data ?? []),
        meta: result?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    },
  });
}

export function useItem(id: string | null) {
  return useQuery<Item>({
    queryKey: ['items', id],
    queryFn: async () => {
      const res = await api.get(`/items/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

interface CreateItemData {
  title: string;
  description?: string;
  categoryId: string;
  unitId: string;
  rates: { rateTierId: string; brandId?: string; rate: number }[];
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const res = await api.post('/items', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create item');
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateItemData> }) => {
      const res = await api.put(`/items/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update item');
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete item');
    },
  });
}

export function useDuplicateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/items/${id}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item duplicated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to duplicate item');
    },
  });
}

// Supporting data hooks

export function useRateTiers() {
  return useQuery<RateTier[]>({
    queryKey: ['rate-tiers'],
    queryFn: async () => {
      const res = await api.get('/rate-tiers');
      const result = res.data.data;
      return Array.isArray(result) ? result : (result?.data ?? []);
    },
  });
}

export function useBrands(rateTierId?: string) {
  return useQuery<Brand[]>({
    queryKey: ['brands', rateTierId],
    queryFn: async () => {
      const url = rateTierId ? `/brands?rateTierId=${rateTierId}` : '/brands';
      const res = await api.get(url);
      const result = res.data.data;
      return Array.isArray(result) ? result : (result?.data ?? []);
    },
  });
}

export function useUnits() {
  return useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await api.get('/units');
      const result = res.data.data;
      return Array.isArray(result) ? result : (result?.data ?? []);
    },
  });
}

// ===== Rate Tiers CRUD =====

export function useCreateRateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; sortOrder?: number }) => {
      const res = await api.post('/rate-tiers', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-tiers'] });
      toast.success('Rate tier created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create rate tier');
    },
  });
}

export function useUpdateRateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; description: string; sortOrder: number }> }) => {
      const res = await api.put(`/rate-tiers/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-tiers'] });
      toast.success('Rate tier updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update rate tier');
    },
  });
}

export function useDeleteRateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/rate-tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-tiers'] });
      toast.success('Rate tier deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete rate tier');
    },
  });
}

// ===== Brands CRUD =====

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; rateTierId: string }) => {
      const res = await api.post('/brands', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create brand');
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; description: string; rateTierId: string }> }) => {
      const res = await api.put(`/brands/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update brand');
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete brand');
    },
  });
}

// ===== Units CRUD =====

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; fullName?: string }) => {
      const res = await api.post('/units', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create unit');
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; fullName: string }> }) => {
      const res = await api.put(`/units/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update unit');
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete unit');
    },
  });
}

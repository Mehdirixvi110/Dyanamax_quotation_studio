import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import toast from 'react-hot-toast';

export interface CompanySettings {
  id: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  logoUrl: string | null;
  stampUrl: string | null;
  signatureUrl: string | null;
  defaultCurrency: string;
  defaultTaxPercent: number;
  defaultExpiryDays: number;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface UpdateSettingsData {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  defaultCurrency?: string;
  defaultTaxPercent?: number;
  defaultExpiryDays?: number;
  termsAndConditions?: string;
}

interface CreateCurrencyData {
  code: string;
  symbol: string;
  name: string;
}

interface UpdateCurrencyData {
  code?: string;
  symbol?: string;
  name?: string;
  isActive?: boolean;
}

export function useSettings() {
  return useQuery<CompanySettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsData) => {
      const res = await api.put('/settings', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update settings');
    },
  });
}

export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await api.get('/currencies');
      const result = res.data.data;
      return Array.isArray(result) ? result : (result?.data ?? []);
    },
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCurrencyData) => {
      const res = await api.post('/currencies', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create currency');
    },
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCurrencyData }) => {
      const res = await api.put(`/currencies/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update currency');
    },
  });
}

export function useDeleteCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/currencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Currency deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete currency');
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import toast from 'react-hot-toast';

// ===== Types =====

export type MeasurementType = 'AREA' | 'VOLUME' | 'LENGTH' | 'PERIMETER' | 'WEIGHT' | 'CUSTOM';

export interface MeasurementEntry {
  id: string;
  templateId: string;
  roomName: string;
  measurementType: MeasurementType;
  length: number | null;
  width: number | null;
  height: number | null;
  quantity: number;
  deduction: number;
  computedValue: number;
  unitName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementTemplate {
  id: string;
  name: string;
  description: string | null;
  projectReference: string | null;
  entriesCount: number;
  totalComputed: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementTemplateDetail {
  id: string;
  name: string;
  description: string | null;
  projectReference: string | null;
  entries: MeasurementEntry[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TemplatesResponse {
  templates: MeasurementTemplate[];
  meta: PaginationMeta;
}

interface UseTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ===== Template Hooks =====

export function useTemplates({ page = 1, limit = 20, search = '' }: UseTemplatesParams = {}) {
  return useQuery<TemplatesResponse>({
    queryKey: ['measurement-templates', { page, limit, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);

      const res = await api.get(`/measurements?${params.toString()}`);
      const result = res.data.data;
      return {
        templates: Array.isArray(result) ? result : (result?.data ?? []),
        meta: result?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    },
  });
}

export function useTemplate(id: string) {
  return useQuery<MeasurementTemplateDetail>({
    queryKey: ['measurement-template', id],
    queryFn: async () => {
      const res = await api.get(`/measurements/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

interface CreateTemplateData {
  name: string;
  description?: string;
  projectReference?: string;
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const res = await api.post('/measurements', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to create template');
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) => {
      const res = await api.put(`/measurements/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      queryClient.invalidateQueries({ queryKey: ['measurement-template'] });
      toast.success('Template updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update template');
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete template');
    },
  });
}

// ===== Entry Hooks =====

interface CreateEntryData {
  roomName: string;
  measurementType: MeasurementType;
  length?: number;
  width?: number;
  height?: number;
  quantity?: number;
  deduction?: number;
  unitName: string;
  notes?: string;
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: CreateEntryData }) => {
      const res = await api.post(`/measurements/${templateId}/entries`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-template'] });
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      toast.success('Entry added successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to add entry');
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      entryId,
      data,
    }: {
      templateId: string;
      entryId: string;
      data: Partial<CreateEntryData>;
    }) => {
      const res = await api.put(`/measurements/${templateId}/entries/${entryId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-template'] });
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      toast.success('Entry updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to update entry');
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, entryId }: { templateId: string; entryId: string }) => {
      await api.delete(`/measurements/${templateId}/entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-template'] });
      queryClient.invalidateQueries({ queryKey: ['measurement-templates'] });
      toast.success('Entry deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Failed to delete entry');
    },
  });
}

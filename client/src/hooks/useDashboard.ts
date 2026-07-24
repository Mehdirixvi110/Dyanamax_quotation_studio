import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { DashboardStats, MonthlyActivity, Quotation } from '../types';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'stats'],
    queryFn: async () => {
      const res = await api.get('/analytics/stats');
      return res.data.data;
    },
  });
}

export function useRecentQuotations() {
  return useQuery<Quotation[]>({
    queryKey: ['recent-quotations'],
    queryFn: async () => {
      const res = await api.get('/quotations?limit=5&sortBy=createdAt&order=desc');
      // The quotations list endpoint returns { data: [...], meta: {...} }
      // wrapped by TransformInterceptor: { success, data: { data: [...], meta } }
      const result = res.data.data;
      // Handle both shapes: could be the array directly or { data: [...], meta }
      if (Array.isArray(result)) return result;
      if (result && Array.isArray(result.data)) return result.data;
      return [];
    },
  });
}

export function useMonthlyActivity() {
  return useQuery<MonthlyActivity[]>({
    queryKey: ['analytics', 'monthly'],
    queryFn: async () => {
      const res = await api.get('/analytics/monthly');
      const result = res.data.data;
      return Array.isArray(result) ? result : [];
    },
  });
}

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
      return res.data.data.data;
    },
  });
}

export function useMonthlyActivity() {
  return useQuery<MonthlyActivity[]>({
    queryKey: ['analytics', 'monthly'],
    queryFn: async () => {
      const res = await api.get('/analytics/monthly');
      return res.data.data;
    },
  });
}

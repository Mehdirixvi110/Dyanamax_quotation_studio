import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface TopItem {
  title: string;
  usageCount: number;
  totalRevenue: number;
}

export interface RevenueByCustomer {
  customerName: string;
  quotationCount: number;
  totalRevenue: number;
}

export function useStatusBreakdown() {
  return useQuery<StatusBreakdown[]>({
    queryKey: ['analytics', 'status-breakdown'],
    queryFn: async () => {
      const res = await api.get('/analytics/status-breakdown');
      return res.data.data;
    },
  });
}

export function useTopItems() {
  return useQuery<TopItem[]>({
    queryKey: ['analytics', 'top-items'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-items');
      return res.data.data;
    },
  });
}

export function useRevenueByCustomer() {
  return useQuery<RevenueByCustomer[]>({
    queryKey: ['analytics', 'revenue-by-customer'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue-by-customer');
      return res.data.data;
    },
  });
}

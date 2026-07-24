import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface AuditLog {
  id: string;
  userId: string | null;
  actorType: 'ADMIN' | 'CLIENT' | 'SYSTEM';
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  metadata: any;
  createdAt: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseAuditLogsParams {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const { page = 1, limit = 20, entityType, action } = params;

  return useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', { page, limit, entityType, action }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (entityType) searchParams.set('entityType', entityType);
      if (action) searchParams.set('action', action);

      const res = await api.get(`/audit-logs?${searchParams.toString()}`);
      return res.data.data;
    },
  });
}

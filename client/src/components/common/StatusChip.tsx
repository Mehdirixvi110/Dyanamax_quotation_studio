import { Chip } from '@mui/material';
import type { QuotationStatus } from '../../types';

const statusColors: Record<
  QuotationStatus,
  'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
> = {
  draft: 'default',
  published: 'info',
  client_viewed: 'secondary',
  client_submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  expired: 'default',
  archived: 'default',
};

const statusLabels: Record<QuotationStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  client_viewed: 'Viewed',
  client_submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  archived: 'Archived',
};

interface StatusChipProps {
  status: QuotationStatus;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

export function StatusChip({ status, size = 'small', variant = 'outlined' }: StatusChipProps) {
  const normalizedStatus = (status?.toLowerCase() ?? 'draft') as QuotationStatus;
  return (
    <Chip
      label={statusLabels[normalizedStatus] ?? status}
      color={statusColors[normalizedStatus] ?? 'default'}
      size={size}
      variant={variant}
    />
  );
}

import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  Typography,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { useAuditLogs, type AuditLog } from '../hooks/useAuditLogs';

const entityTypeOptions = [
  { value: '', label: 'All Entities' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'item', label: 'Item' },
  { value: 'customer', label: 'Customer' },
  { value: 'settings', label: 'Settings' },
  { value: 'category', label: 'Category' },
];

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'publish', label: 'Publish' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'login', label: 'Login' },
  { value: 'submit', label: 'Submit' },
];

const actionColorMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  publish: 'success',
  approve: 'success',
  reject: 'error',
  login: 'default',
  submit: 'warning',
};

const columns: Column<AuditLog>[] = [
  {
    id: 'time',
    label: 'Time',
    minWidth: 140,
    render: (row) => (
      <Typography variant="body2" color="text.secondary">
        {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
      </Typography>
    ),
  },
  {
    id: 'actor',
    label: 'Actor',
    minWidth: 100,
    render: (row) => (
      <Chip
        label={row.actorType}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    id: 'action',
    label: 'Action',
    minWidth: 100,
    render: (row) => (
      <Chip
        label={row.action}
        size="small"
        color={actionColorMap[row.action] || 'default'}
      />
    ),
  },
  {
    id: 'entity',
    label: 'Entity',
    minWidth: 160,
    render: (row) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.entityType}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.entityId.substring(0, 8)}...
        </Typography>
      </Box>
    ),
  },
  {
    id: 'details',
    label: 'Details',
    minWidth: 200,
    render: (row) => {
      if (!row.oldValue && !row.newValue) {
        return (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        );
      }
      return (
        <Box sx={{ maxWidth: 300 }}>
          {row.newValue && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {typeof row.newValue === 'object'
                ? JSON.stringify(row.newValue).substring(0, 80) + '...'
                : String(row.newValue).substring(0, 80)}
            </Typography>
          )}
        </Box>
      );
    },
  },
];

export function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useAuditLogs({
    page: page + 1,
    limit: rowsPerPage,
    entityType: entityType || undefined,
    action: action || undefined,
  });

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="Track all system changes"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Entity Type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {entityTypeOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {actionOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable<AuditLog>
        columns={columns}
        rows={logs}
        loading={isLoading}
        emptyMessage="No audit logs found"
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => {
          setRowsPerPage(rpp);
          setPage(0);
        }}
        getRowKey={(row) => row.id}
      />
    </Box>
  );
}

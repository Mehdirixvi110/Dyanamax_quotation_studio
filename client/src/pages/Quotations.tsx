import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import {
  useQuotations,
  useDeleteQuotation,
  useDuplicateQuotation,
  useCreateQuotation,
  useCurrencies,
} from '../hooks/useQuotations';
import { useCustomers } from '../hooks/useCustomers';
import type { Quotation, QuotationStatus } from '../types';

const STATUS_OPTIONS: { value: QuotationStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'client_viewed', label: 'Client Viewed' },
  { value: 'client_submitted', label: 'Client Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function QuotationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | ''>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('');

  const { data, isLoading } = useQuotations({
    page: page + 1,
    limit,
    search,
    status: statusFilter,
  });
  const deleteMutation = useDeleteQuotation();
  const duplicateMutation = useDuplicateQuotation();
  const createMutation = useCreateQuotation();
  const { data: currencies } = useCurrencies();
  const { data: customersData } = useCustomers({ limit: 100 });

  const columns: Column<Quotation>[] = [
    {
      id: 'referenceNumber',
      label: 'Reference #',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.referenceNumber}
        </Typography>
      ),
    },
    {
      id: 'title',
      label: 'Title',
      minWidth: 180,
      render: (row) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {row.title}
        </Typography>
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      minWidth: 140,
      render: (row) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
          {row.customerName}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'grandTotal',
      label: 'Grand Total',
      minWidth: 120,
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {formatCurrency(row.grandTotal)}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 100,
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/quotations/${row.id}`)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton
              size="small"
              onClick={() => duplicateMutation.mutate(row.id)}
              disabled={duplicateMutation.isPending}
            >
              <DuplicateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleCreate = () => {
    if (!newTitle.trim() || !newCustomerName.trim()) return;

    const defaultCurrency = currencies?.[0];
    createMutation.mutate(
      {
        title: newTitle.trim(),
        customerName: newCustomerName.trim(),
        currencyId: selectedCurrencyId || defaultCurrency?.id || '',
        customerId: selectedCustomerId || undefined,
      },
      {
        onSuccess: (quotation) => {
          setCreateOpen(false);
          setNewTitle('');
          setNewCustomerName('');
          setSelectedCustomerId('');
          setSelectedCurrencyId('');
          navigate(`/quotations/${quotation.id}`);
        },
      },
    );
  };

  return (
    <Box>
      <PageHeader
        title="Quotations"
        subtitle="Build, manage, and publish quotations"
        actionLabel="Create Quotation"
        onAction={() => setCreateOpen(true)}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar
          placeholder="Search quotations..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => {
              setStatusFilter(e.target.value as QuotationStatus | '');
              setPage(0);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!isLoading && data?.quotations.length === 0 ? (
        <EmptyState
          title="No quotations yet"
          message="Create your first quotation to get started."
          actionLabel="Create Quotation"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.quotations ?? []}
          loading={isLoading}
          getRowKey={(row) => row.id}
          page={page}
          rowsPerPage={limit}
          totalCount={data?.meta.total}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit) => {
            setLimit(newLimit);
            setPage(0);
          }}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }}
        onCancel={() => setDeleteId(null)}
      />

      {/* Create quotation dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Quotation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Quotation Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Villa Construction - Phase 1"
            />
            <FormControl fullWidth>
              <InputLabel>Customer (optional)</InputLabel>
              <Select
                value={selectedCustomerId}
                label="Customer (optional)"
                onChange={(e) => {
                  const cid = e.target.value;
                  setSelectedCustomerId(cid);
                  const customer = customersData?.customers.find((c) => c.id === cid);
                  if (customer) {
                    setNewCustomerName(customer.name);
                  }
                }}
              >
                <MenuItem value="">— Manual Entry —</MenuItem>
                {customersData?.customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Customer Name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              fullWidth
              required
              placeholder="Enter customer name"
            />
            {currencies && currencies.length > 1 && (
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={selectedCurrencyId || currencies[0]?.id || ''}
                  label="Currency"
                  onChange={(e) => setSelectedCurrencyId(e.target.value)}
                >
                  {currencies.map((cur) => (
                    <MenuItem key={cur.id} value={cur.id}>
                      {cur.code} — {cur.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newTitle.trim() || !newCustomerName.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create & Open'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

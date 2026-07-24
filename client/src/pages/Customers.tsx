import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { DataTable, type Column } from '../components/common/DataTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers';
import type { Customer } from '../types';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  notes: string;
}

const emptyForm: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  company: '',
  notes: '',
};

export function CustomersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Queries & Mutations
  const { data, isLoading } = useCustomers({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      company: customer.company || '',
      notes: customer.notes || '',
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      company: formData.company || undefined,
      notes: formData.notes || undefined,
    };

    if (editingCustomer) {
      await updateMutation.mutateAsync({ id: editingCustomer.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    handleClose();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const columns: Column<Customer>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 160,
      render: (row) => row.name,
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 180,
      render: (row) => row.email || '—',
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 140,
      render: (row) => row.phone || '—',
    },
    {
      id: 'company',
      label: 'Company',
      minWidth: 150,
      render: (row) => row.company || '—',
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle="Manage your client database"
        actionLabel="Add Customer"
        onAction={handleOpenCreate}
      />

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search customers..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
        />
      </Box>

      {/* Data Table */}
      <DataTable<Customer>
        columns={columns}
        rows={data?.customers ?? []}
        loading={isLoading}
        emptyMessage="No customers found. Add your first customer to get started."
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={data?.meta.total}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => {
          setRowsPerPage(rpp);
          setPage(0);
        }}
        getRowKey={(row) => row.id}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add Customer'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData((f) => ({ ...f, company: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

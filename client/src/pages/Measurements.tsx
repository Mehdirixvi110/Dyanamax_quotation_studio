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
  Chip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { DataTable, type Column } from '../components/common/DataTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  type MeasurementTemplate,
} from '../hooks/useMeasurements';

interface TemplateFormData {
  name: string;
  description: string;
  projectReference: string;
}

const emptyForm: TemplateFormData = {
  name: '',
  description: '',
  projectReference: '',
};

export function MeasurementsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>(emptyForm);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MeasurementTemplate | null>(null);

  // Queries & Mutations
  const { data, isLoading } = useTemplates({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });

  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate();

  const handleOpenCreate = () => {
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      projectReference: formData.projectReference || undefined,
    };
    await createMutation.mutateAsync(payload);
    handleClose();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const columns: Column<MeasurementTemplate>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 180,
      render: (row) => row.name,
    },
    {
      id: 'projectReference',
      label: 'Project Reference',
      minWidth: 150,
      render: (row) => row.projectReference || '—',
    },
    {
      id: 'entriesCount',
      label: 'Entries',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Chip label={row.entriesCount} size="small" variant="outlined" />
      ),
    },
    {
      id: 'totalComputed',
      label: 'Total Value',
      minWidth: 120,
      align: 'right',
      render: (row) => row.totalComputed.toFixed(2),
    },
    {
      id: 'createdAt',
      label: 'Created',
      minWidth: 120,
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/measurements/${row.id}`)}>
              <ViewIcon fontSize="small" />
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

  return (
    <Box>
      <PageHeader
        title="Measurements"
        subtitle="Calculate areas, volumes, and manage room measurements"
        actionLabel="Create Template"
        onAction={handleOpenCreate}
      />

      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search by name or project..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
        />
      </Box>

      <DataTable<MeasurementTemplate>
        columns={columns}
        rows={data?.templates ?? []}
        loading={isLoading}
        emptyMessage="No measurement templates found. Create your first template to get started."
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

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Measurement Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Project Reference"
              value={formData.projectReference}
              onChange={(e) => setFormData((f) => ({ ...f, projectReference: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

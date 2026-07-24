import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '../../hooks/useItems';
import type { Unit } from '../../types';

interface UnitFormData {
  name: string;
  fullName: string;
}

const emptyForm: UnitFormData = { name: '', fullName: '' };

export function UnitsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const { data: units, isLoading } = useUnits();
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();

  const handleOpenCreate = () => {
    setEditingUnit(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      fullName: unit.fullName || '',
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingUnit(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      fullName: formData.fullName || undefined,
    };

    if (editingUnit) {
      await updateMutation.mutateAsync({ id: editingUnit.id, data: payload });
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

  const columns: Column<Unit>[] = [
    {
      id: 'name',
      label: 'Abbreviation',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'fullName',
      label: 'Full Name',
      minWidth: 200,
      render: (row) => row.fullName || '—',
    },
    {
      id: 'createdAt',
      label: 'Created',
      minWidth: 140,
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Unit
        </Button>
      </Box>

      <DataTable<Unit>
        columns={columns}
        rows={units ?? []}
        loading={isLoading}
        emptyMessage="No units found. Add measurement units like sqft, rft, etc."
        showPagination={false}
        getRowKey={(row) => row.id}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Abbreviation"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              required
              fullWidth
              placeholder="e.g., sqft, rft, nos"
            />
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData((f) => ({ ...f, fullName: e.target.value }))}
              fullWidth
              placeholder="e.g., Square Feet, Running Feet, Numbers"
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
            {isSaving ? 'Saving...' : editingUnit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Unit"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Items using this unit may be affected.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

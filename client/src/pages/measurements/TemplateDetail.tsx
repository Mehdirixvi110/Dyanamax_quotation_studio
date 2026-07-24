import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Paper,
  TextField,
  Stack,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  useTemplate,
  useUpdateTemplate,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  type MeasurementEntry,
  type MeasurementType,
} from '../../hooks/useMeasurements';
import { EntryForm, type EntryFormData } from './EntryForm';

const TYPE_LABELS: Record<MeasurementType, string> = {
  AREA: 'Area',
  VOLUME: 'Volume',
  LENGTH: 'Length',
  PERIMETER: 'Perimeter',
  WEIGHT: 'Weight',
  CUSTOM: 'Custom',
};

const TYPE_COLORS: Record<MeasurementType, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  AREA: 'primary',
  VOLUME: 'secondary',
  LENGTH: 'success',
  PERIMETER: 'info',
  WEIGHT: 'warning',
  CUSTOM: 'error',
};

function formatDimensions(entry: MeasurementEntry): string {
  const parts: string[] = [];
  if (entry.length != null) parts.push(`L:${entry.length}`);
  if (entry.width != null) parts.push(`W:${entry.width}`);
  if (entry.height != null) parts.push(`H:${entry.height}`);
  return parts.length > 0 ? parts.join(' × ') : '—';
}

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: template, isLoading } = useTemplate(id!);
  const updateTemplateMutation = useUpdateTemplate();
  const createEntryMutation = useCreateEntry();
  const updateEntryMutation = useUpdateEntry();
  const deleteEntryMutation = useDeleteEntry();

  // Inline edit state
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaName, setMetaName] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaProject, setMetaProject] = useState('');

  // Entry form state
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MeasurementEntry | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MeasurementEntry | null>(null);

  const handleStartEditMeta = () => {
    if (template) {
      setMetaName(template.name);
      setMetaDescription(template.description || '');
      setMetaProject(template.projectReference || '');
      setEditingMeta(true);
    }
  };

  const handleSaveMeta = async () => {
    if (!id) return;
    await updateTemplateMutation.mutateAsync({
      id,
      data: {
        name: metaName,
        description: metaDescription || undefined,
        projectReference: metaProject || undefined,
      },
    });
    setEditingMeta(false);
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setEntryFormOpen(true);
  };

  const handleEditEntry = (entry: MeasurementEntry) => {
    setEditingEntry(entry);
    setEntryFormOpen(true);
  };

  const handleEntrySubmit = async (data: EntryFormData) => {
    if (!id) return;
    if (editingEntry) {
      await updateEntryMutation.mutateAsync({
        templateId: id,
        entryId: editingEntry.id,
        data,
      });
    } else {
      await createEntryMutation.mutateAsync({ templateId: id, data });
    }
    setEntryFormOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async () => {
    if (!id || !deleteTarget) return;
    await deleteEntryMutation.mutateAsync({ templateId: id, entryId: deleteTarget.id });
    setDeleteTarget(null);
  };

  // Compute totals by type
  const totalsByType = (template?.entries ?? []).reduce<Record<string, { total: number; unit: string }>>(
    (acc, entry) => {
      const key = entry.measurementType;
      if (!acc[key]) {
        acc[key] = { total: 0, unit: entry.unitName };
      }
      acc[key].total += Number(entry.computedValue);
      return acc;
    },
    {},
  );

  const columns: Column<MeasurementEntry>[] = [
    {
      id: 'roomName',
      label: 'Room',
      minWidth: 140,
      render: (row) => row.roomName,
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      render: (row) => (
        <Chip
          label={TYPE_LABELS[row.measurementType]}
          size="small"
          color={TYPE_COLORS[row.measurementType]}
          variant="outlined"
        />
      ),
    },
    {
      id: 'dimensions',
      label: 'Dimensions',
      minWidth: 140,
      render: (row) => formatDimensions(row),
    },
    {
      id: 'quantity',
      label: 'Qty',
      minWidth: 60,
      align: 'center',
      render: (row) => row.quantity,
    },
    {
      id: 'deduction',
      label: 'Deduction',
      minWidth: 90,
      align: 'right',
      render: (row) => Number(row.deduction).toFixed(3),
    },
    {
      id: 'computedValue',
      label: 'Computed Value',
      minWidth: 130,
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {Number(row.computedValue).toFixed(3)}
        </Typography>
      ),
    },
    {
      id: 'unit',
      label: 'Unit',
      minWidth: 70,
      render: (row) => row.unitName,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditEntry(row)}>
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

  if (!template) {
    return (
      <Box>
        <Typography color="error">Template not found.</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/measurements')} sx={{ mt: 2 }}>
          Back to Measurements
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/measurements')}>
          <BackIcon />
        </IconButton>
        {editingMeta ? (
          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Template Name"
                value={metaName}
                onChange={(e) => setMetaName(e.target.value)}
                size="small"
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Description"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Project Reference"
                    value={metaProject}
                    onChange={(e) => setMetaProject(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveMeta}
                  disabled={!metaName.trim() || updateTemplateMutation.isPending}
                >
                  Save
                </Button>
                <Button size="small" onClick={() => setEditingMeta(false)}>
                  Cancel
                </Button>
              </Box>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4">{template.name}</Typography>
              <Tooltip title="Edit template details">
                <IconButton size="small" onClick={handleStartEditMeta}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {template.description && (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {template.description}
              </Typography>
            )}
            {template.projectReference && (
              <Typography variant="body2" color="text.secondary">
                Project: {template.projectReference}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Add Entry Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddEntry}>
          Add Entry
        </Button>
      </Box>

      {/* Entries Table */}
      <DataTable<MeasurementEntry>
        columns={columns}
        rows={template.entries}
        emptyMessage="No entries yet. Add your first measurement entry."
        showPagination={false}
        getRowKey={(row) => row.id}
      />

      {/* Summary by Type */}
      {Object.keys(totalsByType).length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Summary
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(totalsByType).map(([type, info]) => (
              <Grid size={{ xs: 6, md: 3 }} key={type}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total {TYPE_LABELS[type as MeasurementType]}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {info.total.toFixed(2)} {info.unit}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Entry Form Dialog */}
      <EntryForm
        open={entryFormOpen}
        onClose={() => {
          setEntryFormOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={handleEntrySubmit}
        entry={editingEntry}
        loading={createEntryMutation.isPending || updateEntryMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Entry"
        message={`Are you sure you want to delete the entry for "${deleteTarget?.roomName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteEntryMutation.isPending}
      />
    </Box>
  );
}

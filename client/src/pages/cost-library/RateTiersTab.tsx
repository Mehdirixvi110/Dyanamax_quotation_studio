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
  MenuItem,
  Stack,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  useRateTiers,
  useBrands,
  useCreateRateTier,
  useUpdateRateTier,
  useDeleteRateTier,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from '../../hooks/useItems';
import type { RateTier, Brand } from '../../types';

interface TierFormData {
  name: string;
  description: string;
  sortOrder: number;
}

interface BrandFormData {
  name: string;
  description: string;
  rateTierId: string;
}

const emptyTierForm: TierFormData = { name: '', description: '', sortOrder: 0 };
const emptyBrandForm: BrandFormData = { name: '', description: '', rateTierId: '' };

export function RateTiersTab() {
  // Tier state
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<RateTier | null>(null);
  const [tierForm, setTierForm] = useState<TierFormData>(emptyTierForm);
  const [deleteTierTarget, setDeleteTierTarget] = useState<RateTier | null>(null);

  // Brand state
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState<BrandFormData>(emptyBrandForm);
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<Brand | null>(null);

  // Queries
  const { data: rateTiers, isLoading: tiersLoading } = useRateTiers();
  const { data: brands, isLoading: brandsLoading } = useBrands();

  // Tier mutations
  const createTierMutation = useCreateRateTier();
  const updateTierMutation = useUpdateRateTier();
  const deleteTierMutation = useDeleteRateTier();

  // Brand mutations
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  // === Tier handlers ===
  const handleOpenCreateTier = () => {
    setEditingTier(null);
    setTierForm(emptyTierForm);
    setTierDialogOpen(true);
  };

  const handleOpenEditTier = (tier: RateTier) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      description: tier.description || '',
      sortOrder: tier.sortOrder,
    });
    setTierDialogOpen(true);
  };

  const handleCloseTier = () => {
    setTierDialogOpen(false);
    setEditingTier(null);
    setTierForm(emptyTierForm);
  };

  const handleSubmitTier = async () => {
    const payload = {
      name: tierForm.name,
      description: tierForm.description || undefined,
      sortOrder: tierForm.sortOrder,
    };
    if (editingTier) {
      await updateTierMutation.mutateAsync({ id: editingTier.id, data: payload });
    } else {
      await createTierMutation.mutateAsync(payload);
    }
    handleCloseTier();
  };

  const handleDeleteTier = async () => {
    if (deleteTierTarget) {
      await deleteTierMutation.mutateAsync(deleteTierTarget.id);
      setDeleteTierTarget(null);
    }
  };

  // === Brand handlers ===
  const handleOpenCreateBrand = (tierId?: string) => {
    setEditingBrand(null);
    setBrandForm({ ...emptyBrandForm, rateTierId: tierId || '' });
    setBrandDialogOpen(true);
  };

  const handleOpenEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      description: brand.description || '',
      rateTierId: brand.rateTierId,
    });
    setBrandDialogOpen(true);
  };

  const handleCloseBrand = () => {
    setBrandDialogOpen(false);
    setEditingBrand(null);
    setBrandForm(emptyBrandForm);
  };

  const handleSubmitBrand = async () => {
    const payload = {
      name: brandForm.name,
      description: brandForm.description || undefined,
      rateTierId: brandForm.rateTierId,
    };
    if (editingBrand) {
      await updateBrandMutation.mutateAsync({ id: editingBrand.id, data: payload });
    } else {
      await createBrandMutation.mutateAsync(payload);
    }
    handleCloseBrand();
  };

  const handleDeleteBrand = async () => {
    if (deleteBrandTarget) {
      await deleteBrandMutation.mutateAsync(deleteBrandTarget.id);
      setDeleteBrandTarget(null);
    }
  };

  // === Rate Tiers Table ===
  const tierColumns: Column<RateTier>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 160,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      render: (row) => row.description || '—',
    },
    {
      id: 'sortOrder',
      label: 'Sort Order',
      minWidth: 100,
      align: 'center',
      render: (row) => row.sortOrder,
    },
    {
      id: 'brands',
      label: 'Brands',
      minWidth: 200,
      render: (row) => {
        const tierBrands = brands?.filter((b) => b.rateTierId === row.id) ?? [];
        if (tierBrands.length === 0) return <Typography variant="caption" color="text.secondary">No brands</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tierBrands.map((b) => (
              <Chip key={b.id} label={b.name} size="small" variant="outlined" />
            ))}
          </Box>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 140,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Add Brand">
            <IconButton size="small" color="primary" onClick={() => handleOpenCreateBrand(row.id)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEditTier(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteTierTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // === Brands Table ===
  const brandColumns: Column<Brand>[] = [
    {
      id: 'name',
      label: 'Brand Name',
      minWidth: 160,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      render: (row) => row.description || '—',
    },
    {
      id: 'rateTier',
      label: 'Rate Tier',
      minWidth: 140,
      render: (row) => {
        const tier = rateTiers?.find((t) => t.id === row.rateTierId);
        return <Chip label={tier?.name || '—'} size="small" variant="outlined" />;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEditBrand(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteBrandTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const isLoading = tiersLoading || brandsLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isTierSaving = createTierMutation.isPending || updateTierMutation.isPending;
  const isBrandSaving = createBrandMutation.isPending || updateBrandMutation.isPending;

  return (
    <Box>
      {/* Rate Tiers Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Rate Tiers</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateTier}>
            Add Rate Tier
          </Button>
        </Box>
        <DataTable<RateTier>
          columns={tierColumns}
          rows={rateTiers ?? []}
          loading={tiersLoading}
          emptyMessage="No rate tiers found. Add your first rate tier."
          showPagination={false}
          getRowKey={(row) => row.id}
        />
      </Box>

      {/* Brands Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Brands</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenCreateBrand()}>
            Add Brand
          </Button>
        </Box>
        <DataTable<Brand>
          columns={brandColumns}
          rows={brands ?? []}
          loading={brandsLoading}
          emptyMessage="No brands found. Add brands under rate tiers."
          showPagination={false}
          getRowKey={(row) => row.id}
        />
      </Box>

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onClose={handleCloseTier} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTier ? 'Edit Rate Tier' : 'Add Rate Tier'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={tierForm.name}
              onChange={(e) => setTierForm((f) => ({ ...f, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={tierForm.description}
              onChange={(e) => setTierForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Sort Order"
              type="number"
              value={tierForm.sortOrder}
              onChange={(e) => setTierForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseTier} disabled={isTierSaving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitTier}
            disabled={!tierForm.name.trim() || isTierSaving}
          >
            {isTierSaving ? 'Saving...' : editingTier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Brand Dialog */}
      <Dialog open={brandDialogOpen} onClose={handleCloseBrand} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Brand Name"
              value={brandForm.name}
              onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={brandForm.description}
              onChange={(e) => setBrandForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            {/* Rate Tier Select */}
            <TextField
              select
              label="Rate Tier"
              value={brandForm.rateTierId}
              onChange={(e) => setBrandForm((f) => ({ ...f, rateTierId: e.target.value }))}
              fullWidth
              required
            >
              {rateTiers?.map((tier) => (
                <MenuItem key={tier.id} value={tier.id}>
                  {tier.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseBrand} disabled={isBrandSaving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitBrand}
            disabled={!brandForm.name.trim() || !brandForm.rateTierId || isBrandSaving}
          >
            {isBrandSaving ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Tier Confirmation */}
      <ConfirmDialog
        open={!!deleteTierTarget}
        title="Delete Rate Tier"
        message={`Are you sure you want to delete "${deleteTierTarget?.name}"? All associated brands and item rates may be affected.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteTier}
        onCancel={() => setDeleteTierTarget(null)}
        loading={deleteTierMutation.isPending}
      />

      {/* Delete Brand Confirmation */}
      <ConfirmDialog
        open={!!deleteBrandTarget}
        title="Delete Brand"
        message={`Are you sure you want to delete "${deleteBrandTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteBrand}
        onCancel={() => setDeleteBrandTarget(null)}
        loading={deleteBrandMutation.isPending}
      />
    </Box>
  );
}

import { useState, useRef } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { SearchBar } from '../../components/common/SearchBar';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useItems, useDeleteItem, useDuplicateItem, useImportItems, downloadTemplate, exportItems } from '../../hooks/useItems';
import { useCategories } from '../../hooks/useCategories';
import { ItemFormModal } from './ItemFormModal';
import type { Item } from '../../types';
import toast from 'react-hot-toast';

export function ItemsTab() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  // CSV file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries & Mutations
  const { data, isLoading } = useItems({
    page: page + 1,
    limit: rowsPerPage,
    search,
    categoryId: categoryFilter,
  });

  const { data: categories } = useCategories();
  const deleteMutation = useDeleteItem();
  const duplicateMutation = useDuplicateItem();
  const importMutation = useImportItems();

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = (item: Item) => {
    duplicateMutation.mutate(item.id);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleExportItems = async () => {
    try {
      await exportItems();
    } catch {
      toast.error('Failed to export items');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const columns: Column<Item>[] = [
    {
      id: 'title',
      label: 'Title',
      minWidth: 200,
      render: (row) => row.title,
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 140,
      render: (row) => (
        <Chip
          label={row.category?.name || '—'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'unit',
      label: 'Unit',
      minWidth: 80,
      render: (row) => row.unit?.name || '—',
    },
    {
      id: 'rates',
      label: 'Rates',
      minWidth: 120,
      render: (row) => {
        if (!row.rates || row.rates.length === 0) return '—';
        return row.rates
          .map((r) => `${r.rateTier?.name || 'Tier'}: ${r.rate.toLocaleString()}`)
          .join(', ');
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 140,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={() => handleDuplicate(row)}>
              <DuplicateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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

  return (
    <Box>
      {/* Toolbar: Search + Filter + Add */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar
          placeholder="Search items..."
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories?.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ mr: 1 }}>
          Template
        </Button>
        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportItems} sx={{ mr: 1 }}>
          Export
        </Button>
        <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ mr: 1 }}>
          Import CSV
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileUpload} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Item
        </Button>
      </Box>

      {/* Data Table */}
      <DataTable<Item>
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No items found. Add your first item to get started."
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

      {/* Item Form Modal */}
      <ItemFormModal
        open={formOpen}
        onClose={handleCloseForm}
        editData={editingItem}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

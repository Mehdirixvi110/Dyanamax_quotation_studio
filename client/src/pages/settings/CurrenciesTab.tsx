import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
} from '../../hooks/useSettings';
import type { Currency } from '../../hooks/useSettings';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface CurrencyFormState {
  code: string;
  symbol: string;
  name: string;
}

const emptyForm: CurrencyFormState = { code: '', symbol: '', name: '' };

export function CurrenciesTab() {
  const { data: currencies, isLoading } = useCurrencies();
  const createCurrency = useCreateCurrency();
  const updateCurrency = useUpdateCurrency();
  const deleteCurrency = useDeleteCurrency();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CurrencyFormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setForm({ code: currency.code, symbol: currency.symbol, name: currency.name });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateCurrency.mutate(
        { id: editingId, data: { code: form.code.toUpperCase(), symbol: form.symbol, name: form.name } },
        { onSuccess: handleClose },
      );
    } else {
      createCurrency.mutate(
        { code: form.code.toUpperCase(), symbol: form.symbol, name: form.name },
        { onSuccess: handleClose },
      );
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteCurrency.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
        onError: () => setDeleteId(null),
      });
    }
  };

  const isFormValid = form.code.trim().length === 3 && form.symbol.trim() && form.name.trim();
  const isMutating = createCurrency.isPending || updateCurrency.isPending;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Currency
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currencies && currencies.length > 0 ? (
              currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{currency.code}</Typography>
                  </TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={currency.isActive ? 'Active' : 'Inactive'}
                      color={currency.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(currency)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(currency.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No currencies added yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editingId ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 3 } }}
              helperText="3-letter currency code (e.g., PKR, USD)"
            />
            <TextField
              label="Symbol"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              fullWidth
              helperText="e.g., Rs, $, €"
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              helperText="e.g., Pakistani Rupee"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || isMutating}
          >
            {isMutating ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Currency"
        message="Are you sure you want to delete this currency? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
        loading={deleteCurrency.isPending}
      />
    </Box>
  );
}

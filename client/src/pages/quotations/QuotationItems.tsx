import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Chip,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useUpdateQuotationItem, useDeleteQuotationItem } from '../../hooks/useQuotations';
import { api } from '../../lib/axios';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { AddItemDialog } from './AddItemDialog';
import type { QuotationItem } from '../../types';
import toast from 'react-hot-toast';

interface QuotationItemsProps {
  quotationId: string;
  items: QuotationItem[];
  isEditable: boolean;
}

export function QuotationItems({ quotationId, items, isEditable }: QuotationItemsProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});

  const updateItemMutation = useUpdateQuotationItem();
  const deleteItemMutation = useDeleteQuotationItem();

  const getQuantityValue = (itemId: string, originalQty: number): string => {
    if (localQuantities[itemId] !== undefined) return localQuantities[itemId];
    return String(originalQty);
  };

  const handleQuantityInput = (itemId: string, value: string) => {
    setLocalQuantities((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityBlur = (itemId: string) => {
    const value = Number(localQuantities[itemId]);
    if (isNaN(value) || value < 0) {
      setLocalQuantities((prev) => { const next = { ...prev }; delete next[itemId]; return next; });
      return;
    }
    updateItemMutation.mutate({
      quotationId,
      itemId,
      data: { quantity: value },
    });
    setLocalQuantities((prev) => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  const handleSelectionChange = (itemId: string, isSelected: boolean) => {
    updateItemMutation.mutate({
      quotationId,
      itemId,
      data: { isSelected },
    });
  };

  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Paper sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Items ({items.length})
        </Typography>
        {isEditable && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Item
          </Button>
        )}
      </Box>

      {items.length === 0 ? (
        <EmptyState
          title="No items added"
          message="Add items from the cost library or create manual entries."
          actionLabel={isEditable ? 'Add Item' : undefined}
          onAction={isEditable ? () => setAddDialogOpen(true) : undefined}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sortedItems.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 2,
                opacity: item.isSelected ? 1 : 0.6,
                borderColor: item.isSelected ? 'divider' : 'action.disabled',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                {/* Selection checkbox + Lock */}
                {isEditable && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
                    <Checkbox
                      checked={item.isSelected}
                      onChange={(e) => handleSelectionChange(item.id, e.target.checked)}
                      size="small"
                    />
                    <Tooltip title={item.isLocked ? 'Locked — client cannot deselect. Click to unlock.' : 'Unlocked — client can deselect. Click to lock.'}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          updateItemMutation.mutate({
                            quotationId,
                            itemId: item.id,
                            data: { isLocked: !item.isLocked },
                          });
                        }}
                      >
                        {item.isLocked
                          ? <LockIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          : <LockOpenIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        }
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {/* Item details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                    <Chip label={item.unitName} size="small" variant="outlined" />
                  </Box>
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description}
                    </Typography>
                  )}

                  {/* Rates */}
                  {item.rates && item.rates.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {item.rates.map((rate) => (
                        <Chip
                          key={rate.id}
                          label={`${rate.brandName || 'Standard'}: ${rate.rate.toLocaleString()}`}
                          size="small"
                          color={rate.isSelected ? 'primary' : 'default'}
                          variant={rate.isSelected ? 'filled' : 'outlined'}
                          onDelete={isEditable && item.rates && item.rates.length > 1 ? async () => {
                            try {
                              await api.delete(`/quotations/${quotationId}/items/${item.id}/rates/${rate.id}`);
                              toast.success('Rate option removed');
                              // Trigger refetch by invalidating
                              window.dispatchEvent(new Event('quotation-updated'));
                            } catch { toast.error('Failed to remove rate'); }
                          } : undefined}
                          deleteIcon={isEditable && item.rates && item.rates.length > 1 ? <CloseIcon fontSize="small" /> : undefined}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Quantity */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isEditable ? (
                    <TextField
                      label="Qty"
                      type="number"
                      value={getQuantityValue(item.id, item.quantity)}
                      onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                      onBlur={() => handleQuantityBlur(item.id)}
                      size="small"
                      sx={{ width: 80 }}
                      slotProps={{
                        htmlInput: { min: 0, step: 1 },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'right' }}>
                      Qty: {item.quantity}
                    </Typography>
                  )}

                  {isEditable && (
                    <Tooltip title="Remove item">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteItemId(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Add item dialog */}
      <AddItemDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        quotationId={quotationId}
      />

      {/* Delete item confirm */}
      <ConfirmDialog
        open={!!deleteItemId}
        title="Remove Item"
        message="Are you sure you want to remove this item from the quotation?"
        confirmLabel="Remove"
        confirmColor="error"
        loading={deleteItemMutation.isPending}
        onConfirm={() => {
          if (deleteItemId) {
            deleteItemMutation.mutate(
              { quotationId, itemId: deleteItemId },
              { onSuccess: () => setDeleteItemId(null) },
            );
          }
        }}
        onCancel={() => setDeleteItemId(null)}
      />
    </Paper>
  );
}

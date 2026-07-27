import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  DialogActions,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
} from '@mui/material';
import { useSearchItems, useAddQuotationItem } from '../../hooks/useQuotations';
import { useCategories } from '../../hooks/useCategories';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  quotationId: string;
}

export function AddItemDialog({ open, onClose, quotationId }: AddItemDialogProps) {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Manual entry state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualRate, setManualRate] = useState('');

  const { data: searchResults, isLoading: searching } = useSearchItems(searchQuery || ' ');
  const { data: categories } = useCategories();
  const addItemMutation = useAddQuotationItem();

  // Filter results by category
  const filteredResults = (searchResults || []).filter((item) => {
    if (!categoryFilter) return true;
    return item.category?.name?.toLowerCase() === categoryFilter.toLowerCase();
  });

  const toggleItem = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    for (const itemId of selectedIds) {
      await addItemMutation.mutateAsync({
        quotationId,
        data: { itemId },
      });
    }
    setSelectedIds(new Set());
  };

  const handleAddManual = () => {
    if (!manualTitle.trim() || !manualUnit.trim()) return;

    const rates = manualRate
      ? [{ rateTierId: '', rate: Number(manualRate), isSelected: true }]
      : undefined;

    addItemMutation.mutate(
      {
        quotationId,
        data: {
          title: manualTitle.trim(),
          description: manualDescription.trim() || undefined,
          unitName: manualUnit.trim(),
          quantity: Number(manualQuantity) || 1,
          rates,
        },
      },
      {
        onSuccess: () => {
          setManualTitle('');
          setManualDescription('');
          setManualUnit('');
          setManualQuantity('1');
          setManualRate('');
        },
      },
    );
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Item to Quotation</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
          <Tab label="From Library" />
          <Tab label="Manual Entry" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Search + Category Filter */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search items by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {searching && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!searching && filteredResults.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No items found
              </Typography>
            )}

            {/* Item list with checkboxes */}
            {filteredResults.length > 0 && (
              <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {filteredResults.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        p: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isChecked ? 'action.selected' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isChecked ? 'action.selected' : 'action.hover' },
                        '&:last-child': { borderBottom: 'none' },
                      }}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox
                        checked={isChecked}
                        size="small"
                        sx={{ mt: -0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.title}
                          </Typography>
                          {item.unit && (
                            <Chip label={item.unit.name} size="small" variant="outlined" />
                          )}
                        </Box>
                        {item.category && (
                          <Typography variant="caption" color="text.secondary">
                            {item.category.name}
                          </Typography>
                        )}
                        {item.rates && item.rates.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {item.rates.map((r) => (
                              <Chip
                                key={r.id}
                                label={`${r.rateTier?.name || 'Rate'}: ${r.rate.toLocaleString()}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Item Title"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Description"
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Unit"
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value)}
                required
                size="small"
                placeholder="e.g., sqft, pcs"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Quantity"
                value={manualQuantity}
                onChange={(e) => setManualQuantity(e.target.value)}
                type="number"
                size="small"
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Box>
            <TextField
              label="Rate (optional)"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              type="number"
              size="small"
              fullWidth
              placeholder="Leave empty to set later"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Close</Button>
        {tab === 0 && selectedIds.size > 0 && (
          <Badge badgeContent={selectedIds.size} color="primary">
            <Button
              variant="contained"
              onClick={handleAddSelected}
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? 'Adding...' : `Add Selected (${selectedIds.size})`}
            </Button>
          </Badge>
        )}
        {tab === 1 && (
          <Button
            variant="contained"
            onClick={handleAddManual}
            disabled={!manualTitle.trim() || !manualUnit.trim() || addItemMutation.isPending}
          >
            {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

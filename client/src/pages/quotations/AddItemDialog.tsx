import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  DialogActions,
} from '@mui/material';
import { useSearchItems, useAddQuotationItem } from '../../hooks/useQuotations';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  quotationId: string;
}

export function AddItemDialog({ open, onClose, quotationId }: AddItemDialogProps) {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual entry state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualRate, setManualRate] = useState('');

  const { data: searchResults, isLoading: searching } = useSearchItems(searchQuery || ' ');
  const addItemMutation = useAddQuotationItem();

  const handleAddFromLibrary = (item: NonNullable<typeof searchResults>[number]) => {
    addItemMutation.mutate(
      {
        quotationId,
        data: { itemId: item.id },
      },
      {
        onSuccess: () => {
          setSearchQuery('');
        },
      },
    );
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
    setSearchQuery('');
    setTab(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Item to Quotation</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
          <Tab label="From Library" />
          <Tab label="Manual Entry" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <TextField
              fullWidth
              placeholder="Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              autoFocus
              sx={{ mb: 2 }}
            />

            {searching && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!searching && searchQuery && searchResults && searchResults.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No items found matching "{searchQuery}"
              </Typography>
            )}

            {searchResults && searchResults.length > 0 && (
              <List sx={{ maxHeight: 360, overflow: 'auto' }}>
                {searchResults.map((item) => (
                  <ListItemButton
                    key={item.id}
                    onClick={() => handleAddFromLibrary(item)}
                    disabled={addItemMutation.isPending}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.title}
                          </Typography>
                          {item.unit && (
                            <Chip label={item.unit.name} size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {item.category && (
                            <Typography variant="caption" color="text.secondary">
                              {item.category.name}
                            </Typography>
                          )}
                          {item.rates && item.rates.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {item.rates.slice(0, 3).map((r) => (
                                <Chip
                                  key={r.id}
                                  label={`${r.rateTier?.name || 'Rate'}: ${r.rate.toLocaleString()}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                              {item.rates.length > 3 && (
                                <Chip
                                  label={`+${item.rates.length - 3} more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}

            {!searchQuery && !searching && searchResults && searchResults.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No items in the cost library yet
              </Typography>
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

import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories } from '../../hooks/useCategories';
import { useRateTiers, useBrands, useUnits, useCreateItem, useUpdateItem } from '../../hooks/useItems';
import type { Item } from '../../types';

const rateSchema = z.object({
  rateTierId: z.string().min(1, 'Rate tier is required'),
  brandId: z.string().optional(),
  rate: z.coerce.number().min(0, 'Rate must be 0 or greater'),
});

const itemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  unitId: z.string().min(1, 'Unit is required'),
  rates: z.array(rateSchema).min(1, 'At least one rate is required'),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  editData: Item | null;
}

export function ItemFormModal({ open, onClose, editData }: ItemFormModalProps) {
  const { data: categories } = useCategories();
  const { data: rateTiers } = useRateTiers();
  const { data: brands } = useBrands();
  const { data: units } = useUnits();
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      unitId: '',
      rates: [{ rateTierId: '', brandId: '', rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rates',
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          title: editData.title,
          description: editData.description || '',
          categoryId: editData.categoryId,
          unitId: editData.unitId,
          rates:
            editData.rates && editData.rates.length > 0
              ? editData.rates.map((r) => ({
                  rateTierId: r.rateTierId,
                  brandId: r.brandId || '',
                  rate: r.rate,
                }))
              : [{ rateTierId: '', brandId: '', rate: 0 }],
        });
      } else {
        reset({
          title: '',
          description: '',
          categoryId: '',
          unitId: '',
          rates: [{ rateTierId: '', brandId: '', rate: 0 }],
        });
      }
    }
  }, [open, editData, reset]);

  const onSubmit = async (formData: ItemFormData) => {
    const payload = {
      title: formData.title,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      unitId: formData.unitId,
      rates: formData.rates.map((r) => ({
        rateTierId: r.rateTierId,
        brandId: r.brandId || undefined,
        rate: r.rate,
      })),
    };

    if (editData) {
      await updateMutation.mutateAsync({ id: editData.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit as any)}>
        <DialogTitle>{editData ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Title */}
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />

            {/* Category & Unit Row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId} required>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category">
                      {categories?.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.unitId} required>
                    <InputLabel>Unit</InputLabel>
                    <Select {...field} label="Unit">
                      {units?.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>
                          {unit.name}{unit.fullName ? ` (${unit.fullName})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Rates Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Rates
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => append({ rateTierId: '', brandId: '', rate: 0 })}
                >
                  Add Rate
                </Button>
              </Box>
              {errors.rates && !Array.isArray(errors.rates) && (
                <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                  {errors.rates.message}
                </Typography>
              )}
              <Stack spacing={1.5}>
                {fields.map((field, index) => (
                  <Box key={field.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Controller
                      name={`rates.${index}.rateTierId`}
                      control={control}
                      render={({ field: f }) => (
                        <FormControl
                          size="small"
                          sx={{ minWidth: 160 }}
                          error={!!errors.rates?.[index]?.rateTierId}
                        >
                          <InputLabel>Rate Tier</InputLabel>
                          <Select {...f} label="Rate Tier">
                            {rateTiers?.map((tier) => (
                              <MenuItem key={tier.id} value={tier.id}>
                                {tier.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                    <Controller
                      name={`rates.${index}.brandId`}
                      control={control}
                      render={({ field: f }) => (
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel>Brand (optional)</InputLabel>
                          <Select {...f} label="Brand (optional)">
                            <MenuItem value="">None</MenuItem>
                            {brands?.map((brand) => (
                              <MenuItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                    <Controller
                      name={`rates.${index}.rate`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          label="Rate"
                          type="number"
                          size="small"
                          sx={{ width: 120 }}
                          error={!!errors.rates?.[index]?.rate}
                          helperText={errors.rates?.[index]?.rate?.message}
                        />
                      )}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? 'Saving...' : editData ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

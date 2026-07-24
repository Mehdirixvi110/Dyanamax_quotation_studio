import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import type { Customer } from '../../types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  editData: Customer | null;
}

export function CustomerFormModal({ open, onClose, editData }: CustomerFormModalProps) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          name: editData.name,
          email: editData.email || '',
          phone: editData.phone || '',
          company: editData.company || '',
          address: editData.address || '',
          notes: editData.notes || '',
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          company: '',
          address: '',
          notes: '',
        });
      }
    }
  }, [open, editData, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    const payload = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      company: data.company || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{editData ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Phone" fullWidth />
              )}
            />
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Company" fullWidth />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Address" fullWidth multiline rows={2} />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Notes" fullWidth multiline rows={2} />
              )}
            />
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

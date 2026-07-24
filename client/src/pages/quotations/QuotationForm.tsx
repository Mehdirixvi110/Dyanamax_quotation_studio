import { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useUpdateQuotation } from '../../hooks/useQuotations';
import type { Quotation } from '../../types';

interface QuotationFormProps {
  quotation: Quotation;
  isEditable: boolean;
}

export function QuotationForm({ quotation, isEditable }: QuotationFormProps) {
  const [title, setTitle] = useState(quotation.title);
  const [customerName, setCustomerName] = useState(quotation.customerName);
  const [customerEmail, setCustomerEmail] = useState(quotation.customerEmail ?? '');
  const [customerPhone, setCustomerPhone] = useState(quotation.customerPhone ?? '');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | ''>(
    quotation.discountType ?? '',
  );
  const [discountValue, setDiscountValue] = useState(String(quotation.discountValue || ''));
  const [taxPercent, setTaxPercent] = useState(String(quotation.taxPercent || ''));
  const [taxApplication, setTaxApplication] = useState(quotation.taxApplication || 'on_total');
  const [expiryDays, setExpiryDays] = useState(String(quotation.expiryDays || 30));
  const [notes, setNotes] = useState(quotation.notes ?? '');
  const [termsAndConditions, setTermsAndConditions] = useState(
    quotation.termsAndConditions ?? '',
  );

  const updateMutation = useUpdateQuotation();

  const handleSave = () => {
    updateMutation.mutate({
      id: quotation.id,
      data: {
        title: title.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discountType: discountType || undefined,
        discountValue: discountValue ? Number(discountValue) : 0,
        taxPercent: taxPercent ? Number(taxPercent) : 0,
        taxApplication: taxApplication as 'on_total' | 'on_line_items' | 'none',
        expiryDays: expiryDays ? Number(expiryDays) : 30,
        notes: notes.trim() || undefined,
        termsAndConditions: termsAndConditions.trim() || undefined,
      },
    });
  };

  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Quotation Details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditable}
        />
        <TextField
          label="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditable}
        />
        <TextField
          label="Customer Email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditable}
        />
        <TextField
          label="Customer Phone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditable}
        />

        <Divider />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          FINANCIALS
        </Typography>

        <FormControl size="small" fullWidth disabled={!isEditable}>
          <InputLabel>Discount Type</InputLabel>
          <Select
            value={discountType}
            label="Discount Type"
            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed' | '')}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="percentage">Percentage (%)</MenuItem>
            <MenuItem value="fixed">Fixed Amount</MenuItem>
          </Select>
        </FormControl>

        {discountType && (
          <TextField
            label={discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            size="small"
            fullWidth
            disabled={!isEditable}
            type="number"
            slotProps={{
              input: {
                endAdornment: discountType === 'percentage' ? (
                  <InputAdornment position="end">%</InputAdornment>
                ) : undefined,
              },
            }}
          />
        )}

        <TextField
          label="Tax Percent"
          value={taxPercent}
          onChange={(e) => setTaxPercent(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditable}
          type="number"
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            },
          }}
        />

        <FormControl size="small" fullWidth disabled={!isEditable}>
          <InputLabel>Tax Application</InputLabel>
          <Select
            value={taxApplication}
            label="Tax Application"
            onChange={(e) => setTaxApplication(e.target.value as 'on_total' | 'on_line_items' | 'none')}
          >
            <MenuItem value="on_total">On Total</MenuItem>
            <MenuItem value="on_line_items">On Line Items</MenuItem>
            <MenuItem value="none">None</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Expiry Days"
          value={expiryDays}
          onChange={(e) => setExpiryDays(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditable}
          type="number"
        />

        <Divider />

        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          size="small"
          fullWidth
          multiline
          rows={2}
          disabled={!isEditable}
        />

        <TextField
          label="Terms & Conditions"
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          size="small"
          fullWidth
          multiline
          rows={3}
          disabled={!isEditable}
        />

        {isEditable && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={updateMutation.isPending || !title.trim() || !customerName.trim()}
            fullWidth
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Details'}
          </Button>
        )}
      </Box>
    </Paper>
  );
}

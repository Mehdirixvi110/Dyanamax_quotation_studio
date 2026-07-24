import { Paper, Typography, Box, Divider } from '@mui/material';
import type { Quotation } from '../../types';

interface QuotationSummaryProps {
  quotation: Quotation;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function QuotationSummary({ quotation }: QuotationSummaryProps) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Financial Summary
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Subtotal
          </Typography>
          <Typography variant="body2">
            {formatAmount(quotation.subtotal)}
          </Typography>
        </Box>

        {quotation.discountAmount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Discount
              {quotation.discountType === 'percentage' && ` (${quotation.discountValue}%)`}
            </Typography>
            <Typography variant="body2" color="error.main">
              −{formatAmount(quotation.discountAmount)}
            </Typography>
          </Box>
        )}

        {quotation.taxAmount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Tax ({quotation.taxPercent}%)
            </Typography>
            <Typography variant="body2">
              +{formatAmount(quotation.taxAmount)}
            </Typography>
          </Box>
        )}

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Grand Total
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatAmount(quotation.grandTotal)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

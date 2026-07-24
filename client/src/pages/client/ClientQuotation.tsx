import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as SubmitIcon,
  Business as CompanyIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useClientQuotation,
  useUpdateClientSelections,
  useSubmitClientQuotation,
} from '../../hooks/useQuotations';
import { downloadClientPdf } from '../../lib/download-pdf';
import type { QuotationItem, QuotationItemRate } from '../../types';
import toast from 'react-hot-toast';

interface ItemSelection {
  quotationItemId: string;
  isSelected: boolean;
  selectedRateId?: string;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ClientQuotationPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useClientQuotation();
  const updateSelections = useUpdateClientSelections();
  const submitMutation = useSubmitClientQuotation();

  const [selections, setSelections] = useState<Map<string, ItemSelection>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const filename = `quotation-${data.quotation.referenceNumber}.pdf`;
      await downloadClientPdf(filename);
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // Initialize selections from quotation data
  useEffect(() => {
    if (data?.quotation.items) {
      const selMap = new Map<string, ItemSelection>();
      data.quotation.items.forEach((item) => {
        const selectedRate = item.rates?.find((r) => r.isSelected);
        selMap.set(item.id, {
          quotationItemId: item.id,
          isSelected: item.isSelected,
          selectedRateId: selectedRate?.id,
        });
      });
      setSelections(selMap);
    }
  }, [data]);

  const syncSelections = useCallback(
    (newSelections: Map<string, ItemSelection>) => {
      const selectionsArray = Array.from(newSelections.values());
      updateSelections.mutate(selectionsArray);
    },
    [updateSelections],
  );

  const handleItemToggle = (itemId: string, checked: boolean) => {
    const newSelections = new Map(selections);
    const current = newSelections.get(itemId);
    if (current) {
      newSelections.set(itemId, { ...current, isSelected: checked });
    } else {
      newSelections.set(itemId, { quotationItemId: itemId, isSelected: checked });
    }
    setSelections(newSelections);
    syncSelections(newSelections);
  };

  const handleRateSelect = (itemId: string, rateId: string) => {
    const newSelections = new Map(selections);
    const current = newSelections.get(itemId);
    if (current) {
      newSelections.set(itemId, { ...current, selectedRateId: rateId });
    } else {
      newSelections.set(itemId, { quotationItemId: itemId, isSelected: true, selectedRateId: rateId });
    }
    setSelections(newSelections);
    syncSelections(newSelections);
  };

  const handleSubmit = () => {
    submitMutation.mutate(undefined, {
      onSuccess: () => setSubmitted(true),
    });
  };

  // Calculate totals from selections
  const calculateTotal = (): number => {
    if (!data?.quotation.items) return 0;
    let total = 0;
    data.quotation.items.forEach((item) => {
      const sel = selections.get(item.id);
      if (!sel?.isSelected) return;
      const selectedRate = item.rates?.find((r) => r.id === sel.selectedRateId) ?? item.rates?.[0];
      if (selectedRate) {
        total += selectedRate.rate * item.quantity;
      }
    });
    return total;
  };

  // Check auth
  useEffect(() => {
    if (!localStorage.getItem('clientToken')) {
      navigate('/client/login');
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const axiosErr = error as { response?: { status?: number } };
    if (axiosErr.response?.status === 401) {
      localStorage.removeItem('clientToken');
      navigate('/client/login');
      return null;
    }
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        Failed to load quotation. Please try logging in again.
      </Alert>
    );
  }

  if (!data) return null;

  const { quotation, companySettings } = data;
  const isLocked = quotation.status !== 'published' && quotation.status !== 'client_viewed';

  if (submitted || quotation.status === 'client_submitted') {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <SubmitIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 1 }}>
          Quotation Submitted
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
          Thank you! Your selections have been submitted successfully. The company will review
          your choices and get back to you shortly.
        </Typography>
      </Box>
    );
  }

  const estimatedTotal = calculateTotal();

  return (
    <Box>
      {/* Company header */}
      {companySettings && (
        <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          {companySettings.logoUrl ? (
            <Box
              component="img"
              src={companySettings.logoUrl}
              alt={companySettings.companyName}
              sx={{ height: 48, width: 'auto' }}
            />
          ) : (
            <CompanyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          )}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {companySettings.companyName}
            </Typography>
            {companySettings.companyEmail && (
              <Typography variant="body2" color="text.secondary">
                {companySettings.companyEmail}
                {companySettings.companyPhone && ` • ${companySettings.companyPhone}`}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Quotation info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {quotation.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reference: {quotation.referenceNumber} • Customer: {quotation.customerName}
        </Typography>
      </Box>

      {quotation.notes && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {quotation.notes}
        </Alert>
      )}

      {/* Items */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select Your Items
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Check the items you want to include and choose your preferred rate tier for each.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        {quotation.items?.map((item: QuotationItem) => {
          const sel = selections.get(item.id);
          const isItemSelected = sel?.isSelected ?? item.isSelected;

          return (
            <Card key={item.id} variant="outlined" sx={{ opacity: isItemSelected ? 1 : 0.6 }}>
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Checkbox
                    checked={isItemSelected}
                    onChange={(e) => handleItemToggle(item.id, e.target.checked)}
                    disabled={isLocked}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.title}
                      </Typography>
                      <Chip label={item.unitName} size="small" variant="outlined" />
                      <Chip label={`Qty: ${item.quantity}`} size="small" />
                    </Box>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.description}
                      </Typography>
                    )}

                    {/* Rate options */}
                    {item.rates && item.rates.length > 0 && isItemSelected && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          SELECT RATE:
                        </Typography>
                        <RadioGroup
                          value={sel?.selectedRateId || ''}
                          onChange={(e) => handleRateSelect(item.id, e.target.value)}
                        >
                          {item.rates.map((rate: QuotationItemRate) => (
                            <FormControlLabel
                              key={rate.id}
                              value={rate.id}
                              disabled={isLocked}
                              control={<Radio size="small" />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    {rate.brandName || 'Standard'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatAmount(rate.rate)} / {item.unitName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    (Total: {formatAmount(rate.rate * item.quantity)})
                                  </Typography>
                                </Box>
                              }
                            />
                          ))}
                        </RadioGroup>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Estimated total */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Estimated Total</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatAmount(estimatedTotal)}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Final total may vary based on applicable taxes and discounts applied by the company.
        </Typography>
      </Paper>

      {/* Terms */}
      {quotation.termsAndConditions && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Terms & Conditions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {quotation.termsAndConditions}
          </Typography>
        </Paper>
      )}

      {/* Submit button */}
      {!isLocked && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SubmitIcon />}
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              sx={{ px: 6 }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit My Selections'}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Once submitted, your selections will be locked and sent for review.
          </Typography>
        </Box>
      )}
      {isLocked && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

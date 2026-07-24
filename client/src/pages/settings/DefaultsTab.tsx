import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon } from '@mui/icons-material';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';

export function DefaultsTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [defaultTaxPercent, setDefaultTaxPercent] = useState<string>('0');
  const [defaultExpiryDays, setDefaultExpiryDays] = useState<string>('15');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  useEffect(() => {
    if (settings) {
      setDefaultTaxPercent(String(settings.defaultTaxPercent ?? 0));
      setDefaultExpiryDays(String(settings.defaultExpiryDays ?? 15));
      setTermsAndConditions(settings.termsAndConditions || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      defaultTaxPercent: parseFloat(defaultTaxPercent) || 0,
      defaultExpiryDays: parseInt(defaultExpiryDays, 10) || 15,
      termsAndConditions,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Default Tax Percent"
            value={defaultTaxPercent}
            onChange={(e) => setDefaultTaxPercent(e.target.value)}
            fullWidth
            type="number"
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
              htmlInput: { min: 0, max: 100, step: 0.01 },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Default Expiry Days"
            value={defaultExpiryDays}
            onChange={(e) => setDefaultExpiryDays(e.target.value)}
            fullWidth
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
            helperText="Number of days before a quotation expires"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Terms & Conditions"
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            fullWidth
            multiline
            rows={6}
            helperText="Default terms included in quotations"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

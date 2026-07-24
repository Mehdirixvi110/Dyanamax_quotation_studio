import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon } from '@mui/icons-material';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';

export function CompanyInfoTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [stampUrl, setStampUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
      setCompanyEmail(settings.companyEmail || '');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyAddress(settings.companyAddress || '');
      setLogoUrl(settings.logoUrl || '');
      setStampUrl(settings.stampUrl || '');
      setSignatureUrl(settings.signatureUrl || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      logoUrl,
      stampUrl,
      signatureUrl,
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
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            fullWidth
            required
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            fullWidth
            type="email"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Phone"
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Stamp URL"
            value={stampUrl}
            onChange={(e) => setStampUrl(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Signature URL"
            value={signatureUrl}
            onChange={(e) => setSignatureUrl(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={updateSettings.isPending || !companyName.trim()}
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

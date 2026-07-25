import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Typography,
  Avatar,
  IconButton,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';

function FileUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {value ? (
          <Avatar
            variant="rounded"
            src={value}
            sx={{ width: 64, height: 64, border: '1px solid', borderColor: 'divider' }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{ width: 64, height: 64, bgcolor: 'grey.100', color: 'grey.400' }}
          >
            <UploadIcon />
          </Avatar>
        )}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => inputRef.current?.click()}
          >
            {value ? 'Change' : 'Upload'}
          </Button>
          {value && (
            <IconButton size="small" color="error" onClick={handleRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        hidden
        onChange={handleFileChange}
      />
    </Box>
  );
}

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
            label="Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Grid>

        {/* File Uploads */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FileUploadField label="Company Logo" value={logoUrl} onChange={setLogoUrl} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FileUploadField label="Company Stamp" value={stampUrl} onChange={setStampUrl} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FileUploadField label="Signature" value={signatureUrl} onChange={setSignatureUrl} />
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

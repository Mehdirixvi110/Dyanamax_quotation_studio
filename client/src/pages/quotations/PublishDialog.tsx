import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { usePublishQuotation } from '../../hooks/useQuotations';
import toast from 'react-hot-toast';

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  quotationId: string;
  expiryDays: number;
}

export function PublishDialog({ open, onClose, quotationId, expiryDays }: PublishDialogProps) {
  const [credentials, setCredentials] = useState<{ accessCode: string; password: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const publishMutation = usePublishQuotation();

  const handlePublish = () => {
    publishMutation.mutate(quotationId, {
      onSuccess: (data) => {
        setCredentials(data);
      },
    });
  };

  const handleCopy = async () => {
    if (!credentials) return;
    const text = `Access Code: ${credentials.accessCode}\nPassword: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Credentials copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setCredentials(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{credentials ? 'Quotation Published!' : 'Publish Quotation'}</DialogTitle>
      <DialogContent>
        {!credentials ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Publishing this quotation will:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <li>
                <Typography variant="body2">
                  Generate client access credentials
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Make the quotation available for client review
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Set expiry to {expiryDays} days from now
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Lock the quotation from further edits
                </Typography>
              </li>
            </Box>
            <Alert severity="info">
              After publishing, the client can view and submit their selections using the
              generated credentials.
            </Alert>
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Quotation published successfully! Share these credentials with your client.
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: 'grey.50',
                position: 'relative',
              }}
            >
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Tooltip title={copied ? 'Copied!' : 'Copy credentials'}>
                  <IconButton onClick={handleCopy} size="small">
                    {copied ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <CopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ACCESS CODE
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}
                  >
                    {credentials.accessCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    PASSWORD
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}
                  >
                    {credentials.password}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The client will use these credentials at the client portal login page to view and
              interact with the quotation.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!credentials ? (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish Now'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outlined" onClick={handleCopy} startIcon={<CopyIcon />}>
              Copy Credentials
            </Button>
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

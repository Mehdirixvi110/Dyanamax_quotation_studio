import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Publish as PublishIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Archive as ArchiveIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusChip } from '../../components/common/StatusChip';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  useQuotation,
  useApproveQuotation,
  useRejectQuotation,
  useArchiveQuotation,
} from '../../hooks/useQuotations';
import { QuotationItems } from './QuotationItems';
import { QuotationSummary } from './QuotationSummary';
import { QuotationForm } from './QuotationForm';
import { PublishDialog } from './PublishDialog';
import { downloadQuotationPdf } from '../../lib/download-pdf';
import type { QuotationStatus } from '../../types';
import toast from 'react-hot-toast';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quotation, isLoading, error } = useQuotation(id || '');

  const [publishOpen, setPublishOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const approveMutation = useApproveQuotation();
  const rejectMutation = useRejectQuotation();
  const archiveMutation = useArchiveQuotation();

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    setPdfLoading(true);
    try {
      const filename = `quotation-${quotation.referenceNumber}.pdf`;
      await downloadQuotationPdf(quotation.id, filename);
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !quotation) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load quotation. It may have been deleted or you don't have access.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/quotations')}>
          Back to Quotations
        </Button>
      </Box>
    );
  }

  const status = (quotation.status?.toLowerCase() ?? 'draft') as QuotationStatus;
  const isEditable = status !== 'archived';
  const canPublish = ['draft', 'published', 'client_viewed', 'client_submitted', 'rejected'].includes(status);
  const canApprove = status === 'client_submitted';
  const canReject = status === 'client_submitted';
  const canArchive = ['approved', 'rejected', 'expired'].includes(status);

  return (
    <Box>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/quotations')} color="inherit">
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {quotation.referenceNumber}
            </Typography>
            <StatusChip status={status} />
            {quotation.currentVersion > 1 && (
              <Chip label={`v${quotation.currentVersion}`} size="small" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {quotation.title} • Created {formatDate(quotation.createdAt)}
          </Typography>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </Button>
          {canPublish && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PublishIcon />}
              onClick={() => setPublishOpen(true)}
            >
              Publish
            </Button>
          )}
          {canApprove && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => setApproveOpen(true)}
            >
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          )}
          {canArchive && (
            <Button
              variant="outlined"
              startIcon={<ArchiveIcon />}
              onClick={() => setArchiveOpen(true)}
            >
              Archive
            </Button>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Main content */}
      <Grid container spacing={3}>
        {/* Left panel — Items */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <QuotationItems
            quotationId={quotation.id}
            items={quotation.items ?? []}
            isEditable={isEditable}
          />
        </Grid>

        {/* Right panel — Summary + Form */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <QuotationSummary quotation={quotation} />
            <QuotationForm quotation={quotation} isEditable={isEditable} />

            {/* Version history */}
            {quotation.versions && quotation.versions.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Version History
                </Typography>
                {quotation.versions.map((v) => (
                  <Box key={v.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">
                      v{v.versionNumber} — {v.publisher?.fullName ?? 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(v.publishedAt)}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}

            {/* Client access info */}
            {quotation.clientAccess && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Client Access
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    Code: <strong>{quotation.clientAccess.accessCode}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Password: <strong>(reset to reveal)</strong>
                  </Typography>
                  <Typography variant="body2">
                    Status: {quotation.clientAccess.isLocked ? 'Locked' : quotation.clientAccess.isEnabled ? 'Active' : 'Disabled'}
                  </Typography>
                  <Typography variant="body2">
                    Views: {quotation.clientAccess.accessCount}
                  </Typography>
                  {quotation.clientAccess.lastAccessedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Last accessed: {formatDate(quotation.clientAccess.lastAccessedAt)}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                    onClick={async () => {
                      try {
                        const res = await import('../../lib/axios').then(m => m.api.put(`/quotations/${quotation.id}/client-access`, { resetPassword: true }));
                        const newPass = res.data?.data?.newPassword;
                        if (newPass) {
                          toast.success(`New password: ${newPass}`);
                        } else {
                          toast.success('Password reset successfully');
                        }
                      } catch {
                        toast.error('Failed to reset password');
                      }
                    }}
                  >
                    Reset & Show Password
                  </Button>
                  {quotation.clientAccess.isEnabled ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        try {
                          await import('../../lib/axios').then(m => m.api.put(`/quotations/${quotation.id}/client-access`, { isEnabled: false }));
                          toast.success('Client access disabled');
                        } catch { toast.error('Failed'); }
                      }}
                    >
                      Disable Access
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={async () => {
                        try {
                          await import('../../lib/axios').then(m => m.api.put(`/quotations/${quotation.id}/client-access`, { isEnabled: true }));
                          toast.success('Client access enabled');
                        } catch { toast.error('Failed'); }
                      }}
                    >
                      Enable Access
                    </Button>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Publish dialog */}
      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        quotationId={quotation.id}
        expiryDays={quotation.expiryDays}
      />

      {/* Approve confirm */}
      <ConfirmDialog
        open={approveOpen}
        title="Approve Quotation"
        message="Are you sure you want to approve this quotation? The client will be notified."
        confirmLabel="Approve"
        confirmColor="primary"
        loading={approveMutation.isPending}
        onConfirm={() => {
          approveMutation.mutate(quotation.id, {
            onSuccess: () => setApproveOpen(false),
          });
        }}
        onCancel={() => setApproveOpen(false)}
      />

      {/* Reject confirm */}
      <ConfirmDialog
        open={rejectOpen}
        title="Reject Quotation"
        message="Are you sure you want to reject this quotation?"
        confirmLabel="Reject"
        confirmColor="error"
        loading={rejectMutation.isPending}
        onConfirm={() => {
          rejectMutation.mutate(quotation.id, {
            onSuccess: () => setRejectOpen(false),
          });
        }}
        onCancel={() => setRejectOpen(false)}
      />

      {/* Archive confirm */}
      <ConfirmDialog
        open={archiveOpen}
        title="Archive Quotation"
        message="Are you sure you want to archive this quotation? It will be moved to the archive."
        confirmLabel="Archive"
        confirmColor="warning"
        loading={archiveMutation.isPending}
        onConfirm={() => {
          archiveMutation.mutate(quotation.id, {
            onSuccess: () => setArchiveOpen(false),
          });
        }}
        onCancel={() => setArchiveOpen(false)}
      />
    </Box>
  );
}

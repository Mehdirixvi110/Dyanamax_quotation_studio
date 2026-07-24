import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No data found',
  message = 'There are no items to display yet.',
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 2 }}>
        {icon || <InboxOutlined sx={{ fontSize: 64, opacity: 0.4 }} />}
      </Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: actionLabel ? 3 : 0, maxWidth: 360 }}>
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

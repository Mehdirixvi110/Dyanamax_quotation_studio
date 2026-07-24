import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function ClientLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Quotation View
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import { Menu as MenuIcon, Notifications as NotifIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount } from '../../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function TopBar() {
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const { data: unreadCount = 0 } = useUnreadCount();

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(e.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton onClick={toggleSidebar} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton sx={{ mr: 1 }} onClick={handleNotifOpen}>
          <Badge badgeContent={unreadCount} color="error">
            <NotifIcon />
          </Badge>
        </IconButton>
        <NotificationPanel
          anchorEl={notifAnchorEl}
          onClose={handleNotifClose}
        />
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={handleMenuOpen}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
            {user?.fullName?.charAt(0) || 'A'}
          </Avatar>
          <Typography variant="body2" sx={{ ml: 1, color: 'text.primary' }}>
            {user?.fullName || 'Admin'}
          </Typography>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

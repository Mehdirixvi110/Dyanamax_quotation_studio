import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Description as QuotationIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Straighten as MeasureIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../../stores/ui.store';

interface SidebarProps {
  width: number;
}

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Cost Library', icon: <InventoryIcon />, path: '/cost-library' },
  { label: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { label: 'Measurements', icon: <MeasureIcon />, path: '/measurements' },
  { label: 'Quotations', icon: <QuotationIcon />, path: '/quotations' },
  { label: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { label: 'Audit Logs', icon: <HistoryIcon />, path: '/audit-logs' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export function Sidebar({ width }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? width : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
          Quotation Studio
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      <List sx={{ px: 1, mt: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: '0.9rem' } } }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

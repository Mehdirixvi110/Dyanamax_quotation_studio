import {
  Popover,
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications';

interface NotificationPanelProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function NotificationPanel({ anchorEl, onClose }: NotificationPanelProps) {
  const open = Boolean(anchorEl);
  const { data, isLoading } = useNotifications(1);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: { width: 360, maxHeight: 480 },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        <Button size="small" onClick={handleMarkAllAsRead}>
          Mark all as read
        </Button>
      </Box>
      <Divider />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            No notifications
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ overflow: 'auto', maxHeight: 380 }}>
          {notifications.map((notification) => (
            <ListItemButton
              key={notification.id}
              onClick={() =>
                handleNotificationClick(notification.id, notification.isRead)
              }
              sx={{
                bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                alignItems: 'flex-start',
              }}
            >
              {!notification.isRead && (
                <CircleIcon
                  sx={{
                    fontSize: 8,
                    color: 'primary.main',
                    mt: 1,
                    mr: 1,
                    flexShrink: 0,
                  }}
                />
              )}
              <ListItemText
                primary={notification.title}
                secondary={
                  <>
                    {notification.message && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {notification.message}
                      </Typography>
                    )}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.disabled"
                    >
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </>
                }
                sx={{ ml: notification.isRead ? 2 : 0 }}
                slotProps={{
                  primary: { sx: { fontWeight: notification.isRead ? 400 : 600 } },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Popover>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  CheckCircle,
  Delete,
  DeleteSweep,
  Info,
  Warning,
  Error as ErrorIcon,
  CheckCircleOutline,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

interface Notification {
  id: number;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data: any;
  createdDate: string;
  readDate: string | null;
  expiresAt: string | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const NotificationCenter: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const userId = user?.id || user?.username || 'user-001';

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [tabValue, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isReadFilter = tabValue === 1 ? 'true' : tabValue === 2 ? 'false' : undefined;

      const params = new URLSearchParams({
        userId,
        page: page.toString(),
        pageSize: '20',
      });

      if (isReadFilter !== undefined) {
        params.append('isRead', isReadFilter);
      }

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${userId}`);
      const data = await response.json();
      const count = typeof data?.count === 'number' ? data.count : Number(data?.unreadCount) || 0;
      setUnreadCount(count);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:unread', { detail: count }));
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('notifications.confirmClearAll') || 'Clear all notifications?')) {
      return;
    }

    try {
      await fetch(`/api/notifications/clear-all?userId=${userId}`, {
        method: 'DELETE',
      });

      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);

    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const filteredNotifications = notifications;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsActive sx={{ fontSize: 40 }} color="primary" />
          </Badge>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t('notifications.title') || 'Notification Center'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('notifications.subtitle') || 'Manage your system notifications'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchNotifications();
              fetchUnreadCount();
            }}
          >
            {t('common.refresh') || 'Refresh'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutline />}
              onClick={handleMarkAllAsRead}
            >
              {t('notifications.markAllRead') || 'Mark All Read'}
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={handleClearAll}
          >
            {t('notifications.clearAll') || 'Clear All'}
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {t('notifications.total') || 'Total Notifications'}
            </Typography>
            <Typography variant="h4">{notifications.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {t('notifications.unread') || 'Unread'}
            </Typography>
            <Typography variant="h4" color="error">
              {unreadCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); setPage(1); }}>
          <Tab label={t('notifications.all') || 'All'} />
          <Tab label={t('notifications.read') || 'Read'} />
          <Tab label={t('notifications.unread') || 'Unread'} />
        </Tabs>

        <Divider />

        {/* Notifications List */}
        <TabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              {t('notifications.noNotifications') || 'No notifications found'}
            </Alert>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      {getSeverityIcon(notification.severity)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type}
                            size="small"
                            color={getSeverityColor(notification.severity)}
                            variant="outlined"
                          />
                          {!notification.isRead && (
                            <Chip label="NEW" size="small" color="error" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(notification.createdDate), 'PPpp', { locale: i18n.language === 'it' ? it : undefined })}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!notification.isRead && (
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <CheckCircleOutline />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </Typography>
              <Button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </TabPanel>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getSeverityIcon(selectedNotification.severity)}
                <Box>
                  <Typography variant="h6">{selectedNotification.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(selectedNotification.createdDate), 'PPpp', { locale: i18n.language === 'it' ? it : undefined })}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" paragraph>
                {selectedNotification.message}
              </Typography>

              {selectedNotification.data && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Additional Data:
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedNotification.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Type: ${selectedNotification.type}`}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Severity: ${selectedNotification.severity}`}
                  size="small"
                  color={getSeverityColor(selectedNotification.severity)}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                {t('common.close') || 'Close'}
              </Button>
              {!selectedNotification.isRead && (
                <Button
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    setDetailDialogOpen(false);
                  }}
                  variant="contained"
                >
                  {t('notifications.markRead') || 'Mark as Read'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NotificationCenter;

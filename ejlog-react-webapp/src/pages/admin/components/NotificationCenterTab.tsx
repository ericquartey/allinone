// ============================================================================
// EJLOG WMS - Notification Center Tab
// Centro notifiche con visualizzazione, filtri e azioni
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MarkEmailRead as MarkReadIcon,
  MarkEmailUnread as MarkUnreadIcon,
  DoneAll as MarkAllReadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type Notification,
} from '../../../services/api/notificationsApi';

// Icon mapping per tipo notifica
const getNotificationIcon = (type: string, priority: number) => {
  const iconProps = { fontSize: 'medium' as const };

  switch (type) {
    case 'success':
      return <SuccessIcon color="success" {...iconProps} />;
    case 'warning':
      return <WarningIcon color="warning" {...iconProps} />;
    case 'error':
      return <ErrorIcon color="error" {...iconProps} />;
    default:
      return <InfoIcon color="info" {...iconProps} />;
  }
};

// Color mapping per priorità
const getPriorityColor = (priority: number): 'default' | 'primary' | 'warning' | 'error' => {
  switch (priority) {
    case 4:
      return 'error'; // Urgente
    case 3:
      return 'warning'; // Alta
    case 2:
      return 'primary'; // Media
    default:
      return 'default'; // Bassa
  }
};

const getPriorityLabel = (priority: number): string => {
  switch (priority) {
    case 4:
      return 'Urgente';
    case 3:
      return 'Alta';
    case 2:
      return 'Media';
    default:
      return 'Bassa';
  }
};

export function NotificationCenterTab() {
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useGetNotificationsQuery({
    category: filterCategory || undefined,
    unreadOnly: filterUnreadOnly || undefined,
    limit: 100,
  });

  const { data: unreadCountData } = useGetUnreadCountQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

  // Auto-refresh ogni 30 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id).unwrap();
      } catch (error) {
        console.error('Errore marking as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    if (confirm(`Marcare tutte le ${unreadCount} notifiche come lette?`)) {
      try {
        await markAllAsRead({}).unwrap();
      } catch (error) {
        console.error('Errore marking all as read:', error);
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    handleMarkAsRead(notification);
  };

  // Calcola categorie disponibili
  const categories = Array.from(new Set(notifications.map((n) => n.category).filter(Boolean)));

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Errore caricamento notifiche</Alert>;
  }

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Totali
              </Typography>
              <Typography variant="h4">{notifications.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Non Lette
              </Typography>
              <Typography variant="h4" color="primary.main">
                {unreadCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Categorie
              </Typography>
              <Typography variant="h4">{categories.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Urgenti
              </Typography>
              <Typography variant="h4" color="error.main">
                {notifications.filter((n) => n.priority === 4 && !n.read).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Categoria"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant={filterUnreadOnly ? 'contained' : 'outlined'}
              startIcon={<FilterIcon />}
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              fullWidth
            >
              Solo Non Lette
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<MarkAllReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              fullWidth
            >
              Marca Tutte Lette
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              fullWidth
            >
              Aggiorna
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications List */}
      <Grid container spacing={3}>
        {/* Lista Notifiche */}
        <Grid item xs={12} md={selectedNotification ? 6 : 12}>
          <Paper>
            <List>
              {notifications.length === 0 ? (
                <ListItem>
                  <Alert severity="info" sx={{ width: '100%' }}>
                    Nessuna notifica disponibile
                  </Alert>
                </ListItem>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id}>
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      selected={selectedNotification?.id === notification.id}
                      sx={{
                        backgroundColor: notification.read
                          ? 'transparent'
                          : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Badge
                          variant="dot"
                          color="primary"
                          invisible={notification.read}
                        >
                          {getNotificationIcon(notification.type, notification.priority)}
                        </Badge>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography
                              variant="body1"
                              fontWeight={notification.read ? 'normal' : 'bold'}
                            >
                              {notification.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(notification.createdDate), 'dd/MM HH:mm')}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {notification.message}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip
                                label={getPriorityLabel(notification.priority)}
                                size="small"
                                color={getPriorityColor(notification.priority)}
                              />
                              {notification.category && (
                                <Chip label={notification.category} size="small" variant="outlined" />
                              )}
                            </Box>
                          </Box>
                        }
                      />

                      <Tooltip title={notification.read ? 'Letta' : 'Non letta'}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification);
                          }}
                        >
                          {notification.read ? (
                            <MarkReadIcon fontSize="small" color="success" />
                          ) : (
                            <MarkUnreadIcon fontSize="small" color="action" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </ListItemButton>
                    <Divider />
                  </div>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Dettaglio Notifica Selezionata */}
        {selectedNotification && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getNotificationIcon(selectedNotification.type, selectedNotification.priority)}
                  <Typography variant="h6">{selectedNotification.title}</Typography>
                </Box>
                <IconButton size="small" onClick={() => setSelectedNotification(null)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" paragraph>
                {selectedNotification.message}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Priorità
                  </Typography>
                  <Box>
                    <Chip
                      label={getPriorityLabel(selectedNotification.priority)}
                      color={getPriorityColor(selectedNotification.priority)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Categoria
                  </Typography>
                  <Typography variant="body2">
                    {selectedNotification.category || '-'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Data Creazione
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedNotification.createdDate), 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                </Box>

                {selectedNotification.readDate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Data Lettura
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedNotification.readDate), 'dd/MM/yyyy HH:mm:ss')}
                    </Typography>
                  </Box>
                )}

                {selectedNotification.relatedEntity && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Entità Correlata
                    </Typography>
                    <Typography variant="body2">
                      {selectedNotification.relatedEntity}
                      {selectedNotification.relatedId && ` #${selectedNotification.relatedId}`}
                    </Typography>
                  </Box>
                )}

                {selectedNotification.actionUrl && (
                  <Box>
                    <Button variant="contained" fullWidth href={selectedNotification.actionUrl}>
                      Vai all'azione
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

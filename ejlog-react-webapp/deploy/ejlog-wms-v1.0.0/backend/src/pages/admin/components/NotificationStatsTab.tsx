// ============================================================================
// EJLOG WMS - Notification Stats Tab
// Statistiche e analytics sulle notifiche
// ============================================================================

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { format, differenceInMinutes, startOfDay, isToday, isYesterday } from 'date-fns';

import { useGetNotificationsQuery } from '../../../services/api/notificationsApi';

export function NotificationStatsTab() {
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useGetNotificationsQuery({
    limit: 1000, // Carica più notifiche per statistiche accurate
  });

  const notifications = notificationsData?.notifications || [];

  // Calcola statistiche
  const stats = useMemo(() => {
    if (notifications.length === 0) return null;

    // Conteggio per tipo
    const byType = {
      info: notifications.filter((n) => n.type === 'info').length,
      success: notifications.filter((n) => n.type === 'success').length,
      warning: notifications.filter((n) => n.type === 'warning').length,
      error: notifications.filter((n) => n.type === 'error').length,
    };

    // Conteggio per priorità
    const byPriority = {
      1: notifications.filter((n) => n.priority === 1).length, // Bassa
      2: notifications.filter((n) => n.priority === 2).length, // Media
      3: notifications.filter((n) => n.priority === 3).length, // Alta
      4: notifications.filter((n) => n.priority === 4).length, // Urgente
    };

    // Conteggio per categoria
    const byCategory: { [key: string]: number } = {};
    notifications.forEach((n) => {
      if (n.category) {
        byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      }
    });

    // Calcola tempo medio di lettura (per notifiche lette)
    const readNotifications = notifications.filter((n) => n.read && n.readDate);
    const avgReadTime = readNotifications.length > 0
      ? readNotifications.reduce((sum, n) => {
          const created = new Date(n.createdDate);
          const read = new Date(n.readDate!);
          return sum + differenceInMinutes(read, created);
        }, 0) / readNotifications.length
      : 0;

    // Notifiche di oggi e ieri
    const todayCount = notifications.filter((n) => isToday(new Date(n.createdDate))).length;
    const yesterdayCount = notifications.filter((n) => isYesterday(new Date(n.createdDate))).length;

    // Tasso di lettura
    const readCount = notifications.filter((n) => n.read).length;
    const readRate = notifications.length > 0 ? (readCount / notifications.length) * 100 : 0;

    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      read: readCount,
      byType,
      byPriority,
      byCategory,
      avgReadTime,
      todayCount,
      yesterdayCount,
      readRate,
    };
  }, [notifications]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Errore caricamento statistiche</Alert>;
  }

  if (!stats || notifications.length === 0) {
    return (
      <Alert severity="info">
        Nessuna notifica disponibile per generare statistiche.
      </Alert>
    );
  }

  const typeIcons = {
    info: <InfoIcon color="info" />,
    success: <SuccessIcon color="success" />,
    warning: <WarningIcon color="warning" />,
    error: <ErrorIcon color="error" />,
  };

  const priorityLabels = {
    1: 'Bassa',
    2: 'Media',
    3: 'Alta',
    4: 'Urgente',
  };

  const priorityColors: { [key: number]: 'default' | 'primary' | 'warning' | 'error' } = {
    1: 'default',
    2: 'primary',
    3: 'warning',
    4: 'error',
  };

  return (
    <Box>
      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Totale Notifiche
              </Typography>
              <Typography variant="h3">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Oggi
              </Typography>
              <Typography variant="h3" color="primary.main">
                {stats.todayCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ieri: {stats.yesterdayCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <SpeedIcon />
                <Typography color="text.secondary" variant="caption">
                  Tempo Lettura Medio
                </Typography>
              </Box>
              <Typography variant="h3">{Math.round(stats.avgReadTime)}</Typography>
              <Typography variant="caption" color="text.secondary">
                minuti
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Tasso di Lettura
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats.readRate.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.readRate}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Distribution by Type */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribuzione per Tipo
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(stats.byType).map(([type, count]) => {
            const percentage = (count / stats.total) * 100;
            return (
              <Grid item xs={12} md={6} key={type}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {typeIcons[type as keyof typeof typeIcons]}
                      <Typography variant="body1" textTransform="capitalize">
                        {type}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {count} ({percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    color={
                      type === 'error'
                        ? 'error'
                        : type === 'warning'
                        ? 'warning'
                        : type === 'success'
                        ? 'success'
                        : 'info'
                    }
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Distribution by Priority */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribuzione per Priorità
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Priorità</TableCell>
                <TableCell align="right">Conteggio</TableCell>
                <TableCell align="right">Percentuale</TableCell>
                <TableCell width="50%">Distribuzione</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(stats.byPriority)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([priority, count]) => {
                  const percentage = (count / stats.total) * 100;
                  const p = parseInt(priority);
                  return (
                    <TableRow key={priority}>
                      <TableCell>
                        <Chip
                          label={priorityLabels[p as keyof typeof priorityLabels]}
                          size="small"
                          color={priorityColors[p]}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <strong>{count}</strong>
                      </TableCell>
                      <TableCell align="right">{percentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          color={priorityColors[p]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Distribution by Category */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribuzione per Categoria
        </Typography>
        {Object.keys(stats.byCategory).length === 0 ? (
          <Alert severity="info">Nessuna categoria disponibile</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Conteggio</TableCell>
                  <TableCell align="right">Percentuale</TableCell>
                  <TableCell width="50%">Distribuzione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const percentage = (count / stats.total) * 100;
                    return (
                      <TableRow key={category}>
                        <TableCell>
                          <Chip label={category} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <strong>{count}</strong>
                        </TableCell>
                        <TableCell align="right">{percentage.toFixed(1)}%</TableCell>
                        <TableCell>
                          <LinearProgress variant="determinate" value={percentage} color="primary" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Read vs Unread */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stato di Lettura
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography variant="h6">Lette</Typography>
                <Typography variant="h3">{stats.read}</Typography>
                <Typography variant="body2">
                  {((stats.read / stats.total) * 100).toFixed(1)}% del totale
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent>
                <Typography variant="h6">Non Lette</Typography>
                <Typography variant="h3">{stats.unread}</Typography>
                <Typography variant="body2">
                  {((stats.unread / stats.total) * 100).toFixed(1)}% del totale
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

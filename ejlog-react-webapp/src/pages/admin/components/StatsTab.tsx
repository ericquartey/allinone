// ============================================================================
// EJLOG WMS - Stats Tab
// Statistiche e metriche sugli accessi
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Group as UsersIcon,
  Computer as DevicesIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { useGetLoginStatsQuery } from '../../../services/api/usersApi';

export function StatsTab() {
  const [days, setDays] = useState(7);

  const { data, isLoading, error } = useGetLoginStatsQuery({ days });
  const stats = data?.stats;
  const topFailedUsers = data?.topFailedUsers || [];

  if (isLoading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Errore durante il caricamento delle statistiche</Alert>;

  return (
    <Box>
      <Box mb={3}>
        <FormControl size="small">
          <InputLabel>Periodo</InputLabel>
          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            label="Periodo"
          >
            <MenuItem value={1}>Ultimo giorno</MenuItem>
            <MenuItem value={7}>Ultimi 7 giorni</MenuItem>
            <MenuItem value={30}>Ultimi 30 giorni</MenuItem>
            <MenuItem value={90}>Ultimi 90 giorni</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <SuccessIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Login Riusciti
                  </Typography>
                  <Typography variant="h4">
                    {stats?.successfulLogins || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Login Falliti
                  </Typography>
                  <Typography variant="h4">
                    {stats?.failedLogins || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <UsersIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Utenti Unici
                  </Typography>
                  <Typography variant="h4">
                    {stats?.uniqueUsers || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <DevicesIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    IP Unici
                  </Typography>
                  <Typography variant="h4">
                    {stats?.uniqueIPs || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Top 5 Utenti con Più Fallimenti
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell align="right">Tentativi Falliti</TableCell>
                <TableCell>Ultimo Fallimento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topFailedUsers.length > 0 ? (
                topFailedUsers.map((user: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell><strong>{user.username}</strong></TableCell>
                    <TableCell align="right">{user.failedAttempts}</TableCell>
                    <TableCell>
                      {user.lastFailedAttempt ? format(new Date(user.lastFailedAttempt), 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Nessun tentativo fallito nel periodo selezionato
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

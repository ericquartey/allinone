// ============================================================================
// EJLOG WMS - Login History Tab
// Storico completo degli accessi al sistema
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  TablePagination,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { useGetLoginHistoryQuery } from '../../../services/api/usersApi';

export function LoginHistoryTab() {
  const [filters, setFilters] = useState({
    username: '',
    successOnly: false,
    failedOnly: false,
    limit: 50,
    offset: 0,
  });

  const { data, isLoading, error } = useGetLoginHistoryQuery(filters);
  const loginHistory = data?.data || [];
  const pagination = data?.pagination || { total: 0, limit: 50, offset: 0, hasMore: false };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters({ ...filters, offset: newPage * filters.limit });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, limit: parseInt(event.target.value, 10), offset: 0 });
  };

  if (isLoading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Errore durante il caricamento dello storico</Alert>;

  return (
    <Box>
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          placeholder="Cerca username..."
          value={filters.username}
          onChange={(e) => setFilters({ ...filters, username: e.target.value, offset: 0 })}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={filters.successOnly}
              onChange={(e) => setFilters({ ...filters, successOnly: e.target.checked, failedOnly: false, offset: 0 })}
            />
          }
          label="Solo successi"
        />
        <FormControlLabel
          control={
            <Switch
              checked={filters.failedOnly}
              onChange={(e) => setFilters({ ...filters, failedOnly: e.target.checked, successOnly: false, offset: 0 })}
            />
          }
          label="Solo fallimenti"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data/Ora</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Esito</TableCell>
              <TableCell>Motivo Fallimento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loginHistory.map((attempt: any) => (
              <TableRow key={attempt.id}>
                <TableCell>
                  {attempt.attemptTimestamp ? format(new Date(attempt.attemptTimestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}
                </TableCell>
                <TableCell><strong>{attempt.username}</strong></TableCell>
                <TableCell>{attempt.ipAddress || '-'}</TableCell>
                <TableCell>
                  <Chip
                    icon={attempt.success ? <SuccessIcon /> : <ErrorIcon />}
                    label={attempt.success ? 'Successo' : 'Fallito'}
                    color={attempt.success ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{attempt.failureReason || '-'}</TableCell>
              </TableRow>
            ))}
            {loginHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nessun tentativo di login trovato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={Math.floor(filters.offset / filters.limit)}
          onPageChange={handlePageChange}
          rowsPerPage={filters.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>
    </Box>
  );
}

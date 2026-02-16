// ============================================================================
// EJLOG WMS - Saved Reports Tab
// Visualizzazione ed esecuzione report salvati
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import {
  PlayArrow as ExecuteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  ShareOutlined as ShareOutlinedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import {
  useGetReportsQuery,
  useGetReportCategoriesQuery,
  useDeleteReportMutation,
  useExecuteReportMutation,
  useToggleReportFavoriteMutation,
  useToggleReportSharedMutation,
  type CustomReport,
} from '../../../services/api/reportsApi';
import type { ReportExecutionContext } from '../ReportBuilderPageEnhanced';

interface Props {
  onReportExecuted: (result: ReportExecutionContext) => void;
}

export function SavedReportsTab({ onReportExecuted }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterShared, setFilterShared] = useState(false);

  const { data: categories = [] } = useGetReportCategoriesQuery();
  const {
    data: reports = [],
    isLoading,
    error,
    refetch,
  } = useGetReportsQuery({
    category: selectedCategory || undefined,
    favorite: filterFavorites || undefined,
    shared: filterShared || undefined,
  });

  const [deleteReport] = useDeleteReportMutation();
  const [executeReport, { isLoading: isExecuting }] = useExecuteReportMutation();
  const [toggleFavorite] = useToggleReportFavoriteMutation();
  const [toggleShared] = useToggleReportSharedMutation();

  const handleExecute = async (report: CustomReport) => {
    try {
      const result = await executeReport({
        id: report.id,
        parameters: {}, // TODO: Mostrare dialog per parametri se necessari
      }).unwrap();

      onReportExecuted({
        reportId: report.id,
        reportName: report.name,
        columns: result.columns || [],
        data: result.data,
        recordCount: result.recordCount,
        executedAt: result.executedAt,
      });
    } catch (error: any) {
      alert(`Errore esecuzione report: ${error?.data?.error || error.message}`);
    }
  };

  const handleDelete = async (reportId: number, reportName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il report "${reportName}"?`)) {
      return;
    }

    try {
      await deleteReport(reportId).unwrap();
      refetch();
    } catch (error: any) {
      alert(`Errore eliminazione report: ${error?.data?.error || error.message}`);
    }
  };

  const handleToggleFavorite = async (report: CustomReport) => {
    try {
      await toggleFavorite({ id: report.id, favorite: !report.favorite }).unwrap();
    } catch (error: any) {
      console.error('Errore toggle favorite:', error);
    }
  };

  const handleToggleShared = async (report: CustomReport) => {
    try {
      await toggleShared({ id: report.id, shared: !report.shared }).unwrap();
    } catch (error: any) {
      console.error('Errore toggle shared:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Errore caricamento report</Alert>;
  }

  const favoriteReports = reports.filter((r) => r.favorite);
  const totalExecutions = reports.reduce((sum, r) => sum + r.executionCount, 0);

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Report Totali
              </Typography>
              <Typography variant="h4">{reports.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Preferiti
              </Typography>
              <Typography variant="h4" color="warning.main">
                {favoriteReports.length}
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
                Esecuzioni Totali
              </Typography>
              <Typography variant="h4">{totalExecutions}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Categoria"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="small"
            >
              <MenuItem value="">Tutte le categorie</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.category} value={cat.category}>
                  {cat.category} ({cat.reportCount})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant={filterFavorites ? 'contained' : 'outlined'}
              startIcon={<StarIcon />}
              onClick={() => setFilterFavorites(!filterFavorites)}
              fullWidth
            >
              Solo Preferiti
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant={filterShared ? 'contained' : 'outlined'}
              startIcon={<ShareIcon />}
              onClick={() => setFilterShared(!filterShared)}
              fullWidth
            >
              Solo Condivisi
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="center">Esecuzioni</TableCell>
              <TableCell>Ultima Esecuzione</TableCell>
              <TableCell align="center">Condiviso</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} hover>
                <TableCell>
                  <IconButton size="small" onClick={() => handleToggleFavorite(report)}>
                    {report.favorite ? (
                      <StarIcon color="warning" fontSize="small" />
                    ) : (
                      <StarBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <strong>{report.name}</strong>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {report.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {report.category ? (
                    <Chip label={report.category} size="small" color="primary" variant="outlined" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip label={report.executionCount} size="small" />
                </TableCell>
                <TableCell>
                  {report.lastExecuted
                    ? format(new Date(report.lastExecuted), 'dd/MM/yyyy HH:mm')
                    : 'Mai'}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleToggleShared(report)}>
                    {report.shared ? (
                      <ShareIcon color="success" fontSize="small" />
                    ) : (
                      <ShareOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Esegui Report">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleExecute(report)}
                      disabled={isExecuting}
                    >
                      <ExecuteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifica">
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(report.id, report.name)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {reports.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nessun report disponibile. Usa il tab "Builder Report" per crearne uno nuovo.
        </Alert>
      )}
    </Box>
  );
}

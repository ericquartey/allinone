// ============================================================================
// EJLOG WMS - Report Results Tab
// Visualizzazione risultati report con export multi-formato
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
  Typography,
  Alert,
  Button,
  ButtonGroup,
  Chip,
  TablePagination,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import type { ReportExecutionContext } from '../ReportBuilderPageEnhanced';

interface Props {
  executionContext: ReportExecutionContext | null;
}

export function ReportResultsTab({ executionContext }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!executionContext || executionContext.data.length === 0) return;

    const data = executionContext.data;
    const columns = Object.keys(data[0]);

    // Generate CSV
    const csvRows = [columns.join(',')];

    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value || '').replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = executionContext.reportName
      ? `${executionContext.reportName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      : `report_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (using CSV format with .xls extension for simplicity)
  const handleExportExcel = () => {
    if (!executionContext || executionContext.data.length === 0) return;

    const data = executionContext.data;
    const columns = Object.keys(data[0]);

    // Generate TSV (tab-separated for better Excel compatibility)
    const tsvRows = [columns.join('\t')];

    data.forEach((row) => {
      const values = columns.map((col) => String(row[col] || ''));
      tsvRows.push(values.join('\t'));
    });

    const tsvContent = tsvRows.join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = executionContext.reportName
      ? `${executionContext.reportName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xls`
      : `report_${new Date().toISOString().split('T')[0]}.xls`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format cell value based on type
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';

    // Check if it's a date
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        return format(new Date(value), 'dd/MM/yyyy HH:mm');
      } catch {
        return value;
      }
    }

    // Check if it's just a date (no time)
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        return format(new Date(value), 'dd/MM/yyyy');
      } catch {
        return value;
      }
    }

    return String(value);
  };

  if (!executionContext) {
    return (
      <Alert severity="info">
        Nessun risultato disponibile. Esegui un report dal tab "Report Salvati" o "Builder Report"
        per visualizzare i risultati qui.
      </Alert>
    );
  }

  const { data, recordCount, reportName, executedAt } = executionContext;

  if (data.length === 0) {
    return (
      <Alert severity="warning">
        Il report "{reportName}" non ha prodotto risultati.
      </Alert>
    );
  }

  const columns = Object.keys(data[0]);
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Header Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" gutterBottom>
              {reportName}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Chip label={`${recordCount} record`} color="primary" size="small" />
              <Chip label={`${columns.length} colonne`} color="secondary" size="small" />
              {executedAt && (
                <Chip
                  label={`Eseguito: ${format(new Date(executedAt), 'dd/MM/yyyy HH:mm:ss')}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>

          <ButtonGroup variant="contained" size="small">
            <Button startIcon={<CsvIcon />} onClick={handleExportCSV}>
              CSV
            </Button>
            <Button startIcon={<ExcelIcon />} onClick={handleExportExcel}>
              Excel
            </Button>
          </ButtonGroup>
        </Box>
      </Paper>

      {/* Results Table */}
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col}>
                  <strong>{col}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover>
                {columns.map((col) => (
                  <TableCell key={col}>{formatCellValue(row[col])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={recordCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>

      {/* Export Info */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Esporta i risultati:</strong> Usa i pulsanti sopra per esportare i dati in
          formato CSV o Excel. Il file scaricato conterrà tutti i {recordCount} record.
        </Typography>
      </Alert>
    </Box>
  );
}

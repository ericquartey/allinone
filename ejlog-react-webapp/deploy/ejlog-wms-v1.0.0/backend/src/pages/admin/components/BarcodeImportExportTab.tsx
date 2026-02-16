// ============================================================================
// EJLOG WMS - Barcode Import/Export Tab
// Import/Export regole barcode da/a file Excel o CSV
// ============================================================================

import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  DeleteSweep as ClearIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import {
  useGetBarcodeRulesQuery,
  useCreateBarcodeRuleMutation,
} from '../../../services/api/barcodesApi';

interface ImportPreview {
  name: string;
  pattern: string;
  format: string;
  priority: number;
  active: boolean;
  description?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export function BarcodeImportExportTab() {
  const [importPreview, setImportPreview] = useState<ImportPreview[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rules = [], isLoading, refetch } = useGetBarcodeRulesQuery();
  const [createRule] = useCreateBarcodeRuleMutation();

  // Export regole in formato CSV
  const handleExportCSV = () => {
    if (rules.length === 0) {
      alert('Nessuna regola da esportare');
      return;
    }

    // Intestazioni CSV
    const headers = ['name', 'pattern', 'format', 'priority', 'active', 'description'];
    const csvRows = [headers.join(',')];

    // Dati
    rules.forEach((rule) => {
      const row = [
        `"${rule.name || ''}"`,
        `"${rule.pattern || ''}"`,
        `"${rule.format || ''}"`,
        rule.priority || 0,
        rule.active ? '1' : '0',
        `"${rule.description || ''}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `barcode-rules-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export regole in formato JSON
  const handleExportJSON = () => {
    if (rules.length === 0) {
      alert('Nessuna regola da esportare');
      return;
    }

    const exportData = rules.map((rule) => ({
      name: rule.name,
      pattern: rule.pattern,
      format: rule.format,
      priority: rule.priority,
      active: rule.active,
      description: rule.description || '',
      extractors: rule.extractors,
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `barcode-rules-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse file CSV
  const parseCSV = (content: string): ImportPreview[] => {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('File CSV vuoto o invalido');
    }

    // Skip header
    const dataLines = lines.slice(1);
    const previews: ImportPreview[] = [];

    dataLines.forEach((line, index) => {
      // Simple CSV parsing (handles quoted strings)
      const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
      const matches = line.match(regex);

      if (!matches || matches.length < 5) {
        previews.push({
          name: `Riga ${index + 2}`,
          pattern: '',
          format: '',
          priority: 0,
          active: false,
          status: 'error',
          error: 'Formato riga non valido',
        });
        return;
      }

      const [name, pattern, format, priority, active, description] = matches.map((val) =>
        val.replace(/^"|"$/g, '').trim()
      );

      previews.push({
        name: name || `Regola ${index + 1}`,
        pattern: pattern || '',
        format: format || '',
        priority: parseInt(priority) || 0,
        active: active === '1' || active.toLowerCase() === 'true',
        description: description || '',
        status: 'pending',
      });
    });

    return previews;
  };

  // Parse file JSON
  const parseJSON = (content: string): ImportPreview[] => {
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      throw new Error('Il file JSON deve contenere un array di regole');
    }

    return data.map((rule, index) => ({
      name: rule.name || `Regola ${index + 1}`,
      pattern: rule.pattern || '',
      format: rule.format || '',
      priority: rule.priority || 0,
      active: rule.active !== false,
      description: rule.description || '',
      status: 'pending',
    }));
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let previews: ImportPreview[];

        if (file.name.endsWith('.csv')) {
          previews = parseCSV(content);
        } else if (file.name.endsWith('.json')) {
          previews = parseJSON(content);
        } else {
          alert('Formato file non supportato. Usa CSV o JSON');
          return;
        }

        setImportPreview(previews);
      } catch (error: any) {
        alert(`Errore parsing file: ${error.message}`);
      }
    };

    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute import
  const handleExecuteImport = async () => {
    if (importPreview.length === 0) return;

    setIsImporting(true);
    const updatedPreview = [...importPreview];

    for (let i = 0; i < updatedPreview.length; i++) {
      const preview = updatedPreview[i];

      if (!preview.name || !preview.pattern || !preview.format) {
        updatedPreview[i] = {
          ...preview,
          status: 'error',
          error: 'Campi obbligatori mancanti',
        };
        continue;
      }

      try {
        await createRule({
          name: preview.name,
          pattern: preview.pattern,
          format: preview.format,
          priority: preview.priority,
          active: preview.active,
          description: preview.description,
        }).unwrap();

        updatedPreview[i] = { ...preview, status: 'success' };
      } catch (error: any) {
        updatedPreview[i] = {
          ...preview,
          status: 'error',
          error: error?.data?.error || 'Errore durante l\'importazione',
        };
      }

      setImportPreview([...updatedPreview]);
    }

    setIsImporting(false);
    refetch();
  };

  const handleClearPreview = () => {
    setImportPreview([]);
  };

  const pendingCount = importPreview.filter((p) => p.status === 'pending').length;
  const successCount = importPreview.filter((p) => p.status === 'success').length;
  const errorCount = importPreview.filter((p) => p.status === 'error').length;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Export Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Export Regole
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Esporta le regole barcode esistenti in formato CSV o JSON
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={rules.length === 0}
          >
            Esporta CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportJSON}
            disabled={rules.length === 0}
          >
            Esporta JSON
          </Button>
          <Chip label={`${rules.length} regole totali`} color="primary" />
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Import Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Regole
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Importa regole barcode da file CSV o JSON
        </Typography>

        <Alert severity="info" sx={{ my: 2 }} icon={<InfoIcon />}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Formato CSV richiesto:
          </Typography>
          <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
            name,pattern,format,priority,active,description
          </Typography>
          <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
            Formato JSON richiesto:
          </Typography>
          <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
            {`[{"name":"...", "pattern":"...", "format":"...", "priority":100, "active":true, "description":"..."}]`}
          </Typography>
        </Alert>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Seleziona File
          </Button>
          {importPreview.length > 0 && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={handleExecuteImport}
                disabled={isImporting || pendingCount === 0}
              >
                {isImporting ? 'Importazione...' : `Importa ${pendingCount} Regole`}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={handleClearPreview}
                disabled={isImporting}
              >
                Cancella Preview
              </Button>
            </>
          )}
        </Box>

        {/* Import Statistics */}
        {importPreview.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="caption">
                    In Attesa
                  </Typography>
                  <Typography variant="h5">{pendingCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                <CardContent>
                  <Typography color="success.main" variant="caption">
                    Importate
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {successCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                <CardContent>
                  <Typography color="error.main" variant="caption">
                    Errori
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {errorCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Preview Table */}
      {importPreview.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Preview Importazione
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Pattern</TableCell>
                  <TableCell>Formato</TableCell>
                  <TableCell>Priorità</TableCell>
                  <TableCell>Attiva</TableCell>
                  <TableCell>Descrizione</TableCell>
                  <TableCell>Stato</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importPreview.map((preview, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <strong>{preview.name}</strong>
                    </TableCell>
                    <TableCell>
                      <code
                        style={{
                          fontSize: '0.8em',
                          background: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        {preview.pattern}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Chip label={preview.format} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{preview.priority}</TableCell>
                    <TableCell>
                      <Chip
                        label={preview.active ? 'Sì' : 'No'}
                        size="small"
                        color={preview.active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{preview.description || '-'}</TableCell>
                    <TableCell>
                      {preview.status === 'pending' && (
                        <Chip label="In Attesa" size="small" color="default" />
                      )}
                      {preview.status === 'success' && (
                        <Chip label="Importata" size="small" color="success" />
                      )}
                      {preview.status === 'error' && (
                        <Tooltip title={preview.error || 'Errore sconosciuto'}>
                          <Chip label="Errore" size="small" color="error" />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

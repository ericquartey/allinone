// ============================================================================
// EJLOG WMS - Report Builder Tab
// Costruttore interattivo di report con editor SQL e preview
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import {
  PlayArrow as ExecuteIcon,
  Save as SaveIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

import {
  useExecuteCustomQueryMutation,
  useCreateReportMutation,
} from '../../../services/api/reportsApi';
import type { ReportExecutionContext } from '../ReportBuilderPageEnhanced';

interface Props {
  onReportExecuted: (result: ReportExecutionContext) => void;
}

export function ReportBuilderTab({ onReportExecuted }: Props) {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [shared, setShared] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);

  const [executeQuery, { isLoading: isExecuting }] = useExecuteCustomQueryMutation();
  const [createReport, { isLoading: isSaving }] = useCreateReportMutation();

  // Esegue la query in modalità preview
  const handlePreview = async () => {
    if (!sqlQuery.trim()) {
      alert('Inserisci una query SQL');
      return;
    }

    try {
      const result = await executeQuery({ sqlQuery }).unwrap();

      setPreviewData(result.data);

      // Estrai colonne dal primo record
      if (result.data.length > 0) {
        const cols = Object.keys(result.data[0]);
        setPreviewColumns(cols);
      } else {
        setPreviewColumns([]);
      }

      // Mostra risultati nel tab Risultati
      onReportExecuted({
        reportName: reportName || 'Query Preview',
        columns: [],
        data: result.data,
        recordCount: result.recordCount,
        executedAt: result.executedAt,
      });
    } catch (error: any) {
      alert(`Errore esecuzione query:\n${error?.data?.details || error.message}`);
      setPreviewData(null);
      setPreviewColumns([]);
    }
  };

  // Salva il report
  const handleSave = async () => {
    if (!reportName.trim()) {
      alert('Inserisci un nome per il report');
      return;
    }

    if (!sqlQuery.trim()) {
      alert('Inserisci una query SQL');
      return;
    }

    // Genera configurazione colonne automatica dai dati preview
    let columns = null;
    if (previewColumns.length > 0) {
      columns = previewColumns.map((col) => ({
        field: col,
        label: col,
        type: 'string', // TODO: Auto-detect type
      }));
    }

    try {
      await createReport({
        name: reportName,
        description: reportDescription || undefined,
        category: reportCategory || undefined,
        sqlQuery,
        columns,
        shared,
        favorite,
      }).unwrap();

      alert(`Report "${reportName}" salvato con successo!`);

      // Reset form
      setReportName('');
      setReportDescription('');
      setReportCategory('');
      setSqlQuery('');
      setShared(false);
      setFavorite(false);
      setPreviewData(null);
      setPreviewColumns([]);
    } catch (error: any) {
      alert(`Errore salvataggio report:\n${error?.data?.details || error.message}`);
    }
  };

  // Query di esempio
  const loadExample = (type: 'operations' | 'items' | 'users') => {
    const examples = {
      operations: `SELECT TOP 100
  id,
  description,
  orderNumber,
  priority,
  status,
  assignedTo,
  createdDate
FROM Operations
WHERE CAST(createdDate AS DATE) >= DATEADD(DAY, -7, GETDATE())
ORDER BY createdDate DESC`,
      items: `SELECT
  drawer,
  COUNT(*) as totalItems,
  SUM(CAST(quantity AS INT)) as totalQuantity
FROM Items
WHERE drawer IS NOT NULL
GROUP BY drawer
ORDER BY totalItems DESC`,
      users: `SELECT
  CAST(attemptTimestamp AS DATE) as date,
  COUNT(*) as totalAttempts,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedCount
FROM StoricoLogin
WHERE attemptTimestamp >= DATEADD(DAY, -7, GETDATE())
GROUP BY CAST(attemptTimestamp AS DATE)
ORDER BY date DESC`,
    };

    setSqlQuery(examples[type]);
  };

  return (
    <Box>
      {/* Help Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Come creare un report:
        </Typography>
        <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
          <li>Scrivi la query SQL nel campo sottostante</li>
          <li>Clicca "Esegui Preview" per testare la query</li>
          <li>Controlla i risultati nel tab "Risultati"</li>
          <li>Compila nome e descrizione e clicca "Salva Report"</li>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Suggerimento:</strong> Usa le query di esempio per iniziare rapidamente
        </Typography>
      </Alert>

      {/* Report Metadata */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informazioni Report
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Nome Report"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              fullWidth
              required
              placeholder="Es: Operazioni Oggi"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Categoria"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              fullWidth
              placeholder="Es: Operazioni, Inventario, Utenti"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrizione"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Breve descrizione del report..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={shared} onChange={(e) => setShared(e.target.checked)} />}
              label="Condiviso (visibile a tutti gli utenti)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
              }
              label="Preferito"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SQL Query Editor */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            <CodeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Query SQL
          </Typography>

          <Box display="flex" gap={1}>
            <Chip
              label="Esempio: Operazioni"
              size="small"
              onClick={() => loadExample('operations')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Esempio: Items"
              size="small"
              onClick={() => loadExample('items')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Esempio: Login"
              size="small"
              onClick={() => loadExample('users')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>

        <TextField
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          multiline
          rows={12}
          fullWidth
          placeholder="SELECT ... FROM ... WHERE ..."
          sx={{
            fontFamily: 'monospace',
            '& textarea': {
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
          }}
        />

        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Nota di sicurezza:</strong> Solo query SELECT sono permesse. Le query vengono
          eseguite in modalità read-only sul database.
        </Alert>
      </Paper>

      {/* Preview Info */}
      {previewData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Preview Risultati
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Record trovati:</strong> {previewData.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Colonne:</strong> {previewColumns.join(', ')}
          </Typography>
          <Alert severity="success" sx={{ mt: 2 }}>
            Query eseguita con successo! Controlla i risultati nel tab "Risultati".
          </Alert>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Actions */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<ExecuteIcon />}
          onClick={handlePreview}
          disabled={!sqlQuery.trim() || isExecuting}
          size="large"
        >
          {isExecuting ? 'Esecuzione...' : 'Esegui Preview'}
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!reportName.trim() || !sqlQuery.trim() || isSaving}
          size="large"
        >
          {isSaving ? 'Salvataggio...' : 'Salva Report'}
        </Button>
      </Box>
    </Box>
  );
}

// ============================================================================
// EJLOG WMS - Barcode Rules Tab
// CRUD regole barcode con priorità e pattern
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import {
  useGetBarcodeRulesQuery,
  useCreateBarcodeRuleMutation,
  useUpdateBarcodeRuleMutation,
  useDeleteBarcodeRuleMutation,
} from '../../../services/api/barcodesApi';

export function BarcodeRulesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    pattern: '',
    format: '',
    active: true,
    priority: 0,
    description: '',
  });

  const { data: rules = [], isLoading, error, refetch } = useGetBarcodeRulesQuery();
  const [createRule, { isLoading: isCreating }] = useCreateBarcodeRuleMutation();
  const [updateRule, { isLoading: isUpdating }] = useUpdateBarcodeRuleMutation();
  const [deleteRule] = useDeleteBarcodeRuleMutation();

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name || '',
        pattern: rule.pattern || '',
        format: rule.format || '',
        active: rule.active ?? true,
        priority: rule.priority || 0,
        description: rule.description || '',
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        pattern: '',
        format: '',
        active: true,
        priority: 0,
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRule) {
        await updateRule({ id: editingRule.id, data: formData }).unwrap();
      } else {
        await createRule(formData).unwrap();
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (confirm('Sei sicuro di voler eliminare questa regola?')) {
      try {
        await deleteRule(ruleId).unwrap();
        refetch();
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  if (isLoading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Errore caricamento regole barcode</Alert>;

  return (
    <Box>
      <Box mb={3}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuova Regola
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Priorità</TableCell>
              <TableCell>Attiva</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule: any) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.id}</TableCell>
                <TableCell><strong>{rule.name}</strong></TableCell>
                <TableCell>
                  <code style={{ fontSize: '0.85em', background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>
                    {rule.pattern}
                  </code>
                </TableCell>
                <TableCell>
                  <Chip label={rule.format} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{rule.priority}</TableCell>
                <TableCell>
                  <Chip
                    label={rule.active ? 'Sì' : 'No'}
                    color={rule.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{rule.description || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifica">
                    <IconButton size="small" onClick={() => handleOpenDialog(rule)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton size="small" onClick={() => handleDelete(rule.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? 'Modifica Regola' : 'Nuova Regola'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nome Regola"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Pattern RegEx"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              helperText="Espressione regolare per riconoscere il barcode (es: ^[0-9]{13}$)"
              required
              fullWidth
            />
            <TextField
              label="Formato"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              helperText="Tipo barcode (es: EAN13, CODE128, QR)"
              required
              fullWidth
            />
            <TextField
              label="Priorità"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              helperText="Priorità di valutazione (più alto = valutato prima)"
              fullWidth
            />
            <TextField
              label="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Regola Attiva"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleSave} variant="contained" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * Items Management Page - Gestione Articoli
 *
 * Questo componente replica la funzionalità di AnagraficaArticoloPanel del sistema Java Swing.
 * Fornisce CRUD completo per la gestione articoli del magazzino.
 *
 * Funzionalità:
 * - Visualizzazione articoli con paginazione
 * - Filtri di ricerca
 * - Inserimento nuovi articoli
 * - Modifica articoli esistenti
 * - Eliminazione articoli
 * - Gestione barcode
 * - Validazione dati
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import api, { Item, ItemCommand } from '../../services/api-legacy';

interface ItemFormData {
  code: string;
  description: string;
  shortDescription?: string;
  barcode?: string;
  measurementUnit?: string;
  weight?: number | '';
  minimumStock?: number | '';
  height?: number | '';
  width?: number | '';
  depth?: number | '';
  unitPrice?: number | '';
  itemCategory?: string;
  fifoRangeDays?: number | '';
}

const ItemsManagementPage: React.FC = () => {
  // State Management
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Filters
  const [filterCode, setFilterCode] = useState<string>('');
  const [searchCode, setSearchCode] = useState<string>('');

  // Dialog States
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form Data
  const [formData, setFormData] = useState<ItemFormData>({
    code: '',
    description: '',
    shortDescription: '',
    barcode: '',
    measurementUnit: 'PZ',
    weight: '',
    minimumStock: '',
    height: '',
    width: '',
    depth: '',
    unitPrice: '',
    itemCategory: '',
    fifoRangeDays: '',
  });

  // Form Validation
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load Items
  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getItems({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        ...(searchCode && { itemCode: searchCode }),
      });

      if (response.result === 'OK') {
        setItems(response.exportedItems || []);
        setTotalRecords(response.recordNumber || 0);
      } else {
        setError(response.message || 'Errore nel caricamento articoli');
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadItems();
  }, [page, rowsPerPage, searchCode]);

  // Handle Search
  const handleSearch = () => {
    setSearchCode(filterCode);
    setPage(0);
  };

  // Handle Search Clear
  const handleClearSearch = () => {
    setFilterCode('');
    setSearchCode('');
    setPage(0);
  };

  // Handle Page Change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle Rows Per Page Change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setFormData({
      code: '',
      description: '',
      shortDescription: '',
      barcode: '',
      measurementUnit: 'PZ',
      weight: '',
      minimumStock: '',
      height: '',
      width: '',
      depth: '',
      unitPrice: '',
      itemCategory: '',
      fifoRangeDays: '',
    });
    setFormErrors({});
    setDialogMode('create');
    setSelectedItem(null);
    setOpenDialog(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: Item) => {
    setFormData({
      code: item.code,
      description: item.description,
      shortDescription: item.shortDescription || '',
      barcode: item.barcode || '',
      measurementUnit: item.measurementUnit || 'PZ',
      weight: item.weight ?? '',
      minimumStock: item.minimumStock ?? '',
      height: item.height ?? '',
      width: item.width ?? '',
      depth: item.depth ?? '',
      unitPrice: item.unitPrice ?? '',
      itemCategory: item.itemCategory || '',
      fifoRangeDays: item.fifoRangeDays ?? '',
    });
    setFormErrors({});
    setDialogMode('edit');
    setSelectedItem(item);
    setOpenDialog(true);
  };

  // Close Dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormErrors({});
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.code.trim()) {
      errors.code = 'Codice articolo obbligatorio';
    }
    if (!formData.description.trim()) {
      errors.description = 'Descrizione obbligatoria';
    }
    if (formData.weight !== '' && typeof formData.weight === 'number' && formData.weight < 0) {
      errors.weight = 'Il peso non può essere negativo';
    }
    if (formData.minimumStock !== '' && typeof formData.minimumStock === 'number' && formData.minimumStock < 0) {
      errors.minimumStock = 'La scorta minima non può essere negativa';
    }
    if (formData.unitPrice !== '' && typeof formData.unitPrice === 'number' && formData.unitPrice < 0) {
      errors.unitPrice = 'Il prezzo unitario non può essere negativo';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save (Create/Update)
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const itemCommand: ItemCommand = {
        item: formData.code,
        command: 1, // 1 = Insert or Update
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        barcode: formData.barcode || undefined,
        measurementUnit: formData.measurementUnit || undefined,
        weight: typeof formData.weight === 'number' ? formData.weight : undefined,
        minimumStock: typeof formData.minimumStock === 'number' ? formData.minimumStock : undefined,
        height: typeof formData.height === 'number' ? formData.height : undefined,
        width: typeof formData.width === 'number' ? formData.width : undefined,
        depth: typeof formData.depth === 'number' ? formData.depth : undefined,
        unitPrice: typeof formData.unitPrice === 'number' ? formData.unitPrice : undefined,
        itemCategory: formData.itemCategory || undefined,
        fifoRangeDays: typeof formData.fifoRangeDays === 'number' ? formData.fifoRangeDays : undefined,
      };

      const response = await api.manageItems([itemCommand]);

      if (response.result === 'OK') {
        setSuccess(
          dialogMode === 'create'
            ? 'Articolo creato con successo'
            : 'Articolo aggiornato con successo'
        );
        handleCloseDialog();
        loadItems();
      } else {
        setError(response.message || 'Errore nel salvataggio articolo');
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (item: Item) => {
    if (!confirm(`Confermi l'eliminazione dell'articolo "${item.code}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const itemCommand: ItemCommand = {
        item: item.code,
        command: 2, // 2 = Delete
      };

      const response = await api.manageItems([itemCommand]);

      if (response.result === 'OK') {
        setSuccess('Articolo eliminato con successo');
        loadItems();
      } else {
        setError(response.message || "Errore nell'eliminazione articolo");
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Change
  const handleFormChange = (field: keyof ItemFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestione Articoli
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aggiorna lista">
            <IconButton onClick={loadItems} disabled={loading} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            disabled={loading}
          >
            Nuovo Articolo
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cerca per Codice Articolo"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSearch} disabled={loading}>
                Cerca
              </Button>
              <Button variant="outlined" onClick={handleClearSearch} disabled={loading}>
                Pulisci
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Items Table */}
      <Card>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Codice</TableCell>
                    <TableCell>Descrizione</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>U.M.</TableCell>
                    <TableCell align="right">Prezzo</TableCell>
                    <TableCell align="right">Scorta Min</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="center">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Nessun articolo trovato
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.code}
                        hover
                        sx={{
                          backgroundColor: item.inStock ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                          borderLeft: item.inStock ? '4px solid #4CAF50' : 'none',
                          '&:hover': {
                            backgroundColor: item.inStock ? 'rgba(76, 175, 80, 0.15)' : undefined,
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color={item.inStock ? 'success.main' : 'inherit'}>
                            {item.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.description}</Typography>
                          {item.shortDescription && (
                            <Typography variant="caption" color="text.secondary">
                              {item.shortDescription}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.itemCategory && (
                            <Chip label={item.itemCategory} size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>{item.measurementUnit || '-'}</TableCell>
                        <TableCell align="right">
                          {item.unitPrice ? `€ ${item.unitPrice.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right">{item.minimumStock ?? '-'}</TableCell>
                        <TableCell>
                          {item.inStock ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="In Stock"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip label="Non disponibile" size="small" />
                          )}
                          {item.understock && (
                            <Chip
                              icon={<WarningIcon />}
                              label="Sottoscorta"
                              color="warning"
                              size="small"
                              sx={{ ml: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Modifica">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(item)}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(item)}
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Righe per pagina:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
              }
            />
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Nuovo Articolo' : 'Modifica Articolo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Codice Articolo"
                value={formData.code}
                onChange={(e) => handleFormChange('code', e.target.value)}
                error={!!formErrors.code}
                helperText={formErrors.code}
                disabled={dialogMode === 'edit'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Categoria"
                value={formData.itemCategory}
                onChange={(e) => handleFormChange('itemCategory', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Descrizione"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Descrizione Breve"
                value={formData.shortDescription}
                onChange={(e) => handleFormChange('shortDescription', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={(e) => handleFormChange('barcode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unità di Misura"
                value={formData.measurementUnit}
                onChange={(e) => handleFormChange('measurementUnit', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Peso (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  handleFormChange('weight', e.target.value ? parseFloat(e.target.value) : '')
                }
                error={!!formErrors.weight}
                helperText={formErrors.weight}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Scorta Minima"
                type="number"
                value={formData.minimumStock}
                onChange={(e) =>
                  handleFormChange('minimumStock', e.target.value ? parseFloat(e.target.value) : '')
                }
                error={!!formErrors.minimumStock}
                helperText={formErrors.minimumStock}
                inputProps={{ step: '1', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Altezza (cm)"
                type="number"
                value={formData.height}
                onChange={(e) =>
                  handleFormChange('height', e.target.value ? parseFloat(e.target.value) : '')
                }
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Larghezza (cm)"
                type="number"
                value={formData.width}
                onChange={(e) =>
                  handleFormChange('width', e.target.value ? parseFloat(e.target.value) : '')
                }
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Profondità (cm)"
                type="number"
                value={formData.depth}
                onChange={(e) =>
                  handleFormChange('depth', e.target.value ? parseFloat(e.target.value) : '')
                }
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prezzo Unitario (€)"
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  handleFormChange('unitPrice', e.target.value ? parseFloat(e.target.value) : '')
                }
                error={!!formErrors.unitPrice}
                helperText={formErrors.unitPrice}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Range FIFO (giorni)"
                type="number"
                value={formData.fifoRangeDays}
                onChange={(e) =>
                  handleFormChange('fifoRangeDays', e.target.value ? parseInt(e.target.value) : '')
                }
                inputProps={{ step: '1', min: '0' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemsManagementPage;

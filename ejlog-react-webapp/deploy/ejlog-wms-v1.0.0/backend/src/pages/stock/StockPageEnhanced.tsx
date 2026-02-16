/**
 * Stock Page Enhanced - Giacenze Magazzino
 * Pagina completa con tutti i filtri dal sistema EjLog Swing
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Grid, Typography, Alert, CircularProgress,
  Chip, IconButton, Tooltip, FormControlLabel, Checkbox, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Inventory2 as InventoryIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../services/api/endpoints';
import { Stock } from '../../services/api-legacy';

const StockPageEnhanced: React.FC = () => {
  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Filtri base
  const [filterItem, setFilterItem] = useState<string>('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('');
  const [filterLot, setFilterLot] = useState<string>('');
  const [filterSerialNumber, setFilterSerialNumber] = useState<string>('');
  const [filterExpiryDate, setFilterExpiryDate] = useState<string>('');
  const [filterTrayId, setFilterTrayId] = useState<string>('');

  // Opzioni raggruppamento
  const [groupByTray, setGroupByTray] = useState<boolean>(false);

  // Filtri applicati (per la ricerca effettiva)
  const [searchItem, setSearchItem] = useState<string>('');
  const [searchWarehouse, setSearchWarehouse] = useState<string>('');
  const [searchLot, setSearchLot] = useState<string>('');
  const [searchSerialNumber, setSearchSerialNumber] = useState<string>('');
  const [searchExpiryDate, setSearchExpiryDate] = useState<string>('');
  const [searchTrayId, setSearchTrayId] = useState<string>('');
  const [searchGroupByTray, setSearchGroupByTray] = useState<boolean>(false);

  const loadStock = async () => {
    console.log('[STOCK-DEBUG] ===== loadStock called =====');
    console.log('[STOCK-DEBUG] Current state:', {
      searchItem,
      searchWarehouse,
      searchLot,
      searchSerialNumber,
      searchExpiryDate,
      searchTrayId,
      searchGroupByTray,
      page,
      rowsPerPage
    });

    setLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };

      if (searchItem) params.itemCode = searchItem;
      if (searchWarehouse) params.warehouseId = parseInt(searchWarehouse);
      if (searchLot) params.lot = searchLot;
      if (searchSerialNumber) params.serialNumber = searchSerialNumber;
      if (searchExpiryDate) params.expiryDate = searchExpiryDate.replace(/-/g, '');
      if (searchTrayId) params.trayId = parseInt(searchTrayId);
      if (searchGroupByTray) params.groupByTray = true;

      console.log('[STOCK-DEBUG] API params built:', params);
      console.log('[STOCK-DEBUG] About to call axios with API_ENDPOINTS.STOCK...');

      // FIX 1: Usare endpoint corretto
      const response = await axios.get(API_ENDPOINTS.STOCK, {
        params,
        headers: { 'Accept': 'application/json' }
      });

      console.log('[STOCK-DEBUG] API response received:', response.data);

      // FIX 2: Supportare formato risposta backend (exported, not exportedItems)
      const items = response.data.exported || response.data.exportedItems || response.data.data || [];
      const total = response.data.recordNumber || response.data.pagination?.total || items.length;

      console.log('[STOCK-DEBUG] Success! Items:', items.length);

      // FIX 3: Fixare campo ID mancante
      const stockWithIds = items.map((item: any, index: number) => ({
        ...item,
        id: item.id || item.item || `stock-${index}`, // Backend non fornisce ID, usa item come fallback
      }));

      setStock(stockWithIds);
      setTotalRecords(total);
      setHasSearched(true); // Mark as searched so the table renders
    } catch (err: any) {
      console.error('[STOCK-DEBUG] Exception caught:', err);
      console.error('[STOCK-DEBUG] Error message:', err.message);
      console.error('[STOCK-DEBUG] Error stack:', err.stack);
      setError(err.message || 'Errore di connessione');
    } finally {
      console.log('[STOCK-DEBUG] loadStock finally block - setting loading=false');
      setLoading(false);
    }
  };

  // Carica i dati automaticamente al mount e quando cambiano page/rowsPerPage
  useEffect(() => {
    console.log('[STOCK-DEBUG] useEffect triggered - loading stock...');
    loadStock();
  }, [page, rowsPerPage, searchItem, searchWarehouse, searchLot, searchSerialNumber, searchExpiryDate, searchTrayId, searchGroupByTray]);

  const handleSearch = () => {
    console.log('[STOCK-DEBUG] ===== handleSearch called =====');
    console.log('[STOCK-DEBUG] Current filter values:', {
      filterItem,
      filterWarehouse,
      filterLot,
      filterSerialNumber,
      filterExpiryDate,
      filterTrayId,
      groupByTray
    });

    setSearchItem(filterItem);
    setSearchWarehouse(filterWarehouse);
    setSearchLot(filterLot);
    setSearchSerialNumber(filterSerialNumber);
    setSearchExpiryDate(filterExpiryDate);
    setSearchTrayId(filterTrayId);
    setSearchGroupByTray(groupByTray);
    setPage(0);
    setHasSearched(true);

    console.log('[STOCK-DEBUG] About to call loadStock()...');
    loadStock();
  };

  const handleClearFilters = () => {
    setFilterItem('');
    setFilterWarehouse('');
    setFilterLot('');
    setFilterSerialNumber('');
    setFilterExpiryDate('');
    setFilterTrayId('');
    setGroupByTray(false);
    setSearchItem('');
    setSearchWarehouse('');
    setSearchLot('');
    setSearchSerialNumber('');
    setSearchExpiryDate('');
    setSearchTrayId('');
    setSearchGroupByTray(false);
    setHasSearched(false);
    setStock([]);
    setTotalRecords(0);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterItem) count++;
    if (filterWarehouse) count++;
    if (filterLot) count++;
    if (filterSerialNumber) count++;
    if (filterExpiryDate) count++;
    if (filterTrayId) count++;
    return count;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Giacenze Magazzino</Typography>
            {hasSearched && (
              <Typography variant="caption" color="text.secondary">
                {totalRecords} record trovati
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Pulisci filtri">
            <IconButton onClick={handleClearFilters} color="warning" disabled={!hasSearched && getActiveFiltersCount() === 0}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Aggiorna">
            <IconButton onClick={loadStock} disabled={loading || !hasSearched} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Accordion Filtri */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Typography variant="h6">Filtri di Ricerca</Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip label={`${getActiveFiltersCount()} filtri attivi`} size="small" color="primary" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Filtri Base */}
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="Codice Articolo"
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Es: ART001"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="ID Magazzino"
                type="number"
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Es: 1"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="Lotto"
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Es: LOT123"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="Numero Seriale"
                value={filterSerialNumber}
                onChange={(e) => setFilterSerialNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Es: SN456"
              />
            </Grid>

            {/* Filtri Avanzati */}
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="Data Scadenza"
                type="date"
                value={filterExpiryDate}
                onChange={(e) => setFilterExpiryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Filtra per data scadenza"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                fullWidth
                label="ID UDC (Cassetto)"
                type="number"
                value={filterTrayId}
                onChange={(e) => setFilterTrayId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Es: 42"
                helperText="ID unità di carico"
              />
            </Grid>

            {/* Opzioni Raggruppamento */}
            <Grid item xs={12} md={6} lg={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={groupByTray}
                    onChange={(e) => setGroupByTray(e.target.checked)}
                  />
                }
                label="Raggruppa per UDC"
              />
            </Grid>

            {/* Pulsanti Azione */}
            <Grid item xs={12} md={6} lg={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                startIcon={<SearchIcon />}
                sx={{ height: '56px' }}
              >
                Cerca
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Tabella Risultati */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Articolo</TableCell>
                    <TableCell>Descrizione</TableCell>
                    <TableCell>Lotto</TableCell>
                    <TableCell>Num. Seriale</TableCell>
                    <TableCell>Scadenza</TableCell>
                    <TableCell align="right">Quantità</TableCell>
                    <TableCell>Magazzino</TableCell>
                    {groupByTray && <TableCell align="right">UDC</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!hasSearched ? (
                    <TableRow>
                      <TableCell colSpan={groupByTray ? 8 : 7} align="center">
                        <Box sx={{ py: 4 }}>
                          <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body1" color="text.secondary">
                            Inserisci almeno un filtro e premi "Cerca" per visualizzare le giacenze
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Filtri disponibili: Codice Articolo, Magazzino, Lotto, Seriale, Scadenza, UDC
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : stock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={groupByTray ? 8 : 7} align="center">
                        <Box sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nessuna giacenza trovata con i filtri selezionati
                          </Typography>
                          <Button
                            size="small"
                            onClick={handleClearFilters}
                            sx={{ mt: 1 }}
                            startIcon={<ClearIcon />}
                          >
                            Pulisci filtri
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stock.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{item.item}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.description || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          {item.lot ? (
                            <Chip label={item.lot} size="small" variant="outlined" color="info" />
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {item.serialNumber ? (
                            <Chip label={item.serialNumber} size="small" variant="outlined" color="secondary" />
                          ) : '-'}
                        </TableCell>
                        <TableCell>{item.expiryDate || '-'}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.qty}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`MAG ${item.warehouseId}`}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                        </TableCell>
                        {groupByTray && (
                          <TableCell align="right">
                            {item.LU ? (
                              <Chip
                                label={`UDC ${item.LU}`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            ) : '-'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {hasSearched && stock.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[25, 50, 100, 200, 500]}
                component="div"
                count={totalRecords}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Righe per pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`}
              />
            )}
          </>
        )}
      </Card>
    </Box>
  );
};

export default StockPageEnhanced;

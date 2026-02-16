/**
 * Movements Page - Movimenti Magazzino
 * Storico movimenti di magazzino con filtri avanzati
 */
import React, { useState, useEffect } from 'react';
import { Box, Button, Card, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Grid, Typography, Alert, CircularProgress, Chip, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, SwapHoriz as MovementIcon, Search as SearchIcon, TrendingUp, TrendingDown } from '@mui/icons-material';
import api, { Movement } from '../../services/api-legacy';

const MovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [filterItem, setFilterItem] = useState<string>('');
  const [filterList, setFilterList] = useState<string>('');
  const [searchItem, setSearchItem] = useState<string>('');
  const [searchList, setSearchList] = useState<string>('');

  const loadMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getMovements({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        ...(searchItem && { itemCode: searchItem }),
        ...(searchList && { numList: searchList }),
      });
      if (response.result === 'OK') {
        setMovements(response.exportedItems || []);
        setTotalRecords(response.recordNumber || 0);
      } else {
        setError(response.message || 'Errore nel caricamento movimenti');
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMovements(); }, [page, rowsPerPage, searchItem, searchList]);

  const handleSearch = () => {
    setSearchItem(filterItem);
    setSearchList(filterList);
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MovementIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4">Movimenti Magazzino</Typography>
        </Box>
        <Tooltip title="Aggiorna">
          <IconButton onClick={loadMovements} disabled={loading} color="primary"><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><TextField fullWidth label="Codice Articolo" value={filterItem} onChange={(e) => setFilterItem(e.target.value)} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Numero Lista" value={filterList} onChange={(e) => setFilterList(e.target.value)} /></Grid>
          <Grid item xs={12} md={4}><Button fullWidth variant="contained" onClick={handleSearch} disabled={loading} startIcon={<SearchIcon />}>Cerca</Button></Grid>
        </Grid>
      </Card>
      <Card>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Articolo</TableCell>
                    <TableCell>Lista</TableCell>
                    <TableCell>Commessa</TableCell>
                    <TableCell align="right">Q.tà Prec.</TableCell>
                    <TableCell align="right">Delta</TableCell>
                    <TableCell align="right">Q.tà Nuova</TableCell>
                    <TableCell>Utente</TableCell>
                    <TableCell>Magazzino</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center"><Typography variant="body2" color="text.secondary">Nessun movimento trovato</Typography></TableCell></TableRow>
                  ) : (
                    movements.map((mov) => (
                      <TableRow key={mov.id} hover>
                        <TableCell><Typography variant="body2" fontWeight="bold">{mov.id}</Typography></TableCell>
                        <TableCell>{mov.item}</TableCell>
                        <TableCell>{mov.listNumber || '-'}</TableCell>
                        <TableCell>{mov.orderNumber || '-'}</TableCell>
                        <TableCell align="right">{mov.oldQty}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                            {mov.deltaQty > 0 ? <TrendingUp color="success" fontSize="small" /> : <TrendingDown color="error" fontSize="small" />}
                            <Typography variant="body2" color={mov.deltaQty > 0 ? 'success.main' : 'error.main'} fontWeight="bold">{mov.deltaQty > 0 ? '+' : ''}{mov.deltaQty}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right"><Chip label={mov.newQty} color="primary" size="small" /></TableCell>
                        <TableCell><Typography variant="caption">{mov.userList || mov.userPpc || '-'}</Typography></TableCell>
                        <TableCell><Chip label={`MAG ${mov.warehouseId}`} size="small" variant="outlined" /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination rowsPerPageOptions={[25, 50, 100, 200]} component="div" count={totalRecords} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Righe per pagina:" />
          </>
        )}
      </Card>
    </Box>
  );
};
export default MovementsPage;

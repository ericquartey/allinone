/**
 * Dashboard Page - Dashboard WMS con statistiche real-time
 * Overview sistema con metriche chiave
 */
import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, Inventory as InventoryIcon, List as ListIcon, TrendingUp, LocalShipping } from '@mui/icons-material';
import api from '../../services/api-legacy';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ items: 0, lists: 0, stock: 0, movements: 0 });

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, listsRes, stockRes, movRes] = await Promise.all([
        api.getItems({ limit: 1 }),
        api.getLists({ limit: 1 }),
        api.getStock({ limit: 1 }),
        api.getMovements({ limit: 1 })
      ]);
      setStats({
        items: itemsRes.recordNumber || 0,
        lists: listsRes.recordNumber || 0,
        stock: stockRes.recordNumber || 0,
        movements: movRes.recordNumber || 0
      });
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento statistiche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">{title}</Typography>
            <Typography variant="h4" component="div">{loading ? <CircularProgress size={24} /> : value.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ color, opacity: 0.3 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Dashboard WMS EjLog</Typography>
        <Tooltip title="Aggiorna statistiche">
          <IconButton onClick={loadStats} disabled={loading} color="primary"><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Articoli Totali" value={stats.items} icon={<InventoryIcon sx={{ fontSize: 60 }} />} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Liste Attive" value={stats.lists} icon={<ListIcon sx={{ fontSize: 60 }} />} color="info.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Giacenze" value={stats.stock} icon={<LocalShipping sx={{ fontSize: 60 }} />} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Movimenti" value={stats.movements} icon={<TrendingUp sx={{ fontSize: 60 }} />} color="warning.main" />
        </Grid>
      </Grid>
      <Card sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>Sistema EjLog WMS</Typography>
        <Typography variant="body2" color="textSecondary">
          Dashboard sviluppata in React per sostituire l'interfaccia Java Swing originale.
          Tutti i dati provengono dal database reale tramite API REST.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption">Backend: http://localhost:3079/EjLogHostVertimag</Typography>
          <Typography variant="caption">Database: SQL Server 2019 - PROMAG</Typography>
          <Typography variant="caption">Framework: React 18 + TypeScript + Material-UI</Typography>
        </Box>
      </Card>
    </Box>
  );
};
export default DashboardPage;


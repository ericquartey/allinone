// ============================================================================
// EJLOG WMS - Audit Log Viewer Page
// Visualizzazione e analisi log audit sistema
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  Stack,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface AuditLog {
  id: number;
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  previousValue: any;
  newValue: any;
  status: 'success' | 'error' | 'warning';
  errorMessage: string;
  duration: number;
  sessionId: string;
  severity: 'info' | 'warning' | 'critical';
}

interface AuditStats {
  totalLogs: number;
  uniqueUsers: number;
  uniqueActions: number;
  successCount: number;
  errorCount: number;
  criticalCount: number;
  warningCount: number;
  avgDuration: number;
}

export default function AuditLogViewer() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    userId: '',
    action: '',
    entity: '',
    severity: '',
    status: '',
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, pageSize, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: pageSize.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/audit?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })));
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/audit/stats/summary?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPage(0);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, 'info' | 'warning' | 'error'> = {
      info: 'info',
      warning: 'warning',
      critical: 'error',
    };
    return colorMap[severity] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'success' | 'error' | 'warning'> = {
      success: 'success',
      error: 'error',
      warning: 'warning',
    };
    return colorMap[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, JSX.Element> = {
      success: <CheckCircleIcon fontSize="small" />,
      error: <ErrorIcon fontSize="small" />,
      warning: <WarningIcon fontSize="small" />,
    };
    return iconMap[status] || <InfoIcon fontSize="small" />;
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params: GridRenderCellParams) =>
        format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      field: 'username',
      headerName: 'User',
      width: 130,
      flex: 0.5,
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      flex: 0.5,
    },
    {
      field: 'entity',
      headerName: 'Entity',
      width: 120,
    },
    {
      field: 'entityId',
      headerName: 'Entity ID',
      width: 120,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      flex: 1,
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={getSeverityColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'duration',
      headerName: 'Duration (ms)',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? `${params.value}ms` : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleViewDetails(params.row as AuditLog)}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Audit Log Viewer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and analyze system audit logs
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Audit Logs" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <>
          {/* Statistics Cards */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Logs
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalLogs.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Success Rate
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {stats.totalLogs > 0
                          ? ((stats.successCount / stats.totalLogs) * 100).toFixed(1)
                          : 0}
                        %
                      </Typography>
                      <CheckCircleIcon color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Errors
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {stats.errorCount}
                      </Typography>
                      <ErrorIcon color="error" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Avg Duration
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.avgDuration ? `${Math.round(stats.avgDuration)}ms` : '-'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Search"
                  size="small"
                  fullWidth
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Action"
                  size="small"
                  fullWidth
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Entity"
                  size="small"
                  fullWidth
                  value={filters.entity}
                  onChange={(e) => handleFilterChange('entity', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Severity"
                  size="small"
                  fullWidth
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Status"
                  size="small"
                  fullWidth
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1}>
                <Tooltip title="Refresh">
                  <IconButton onClick={fetchLogs} color="primary" sx={{ mt: 0.5 }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Data Grid */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={logs}
              columns={columns}
              loading={loading}
              paginationMode="server"
              rowCount={total}
              page={page}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[25, 50, 100]}
              disableSelectionOnClick
              components={{
                Toolbar: GridToolbar,
              }}
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer',
                },
              }}
            />
          </Paper>
        </>
      )}

      {activeTab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Detailed statistics and analytics coming soon
          </Alert>
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body1">{selectedLog.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.username} ({selectedLog.userId})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Action
                  </Typography>
                  <Typography variant="body1">{selectedLog.action}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Entity
                  </Typography>
                  <Typography variant="body1">{selectedLog.entity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Entity ID
                  </Typography>
                  <Typography variant="body1">{selectedLog.entityId || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1">{selectedLog.ipAddress || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.duration ? `${selectedLog.duration}ms` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{selectedLog.description || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {selectedLog.userAgent || '-'}
                  </Typography>
                </Grid>
              </Grid>

              {selectedLog.previousValue && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Previous Value</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(selectedLog.previousValue, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedLog.newValue && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>New Value</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedLog.errorMessage && (
                <Alert severity="error">
                  <Typography variant="caption">Error Message</Typography>
                  <Typography variant="body2">{selectedLog.errorMessage}</Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

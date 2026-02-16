// ============================================================================
// EJLOG WMS - Table Widget Component
// Widget per visualizzazione tabelle dati
// ============================================================================

import { Box, Typography, IconButton, Skeleton, Chip } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';

interface TableWidgetProps {
  widget: {
    id: string;
    title: string;
    config?: {
      dataSource?: string;
    };
  };
  onRemove: () => void;
  isLocked: boolean;
}

export default function TableWidget({ widget, onRemove, isLocked }: TableWidgetProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTableData();
  }, [widget.config?.dataSource]);

  const fetchTableData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      const mockRows = [
        { id: 1, operation: 'PICK-1001', type: 'Picking', status: 'Completed', items: 15, user: 'Mario Rossi' },
        { id: 2, operation: 'PUT-2034', type: 'Putaway', status: 'In Progress', items: 8, user: 'Luigi Verdi' },
        { id: 3, operation: 'PICK-1002', type: 'Picking', status: 'Pending', items: 22, user: 'Anna Bianchi' },
        { id: 4, operation: 'REF-5012', type: 'Refilling', status: 'Completed', items: 45, user: 'Paolo Neri' },
        { id: 5, operation: 'PICK-1003', type: 'Picking', status: 'In Progress', items: 12, user: 'Maria Gialli' },
      ];

      setRows(mockRows);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'operation', headerName: 'Operation', width: 130 },
    { field: 'type', headerName: 'Type', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
          'Completed': 'success',
          'In Progress': 'warning',
          'Pending': 'default',
        };
        return (
          <Chip
            label={params.value}
            color={statusColors[params.value as string] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'items',
      headerName: 'Items',
      type: 'number',
      width: 80,
    },
    { field: 'user', headerName: 'User', width: 140 },
  ];

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton width="60%" height={30} />
          {!isLocked && <Skeleton variant="circular" width={24} height={24} />}
        </Box>
        <Skeleton variant="rectangular" sx={{ flex: 1 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {widget.title}
        </Typography>
        {!isLocked && (
          <IconButton size="small" onClick={onRemove} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          density="compact"
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
          }}
        />
      </Box>
    </Box>
  );
}

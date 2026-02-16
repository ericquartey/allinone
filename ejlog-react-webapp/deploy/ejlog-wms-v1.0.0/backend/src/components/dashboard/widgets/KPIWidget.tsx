// ============================================================================
// EJLOG WMS - KPI Widget Component
// Widget per visualizzazione KPI con icona e trend
// ============================================================================

import { Box, Typography, IconButton, Card, CardContent, Skeleton } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  List as ListIcon,
  LocalShipping as OperationsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';

interface KPIWidgetProps {
  widget: {
    id: string;
    title: string;
    config?: {
      metric?: string;
      icon?: string;
    };
  };
  onRemove: () => void;
  isLocked: boolean;
}

interface KPIData {
  value: number;
  change: number;
  trend: 'up' | 'down';
}

export default function KPIWidget({ widget, onRemove, isLocked }: KPIWidgetProps) {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, [widget.config?.metric]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // Simulated API call - replace with real endpoint
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data based on metric type
      const mockData: Record<string, KPIData> = {
        operations: { value: 1247, change: 12.5, trend: 'up' },
        lists: { value: 34, change: -3.2, trend: 'down' },
        items: { value: 8932, change: 8.7, trend: 'up' },
        users: { value: 23, change: 4.3, trend: 'up' },
      };

      setData(mockData[widget.config?.metric || 'operations'] || mockData.operations);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    const iconMap: Record<string, JSX.Element> = {
      operations: <OperationsIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      list: <ListIcon sx={{ fontSize: 40, color: '#9c27b0' }} />,
      inventory: <InventoryIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      people: <PeopleIcon sx={{ fontSize: 40, color: '#ed6c02' }} />,
    };

    return iconMap[widget.config?.icon || 'operations'] || iconMap.operations;
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton width="60%" height={30} />
          {!isLocked && <Skeleton variant="circular" width={24} height={24} />}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton variant="circular" width={60} height={60} />
          <Box sx={{ flex: 1, ml: 2 }}>
            <Skeleton width="80%" height={50} />
            <Skeleton width="40%" height={24} />
          </Box>
        </Box>
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

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>{getIcon()}</Box>

        <Box sx={{ flex: 1, ml: 2, textAlign: 'right' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {data?.value.toLocaleString()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            {data?.trend === 'up' ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: data?.trend === 'up' ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {data?.change > 0 ? '+' : ''}
              {data?.change}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

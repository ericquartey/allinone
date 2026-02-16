// ============================================================================
// EJLOG WMS - Chart Widget Component
// Widget per visualizzazione grafici (Line, Bar, Pie)
// ============================================================================

import { Box, Typography, IconButton, Skeleton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartWidgetProps {
  widget: {
    id: string;
    title: string;
    config?: {
      chartType?: 'line' | 'bar' | 'pie';
      dataKey?: string;
    };
  };
  onRemove: () => void;
  isLocked: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ChartWidget({ widget, onRemove, isLocked }: ChartWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [widget.config?.dataKey]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data based on chart type
      if (widget.config?.chartType === 'pie') {
        setData([
          { name: 'Food', value: 400 },
          { name: 'Electronics', value: 300 },
          { name: 'Clothing', value: 200 },
          { name: 'Other', value: 100 },
        ]);
      } else {
        setData([
          { name: 'Jan', value: 400, operations: 240 },
          { name: 'Feb', value: 300, operations: 139 },
          { name: 'Mar', value: 500, operations: 980 },
          { name: 'Apr', value: 780, operations: 390 },
          { name: 'May', value: 590, operations: 480 },
          { name: 'Jun', value: 890, operations: 380 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    const chartType = widget.config?.chartType || 'line';

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => entry.name}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="operations" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

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

      {/* Chart */}
      <Box sx={{ flex: 1, minHeight: 0 }}>{renderChart()}</Box>
    </Box>
  );
}

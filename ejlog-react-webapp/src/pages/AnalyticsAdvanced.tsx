// ============================================================================
// EJLOG WMS - Advanced Analytics Dashboard
// Dashboard analytics avanzato con KPI, grafici interattivi e drill-down
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  ButtonGroup,
  Chip,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';
type ComparisonPeriod = 'previous' | 'year-over-year' | 'none';

export default function AnalyticsAdvanced() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [comparison, setComparison] = useState<ComparisonPeriod>('previous');
  const [loading, setLoading] = useState(false);

  // Mock KPI Data
  const kpiData = useMemo(() => ({
    totalOperations: { value: 15247, change: 12.5, trend: 'up' as const },
    avgProcessingTime: { value: 4.2, change: -8.3, trend: 'down' as const, unit: 'min' },
    throughput: { value: 8932, change: 15.7, trend: 'up' as const },
    efficiency: { value: 94.5, change: 2.1, trend: 'up' as const, unit: '%' },
    errorRate: { value: 1.2, change: -0.5, trend: 'down' as const, unit: '%' },
    activeUsers: { value: 47, change: 5.0, trend: 'up' as const },
  }), []);

  // Mock Time Series Data
  const timeSeriesData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, 'MMM dd'),
        operations: Math.floor(Math.random() * 300) + 400,
        items: Math.floor(Math.random() * 500) + 700,
        users: Math.floor(Math.random() * 20) + 30,
        efficiency: Math.floor(Math.random() * 10) + 85,
      });
    }
    return data;
  }, []);

  // Mock Category Distribution
  const categoryData = [
    { name: 'Picking', value: 4500, percentage: 35 },
    { name: 'Putaway', value: 3200, percentage: 25 },
    { name: 'Refilling', value: 2800, percentage: 22 },
    { name: 'Inventory', value: 1500, percentage: 12 },
    { name: 'Other', value: 800, percentage: 6 },
  ];

  // Mock Performance by Hour
  const hourlyPerformance = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    operations: Math.floor(Math.random() * 100) + 50,
    efficiency: Math.floor(Math.random() * 20) + 75,
  }));

  // Mock User Performance
  const userPerformance = [
    { name: 'Mario R.', operations: 450, efficiency: 96, accuracy: 98 },
    { name: 'Luigi V.', operations: 420, efficiency: 94, accuracy: 97 },
    { name: 'Anna B.', operations: 380, efficiency: 92, accuracy: 96 },
    { name: 'Paolo N.', operations: 350, efficiency: 91, accuracy: 95 },
    { name: 'Maria G.', operations: 320, efficiency: 89, accuracy: 94 },
  ];

  // Mock Radar Chart Data
  const performanceMetrics = [
    { metric: 'Speed', current: 92, target: 95 },
    { metric: 'Accuracy', current: 96, target: 98 },
    { metric: 'Efficiency', current: 94, target: 95 },
    { metric: 'Quality', current: 97, target: 98 },
    { metric: 'Safety', current: 99, target: 100 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
    // TODO: Implement export functionality
  };

  const renderKPICard = (title: string, data: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {data.value.toLocaleString()}
          </Typography>
          {data.unit && (
            <Typography variant="body2" color="text.secondary">
              {data.unit}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {data.trend === 'up' ? (
            <TrendingUp sx={{ color: data.change > 0 ? 'success.main' : 'error.main', fontSize: 20 }} />
          ) : (
            <TrendingDown sx={{ color: data.change < 0 ? 'success.main' : 'error.main', fontSize: 20 }} />
          )}
          <Typography
            variant="body2"
            sx={{ color: data.change > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}
          >
            {data.change > 0 ? '+' : ''}
            {data.change}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs {comparison === 'previous' ? 'previous period' : 'last year'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">Advanced Analytics</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          📊 Advanced Analytics
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Comparison Period */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Compare with</InputLabel>
            <Select value={comparison} onChange={(e) => setComparison(e.target.value as ComparisonPeriod)}>
              <MenuItem value="previous">Previous Period</MenuItem>
              <MenuItem value="year-over-year">Year over Year</MenuItem>
              <MenuItem value="none">No Comparison</MenuItem>
            </Select>
          </FormControl>

          {/* Time Range */}
          <ButtonGroup variant="outlined" size="small">
            <Button variant={timeRange === '7d' ? 'contained' : 'outlined'} onClick={() => setTimeRange('7d')}>
              7D
            </Button>
            <Button variant={timeRange === '30d' ? 'contained' : 'outlined'} onClick={() => setTimeRange('30d')}>
              30D
            </Button>
            <Button variant={timeRange === '90d' ? 'contained' : 'outlined'} onClick={() => setTimeRange('90d')}>
              90D
            </Button>
            <Button variant={timeRange === '1y' ? 'contained' : 'outlined'} onClick={() => setTimeRange('1y')}>
              1Y
            </Button>
          </ButtonGroup>

          {/* Actions */}
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderKPICard('Total Operations', kpiData.totalOperations)}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderKPICard('Avg Processing Time', kpiData.avgProcessingTime)}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderKPICard('Throughput', kpiData.throughput)}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderKPICard('Efficiency', kpiData.efficiency)}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderKPICard('Error Rate', kpiData.errorRate)}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderKPICard('Active Users', kpiData.activeUsers)}
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="fullWidth">
          <Tab label="Trends" />
          <Tab label="Distribution" />
          <Tab label="Performance" />
          <Tab label="Comparison" />
        </Tabs>
      </Paper>

      {/* Tab 1: Trends */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {/* Operations Trend */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Operations Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="operations" stroke="#8884d8" fillOpacity={1} fill="url(#colorOps)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Efficiency Trend */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Efficiency Score
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Multi-metric Comparison */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Multi-Metric Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="operations" fill="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#ff7300" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Distribution */}
      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          {/* Category Distribution Pie */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Operations by Category
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Hourly Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Operations by Hour
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={hourlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="operations" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Performance */}
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          {/* User Performance */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performers
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={userPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="operations" fill="#8884d8" />
                  <Bar dataKey="efficiency" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Performance Radar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={performanceMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Current" dataKey="current" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Target" dataKey="target" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 4: Comparison */}
      <TabPanel value={currentTab} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Period Comparison - Coming Soon
          </Typography>
          <Typography color="text.secondary">
            Advanced period-to-period comparison features will be available here.
          </Typography>
        </Paper>
      </TabPanel>
    </Container>
  );
}

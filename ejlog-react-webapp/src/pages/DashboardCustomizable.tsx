// ============================================================================
// EJLOG WMS - Customizable Dashboard
// Dashboard personalizzabile con widget drag & drop
// ============================================================================

import { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import {
  Container,
  Paper,
  Box,
  Typography,
  IconButton,
  Button,
  Fab,
  Menu,
  MenuItem,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Widget Components
import KPIWidget from '../components/dashboard/widgets/KPIWidget';
import ChartWidget from '../components/dashboard/widgets/ChartWidget';
import TableWidget from '../components/dashboard/widgets/TableWidget';
import QuickActionsWidget from '../components/dashboard/widgets/QuickActionsWidget';
import RecentActivityWidget from '../components/dashboard/widgets/RecentActivityWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetConfig {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'quick-actions' | 'recent-activity';
  title: string;
  config?: any;
}

interface DashboardLayout {
  layouts: {
    lg: Layout[];
    md: Layout[];
    sm: Layout[];
    xs: Layout[];
  };
  widgets: WidgetConfig[];
}

const DEFAULT_LAYOUT: DashboardLayout = {
  layouts: {
    lg: [
      { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'chart-1', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'chart-2', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'table-1', x: 0, y: 6, w: 8, h: 4, minW: 6, minH: 3 },
      { i: 'quick-actions', x: 8, y: 6, w: 4, h: 2, minW: 3, minH: 2 },
      { i: 'recent-activity', x: 8, y: 8, w: 4, h: 2, minW: 3, minH: 2 },
    ],
    md: [
      { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
      { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
      { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
      { i: 'kpi-4', x: 0, y: 2, w: 3, h: 2 },
      { i: 'chart-1', x: 3, y: 2, w: 6, h: 4 },
      { i: 'chart-2', x: 0, y: 6, w: 6, h: 4 },
      { i: 'table-1', x: 6, y: 6, w: 6, h: 4 },
      { i: 'quick-actions', x: 0, y: 10, w: 4, h: 2 },
      { i: 'recent-activity', x: 4, y: 10, w: 4, h: 2 },
    ],
    sm: [
      { i: 'kpi-1', x: 0, y: 0, w: 6, h: 2 },
      { i: 'kpi-2', x: 0, y: 2, w: 6, h: 2 },
      { i: 'kpi-3', x: 0, y: 4, w: 6, h: 2 },
      { i: 'kpi-4', x: 0, y: 6, w: 6, h: 2 },
      { i: 'chart-1', x: 0, y: 8, w: 6, h: 4 },
      { i: 'chart-2', x: 0, y: 12, w: 6, h: 4 },
      { i: 'table-1', x: 0, y: 16, w: 6, h: 4 },
      { i: 'quick-actions', x: 0, y: 20, w: 6, h: 2 },
      { i: 'recent-activity', x: 0, y: 22, w: 6, h: 2 },
    ],
    xs: [
      { i: 'kpi-1', x: 0, y: 0, w: 4, h: 2 },
      { i: 'kpi-2', x: 0, y: 2, w: 4, h: 2 },
      { i: 'kpi-3', x: 0, y: 4, w: 4, h: 2 },
      { i: 'kpi-4', x: 0, y: 6, w: 4, h: 2 },
      { i: 'chart-1', x: 0, y: 8, w: 4, h: 4 },
      { i: 'chart-2', x: 0, y: 12, w: 4, h: 4 },
      { i: 'table-1', x: 0, y: 16, w: 4, h: 4 },
      { i: 'quick-actions', x: 0, y: 20, w: 4, h: 2 },
      { i: 'recent-activity', x: 0, y: 22, w: 4, h: 2 },
    ],
  },
  widgets: [
    { id: 'kpi-1', type: 'kpi', title: 'Total Operations', config: { metric: 'operations', icon: 'operations' } },
    { id: 'kpi-2', type: 'kpi', title: 'Active Lists', config: { metric: 'lists', icon: 'list' } },
    { id: 'kpi-3', type: 'kpi', title: 'Items Moved', config: { metric: 'items', icon: 'inventory' } },
    { id: 'kpi-4', type: 'kpi', title: 'Active Users', config: { metric: 'users', icon: 'people' } },
    { id: 'chart-1', type: 'chart', title: 'Operations Trend', config: { chartType: 'line', dataKey: 'operations' } },
    { id: 'chart-2', type: 'chart', title: 'Items by Category', config: { chartType: 'pie', dataKey: 'categories' } },
    { id: 'table-1', type: 'table', title: 'Recent Operations', config: { dataSource: 'operations' } },
    { id: 'quick-actions', type: 'quick-actions', title: 'Quick Actions', config: {} },
    { id: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', config: {} },
  ],
};

export default function DashboardCustomizable() {
  const { t } = useTranslation();
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUT.layouts);
  const [widgets, setWidgets] = useState(DEFAULT_LAYOUT.widgets);
  const [isLocked, setIsLocked] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load dashboard configuration from API
  useEffect(() => {
    loadDashboardConfig();
  }, []);

  const loadDashboardConfig = async () => {
    try {
      // TODO: Load from API
      const userId = 'current-user'; // Get from auth context
      const response = await fetch(`/api/dashboard/config/${userId}`);

      if (response.ok) {
        const config = await response.json();
        if (config.layouts && config.widgets) {
          setLayouts(config.layouts);
          setWidgets(config.widgets);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error);
      // Use default layout
    }
  };

  const saveDashboardConfig = async () => {
    setIsSaving(true);
    try {
      const userId = 'current-user'; // Get from auth context
      const config = { layouts, widgets };

      const response = await fetch(`/api/dashboard/config/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        console.log('Dashboard configuration saved');
      }
    } catch (error) {
      console.error('Error saving dashboard config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLayoutChange = (layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
  };

  const handleAddWidget = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const addWidget = (type: WidgetConfig['type']) => {
    const newId = `${type}-${Date.now()}`;
    const newWidget: WidgetConfig = {
      id: newId,
      type,
      title: `New ${type} Widget`,
      config: {},
    };

    const newLayoutItem = {
      i: newId,
      x: 0,
      y: Infinity, // Put at bottom
      w: type === 'kpi' ? 3 : type === 'chart' ? 6 : 4,
      h: type === 'kpi' ? 2 : 4,
      minW: 2,
      minH: 2,
    };

    setWidgets([...widgets, newWidget]);
    setLayouts({
      lg: [...layouts.lg, newLayoutItem],
      md: [...layouts.md, newLayoutItem],
      sm: [...layouts.sm, newLayoutItem],
      xs: [...layouts.xs, newLayoutItem],
    });

    handleCloseMenu();
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId));
    setLayouts({
      lg: layouts.lg.filter((l) => l.i !== widgetId),
      md: layouts.md.filter((l) => l.i !== widgetId),
      sm: layouts.sm.filter((l) => l.i !== widgetId),
      xs: layouts.xs.filter((l) => l.i !== widgetId),
    });
  };

  const resetToDefault = () => {
    if (window.confirm('Reset dashboard to default layout?')) {
      setLayouts(DEFAULT_LAYOUT.layouts);
      setWidgets(DEFAULT_LAYOUT.widgets);
    }
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
  };

  const renderWidget = (widget: WidgetConfig) => {
    const commonProps = {
      widget,
      onRemove: () => removeWidget(widget.id),
      isLocked,
    };

    switch (widget.type) {
      case 'kpi':
        return <KPIWidget {...commonProps} />;
      case 'chart':
        return <ChartWidget {...commonProps} />;
      case 'table':
        return <TableWidget {...commonProps} />;
      case 'quick-actions':
        return <QuickActionsWidget {...commonProps} />;
      case 'recent-activity':
        return <RecentActivityWidget {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">Customizable Dashboard</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          📊 Customizable Dashboard
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isLocked ? 'Unlock to edit' : 'Lock layout'}>
            <IconButton onClick={toggleLock} color={isLocked ? 'default' : 'primary'}>
              {isLocked ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset to default">
            <IconButton onClick={resetToDefault} disabled={!isLocked}>
              <ResetIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Save configuration">
            <span>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveDashboardConfig}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 9, sm: 6, xs: 4 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        isDraggable={!isLocked}
        isResizable={!isLocked}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map((widget) => (
          <Paper
            key={widget.id}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              cursor: isLocked ? 'default' : 'move',
              border: isLocked ? '1px solid #e0e0e0' : '2px dashed #1976d2',
            }}
          >
            {renderWidget(widget)}
          </Paper>
        ))}
      </ResponsiveGridLayout>

      {/* Add Widget FAB */}
      {!isLocked && (
        <>
          <Fab
            color="primary"
            aria-label="add widget"
            sx={{ position: 'fixed', bottom: 32, right: 32 }}
            onClick={handleAddWidget}
          >
            <AddIcon />
          </Fab>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
            <MenuItem onClick={() => addWidget('kpi')}>📊 KPI Widget</MenuItem>
            <MenuItem onClick={() => addWidget('chart')}>📈 Chart Widget</MenuItem>
            <MenuItem onClick={() => addWidget('table')}>📋 Table Widget</MenuItem>
            <MenuItem onClick={() => addWidget('quick-actions')}>⚡ Quick Actions</MenuItem>
            <MenuItem onClick={() => addWidget('recent-activity')}>🕒 Recent Activity</MenuItem>
          </Menu>
        </>
      )}
    </Container>
  );
}

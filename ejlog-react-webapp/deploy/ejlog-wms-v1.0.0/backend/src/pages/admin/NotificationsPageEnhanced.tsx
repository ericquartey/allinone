// ============================================================================
// EJLOG WMS - Notifications Page Enhanced
// Sistema notifiche real-time con preferenze e statistiche
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  BarChart as StatsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

import { NotificationCenterTab } from './components/NotificationCenterTab';
import { NotificationPreferencesTab } from './components/NotificationPreferencesTab';
import { NotificationStatsTab } from './components/NotificationStatsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function NotificationsPageEnhanced() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">Notifiche Enhanced</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon fontSize="large" />
          Gestione Notifiche Real-time
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Centro notifiche con preferenze utente e statistiche avanzate
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<NotificationsIcon />}
            label="Centro Notifiche"
            iconPosition="start"
            id="notification-tab-0"
            aria-controls="notification-tabpanel-0"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Preferenze"
            iconPosition="start"
            id="notification-tab-1"
            aria-controls="notification-tabpanel-1"
          />
          <Tab
            icon={<StatsIcon />}
            label="Statistiche"
            iconPosition="start"
            id="notification-tab-2"
            aria-controls="notification-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        <NotificationCenterTab />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <NotificationPreferencesTab />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <NotificationStatsTab />
      </TabPanel>
    </Container>
  );
}

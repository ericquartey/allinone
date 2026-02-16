// ============================================================================
// EJLOG WMS - Enhanced Users Management Page
// Gestione completa utenti con ruoli, permessi e storico accessi
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Groups as GroupsIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

// Tabs Components (will be created separately)
import { UsersListTab } from './components/UsersListTab';
import { UserGroupsTab } from './components/UserGroupsTab';
import { LoginHistoryTab } from './components/LoginHistoryTab';
import { StatsTab } from './components/StatsTab';

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
      id={`users-tabpanel-${index}`}
      aria-labelledby={`users-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UsersManagementPageEnhanced() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Gestione Utenti Enhanced
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestione completa di utenti, gruppi, ruoli e storico accessi
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="users management tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<PeopleIcon />}
                iconPosition="start"
                label="Utenti"
                id="users-tab-0"
                aria-controls="users-tabpanel-0"
              />
              <Tab
                icon={<GroupsIcon />}
                iconPosition="start"
                label="Gruppi e Ruoli"
                id="users-tab-1"
                aria-controls="users-tabpanel-1"
              />
              <Tab
                icon={<HistoryIcon />}
                iconPosition="start"
                label="Storico Accessi"
                id="users-tab-2"
                aria-controls="users-tabpanel-2"
              />
              <Tab
                icon={<AssessmentIcon />}
                iconPosition="start"
                label="Statistiche"
                id="users-tab-3"
                aria-controls="users-tabpanel-3"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            <UsersListTab />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <UserGroupsTab />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <LoginHistoryTab />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <StatsTab />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

// ============================================================================
// EJLOG WMS - Enhanced Report Builder Page
// Gestione completa report personalizzati con builder, esecuzione e export
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Build as BuildIcon,
  TableChart as ResultsIcon,
} from '@mui/icons-material';

// Tabs Components
import { SavedReportsTab } from './components/SavedReportsTab';
import { ReportBuilderTab } from './components/ReportBuilderTab';
import { ReportResultsTab } from './components/ReportResultsTab';

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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export interface ReportExecutionContext {
  reportId?: number;
  reportName?: string;
  columns?: any[];
  data: any[];
  recordCount: number;
  executedAt?: string;
}

export default function ReportBuilderPageEnhanced() {
  const [currentTab, setCurrentTab] = useState(0);
  const [executionContext, setExecutionContext] = useState<ReportExecutionContext | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Callback per quando un report viene eseguito
  const handleReportExecuted = (result: ReportExecutionContext) => {
    setExecutionContext(result);
    setCurrentTab(2); // Vai al tab Risultati
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Report Builder Enhanced
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crea, gestisci ed esporta report personalizzati con query SQL
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="report builder tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<ReportsIcon />}
                iconPosition="start"
                label="Report Salvati"
                id="report-tab-0"
                aria-controls="report-tabpanel-0"
              />
              <Tab
                icon={<BuildIcon />}
                iconPosition="start"
                label="Builder Report"
                id="report-tab-1"
                aria-controls="report-tabpanel-1"
              />
              <Tab
                icon={<ResultsIcon />}
                iconPosition="start"
                label={executionContext ? `Risultati (${executionContext.recordCount})` : 'Risultati'}
                id="report-tab-2"
                aria-controls="report-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            <SavedReportsTab onReportExecuted={handleReportExecuted} />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <ReportBuilderTab onReportExecuted={handleReportExecuted} />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <ReportResultsTab executionContext={executionContext} />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

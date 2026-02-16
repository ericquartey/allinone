// ============================================================================
// EJLOG WMS - Enhanced Barcode Management Page
// Gestione completa regole barcode con test e import/export
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
  QrCode as QrCodeIcon,
  CheckCircle as ValidateIcon,
  CloudUpload as ImportIcon,
} from '@mui/icons-material';

// Tabs Components
import { BarcodeRulesTab } from './components/BarcodeRulesTab';
import { BarcodeTestTab } from './components/BarcodeTestTab';
import { BarcodeImportExportTab } from './components/BarcodeImportExportTab';

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
      id={`barcode-tabpanel-${index}`}
      aria-labelledby={`barcode-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BarcodeManagementPageEnhanced() {
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
            Gestione Barcode Enhanced
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configurazione regole, test validazione e import/export barcode
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="barcode management tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<QrCodeIcon />}
                iconPosition="start"
                label="Regole Barcode"
                id="barcode-tab-0"
                aria-controls="barcode-tabpanel-0"
              />
              <Tab
                icon={<ValidateIcon />}
                iconPosition="start"
                label="Test Validazione"
                id="barcode-tab-1"
                aria-controls="barcode-tabpanel-1"
              />
              <Tab
                icon={<ImportIcon />}
                iconPosition="start"
                label="Import/Export"
                id="barcode-tab-2"
                aria-controls="barcode-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            <BarcodeRulesTab />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <BarcodeTestTab />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <BarcodeImportExportTab />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

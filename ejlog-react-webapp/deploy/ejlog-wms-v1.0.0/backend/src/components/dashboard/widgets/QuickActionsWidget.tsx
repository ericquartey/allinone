// ============================================================================
// EJLOG WMS - Quick Actions Widget Component
// Widget per azioni rapide
// ============================================================================

import { Box, Typography, IconButton, Button, Stack } from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuickActionsWidgetProps {
  widget: {
    id: string;
    title: string;
    config?: any;
  };
  onRemove: () => void;
  isLocked: boolean;
}

export default function QuickActionsWidget({ widget, onRemove, isLocked }: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const quickActions = [
    {
      label: 'New Operation',
      icon: <AddIcon />,
      color: 'primary' as const,
      action: () => navigate('/operations'),
    },
    {
      label: 'Search Items',
      icon: <SearchIcon />,
      color: 'secondary' as const,
      action: () => navigate('/items'),
    },
    {
      label: 'Print Labels',
      icon: <PrintIcon />,
      color: 'info' as const,
      action: () => console.log('Print labels'),
    },
    {
      label: 'Export Data',
      icon: <DownloadIcon />,
      color: 'success' as const,
      action: () => console.log('Export data'),
    },
  ];

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

      {/* Actions */}
      <Stack spacing={1.5} sx={{ flex: 1 }}>
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outlined"
            color={action.color}
            startIcon={action.icon}
            onClick={action.action}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.95rem',
            }}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

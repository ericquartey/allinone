// ============================================================================
// EJLOG WMS - Recent Activity Widget Component
// Widget per visualizzazione attività recenti
// ============================================================================

import { Box, Typography, IconButton, List, ListItem, ListItemText, Avatar, ListItemAvatar, Skeleton } from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface RecentActivityWidgetProps {
  widget: {
    id: string;
    title: string;
    config?: any;
  };
  onRemove: () => void;
  isLocked: boolean;
}

interface Activity {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  user: string;
  timestamp: Date;
}

export default function RecentActivityWidget({ widget, onRemove, isLocked }: RecentActivityWidgetProps) {
  const { i18n } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'success',
          message: 'Completed picking operation PICK-1001',
          user: 'Mario Rossi',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
        },
        {
          id: 2,
          type: 'info',
          message: 'Started putaway operation PUT-2034',
          user: 'Luigi Verdi',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
          id: 3,
          type: 'warning',
          message: 'Low stock alert for item SKU-1234',
          user: 'System',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          id: 4,
          type: 'success',
          message: 'Refilling completed for location A-01-05',
          user: 'Anna Bianchi',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    const iconMap = {
      success: <CheckCircleIcon sx={{ color: 'success.main' }} />,
      error: <ErrorIcon sx={{ color: 'error.main' }} />,
      info: <InfoIcon sx={{ color: 'info.main' }} />,
      warning: <WarningIcon sx={{ color: 'warning.main' }} />,
    };
    return iconMap[type];
  };

  const getActivityColor = (type: Activity['type']) => {
    const colorMap = {
      success: '#4caf50',
      error: '#f44336',
      info: '#2196f3',
      warning: '#ff9800',
    };
    return colorMap[type];
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton width="60%" height={30} />
          {!isLocked && <Skeleton variant="circular" width={24} height={24} />}
        </Box>
        <Box sx={{ flex: 1 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="80%" />
                <Skeleton width="40%" />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  const locale = i18n.language === 'it' ? it : enUS;

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

      {/* Activity List */}
      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {activities.map((activity) => (
          <ListItem key={activity.id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: getActivityColor(activity.type), width: 36, height: 36 }}>
                {getActivityIcon(activity.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={activity.message}
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {activity.user} • {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale })}
                </Typography>
              }
              primaryTypographyProps={{ variant: 'body2', sx: { fontSize: '0.85rem' } }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

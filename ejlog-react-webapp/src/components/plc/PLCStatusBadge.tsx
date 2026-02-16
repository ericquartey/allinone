// ============================================================================
// EJLOG WMS - PLC Status Badge Component
// Badge for displaying PLC device status with color coding
// ============================================================================

import React from 'react';
import Badge from '../shared/Badge';
import { PLCDeviceStatus } from '../../types/plc';

interface PLCStatusBadgeProps {
  status: PLCDeviceStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PLCStatusBadge: React.FC<PLCStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md'
}) => {
  const getStatusConfig = (status: PLCDeviceStatus) => {
    switch (status) {
      case 'ONLINE':
        return {
          variant: 'success' as const,
          label: 'Online',
          icon: '●',
          description: 'Device is connected and operational'
        };
      case 'OFFLINE':
        return {
          variant: 'default' as const,
          label: 'Offline',
          icon: '○',
          description: 'Device is disconnected'
        };
      case 'ERROR':
        return {
          variant: 'danger' as const,
          label: 'Errore',
          icon: '✕',
          description: 'Device is in error state'
        };
      case 'MAINTENANCE':
        return {
          variant: 'warning' as const,
          label: 'Manutenzione',
          icon: '⚠',
          description: 'Device is in maintenance mode'
        };
      case 'INITIALIZING':
        return {
          variant: 'info' as const,
          label: 'Inizializzazione',
          icon: '◌',
          description: 'Device is starting up'
        };
      default:
        return {
          variant: 'default' as const,
          label: 'Unknown',
          icon: '?',
          description: 'Unknown status'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      size={size}
    >
      <span
        className="inline-flex items-center gap-1"
        title={config.description}
        aria-label={`Device status: ${config.label} - ${config.description}`}
      >
        {showIcon && (
          <span className="text-current" aria-hidden="true">
            {config.icon}
          </span>
        )}
        <span>{config.label}</span>
      </span>
    </Badge>
  );
};

export default PLCStatusBadge;

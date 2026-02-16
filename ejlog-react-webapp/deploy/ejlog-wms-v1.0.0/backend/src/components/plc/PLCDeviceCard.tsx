// ============================================================================
// EJLOG WMS - PLC Device Card Component
// Card displaying PLC device information with quick actions
// ============================================================================

import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import PLCStatusBadge from './PLCStatusBadge';
import { PLCDevice, PLCDeviceTypeLabels } from '../../types/plc';

interface PLCDeviceCardProps {
  device: PLCDevice;
  onConnect?: (deviceId: string) => void;
  onDisconnect?: (deviceId: string) => void;
  onReset?: (deviceId: string) => void;
  onViewDetails?: (deviceId: string) => void;
  loading?: {
    connect?: boolean;
    disconnect?: boolean;
    reset?: boolean;
  };
}

const PLCDeviceCard: React.FC<PLCDeviceCardProps> = ({
  device,
  onConnect,
  onDisconnect,
  onReset,
  onViewDetails,
  loading = {}
}) => {
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}g ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const formatConnectionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'S7_TCP': 'S7 TCP/IP',
      'MODBUS_TCP': 'Modbus TCP',
      'PROFINET': 'PROFINET',
      'ETHERNET_IP': 'EtherNet/IP',
      'OPC_UA': 'OPC UA'
    };
    return typeMap[type] || type;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails?.(device.id)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {device.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {device.code}
            </p>
          </div>
          <PLCStatusBadge status={device.status} />
        </div>

        {/* Device Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tipo:</span>
          <span className="text-sm text-gray-600">
            {PLCDeviceTypeLabels[device.type]}
          </span>
        </div>

        {/* Connection Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Indirizzo IP:</span>
            <span className="font-mono text-gray-900">{device.ipAddress}:{device.port}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Connessione:</span>
            <span className="text-gray-900">{formatConnectionType(device.connectionType)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Rack/Slot:</span>
            <span className="text-gray-900">{device.rack}/{device.slot}</span>
          </div>
          {device.location && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Posizione:</span>
              <span className="text-gray-900">{device.location}</span>
            </div>
          )}
        </div>

        {/* Statistics */}
        {device.isConnected && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Uptime</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatUptime(device.uptime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Comandi</p>
              <p className="text-sm font-semibold text-gray-900">
                {device.commandsSentTotal}
              </p>
            </div>
            {device.commandsFailedTotal > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Errori</p>
                <p className="text-sm font-semibold text-red-600">
                  {device.commandsFailedTotal} comandi falliti
                </p>
              </div>
            )}
            {device.alarmCount > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Allarmi</p>
                <p className="text-sm font-semibold text-yellow-600">
                  {device.alarmCount} allarmi attivi
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {!device.isConnected ? (
            <Button
              variant="success"
              size="sm"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onConnect?.(device.id);
              }}
              loading={loading.connect}
              disabled={device.status === 'MAINTENANCE'}
              aria-label={`Connect to ${device.name}`}
            >
              Connetti
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect?.(device.id);
                }}
                loading={loading.disconnect}
                aria-label={`Disconnect from ${device.name}`}
              >
                Disconnetti
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset?.(device.id);
                }}
                loading={loading.reset}
                aria-label={`Reset ${device.name}`}
              >
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Additional Info */}
        {device.description && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">{device.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PLCDeviceCard;

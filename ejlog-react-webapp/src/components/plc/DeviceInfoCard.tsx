// ============================================================================
// EJLOG WMS - Device Info Card Component
// Displays detailed information about a PLC device
// ============================================================================

import React from 'react';
import Card from '../shared/Card';
import PLCStatusBadge from './PLCStatusBadge';
import { PLCDevice, PLCDeviceTypeLabels } from '../../types/plc';

interface DeviceInfoCardProps {
  device: PLCDevice;
}

const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ device }) => {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}g ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const connectionTypeLabels: Record<string, string> = {
    'S7_TCP': 'Siemens S7 TCP/IP',
    'MODBUS_TCP': 'Modbus TCP',
    'PROFINET': 'PROFINET',
    'ETHERNET_IP': 'EtherNet/IP',
    'OPC_UA': 'OPC UA'
  };

  return (
    <Card title="Informazioni Dispositivo">
      <div className="space-y-6">
        {/* Header with Status */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{device.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{device.code}</p>
          </div>
          <PLCStatusBadge status={device.status} size="lg" />
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Tipo Dispositivo</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {PLCDeviceTypeLabels[device.type]}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Produttore</p>
              <p className="text-base text-gray-900 mt-1">{device.manufacturer || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Modello</p>
              <p className="text-base text-gray-900 mt-1">{device.model || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Versione Firmware</p>
              <p className="text-base font-mono text-gray-900 mt-1">
                {device.firmwareVersion || 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Posizione</p>
              <p className="text-base text-gray-900 mt-1">{device.location || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Tipo Connessione</p>
              <p className="text-base text-gray-900 mt-1">
                {connectionTypeLabels[device.connectionType] || device.connectionType}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Indirizzo IP</p>
              <p className="text-base font-mono text-gray-900 mt-1">
                {device.ipAddress}:{device.port}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Rack / Slot</p>
              <p className="text-base text-gray-900 mt-1">
                Rack {device.rack}, Slot {device.slot}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {device.isConnected && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Stato Connessione</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-medium text-green-600 uppercase">Uptime</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {formatUptime(device.uptime)}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-600 uppercase">Ultima Connessione</p>
                <p className="text-sm font-semibold text-blue-900 mt-1">
                  {formatDate(device.lastConnectionTime)}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-medium text-purple-600 uppercase">Timeout</p>
                <p className="text-lg font-bold text-purple-900 mt-1">
                  {device.timeout}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistiche</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Comandi Inviati</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {device.commandsSentTotal.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Comandi Falliti</p>
              <p className={`text-2xl font-bold mt-1 ${
                device.commandsFailedTotal > 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {device.commandsFailedTotal.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Allarmi Attivi</p>
              <p className={`text-2xl font-bold mt-1 ${
                device.alarmCount > 0 ? 'text-yellow-600' : 'text-gray-900'
              }`}>
                {device.alarmCount.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {device.commandsSentTotal > 0
                  ? (((device.commandsSentTotal - device.commandsFailedTotal) / device.commandsSentTotal) * 100).toFixed(1)
                  : '0.0'
                }%
              </p>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Configurazione</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Databuffer Size</p>
              <p className="text-base text-gray-900 mt-1">{device.databufferSize} bytes</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Polling Interval</p>
              <p className="text-base text-gray-900 mt-1">{device.pollingInterval}ms</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Timeout</p>
              <p className="text-base text-gray-900 mt-1">{device.timeout}ms</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {device.description && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Descrizione</h3>
            <p className="text-sm text-gray-600">{device.description}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Creato:</span> {formatDate(device.createdAt)}
            </div>
            <div>
              <span className="font-medium">Ultimo Aggiornamento:</span> {formatDate(device.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeviceInfoCard;

// ============================================================================
// EJLOG WMS - Connection Status Panel Component
// Panel for managing PLC device connection with actions and status
// ============================================================================

import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Alert from '../shared/Alert';
import PLCStatusBadge from './PLCStatusBadge';
import { PLCDevice } from '../../types/plc';

interface ConnectionStatusPanelProps {
  device: PLCDevice;
  onConnect: (deviceId: string) => Promise<void>;
  onDisconnect: (deviceId: string) => Promise<void>;
  onReset: (deviceId: string) => Promise<void>;
}

const ConnectionStatusPanel: React.FC<ConnectionStatusPanelProps> = ({
  device,
  onConnect,
  onDisconnect,
  onReset
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setActionResult(null);
    try {
      await onConnect(device.id);
      setActionResult({ type: 'success', message: 'Dispositivo connesso con successo' });
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante la connessione'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setActionResult(null);
    try {
      await onDisconnect(device.id);
      setActionResult({ type: 'success', message: 'Dispositivo disconnesso con successo' });
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante la disconnessione'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Sei sicuro di voler resettare il dispositivo ${device.name}?`)) {
      return;
    }

    setIsResetting(true);
    setActionResult(null);
    try {
      await onReset(device.id);
      setActionResult({ type: 'success', message: 'Dispositivo resettato con successo' });
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante il reset'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}g ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getConnectionQuality = (): { label: string; color: string; percentage: number } => {
    if (!device.isConnected) {
      return { label: 'Disconnesso', color: 'gray', percentage: 0 };
    }

    const successRate = device.commandsSentTotal > 0
      ? ((device.commandsSentTotal - device.commandsFailedTotal) / device.commandsSentTotal) * 100
      : 100;

    if (successRate >= 95) {
      return { label: 'Eccellente', color: 'green', percentage: successRate };
    } else if (successRate >= 80) {
      return { label: 'Buona', color: 'blue', percentage: successRate };
    } else if (successRate >= 60) {
      return { label: 'Accettabile', color: 'yellow', percentage: successRate };
    } else {
      return { label: 'Scarsa', color: 'red', percentage: successRate };
    }
  };

  const connectionQuality = getConnectionQuality();

  return (
    <Card title="Gestione Connessione">
      <div className="space-y-6">
        {/* Action Result Alert */}
        {actionResult && (
          <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
            {actionResult.message}
          </Alert>
        )}

        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Stato Attuale</p>
            <div className="mt-2">
              <PLCStatusBadge status={device.status} size="lg" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Connessione</p>
            <p className={`text-lg font-bold mt-1 ${
              device.isConnected ? 'text-green-600' : 'text-gray-400'
            }`}>
              {device.isConnected ? 'Connesso' : 'Disconnesso'}
            </p>
          </div>
        </div>

        {/* Connection Quality */}
        {device.isConnected && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Qualità Connessione</span>
              <span className={`text-sm font-semibold text-${connectionQuality.color}-600`}>
                {connectionQuality.label} ({connectionQuality.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${connectionQuality.color}-500 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${connectionQuality.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Connection Details */}
        {device.isConnected && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs font-medium text-green-600 uppercase">Uptime</p>
              <p className="text-xl font-bold text-green-900 mt-1">
                {formatUptime(device.uptime)}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-600 uppercase">Ultima Connessione</p>
              <p className="text-sm font-semibold text-blue-900 mt-1">
                {device.lastConnectionTime
                  ? new Date(device.lastConnectionTime).toLocaleTimeString('it-IT')
                  : 'N/A'
                }
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-medium text-purple-600 uppercase">Polling Interval</p>
              <p className="text-xl font-bold text-purple-900 mt-1">
                {device.pollingInterval}ms
              </p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs font-medium text-orange-600 uppercase">Timeout</p>
              <p className="text-xl font-bold text-orange-900 mt-1">
                {device.timeout}ms
              </p>
            </div>
          </div>
        )}

        {/* Connection Info */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Indirizzo:</span>
            <span className="font-mono font-semibold text-gray-900">
              {device.ipAddress}:{device.port}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rack/Slot:</span>
            <span className="font-semibold text-gray-900">
              {device.rack}/{device.slot}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tipo Connessione:</span>
            <span className="font-semibold text-gray-900">
              {device.connectionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          {!device.isConnected ? (
            <Button
              variant="success"
              fullWidth
              size="lg"
              onClick={handleConnect}
              loading={isConnecting}
              disabled={device.status === 'MAINTENANCE' || isConnecting}
              aria-label="Connect to device"
            >
              {isConnecting ? 'Connessione in corso...' : 'Connetti Dispositivo'}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleDisconnect}
                loading={isDisconnecting}
                disabled={isDisconnecting || isResetting}
                aria-label="Disconnect from device"
              >
                {isDisconnecting ? 'Disconnessione...' : 'Disconnetti'}
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleReset}
                loading={isResetting}
                disabled={isDisconnecting || isResetting}
                aria-label="Reset device"
              >
                {isResetting ? 'Reset...' : 'Reset Dispositivo'}
              </Button>
            </div>
          )}
        </div>

        {/* Warning for Maintenance Mode */}
        {device.status === 'MAINTENANCE' && (
          <Alert variant="warning">
            Il dispositivo è in modalità manutenzione. Alcune operazioni potrebbero non essere disponibili.
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default ConnectionStatusPanel;

// ============================================================================
// EJLOG WMS - Shuttle Control Panel Component
// Control panel for automated shuttle/AGV devices with real-time position tracking
// ============================================================================

import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Alert from '../shared/Alert';
import {
  useGetShuttleStatusQuery,
  useSendShuttleCommandMutation,
  useGetShuttleHistoryQuery
} from '../../services/api/plcApi';
import { PLCDevice } from '../../types/plc';

interface ShuttleControlPanelProps {
  device: PLCDevice;
  onCommandSent?: () => void;
}

type ShuttleMode = 'AUTO' | 'MANUAL' | 'EMERGENCY';
type MovementDirection = 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

const ShuttleControlPanel: React.FC<ShuttleControlPanelProps> = ({ device, onCommandSent }) => {
  const [selectedMode, setSelectedMode] = useState<ShuttleMode>('AUTO');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // API queries
  const {
    data: shuttleStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useGetShuttleStatusQuery(device.id, {
    pollingInterval: 1000, // Update every 1 second for real-time position
    skip: !device.isConnected
  });

  const {
    data: history,
    isLoading: isLoadingHistory
  } = useGetShuttleHistoryQuery({ deviceId: device.id, limit: 10 });

  const [sendCommand, { isLoading: isSending }] = useSendShuttleCommandMutation();

  // Movement control handler
  const handleMovement = async (direction: MovementDirection) => {
    try {
      await sendCommand({
        deviceId: device.id,
        command: `MOVE_${direction}`,
        mode: selectedMode,
        reason: `Manual movement: ${direction}`
      }).unwrap();

      setActionResult({
        type: 'success',
        message: `Movimento ${direction} avviato con successo`
      });
      refetchStatus();
      onCommandSent?.();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante l\'invio del comando'
      });
    }
  };

  // Emergency stop handler
  const handleEmergencyStop = async () => {
    try {
      await sendCommand({
        deviceId: device.id,
        command: 'EMERGENCY_STOP',
        mode: 'EMERGENCY',
        reason: 'Emergency stop activated by operator'
      }).unwrap();

      setActionResult({
        type: 'success',
        message: 'ARRESTO DI EMERGENZA ATTIVATO'
      });
      refetchStatus();
      onCommandSent?.();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: 'ERRORE ARRESTO EMERGENZA: ' + (error instanceof Error ? error.message : 'Errore sconosciuto')
      });
    }
  };

  // Mode change handler
  const handleModeChange = async (mode: ShuttleMode) => {
    try {
      await sendCommand({
        deviceId: device.id,
        command: `SET_MODE_${mode}`,
        mode: mode,
        reason: `Mode changed to ${mode} by operator`
      }).unwrap();

      setSelectedMode(mode);
      setActionResult({
        type: 'success',
        message: `Modalità cambiata a ${mode}`
      });
      refetchStatus();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante il cambio modalità'
      });
    }
  };

  // Calculate battery health color
  const getBatteryColor = (level: number): string => {
    if (level >= 70) return 'text-green-600';
    if (level >= 40) return 'text-yellow-600';
    if (level >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get load status badge color
  const getLoadStatusColor = (isLoaded: boolean): string => {
    return isLoaded ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <Card title={`Controllo Navetta - ${device.name}`}>
      <div className="space-y-6">
        {/* Connection Warning */}
        {!device.isConnected && (
          <Alert variant="warning">
            ⚠️ Dispositivo non connesso. Impossibile inviare comandi.
          </Alert>
        )}

        {/* Action Result */}
        {actionResult && (
          <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
            {actionResult.message}
          </Alert>
        )}

        {/* Real-time Status Grid */}
        {shuttleStatus && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Position */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-600 mb-2">Posizione (X, Y, Z)</p>
              <p className="text-2xl font-bold text-blue-900">
                {shuttleStatus.position.x}, {shuttleStatus.position.y}, {shuttleStatus.position.z}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Bay: {shuttleStatus.position.bay || 'N/A'}
              </p>
            </div>

            {/* Velocity */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs font-medium text-purple-600 mb-2">Velocità</p>
              <p className="text-2xl font-bold text-purple-900">
                {shuttleStatus.velocity.toFixed(1)} <span className="text-lg">m/s</span>
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Accel: {shuttleStatus.acceleration.toFixed(1)} m/s²
              </p>
            </div>

            {/* Battery */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-medium text-green-600 mb-2">Batteria</p>
              <p className={`text-2xl font-bold ${getBatteryColor(shuttleStatus.batteryLevel)}`}>
                {shuttleStatus.batteryLevel}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                {shuttleStatus.isCharging ? '🔌 In carica' : '🔋 In uso'}
              </p>
            </div>

            {/* Load Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Carico</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLoadStatusColor(shuttleStatus.isLoaded)}`}>
                {shuttleStatus.isLoaded ? 'CARICO' : 'VUOTO'}
              </span>
              <p className="text-xs text-gray-600 mt-2">
                Peso: {shuttleStatus.currentWeight.toFixed(1)} kg
              </p>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Modalità Operativa</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedMode === 'AUTO' ? 'primary' : 'ghost'}
              size="md"
              fullWidth
              onClick={() => handleModeChange('AUTO')}
              disabled={!device.isConnected || isSending}
            >
              🤖 AUTO
            </Button>
            <Button
              variant={selectedMode === 'MANUAL' ? 'primary' : 'ghost'}
              size="md"
              fullWidth
              onClick={() => handleModeChange('MANUAL')}
              disabled={!device.isConnected || isSending}
            >
              👤 MANUALE
            </Button>
            <Button
              variant={selectedMode === 'EMERGENCY' ? 'danger' : 'ghost'}
              size="md"
              fullWidth
              onClick={() => handleModeChange('EMERGENCY')}
              disabled={!device.isConnected || isSending}
            >
              ⚠️ EMERGENZA
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedMode === 'AUTO' && '• Navetta in modalità automatica - Segue percorsi programmati'}
            {selectedMode === 'MANUAL' && '• Controllo manuale attivo - Usa i pulsanti direzionali'}
            {selectedMode === 'EMERGENCY' && '• Modalità emergenza - Solo arresto e reset disponibili'}
          </p>
        </div>

        {/* Movement Controls */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Controlli Movimento</h3>

          {/* Horizontal Movement */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div></div>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => handleMovement('FORWARD')}
              disabled={!device.isConnected || isSending || selectedMode === 'EMERGENCY'}
            >
              ⬆️<br />AVANTI
            </Button>
            <div></div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => handleMovement('LEFT')}
              disabled={!device.isConnected || isSending || selectedMode === 'EMERGENCY'}
            >
              ⬅️<br />SINISTRA
            </Button>
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚛</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => handleMovement('RIGHT')}
              disabled={!device.isConnected || isSending || selectedMode === 'EMERGENCY'}
            >
              ➡️<br />DESTRA
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div></div>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => handleMovement('BACKWARD')}
              disabled={!device.isConnected || isSending || selectedMode === 'EMERGENCY'}
            >
              ⬇️<br />INDIETRO
            </Button>
            <div></div>
          </div>

          {/* Vertical Movement */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-300">
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => handleMovement('UP')}
              disabled={!device.isConnected || isSending || selectedMode === 'EMERGENCY'}
            >
              🔼 SU
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => handleMovement('DOWN')}
              disabled={!device.isConnected || isSending || selectedMode === 'EMERGENCY'}
            >
              🔽 GIÙ
            </Button>
          </div>
        </div>

        {/* Emergency Stop - Prominent */}
        <Button
          variant="danger"
          size="lg"
          fullWidth
          onClick={handleEmergencyStop}
          disabled={!device.isConnected || isSending}
          className="!py-6 !text-xl font-bold"
        >
          🛑 ARRESTO DI EMERGENZA
        </Button>

        {/* Safety Interlocks */}
        {shuttleStatus?.safetyInterlocks && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-900 mb-3">
              🔒 Interblocchi di Sicurezza
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(shuttleStatus.safetyInterlocks).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movement History */}
        {history && history.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Storico Movimenti Recenti</h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-xs"
                >
                  <div className="flex-1">
                    <p className="font-mono text-gray-900">{entry.command}</p>
                    <p className="text-gray-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString('it-IT')}
                    </p>
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    entry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    entry.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        {shuttleStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-500">Ultimo Aggiornamento</p>
              <p className="font-semibold text-gray-900 mt-1">
                {new Date(shuttleStatus.lastUpdate).toLocaleTimeString('it-IT')}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-500">Distanza Percorsa</p>
              <p className="font-semibold text-gray-900 mt-1">
                {(shuttleStatus.totalDistance / 1000).toFixed(1)} km
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-500">Temperatura</p>
              <p className="font-semibold text-gray-900 mt-1">
                {shuttleStatus.temperature}°C
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-500">Errori Attivi</p>
              <p className={`font-semibold mt-1 ${shuttleStatus.activeErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {shuttleStatus.activeErrors}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShuttleControlPanel;

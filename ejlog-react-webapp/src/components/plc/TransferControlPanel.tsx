// ============================================================================
// EJLOG WMS - Transfer Control Panel Component
// Control panel for transfer (traslo) devices with load management
// ============================================================================

import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Alert from '../shared/Alert';
import Input from '../shared/Input';
import {
  useGetTransferStatusQuery,
  useSendTransferCommandMutation,
  useGetTransferHistoryQuery
} from '../../services/api/plcApi';
import { PLCDevice } from '../../types/plc';

interface TransferControlPanelProps {
  device: PLCDevice;
  onCommandSent?: () => void;
}

type TransferState = 'IDLE' | 'LOADING' | 'UNLOADING' | 'MOVING' | 'ERROR' | 'MAINTENANCE';
type TransferCommand = 'LOAD' | 'UNLOAD' | 'MOVE_TO_POSITION' | 'HOME' | 'RESET' | 'STOP';

const TransferControlPanel: React.FC<TransferControlPanelProps> = ({ device, onCommandSent }) => {
  const [targetPosition, setTargetPosition] = useState<number>(0);
  const [loadBarcode, setLoadBarcode] = useState<string>('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // API queries
  const {
    data: transferStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useGetTransferStatusQuery(device.id, {
    pollingInterval: 2000, // Update every 2 seconds
    skip: !device.isConnected
  });

  const {
    data: history,
    isLoading: isLoadingHistory
  } = useGetTransferHistoryQuery({ deviceId: device.id, limit: 10 });

  const [sendCommand, { isLoading: isSending }] = useSendTransferCommandMutation();

  // Command handler
  const handleCommand = async (command: TransferCommand, params?: Record<string, any>) => {
    try {
      await sendCommand({
        deviceId: device.id,
        command,
        parameters: params || {},
        reason: `Transfer command: ${command}`
      }).unwrap();

      setActionResult({
        type: 'success',
        message: `Comando ${command} eseguito con successo`
      });
      refetchStatus();
      onCommandSent?.();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante l\'esecuzione del comando'
      });
    }
  };

  // Load operation
  const handleLoad = async () => {
    if (!loadBarcode) {
      setActionResult({ type: 'error', message: 'Inserisci un codice barcode per il carico' });
      return;
    }
    await handleCommand('LOAD', { barcode: loadBarcode });
    setLoadBarcode('');
  };

  // Unload operation
  const handleUnload = async () => {
    await handleCommand('UNLOAD');
  };

  // Move to position
  const handleMoveToPosition = async () => {
    if (targetPosition < 0 || targetPosition > (transferStatus?.maxPosition || 100)) {
      setActionResult({ type: 'error', message: 'Posizione non valida' });
      return;
    }
    await handleCommand('MOVE_TO_POSITION', { position: targetPosition });
  };

  // Get state color
  const getStateColor = (state: TransferState): string => {
    switch (state) {
      case 'IDLE': return 'bg-gray-100 text-gray-800';
      case 'LOADING': return 'bg-blue-100 text-blue-800';
      case 'UNLOADING': return 'bg-yellow-100 text-yellow-800';
      case 'MOVING': return 'bg-purple-100 text-purple-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get state icon
  const getStateIcon = (state: TransferState): string => {
    switch (state) {
      case 'IDLE': return '⏸️';
      case 'LOADING': return '⬇️';
      case 'UNLOADING': return '⬆️';
      case 'MOVING': return '➡️';
      case 'ERROR': return '❌';
      case 'MAINTENANCE': return '🔧';
      default: return '❓';
    }
  };

  return (
    <Card title={`Controllo Traslo - ${device.name}`}>
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

        {/* Current Status */}
        {transferStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* State */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-600 mb-2">Stato Corrente</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStateIcon(transferStatus.state)}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStateColor(transferStatus.state)}`}>
                  {transferStatus.state}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Uptime: {Math.floor(transferStatus.uptime / 3600)}h {Math.floor((transferStatus.uptime % 3600) / 60)}m
              </p>
            </div>

            {/* Position */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs font-medium text-purple-600 mb-2">Posizione Attuale</p>
              <p className="text-3xl font-bold text-purple-900">
                {transferStatus.currentPosition}
              </p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(transferStatus.currentPosition / transferStatus.maxPosition) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Max: {transferStatus.maxPosition} | Home: {transferStatus.homePosition}
              </p>
            </div>

            {/* Load Status */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-medium text-green-600 mb-2">Carico</p>
              {transferStatus.isLoaded ? (
                <>
                  <p className="text-sm font-semibold text-green-900">✅ CARICATO</p>
                  <p className="text-xs text-gray-700 mt-2">
                    Barcode: <span className="font-mono">{transferStatus.loadBarcode || 'N/A'}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Peso: {transferStatus.loadWeight.toFixed(1)} kg
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-600">⭕ VUOTO</p>
                  <p className="text-xs text-gray-500 mt-2">Pronto per carico</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Load/Unload Controls */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Gestione Carico</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Load Section */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-700">
                Carica UDC/Pallet
              </label>
              <Input
                type="text"
                value={loadBarcode}
                onChange={(e) => setLoadBarcode(e.target.value)}
                placeholder="Codice barcode..."
                className="w-full font-mono"
                disabled={!device.isConnected || transferStatus?.isLoaded}
              />
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleLoad}
                loading={isSending}
                disabled={!device.isConnected || !loadBarcode || transferStatus?.isLoaded || isSending}
              >
                ⬇️ Carica
              </Button>
            </div>

            {/* Unload Section */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-700">
                Scarica UDC/Pallet
              </label>
              <div className="p-3 bg-white rounded border border-gray-300 text-sm text-gray-600">
                {transferStatus?.isLoaded ? (
                  <>
                    📦 <span className="font-mono">{transferStatus.loadBarcode || 'Unknown'}</span>
                  </>
                ) : (
                  <>⭕ Nessun carico presente</>
                )}
              </div>
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={handleUnload}
                loading={isSending}
                disabled={!device.isConnected || !transferStatus?.isLoaded || isSending}
              >
                ⬆️ Scarica
              </Button>
            </div>
          </div>
        </div>

        {/* Position Control */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Controllo Posizione</h3>

          <div className="space-y-4">
            {/* Target Position Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Posizione Target (0 - {transferStatus?.maxPosition || 100})
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(parseInt(e.target.value) || 0)}
                  min={0}
                  max={transferStatus?.maxPosition || 100}
                  className="flex-1"
                  disabled={!device.isConnected}
                />
                <Button
                  variant="primary"
                  onClick={handleMoveToPosition}
                  loading={isSending}
                  disabled={!device.isConnected || isSending}
                >
                  ➡️ Vai
                </Button>
              </div>
            </div>

            {/* Quick Position Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => handleCommand('HOME')}
                disabled={!device.isConnected || isSending}
              >
                🏠 Home ({transferStatus?.homePosition || 0})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setTargetPosition(Math.floor((transferStatus?.maxPosition || 100) / 2));
                }}
                disabled={!device.isConnected}
              >
                ↔️ Centro
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setTargetPosition(transferStatus?.maxPosition || 100);
                }}
                disabled={!device.isConnected}
              >
                ➡️ Fine ({transferStatus?.maxPosition || 100})
              </Button>
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => handleCommand('RESET')}
            disabled={!device.isConnected || isSending}
          >
            🔄 Reset Sistema
          </Button>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={() => handleCommand('STOP')}
            disabled={!device.isConnected || isSending}
          >
            🛑 Stop
          </Button>
        </div>

        {/* Sensors Status */}
        {transferStatus?.sensors && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              🔍 Stato Sensori
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.entries(transferStatus.sensors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {transferStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-blue-600">Cicli Totali</p>
              <p className="text-2xl font-bold text-blue-900">{transferStatus.totalCycles}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-600">Cicli OK</p>
              <p className="text-2xl font-bold text-green-900">{transferStatus.successfulCycles}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-xs text-red-600">Errori</p>
              <p className="text-2xl font-bold text-red-900">{transferStatus.errorCount}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-xs text-purple-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-900">
                {transferStatus.totalCycles > 0
                  ? ((transferStatus.successfulCycles / transferStatus.totalCycles) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        )}

        {/* Operation History */}
        {history && history.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Storico Operazioni Recenti</h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-900 truncate">{entry.command}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString('it-IT')} - {entry.userName || 'System'}
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${
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

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded">
          <p>💡 <strong>Suggerimenti:</strong></p>
          <p>• Verifica sempre la posizione prima di caricare/scaricare</p>
          <p>• Il comando Home riporta il traslo alla posizione di riposo</p>
          <p>• Lo stato dei sensori indica la presenza di ostacoli o carichi</p>
          <p>• In caso di errore, esegui un Reset Sistema prima di riprendere le operazioni</p>
        </div>
      </div>
    </Card>
  );
};

export default TransferControlPanel;

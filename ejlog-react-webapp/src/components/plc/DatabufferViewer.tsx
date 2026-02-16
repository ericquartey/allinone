// ============================================================================
// EJLOG WMS - Databuffer Viewer Component
// Component for viewing and editing PLC databuffer values
// ============================================================================

import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Alert from '../shared/Alert';
import { useReadDatabufferQuery, useWriteDatabufferMutation } from '../../services/api/plcApi';

interface DatabufferViewerProps {
  deviceId: string;
  deviceName: string;
}

const DatabufferViewer: React.FC<DatabufferViewerProps> = ({ deviceId, deviceName }) => {
  const [dbNumber, setDbNumber] = useState<number>(1);
  const [startByte, setStartByte] = useState<number>(0);
  const [length, setLength] = useState<number>(32);
  const [writeAddress, setWriteAddress] = useState<number>(0);
  const [writeValue, setWriteValue] = useState<string>('');
  const [writeReason, setWriteReason] = useState<string>('');

  const {
    data: databufferData,
    isLoading,
    error,
    refetch
  } = useReadDatabufferQuery(
    { deviceId, dbNumber, startByte, length },
    { skip: false, pollingInterval: 2000 } // Poll every 2 seconds
  );

  const [writeDatabuffer, { isLoading: isWriting }] = useWriteDatabufferMutation();

  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRead = () => {
    setActionResult(null);
    refetch();
  };

  const handleWrite = async () => {
    if (!writeValue) {
      setActionResult({ type: 'error', message: 'Inserisci un valore da scrivere' });
      return;
    }

    if (!writeReason) {
      setActionResult({ type: 'error', message: 'Inserisci una motivazione per la scrittura' });
      return;
    }

    try {
      // Parse write value as byte array
      const values = writeValue.split(',').map(v => parseInt(v.trim(), 10));

      if (values.some(isNaN)) {
        setActionResult({ type: 'error', message: 'Valori non validi. Usa numeri separati da virgola (es: 1,2,3,4)' });
        return;
      }

      await writeDatabuffer({
        deviceId,
        dbNumber,
        startByte: writeAddress,
        data: values,
        reason: writeReason
      }).unwrap();

      setActionResult({ type: 'success', message: 'Scrittura completata con successo' });
      setWriteValue('');
      setWriteReason('');
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante la scrittura'
      });
    }
  };

  const formatBytes = (data: number[]): string[][] => {
    const rows: string[][] = [];
    for (let i = 0; i < data.length; i += 16) {
      const row = data.slice(i, i + 16);
      rows.push(row.map(b => b.toString(16).padStart(2, '0').toUpperCase()));
    }
    return rows;
  };

  const formatASCII = (bytes: number[]): string => {
    return bytes.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
  };

  return (
    <Card title={`Databuffer Viewer - ${deviceName}`}>
      <div className="space-y-6">
        {/* Read Controls */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Lettura Databuffer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                DB Number
              </label>
              <Input
                type="number"
                value={dbNumber}
                onChange={(e) => setDbNumber(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Byte
              </label>
              <Input
                type="number"
                value={startByte}
                onChange={(e) => setStartByte(parseInt(e.target.value) || 0)}
                min={0}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Length (bytes)
              </label>
              <Input
                type="number"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 32)}
                min={1}
                max={256}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                fullWidth
                onClick={handleRead}
                loading={isLoading}
                disabled={isLoading}
              >
                Leggi
              </Button>
            </div>
          </div>
        </div>

        {/* Action Result */}
        {actionResult && (
          <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
            {actionResult.message}
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="danger">
            Errore durante la lettura del databuffer: {error instanceof Error ? error.message : 'Errore sconosciuto'}
          </Alert>
        )}

        {/* Databuffer Display */}
        {databufferData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                DB{databufferData.dbNumber} @ Byte {startByte}
              </h3>
              <span className="text-xs text-gray-500">
                Ultimo aggiornamento: {new Date(databufferData.timestamp).toLocaleTimeString('it-IT')}
              </span>
            </div>

            {/* Hex View */}
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="font-mono text-xs text-green-400 space-y-1">
                {/* Header */}
                <div className="flex gap-2 text-gray-500 mb-2">
                  <span className="w-16">Offset</span>
                  <span className="flex gap-2">
                    {Array.from({ length: 16 }, (_, i) => (
                      <span key={i} className="w-6 text-center">{i.toString(16).toUpperCase()}</span>
                    ))}
                  </span>
                  <span className="ml-4">ASCII</span>
                </div>

                {/* Data Rows */}
                {formatBytes(databufferData.data).map((row, i) => {
                  const offset = startByte + (i * 16);
                  const rowBytes = databufferData.data.slice(i * 16, (i + 1) * 16);

                  return (
                    <div key={i} className="flex gap-2">
                      <span className="w-16 text-blue-400">{offset.toString(16).padStart(4, '0').toUpperCase()}</span>
                      <span className="flex gap-2">
                        {row.map((byte, j) => (
                          <span key={j} className="w-6 text-center hover:bg-gray-800 cursor-pointer">
                            {byte}
                          </span>
                        ))}
                        {row.length < 16 && Array.from({ length: 16 - row.length }).map((_, j) => (
                          <span key={`empty-${j}`} className="w-6 text-center text-gray-700">--</span>
                        ))}
                      </span>
                      <span className="ml-4 text-yellow-400">{formatASCII(rowBytes)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Byte Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs font-medium text-blue-600">Bytes Letti</p>
                <p className="text-lg font-bold text-blue-900">{databufferData.data.length}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs font-medium text-green-600">Range</p>
                <p className="text-sm font-bold text-green-900">
                  {startByte} - {startByte + databufferData.data.length - 1}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <p className="text-xs font-medium text-purple-600">DB Number</p>
                <p className="text-lg font-bold text-purple-900">{databufferData.dbNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Write Controls */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-900 mb-3">
            ⚠️ Scrittura Databuffer (Avanzato)
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Indirizzo (Byte Offset)
                </label>
                <Input
                  type="number"
                  value={writeAddress}
                  onChange={(e) => setWriteAddress(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valori (separati da virgola)
                </label>
                <Input
                  type="text"
                  value={writeValue}
                  onChange={(e) => setWriteValue(e.target.value)}
                  placeholder="es: 1,2,3,4"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Motivazione (obbligatoria)
              </label>
              <Input
                type="text"
                value={writeReason}
                onChange={(e) => setWriteReason(e.target.value)}
                placeholder="Descrivi la ragione della modifica..."
                className="w-full"
              />
            </div>
            <Button
              variant="danger"
              fullWidth
              onClick={handleWrite}
              loading={isWriting}
              disabled={isWriting || !writeValue || !writeReason}
            >
              {isWriting ? 'Scrittura in corso...' : 'Scrivi nel Databuffer'}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• La visualizzazione si aggiorna automaticamente ogni 2 secondi</p>
          <p>• I valori esadecimali sono mostrati con offset relativo</p>
          <p>• La colonna ASCII mostra i caratteri stampabili (32-126)</p>
          <p>• La scrittura richiede una motivazione per audit trail</p>
        </div>
      </div>
    </Card>
  );
};

export default DatabufferViewer;

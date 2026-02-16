// ============================================================================
// EJLOG WMS - Location Debugger Component
// Advanced debugging tool for location diagnostics with PLC signal monitoring
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Alert from '../shared/Alert';
import Spinner from '../shared/Spinner';
import {
  useGetLocationByCodeQuery,
  useReserveLocationMutation,
  useUnreserveLocationMutation,
  useBlockLocationMutation,
  useUnblockLocationMutation,
  useTriggerInventoryCheckMutation,
} from '../../services/api/locationApi';
import {
  useGetSignalsByDeviceQuery,
  useWriteSignalMutation,
} from '../../services/api/plcApi';
import { Location, LocationStatusLabels } from '../../types/location';

interface LocationDebuggerProps {
  locationCode: string;
  onClose?: () => void;
}

interface DebugLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

const LocationDebugger: React.FC<LocationDebuggerProps> = ({ locationCode, onClose }) => {
  const navigate = useNavigate();
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [testMode, setTestMode] = useState<'status' | 'plc' | 'operations'>('status');
  const [selectedSignalId, setSelectedSignalId] = useState<string>('');
  const [signalValue, setSignalValue] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // API queries
  const {
    data: location,
    isLoading,
    error,
    refetch,
  } = useGetLocationByCodeQuery(locationCode, {
    pollingInterval: autoRefresh ? 2000 : undefined,
  });

  const {
    data: plcSignals,
  } = useGetSignalsByDeviceQuery(
    { deviceId: location?.plcDeviceId || '' },
    { skip: !location?.plcDeviceId || testMode !== 'plc', pollingInterval: autoRefresh ? 1000 : undefined }
  );

  // Mutations
  const [reserveLocation] = useReserveLocationMutation();
  const [unreserveLocation] = useUnreserveLocationMutation();
  const [blockLocation] = useBlockLocationMutation();
  const [unblockLocation] = useUnblockLocationMutation();
  const [triggerInventory] = useTriggerInventoryCheckMutation();
  const [writeSignal, { isLoading: isWritingSignal }] = useWriteSignalMutation();

  // Add debug log
  const addLog = (level: DebugLog['level'], message: string) => {
    const log: DebugLog = {
      timestamp: new Date(),
      level,
      message,
    };
    setDebugLogs((prev) => [log, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // Auto-log location changes
  useEffect(() => {
    if (location) {
      addLog('info', `Location loaded: ${location.code} | Status: ${location.status}`);
    }
  }, [location?.status, location?.isOccupied]);

  // Test operations
  const handleTestReserve = async () => {
    if (!location) return;
    try {
      await reserveLocation({
        locationId: location.id,
        reservedBy: 'DEBUG_USER',
        reservedUntil: new Date(Date.now() + 60 * 60 * 1000), // 1h
        reason: '[DEBUG] Test reservation',
      }).unwrap();
      addLog('success', 'Test reservation successful');
      refetch();
    } catch (error) {
      addLog('error', `Reservation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestUnreserve = async () => {
    if (!location) return;
    try {
      await unreserveLocation({
        locationId: location.id,
        reason: '[DEBUG] Test unreservation',
      }).unwrap();
      addLog('success', 'Test unreservation successful');
      refetch();
    } catch (error) {
      addLog('error', `Unreservation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestBlock = async () => {
    if (!location) return;
    try {
      await blockLocation({
        locationId: location.id,
        reason: '[DEBUG] Test block',
        blockedBy: 'DEBUG_USER',
      }).unwrap();
      addLog('success', 'Test block successful');
      refetch();
    } catch (error) {
      addLog('error', `Block failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestUnblock = async () => {
    if (!location) return;
    try {
      await unblockLocation({
        locationId: location.id,
        reason: '[DEBUG] Test unblock',
      }).unwrap();
      addLog('success', 'Test unblock successful');
      refetch();
    } catch (error) {
      addLog('error', `Unblock failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestInventory = async () => {
    if (!location) return;
    try {
      await triggerInventory({
        locationId: location.id,
        userId: 'DEBUG_USER',
        notes: '[DEBUG] Test inventory check',
      }).unwrap();
      addLog('success', 'Test inventory check triggered');
      refetch();
    } catch (error) {
      addLog('error', `Inventory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleWritePLCSignal = async () => {
    if (!selectedSignalId || !signalValue) {
      addLog('error', 'Select signal and enter value');
      return;
    }

    try {
      await writeSignal({
        signalId: selectedSignalId,
        value: signalValue,
      }).unwrap();
      addLog('success', `Signal ${selectedSignalId} written: ${signalValue}`);
      setSignalValue('');
    } catch (error) {
      addLog('error', `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addLog('info', 'Logs cleared');
  };

  const exportLogs = () => {
    const logsText = debugLogs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
      )
      .join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_debug_${locationCode}_${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Logs exported');
  };

  if (isLoading) {
    return (
      <Card title="Location Debugger">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error || !location) {
    return (
      <Card title="Location Debugger">
        <Alert variant="danger">
          <p className="font-semibold">Error loading location</p>
          <p className="text-sm mt-1">Location not found or error occurred</p>
        </Alert>
      </Card>
    );
  }

  return (
    <Card title={`Location Debugger - ${location.code}`}>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => {
                    setAutoRefresh(e.target.checked);
                    addLog(
                      'info',
                      `Auto-refresh ${e.target.checked ? 'enabled' : 'disabled'}`
                    );
                  }}
                  className="rounded border-gray-300"
                />
                Auto Refresh
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                variant={testMode === 'status' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTestMode('status')}
              >
                📊 Status
              </Button>
              <Button
                variant={testMode === 'operations' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTestMode('operations')}
              >
                ⚙️ Operations
              </Button>
              <Button
                variant={testMode === 'plc' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTestMode('plc')}
                disabled={!location.plcDeviceId}
              >
                🔌 PLC
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              ↻ Refresh
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕ Close
              </Button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Test Controls */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Status</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-mono font-semibold">{location.code}</span>
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold">{LocationStatusLabels[location.status]}</span>
                  <span className="text-gray-600">Occupied:</span>
                  <span className="font-semibold">{location.isOccupied ? 'Yes' : 'No'}</span>
                  <span className="text-gray-600">Utilization:</span>
                  <span className="font-semibold">
                    {location.capacity.utilizationPercent.toFixed(1)}%
                  </span>
                </div>
                {location.plcDeviceId && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600">PLC Device: </span>
                    <span className="text-xs font-mono text-blue-600">
                      {location.plcDeviceId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {testMode === 'status' && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Information</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-semibold text-blue-900">Capacity</p>
                    <p className="text-blue-700">
                      {location.capacity.currentWeight} / {location.capacity.maxWeight} kg
                    </p>
                    <p className="text-blue-700">
                      {location.capacity.currentVolume.toFixed(2)} /{' '}
                      {location.capacity.maxVolume.toFixed(2)} m³
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="font-semibold text-green-900">Configuration</p>
                    <p className="text-green-700">
                      Picking: {location.config.isPickingLocation ? '✓' : '✗'}
                    </p>
                    <p className="text-green-700">
                      Storage: {location.config.isStorageLocation ? '✓' : '✗'}
                    </p>
                    <p className="text-green-700">
                      FIFO: {location.config.fifoEnabled ? '✓' : '✗'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {testMode === 'operations' && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Operations</h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleTestReserve}
                    disabled={location.status !== 'AVAILABLE'}
                    className="w-full"
                  >
                    🔒 Test Reserve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleTestUnreserve}
                    disabled={location.status !== 'RESERVED'}
                    className="w-full"
                  >
                    🔓 Test Unreserve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleTestBlock}
                    disabled={location.status === 'BLOCKED'}
                    className="w-full"
                  >
                    ⛔ Test Block
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleTestUnblock}
                    disabled={location.status !== 'BLOCKED'}
                    className="w-full"
                  >
                    ✓ Test Unblock
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTestInventory}
                    className="w-full"
                  >
                    📋 Trigger Inventory
                  </Button>
                </div>
              </div>
            )}

            {testMode === 'plc' && location.plcDeviceId && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">PLC Signal Control</h3>
                {plcSignals && plcSignals.signals.length > 0 ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Select Signal
                      </label>
                      <Select
                        value={selectedSignalId}
                        onChange={(e) => setSelectedSignalId(e.target.value)}
                        options={[
                          { value: '', label: 'Choose signal...' },
                          ...plcSignals.signals.map((s) => ({
                            value: s.id,
                            label: `${s.name} (${s.dataType})`,
                          })),
                        ]}
                      />
                    </div>
                    {selectedSignalId && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Write Value
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={signalValue}
                            onChange={(e) => setSignalValue(e.target.value)}
                            placeholder="Enter value..."
                            className="flex-1"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleWritePLCSignal}
                            loading={isWritingSignal}
                            disabled={!signalValue}
                          >
                            Write
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Current Signals</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {plcSignals.signals.slice(0, 10).map((signal) => (
                          <div
                            key={signal.id}
                            className="text-xs p-2 bg-gray-50 rounded flex justify-between"
                          >
                            <span className="font-mono text-gray-900">{signal.name}</span>
                            <span className="font-semibold text-blue-600">
                              {signal.value?.toString() || 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/plc/devices/${location.plcDeviceId}`)}
                      className="w-full"
                    >
                      Open PLC Device →
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No PLC signals available</p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Debug Logs */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Debug Logs</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={exportLogs}>
                    📥 Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearLogs}>
                    🗑️ Clear
                  </Button>
                </div>
              </div>
              <div className="space-y-1 max-h-96 overflow-y-auto bg-gray-900 p-3 rounded font-mono text-xs">
                {debugLogs.length === 0 ? (
                  <p className="text-gray-500">No logs yet...</p>
                ) : (
                  debugLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`${
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'warning'
                          ? 'text-yellow-400'
                          : log.level === 'success'
                          ? 'text-green-400'
                          : 'text-gray-300'
                      }`}
                    >
                      [{log.timestamp.toLocaleTimeString('it-IT')}] [
                      {log.level.toUpperCase()}] {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/locations/${location.code}`)}
                  className="w-full"
                >
                  📄 View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    refetch();
                    addLog('info', 'Manual refresh triggered');
                  }}
                  className="w-full"
                >
                  ↻ Manual Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/locations')}
                  className="w-full"
                >
                  ← Back to List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LocationDebugger;

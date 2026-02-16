// ============================================================================
// EJLOG WMS - Signal Detail Page
// Detailed view of a single signal with monitoring, history, and configuration
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Card from '../../components/shared/Card';
import SignalHistoryViewer from '../../components/plc/SignalHistoryViewer';
import {
  useGetSignalByIdQuery,
  useUpdateSignalMutation,
  useUpdateSignalConfigMutation,
  useWriteSignalMutation,
  useGetSignalAlarmsQuery
} from '../../services/api/plcApi';

type TabType = 'info' | 'monitoring' | 'history' | 'alarms' | 'config';

const SignalDetailPage: React.FC = () => {
  const { signalId } = useParams<{ signalId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [writeValue, setWriteValue] = useState<string>('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // API queries
  const {
    data: signal,
    isLoading,
    error,
    refetch
  } = useGetSignalByIdQuery(signalId!, {
    skip: !signalId,
    pollingInterval: activeTab === 'monitoring' ? 1000 : 5000
  });

  const {
    data: alarmsData
  } = useGetSignalAlarmsQuery(
    { signalId: signalId! },
    { skip: !signalId || activeTab !== 'alarms' }
  );

  const [updateSignal] = useUpdateSignalMutation();
  const [updateConfig] = useUpdateSignalConfigMutation();
  const [writeSignal, { isLoading: isWriting }] = useWriteSignalMutation();

  const handleWriteSignal = async () => {
    if (!signal || !writeValue) {
      setActionResult({ type: 'error', message: 'Please enter a value' });
      return;
    }

    try {
      let parsedValue: any = writeValue;

      // Parse value based on data type
      switch (signal.dataType) {
        case 'BIT':
          parsedValue = writeValue.toLowerCase() === 'true' || writeValue === '1';
          break;
        case 'INT':
        case 'DINT':
          parsedValue = parseInt(writeValue, 10);
          if (isNaN(parsedValue)) {
            setActionResult({ type: 'error', message: 'Invalid integer value' });
            return;
          }
          break;
        case 'REAL':
          parsedValue = parseFloat(writeValue);
          if (isNaN(parsedValue)) {
            setActionResult({ type: 'error', message: 'Invalid float value' });
            return;
          }
          break;
      }

      await writeSignal({
        signalId: signal.id,
        value: parsedValue
      }).unwrap();

      setActionResult({ type: 'success', message: 'Value written successfully' });
      setWriteValue('');
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error writing value'
      });
    }
  };

  const handleToggleMonitoring = async (enabled: boolean) => {
    if (!signal) return;

    try {
      await updateConfig({
        signalId: signal.id,
        config: { enabled }
      }).unwrap();
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: 'Failed to update monitoring status'
      });
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'info', label: 'Information', icon: 'ℹ️' },
    { id: 'monitoring', label: 'Real-time', icon: '📊' },
    { id: 'history', label: 'History', icon: '📈' },
    { id: 'alarms', label: 'Alarms', icon: '🚨' },
    { id: 'config', label: 'Configuration', icon: '⚙️' }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="space-y-6">
        <Alert variant="danger">
          <p className="font-semibold">Error loading signal</p>
          <p className="text-sm mt-1">Signal not found or error occurred</p>
        </Alert>
        <Button variant="ghost" onClick={() => navigate('/plc/signals')}>
          ← Back to Signals
        </Button>
      </div>
    );
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (signal.dataType) {
      case 'BIT':
        return value ? 'TRUE' : 'FALSE';
      case 'REAL':
        return Number(value).toFixed(2) + (signal.unit ? ` ${signal.unit}` : '');
      case 'INT':
      case 'DINT':
        return value.toString() + (signal.unit ? ` ${signal.unit}` : '');
      default:
        return value.toString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/plc/signals')}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{signal.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{signal.description}</p>
              <p className="text-xs font-mono text-gray-400 mt-1">{signal.address}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={signal.isMonitored ? 'success' : 'ghost'}
            size="md"
            onClick={() => handleToggleMonitoring(!signal.isMonitored)}
          >
            {signal.isMonitored ? '● Stop Monitor' : '○ Start Monitor'}
          </Button>
          <Button variant="ghost" size="md" onClick={() => refetch()}>
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* Action Result */}
      {actionResult && (
        <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
          {actionResult.message}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Value Card */}
            <Card title="Current Value">
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">Current Value</p>
                  <p className="text-4xl font-bold text-gray-900">{formatValue(signal.value)}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Last update: {new Date(signal.timestamp).toLocaleString('it-IT')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600">Quality</p>
                    <p className="text-lg font-bold text-green-900">{signal.quality}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600">Direction</p>
                    <p className="text-lg font-bold text-purple-900">{signal.direction}</p>
                  </div>
                </div>

                {/* Write Value (for OUTPUT signals) */}
                {signal.direction !== 'INPUT' && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Write New Value
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={writeValue}
                        onChange={(e) => setWriteValue(e.target.value)}
                        placeholder={`Enter ${signal.dataType} value...`}
                        className="flex-1"
                      />
                      <Button
                        variant="primary"
                        onClick={handleWriteSignal}
                        loading={isWriting}
                        disabled={isWriting || !writeValue}
                      >
                        Write
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {signal.dataType === 'BIT' && 'Use: true/false or 1/0'}
                      {signal.dataType === 'REAL' && 'Use: decimal number (e.g., 123.45)'}
                      {(signal.dataType === 'INT' || signal.dataType === 'DINT') && 'Use: integer number'}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Signal Properties */}
            <Card title="Signal Properties">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Data Type</p>
                    <p className="text-sm font-semibold text-gray-900">{signal.dataType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-semibold text-gray-900">{signal.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">DB Number</p>
                    <p className="text-sm font-mono text-gray-900">{signal.dbNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Byte Offset</p>
                    <p className="text-sm font-mono text-gray-900">{signal.byteOffset}</p>
                  </div>
                  {signal.bitOffset !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Bit Offset</p>
                      <p className="text-sm font-mono text-gray-900">{signal.bitOffset}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Unit</p>
                    <p className="text-sm font-semibold text-gray-900">{signal.unit || 'N/A'}</p>
                  </div>
                </div>

                {(signal.minValue !== undefined || signal.maxValue !== undefined) && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Value Range</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{signal.minValue ?? 'N/A'}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
                      <span className="text-sm text-gray-700">{signal.maxValue ?? 'N/A'}</span>
                    </div>
                  </div>
                )}

                {signal.tags && signal.tags.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {signal.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
                  <p>Created: {new Date(signal.createdAt).toLocaleString('it-IT')}</p>
                  <p>Updated: {new Date(signal.updatedAt).toLocaleString('it-IT')}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <Card title="Real-time Monitoring">
            <div className="text-center py-12">
              <p className="text-gray-500">Real-time graph will be displayed here</p>
              <p className="text-sm text-gray-400 mt-2">
                Current value: <span className="font-mono font-bold">{formatValue(signal.value)}</span>
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Monitoring: {signal.isMonitored ? '✅ Active' : '❌ Inactive'}
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'history' && (
          <SignalHistoryViewer signal={signal} />
        )}

        {activeTab === 'alarms' && (
          <Card title="Signal Alarms">
            {alarmsData && alarmsData.alarms.length > 0 ? (
              <div className="space-y-3">
                {alarmsData.alarms.map((alarm) => (
                  <div key={alarm.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{alarm.type} Alarm</p>
                        <p className="text-sm text-gray-600 mt-1">{alarm.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Triggered: {new Date(alarm.triggeredAt).toLocaleString('it-IT')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        alarm.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        alarm.severity === 'ERROR' ? 'bg-orange-100 text-orange-800' :
                        alarm.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alarm.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No active alarms</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'config' && (
          <Card title="Signal Configuration">
            <div className="text-center py-12">
              <p className="text-gray-500">Configuration settings will be displayed here</p>
              <p className="text-sm text-gray-400 mt-2">
                Update interval: {signal.updateInterval}ms
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SignalDetailPage;

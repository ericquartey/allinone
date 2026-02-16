// ============================================================================
// EJLOG WMS - Signal Monitor Panel Component
// Real-time signal monitoring with live graphs and alarm notifications
// ============================================================================

import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Alert from '../shared/Alert';
import {
  useGetSignalByIdQuery,
  useUpdateSignalConfigMutation,
  useGetSignalAlarmsQuery
} from '../../services/api/plcApi';
import { Signal } from '../../types/plc';

interface SignalMonitorPanelProps {
  signalIds: string[];
  updateInterval?: number; // ms
  showAlarms?: boolean;
  showGraph?: boolean;
}

interface SignalDataPoint {
  timestamp: Date;
  value: number;
}

const SignalMonitorPanel: React.FC<SignalMonitorPanelProps> = ({
  signalIds,
  updateInterval = 1000,
  showAlarms = true,
  showGraph = true
}) => {
  const [signalHistory, setSignalHistory] = useState<Record<string, SignalDataPoint[]>>({});
  const [maxDataPoints] = useState(60); // Keep last 60 data points
  const [updateConfig] = useUpdateSignalConfigMutation();

  // Query alarms if enabled
  const {
    data: alarmsData,
    refetch: refetchAlarms
  } = useGetSignalAlarmsQuery(
    { acknowledged: false },
    { skip: !showAlarms, pollingInterval: 5000 }
  );

  // Update signal history for graphing
  const updateSignalHistory = (signalId: string, value: number) => {
    setSignalHistory(prev => {
      const current = prev[signalId] || [];
      const newPoint: SignalDataPoint = {
        timestamp: new Date(),
        value: typeof value === 'number' ? value : 0
      };

      const updated = [...current, newPoint];
      // Keep only last maxDataPoints
      return {
        ...prev,
        [signalId]: updated.slice(-maxDataPoints)
      };
    });
  };

  const handleToggleMonitoring = async (signalId: string, enabled: boolean) => {
    try {
      await updateConfig({
        signalId,
        config: {
          enabled,
          updateInterval: enabled ? updateInterval : 5000
        }
      }).unwrap();
    } catch (error) {
      console.error('Failed to update signal monitoring:', error);
    }
  };

  const formatValue = (value: any, dataType: string, unit?: string): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (dataType) {
      case 'BIT':
        return value ? 'TRUE' : 'FALSE';
      case 'REAL':
        return Number(value).toFixed(2) + (unit ? ` ${unit}` : '');
      case 'INT':
      case 'DINT':
        return value.toString() + (unit ? ` ${unit}` : '');
      default:
        return value.toString();
    }
  };

  const getQualityColor = (quality: 'GOOD' | 'BAD' | 'UNCERTAIN'): string => {
    switch (quality) {
      case 'GOOD': return 'text-green-600';
      case 'BAD': return 'text-red-600';
      case 'UNCERTAIN': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const renderMiniGraph = (signalId: string, signal: Signal) => {
    const history = signalHistory[signalId] || [];
    if (history.length < 2) return null;

    // Calculate min/max for scaling
    const values = history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Generate SVG path
    const width = 200;
    const height = 60;
    const points = history.map((point, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${x},${y}`;
    });

    return (
      <div className="mt-2">
        <svg width={width} height={height} className="border border-gray-200 rounded bg-gray-50">
          {/* Grid lines */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e5e7eb" strokeWidth="1" />

          {/* Graph line */}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />

          {/* Current value marker */}
          <circle
            cx={width}
            cy={height - ((signal.value - min) / range) * height}
            r="3"
            fill="#ef4444"
          />
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min: {min.toFixed(1)}{signal.unit}</span>
          <span>Max: {max.toFixed(1)}{signal.unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Active Alarms */}
      {showAlarms && alarmsData && alarmsData.alarms.length > 0 && (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <div>
              <strong>🚨 Active Alarms: {alarmsData.alarms.length}</strong>
              <p className="text-sm mt-1">
                {alarmsData.alarms.slice(0, 3).map(alarm => alarm.signalName).join(', ')}
                {alarmsData.alarms.length > 3 && ` and ${alarmsData.alarms.length - 3} more`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchAlarms()}>
              View All
            </Button>
          </div>
        </Alert>
      )}

      {/* Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {signalIds.map(signalId => (
          <SignalMonitorCard
            key={signalId}
            signalId={signalId}
            updateInterval={updateInterval}
            showGraph={showGraph}
            onValueUpdate={updateSignalHistory}
            onToggleMonitoring={handleToggleMonitoring}
            renderMiniGraph={renderMiniGraph}
            formatValue={formatValue}
            getQualityColor={getQualityColor}
          />
        ))}
      </div>

      {signalIds.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No signals selected for monitoring</p>
          <p className="text-sm text-gray-400 mt-2">
            Add signals from the Signal Browser to start monitoring
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Signal Monitor Card Component
interface SignalMonitorCardProps {
  signalId: string;
  updateInterval: number;
  showGraph: boolean;
  onValueUpdate: (signalId: string, value: number) => void;
  onToggleMonitoring: (signalId: string, enabled: boolean) => void;
  renderMiniGraph: (signalId: string, signal: Signal) => React.ReactNode;
  formatValue: (value: any, dataType: string, unit?: string) => string;
  getQualityColor: (quality: 'GOOD' | 'BAD' | 'UNCERTAIN') => string;
}

const SignalMonitorCard: React.FC<SignalMonitorCardProps> = ({
  signalId,
  updateInterval,
  showGraph,
  onValueUpdate,
  onToggleMonitoring,
  renderMiniGraph,
  formatValue,
  getQualityColor
}) => {
  const {
    data: signal,
    isLoading,
    error
  } = useGetSignalByIdQuery(signalId, {
    pollingInterval: updateInterval
  });

  // Update history when signal value changes
  useEffect(() => {
    if (signal && typeof signal.value === 'number') {
      onValueUpdate(signalId, signal.value);
    }
  }, [signal?.value, signalId, onValueUpdate]);

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error || !signal) {
    return (
      <Card>
        <Alert variant="danger">
          Failed to load signal: {signalId}
        </Alert>
      </Card>
    );
  }

  // Calculate trend (comparing last 2 values if available)
  const getTrend = (): '↑' | '↓' | '→' => {
    // Placeholder - would need history comparison
    return '→';
  };

  return (
    <Card>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {signal.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">{signal.description}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{signal.address}</p>
          </div>
          <button
            onClick={() => onToggleMonitoring(signalId, !signal.isMonitored)}
            className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center ${
              signal.isMonitored
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={signal.isMonitored ? 'Stop monitoring' : 'Start monitoring'}
          >
            {signal.isMonitored ? '●' : '○'}
          </button>
        </div>

        {/* Current Value */}
        <div className="flex items-baseline justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase">Current Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(signal.value, signal.dataType, signal.unit)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl">{getTrend()}</span>
            <p className={`text-xs font-semibold ${getQualityColor(signal.quality)}`}>
              {signal.quality}
            </p>
          </div>
        </div>

        {/* Mini Graph */}
        {showGraph && signal.dataType !== 'BIT' && signal.dataType !== 'STRING' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Last {60} seconds</p>
            {renderMiniGraph(signalId, signal)}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-blue-600 font-medium">Type</p>
            <p className="text-blue-900 font-semibold">{signal.dataType}</p>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <p className="text-purple-600 font-medium">Direction</p>
            <p className="text-purple-900 font-semibold">{signal.direction}</p>
          </div>
        </div>

        {/* Range Indicator (for numeric signals) */}
        {signal.minValue !== undefined && signal.maxValue !== undefined && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Range</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{signal.minValue}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                {typeof signal.value === 'number' && (
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{
                      width: `${((signal.value - signal.minValue) / (signal.maxValue - signal.minValue)) * 100}%`
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-gray-600">{signal.maxValue}</span>
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last update: {new Date(signal.timestamp).toLocaleTimeString('it-IT')}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SignalMonitorPanel;

// ============================================================================
// EJLOG WMS - Signal History Viewer Component
// Historical data visualization with time range selection and export
// ============================================================================

import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Spinner from '../shared/Spinner';
import Alert from '../shared/Alert';
import { useGetSignalHistoryQuery } from '../../services/api/plcApi';
import { Signal, SignalHistory } from '../../types/plc';

interface SignalHistoryViewerProps {
  signal: Signal;
  onClose?: () => void;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

const SignalHistoryViewer: React.FC<SignalHistoryViewerProps> = ({ signal, onClose }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customStartTime, setCustomStartTime] = useState<string>('');
  const [customEndTime, setCustomEndTime] = useState<string>('');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // Calculate time range
  const getTimeRange = (): { startTime: Date; endTime: Date } => {
    const now = new Date();
    let endTime = now;
    let startTime = new Date();

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startTime = customStartTime ? new Date(customStartTime) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endTime = customEndTime ? new Date(customEndTime) : now;
        break;
    }

    return { startTime, endTime };
  };

  const { startTime, endTime } = getTimeRange();

  const {
    data: history,
    isLoading,
    error,
    refetch
  } = useGetSignalHistoryQuery({
    signalId: signal.id,
    startTime,
    endTime,
    maxSamples: 1000
  });

  const handleExportCSV = () => {
    if (!history || history.values.length === 0) return;

    const csv = [
      ['Timestamp', 'Value', 'Quality'],
      ...history.values.map(v => [
        new Date(v.timestamp).toISOString(),
        v.value,
        v.quality
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signal_${signal.name}_${startTime.toISOString()}_${endTime.toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderGraph = (history: SignalHistory) => {
    if (history.values.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available for selected time range</p>
        </div>
      );
    }

    // Calculate statistics
    const values = history.values.map(v => typeof v.value === 'number' ? v.value : 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const range = max - min || 1;

    // Generate SVG path
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const points = history.values.map((point, i) => {
      const x = padding.left + (i / (history.values.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - ((point.value - min) / range) * graphHeight;
      return { x, y, value: point.value, timestamp: point.timestamp, quality: point.quality };
    });

    return (
      <div className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Min</p>
            <p className="text-xl font-bold text-blue-900">{min.toFixed(2)}{signal.unit}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Average</p>
            <p className="text-xl font-bold text-green-900">{avg.toFixed(2)}{signal.unit}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium">Max</p>
            <p className="text-xl font-bold text-red-900">{max.toFixed(2)}{signal.unit}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">Samples</p>
            <p className="text-xl font-bold text-purple-900">{history.values.length}</p>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <svg width={width} height={height} className="mx-auto">
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + graphHeight * (1 - ratio);
              const value = min + range * ratio;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + graphWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels (time) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const x = padding.left + graphWidth * ratio;
              const index = Math.floor((history.values.length - 1) * ratio);
              const timestamp = new Date(history.values[index]?.timestamp);
              return (
                <text
                  key={i}
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </text>
              );
            })}

            {/* Graph line */}
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            />

            {/* Data points with quality indicators */}
            {points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={
                  point.quality === 'GOOD' ? '#10b981' :
                  point.quality === 'BAD' ? '#ef4444' :
                  '#f59e0b'
                }
                opacity="0.8"
              >
                <title>
                  {new Date(point.timestamp).toLocaleString('it-IT')}{'\n'}
                  Value: {point.value}{signal.unit}{'\n'}
                  Quality: {point.quality}
                </title>
              </circle>
            ))}

            {/* Axes */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + graphHeight}
              stroke="#374151"
              strokeWidth="2"
            />
            <line
              x1={padding.left}
              y1={padding.top + graphHeight}
              x2={padding.left + graphWidth}
              y2={padding.top + graphHeight}
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Axis labels */}
            <text
              x={padding.left - 45}
              y={padding.top + graphHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
              transform={`rotate(-90 ${padding.left - 45} ${padding.top + graphHeight / 2})`}
            >
              {signal.name} ({signal.unit || signal.dataType})
            </text>
            <text
              x={padding.left + graphWidth / 2}
              y={height - 5}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
            >
              Time
            </text>
          </svg>
        </div>
      </div>
    );
  };

  const renderTable = (history: SignalHistory) => {
    if (history.values.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.values.map((value, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(value.timestamp).toLocaleString('it-IT')}
                  </td>
                  <td className="px-4 py-2 text-sm font-mono text-gray-900">
                    {value.value}{signal.unit}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      value.quality === 'GOOD' ? 'bg-green-100 text-green-800' :
                      value.quality === 'BAD' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {value.quality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card title={`Signal History - ${signal.name}`}>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Time Range Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              options={[
                { value: '1h', label: 'Last Hour' },
                { value: '6h', label: 'Last 6 Hours' },
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'custom', label: 'Custom Range' },
              ]}
              className="w-full"
            />
          </div>

          {/* Custom Time Range */}
          {timeRange === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                <Input
                  type="datetime-local"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                <Input
                  type="datetime-local"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'graph' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('graph')}
            >
              📈 Graph
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              📋 Table
            </Button>
          </div>

          {/* Actions */}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            ↻ Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={!history || history.values.length === 0}
          >
            📥 Export CSV
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕ Close
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="danger">
            Error loading history: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Content */}
        {!isLoading && history && (
          viewMode === 'graph' ? renderGraph(history) : renderTable(history)
        )}
      </div>
    </Card>
  );
};

export default SignalHistoryViewer;

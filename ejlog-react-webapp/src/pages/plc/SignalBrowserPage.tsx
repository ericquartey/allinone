// ============================================================================
// EJLOG WMS - Signal Browser Page
// Browse, search, and filter PLC signals with advanced filtering
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import { useGetSignalsQuery, useGetPLCDevicesQuery } from '../../services/api/plcApi';
import { SignalDataType, SignalDirection, Signal } from '../../types/plc';

interface SignalFilters {
  deviceId: string;
  dataType: SignalDataType | 'ALL';
  direction: SignalDirection | 'ALL';
  category: string;
  search: string;
  isMonitored: boolean | null;
}

const SignalBrowserPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState<SignalFilters>({
    deviceId: '',
    dataType: 'ALL',
    direction: 'ALL',
    category: '',
    search: '',
    isMonitored: null,
  });

  // API queries
  const { data: devicesData } = useGetPLCDevicesQuery({});

  const {
    data: signalsData,
    isLoading,
    error,
    refetch
  } = useGetSignalsQuery({
    deviceId: filters.deviceId || undefined,
    dataType: filters.dataType !== 'ALL' ? filters.dataType : undefined,
    direction: filters.direction !== 'ALL' ? filters.direction : undefined,
    category: filters.category || undefined,
    search: filters.search || undefined,
    isMonitored: filters.isMonitored !== null ? filters.isMonitored : undefined,
    page,
    pageSize,
  });

  const handleFilterChange = (key: keyof SignalFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      deviceId: '',
      dataType: 'ALL',
      direction: 'ALL',
      category: '',
      search: '',
      isMonitored: null,
    });
    setPage(1);
  };

  const getQualityBadgeColor = (quality: 'GOOD' | 'BAD' | 'UNCERTAIN'): string => {
    switch (quality) {
      case 'GOOD': return 'bg-green-100 text-green-800';
      case 'BAD': return 'bg-red-100 text-red-800';
      case 'UNCERTAIN': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: SignalDirection): string => {
    switch (direction) {
      case 'INPUT': return '⬇️';
      case 'OUTPUT': return '⬆️';
      case 'INOUT': return '⬍';
      default: return '•';
    }
  };

  const formatValue = (signal: Signal): string => {
    if (signal.value === null || signal.value === undefined) return 'N/A';

    switch (signal.dataType) {
      case 'BIT':
        return signal.value ? 'TRUE' : 'FALSE';
      case 'REAL':
        return Number(signal.value).toFixed(2) + (signal.unit ? ` ${signal.unit}` : '');
      case 'INT':
      case 'DINT':
        return signal.value.toString() + (signal.unit ? ` ${signal.unit}` : '');
      default:
        return signal.value.toString();
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v =>
    v !== '' && v !== 'ALL' && v !== null
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Signal Browser</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and monitor PLC signals in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => refetch()}>
            ↻ Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate('/plc/signals/monitor')}>
            📊 Signal Monitor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Clear All ({activeFiltersCount})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Device Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Device
            </label>
            <Select
              value={filters.deviceId}
              onChange={(e) => handleFilterChange('deviceId', e.target.value)}
              options={[
                { value: '', label: 'All Devices' },
                ...(devicesData?.devices || []).map(d => ({
                  value: d.id,
                  label: d.name
                }))
              ]}
              className="w-full"
            />
          </div>

          {/* Data Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <Select
              value={filters.dataType}
              onChange={(e) => handleFilterChange('dataType', e.target.value)}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'BIT', label: 'BIT' },
                { value: 'BYTE', label: 'BYTE' },
                { value: 'WORD', label: 'WORD' },
                { value: 'DWORD', label: 'DWORD' },
                { value: 'INT', label: 'INT' },
                { value: 'DINT', label: 'DINT' },
                { value: 'REAL', label: 'REAL' },
                { value: 'STRING', label: 'STRING' },
              ]}
              className="w-full"
            />
          </div>

          {/* Direction Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Direction
            </label>
            <Select
              value={filters.direction}
              onChange={(e) => handleFilterChange('direction', e.target.value)}
              options={[
                { value: 'ALL', label: 'All Directions' },
                { value: 'INPUT', label: 'Input' },
                { value: 'OUTPUT', label: 'Output' },
                { value: 'INOUT', label: 'In/Out' },
              ]}
              className="w-full"
            />
          </div>

          {/* Monitored Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Monitoring
            </label>
            <Select
              value={filters.isMonitored === null ? '' : filters.isMonitored.toString()}
              onChange={(e) => handleFilterChange('isMonitored', e.target.value === '' ? null : e.target.value === 'true')}
              options={[
                { value: '', label: 'All Signals' },
                { value: 'true', label: 'Monitored Only' },
                { value: 'false', label: 'Not Monitored' },
              ]}
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <Input
              type="text"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="e.g. sensors"
              className="w-full"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name or address..."
              className="w-full"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.deviceId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Device: {devicesData?.devices.find(d => d.id === filters.deviceId)?.name}
                <button onClick={() => handleFilterChange('deviceId', '')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {filters.dataType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Type: {filters.dataType}
                <button onClick={() => handleFilterChange('dataType', 'ALL')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {filters.direction !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Direction: {filters.direction}
                <button onClick={() => handleFilterChange('direction', 'ALL')} className="hover:text-green-900">×</button>
              </span>
            )}
            {filters.isMonitored !== null && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {filters.isMonitored ? 'Monitored' : 'Not Monitored'}
                <button onClick={() => handleFilterChange('isMonitored', null)} className="hover:text-yellow-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {signalsData && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, signalsData.total)} of {signalsData.total} signals
          </span>
          <span>Page {page} of {Math.ceil(signalsData.total / pageSize)}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="danger">
          Error loading signals: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Signals Table */}
      {!isLoading && signalsData && (
        <>
          {signalsData.signals.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Signal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dir
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quality
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {signalsData.signals.map((signal) => (
                      <tr key={signal.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/plc/signals/${signal.id}`)}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{signal.name}</div>
                              <div className="text-xs text-gray-500">{signal.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-700">{signal.address}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-gray-900">{signal.dataType}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-lg" title={signal.direction}>{getDirectionIcon(signal.direction)}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-900">{formatValue(signal)}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getQualityBadgeColor(signal.quality)}`}>
                            {signal.quality}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {signal.isMonitored ? (
                            <span className="text-green-600 text-sm">● Monitored</span>
                          ) : (
                            <span className="text-gray-400 text-sm">○ Not Monitored</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/plc/signals/${signal.id}`);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-500">No signals found matching your filters</p>
              <Button variant="ghost" className="mt-4" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {signalsData.total > pageSize && (
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(signalsData.total / pageSize)}
              </span>
              <Button
                variant="secondary"
                disabled={page >= Math.ceil(signalsData.total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SignalBrowserPage;

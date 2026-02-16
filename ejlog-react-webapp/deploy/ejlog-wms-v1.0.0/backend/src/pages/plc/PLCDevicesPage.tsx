// ============================================================================
// EJLOG WMS - PLC Devices Page
// Main page for viewing and managing PLC devices
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import PLCDeviceCard from '../../components/plc/PLCDeviceCard';
import PLCFilters from '../../components/plc/PLCFilters';
import {
  useGetPLCDevicesQuery,
  useConnectPLCDeviceMutation,
  useDisconnectPLCDeviceMutation,
  useResetPLCDeviceMutation,
  useGetSystemHealthQuery
} from '../../services/api/plcApi';
import { PLCDeviceFilters, PLCDevice } from '../../types/plc';

const PLCDevicesPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState<PLCDeviceFilters>({
    type: 'ALL',
    status: 'ALL',
    search: '',
    connectionType: 'ALL',
    location: 'ALL'
  });

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // API queries
  const {
    data: devicesData,
    isLoading: isLoadingDevices,
    error: devicesError,
    refetch: refetchDevices
  } = useGetPLCDevicesQuery({
    type: filters.type !== 'ALL' ? filters.type : undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    search: filters.search || undefined,
    page,
    pageSize
  });

  const {
    data: systemHealth,
    isLoading: isLoadingHealth
  } = useGetSystemHealthQuery();

  // Mutations
  const [connectDevice, { isLoading: isConnecting }] = useConnectPLCDeviceMutation();
  const [disconnectDevice, { isLoading: isDisconnecting }] = useDisconnectPLCDeviceMutation();
  const [resetDevice, { isLoading: isResetting }] = useResetPLCDeviceMutation();

  // Mutation loading states per device
  const [loadingStates, setLoadingStates] = useState<Record<string, { connect?: boolean; disconnect?: boolean; reset?: boolean }>>({});

  // Filter devices based on local filters (connection type, location)
  const filteredDevices = useMemo(() => {
    if (!devicesData?.devices) return [];

    return devicesData.devices.filter(device => {
      if (filters.connectionType !== 'ALL' && device.connectionType !== filters.connectionType) {
        return false;
      }
      if (filters.location !== 'ALL' && device.location !== filters.location) {
        return false;
      }
      return true;
    });
  }, [devicesData, filters]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: PLCDeviceFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'ALL',
      status: 'ALL',
      search: '',
      connectionType: 'ALL',
      location: 'ALL'
    });
    setPage(1);
  };

  // Device actions
  const handleConnect = async (deviceId: string) => {
    setLoadingStates(prev => ({ ...prev, [deviceId]: { connect: true } }));
    try {
      await connectDevice(deviceId).unwrap();
      refetchDevices();
    } catch (error) {
      console.error('Failed to connect device:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [deviceId]: { connect: false } }));
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    setLoadingStates(prev => ({ ...prev, [deviceId]: { disconnect: true } }));
    try {
      await disconnectDevice(deviceId).unwrap();
      refetchDevices();
    } catch (error) {
      console.error('Failed to disconnect device:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [deviceId]: { disconnect: false } }));
    }
  };

  const handleReset = async (deviceId: string) => {
    setLoadingStates(prev => ({ ...prev, [deviceId]: { reset: true } }));
    try {
      await resetDevice(deviceId).unwrap();
      refetchDevices();
    } catch (error) {
      console.error('Failed to reset device:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [deviceId]: { reset: false } }));
    }
  };

  const handleViewDetails = (deviceId: string) => {
    navigate(`/plc/devices/${deviceId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controllo PLC</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestione dispositivi e monitoraggio in tempo reale
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => refetchDevices()}
            aria-label="Refresh devices list"
          >
            <span className="text-lg" aria-hidden="true">↻</span>
            <span className="ml-1">Aggiorna</span>
          </Button>
        </div>
      </div>

      {/* System Health Summary */}
      {systemHealth && !isLoadingHealth && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Dispositivi Totali</p>
              <p className="text-3xl font-bold text-blue-900">{systemHealth.totalDevices}</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-3xl font-bold text-green-900">{systemHealth.onlineDevices}</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Con Errori</p>
              <p className="text-3xl font-bold text-red-900">{systemHealth.devicesWithErrors}</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">Segnali Monitorati</p>
              <p className="text-3xl font-bold text-purple-900">{systemHealth.monitoredSignals}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <PLCFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />
      </Card>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredDevices.length} dispositiv{filteredDevices.length === 1 ? 'o' : 'i'} trovat{filteredDevices.length === 1 ? 'o' : 'i'}
        </p>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <span className="text-lg" aria-hidden="true">▦</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <span className="text-lg" aria-hidden="true">☰</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingDevices && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {devicesError && (
        <Alert variant="danger">
          <p className="font-semibold">Errore nel caricamento dei dispositivi</p>
          <p className="text-sm mt-1">
            {devicesError instanceof Error ? devicesError.message : 'Si è verificato un errore imprevisto'}
          </p>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoadingDevices && !devicesError && filteredDevices.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Nessun dispositivo trovato</p>
            <p className="text-sm text-gray-400 mt-2">
              Prova a modificare i filtri o aggiungi nuovi dispositivi PLC
            </p>
          </div>
        </Card>
      )}

      {/* Devices Grid/List */}
      {!isLoadingDevices && !devicesError && filteredDevices.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredDevices.map(device => (
            <PLCDeviceCard
              key={device.id}
              device={device}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onReset={handleReset}
              onViewDetails={handleViewDetails}
              loading={loadingStates[device.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {devicesData && devicesData.total > pageSize && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ← Precedente
          </Button>
          <span className="text-sm text-gray-600">
            Pagina {page} di {Math.ceil(devicesData.total / pageSize)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(devicesData.total / pageSize)}
            aria-label="Next page"
          >
            Successivo →
          </Button>
        </div>
      )}
    </div>
  );
};

export default PLCDevicesPage;

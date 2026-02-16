// ============================================================================
// EJLOG WMS - Location Browser Page
// Main browsing interface for warehouse locations with filtering and map view
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Card from '../../components/shared/Card';
import WarehouseMapViewer from '../../components/locations/WarehouseMapViewer';
import {
  useGetLocationsQuery,
  useGetWarehousesQuery,
  useGetZonesByWarehouseQuery,
} from '../../services/api/locationApi';
import {
  LocationType,
  LocationStatus,
  LocationTypeLabels,
  LocationStatusLabels,
  LocationStatusColors,
} from '../../types/location';

interface LocationFilters {
  warehouseId: string;
  zoneId: string;
  areaId: string;
  type: LocationType | 'ALL';
  status: LocationStatus | 'ALL';
  isOccupied: boolean | null;
  search: string;
}

type ViewMode = 'table' | 'map' | 'grid';

const LocationBrowserPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState<LocationFilters>({
    warehouseId: '',
    zoneId: '',
    areaId: '',
    type: 'ALL',
    status: 'ALL',
    isOccupied: null,
    search: '',
  });

  // API queries
  const { data: warehouses } = useGetWarehousesQuery();

  const { data: zones } = useGetZonesByWarehouseQuery(filters.warehouseId, {
    skip: !filters.warehouseId,
  });

  const {
    data: locationsData,
    isLoading,
    error,
    refetch,
  } = useGetLocationsQuery({
    warehouseId: filters.warehouseId || undefined,
    zoneId: filters.zoneId || undefined,
    areaId: filters.areaId || undefined,
    type: filters.type !== 'ALL' ? filters.type : undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    isOccupied: filters.isOccupied !== null ? filters.isOccupied : undefined,
    search: filters.search || undefined,
    page,
    pageSize,
  });

  const handleFilterChange = <K extends keyof LocationFilters>(
    key: K,
    value: LocationFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change

    // Reset dependent filters
    if (key === 'warehouseId') {
      setFilters((prev) => ({ ...prev, zoneId: '', areaId: '' }));
    } else if (key === 'zoneId') {
      setFilters((prev) => ({ ...prev, areaId: '' }));
    }
  };

  const clearFilters = () => {
    setFilters({
      warehouseId: '',
      zoneId: '',
      areaId: '',
      type: 'ALL',
      status: 'ALL',
      isOccupied: null,
      search: '',
    });
    setPage(1);
  };

  const activeFiltersCount = [
    filters.warehouseId,
    filters.zoneId,
    filters.areaId,
    filters.type !== 'ALL',
    filters.status !== 'ALL',
    filters.isOccupied !== null,
    filters.search,
  ].filter(Boolean).length;

  const getStatusBadgeClass = (status: LocationStatus): string => {
    const color = LocationStatusColors[status];
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
    };
    return colorClasses[color] || 'bg-gray-100 text-gray-800';
  };

  const renderFilters = () => (
    <Card title="Filtri">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Warehouse Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Magazzino
          </label>
          <Select
            value={filters.warehouseId}
            onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
            options={[
              { value: '', label: 'Tutti i magazzini' },
              ...(warehouses?.map((w) => ({ value: w.id, label: w.name })) || []),
            ]}
          />
        </div>

        {/* Zone Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Zona
          </label>
          <Select
            value={filters.zoneId}
            onChange={(e) => handleFilterChange('zoneId', e.target.value)}
            disabled={!filters.warehouseId}
            options={[
              { value: '', label: 'Tutte le zone' },
              ...(zones?.map((z) => ({ value: z.id, label: z.name })) || []),
            ]}
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo Ubicazione
          </label>
          <Select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value as LocationType | 'ALL')}
            options={[
              { value: 'ALL', label: 'Tutti i tipi' },
              ...Object.entries(LocationTypeLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stato
          </label>
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value as LocationStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'Tutti gli stati' },
              ...Object.entries(LocationStatusLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>

        {/* Occupancy Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Occupazione
          </label>
          <Select
            value={filters.isOccupied === null ? '' : filters.isOccupied ? 'true' : 'false'}
            onChange={(e) =>
              handleFilterChange(
                'isOccupied',
                e.target.value === '' ? null : e.target.value === 'true'
              )
            }
            options={[
              { value: '', label: 'Tutte' },
              { value: 'true', label: 'Solo occupate' },
              { value: 'false', label: 'Solo libere' },
            ]}
          />
        </div>

        {/* Search Input */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cerca (codice, barcode, descrizione)
          </label>
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="ES: A01-02-03"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="md"
            onClick={clearFilters}
            disabled={activeFiltersCount === 0}
            className="w-full"
          >
            ✕ Cancella Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Filtri attivi:</p>
          <div className="flex flex-wrap gap-2">
            {filters.warehouseId && warehouses && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Magazzino: {warehouses.find((w) => w.id === filters.warehouseId)?.name}
              </span>
            )}
            {filters.zoneId && zones && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Zona: {zones.find((z) => z.id === filters.zoneId)?.name}
              </span>
            )}
            {filters.type !== 'ALL' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Tipo: {LocationTypeLabels[filters.type]}
              </span>
            )}
            {filters.status !== 'ALL' && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Stato: {LocationStatusLabels[filters.status]}
              </span>
            )}
            {filters.isOccupied !== null && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {filters.isOccupied ? 'Occupate' : 'Libere'}
              </span>
            )}
            {filters.search && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Cerca: "{filters.search}"
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );

  const renderSummary = () => {
    if (!locationsData) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Totale</p>
          <p className="text-2xl font-bold text-blue-900">
            {locationsData.summary.totalLocations}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Disponibili</p>
          <p className="text-2xl font-bold text-green-900">
            {locationsData.summary.availableLocations}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-600 font-medium">Occupate</p>
          <p className="text-2xl font-bold text-orange-900">
            {locationsData.summary.occupiedLocations}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 font-medium">Bloccate</p>
          <p className="text-2xl font-bold text-red-900">
            {locationsData.summary.blockedLocations}
          </p>
        </div>
      </div>
    );
  };

  const renderTableView = () => {
    if (!locationsData || locationsData.locations.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nessuna ubicazione trovata</p>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4">
            Cancella filtri
          </Button>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Codice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Magazzino/Zona
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Occupazione
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Utilizzo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locationsData.locations.map((location) => (
                <tr
                  key={location.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/locations/${location.code}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{location.code}</p>
                      <p className="text-xs text-gray-500 font-mono">{location.barcode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{location.warehouseName}</p>
                      <p className="text-xs text-gray-500">{location.zoneName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {LocationTypeLabels[location.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(location.status)}`}>
                      {LocationStatusLabels[location.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {location.isOccupied && location.occupancy ? (
                      <div>
                        <p className="text-sm text-gray-900 font-mono">
                          {location.occupancy.udcBarcode}
                        </p>
                        <p className="text-xs text-gray-500">
                          {location.occupancy.itemCode || 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Libera</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${location.capacity.utilizationPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {location.capacity.utilizationPercent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/locations/${location.code}`);
                      }}
                    >
                      Dettagli →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, locationsData.total)}
            </span>{' '}
            di <span className="font-medium">{locationsData.total}</span> ubicazioni
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Precedente
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= locationsData.total}
            >
              Successiva →
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderMapView = () => {
    if (!filters.warehouseId) {
      return (
        <Card>
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg font-semibold text-gray-700">Seleziona Magazzino</p>
            <p className="text-sm text-gray-500 mt-2">
              Seleziona un magazzino dai filtri per visualizzare la mappa
            </p>
          </div>
        </Card>
      );
    }

    return (
      <WarehouseMapViewer
        warehouseId={filters.warehouseId}
        zoneId={filters.zoneId}
        showOccupancyHeatmap={true}
        onLocationClick={(location) => navigate(`/locations/${location.code}`)}
      />
    );
  };

  const renderGridView = () => {
    if (!locationsData || locationsData.locations.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nessuna ubicazione trovata</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {locationsData.locations.map((location) => (
          <Card
            key={location.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/locations/${location.code}`)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{location.code}</h3>
                  <p className="text-xs text-gray-500 font-mono">{location.barcode}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(location.status)}`}>
                  {LocationStatusLabels[location.status]}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <p>📦 {LocationTypeLabels[location.type]}</p>
                <p>🏢 {location.warehouseName}</p>
                <p>📍 {location.zoneName}</p>
              </div>

              {location.isOccupied && location.occupancy ? (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <p className="font-mono font-semibold text-blue-900">
                    {location.occupancy.udcBarcode}
                  </p>
                  <p className="text-blue-700">{location.occupancy.itemCode || 'N/A'}</p>
                </div>
              ) : (
                <div className="p-2 bg-green-50 rounded text-xs text-green-700 text-center">
                  Libera
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Utilizzo</span>
                  <span className="font-semibold text-gray-900">
                    {location.capacity.utilizationPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${location.capacity.utilizationPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Ubicazioni</h1>
          <p className="text-sm text-gray-500 mt-1">
            Navigazione e ricerca ubicazioni magazzino
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/locations/capacity-planning')}
          >
            📊 Capacity Planning
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setViewMode('table')}
          >
            📋 Tabella
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setViewMode('grid')}
          >
            ⊞ Griglia
          </Button>
          <Button
            variant={viewMode === 'map' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setViewMode('map')}
          >
            🗺️ Mappa
          </Button>
          <Button variant="ghost" size="md" onClick={() => refetch()}>
            ↻ Aggiorna
          </Button>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Error State */}
      {error && (
        <Alert variant="danger">
          <p className="font-semibold">Errore caricamento ubicazioni</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : 'Errore sconosciuto'}
          </p>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Summary */}
      {!isLoading && locationsData && renderSummary()}

      {/* Content */}
      {!isLoading && (
        <>
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'map' && renderMapView()}
        </>
      )}
    </div>
  );
};

export default LocationBrowserPage;

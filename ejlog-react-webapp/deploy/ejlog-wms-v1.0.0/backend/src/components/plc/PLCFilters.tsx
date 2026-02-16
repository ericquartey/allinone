// ============================================================================
// EJLOG WMS - PLC Filters Component
// Filter controls for PLC devices list
// ============================================================================

import React from 'react';
import Select from '../shared/Select';
import Input from '../shared/Input';
import Button from '../shared/Button';
import {
  PLCDeviceType,
  PLCDeviceStatus,
  PLCConnectionType,
  PLCDeviceFilters,
  PLCDeviceTypeLabels
} from '../../types/plc';

interface PLCFiltersProps {
  filters: PLCDeviceFilters;
  onFiltersChange: (filters: PLCDeviceFilters) => void;
  onReset: () => void;
}

const PLCFilters: React.FC<PLCFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const handleFilterChange = (key: keyof PLCDeviceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const deviceTypeOptions = [
    { value: 'ALL', label: 'Tutti i tipi' },
    { value: 'TRASLO', label: PLCDeviceTypeLabels.TRASLO },
    { value: 'NAVETTA', label: PLCDeviceTypeLabels.NAVETTA },
    { value: 'SATELLITE', label: PLCDeviceTypeLabels.SATELLITE },
    { value: 'VERTIMAG', label: PLCDeviceTypeLabels.VERTIMAG },
    { value: 'ELEVATOR', label: PLCDeviceTypeLabels.ELEVATOR },
    { value: 'CONVEYOR', label: PLCDeviceTypeLabels.CONVEYOR },
    { value: 'ROBOT', label: PLCDeviceTypeLabels.ROBOT },
    { value: 'GENERIC', label: PLCDeviceTypeLabels.GENERIC }
  ];

  const statusOptions = [
    { value: 'ALL', label: 'Tutti gli stati' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'OFFLINE', label: 'Offline' },
    { value: 'ERROR', label: 'Errore' },
    { value: 'MAINTENANCE', label: 'Manutenzione' },
    { value: 'INITIALIZING', label: 'Inizializzazione' }
  ];

  const connectionTypeOptions = [
    { value: 'ALL', label: 'Tutte le connessioni' },
    { value: 'S7_TCP', label: 'Siemens S7 TCP/IP' },
    { value: 'MODBUS_TCP', label: 'Modbus TCP' },
    { value: 'PROFINET', label: 'PROFINET' },
    { value: 'ETHERNET_IP', label: 'EtherNet/IP' },
    { value: 'OPC_UA', label: 'OPC UA' }
  ];

  const hasActiveFilters =
    filters.type !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.connectionType !== 'ALL' ||
    filters.location !== 'ALL' ||
    filters.search !== '';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Device Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo Dispositivo
          </label>
          <Select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value as PLCDeviceType | 'ALL')}
            options={deviceTypeOptions}
            className="w-full"
            aria-label="Filter by device type"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stato
          </label>
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value as PLCDeviceStatus | 'ALL')}
            options={statusOptions}
            className="w-full"
            aria-label="Filter by status"
          />
        </div>

        {/* Connection Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo Connessione
          </label>
          <Select
            value={filters.connectionType}
            onChange={(e) => handleFilterChange('connectionType', e.target.value as PLCConnectionType | 'ALL')}
            options={connectionTypeOptions}
            className="w-full"
            aria-label="Filter by connection type"
          />
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ricerca
          </label>
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Nome, IP o Codice..."
            className="w-full"
            aria-label="Search devices by name, IP, or code"
          />
        </div>
      </div>

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Reset all filters"
          >
            <span className="mr-1" aria-hidden="true">✕</span>
            Resetta Filtri
          </Button>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Filtri attivi:</span>
          <div className="flex flex-wrap gap-2">
            {filters.type !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                Tipo: {PLCDeviceTypeLabels[filters.type as PLCDeviceType]}
              </span>
            )}
            {filters.status !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                Stato: {filters.status}
              </span>
            )}
            {filters.connectionType !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                Connessione: {filters.connectionType}
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                Cerca: "{filters.search}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PLCFilters;

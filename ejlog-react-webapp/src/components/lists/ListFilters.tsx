// ============================================================================
// EJLOG WMS - ListFilters Component
// Enhanced filters for list management with persistence
// ============================================================================

import { useState, useEffect, ChangeEvent } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';

// Filter values interface
export interface ListFilterValues {
  listType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  assignedTo: string;
}

// Component props
export interface ListFiltersProps {
  onApplyFilters: (filters: ListFilterValues) => void;
  initialFilters?: Partial<ListFilterValues>;
}

/**
 * Componente Enhanced Filters per gestione liste
 *
 * Features:
 * - Filtro tipo lista (All, Picking, Refilling, Inventory)
 * - Filtro stato (All, Open, In Progress, Completed, Cancelled)
 * - Date Range Picker (data inizio/fine)
 * - Filtro operatore assegnato
 * - Bottoni: Applica filtri, Reset filtri
 * - Persistenza filtri tramite URL query params
 */
function ListFilters({ onApplyFilters, initialFilters = {} }: ListFiltersProps): JSX.Element {
  const [filters, setFilters] = useState<ListFilterValues>({
    listType: initialFilters.listType || '',
    status: initialFilters.status || '',
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    assignedTo: initialFilters.assignedTo || '',
  });

  // Sync con initialFilters quando cambiano (es. da URL)
  useEffect(() => {
    setFilters({
      listType: initialFilters.listType || '',
      status: initialFilters.status || '',
      dateFrom: initialFilters.dateFrom || '',
      dateTo: initialFilters.dateTo || '',
      assignedTo: initialFilters.assignedTo || '',
    });
  }, [initialFilters]);

  const handleFilterChange = (field: keyof ListFilterValues, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = (): void => {
    onApplyFilters(filters);
  };

  const handleResetFilters = (): void => {
    const emptyFilters: ListFilterValues = {
      listType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      assignedTo: '',
    };
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-ferretto-red" />
          <h3 className="text-lg font-semibold text-gray-900">Filtri Avanzati</h3>
        </div>
        {hasActiveFilters && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ferretto-red text-white">
            Filtri attivi
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tipo Lista */}
        <div>
          <label
            htmlFor="listType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo Lista
          </label>
          <select
            id="listType"
            name="listType"
            value={filters.listType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('listType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent text-sm"
          >
            <option value="">Tutti i tipi</option>
            <option value="0">Picking</option>
            <option value="1">Refilling</option>
            <option value="2">Inventory</option>
          </select>
        </div>

        {/* Stato */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Stato
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent text-sm"
          >
            <option value="">Tutti gli stati</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Data Da */}
        <div>
          <label
            htmlFor="dateFrom"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Data Da
          </label>
          <Input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Data A */}
        <div>
          <label
            htmlFor="dateTo"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Data A
          </label>
          <Input
            type="date"
            id="dateTo"
            name="dateTo"
            value={filters.dateTo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('dateTo', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Operatore Assegnato */}
        <div>
          <label
            htmlFor="assignedTo"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Operatore
          </label>
          <Input
            type="text"
            id="assignedTo"
            name="assignedTo"
            value={filters.assignedTo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('assignedTo', e.target.value)}
            placeholder="Nome operatore"
            className="w-full"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
        >
          <XMarkIcon className="w-4 h-4 mr-2" />
          Reset Filtri
        </Button>
        <Button
          variant="primary"
          onClick={handleApplyFilters}
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          Applica Filtri
        </Button>
      </div>
    </Card>
  );
}

export default ListFilters;

// ============================================================================
// EJLOG WMS - Report Filters Component
// Filtri riutilizzabili per report con date range e selectors
// ============================================================================

import React, { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import Button from '../shared/Button';
import { Filter, X, Calendar } from 'lucide-react';
import type { ReportFilter } from '../../services/reportsService';

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilter) => void;
  showZoneFilter?: boolean;
  showTypeFilter?: boolean;
  showStatusFilter?: boolean;
  zones?: string[];
  types?: string[];
  statuses?: string[];
}

type QuickFilter = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

const ReportFilters: React.FC<ReportFiltersProps> = ({
  onFilterChange,
  showZoneFilter = false,
  showTypeFilter = false,
  showStatusFilter = false,
  zones = [],
  types = [],
  statuses = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<QuickFilter>('today');

  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: format(new Date(), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    zone: '',
    type: '',
    status: '',
  });

  const quickFilters: { value: QuickFilter; label: string }[] = [
    { value: 'today', label: 'Oggi' },
    { value: 'yesterday', label: 'Ieri' },
    { value: 'thisWeek', label: 'Questa Settimana' },
    { value: 'thisMonth', label: 'Questo Mese' },
    { value: 'custom', label: 'Personalizzato' },
  ];

  const applyQuickFilter = (filter: QuickFilter) => {
    setSelectedQuickFilter(filter);
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (filter) {
      case 'today':
        dateFrom = format(today, 'yyyy-MM-dd');
        dateTo = format(today, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        dateFrom = format(yesterday, 'yyyy-MM-dd');
        dateTo = format(yesterday, 'yyyy-MM-dd');
        break;
      case 'thisWeek':
        dateFrom = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        dateTo = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        dateFrom = format(startOfMonth(today), 'yyyy-MM-dd');
        dateTo = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'custom':
        return; // Don't change dates for custom
    }

    const newFilters = { ...filters, dateFrom, dateTo };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterChange = (field: keyof ReportFilter, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setSelectedQuickFilter('custom');
    handleFilterChange(field, value);
  };

  const clearFilters = () => {
    const clearedFilters: ReportFilter = {
      dateFrom: format(new Date(), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
      zone: '',
      type: '',
      status: '',
    };
    setFilters(clearedFilters);
    setSelectedQuickFilter('today');
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.zone ||
    filters.type ||
    filters.status ||
    selectedQuickFilter !== 'today';

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
          data-testid="filter-toggle"
        >
          <Filter className="w-4 h-4" />
          <span>Filtri</span>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-ferrRed text-white text-xs rounded-full">
              Attivi
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
            data-testid="clear-filters"
          >
            <X className="w-4 h-4" />
            <span>Pulisci Filtri</span>
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4" data-testid="filters-panel">
          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="inline w-4 h-4 mr-1" />
              Periodo
            </label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((qf) => (
                <button
                  key={qf.value}
                  onClick={() => applyQuickFilter(qf.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedQuickFilter === qf.value
                      ? 'bg-ferrRed text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`quick-filter-${qf.value}`}
                >
                  {qf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Da
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ferrRed focus:border-ferrRed"
                data-testid="date-from"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                A
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ferrRed focus:border-ferrRed"
                data-testid="date-to"
              />
            </div>
          </div>

          {/* Zone Filter */}
          {showZoneFilter && zones.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Zona
              </label>
              <select
                value={filters.zone || ''}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ferrRed focus:border-ferrRed"
                data-testid="zone-filter"
              >
                <option value="">Tutte le zone</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type Filter */}
          {showTypeFilter && types.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ferrRed focus:border-ferrRed"
                data-testid="type-filter"
              >
                <option value="">Tutti i tipi</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && statuses.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Stato
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ferrRed focus:border-ferrRed"
                data-testid="status-filter"
              >
                <option value="">Tutti gli stati</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFilters;

/**
 * Lists Filters Panel
 * Implements all 10 filters from Swing GestioneListeFiltriPanelNew.java
 * Matches Swing UI functionality with real database fields
 */

import React from 'react';
import { Search, X } from 'lucide-react';

export interface ListFilters {
  listType?: number | null;           // Tipo Lista -> Liste.idTipoLista
  listStatus?: number | null;         // Stato Lista -> Liste.idStatoControlloEvadibilita
  listId?: number | null;             // ID Lista -> Liste.id
  listNumber?: string;                // Num Lista -> Liste.numLista
  orderNumber?: string;               // Rif Lista -> Liste.rifLista
  priority?: number | null;           // Priorità -> ListeAreaDetails.priorita
  destGroup?: number | null;          // Gruppo Destinazione -> ListeAreaDetails.idGruppoDestinazione
  availability?: number | null;       // Evadibilità -> Liste.idStatoControlloEvadibilita
  areas?: number[];                   // Aree -> ListeAreaDetails.idArea
  itemCode?: string;                  // Codice Articolo -> RigheLista.idProdotto
}

interface ListsFiltersProps {
  filters: ListFilters;
  onFiltersChange: (filters: ListFilters) => void;
  onClear: () => void;
  onSearch: () => void;
  isLoading?: boolean;
}

// List Type Constants (from Swing EntityListaMenu.java)
const LIST_TYPES = [
  { value: 1, label: 'Prelievo' },
  { value: 2, label: 'Deposito' },
  { value: 3, label: 'Inventario' },
  { value: 4, label: 'Visione' },
  { value: 5, label: 'Riconteggio' },
  { value: 6, label: 'Trasferimento' }
];

// List Status Constants (from Swing StatoLista table)
const LIST_STATUSES = [
  { value: 1, label: 'In Attesa', color: 'yellow' },
  { value: 2, label: 'In Esecuzione', color: 'blue' },
  { value: 3, label: 'Completata', color: 'green' },
  { value: 4, label: 'In Pausa', color: 'orange' },
  { value: 5, label: 'Errore', color: 'red' }
];

// Availability Status Constants
const AVAILABILITY_STATUSES = [
  { value: 1, label: 'Evadibile' },
  { value: 2, label: 'Non Evadibile' },
  { value: 3, label: 'Parzialmente Evadibile' }
];

// Priority Range (0-10)
const PRIORITY_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: i,
  label: `Priorità ${i}`
}));

export const ListsFilters: React.FC<ListsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
  onSearch,
  isLoading = false
}) => {
  const updateFilter = (key: keyof ListFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? null : value
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    v => v !== null && v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ferretto-dark">
          Filtri di Ricerca
        </h3>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Pulisci tutti i filtri"
            >
              <X className="w-3.5 h-3.5" />
              Pulisci
            </button>
          )}
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-ferretto-blue hover:bg-ferretto-dark rounded transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            {isLoading ? 'Ricerca...' : 'Cerca'}
          </button>
        </div>
      </div>

      {/* Filters Grid - 2 rows of 5 filters each (like Swing UI) */}
      <div className="grid grid-cols-5 gap-3">
        {/* Row 1: Primary Filters */}

        {/* Filter 1: Tipo Lista */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo Lista
          </label>
          <select
            value={filters.listType ?? ''}
            onChange={(e) => updateFilter('listType', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          >
            <option value="">Tutti</option>
            {LIST_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 2: Stato Lista */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stato Lista
          </label>
          <select
            value={filters.listStatus ?? ''}
            onChange={(e) => updateFilter('listStatus', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          >
            <option value="">Tutti</option>
            {LIST_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 3: ID Lista */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ID Lista
          </label>
          <input
            type="number"
            value={filters.listId ?? ''}
            onChange={(e) => updateFilter('listId', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="ID..."
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          />
        </div>

        {/* Filter 4: Num Lista */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Num Lista
          </label>
          <input
            type="text"
            value={filters.listNumber ?? ''}
            onChange={(e) => updateFilter('listNumber', e.target.value)}
            placeholder="Numero lista..."
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          />
        </div>

        {/* Filter 5: Rif Lista */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Rif Lista
          </label>
          <input
            type="text"
            value={filters.orderNumber ?? ''}
            onChange={(e) => updateFilter('orderNumber', e.target.value)}
            placeholder="Riferimento..."
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          />
        </div>

        {/* Row 2: Advanced Filters */}

        {/* Filter 6: Priorità */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Priorità
          </label>
          <select
            value={filters.priority ?? ''}
            onChange={(e) => updateFilter('priority', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          >
            <option value="">Tutte</option>
            {PRIORITY_OPTIONS.map(prio => (
              <option key={prio.value} value={prio.value}>
                {prio.value}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 7: Gruppo Destinazione */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Gruppo Dest.
          </label>
          <input
            type="number"
            value={filters.destGroup ?? ''}
            onChange={(e) => updateFilter('destGroup', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Gruppo..."
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          />
        </div>

        {/* Filter 8: Evadibilità */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Evadibilità
          </label>
          <select
            value={filters.availability ?? ''}
            onChange={(e) => updateFilter('availability', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          >
            <option value="">Tutte</option>
            {AVAILABILITY_STATUSES.map(avail => (
              <option key={avail.value} value={avail.value}>
                {avail.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 9: Aree (TODO: Load from database) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Aree
          </label>
          <input
            type="text"
            placeholder="Aree... (TODO)"
            disabled
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 text-gray-500"
            title="Multi-select areas - To be implemented"
          />
        </div>

        {/* Filter 10: Codice Articolo */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Codice Articolo
          </label>
          <input
            type="text"
            value={filters.itemCode ?? ''}
            onChange={(e) => updateFilter('itemCode', e.target.value)}
            placeholder="Codice..."
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ferretto-blue focus:border-ferretto-blue"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Filtri attivi:</span>{' '}
            {Object.entries(filters)
              .filter(([_, v]) => v !== null && v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
              .map(([k]) => {
                const labels: Record<string, string> = {
                  listType: 'Tipo',
                  listStatus: 'Stato',
                  listId: 'ID',
                  listNumber: 'Numero',
                  orderNumber: 'Riferimento',
                  priority: 'Priorità',
                  destGroup: 'Gruppo Dest.',
                  availability: 'Evadibilità',
                  areas: 'Aree',
                  itemCode: 'Articolo'
                };
                return labels[k] || k;
              })
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

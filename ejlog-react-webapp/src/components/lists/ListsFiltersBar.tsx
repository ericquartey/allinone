// ============================================================================
// EJLOG WMS - ListsFiltersBar Component
// CENTER AREA - Filters Bar replicating Swing UI filters
// ============================================================================

import { ChangeEvent } from 'react';
import { Calendar, Search } from 'lucide-react';

// Filters interface
export interface ListsFiltersBarFilters {
  genericHeaderSearch?: string;
  genericRowSearch?: string;
  creationDate?: string;
  completionDate?: string;
  rowsView?: string;
  code?: string;
  listId?: string;
}

// Component props
export interface ListsFiltersBarProps {
  filters: ListsFiltersBarFilters;
  onFilterChange: (filters: ListsFiltersBarFilters) => void;
  onSearch: () => void;
}

/**
 * CENTER AREA - Filters Bar
 * Replicates the filter section from Swing UI
 *
 * Filters:
 * - Ricerca generica testata (dropdown)
 * - Ricerca generica riga (dropdown)
 * - Data creazione (date picker)
 * - Data fine evasione (date picker)
 * - Visualizzazione righe (dropdown)
 * - Codice (text input)
 * - Id Lista (text input)
 */
export const ListsFiltersBar = ({
  filters,
  onFilterChange,
  onSearch
}: ListsFiltersBarProps): JSX.Element => {
  const handleInputChange = (field: keyof ListsFiltersBarFilters, value: string): void => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white border-b-2 border-ferretto-gray-300 p-4 shadow-sm">
      <div className="grid grid-cols-4 gap-4">
        {/* Row 1: Generic Searches and Dates */}
        <div>
          <label className="label">
            Ricerca generica testata
          </label>
          <select
            value={filters.genericHeaderSearch || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('genericHeaderSearch', e.target.value)}
            className="input"
          >
            <option value="">Tutti</option>
            <option value="listNumber">Numero Lista</option>
            <option value="description">Descrizione</option>
            <option value="orderNumber">Numero Ordine</option>
          </select>
        </div>

        <div>
          <label className="label">
            Ricerca generica riga
          </label>
          <select
            value={filters.genericRowSearch || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('genericRowSearch', e.target.value)}
            className="input"
          >
            <option value="">Tutti</option>
            <option value="item">Articolo</option>
            <option value="lot">Lotto</option>
            <option value="location">Ubicazione</option>
          </select>
        </div>

        <div>
          <label className="label">
            Data creazione
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.creationDate || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('creationDate', e.target.value)}
              className="input pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ferretto-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="label">
            Data fine evasione
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.completionDate || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('completionDate', e.target.value)}
              className="input pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ferretto-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Additional Filters */}
        <div>
          <label className="label">
            Visualizzazione righe
          </label>
          <select
            value={filters.rowsView || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('rowsView', e.target.value)}
            className="input"
          >
            <option value="">Tutte</option>
            <option value="pending">In attesa</option>
            <option value="completed">Completate</option>
            <option value="processing">In elaborazione</option>
          </select>
        </div>

        <div>
          <label className="label">
            Codice
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.code || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('code', e.target.value)}
              placeholder="Cerca per codice..."
              className="input pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ferretto-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="label">
            Id Lista
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.listId || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('listId', e.target.value)}
              placeholder="Cerca per ID lista..."
              className="input pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ferretto-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={onSearch}
            className="btn-primary w-full"
            type="button"
          >
            Cerca
          </button>
        </div>
      </div>
    </div>
  );
};

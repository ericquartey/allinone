/**
 * ListsTableSettings Component
 *
 * Pannello di configurazione per mostrare/nascondere colonne della tabella liste.
 * Salva le preferenze nel localStorage per persistenza tra sessioni.
 */

import React, { useState, useEffect } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean; // Colonne che non possono essere nascoste
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  // Colonne sempre visibili (required)
  { key: 'location', label: 'NLocazione/Pil', visible: true, required: true },
  { key: 'listNumber', label: 'NumLista', visible: true, required: true },

  // Colonne opzionali - base
  { key: 'reference', label: 'RifLista', visible: true },
  { key: 'description', label: 'Descrizione', visible: false },
  { key: 'area', label: 'Area', visible: true },
  { key: 'destination', label: 'GruppoDestinazione', visible: true },
  { key: 'priority', label: 'Priorità', visible: true },
  { key: 'sequence', label: 'SequenzaLancio', visible: true },

  // Colonne dati utente
  { key: 'user', label: 'Utente', visible: false },

  // Colonne date
  { key: 'dateCreated', label: 'Data Creazione', visible: false },
  { key: 'dateModified', label: 'Data Modifica', visible: false },
  { key: 'dateLaunched', label: 'Data Lancio', visible: false },
  { key: 'dateStartExecution', label: 'Inizio Evasione', visible: false },
  { key: 'dateEndExecution', label: 'Fine Evasione', visible: false },

  // Colonne statistiche
  { key: 'totalRows', label: 'Totale Righe', visible: false },
  { key: 'completedRows', label: 'Righe Completate', visible: false },
  { key: 'unprocessableRows', label: 'Righe Non Evadibili', visible: false },
  { key: 'progress', label: 'Progresso', visible: true },

  // Colonne stato
  { key: 'listType', label: 'Tipo Lista', visible: true, required: true },
  { key: 'listStatus', label: 'Stato Lista', visible: true, required: true },
  { key: 'terminated', label: 'Terminata', visible: false },

  // Colonne tecniche
  { key: 'movementCause', label: 'Causale Movimento', visible: false },
  { key: 'barcode', label: 'Barcode', visible: false },
];

const STORAGE_KEY = 'lists_table_columns_config';

interface ListsTableSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const ListsTableSettings: React.FC<ListsTableSettingsProps> = ({
  isOpen,
  onClose,
  columns,
  onColumnsChange
}) => {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleToggleColumn = (key: string) => {
    const updatedColumns = localColumns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleApply = () => {
    onColumnsChange(localColumns);
    onClose();
  };

  const handleReset = () => {
    setLocalColumns(DEFAULT_COLUMNS);
  };

  const handleSelectAll = () => {
    const updatedColumns = localColumns.map(col => ({ ...col, visible: true }));
    setLocalColumns(updatedColumns);
  };

  const handleDeselectAll = () => {
    const updatedColumns = localColumns.map(col =>
      col.required ? col : { ...col, visible: false }
    );
    setLocalColumns(updatedColumns);
  };

  if (!isOpen) return null;

  // Raggruppa colonne per categoria
  const columnGroups = {
    base: localColumns.filter(c => ['location', 'listNumber', 'reference', 'description', 'area', 'destination', 'priority', 'sequence'].includes(c.key)),
    user: localColumns.filter(c => c.key === 'user'),
    dates: localColumns.filter(c => c.key.startsWith('date')),
    stats: localColumns.filter(c => ['totalRows', 'completedRows', 'unprocessableRows', 'progress'].includes(c.key)),
    status: localColumns.filter(c => ['listType', 'listStatus', 'terminated'].includes(c.key)),
    technical: localColumns.filter(c => ['movementCause', 'barcode'].includes(c.key)),
  };

  const visibleCount = localColumns.filter(c => c.visible).length;
  const totalCount = localColumns.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-ferretto-red to-ferretto-red-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <div>
              <h2 className="text-lg font-heading font-bold">Configurazione Colonne</h2>
              <p className="text-sm text-white/90">
                {visibleCount} di {totalCount} colonne visibili
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm font-medium text-ferretto-dark bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Seleziona Tutto
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-sm font-medium text-ferretto-dark bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Deseleziona Tutto
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm font-medium text-ferretto-dark bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5 ml-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Default
            </button>
          </div>
        </div>

        {/* Column Groups */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Colonne Base */}
          <div className="mb-6">
            <h3 className="text-sm font-heading font-bold text-ferretto-dark uppercase tracking-wider mb-3">
              Colonne Base
            </h3>
            <div className="space-y-2">
              {columnGroups.base.map(column => (
                <label
                  key={column.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    column.visible
                      ? 'bg-ferretto-red/5 border-ferretto-red/30'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${column.required ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => !column.required && handleToggleColumn(column.key)}
                    disabled={column.required}
                    className="h-4 w-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                  />
                  <span className="flex-1 text-sm font-medium text-ferretto-dark">
                    {column.label}
                    {column.required && (
                      <span className="ml-2 text-xs text-gray-500">(obbligatoria)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Utente */}
          {columnGroups.user.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-heading font-bold text-ferretto-dark uppercase tracking-wider mb-3">
                Utente
              </h3>
              <div className="space-y-2">
                {columnGroups.user.map(column => (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      column.visible
                        ? 'bg-ferretto-red/5 border-ferretto-red/30'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggleColumn(column.key)}
                      className="h-4 w-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                    />
                    <span className="flex-1 text-sm font-medium text-ferretto-dark">
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          {columnGroups.dates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-heading font-bold text-ferretto-dark uppercase tracking-wider mb-3">
                Date
              </h3>
              <div className="space-y-2">
                {columnGroups.dates.map(column => (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      column.visible
                        ? 'bg-ferretto-red/5 border-ferretto-red/30'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggleColumn(column.key)}
                      className="h-4 w-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                    />
                    <span className="flex-1 text-sm font-medium text-ferretto-dark">
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Statistiche */}
          {columnGroups.stats.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-heading font-bold text-ferretto-dark uppercase tracking-wider mb-3">
                Statistiche
              </h3>
              <div className="space-y-2">
                {columnGroups.stats.map(column => (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      column.visible
                        ? 'bg-ferretto-red/5 border-ferretto-red/30'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggleColumn(column.key)}
                      className="h-4 w-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                    />
                    <span className="flex-1 text-sm font-medium text-ferretto-dark">
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Stato */}
          {columnGroups.status.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-heading font-bold text-ferretto-dark uppercase tracking-wider mb-3">
                Stato
              </h3>
              <div className="space-y-2">
                {columnGroups.status.map(column => (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      column.visible
                        ? 'bg-ferretto-red/5 border-ferretto-red/30'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${column.required ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => !column.required && handleToggleColumn(column.key)}
                      disabled={column.required}
                      className="h-4 w-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                    />
                    <span className="flex-1 text-sm font-medium text-ferretto-dark">
                      {column.label}
                      {column.required && (
                        <span className="ml-2 text-xs text-gray-500">(obbligatoria)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Colonne Tecniche */}
          {columnGroups.technical.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-heading font-bold text-ferretto-dark uppercase tracking-wider mb-3">
                Dati Tecnici
              </h3>
              <div className="space-y-2">
                {columnGroups.technical.map(column => (
                  <label
                    key={column.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      column.visible
                        ? 'bg-ferretto-red/5 border-ferretto-red/30'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggleColumn(column.key)}
                      className="h-4 w-4 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red"
                    />
                    <span className="flex-1 text-sm font-medium text-ferretto-dark">
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-ferretto-dark bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-ferretto-red hover:bg-ferretto-red-dark rounded-lg transition-colors"
          >
            Applica
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Hook per gestire la configurazione delle colonne con persistenza localStorage
 */
export const useTableColumns = () => {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Carica configurazione salvata o usa default
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Errore nel parsing della configurazione colonne:', e);
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  const updateColumns = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isColumnVisible = (key: string): boolean => {
    const column = columns.find(c => c.key === key);
    return column?.visible ?? false;
  };

  return {
    columns,
    updateColumns,
    resetColumns,
    isColumnVisible
  };
};

export default ListsTableSettings;

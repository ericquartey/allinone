// ============================================================================
// EJLOG WMS - Settings General Page
// Gestione configurazioni generali del sistema (Config CRUD)
// Migrated from: gui/frames/config/ConfigPanelBase.java (Swing)
// ============================================================================

import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Cog6ToothIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import { useSettingsManagement } from '../../hooks/useSettings';
import type { Config, ConfigFilters, ConfigId } from '../../types/settings';
import { toggleTouchMode, selectTouchMode } from '../../features/settings/settingsSlice';

// ============================================================================
// Component
// ============================================================================

export default function SettingsGeneralPage() {
  // Redux
  const dispatch = useDispatch();
  const touchMode = useSelector(selectTouchMode);

  // Filters state
  const [filters, setFilters] = useState<ConfigFilters>({
    sezione: '',
    sottosezione: '',
    chiave: '',
    searchText: '',
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<ConfigId | null>(null);

  // Hooks
  const {
    configs,
    isLoadingConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    isCreating,
    isUpdating,
    isDeleting,
    refetchConfigs,
  } = useSettingsManagement(filters);

  // ============================================================================
  // Filters
  // ============================================================================

  const filteredConfigs = useMemo(() => {
    let result = configs;

    // Filter by sezione
    if (filters.sezione) {
      result = result.filter((c) =>
        c.id.sezione.toLowerCase().includes(filters.sezione!.toLowerCase())
      );
    }

    // Filter by sottosezione
    if (filters.sottosezione) {
      result = result.filter((c) =>
        c.id.sottosezione.toLowerCase().includes(filters.sottosezione!.toLowerCase())
      );
    }

    // Filter by chiave
    if (filters.chiave) {
      result = result.filter((c) =>
        c.id.chiave.toLowerCase().includes(filters.chiave!.toLowerCase())
      );
    }

    // Filter by search text (searches in all fields)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.sezione.toLowerCase().includes(searchLower) ||
          c.id.sottosezione.toLowerCase().includes(searchLower) ||
          c.id.chiave.toLowerCase().includes(searchLower) ||
          c.valore?.toLowerCase().includes(searchLower) ||
          c.descrizione?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [configs, filters]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleClearFilters = () => {
    setFilters({
      sezione: '',
      sottosezione: '',
      chiave: '',
      searchText: '',
    });
  };

  const handleCreateNew = () => {
    setSelectedConfig(null);
    setShowEditModal(true);
  };

  const handleEdit = (config: Config) => {
    setSelectedConfig(config);
    setShowEditModal(true);
  };

  const handleDelete = (id: ConfigId) => {
    setConfigToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (configToDelete) {
      deleteConfig(configToDelete, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setConfigToDelete(null);
        },
      });
    }
  };

  const handleViewHistory = (config: Config) => {
    setSelectedConfig(config);
    setShowHistoryModal(true);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Cog6ToothIcon className="h-12 w-12 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configurazione Generale
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestione configurazioni sistema (Sezione/Sottosezione/Chiave/Valore)
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateNew}
              disabled={isCreating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nuova Configurazione</span>
            </button>
          </div>
        </div>

        {/* Touch Mode Setting */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <DevicePhoneMobileIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Modalità Touch Screen
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Attiva l'interfaccia ottimizzata per schermi touch con pulsanti grandi e
                  navigazione semplificata
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                dispatch(toggleTouchMode());
                toast.success(
                  !touchMode
                    ? 'Modalità Touch attivata'
                    : 'Modalità Touch disattivata'
                );
              }}
              className={`relative inline-flex h-12 w-24 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                touchMode
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-10 w-10 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  touchMode ? 'translate-x-12' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {touchMode && (
            <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
              <p className="text-sm text-blue-900 font-medium">
                ✓ Modalità Touch attiva - La pagina Operazioni Liste utilizzerà
                automaticamente l'interfaccia touch-friendly
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Filtri di Ricerca
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sezione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sezione
              </label>
              <input
                type="text"
                value={filters.sezione}
                onChange={(e) => setFilters({ ...filters, sezione: e.target.value })}
                placeholder="es. Database, Host..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sottosezione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sottosezione
              </label>
              <input
                type="text"
                value={filters.sottosezione}
                onChange={(e) =>
                  setFilters({ ...filters, sottosezione: e.target.value })
                }
                placeholder="es. Connection, Import..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Chiave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chiave
              </label>
              <input
                type="text"
                value={filters.chiave}
                onChange={(e) => setFilters({ ...filters, chiave: e.target.value })}
                placeholder="es. url, timeout..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Search All */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ricerca Generale
              </label>
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) =>
                  setFilters({ ...filters, searchText: e.target.value })
                }
                placeholder="Cerca in tutti i campi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              <XMarkIcon className="w-5 h-5" />
              <span>Pulisci Filtri</span>
            </button>

            <button
              onClick={() => refetchConfigs()}
              disabled={isLoadingConfigs}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 font-medium"
            >
              <ArrowPathIcon
                className={`w-5 h-5 ${isLoadingConfigs ? 'animate-spin' : ''}`}
              />
              <span>Aggiorna</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {isLoadingConfigs ? (
              'Caricamento...'
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {filteredConfigs.length}
                </span>{' '}
                configurazioni trovate
                {configs.length !== filteredConfigs.length &&
                  ` (su ${configs.length} totali)`}
              </>
            )}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoadingConfigs ? (
            <div className="flex items-center justify-center p-12">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600">Caricamento configurazioni...</span>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="text-center p-12">
              <Cog6ToothIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nessuna Configurazione Trovata
              </h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some((f) => f)
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia creando una nuova configurazione'}
              </p>
              {!Object.values(filters).some((f) => f) && (
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Nuova Configurazione</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sezione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sottosezione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chiave
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valore
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ultima Modifica
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConfigs.map((config) => (
                    <tr
                      key={`${config.id.sezione}-${config.id.sottosezione}-${config.id.chiave}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {config.id.sezione}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {config.id.sottosezione}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.id.chiave}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs truncate" title={config.valore}>
                          {config.valore}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {config.dataUltimaModifica ? (
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {new Date(config.dataUltimaModifica).toLocaleString('it-IT')}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewHistory(config)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Visualizza storico"
                          >
                            <ClockIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifica"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Elimina"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Conferma Eliminazione
              </h3>
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler eliminare questa configurazione?
                <br />
                <span className="font-mono text-sm mt-2 block">
                  {configToDelete?.sezione} → {configToDelete?.sottosezione} →{' '}
                  {configToDelete?.chiave}
                </span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfigToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {isDeleting ? 'Eliminazione...' : 'Elimina'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

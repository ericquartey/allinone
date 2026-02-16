// ============================================================================
// EJLOG WMS - Settings Host Page
// Impostazioni scambio dati con Host e schedulazioni
// Migrated from: gui/frames/host/ImpostazioniHostPanelBase.java (Swing)
// ============================================================================

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  ServerIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  useHostSettings,
  useUpdateHostExchangeMode,
  useSchedules,
  useUpdateSchedule,
} from '../../hooks/useSettings';
import type { HostExchangeMode, Schedule } from '../../types/settings';

// ============================================================================
// Component
// ============================================================================

export default function SettingsHostPage() {
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<HostExchangeMode | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Hooks
  const { data: hostSettings, isLoading: isLoadingHost } = useHostSettings();
  const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedules();
  const updateMode = useUpdateHostExchangeMode();
  const updateSchedule = useUpdateSchedule();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleChangeMode = (mode: HostExchangeMode) => {
    setSelectedMode(mode);
    setShowChangeModal(true);
  };

  const confirmChangeMode = () => {
    if (selectedMode) {
      updateMode.mutate(selectedMode, {
        onSuccess: () => {
          setShowChangeModal(false);
          setSelectedMode(null);
        },
      });
    }
  };

  const handleToggleSchedule = (schedule: Schedule) => {
    updateSchedule.mutate({
      ...schedule,
      enabled: !schedule.enabled,
    });
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
  };

  // ============================================================================
  // Render
  // ============================================================================

  const currentMode = hostSettings?.exchangeMode || 'DATABASE';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <ServerIcon className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Impostazioni Host
              </h1>
              <p className="text-gray-600 mt-1">
                Configurazione scambio dati con sistema Host e schedulazioni
              </p>
            </div>
          </div>
        </div>

        {/* Current Exchange Mode */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ServerIcon className="w-6 h-6 mr-2 text-blue-600" />
            Modalità Scambio Dati
          </h3>

          {isLoadingHost ? (
            <div className="flex items-center justify-center p-8">
              <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600">Caricamento...</span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-gray-700 font-medium">Stato Corrente:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      currentMode === 'DATABASE'
                        ? 'bg-blue-100 text-blue-800'
                        : currentMode === 'FILE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {currentMode}
                  </span>
                </div>
                {hostSettings?.lastChangeDate && (
                  <p className="text-sm text-gray-500">
                    Ultima modifica:{' '}
                    {new Date(hostSettings.lastChangeDate).toLocaleString('it-IT')}
                    {hostSettings.lastChangeUser && ` da ${hostSettings.lastChangeUser}`}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {/* Database Mode */}
                <button
                  onClick={() => handleChangeMode('DATABASE')}
                  disabled={currentMode === 'DATABASE' || updateMode.isPending}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    currentMode === 'DATABASE'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentMode === 'DATABASE'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {currentMode === 'DATABASE' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Scambio tramite Database
                        </p>
                        <p className="text-sm text-gray-600">
                          Scambio dati diretto con database Host via JDBC
                        </p>
                      </div>
                    </div>
                    {currentMode === 'DATABASE' && (
                      <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                </button>

                {/* File Mode */}
                <button
                  onClick={() => handleChangeMode('FILE')}
                  disabled={currentMode === 'FILE' || updateMode.isPending}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    currentMode === 'FILE'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentMode === 'FILE'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {currentMode === 'FILE' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Scambio tramite File</p>
                        <p className="text-sm text-gray-600">
                          Scambio dati tramite file CSV/XML in cartelle condivise
                        </p>
                      </div>
                    </div>
                    {currentMode === 'FILE' && (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </button>

                {/* REST Mode */}
                <button
                  onClick={() => handleChangeMode('REST')}
                  disabled={currentMode === 'REST' || updateMode.isPending}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    currentMode === 'REST'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentMode === 'REST'
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {currentMode === 'REST' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Scambio tramite REST API
                        </p>
                        <p className="text-sm text-gray-600">
                          Scambio dati tramite chiamate REST API HTTP/HTTPS
                        </p>
                      </div>
                    </div>
                    {currentMode === 'REST' && (
                      <CheckCircleIcon className="w-6 h-6 text-purple-600" />
                    )}
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Schedulazioni */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="w-6 h-6 mr-2 text-blue-600" />
            Schedulazioni Import/Export
          </h3>

          {isLoadingSchedules ? (
            <div className="flex items-center justify-center p-8">
              <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600">Caricamento schedulazioni...</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center p-8">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Nessuna schedulazione configurata</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            schedule.type === 'IMPORT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {schedule.type}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            schedule.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {schedule.enabled ? 'Attiva' : 'Disattivata'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Categoria: {schedule.category}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">
                        Cron: {schedule.cronExpression}
                      </p>
                      {schedule.nextRun && (
                        <p className="text-xs text-gray-500 mt-2">
                          Prossima esecuzione:{' '}
                          {new Date(schedule.nextRun).toLocaleString('it-IT')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleSchedule(schedule)}
                        disabled={updateSchedule.isPending}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                          schedule.enabled
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        } disabled:opacity-50`}
                      >
                        {schedule.enabled ? 'Disattiva' : 'Attiva'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Mode Confirmation Modal */}
        {showChangeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Conferma Cambio Modalità
              </h3>
              <p className="text-gray-600 mb-2">
                Sei sicuro di voler cambiare la modalità di scambio da
              </p>
              <p className="text-center my-4">
                <span className="px-3 py-1 bg-gray-100 rounded font-semibold">
                  {currentMode}
                </span>
                <span className="mx-3 text-gray-400">→</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-semibold">
                  {selectedMode}
                </span>
              </p>
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-6">
                ⚠️ Questa operazione potrebbe richiedere il riavvio del sistema
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowChangeModal(false);
                    setSelectedMode(null);
                  }}
                  disabled={updateMode.isPending}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmChangeMode}
                  disabled={updateMode.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {updateMode.isPending ? 'Cambio in corso...' : 'Conferma'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

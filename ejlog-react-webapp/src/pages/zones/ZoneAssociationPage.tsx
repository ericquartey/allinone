// ============================================================================
// EJLOG WMS - Zone Association Page
// Pagina associazione zone di lavoro per utente/terminale
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  MapIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export interface Zone {
  id: number;
  code: string;
  description: string;
  selectable: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function ZoneAssociationPage() {
  const navigate = useNavigate();

  // State
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================================
  // Load Zones
  // ============================================================================

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setIsLoading(true);
    try {
      // GET /api/zones?selectable=true
      const zonesResponse = await fetch(
        'http://localhost:3077/api/zones?selectable=true',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!zonesResponse.ok) {
        throw new Error('Errore nel caricamento delle zone');
      }

      const zonesData: Zone[] = await zonesResponse.json();
      setZones(zonesData);

      // GET /api/users/current/zones (zone già associate)
      const userZonesResponse = await fetch(
        'http://localhost:3077/api/users/current/zones',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (userZonesResponse.ok) {
        const userZones: number[] = await userZonesResponse.json();
        setSelectedZoneIds(new Set(userZones));
      }
    } catch (error: any) {
      const errorMessage =
        error.message || 'Errore durante il caricamento delle zone';
      toast.error(errorMessage);
      console.error('Load zones error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleToggleZone = (zoneId: number) => {
    const newSelected = new Set(selectedZoneIds);
    if (newSelected.has(zoneId)) {
      newSelected.delete(zoneId);
    } else {
      newSelected.add(zoneId);
    }
    setSelectedZoneIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(zones.map((z) => z.id));
    setSelectedZoneIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedZoneIds(new Set());
  };

  const handleConfirm = async () => {
    setIsSaving(true);

    try {
      // PUT /api/users/current/zones
      const response = await fetch(
        'http://localhost:3077/api/users/current/zones',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            zoneIds: Array.from(selectedZoneIds),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il salvataggio');
      }

      toast.success('Zone associate con successo');

      // Torna alla home
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage =
        error.message || 'Errore durante l\'associazione delle zone';
      toast.error(errorMessage);
      console.error('Save zones error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento zone...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  const selectedCount = selectedZoneIds.size;
  const totalCount = zones.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Indietro
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <MapIcon className="h-12 w-12 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Associazione Zone di Lavoro
                </h1>
                <p className="text-gray-600 mt-1">
                  Seleziona le zone in cui puoi operare
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600 text-lg">
                {selectedCount}
              </span>{' '}
              zone selezionate su{' '}
              <span className="font-semibold text-gray-900">{totalCount}</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                disabled={selectedCount === totalCount}
                className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seleziona Tutte
              </button>
              <button
                onClick={handleDeselectAll}
                disabled={selectedCount === 0}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deseleziona Tutte
              </button>
            </div>
          </div>
        </div>

        {/* Zones List */}
        {zones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nessuna Zona Disponibile
            </h3>
            <p className="text-gray-600">
              Non ci sono zone selezionabili al momento
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {zones.map((zone) => {
                const isSelected = selectedZoneIds.has(zone.id);

                return (
                  <label
                    key={zone.id}
                    className={`flex items-center px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleZone(zone.id)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`font-medium ${
                              isSelected
                                ? 'text-blue-900'
                                : 'text-gray-900'
                            }`}
                          >
                            {zone.code}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {zone.description}
                          </p>
                        </div>

                        {isSelected && (
                          <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            disabled={isSaving}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
          >
            Annulla
          </button>

          <button
            onClick={handleConfirm}
            disabled={isSaving || zones.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>Conferma Associazione</span>
              </>
            )}
          </button>
        </div>

        {/* Help Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Informazioni
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Seleziona le zone in cui sei autorizzato a lavorare
            </li>
            <li>
              • Puoi selezionare più zone contemporaneamente
            </li>
            <li>
              • Le zone selezionate verranno associate al tuo profilo utente
            </li>
            <li>
              • Click su "Conferma" per salvare le modifiche
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


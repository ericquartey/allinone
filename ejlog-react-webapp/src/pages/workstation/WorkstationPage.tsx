// ============================================================================
// EJLOG WMS - Workstation Page
// Pagina gestione postazione RF terminale
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkstationContext } from '../../contexts/WorkstationContext';
import { toast } from 'react-hot-toast';
import {
  MapPinIcon,
  ComputerDesktopIcon,
  CubeIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Component
// ============================================================================

export default function WorkstationPage() {
  const navigate = useNavigate();
  const { location, udc, isAssociated, isLoading, dissociate, refreshStatus } = useWorkstationContext();

  const [isDissociating, setIsDissociating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ============================================================================
  // Auto-Redirect Logic
  // ============================================================================

  useEffect(() => {
    // Redirect to association page if not associated
    if (!isLoading && !isAssociated) {
      navigate('/workstation/associate', { replace: true });
    }
  }, [isLoading, isAssociated, navigate]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRefresh = async () => {
    try {
      await refreshStatus();
      toast.success('Stato aggiornato');
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleDissociateClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDissociate = async () => {
    setIsDissociating(true);
    try {
      await dissociate();
      setShowConfirmDialog(false);
      // Navigation handled by context (will redirect to /workstation/associate)
    } catch (error) {
      // Error already handled by context with toast
    } finally {
      setIsDissociating(false);
    }
  };

  const handleCancelDissociate = () => {
    setShowConfirmDialog(false);
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento stato postazione...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not associated (will redirect)
  if (!isAssociated || !location) {
    return null;
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ComputerDesktopIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Postazione RF</h1>
              <p className="text-sm text-gray-500">Gestione terminale mobile</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Aggiorna</span>
            </button>

            <button
              onClick={handleDissociateClick}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center space-x-2"
            >
              <XMarkIcon className="h-5 w-5" />
              <span>Dissocia</span>
            </button>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <MapPinIcon className="h-10 w-10 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Ubicazione Associata
            </h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-32">Codice:</span>
                <span className="text-lg font-bold text-blue-600">{location.code}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-32">Descrizione:</span>
                <span className="text-sm text-gray-900">{location.description}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-32">Tipo:</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {location.type}
                </span>
              </div>
              {location.warehouseName && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-32">Magazzino:</span>
                  <span className="text-sm text-gray-900">{location.warehouseName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UDC Info or Empty State */}
      {udc ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <CubeIcon className="h-10 w-10 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                UDC Presente
              </h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-32">Codice UDC:</span>
                  <span className="text-lg font-bold text-purple-600">{udc.code}</span>
                </div>
                {udc.description && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-32">Descrizione:</span>
                    <span className="text-sm text-gray-900">{udc.description}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-32">Ubicazione UDC:</span>
                  <span className="text-sm text-gray-900">{udc.locationCode}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <strong>Nota:</strong> UDC presente in postazione. Rimuovere l'UDC prima di
                  dissociare la postazione.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="text-center py-8">
            <CubeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nessuna UDC Presente
            </h3>
            <p className="text-sm text-gray-600">
              La postazione è vuota. Puoi dissociarla se necessario.
            </p>
          </div>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Informazioni Postazione
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• La postazione è associata alla location <strong>{location.code}</strong></li>
          <li>• Lo stato viene aggiornato automaticamente ogni 30 secondi</li>
          <li>• Usa "Aggiorna" per forzare l'aggiornamento immediato</li>
          <li>• Usa "Dissocia" per terminare la sessione di lavoro</li>
          {udc && <li>• <strong>Rimuovi l'UDC prima di dissociare la postazione</strong></li>}
        </ul>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <XMarkIcon className="h-8 w-8 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Conferma Dissociazione
                </h3>
              </div>

              <p className="text-gray-700 mb-6">
                Sei sicuro di voler dissociare questa postazione dalla location{' '}
                <strong>{location.code}</strong>?
              </p>

              {udc && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Attenzione:</strong> È presente un'UDC in postazione.
                    Assicurati di averla rimossa fisicamente.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDissociate}
                  disabled={isDissociating}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmDissociate}
                  disabled={isDissociating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isDissociating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                      Dissociazione...
                    </>
                  ) : (
                    'Dissocia'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

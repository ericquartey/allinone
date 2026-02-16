// ============================================================================
// EJLOG WMS - Workstation Association Page
// Pagina associazione postazione RF a ubicazione terminale
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkstationContext, type Location } from '../../contexts/WorkstationContext';
import { toast } from 'react-hot-toast';
import {
  MapPinIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Component
// ============================================================================

export default function WorkstationAssociationPage() {
  const navigate = useNavigate();
  const { isAssociated, location, associate, isLoading } = useWorkstationContext();

  const [locationBarcode, setLocationBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAssociating, setIsAssociating] = useState(false);
  const [scannedLocation, setScannedLocation] = useState<Location | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Auto-Redirect Logic
  // ============================================================================

  useEffect(() => {
    // Redirect to workstation page if already associated
    if (!isLoading && isAssociated && location) {
      navigate('/workstation', { replace: true });
    }
  }, [isLoading, isAssociated, location, navigate]);

  // ============================================================================
  // Auto-Focus on Mount
  // ============================================================================

  useEffect(() => {
    // Focus input when page loads
    if (inputRef.current && !isLoading && !isAssociated) {
      inputRef.current.focus();
    }
  }, [isLoading, isAssociated]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleScanLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationBarcode.trim()) {
      toast.error('Inserisci il codice ubicazione');
      return;
    }

    setIsScanning(true);
    setScannedLocation(null);

    try {
      // Fetch location by barcode
      const response = await fetch(
        `http://localhost:3077/api/locations/bar-code/${encodeURIComponent(locationBarcode.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Ubicazione non trovata');
        } else {
          const error = await response.json();
          toast.error(error.message || 'Errore durante la ricerca ubicazione');
        }
        setLocationBarcode('');
        inputRef.current?.focus();
        return;
      }

      const location: Location = await response.json();

      // Validate location type
      if (!location.isTerminal || location.type !== 'TERMINALE_RF') {
        toast.error('L\'ubicazione deve essere di tipo TERMINALE_RF');
        setLocationBarcode('');
        inputRef.current?.focus();
        return;
      }

      // Show location info for confirmation
      setScannedLocation(location);
      toast.success(`Ubicazione trovata: ${location.code}`);
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante la scansione ubicazione';
      toast.error(errorMessage);
      console.error('Location scan error:', error);
      setLocationBarcode('');
      inputRef.current?.focus();
    } finally {
      setIsScanning(false);
    }
  };

  const handleAssociate = async () => {
    if (!scannedLocation) return;

    setIsAssociating(true);

    try {
      await associate(scannedLocation);
      // Navigation will be handled automatically by context
      // (redirects to /workstation when isAssociated becomes true)
    } catch (error) {
      // Error already handled by context with toast
      setScannedLocation(null);
      setLocationBarcode('');
      inputRef.current?.focus();
    } finally {
      setIsAssociating(false);
    }
  };

  const handleCancel = () => {
    setScannedLocation(null);
    setLocationBarcode('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationBarcode(e.target.value.toUpperCase());
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Show nothing if already associated (will redirect)
  if (isAssociated) {
    return null;
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <ComputerDesktopIcon className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold">Associazione Postazione RF</h1>
              <p className="text-blue-100 text-sm">
                Scansiona l'ubicazione del terminale per iniziare
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!scannedLocation ? (
            // Scan Location Form
            <form onSubmit={handleScanLocation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Ubicazione Terminale
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={locationBarcode}
                    onChange={handleInputChange}
                    disabled={isScanning}
                    placeholder="Scansiona barcode ubicazione..."
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 uppercase font-mono"
                    autoComplete="off"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  L'ubicazione deve essere di tipo <strong>TERMINALE_RF</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={isScanning || !locationBarcode.trim()}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                {isScanning ? (
                  <>
                    <ArrowPathIcon className="h-6 w-6 animate-spin" />
                    <span>Ricerca in corso...</span>
                  </>
                ) : (
                  <>
                    <MapPinIcon className="h-6 w-6" />
                    <span>Cerca Ubicazione</span>
                  </>
                )}
              </button>

              {/* Help Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Come Associare la Postazione
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Scansiona il barcode dell'ubicazione terminale</li>
                  <li>Verifica che sia di tipo TERMINALE_RF</li>
                  <li>Conferma l'associazione</li>
                  <li>Inizia a lavorare dalla postazione</li>
                </ol>
              </div>
            </form>
          ) : (
            // Confirmation Panel
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <CheckCircleIcon className="h-10 w-10 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-900 mb-3">
                      Ubicazione Trovata
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 w-32">Codice:</span>
                        <span className="text-lg font-bold text-green-700">
                          {scannedLocation.code}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 w-32">Descrizione:</span>
                        <span className="text-sm text-gray-900">
                          {scannedLocation.description}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 w-32">Tipo:</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          {scannedLocation.type}
                        </span>
                      </div>
                      {scannedLocation.warehouseName && (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 w-32">Magazzino:</span>
                          <span className="text-sm text-gray-900">
                            {scannedLocation.warehouseName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Conferma Associazione</p>
                    <p>
                      Stai per associare questa postazione all'ubicazione{' '}
                      <strong>{scannedLocation.code}</strong>. L'associazione rimarrà attiva
                      fino alla dissociazione manuale.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={isAssociating}
                  className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAssociate}
                  disabled={isAssociating}
                  className="flex-1 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                >
                  {isAssociating ? (
                    <>
                      <ArrowPathIcon className="h-6 w-6 animate-spin" />
                      <span>Associazione...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-6 w-6" />
                      <span>Conferma Associazione</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


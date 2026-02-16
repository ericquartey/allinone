// ============================================================================
// EJLOG WMS - UDC Vision Execution Page
// Simplified execution page for UDC vision (view only, confirm operation)
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useListRows, useVisionConfirm } from '../../../hooks/useExecution';

// Types
type VisionStep = 'scan-location' | 'confirm';

interface VisionData {
  locationBarcode?: string;
  locationId?: number;
  locationCode?: string;
}

export default function UDCVisionExecutionPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const locationInputRef = useRef<HTMLInputElement>(null);

  const { data: rows, isLoading: rowsLoading } = useListRows(parseInt(listId!));
  const visionConfirmMutation = useVisionConfirm();

  const [currentStep, setCurrentStep] = useState<VisionStep>('scan-location');
  const [visionData, setVisionData] = useState<VisionData>({});
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [locationBarcode, setLocationBarcode] = useState('');

  const currentRow = rows?.[currentRowIndex];

  useEffect(() => {
    if (currentStep === 'scan-location') {
      locationInputRef.current?.focus();
    }
  }, [currentStep]);

  const handleScanLocation = async () => {
    if (!locationBarcode.trim()) {
      toast.error('Inserisci il barcode della locazione');
      return;
    }

    try {
      // Verify location barcode matches expected location
      const response = await fetch(
        `http://localhost:3077/api/locations/bar-code/${encodeURIComponent(locationBarcode)}`
      );

      if (!response.ok) {
        throw new Error('Locazione non trovata');
      }

      const location = await response.json();

      setVisionData({
        ...visionData,
        locationBarcode,
        locationId: location.id,
        locationCode: location.code,
      });

      toast.success(`Locazione: ${location.code}`);
      setCurrentStep('confirm');
    } catch (err) {
      console.error('Location scan error:', err);
      toast.error('Errore durante la scansione locazione');
    }
  };

  const handleConfirm = async () => {
    if (!currentRow) return;

    try {
      await visionConfirmMutation.mutateAsync({
        itemId: currentRow.itemId,
        locationId: visionData.locationId!,
        userName: 'current-user',
      });

      toast.success('Operazione confermata');

      // Move to next row or complete
      if (currentRowIndex < (rows?.length || 0) - 1) {
        setCurrentRowIndex(currentRowIndex + 1);
        resetStep();
      } else {
        toast.success('Lista completata!');
        navigate(`/lists/${listId}`);
      }
    } catch (err) {
      console.error('Confirm error:', err);
      toast.error('Errore durante la conferma');
    }
  };

  const resetStep = () => {
    setCurrentStep('scan-location');
    setVisionData({});
    setLocationBarcode('');
  };

  const handleBack = () => {
    if (currentStep === 'confirm') {
      resetStep();
    } else {
      navigate(`/lists/${listId}`);
    }
  };

  if (rowsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento righe...</p>
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-medium text-yellow-900 mb-1">Lista vuota</h3>
              <p className="text-yellow-700">Nessuna operazione da eseguire</p>
              <button
                onClick={() => navigate(`/lists/${listId}`)}
                className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Torna alla Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            {currentStep === 'confirm' ? 'Indietro' : 'Torna alla Lista'}
          </button>
          <div className="flex items-center gap-3">
            <Archive className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visione UDC</h1>
              <p className="text-gray-600">
                Operazione {currentRowIndex + 1} di {rows.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso</span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentRowIndex + 1) / rows.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentRowIndex + 1) / rows.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Row Info */}
        {currentRow && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Info size={20} />
              Informazioni Operazione
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Articolo:</span>
                <span className="ml-2 font-medium text-blue-900">{currentRow.itemCode}</span>
              </div>
              <div>
                <span className="text-blue-700">Descrizione:</span>
                <span className="ml-2 font-medium text-blue-900">{currentRow.itemDescription}</span>
              </div>
              <div>
                <span className="text-blue-700">Richiesta:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {currentRow.requestMessage || 'Visiona UDC'}
                </span>
              </div>
              {currentRow.operatorInfo && (
                <div className="col-span-2">
                  <span className="text-blue-700">Info Operatore:</span>
                  <span className="ml-2 font-medium text-blue-900">{currentRow.operatorInfo}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Scan Location */}
        {currentStep === 'scan-location' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              Scansiona Locazione
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode Locazione
              </label>
              <input
                ref={locationInputRef}
                type="text"
                value={locationBarcode}
                onChange={(e) => setLocationBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanLocation();
                  }
                }}
                placeholder="Scansiona o inserisci barcode..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
              />
            </div>
            <button
              onClick={handleScanLocation}
              disabled={!locationBarcode.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Conferma Locazione
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {currentStep === 'confirm' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              Conferma Operazione
            </h2>

            {/* Summary */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700">Articolo:</span>
                  <span className="ml-2 font-medium text-green-900">{currentRow?.itemCode}</span>
                </div>
                <div>
                  <span className="text-green-700">Locazione:</span>
                  <span className="ml-2 font-medium text-green-900 font-mono">
                    {visionData.locationCode}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={visionConfirmMutation.isPending}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {visionConfirmMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Conferma in corso...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Conferma Visione
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


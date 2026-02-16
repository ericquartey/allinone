// ============================================================================
// EJLOG WMS - Product Vision Execution Page
// Execution page for viewing and confirming product instances (lot/serial)
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
  Barcode,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useListRows, useInventoryItem } from '../../../hooks/useExecution';

// Types
type VisionStep = 'scan-location' | 'scan-product' | 'confirm-quantity';

interface VisionData {
  locationBarcode?: string;
  locationId?: number;
  locationCode?: string;
  productBarcode?: string;
  lot?: string;
  serialNumber?: string;
  existingQuantity?: number;
  confirmedQuantity?: number;
}

export default function ProductVisionExecutionPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const { data: rows, isLoading: rowsLoading } = useListRows(parseInt(listId!));
  const inventoryMutation = useInventoryItem();

  const [currentStep, setCurrentStep] = useState<VisionStep>('scan-location');
  const [visionData, setVisionData] = useState<VisionData>({});
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [locationBarcode, setLocationBarcode] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [quantity, setQuantity] = useState('');

  const currentRow = rows?.[currentRowIndex];

  // Auto-focus management
  useEffect(() => {
    if (currentStep === 'scan-location') {
      locationInputRef.current?.focus();
    } else if (currentStep === 'scan-product') {
      productInputRef.current?.focus();
    } else if (currentStep === 'confirm-quantity') {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }
  }, [currentStep]);

  const handleScanLocation = async () => {
    if (!locationBarcode.trim()) {
      toast.error('Inserisci il barcode della locazione');
      return;
    }

    try {
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
      setCurrentStep('scan-product');
    } catch (err) {
      console.error('Location scan error:', err);
      toast.error('Errore durante la scansione locazione');
    }
  };

  const handleScanProduct = async () => {
    if (!productBarcode.trim()) {
      toast.error('Inserisci il barcode prodotto');
      return;
    }

    try {
      // Fetch product instance by barcode to get lot/serial and quantity
      const response = await fetch(
        `http://localhost:3077/api/products/bar-code/${encodeURIComponent(productBarcode)}`
      );

      if (!response.ok) {
        throw new Error('Prodotto non trovato');
      }

      const product = await response.json();

      // Pre-fill quantity from existing product instance
      const existingQty = product.quantity || 0;
      setQuantity(existingQty.toString());

      setVisionData({
        ...visionData,
        productBarcode,
        lot: product.lot,
        serialNumber: product.serialNumber,
        existingQuantity: existingQty,
      });

      toast.success(
        `Prodotto trovato${product.lot ? ` - Lotto: ${product.lot}` : ''}${
          product.serialNumber ? ` - SN: ${product.serialNumber}` : ''
        }`
      );
      setCurrentStep('confirm-quantity');
    } catch (err) {
      console.error('Product scan error:', err);
      toast.error('Errore durante la scansione prodotto');
    }
  };

  const handleConfirm = async () => {
    if (!currentRow) return;

    const confirmedQty = parseFloat(quantity);
    if (isNaN(confirmedQty) || confirmedQty <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    try {
      await inventoryMutation.mutateAsync({
        itemId: currentRow.itemId,
        quantity: confirmedQty,
        locationId: visionData.locationId!,
        userName: 'current-user',
      });

      toast.success('Visione prodotto confermata');

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
    setProductBarcode('');
    setQuantity('');
  };

  const handleBack = () => {
    if (currentStep === 'confirm-quantity') {
      setCurrentStep('scan-product');
      setProductBarcode('');
      setQuantity('');
    } else if (currentStep === 'scan-product') {
      setCurrentStep('scan-location');
      setLocationBarcode('');
    } else {
      navigate(`/lists/${listId}`);
    }
  };

  if (rowsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
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
            {currentStep === 'scan-location' ? 'Torna alla Lista' : 'Indietro'}
          </button>
          <div className="flex items-center gap-3">
            <Package className="text-purple-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visione Prodotto</h1>
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
              className="bg-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentRowIndex + 1) / rows.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Row Info */}
        {currentRow && (
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Info size={20} />
              Informazioni Articolo
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-700">Codice:</span>
                <span className="ml-2 font-medium text-purple-900 font-mono">
                  {currentRow.itemCode}
                </span>
              </div>
              <div>
                <span className="text-purple-700">Descrizione:</span>
                <span className="ml-2 font-medium text-purple-900">
                  {currentRow.itemDescription}
                </span>
              </div>
              {currentRow.lotManaged && (
                <div>
                  <span className="text-purple-700">Gestione Lotto:</span>
                  <span className="ml-2 font-medium text-purple-900">Attiva</span>
                </div>
              )}
              {currentRow.serialManaged && (
                <div>
                  <span className="text-purple-700">Gestione Matricola:</span>
                  <span className="ml-2 font-medium text-purple-900">Attiva</span>
                </div>
              )}
              {currentRow.operatorInfo && (
                <div className="col-span-2">
                  <span className="text-purple-700">Info Operatore:</span>
                  <span className="ml-2 font-medium text-purple-900">
                    {currentRow.operatorInfo}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Scan Location */}
        {currentStep === 'scan-location' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="text-purple-600" size={24} />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-mono"
              />
            </div>
            <button
              onClick={handleScanLocation}
              disabled={!locationBarcode.trim()}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Conferma Locazione
            </button>
          </div>
        )}

        {/* Step: Scan Product */}
        {currentStep === 'scan-product' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Barcode className="text-purple-600" size={24} />
              Scansiona Prodotto
            </h2>

            {/* Location info */}
            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <div className="text-sm">
                <span className="text-purple-700">Locazione:</span>
                <span className="ml-2 font-medium text-purple-900 font-mono">
                  {visionData.locationCode}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode Prodotto {currentRow?.lotManaged && '(con Lotto)'}
                {currentRow?.serialManaged && '(con Matricola)'}
              </label>
              <input
                ref={productInputRef}
                type="text"
                value={productBarcode}
                onChange={(e) => setProductBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanProduct();
                  }
                }}
                placeholder="Scansiona o inserisci barcode prodotto..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-mono"
              />
            </div>
            <button
              onClick={handleScanProduct}
              disabled={!productBarcode.trim()}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Conferma Prodotto
            </button>
          </div>
        )}

        {/* Step: Confirm Quantity */}
        {currentStep === 'confirm-quantity' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              Conferma Quantità
            </h2>

            {/* Summary */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-purple-700">Articolo:</span>
                  <span className="ml-2 font-medium text-purple-900 font-mono">
                    {currentRow?.itemCode}
                  </span>
                </div>
                <div>
                  <span className="text-purple-700">Locazione:</span>
                  <span className="ml-2 font-medium text-purple-900 font-mono">
                    {visionData.locationCode}
                  </span>
                </div>
                {visionData.lot && (
                  <div>
                    <span className="text-purple-700">Lotto:</span>
                    <span className="ml-2 font-medium text-purple-900 font-mono">
                      {visionData.lot}
                    </span>
                  </div>
                )}
                {visionData.serialNumber && (
                  <div>
                    <span className="text-purple-700">Matricola:</span>
                    <span className="ml-2 font-medium text-purple-900 font-mono">
                      {visionData.serialNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità Rilevata
              </label>
              <input
                ref={quantityInputRef}
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-mono text-center"
              />
              <p className="mt-2 text-sm text-gray-600">
                Quantità esistente: <span className="font-medium">{visionData.existingQuantity}</span>
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={inventoryMutation.isPending || !quantity.trim()}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {inventoryMutation.isPending ? (
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


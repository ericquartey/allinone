import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Undo2,
  Box,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types
interface UDC {
  id: number;
  barcode: string;
  locationCode?: string;
  productCount: number;
}

interface Product {
  id: number;
  code: string;
  description: string;
  lot?: string;
  serialNumber?: string;
  quantity: number;
  unitOfMeasure: string;
}

type TransferStep = 'scan-destination' | 'scan-source' | 'select-product';

export default function MaterialTransferPage() {
  const navigate = useNavigate();
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  // State
  const [currentStep, setCurrentStep] = useState<TransferStep>('scan-destination');
  const [destinationUDC, setDestinationUDC] = useState<UDC | null>(null);
  const [sourceUDC, setSourceUDC] = useState<UDC | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<string>('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  const [destinationBarcode, setDestinationBarcode] = useState('');
  const [sourceBarcode, setSourceBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus management
  useEffect(() => {
    if (currentStep === 'scan-destination' && !destinationUDC) {
      destinationInputRef.current?.focus();
    } else if (currentStep === 'scan-source') {
      sourceInputRef.current?.focus();
    }
  }, [currentStep, destinationUDC]);

  const handleScanDestination = async () => {
    if (!destinationBarcode.trim()) {
      toast.error('Inserisci il barcode UDC destinazione');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call API to get UDC by barcode
      const response = await fetch(
        `http://localhost:3077/api/loading-units/bar-code/${encodeURIComponent(destinationBarcode)}`
      );

      if (!response.ok) {
        throw new Error(`Nessuna UDC trovata con barcode ${destinationBarcode}`);
      }

      const udc: UDC = await response.json();

      setDestinationUDC(udc);
      setCurrentStep('scan-source');
      toast.success(`UDC destinazione impostata: ${udc.barcode}`);
    } catch (err) {
      console.error('Scan destination error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la scansione');
      toast.error(err instanceof Error ? err.message : 'Errore durante la scansione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSource = async () => {
    if (!sourceBarcode.trim()) {
      toast.error('Inserisci il barcode UDC sorgente');
      return;
    }

    // Validation: source cannot be same as destination
    if (sourceBarcode === destinationBarcode) {
      toast.error('UDC sorgente non può essere uguale a UDC destinazione');
      setSourceBarcode('');
      sourceInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call API to get UDC by barcode
      const udcResponse = await fetch(
        `http://localhost:3077/api/loading-units/bar-code/${encodeURIComponent(sourceBarcode)}`
      );

      if (!udcResponse.ok) {
        throw new Error(`Nessuna UDC trovata con barcode ${sourceBarcode}`);
      }

      const udc: UDC = await udcResponse.json();

      // Validation: UDC must contain products
      if (udc.productCount === 0) {
        throw new Error('UDC sorgente non contiene prodotti');
      }

      setSourceUDC(udc);

      // Load products from source UDC
      const productsResponse = await fetch(
        `http://localhost:3077/api/products/loading-unit/${udc.id}`
      );

      if (!productsResponse.ok) {
        throw new Error('Errore nel caricamento prodotti');
      }

      const productsData: Product[] = await productsResponse.json();

      // Filter only positive quantity products
      const positiveProducts = productsData.filter((p) => p.quantity > 0);

      if (positiveProducts.length === 0) {
        throw new Error('Nessun prodotto disponibile in UDC sorgente');
      }

      setProducts(positiveProducts);
      setCurrentStep('select-product');
      toast.success(`Trovati ${positiveProducts.length} prodotti in UDC ${udc.barcode}`);
    } catch (err) {
      console.error('Scan source error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la scansione');
      toast.error(err instanceof Error ? err.message : 'Errore durante la scansione');
      setSourceBarcode('');
      sourceInputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setTransferQuantity(product.quantity.toString());
    setShowQuantityModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !sourceUDC || !destinationUDC) return;

    const qty = parseFloat(transferQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    if (qty > selectedProduct.quantity) {
      toast.error('Quantità superiore alla disponibilità');
      return;
    }

    setIsLoading(true);

    try {
      // Call API to transfer product
      const response = await fetch('http://localhost:3077/api/transfers/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          sourceUdcId: sourceUDC.id,
          destinationUdcId: destinationUDC.id,
          quantity: qty,
          userName: 'current-user', // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Errore durante il trasferimento');
      }

      toast.success(
        `Trasferiti ${qty} ${selectedProduct.code} da UDC ${sourceUDC.barcode} a ${destinationUDC.barcode}`
      );

      // Close modal and refresh products
      setShowQuantityModal(false);
      setSelectedProduct(null);
      setTransferQuantity('');

      // Reload products from source UDC
      const productsResponse = await fetch(
        `http://localhost:3077/api/products/loading-unit/${sourceUDC.id}`
      );
      const productsData: Product[] = await productsResponse.json();
      const positiveProducts = productsData.filter((p) => p.quantity > 0);

      setProducts(positiveProducts);

      if (positiveProducts.length === 0) {
        toast.success('Tutti i prodotti trasferiti. Scansiona nuova UDC sorgente.');
        handleResetSource();
      }
    } catch (err) {
      console.error('Transfer error:', err);
      toast.error('Errore durante il trasferimento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDestination = () => {
    setDestinationUDC(null);
    setSourceUDC(null);
    setProducts([]);
    setDestinationBarcode('');
    setSourceBarcode('');
    setCurrentStep('scan-destination');
    setError(null);
  };

  const handleResetSource = () => {
    setSourceUDC(null);
    setProducts([]);
    setSourceBarcode('');
    setCurrentStep('scan-source');
    setError(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ArrowRightLeft className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">
            Trasferimento Materiale
          </h1>
        </div>
        <p className="text-gray-600">
          Trasferisci prodotti tra UDC sorgente e UDC destinazione
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                destinationUDC
                  ? 'bg-green-100 text-green-700'
                  : currentStep === 'scan-destination'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {destinationUDC ? <CheckCircle size={20} /> : '1'}
            </div>
            <div>
              <div className="font-medium text-gray-900">UDC Destinazione</div>
              <div className="text-sm text-gray-500">
                {destinationUDC ? destinationUDC.barcode : 'Scansiona barcode'}
              </div>
            </div>
          </div>

          <ChevronRight className="text-gray-400" size={24} />

          {/* Step 2 */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                sourceUDC
                  ? 'bg-green-100 text-green-700'
                  : currentStep === 'scan-source'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {sourceUDC ? <CheckCircle size={20} /> : '2'}
            </div>
            <div>
              <div className="font-medium text-gray-900">UDC Sorgente</div>
              <div className="text-sm text-gray-500">
                {sourceUDC ? sourceUDC.barcode : 'Scansiona barcode'}
              </div>
            </div>
          </div>

          <ChevronRight className="text-gray-400" size={24} />

          {/* Step 3 */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep === 'select-product'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Seleziona Prodotto</div>
              <div className="text-sm text-gray-500">
                {products.length > 0 ? `${products.length} disponibili` : 'In attesa...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-900 mb-1">Errore</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Scan Destination UDC */}
      {currentStep === 'scan-destination' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Box className="text-blue-600" size={24} />
            Step 1: Scansiona UDC Destinazione (Carrello)
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode UDC Destinazione
            </label>
            <input
              ref={destinationInputRef}
              type="text"
              value={destinationBarcode}
              onChange={(e) => setDestinationBarcode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleScanDestination();
                }
              }}
              placeholder="Scansiona o inserisci barcode..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleScanDestination}
            disabled={isLoading || !destinationBarcode.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifica in corso...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Conferma UDC Destinazione
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Scan Source UDC */}
      {currentStep === 'scan-source' && destinationUDC && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Box className="text-blue-600" size={24} />
              Step 2: Scansiona UDC Sorgente
            </h2>
            <button
              onClick={handleResetDestination}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Undo2 size={18} />
              Cambia Destinazione
            </button>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-1">UDC Destinazione:</div>
            <div className="font-bold text-green-700">{destinationUDC.barcode}</div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode UDC Sorgente
            </label>
            <input
              ref={sourceInputRef}
              type="text"
              value={sourceBarcode}
              onChange={(e) => setSourceBarcode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleScanSource();
                }
              }}
              placeholder="Scansiona o inserisci barcode..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleScanSource}
            disabled={isLoading || !sourceBarcode.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifica in corso...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Conferma UDC Sorgente
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 3: Select Product */}
      {currentStep === 'select-product' && sourceUDC && products.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Step 3: Seleziona Prodotto da Trasferire
              </h2>
              <div className="text-sm text-gray-600 mt-1">
                Sorgente: <span className="font-medium">{sourceUDC.barcode}</span> →
                Destinazione: <span className="font-medium">{destinationUDC?.barcode}</span>
              </div>
            </div>
            <button
              onClick={handleResetSource}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Undo2 size={18} />
              Cambia Sorgente
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Codice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lotto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponibile
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleProductSelect(product)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{product.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {product.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.lot ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {product.lot}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-bold text-green-600">
                        {product.quantity} {product.unitOfMeasure}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Trasferisci
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quantity Modal */}
      {showQuantityModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="text-blue-600" size={24} />
              Trasferimento Materiale
            </h3>

            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Prodotto:</div>
                  <div className="font-medium text-gray-900">{selectedProduct.code}</div>
                  <div className="text-gray-600">Descrizione:</div>
                  <div className="font-medium text-gray-900 truncate">
                    {selectedProduct.description}
                  </div>
                  <div className="text-gray-600">Disponibile:</div>
                  <div className="font-bold text-green-600">
                    {selectedProduct.quantity} {selectedProduct.unitOfMeasure}
                  </div>
                  <div className="text-gray-600">Da:</div>
                  <div className="font-medium text-gray-900">{sourceUDC?.barcode}</div>
                  <div className="text-gray-600">A:</div>
                  <div className="font-medium text-gray-900">{destinationUDC?.barcode}</div>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità da trasferire
              </label>
              <input
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTransfer();
                  }
                }}
                placeholder="0"
                min="0"
                max={selectedProduct.quantity}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center font-bold"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: {selectedProduct.quantity} {selectedProduct.unitOfMeasure}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTransfer}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Trasferimento...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft size={18} />
                    Conferma
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowQuantityModal(false);
                  setSelectedProduct(null);
                  setTransferQuantity('');
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


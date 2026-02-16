// ============================================================================
// EJLOG WMS - Transfer Material Page
// Trasferimento manuale materiale tra locazioni
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import { useBarcode } from '../../hooks/useBarcode';

// Mock data - sostituire con chiamate API reali
const mockLocations = [
  { id: 1, code: 'A01-02-03', zone: 'ZONA_A', type: 'STANDARD', available: true },
  { id: 2, code: 'B05-01-02', zone: 'ZONA_B', type: 'STANDARD', available: true },
  { id: 3, code: 'C03-04-01', zone: 'ZONA_C', type: 'STANDARD', available: true },
  { id: 4, code: 'TRANSIT', zone: 'TRANSIT', type: 'TRANSIT', available: true },
];

interface TransferItem {
  id: number;
  itemCode: string;
  itemDescription: string;
  lot?: string;
  serialNumber?: string;
  quantity: number;
  um: string;
  udcBarcode?: string;
  currentLocation: string;
}

const TransferMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: Source, 2: Destination, 3: Confirm
  const [isLoading, setIsLoading] = useState(false);

  // Transfer state
  const [sourceType, setSourceType] = useState<'LOCATION' | 'UDC'>('UDC');
  const [sourceValue, setSourceValue] = useState('');
  const [sourceData, setSourceData] = useState<any>(null);
  const [destinationType, setDestinationType] = useState<'LOCATION'>('LOCATION');
  const [destinationValue, setDestinationValue] = useState('');
  const [destinationData, setDestinationData] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [transferNote, setTransferNote] = useState('');

  // Barcode scanning
  const { scannedCode, clearScannedCode } = useBarcode();

  // Handle pre-filled UDC from URL params
  useEffect(() => {
    const udcId = searchParams.get('udcId');
    if (udcId && sourceType === 'UDC') {
      // In a real app, fetch UDC data by ID
      setSourceValue(`UDC00${udcId}`);
    }
  }, [searchParams, sourceType]);

  // Handle barcode scan
  useEffect(() => {
    if (scannedCode) {
      if (step === 1) {
        setSourceValue(scannedCode);
        handleSourceLookup(scannedCode);
      } else if (step === 2) {
        setDestinationValue(scannedCode);
        handleDestinationLookup(scannedCode);
      }
      clearScannedCode();
    }
  }, [scannedCode, step]);

  const handleSourceLookup = async (value: string) => {
    setIsLoading(true);
    // Mock API call - replace with real API
    setTimeout(() => {
      if (sourceType === 'UDC') {
        // Mock UDC data
        const mockUDC = {
          barcode: value,
          locationCode: 'A01-02-03',
          items: [
            {
              id: 1,
              itemCode: 'ART001',
              itemDescription: 'Articolo di esempio',
              lot: 'LOT2024001',
              quantity: 50.0,
              um: 'PZ',
              udcBarcode: value,
              currentLocation: 'A01-02-03',
            },
            {
              id: 2,
              itemCode: 'ART002',
              itemDescription: 'Componente meccanico',
              lot: 'LOT2024002',
              quantity: 75.5,
              um: 'KG',
              udcBarcode: value,
              currentLocation: 'A01-02-03',
            },
          ],
        };
        setSourceData(mockUDC);
        setSelectedItems(mockUDC.items);
      } else {
        // Mock Location data
        const mockLocation = {
          code: value,
          items: [
            {
              id: 1,
              itemCode: 'ART001',
              itemDescription: 'Articolo di esempio',
              lot: 'LOT2024001',
              quantity: 50.0,
              um: 'PZ',
              currentLocation: value,
            },
          ],
        };
        setSourceData(mockLocation);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleDestinationLookup = async (value: string) => {
    setIsLoading(true);
    // Mock API call - replace with real API
    setTimeout(() => {
      const location = mockLocations.find((loc) => loc.code === value);
      if (location) {
        setDestinationData(location);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleConfirmTransfer = async () => {
    setIsLoading(true);
    // Mock API call for transfer execution
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to success page or show success message
      alert('Trasferimento completato con successo!');
      navigate('/udc');
    }, 1000);
  };

  const toggleItemSelection = (item: TransferItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          1
        </div>
        <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          2
        </div>
        <div className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          3
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trasferimento Materiale</h1>
          <p className="text-gray-600 mt-1">Trasferimento manuale tra locazioni</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Annulla
        </Button>
      </div>

      {renderStepIndicator()}

      {/* Step 1: Source Selection */}
      {step === 1 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Passo 1: Sorgente</h2>

          {/* Source Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Sorgente
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSourceType('UDC');
                  setSourceData(null);
                  setSourceValue('');
                }}
                className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition ${
                  sourceType === 'UDC'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                UDC (Unità Di Carico)
              </button>
              <button
                onClick={() => {
                  setSourceType('LOCATION');
                  setSourceData(null);
                  setSourceValue('');
                }}
                className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition ${
                  sourceType === 'LOCATION'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Locazione
              </button>
            </div>
          </div>

          {/* Source Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {sourceType === 'UDC' ? 'Barcode UDC' : 'Codice Locazione'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sourceValue}
                onChange={(e) => setSourceValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && sourceValue) {
                    handleSourceLookup(sourceValue);
                  }
                }}
                placeholder={
                  sourceType === 'UDC'
                    ? 'Scannerizza o digita barcode UDC'
                    : 'Scannerizza o digita codice locazione'
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <Button
                onClick={() => handleSourceLookup(sourceValue)}
                disabled={!sourceValue || isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'Cerca'}
              </Button>
            </div>
          </div>

          {/* Source Data Display */}
          {sourceData && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  {sourceType === 'UDC' ? 'UDC Trovata' : 'Locazione Trovata'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      {sourceType === 'UDC' ? 'Barcode' : 'Codice'}
                    </label>
                    <p className="font-semibold">
                      {sourceType === 'UDC' ? sourceData.barcode : sourceData.code}
                    </p>
                  </div>
                  {sourceType === 'UDC' && (
                    <div>
                      <label className="text-sm text-gray-600">Locazione Attuale</label>
                      <p className="font-semibold">{sourceData.locationCode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items to Transfer */}
              <div>
                <h3 className="font-semibold mb-3">
                  Articoli da Trasferire ({sourceData.items?.length || 0})
                </h3>
                <div className="space-y-2">
                  {sourceData.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.itemCode}</p>
                        <p className="text-sm text-gray-600">{item.itemDescription}</p>
                        <p className="text-sm text-gray-500">
                          Lotto: {item.lot || 'N/A'} | Quantità: {item.quantity} {item.um}
                        </p>
                      </div>
                      {sourceType === 'LOCATION' && (
                        <input
                          type="checkbox"
                          checked={selectedItems.some((i) => i.id === item.id)}
                          onChange={() => toggleItemSelection(item)}
                          className="w-5 h-5"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Avanti
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Destination Selection */}
      {step === 2 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Passo 2: Destinazione</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Locazione Destinazione
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destinationValue}
                onChange={(e) => setDestinationValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && destinationValue) {
                    handleDestinationLookup(destinationValue);
                  }
                }}
                placeholder="Scannerizza o digita codice locazione"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <Button
                onClick={() => handleDestinationLookup(destinationValue)}
                disabled={!destinationValue || isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'Cerca'}
              </Button>
            </div>
          </div>

          {destinationData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Destinazione Selezionata</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Codice</label>
                    <p className="font-semibold">{destinationData.code}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Zona</label>
                    <p className="font-semibold">{destinationData.zone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Stato</label>
                    <Badge variant={destinationData.available ? 'success' : 'danger'}>
                      {destinationData.available ? 'DISPONIBILE' : 'OCCUPATA'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Indietro
                </Button>
                <Button onClick={() => setStep(3)}>Avanti</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Passo 3: Conferma</h2>

          <div className="space-y-6">
            {/* Transfer Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-red-600">Da:</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    {sourceType === 'UDC' ? 'UDC' : 'Locazione'}
                  </p>
                  <p className="font-semibold text-lg">
                    {sourceType === 'UDC' ? sourceData?.barcode : sourceData?.code}
                  </p>
                  {sourceType === 'UDC' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Locazione: {sourceData?.locationCode}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-green-600">A:</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Locazione</p>
                  <p className="font-semibold text-lg">{destinationData?.code}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Zona: {destinationData?.zone}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <h3 className="font-semibold mb-3">
                Articoli da Trasferire ({selectedItems.length})
              </h3>
              <div className="border border-gray-300 rounded-lg divide-y">
                {selectedItems.map((item) => (
                  <div key={item.id} className="p-3">
                    <p className="font-semibold">{item.itemCode} - {item.itemDescription}</p>
                    <p className="text-sm text-gray-600">
                      Lotto: {item.lot || 'N/A'} | Quantità: {item.quantity} {item.um}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Trasferimento (opzionale)
              </label>
              <textarea
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Inserisci eventuali note per questo trasferimento..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Indietro
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Annulla
                </Button>
                <Button onClick={handleConfirmTransfer} disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : 'Conferma Trasferimento'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TransferMaterialPage;

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Hash,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { useListRows, useListStatusPolling, useInventoryItem } from '../../../hooks/useExecution';
import { toast } from 'react-hot-toast';

// Types
type InventoryStep = 'scan-location' | 'scan-item' | 'input-quantity' | 'confirm';

interface InventoryData {
  scannedLocation?: string;
  scannedItem?: string;
  quantity?: number;
}

export default function InventoryExecutionPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<InventoryStep>('scan-location');
  const [inventoryData, setInventoryData] = useState<InventoryData>({});
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch list rows from API
  const { data: listRows = [], isLoading, error: fetchError, refetch } = useListRows(listId!);

  // Poll list status for progress tracking
  const { progress } = useListStatusPolling(parseInt(listId!, 10), {
    enabled: !!listId && !isNaN(parseInt(listId!, 10)),
    interval: 10000,
  });

  // Inventory mutation
  const inventoryItemMutation = useInventoryItem();

  const currentRow = listRows[currentRowIndex];

  const getNextStep = (current: InventoryStep): InventoryStep | 'done' => {
    switch (current) {
      case 'scan-location':
        return 'scan-item';
      case 'scan-item':
        return 'input-quantity';
      case 'input-quantity':
        return 'confirm';
      case 'confirm':
        return 'done';
      default:
        return 'done';
    }
  };

  const handleStepComplete = async (stepData: Partial<InventoryData>) => {
    const newData = { ...inventoryData, ...stepData };
    setInventoryData(newData);

    const nextStep = getNextStep(currentStep);

    if (nextStep === 'done') {
      // Execute inventory using mutation hook
      setIsExecuting(true);
      try {
        await inventoryItemMutation.mutateAsync({
          itemId: currentRow.itemId,
          quantity: newData.quantity || 0,
          locationId: currentRow.sourceLocationId,
          userName: 'current-user', // TODO: Get from auth context
        });

        // Ricarica righe lista
        await refetch();

        // Move to next row or finish
        if (currentRowIndex < listRows.length - 1) {
          setCurrentRowIndex(currentRowIndex + 1);
          setCurrentStep('scan-location');
          setInventoryData({});
          setError(null);
        } else {
          // Lista completata
          toast.success('Lista inventario completata!');
          navigate('/lists/execution');
        }
      } catch (error) {
        console.error('Error inventory:', error);
        setError('Errore durante l\'inventario. Riprova.');
      } finally {
        setIsExecuting(false);
      }
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handlePreviousRow = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(currentRowIndex - 1);
      setCurrentStep('scan-location');
      setInventoryData({});
      setError(null);
    }
  };

  const handleNextRow = () => {
    if (currentRowIndex < listRows.length - 1) {
      setCurrentRowIndex(currentRowIndex + 1);
      setCurrentStep('scan-location');
      setInventoryData({});
      setError(null);
    }
  };

  const handleExit = () => {
    if (confirm('Sei sicuro di voler uscire? Il progresso corrente andrà perso.')) {
      navigate('/lists/execution');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento lista inventario...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-red-600 text-lg mb-2">Errore nel caricamento lista</p>
          <p className="text-gray-600 mb-4">
            {fetchError instanceof Error ? fetchError.message : 'Errore sconosciuto'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Riprova
            </button>
            <button
              onClick={() => navigate('/lists/execution')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Torna alle Liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentRow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-yellow-600" size={48} />
          <p className="text-gray-600 text-lg">Nessuna riga da processare</p>
          <button
            onClick={() => navigate('/lists/execution')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Torna alle Liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExit}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Inventario - Lista #{listId}
              </h1>
              <p className="text-sm text-gray-600">
                Riga {currentRowIndex + 1} di {listRows.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{progress || 0}%</div>
            <div className="text-xs text-gray-600">Completato</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progress || 0}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Current Item Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Articolo</div>
              <div className="font-mono font-bold text-lg text-gray-900">
                {currentRow.itemCode}
              </div>
              <div className="text-sm text-gray-700">{currentRow.itemDescription}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Locazione</div>
              <div className="font-mono font-bold text-lg text-purple-600 flex items-center gap-2">
                <MapPin size={20} />
                {currentRow.sourceLocationCode}
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClipboardList size={18} />
                <span>
                  <strong>Inventario Fisico</strong>: Conta la quantità presente in locazione
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {currentStep === 'scan-location' && (
            <ScanLocationStep
              locationCode={currentRow.sourceLocationCode}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'scan-item' && (
            <ScanItemStep
              itemCode={currentRow.itemCode}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'input-quantity' && (
            <InputQuantityStep onComplete={handleStepComplete} onError={setError} />
          )}

          {currentStep === 'confirm' && (
            <ConfirmStep
              inventoryData={inventoryData}
              currentRow={currentRow}
              onComplete={handleStepComplete}
              onError={setError}
              isExecuting={isExecuting}
            />
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePreviousRow}
            disabled={currentRowIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={18} />
            Riga Precedente
          </button>
          <button
            onClick={handleNextRow}
            disabled={currentRowIndex === listRows.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Riga Successiva
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Step Components
function ScanLocationStep({
  locationCode,
  onComplete,
  onError,
}: {
  locationCode: string;
  onComplete: (data: Partial<InventoryData>) => void;
  onError: (error: string | null) => void;
}) {
  const [scannedValue, setScannedValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedValue.trim() === locationCode) {
      onError(null);
      onComplete({ scannedLocation: scannedValue });
    } else {
      onError(
        `Locazione errata! Scansiona ${locationCode} (hai scansionato ${scannedValue})`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <MapPin className="mx-auto mb-3 text-purple-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scansiona Locazione</h2>
        <p className="text-gray-600">Scansiona il barcode della locazione da inventariare</p>
        <p className="text-lg font-mono font-bold text-purple-600 mt-2">{locationCode}</p>
      </div>

      <input
        type="text"
        value={scannedValue}
        onChange={(e) => setScannedValue(e.target.value)}
        placeholder="Scansiona barcode locazione..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition-colors"
      >
        Conferma Locazione
      </button>
    </form>
  );
}

function ScanItemStep({
  itemCode,
  onComplete,
  onError,
}: {
  itemCode: string;
  onComplete: (data: Partial<InventoryData>) => void;
  onError: (error: string | null) => void;
}) {
  const [scannedValue, setScannedValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedValue.trim() === itemCode) {
      onError(null);
      onComplete({ scannedItem: scannedValue });
    } else {
      onError(
        `Articolo errato! Scansiona ${itemCode} (hai scansionato ${scannedValue})`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Package className="mx-auto mb-3 text-green-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scansiona Articolo</h2>
        <p className="text-gray-600">Scansiona il barcode dell'articolo</p>
        <p className="text-lg font-mono font-bold text-green-600 mt-2">{itemCode}</p>
      </div>

      <input
        type="text"
        value={scannedValue}
        onChange={(e) => setScannedValue(e.target.value)}
        placeholder="Scansiona barcode articolo..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition-colors"
      >
        Conferma Articolo
      </button>
    </form>
  );
}

function InputQuantityStep({
  onComplete,
  onError,
}: {
  onComplete: (data: Partial<InventoryData>) => void;
  onError: (error: string | null) => void;
}) {
  const [quantity, setQuantity] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);

    if (isNaN(qty) || qty < 0) {
      onError('Quantità non valida (deve essere >= 0)');
      return;
    }

    onError(null);
    onComplete({ quantity: qty });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Hash className="mx-auto mb-3 text-blue-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inserisci Quantità Contata</h2>
        <p className="text-gray-600">Conta fisicamente gli articoli e inserisci la quantità</p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Attenzione</strong>: Inserisci la quantità effettivamente presente in
            locazione (inventario fisico)
          </p>
        </div>
      </div>

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        step="1"
        min="0"
        placeholder="Quantità contata..."
        className="w-full px-4 py-4 text-3xl text-center font-bold border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition-colors"
      >
        Conferma Quantità
      </button>
    </form>
  );
}

function ConfirmStep({
  inventoryData,
  currentRow,
  onComplete,
  isExecuting,
}: {
  inventoryData: InventoryData;
  currentRow: any;
  onComplete: (data: Partial<InventoryData>) => void;
  onError: (error: string | null) => void;
  isExecuting: boolean;
}) {
  const handleConfirm = () => {
    onComplete({});
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto mb-3 text-purple-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conferma Inventario</h2>
        <p className="text-gray-600 mb-6">Verifica i dati prima di confermare</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Locazione:</span>
          <span className="font-mono font-semibold">{inventoryData.scannedLocation}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Articolo:</span>
          <span className="font-mono font-semibold">{currentRow.itemCode}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Quantità Contata:</span>
          <span className="font-bold text-purple-600 text-2xl">{inventoryData.quantity}</span>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ La quantità inventariata verrà registrata nel sistema. Eventuali differenze
          rispetto alla giacenza attesa saranno evidenziate.
        </p>
      </div>

      <button
        onClick={handleConfirm}
        disabled={isExecuting}
        className="w-full px-6 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExecuting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Conferma in corso...
          </>
        ) : (
          <>
            <CheckCircle size={24} />
            Conferma Inventario
          </>
        )}
      </button>
    </div>
  );
}

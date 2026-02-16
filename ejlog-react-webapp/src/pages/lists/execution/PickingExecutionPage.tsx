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
} from 'lucide-react';
import { useListRows, usePickItem, useListStatusPolling } from '../../../hooks/useExecution';
import type { ExecutionListRow } from '../../../services/api/executionApi';

// Types
type PickingStep =
  | 'scan-source'
  | 'confirm-item'
  | 'input-quantity'
  | 'input-lot'
  | 'input-serial'
  | 'confirm';

interface PickData {
  scannedLocation?: string;
  confirmedItem?: boolean;
  quantity?: number;
  lot?: string;
  serialNumber?: string;
}

export default function PickingExecutionPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<PickingStep>('scan-source');
  const [pickData, setPickData] = useState<PickData>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch list rows from API
  const { data: listRows = [], isLoading, error: fetchError, refetch } = useListRows(listId!);

  // Use picking mutation
  const pickItemMutation = usePickItem();

  // Poll list status for progress tracking
  const { progress } = useListStatusPolling(parseInt(listId!, 10), {
    enabled: !!listId && !isNaN(parseInt(listId!, 10)),
    interval: 10000, // Poll every 10 seconds
  });

  const currentRow = listRows[currentRowIndex];

  const getNextStep = (current: PickingStep): PickingStep | 'done' => {
    switch (current) {
      case 'scan-source':
        return 'confirm-item';
      case 'confirm-item':
        return 'input-quantity';
      case 'input-quantity':
        if (currentRow?.lotManaged) return 'input-lot';
        if (currentRow?.serialManaged) return 'input-serial';
        return 'confirm';
      case 'input-lot':
        if (currentRow?.serialManaged) return 'input-serial';
        return 'confirm';
      case 'input-serial':
        return 'confirm';
      case 'confirm':
        return 'done';
      default:
        return 'done';
    }
  };

  const handleStepComplete = async (stepData: Partial<PickData>) => {
    const newData = { ...pickData, ...stepData };
    setPickData(newData);

    const nextStep = getNextStep(currentStep);

    if (nextStep === 'done') {
      // Execute pick - chiamata API
      try {
        await pickItemMutation.mutateAsync({
          itemId: currentRow.itemId,
          quantity: newData.quantity || 0,
          lot: newData.lot,
          serialNumber: newData.serialNumber,
          sourceLocationId: currentRow.sourceLocationId,
          userName: 'current-user', // TODO: Get from auth context
        });

        // Ricarica righe lista per ottenere stato aggiornato
        await refetch();

        // Move to next row or finish
        if (currentRowIndex < listRows.length - 1) {
          setCurrentRowIndex(currentRowIndex + 1);
          setCurrentStep('scan-source');
          setPickData({});
          setError(null);
        } else {
          // Lista completata
          alert('Lista completata con successo!');
          navigate('/lists/execution');
        }
      } catch (error) {
        console.error('Error picking item:', error);
        setError('Errore durante il picking. Riprova.');
      }
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handlePreviousRow = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(currentRowIndex - 1);
      setCurrentStep('scan-source');
      setPickData({});
      setError(null);
    }
  };

  const handleNextRow = () => {
    if (currentRowIndex < listRows.length - 1) {
      setCurrentRowIndex(currentRowIndex + 1);
      setCurrentStep('scan-source');
      setPickData({});
      setError(null);
    }
  };

  const handleExit = () => {
    if (
      confirm(
        'Sei sicuro di voler uscire? Il progresso corrente andrà perso.'
      )
    ) {
      navigate('/lists/execution');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento lista picking...</p>
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
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                Picking - Lista #{listId}
              </h1>
              <p className="text-sm text-gray-600">
                Riga {currentRowIndex + 1} di {listRows.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">
              {progress || 0}%
            </div>
            <div className="text-xs text-gray-600">Completato</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                (listRows.filter((r) => r.status === 'COMPLETED').length /
                  listRows.length) *
                100
              }%`,
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
              <div className="text-sm text-gray-700">
                {currentRow.itemDescription}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Locazione Sorgente</div>
              <div className="font-mono font-bold text-lg text-blue-600 flex items-center gap-2">
                <MapPin size={20} />
                {currentRow.sourceLocationCode}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Quantità Richiesta</div>
              <div className="font-bold text-2xl text-red-600">
                {currentRow.quantityRequired}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Caratteristiche</div>
              <div className="flex gap-2">
                {currentRow.lotManaged && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                    LOTTO
                  </span>
                )}
                {currentRow.serialManaged && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    MATRICOLA
                  </span>
                )}
                {!currentRow.lotManaged && !currentRow.serialManaged && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                    STANDARD
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {currentStep === 'scan-source' && (
            <ScanSourceStep
              locationCode={currentRow.sourceLocationCode}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'confirm-item' && (
            <ConfirmItemStep
              itemCode={currentRow.itemCode}
              itemDescription={currentRow.itemDescription}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'input-quantity' && (
            <InputQuantityStep
              quantityRequired={currentRow.quantityRequired}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'input-lot' && (
            <InputLotStep onComplete={handleStepComplete} onError={setError} />
          )}

          {currentStep === 'input-serial' && (
            <InputSerialStep
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'confirm' && (
            <ConfirmStep
              pickData={pickData}
              currentRow={currentRow}
              onComplete={handleStepComplete}
              onError={setError}
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
function ScanSourceStep({
  locationCode,
  onComplete,
  onError,
}: {
  locationCode: string;
  onComplete: (data: Partial<PickData>) => void;
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
        <MapPin className="mx-auto mb-3 text-blue-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Scansiona Locazione
        </h2>
        <p className="text-gray-600">
          Scansiona il barcode della locazione sorgente
        </p>
        <p className="text-lg font-mono font-bold text-blue-600 mt-2">
          {locationCode}
        </p>
      </div>

      <input
        type="text"
        value={scannedValue}
        onChange={(e) => setScannedValue(e.target.value)}
        placeholder="Scansiona barcode locazione..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
      >
        Conferma Locazione
      </button>
    </form>
  );
}

function ConfirmItemStep({
  itemCode,
  itemDescription,
  onComplete,
  onError,
}: {
  itemCode: string;
  itemDescription: string;
  onComplete: (data: Partial<PickData>) => void;
  onError: (error: string | null) => void;
}) {
  const handleConfirm = () => {
    onError(null);
    onComplete({ confirmedItem: true });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="mx-auto mb-3 text-green-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conferma Articolo
        </h2>
        <p className="text-gray-600 mb-6">Verifica che l'articolo sia corretto</p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="font-mono font-bold text-3xl text-gray-900 mb-2">
            {itemCode}
          </div>
          <div className="text-lg text-gray-700">{itemDescription}</div>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full px-6 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
      >
        Articolo Corretto - Continua
      </button>
    </div>
  );
}

function InputQuantityStep({
  quantityRequired,
  onComplete,
  onError,
}: {
  quantityRequired: number;
  onComplete: (data: Partial<PickData>) => void;
  onError: (error: string | null) => void;
}) {
  const [quantity, setQuantity] = useState(quantityRequired.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);

    if (isNaN(qty) || qty <= 0) {
      onError('Quantità non valida');
      return;
    }

    if (qty > quantityRequired) {
      onError(`Quantità superiore al richiesto (max: ${quantityRequired})`);
      return;
    }

    onError(null);
    onComplete({ quantity: qty });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Hash className="mx-auto mb-3 text-purple-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Inserisci Quantità
        </h2>
        <p className="text-gray-600">Quantità richiesta: {quantityRequired}</p>
      </div>

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        step="0.01"
        min="0"
        max={quantityRequired}
        placeholder="Inserisci quantità..."
        className="w-full px-4 py-4 text-3xl text-center font-bold border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
      >
        Conferma Quantità
      </button>
    </form>
  );
}

function InputLotStep({
  onComplete,
  onError,
}: {
  onComplete: (data: Partial<PickData>) => void;
  onError: (error: string | null) => void;
}) {
  const [lot, setLot] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lot.trim()) {
      onError('Lotto obbligatorio');
      return;
    }
    onError(null);
    onComplete({ lot: lot.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Package className="mx-auto mb-3 text-yellow-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inserisci Lotto</h2>
        <p className="text-gray-600">Scansiona o inserisci il numero di lotto</p>
      </div>

      <input
        type="text"
        value={lot}
        onChange={(e) => setLot(e.target.value)}
        placeholder="Numero lotto..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-yellow-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
      >
        Conferma Lotto
      </button>
    </form>
  );
}

function InputSerialStep({
  onComplete,
  onError,
}: {
  onComplete: (data: Partial<PickData>) => void;
  onError: (error: string | null) => void;
}) {
  const [serialNumber, setSerialNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      onError('Matricola obbligatoria');
      return;
    }
    onError(null);
    onComplete({ serialNumber: serialNumber.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Hash className="mx-auto mb-3 text-green-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Inserisci Matricola
        </h2>
        <p className="text-gray-600">Scansiona o inserisci il numero di matricola</p>
      </div>

      <input
        type="text"
        value={serialNumber}
        onChange={(e) => setSerialNumber(e.target.value)}
        placeholder="Numero matricola..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
      >
        Conferma Matricola
      </button>
    </form>
  );
}

function ConfirmStep({
  pickData,
  currentRow,
  onComplete,
}: {
  pickData: PickData;
  currentRow: ListRow;
  onComplete: (data: Partial<PickData>) => void;
  onError: (error: string | null) => void;
}) {
  const handleConfirm = () => {
    onComplete({});
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto mb-3 text-green-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conferma Picking
        </h2>
        <p className="text-gray-600 mb-6">Verifica i dati prima di confermare</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Articolo:</span>
          <span className="font-mono font-semibold">{currentRow.itemCode}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Locazione:</span>
          <span className="font-mono font-semibold">
            {pickData.scannedLocation}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Quantità:</span>
          <span className="font-bold text-red-600 text-xl">
            {pickData.quantity}
          </span>
        </div>
        {pickData.lot && (
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Lotto:</span>
            <span className="font-mono font-semibold">{pickData.lot}</span>
          </div>
        )}
        {pickData.serialNumber && (
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Matricola:</span>
            <span className="font-mono font-semibold">
              {pickData.serialNumber}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle size={24} />
        Conferma Picking
      </button>
    </div>
  );
}

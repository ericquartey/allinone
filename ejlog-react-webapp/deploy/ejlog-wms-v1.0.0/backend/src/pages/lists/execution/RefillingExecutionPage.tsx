import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Warehouse,
} from 'lucide-react';

// Types
type RefillingStep =
  | 'scan-udc'
  | 'scan-destination'
  | 'confirm-deposit';

interface ListRow {
  id: number;
  itemId: number;
  itemCode: string;
  itemDescription: string;
  quantityRequired: number;
  quantityDeposited: number;
  sourceLocationCode: string;
  destinationLocationCode: string;
  destinationLocationId: number;
  udcCode?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface RefillingData {
  scannedUDC?: string;
  scannedDestination?: string;
}

export default function RefillingExecutionPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const [listRows, setListRows] = useState<ListRow[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<RefillingStep>('scan-udc');
  const [refillingData, setRefillingData] = useState<RefillingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - sostituire con chiamata API reale
  useEffect(() => {
    const mockRows: ListRow[] = [
      {
        id: 1,
        itemId: 201,
        itemCode: 'PROD-REF-001',
        itemDescription: 'Prodotto da Rifornire 1',
        quantityRequired: 50,
        quantityDeposited: 0,
        sourceLocationCode: 'BUFFER-01',
        destinationLocationCode: 'A-01-01',
        destinationLocationId: 1,
        udcCode: 'UDC-12345',
        status: 'PENDING',
      },
      {
        id: 2,
        itemId: 202,
        itemCode: 'PROD-REF-002',
        itemDescription: 'Prodotto da Rifornire 2',
        quantityRequired: 30,
        quantityDeposited: 0,
        sourceLocationCode: 'BUFFER-02',
        destinationLocationCode: 'A-02-03',
        destinationLocationId: 2,
        udcCode: 'UDC-67890',
        status: 'PENDING',
      },
      {
        id: 3,
        itemId: 203,
        itemCode: 'PROD-REF-003',
        itemDescription: 'Prodotto da Rifornire 3',
        quantityRequired: 100,
        quantityDeposited: 0,
        sourceLocationCode: 'BUFFER-01',
        destinationLocationCode: 'B-01-05',
        destinationLocationId: 3,
        udcCode: 'UDC-11111',
        status: 'PENDING',
      },
    ];

    setTimeout(() => {
      setListRows(mockRows);
      setIsLoading(false);
    }, 500);
  }, [listId]);

  const currentRow = listRows[currentRowIndex];

  const getNextStep = (current: RefillingStep): RefillingStep | 'done' => {
    switch (current) {
      case 'scan-udc':
        return 'scan-destination';
      case 'scan-destination':
        return 'confirm-deposit';
      case 'confirm-deposit':
        return 'done';
      default:
        return 'done';
    }
  };

  const handleStepComplete = (stepData: Partial<RefillingData>) => {
    const newData = { ...refillingData, ...stepData };
    setRefillingData(newData);

    const nextStep = getNextStep(currentStep);

    if (nextStep === 'done') {
      // Execute refilling - chiamata API
      console.log('Esegui refilling:', {
        listId,
        rowId: currentRow.id,
        itemId: currentRow.itemId,
        ...newData,
      });

      // Update row status
      const updatedRows = [...listRows];
      updatedRows[currentRowIndex] = {
        ...updatedRows[currentRowIndex],
        status: 'COMPLETED',
        quantityDeposited: currentRow.quantityRequired,
      };
      setListRows(updatedRows);

      // Move to next row or finish
      if (currentRowIndex < listRows.length - 1) {
        setCurrentRowIndex(currentRowIndex + 1);
        setCurrentStep('scan-udc');
        setRefillingData({});
      } else {
        // Lista completata
        alert('Lista refilling completata con successo!');
        navigate('/lists/execution');
      }
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handlePreviousRow = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(currentRowIndex - 1);
      setCurrentStep('scan-udc');
      setRefillingData({});
      setError(null);
    }
  };

  const handleNextRow = () => {
    if (currentRowIndex < listRows.length - 1) {
      setCurrentRowIndex(currentRowIndex + 1);
      setCurrentStep('scan-udc');
      setRefillingData({});
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
          <p className="text-gray-600">Caricamento lista refilling...</p>
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
                Refilling - Lista #{listId}
              </h1>
              <p className="text-sm text-gray-600">
                Riga {currentRowIndex + 1} di {listRows.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (listRows.filter((r) => r.status === 'COMPLETED').length /
                  listRows.length) *
                  100
              )}
              %
            </div>
            <div className="text-xs text-gray-600">Completato</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
              <div className="text-sm text-gray-600 mb-1">UDC</div>
              <div className="font-mono font-bold text-lg text-purple-600 flex items-center gap-2">
                <Package size={20} />
                {currentRow.udcCode || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Da Locazione</div>
              <div className="font-mono font-semibold text-blue-600 flex items-center gap-2">
                <MapPin size={18} />
                {currentRow.sourceLocationCode}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">
                A Locazione (Destinazione)
              </div>
              <div className="font-mono font-bold text-lg text-green-600 flex items-center gap-2">
                <Warehouse size={20} />
                {currentRow.destinationLocationCode}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-600 mb-1">
                Quantità da Depositare
              </div>
              <div className="font-bold text-3xl text-green-600">
                {currentRow.quantityRequired}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {currentStep === 'scan-udc' && (
            <ScanUDCStep
              udcCode={currentRow.udcCode}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'scan-destination' && (
            <ScanDestinationStep
              destinationCode={currentRow.destinationLocationCode}
              onComplete={handleStepComplete}
              onError={setError}
            />
          )}

          {currentStep === 'confirm-deposit' && (
            <ConfirmDepositStep
              refillingData={refillingData}
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
function ScanUDCStep({
  udcCode,
  onComplete,
  onError,
}: {
  udcCode?: string;
  onComplete: (data: Partial<RefillingData>) => void;
  onError: (error: string | null) => void;
}) {
  const [scannedValue, setScannedValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!udcCode) {
      // Se non c'è UDC previsto, accetta qualsiasi valore
      onError(null);
      onComplete({ scannedUDC: scannedValue });
    } else if (scannedValue.trim() === udcCode) {
      onError(null);
      onComplete({ scannedUDC: scannedValue });
    } else {
      onError(
        `UDC errato! Scansiona ${udcCode} (hai scansionato ${scannedValue})`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Package className="mx-auto mb-3 text-purple-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Scansiona UDC
        </h2>
        <p className="text-gray-600">
          Scansiona il barcode dell'Unità di Carico
        </p>
        {udcCode && (
          <p className="text-lg font-mono font-bold text-purple-600 mt-2">
            {udcCode}
          </p>
        )}
      </div>

      <input
        type="text"
        value={scannedValue}
        onChange={(e) => setScannedValue(e.target.value)}
        placeholder="Scansiona barcode UDC..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
      >
        Conferma UDC
      </button>
    </form>
  );
}

function ScanDestinationStep({
  destinationCode,
  onComplete,
  onError,
}: {
  destinationCode: string;
  onComplete: (data: Partial<RefillingData>) => void;
  onError: (error: string | null) => void;
}) {
  const [scannedValue, setScannedValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedValue.trim() === destinationCode) {
      onError(null);
      onComplete({ scannedDestination: scannedValue });
    } else {
      onError(
        `Locazione destinazione errata! Scansiona ${destinationCode} (hai scansionato ${scannedValue})`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Warehouse className="mx-auto mb-3 text-green-600" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Scansiona Locazione Destinazione
        </h2>
        <p className="text-gray-600">
          Scansiona il barcode della locazione dove depositare il materiale
        </p>
        <p className="text-lg font-mono font-bold text-green-600 mt-2">
          {destinationCode}
        </p>
      </div>

      <input
        type="text"
        value={scannedValue}
        onChange={(e) => setScannedValue(e.target.value)}
        placeholder="Scansiona barcode destinazione..."
        className="w-full px-4 py-4 text-2xl text-center font-mono border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        autoFocus
      />

      <button
        type="submit"
        className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
      >
        Conferma Destinazione
      </button>
    </form>
  );
}

function ConfirmDepositStep({
  refillingData,
  currentRow,
  onComplete,
}: {
  refillingData: RefillingData;
  currentRow: ListRow;
  onComplete: (data: Partial<RefillingData>) => void;
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
          Conferma Deposito
        </h2>
        <p className="text-gray-600 mb-6">Verifica i dati prima di confermare</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Articolo:</span>
          <span className="font-mono font-semibold">{currentRow.itemCode}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">UDC:</span>
          <span className="font-mono font-semibold">
            {refillingData.scannedUDC}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Da Locazione:</span>
          <span className="font-mono font-semibold">
            {currentRow.sourceLocationCode}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">A Locazione:</span>
          <span className="font-mono font-semibold text-green-600">
            {refillingData.scannedDestination}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Quantità:</span>
          <span className="font-bold text-green-600 text-xl">
            {currentRow.quantityRequired}
          </span>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle size={24} />
        Conferma Deposito
      </button>
    </div>
  );
}

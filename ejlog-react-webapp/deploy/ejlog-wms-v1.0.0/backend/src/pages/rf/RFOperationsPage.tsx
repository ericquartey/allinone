import { useState } from 'react';
import {
  QrCodeIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  InboxArrowDownIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/common';
import BarcodeInput from '../../components/common/BarcodeInput';
import rfService from '../../services/rfOperationsService';

// Enable offline mode by default for testing
// Set to false to use backend API
rfService.setOfflineMode(true);

const RF_OPERATIONS = [
  {
    id: 'picking',
    title: 'Picking',
    description: 'Preleva articoli dalle locazioni',
    icon: QrCodeIcon,
    color: 'blue',
    workflow: 'picking'
  },
  {
    id: 'refilling',
    title: 'Refilling',
    description: 'Rifornisci le locazioni di picking',
    icon: ArrowPathIcon,
    color: 'green',
    workflow: 'refilling'
  },
  {
    id: 'inventario',
    title: 'Inventario',
    description: 'Conta fisicamente le giacenze',
    icon: ClipboardDocumentListIcon,
    color: 'purple',
    workflow: 'inventory'
  },
  {
    id: 'ricezione',
    title: 'Ricezione',
    description: 'Ricevi merce in arrivo',
    icon: InboxArrowDownIcon,
    color: 'indigo',
    workflow: 'receiving'
  },
  {
    id: 'stoccaggio',
    title: 'Stoccaggio',
    description: 'Posiziona merce nelle locazioni',
    icon: CubeIcon,
    color: 'yellow',
    workflow: 'putaway'
  },
  {
    id: 'trasferimento',
    title: 'Trasferimento',
    description: 'Sposta merce tra locazioni',
    icon: ArrowsRightLeftIcon,
    color: 'red',
    workflow: 'transfer'
  }
];

function RFOperationsPage() {
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(1);
  const [workflowData, setWorkflowData] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleOperationClick = (operation) => {
    setActiveWorkflow(operation);
    setWorkflowStep(1);
    setWorkflowData({});
    setError(null);
    setSuccess(false);
  };

  const handleListScan = async (barcode) => {
    try {
      setError(null);
      // Call service to get list by code
      const list = await rfService.getListByCode(barcode);

      // Transform backend API response to match workflow data format
      const listData = {
        code: list.code,
        type: list.itemListType?.nickname || 'UNKNOWN',
        status: 'IN_PROGRESS',
        items: 0, // Will be populated when we fetch rows
        id: list.id
      };

      setWorkflowData({ ...workflowData, list: listData, listId: list.id });
      setWorkflowStep(2);
    } catch (err) {
      setError(err.message || 'Lista non trovata');
    }
  };

  const handleItemScan = async (barcode) => {
    try {
      setError(null);
      // Call service to get item by code
      const listId = workflowData.listId || workflowData.list?.id;
      if (!listId) {
        throw new Error('ID lista non disponibile');
      }

      const item = await rfService.getItemByCode(listId, barcode);

      // Transform backend API response to match workflow data format
      const itemData = {
        code: item.code,
        description: item.itemDescription || 'N/A',
        um: 'PZ', // Default unit of measure
        expectedQty: item.requestedQuantity
      };

      setWorkflowData({ ...workflowData, item: itemData, itemId: item.id });
      setWorkflowStep(3);
    } catch (err) {
      setError(err.message || 'Articolo non trovato');
    }
  };

  const handleLocationScan = (barcode) => {
    setWorkflowData({ ...workflowData, location: barcode });
    setWorkflowStep(2);
    setError(null);
  };

  const handleQuantityConfirm = (qty) => {
    setWorkflowData({ ...workflowData, quantity: qty });
    setSuccess(true);
    setError(null);
    setTimeout(() => {
      setActiveWorkflow(null);
      setWorkflowStep(1);
      setWorkflowData({});
      setSuccess(false);
    }, 2000);
  };

  const handleCancel = () => {
    setActiveWorkflow(null);
    setWorkflowStep(1);
    setWorkflowData({});
    setError(null);
    setSuccess(false);
  };

  if (activeWorkflow) {
    return (
      <RFWorkflow
        operation={activeWorkflow}
        step={workflowStep}
        data={workflowData}
        error={error}
        success={success}
        onListScan={handleListScan}
        onItemScan={handleItemScan}
        onLocationScan={handleLocationScan}
        onQuantityConfirm={handleQuantityConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Operazioni RF</h1>
        <p className="text-xl text-gray-600">Seleziona un'operazione da eseguire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RF_OPERATIONS.map((operation) => {
          const Icon = operation.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
            green: 'bg-green-100 text-green-600 hover:bg-green-200',
            purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
            indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
            yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
            red: 'bg-red-100 text-red-600 hover:bg-red-200',
          };

          return (
            <button
              key={operation.id}
              data-testid={`rf-card-${operation.id}`}
              onClick={() => handleOperationClick(operation)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            >
              <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
                <div className="flex flex-col items-center text-center space-y-4 p-6">
                  <div className={`p-4 rounded-full ${colorClasses[operation.color]}`}>
                    <Icon className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {operation.title}
                    </h3>
                    <p className="text-lg text-gray-600">{operation.description}</p>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RFWorkflow({ operation, step, data, error, success, onListScan, onItemScan, onLocationScan, onQuantityConfirm, onCancel }) {
  const [quantity, setQuantity] = useState('');

  const handleBarcodeSubmit = (barcode) => {
    if (step === 1 && (operation.workflow === 'picking' || operation.workflow === 'refilling')) {
      onListScan(barcode);
    } else if (step === 1 && operation.workflow === 'inventory') {
      onLocationScan(barcode);
    } else if (step === 2) {
      onItemScan(barcode);
    }
  };

  const handleConfirm = () => {
    if (quantity) {
      onQuantityConfirm(parseInt(quantity));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{operation.title}</h1>
          <p className="text-xl text-gray-600 mt-2">
            Step {step} / 3
            {step === 1 && <span className="ml-2">- Passo 1</span>}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-lg font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Annulla
        </button>
      </div>

      {success && (
        <div className="mb-6 p-6 bg-green-100 border border-green-400 rounded-lg">
          <div className="flex items-center gap-4">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-2xl font-bold text-green-900">Picking completato</h3>
              <p className="text-lg text-green-700">Operazione eseguita con successo</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-6 bg-red-100 border border-red-400 rounded-lg">
          <div className="flex items-center gap-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-2xl font-bold text-red-900">Errore</h3>
              <p className="text-lg text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {operation.workflow === 'inventory' ? 'Scansiona Locazione' : 'Scansiona Lista'}
            </h2>
            <BarcodeInput
              label={operation.workflow === 'inventory' ? 'Locazione' : 'Barcode Lista'}
              placeholder="Scansiona o inserisci barcode..."
              onScan={handleBarcodeSubmit}
              autoFocus
              className="text-xl py-4"
            />
          </div>
        )}

        {step === 2 && data.list && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-900">Lista: {data.list.code}</p>
              <p className="text-lg text-gray-600">Tipo: {data.list.type}</p>
              <p className="text-lg text-gray-600">Articoli: {data.list.items}</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Scansiona Articolo</h2>
            <BarcodeInput
              label="Barcode Articolo"
              placeholder="Scansiona articolo..."
              onScan={handleBarcodeSubmit}
              autoFocus
              className="text-xl py-4"
            />
          </div>
        )}

        {step === 2 && data.location && (
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-900">Locazione: {data.location}</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Scansiona Articolo</h2>
            <BarcodeInput
              label="Barcode Articolo"
              placeholder="Scansiona articolo..."
              onScan={handleBarcodeSubmit}
              autoFocus
              className="text-xl py-4"
            />
          </div>
        )}

        {step === 3 && data.item && (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-900">Articolo: {data.item.code}</p>
              <p className="text-lg text-gray-600">Descrizione: {data.item.description}</p>
              <p className="text-lg text-gray-600">Q.tà attesa: {data.item.expectedQty} {data.item.um}</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Conferma Quantità</h2>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Inserisci quantità"
              className="w-full px-6 py-4 text-2xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleConfirm}
              disabled={!quantity}
              className="w-full px-6 py-4 text-2xl font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Conferma
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default RFOperationsPage;

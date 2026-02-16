import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import {
  useGetMissionOperationsQuery,
  useExecuteMissionOperationMutation,
  useSuspendMissionOperationMutation,
  useCompleteMissionOperationMutation,
} from '../../services/api/masAdapterApi';
import { useMasHub } from '../../hooks/useMasHub';
import { MissionOperation, MissionOperationStatus, MissionOperationType } from '../../types/models';

interface ColumnFilter {
  type: string[];
  status: string[];
  itemCode: string;
  operationId: string;
}

function OperationsPageEnhanced(): JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filtri per colonna (Excel-style)
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    type: [],
    status: [],
    itemCode: '',
    operationId: '',
  });
  const [showFilterDropdowns, setShowFilterDropdowns] = useState<{[key: string]: boolean}>({});

  // Fetch operations from API
  const {
    data: operations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMissionOperationsQuery({});

  const [executeOperation] = useExecuteMissionOperationMutation();
  const [suspendOperation] = useSuspendMissionOperationMutation();
  const [completeOperation] = useCompleteMissionOperationMutation();

  const handleHubUpdate = useCallback(() => {
    // Refresh mission operations when MAS hub broadcasts updates.
    refetch();
  }, [refetch]);

  useMasHub(handleHubUpdate);

  // Apply column filters
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      // Filtro Tipo
      if (columnFilters.type.length > 0 && !columnFilters.type.includes(String(op.type))) {
        return false;
      }
      // Filtro Stato
      if (columnFilters.status.length > 0 && !columnFilters.status.includes(String(op.status))) {
        return false;
      }
      // Filtro Codice Articolo
      if (columnFilters.itemCode && !op.itemCode?.toLowerCase().includes(columnFilters.itemCode.toLowerCase())) {
        return false;
      }
      // Filtro ID Operazione
      if (columnFilters.operationId && !String(op.id).includes(columnFilters.operationId)) {
        return false;
      }
      return true;
    });
  }, [operations, columnFilters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOperations(new Set(filteredOperations.map(op => op.id)));
    } else {
      setSelectedOperations(new Set());
    }
  };

  const handleSelectRow = (opId: number, checked: boolean) => {
    const newSelected = new Set(selectedOperations);
    if (checked) {
      newSelected.add(opId);
    } else {
      newSelected.delete(opId);
    }
    setSelectedOperations(newSelected);
  };

  const toggleRowExpansion = (opId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(opId)) {
      newExpanded.delete(opId);
    } else {
      newExpanded.add(opId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleColumnFilter = (column: string) => {
    setShowFilterDropdowns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const updateColumnFilter = (column: keyof ColumnFilter, value: any) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value,
    }));
  };

  const toggleColumnFilterValue = (column: 'type' | 'status', value: string) => {
    setColumnFilters(prev => {
      const currentValues = prev[column];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [column]: newValues,
      };
    });
  };

  const handleExecute = async (operation: MissionOperation) => {
    try {
      await executeOperation({ id: operation.id }).unwrap();
      toast.success(`Operazione ${operation.id} avviata`);
    } catch (err: any) {
      toast.error(`Errore avvio operazione ${operation.id}`);
    }
  };

  const handlePause = async (operation: MissionOperation) => {
    try {
      await suspendOperation({ id: operation.id }).unwrap();
      toast.success(`Operazione ${operation.id} sospesa`);
    } catch (err: any) {
      toast.error(`Errore sospensione operazione ${operation.id}`);
    }
  };

  const handleComplete = async (operation: MissionOperation) => {
    try {
      await completeOperation({
        id: operation.id,
        payload: {
          quantity: operation.quantity,
          wastedQuantity: 0,
          ignoreRemainingQuantity: true,
        },
      }).unwrap();
      toast.success(`Operazione ${operation.id} completata`);
    } catch (err: any) {
      toast.error(`Errore completamento operazione ${operation.id}`);
    }
  };

  const handleViewSelectedDetails = () => {
    if (selectedOperations.size === 0) {
      toast.error('Seleziona almeno un\'operazione');
      return;
    }
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: MissionOperationStatus) => {
    const statusMap: {[key: number]: {label: string, variant: any}} = {
      [MissionOperationStatus.COMPLETATA]: { label: 'Completata', variant: 'success' },
      [MissionOperationStatus.IN_ESECUZIONE]: { label: 'In Esecuzione', variant: 'warning' },
      [MissionOperationStatus.IN_ERRORE]: { label: 'Errore', variant: 'error' },
      [MissionOperationStatus.SOSPESA]: { label: 'Sospesa', variant: 'info' },
      [MissionOperationStatus.DA_ESEGUIRE]: { label: 'Da Eseguire', variant: 'default' },
    };

    const statusInfo = statusMap[status] || { label: 'Sconosciuto', variant: 'default' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: MissionOperationType) => {
    const typeMap: {[key: number]: {label: string, color: string}} = {
      [MissionOperationType.PRELIEVO]: { label: 'Prelievo', color: 'bg-blue-100 text-blue-800' },
      [MissionOperationType.VERSAMENTO]: { label: 'Versamento', color: 'bg-green-100 text-green-800' },
      [MissionOperationType.INVENTARIO]: { label: 'Inventario', color: 'bg-purple-100 text-purple-800' },
      [MissionOperationType.TRASFERIMENTO]: { label: 'Trasferimento', color: 'bg-orange-100 text-orange-800' },
      [MissionOperationType.PICKING]: { label: 'Picking', color: 'bg-indigo-100 text-indigo-800' },
    };

    const typeInfo = typeMap[type] || { label: 'Altro', color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  const renderFilterDropdown = (column: 'type' | 'status', options: {value: string, label: string}[]) => {
    if (!showFilterDropdowns[column]) return null;

    return (
      <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 min-w-[150px]">
        {options.map(option => (
          <label key={option.value} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer rounded">
            <input
              type="checkbox"
              checked={columnFilters[column].includes(option.value)}
              onChange={() => toggleColumnFilterValue(column, option.value)}
              className="mr-2"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
        <div className="border-t mt-2 pt-2">
          <button
            onClick={() => updateColumnFilter(column, [])}
            className="text-xs text-blue-600 hover:text-blue-800 w-full text-left px-2"
          >
            Cancella filtro
          </button>
        </div>
      </div>
    );
  };

  // Componente per visualizzare i dettagli di un'operazione
  const OperationDetails = ({ operationId }: { operationId: number }) => {
    const operation = operations.find(op => op.id === operationId);

    if (!operation) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Dettagli operazione non disponibili</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID Operazione</p>
            <p className="text-sm font-medium text-gray-900">{operation.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Tipo</p>
            <p className="text-sm">{getTypeBadge(operation.type)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Articolo</p>
            <p className="text-sm font-medium text-ferretto-red">{operation.itemCode}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Quantità</p>
            <p className="text-sm font-medium text-gray-900">{operation.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Ubicazione</p>
            <p className="text-sm text-gray-700">{operation.location || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Stato</p>
            <p className="text-sm">{getStatusBadge(operation.status)}</p>
          </div>
          {operation.notes && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase">Note</p>
              <p className="text-sm text-gray-700 italic">{operation.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente per visualizzare i dettagli di più operazioni aggregate
  const MultipleOperationsDetails = () => {
    const selectedOps = Array.from(selectedOperations);
    const selectedOperationsData = operations.filter(op => selectedOps.includes(op.id));

    if (selectedOperationsData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Nessuna operazione selezionata</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            Visualizzazione di {selectedOperationsData.length} operazioni
          </p>
          <p className="text-xs text-blue-700">
            IDs: {selectedOps.join(', ')}
          </p>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Articolo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Quantità</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Ubicazione</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Stato</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {selectedOperationsData.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-bold text-ferretto-red">{op.id}</td>
                  <td className="px-4 py-2 text-sm">{getTypeBadge(op.type)}</td>
                  <td className="px-4 py-2 text-sm font-medium text-blue-700">{op.itemCode}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 font-medium">{op.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{op.location || '-'}</td>
                  <td className="px-4 py-2 text-sm">{getStatusBadge(op.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-600">
            Totale operazioni visualizzate: {selectedOperationsData.length}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento operazioni dal server..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento delle operazioni
        </div>
        <div className="text-gray-600">
          {error?.toString() || 'Errore sconosciuto'}
        </div>
        <Button onClick={() => window.location.reload()}>
          Ricarica la pagina
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestione Operazioni Liste
          </h1>
          <p className="text-gray-600 mt-1">
            {operations.length} operazioni totali • {selectedOperations.size} selezionate • {filteredOperations.length} visualizzate
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowTemplatesModal(true)}
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Modelli Operazioni
          </Button>
          <Button
            variant="secondary"
            onClick={handleViewSelectedDetails}
            disabled={selectedOperations.size === 0}
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
            Visualizza Selezionate ({selectedOperations.size})
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuova Operazione
          </Button>
        </div>
      </div>

      {/* Operations Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Checkbox colonna */}
                <th className="px-3 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedOperations.size === filteredOperations.length && filteredOperations.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-ferretto-red focus:ring-ferretto-red"
                  />
                </th>
                {/* Expand colonna */}
                <th className="px-3 py-3 text-left w-12"></th>
                {/* ID Operazione */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>ID</span>
                    <button
                      onClick={() => toggleColumnFilter('operationId')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {showFilterDropdowns.operationId && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
                      <input
                        type="text"
                        value={columnFilters.operationId}
                        onChange={(e) => updateColumnFilter('operationId', e.target.value)}
                        placeholder="Filtra..."
                        className="px-2 py-1 text-sm border border-gray-300 rounded w-full"
                      />
                    </div>
                  )}
                </th>
                {/* Tipo */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2 relative">
                    <span>Tipo</span>
                    <button
                      onClick={() => toggleColumnFilter('type')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                    {renderFilterDropdown('type', [
                      { value: String(MissionOperationType.PRELIEVO), label: 'Prelievo' },
                      { value: String(MissionOperationType.VERSAMENTO), label: 'Versamento' },
                      { value: String(MissionOperationType.INVENTARIO), label: 'Inventario' },
                      { value: String(MissionOperationType.TRASFERIMENTO), label: 'Trasferimento' },
                      { value: String(MissionOperationType.PICKING), label: 'Picking' },
                    ])}
                  </div>
                </th>
                {/* Articolo */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2 relative">
                    <span>Articolo</span>
                    <button
                      onClick={() => toggleColumnFilter('itemCode')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                    {showFilterDropdowns.itemCode && (
                      <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
                        <input
                          type="text"
                          value={columnFilters.itemCode}
                          onChange={(e) => updateColumnFilter('itemCode', e.target.value)}
                          placeholder="Filtra..."
                          className="px-2 py-1 text-sm border border-gray-300 rounded w-full"
                        />
                      </div>
                    )}
                  </div>
                </th>
                {/* Quantità */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantità
                </th>
                {/* Ubicazione */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicazione
                </th>
                {/* Stato */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2 relative">
                    <span>Stato</span>
                    <button
                      onClick={() => toggleColumnFilter('status')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                    {renderFilterDropdown('status', [
                      { value: String(MissionOperationStatus.DA_ESEGUIRE), label: 'Da Eseguire' },
                      { value: String(MissionOperationStatus.IN_ESECUZIONE), label: 'In Esecuzione' },
                      { value: String(MissionOperationStatus.COMPLETATA), label: 'Completata' },
                      { value: String(MissionOperationStatus.SOSPESA), label: 'Sospesa' },
                      { value: String(MissionOperationStatus.IN_ERRORE), label: 'Errore' },
                    ])}
                  </div>
                </th>
                {/* Azioni */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOperations.map((operation: MissionOperation) => (
                <>
                  {/* Main Row */}
                  <tr key={operation.id} className="hover:bg-gray-50">
                    {/* Checkbox */}
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOperations.has(operation.id)}
                        onChange={(e) => handleSelectRow(operation.id, e.target.checked)}
                        className="rounded border-gray-300 text-ferretto-red focus:ring-ferretto-red"
                      />
                    </td>
                    {/* Expand Icon */}
                    <td className="px-3 py-4">
                      <button
                        onClick={() => toggleRowExpansion(operation.id)}
                        className="text-gray-500 hover:text-gray-700 transition-transform"
                      >
                        {expandedRows.has(operation.id) ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-ferretto-red">{operation.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(operation.type)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{operation.itemCode || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{operation.quantity || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{operation.location || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(operation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {operation.status === MissionOperationStatus.DA_ESEGUIRE && (
                          <button
                            onClick={() => handleExecute(operation)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                            title="Esegui Operazione"
                          >
                            <PlayIcon className="w-3 h-3 mr-1" />
                            Esegui
                          </button>
                        )}
                        {operation.status === MissionOperationStatus.IN_ESECUZIONE && (
                          <>
                            <button
                              onClick={() => handlePause(operation)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                              title="Sospendi Operazione"
                            >
                              <PauseIcon className="w-3 h-3 mr-1" />
                              Sospendi
                            </button>
                            <button
                              onClick={() => handleComplete(operation)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              title="Completa Operazione"
                            >
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Completa
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toast.info(`Dettagli operazione ${operation.id}`)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          title="Dettagli"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row */}
                  {expandedRows.has(operation.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="pl-12">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Dettagli Operazione {operation.id}
                          </h4>
                          <div className="bg-white rounded border border-gray-200">
                            <OperationDetails operationId={operation.id} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modelli Operazioni Modal */}
      <Modal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        title="Modelli Operazioni"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Seleziona un modello per creare una nuova operazione basata su configurazioni predefinite.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 1, name: 'Prelievo Standard', type: 'Prelievo', description: 'Modello per prelievi standard da magazzino' },
              { id: 2, name: 'Versamento Rapido', type: 'Versamento', description: 'Modello per versamenti rapidi' },
              { id: 3, name: 'Picking Express', type: 'Picking', description: 'Modello per picking veloce' },
              { id: 4, name: 'Inventario Ciclico', type: 'Inventario', description: 'Modello per inventari ciclici' },
            ].map(template => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-ferretto-red hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  toast.success(`Modello "${template.name}" selezionato`);
                  setShowTemplatesModal(false);
                  setShowCreateModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {template.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Visualizza Operazioni Selezionate Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Dettagli di ${selectedOperations.size} operazioni selezionate`}
        size="xl"
      >
        <MultipleOperationsDetails />
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuova Operazione"
        footer={
          <Modal.Footer
            onCancel={() => setShowCreateModal(false)}
            onConfirm={() => {
              toast.success('Creazione operazione in fase di implementazione');
              setShowCreateModal(false);
            }}
            confirmText="Crea"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Operazione
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent">
              <option value={MissionOperationType.PRELIEVO}>Prelievo</option>
              <option value={MissionOperationType.VERSAMENTO}>Versamento</option>
              <option value={MissionOperationType.INVENTARIO}>Inventario</option>
              <option value={MissionOperationType.TRASFERIMENTO}>Trasferimento</option>
              <option value={MissionOperationType.PICKING}>Picking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Articolo
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              placeholder="Inserisci codice articolo..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantità
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              placeholder="Inserisci quantità..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OperationsPageEnhanced;

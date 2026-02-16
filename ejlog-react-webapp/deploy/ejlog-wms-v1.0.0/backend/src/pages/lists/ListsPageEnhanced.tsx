import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  DocumentTextIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { useLists } from '../../hooks/useLists';
import { useListOperations } from '../../hooks/useListOperations';
import { useListRows, useMultipleListsRows, type ListRow } from '../../hooks/useListRows';

interface ColumnFilter {
  tipo: string[];
  stato: string[];
  descrizione: string;
  numeroLista: string;
}

function ListsPageEnhanced(): JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showRowsModal, setShowRowsModal] = useState(false);
  const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Filtri per colonna (Excel-style)
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    tipo: [],
    stato: [],
    descrizione: '',
    numeroLista: '',
  });
  const [showFilterDropdowns, setShowFilterDropdowns] = useState<{[key: string]: boolean}>({});

  // Fetch lists from real API
  const { data, isLoading, isError, error, refetch } = useLists({
    skip: page * pageSize,
    take: pageSize,
    orderBy: 'numeroLista',
    listType: filterType || null,
    status: filterStatus || null,
  });

  // List operations hook
  const { setListWaiting, terminateList, loading: operationLoading } = useListOperations();

  // Extract lists from response
  const lists = data?.lists || [];
  const totalCount = data?.totalCount || 0;

  // Apply column filters
  const filteredLists = useMemo(() => {
    return lists.filter(list => {
      // Filtro Tipo
      if (columnFilters.tipo.length > 0 && !columnFilters.tipo.includes(String(list.tipo))) {
        return false;
      }
      // Filtro Stato
      if (columnFilters.stato.length > 0 && !columnFilters.stato.includes(String(list.stato))) {
        return false;
      }
      // Filtro Descrizione
      if (columnFilters.descrizione && !list.descrizione?.toLowerCase().includes(columnFilters.descrizione.toLowerCase())) {
        return false;
      }
      // Filtro Numero Lista
      if (columnFilters.numeroLista && !String(list.numeroLista).includes(columnFilters.numeroLista)) {
        return false;
      }
      return true;
    });
  }, [lists, columnFilters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLists(new Set(filteredLists.map(l => l.numeroLista)));
    } else {
      setSelectedLists(new Set());
    }
  };

  const handleSelectRow = (listId: number, checked: boolean) => {
    const newSelected = new Set(selectedLists);
    if (checked) {
      newSelected.add(listId);
    } else {
      newSelected.delete(listId);
    }
    setSelectedLists(newSelected);
  };

  const toggleRowExpansion = (listId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(listId)) {
      newExpanded.delete(listId);
    } else {
      newExpanded.add(listId);
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

  const toggleColumnFilterValue = (column: 'tipo' | 'stato', value: string) => {
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

  const handleExecute = async (list: any) => {
    const success = await setListWaiting(parseInt(list.numeroLista));
    if (success) {
      await refetch();
    }
  };

  const handleComplete = async (list: any) => {
    const success = await terminateList(parseInt(list.numeroLista));
    if (success) {
      toast.success(`Lista ${list.numeroLista} completata`);
      await refetch();
    }
  };

  const handleViewSelectedRows = () => {
    if (selectedLists.size === 0) {
      toast.error('Seleziona almeno una lista');
      return;
    }
    setShowRowsModal(true);
  };

  const getStatusBadge = (status: number) => {
    const statusMap: {[key: number]: {label: string, variant: any}} = {
      0: { label: 'Creata', variant: 'info' },
      1: { label: 'In Esecuzione', variant: 'warning' },
      2: { label: 'Completata', variant: 'success' },
      3: { label: 'Annullata', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: 'Sconosciuto', variant: 'default' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeBadge = (tipo: number) => {
    const typeMap: {[key: number]: {label: string, color: string}} = {
      1: { label: 'Prelievo', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Versamento', color: 'bg-green-100 text-green-800' },
      3: { label: 'Inventario', color: 'bg-purple-100 text-purple-800' },
      4: { label: 'Trasferimento', color: 'bg-orange-100 text-orange-800' },
    };

    const typeInfo = typeMap[tipo] || { label: 'Altro', color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  const renderFilterDropdown = (column: 'tipo' | 'stato', options: {value: string, label: string}[]) => {
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

  // Componente per visualizzare le righe di una lista
  const ListRowsTable = ({ listId }: { listId: number }) => {
    const { data, isLoading, isError, error } = useListRows({
      listId,
      enabled: expandedRows.has(listId),
    });

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loading size="sm" text="Caricamento righe..." />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-8 text-red-600">
          <p className="text-sm">Errore nel caricamento delle righe</p>
          <p className="text-xs text-gray-500 mt-1">{error?.message}</p>
        </div>
      );
    }

    const rows = data?.items || [];

    if (rows.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Nessuna riga presente in questa lista</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">N° Riga</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Codice Articolo</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Descrizione</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Quantità</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">UM</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Ubicazione</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Lotto</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Note</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.map((row: ListRow) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">{row.numeroRiga}</td>
                <td className="px-4 py-2 text-sm font-medium text-ferretto-red">{row.codiceArticolo}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{row.descrizioneArticolo}</td>
                <td className="px-4 py-2 text-sm text-gray-900 font-medium">{row.quantita}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{row.um}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{row.ubicazione || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{row.lotto || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-500 italic">{row.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Totale righe: {data?.totalCount || 0}
          </p>
        </div>
      </div>
    );
  };

  // Componente per visualizzare le righe di più liste aggregate
  const MultipleListsRowsTable = () => {
    const listIds = Array.from(selectedLists);
    const { data, isLoading, isError, error } = useMultipleListsRows(listIds);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Caricamento righe da tutte le liste selezionate..." />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-12 text-red-600">
          <p className="text-sm font-semibold">Errore nel caricamento delle righe</p>
          <p className="text-xs text-gray-500 mt-1">{error?.message}</p>
        </div>
      );
    }

    // Aggregate all rows from all lists
    const allRows: (ListRow & { numeroListaRef: number })[] = [];
    let totalRows = 0;

    if (data) {
      Object.entries(data).forEach(([listId, response]) => {
        if (response.success && response.items) {
          response.items.forEach(row => {
            allRows.push({
              ...row,
              numeroListaRef: parseInt(listId),
            });
          });
          totalRows += response.totalCount;
        }
      });
    }

    if (allRows.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Nessuna riga trovata nelle liste selezionate</p>
        </div>
      );
    }

    // Sort by list number and row number
    allRows.sort((a, b) => {
      if (a.numeroListaRef !== b.numeroListaRef) {
        return a.numeroListaRef - b.numeroListaRef;
      }
      return a.numeroRiga - b.numeroRiga;
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            Visualizzazione di {allRows.length} righe da {listIds.length} liste
          </p>
          <p className="text-xs text-blue-700">
            Liste: {listIds.join(', ')}
          </p>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">N° Lista</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">N° Riga</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Codice Articolo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Descrizione</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Quantità</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">UM</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Ubicazione</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Lotto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {allRows.map((row, index) => (
                <tr key={`${row.numeroListaRef}-${row.id}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-bold text-ferretto-red">{row.numeroListaRef}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{row.numeroRiga}</td>
                  <td className="px-4 py-2 text-sm font-medium text-blue-700">{row.codiceArticolo}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{row.descrizioneArticolo}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 font-medium">{row.quantita}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{row.um}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{row.ubicazione || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{row.lotto || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 italic">{row.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-600">
            Totale righe visualizzate: {allRows.length}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento liste dal server..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento delle liste
        </div>
        <div className="text-gray-600">
          {error?.message || 'Errore sconosciuto'}
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
            Gestione Liste
          </h1>
          <p className="text-gray-600 mt-1">
            {totalCount} liste totali • {selectedLists.size} selezionate • {filteredLists.length} visualizzate
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowTemplatesModal(true)}
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Modelli Liste
          </Button>
          <Button
            variant="secondary"
            onClick={handleViewSelectedRows}
            disabled={selectedLists.size === 0}
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
            Visualizza Righe Selezionate ({selectedLists.size})
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuova Lista
          </Button>
        </div>
      </div>

      {/* Lists Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Checkbox colonna */}
                <th className="px-3 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedLists.size === filteredLists.length && filteredLists.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-ferretto-red focus:ring-ferretto-red"
                  />
                </th>
                {/* Expand colonna */}
                <th className="px-3 py-3 text-left w-12"></th>
                {/* Numero Lista */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>N° Lista</span>
                    <button
                      onClick={() => toggleColumnFilter('numeroLista')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {showFilterDropdowns.numeroLista && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
                      <input
                        type="text"
                        value={columnFilters.numeroLista}
                        onChange={(e) => updateColumnFilter('numeroLista', e.target.value)}
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
                      onClick={() => toggleColumnFilter('tipo')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                    {renderFilterDropdown('tipo', [
                      { value: '1', label: 'Prelievo' },
                      { value: '2', label: 'Versamento' },
                      { value: '3', label: 'Inventario' },
                      { value: '4', label: 'Trasferimento' },
                    ])}
                  </div>
                </th>
                {/* Descrizione */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2 relative">
                    <span>Descrizione</span>
                    <button
                      onClick={() => toggleColumnFilter('descrizione')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                    {showFilterDropdowns.descrizione && (
                      <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
                        <input
                          type="text"
                          value={columnFilters.descrizione}
                          onChange={(e) => updateColumnFilter('descrizione', e.target.value)}
                          placeholder="Filtra..."
                          className="px-2 py-1 text-sm border border-gray-300 rounded w-full"
                        />
                      </div>
                    )}
                  </div>
                </th>
                {/* Righe */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Righe
                </th>
                {/* Stato */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2 relative">
                    <span>Stato</span>
                    <button
                      onClick={() => toggleColumnFilter('stato')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FunnelIcon className="w-4 h-4" />
                    </button>
                    {renderFilterDropdown('stato', [
                      { value: '0', label: 'Creata' },
                      { value: '1', label: 'In Esecuzione' },
                      { value: '2', label: 'Completata' },
                      { value: '3', label: 'Annullata' },
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
              {filteredLists.map((list: any) => (
                <>
                  {/* Main Row */}
                  <tr key={list.numeroLista} className="hover:bg-gray-50">
                    {/* Checkbox */}
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLists.has(list.numeroLista)}
                        onChange={(e) => handleSelectRow(list.numeroLista, e.target.checked)}
                        className="rounded border-gray-300 text-ferretto-red focus:ring-ferretto-red"
                      />
                    </td>
                    {/* Expand Icon */}
                    <td className="px-3 py-4">
                      <button
                        onClick={() => toggleRowExpansion(list.numeroLista)}
                        className="text-gray-500 hover:text-gray-700 transition-transform"
                      >
                        {expandedRows.has(list.numeroLista) ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-ferretto-red">{list.numeroLista}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(list.tipo)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{list.descrizione || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{list.numeroRighe || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(list.stato)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {list.stato === 0 && (
                          <button
                            onClick={() => handleExecute(list)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                            title="Esegui Lista"
                          >
                            Esegui
                          </button>
                        )}
                        {list.stato === 1 && (
                          <button
                            onClick={() => handleComplete(list)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                            title="Completa Lista"
                          >
                            Completa
                          </button>
                        )}
                        <button
                          onClick={() => toast.info(`Dettagli lista ${list.numeroLista}`)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          title="Dettagli"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row */}
                  {expandedRows.has(list.numeroLista) && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="pl-12">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Righe della Lista {list.numeroLista}
                          </h4>
                          <div className="bg-white rounded border border-gray-200">
                            <ListRowsTable listId={list.numeroLista} />
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

      {/* Modelli Liste Modal */}
      <Modal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        title="Modelli Liste"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Seleziona un modello per creare una nuova lista basata su configurazioni predefinite.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {/* Mock templates */}
            {[
              { id: 1, name: 'Prelievo Standard', tipo: 'Prelievo', descrizione: 'Modello per prelievi standard da magazzino' },
              { id: 2, name: 'Versamento Rapido', tipo: 'Versamento', descrizione: 'Modello per versamenti rapidi' },
              { id: 3, name: 'Inventario Mensile', tipo: 'Inventario', descrizione: 'Modello per inventari periodici' },
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
                    <p className="text-sm text-gray-500 mt-1">{template.descrizione}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {template.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Visualizza Righe Liste Selezionate Modal */}
      <Modal
        isOpen={showRowsModal}
        onClose={() => setShowRowsModal(false)}
        title={`Righe di ${selectedLists.size} liste selezionate`}
        size="xl"
      >
        <MultipleListsRowsTable />
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuova Lista"
        footer={
          <Modal.Footer
            onCancel={() => setShowCreateModal(false)}
            onConfirm={() => {
              toast.success('Creazione lista in fase di implementazione');
              setShowCreateModal(false);
            }}
            confirmText="Crea"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Lista
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent">
              <option value="1">Prelievo</option>
              <option value="2">Versamento</option>
              <option value="3">Inventario</option>
              <option value="4">Trasferimento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              placeholder="Descrizione della lista..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ListsPageEnhanced;

// src/pages/ListsManagementComplete.jsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLists } from '../hooks/useLists';
import { useListOperations } from '../hooks/useListOperations';
import { useWebSocket } from '../hooks/useWebSocket';
import { ListsSidebar } from '../components/lists/ListsSidebar';
import { ListsFiltersBar } from '../components/lists/ListsFiltersBar';
import { ListsStatusBar } from '../components/lists/ListsStatusBar';
import { ListsTable } from '../components/lists/ListsTable';
import { ListsDetailTabs } from '../components/lists/ListsDetailTabs';
import { CreateListModal } from '../components/lists/CreateListModal';
import { EditListModal } from '../components/lists/EditListModal';
import { ListPromptModal } from '../components/lists/ListPromptModal';
import { ListMergeModal } from '../components/lists/ListMergeModal';
import { QuickCreateListModal } from '../components/lists/QuickCreateListModal';
import { ListsTableSettings, useTableColumns } from '../components/lists/ListsTableSettings';
import { ListType, ListStatus, ListExport, ListFilters } from '../types/lists';
import { getAreaOperations, getWarehouseOperations } from '../services/listsDetailsService';
import { apiClient } from '../services/api/client';
import toast from 'react-hot-toast';

/**
 * COMPLETE Lists Management Page
 * Replicates 100% of Swing UI functionality
 *
 * Layout:
 * - LEFT: Sidebar with operation buttons (TaskPane style)
 * - CENTER: Filters, Status Icons, Lists Table
 * - BOTTOM: Tabs for detailed information
 */
interface ListFiltersState {
  genericHeaderSearch: string;
  genericRowSearch: string;
  creationDate: string;
  completionDate: string;
  rowsView: string;
  code: string;
  listId: string;
}

type DetailTabId = 'warehouse' | 'area' | 'rows' | 'reservations' | 'movements';

export default function ListsManagementComplete() {
  const navigate = useNavigate();

  // State management
  const [selectedList, setSelectedList] = useState<ListExport | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [selectedListType, setSelectedListType] = useState<ListType | null>(null); // Filtro per tipo lista
  const [selectedListStatus, setSelectedListStatus] = useState<ListStatus | null>(null); // Filtro per stato lista
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabId>('rows');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [isPtlContainerModalOpen, setIsPtlContainerModalOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<ListType | null>(null);
  const [isCopyTransformModalOpen, setIsCopyTransformModalOpen] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState<{ value: string | number; label: string }[]>([]);
  const [containerOptions, setContainerOptions] = useState<{ value: string | number; label: string }[]>([]);

  // Table columns configuration
  const { columns, updateColumns, isColumnVisible } = useTableColumns();

  // Filters state
  const [filters, setFilters] = useState<ListFiltersState>({
    genericHeaderSearch: '',
    genericRowSearch: '',
    creationDate: '',
    completionDate: '',
    rowsView: '',
    code: '',
    listId: ''
  });

  // Build list filters for API
  const listFilters = useMemo<ListFilters>(() => ({
    listNumber: filters.listId || filters.code || undefined,
    limit: 100
  }), [filters]);

  // Fetch lists with filters
  const { lists, loading: listsLoading, error: listsError, fetchLists } = useLists(listFilters);

  // List operations hook
  const {
    loading: operationLoading,
    executeList,
    setListWaiting,
    terminateList,
    setListUnprocessable,
    reserveList,
    rereserveList,
    enablePTL,
    disablePTL,
    resetPTL,
    resendPTL,
    updatePriority,
    updateDestination,
    updateSequence,
    mergeLists,
    reactivateRows,
    reviveList,
    setPtlContainerType,
    saveAsTemplate,
    fetchDestinationGroups,
    fetchPtlContainerTypes,
    createQuickList
  } = useListOperations();

  // WebSocket connection for real-time updates
  const { isConnected, subscribe } = useWebSocket({
    url: 'ws://localhost:7078/ws',
    enabled: true,
    onOpen: () => {
      console.log('WebSocket connesso - aggiornamenti real-time attivi');
      toast.success('Connesso - Aggiornamenti real-time attivi');
    },
    onClose: () => {
      console.log('WebSocket disconnesso');
    },
    onMessage: (message) => {
      // Handle real-time list updates
      if (message.type === 'lists_update') {
        console.log('Aggiornamento liste ricevuto:', message.changes);

        // Show notification for significant changes
        if (message.changes && message.changes.length > 0) {
          const changeTypes = message.changes.map((c: any) => c.type);
          if (changeTypes.includes('list_created')) {
            toast.success('Nuova lista creata');
          }
          if (changeTypes.includes('list_updated')) {
            toast.info('Lista aggiornata');
          }
          if (changeTypes.includes('list_deleted')) {
            toast.error('Lista eliminata');
          }
        }

        // Refresh lists data
        fetchLists();
      }
    },
    onError: (error) => {
      console.error('Errore WebSocket:', error);
    }
  });

  // Subscribe to lists channel when connected
  useEffect(() => {
    if (isConnected) {
      subscribe('lists');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    if (!isDestinationModalOpen) return;
    fetchDestinationGroups().then((groups) => {
      const options = groups.map((g: any) => ({
        value: g.id,
        label: g.descrizione || `Gruppo ${g.id}`
      }));
      setDestinationOptions(options);
    });
  }, [isDestinationModalOpen, fetchDestinationGroups]);

  useEffect(() => {
    if (!isPtlContainerModalOpen) return;
    fetchPtlContainerTypes().then((types) => {
      const options = types.map((t: any) => ({
        value: t.id,
        label: t.descrizione || `Tipo ${t.id}`
      }));
      setContainerOptions(options);
    });
  }, [isPtlContainerModalOpen, fetchPtlContainerTypes]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      picking: 0,
      refilling: 0,
      vision: 0,
      inventory: 0,
      waiting: 0,
      inExecution: 0,
      terminated: 0
    };

    // Ensure lists is an array
    const safeList = Array.isArray(lists) ? lists : [];

    safeList.forEach(listExport => {
      const list = listExport.listHeader;

      // Count by type
      if (list.listType === ListType.PICKING) counts.picking++;
      else if (list.listType === ListType.REFILLING) counts.refilling++;
      else if (list.listType === ListType.INVENTORY) {
        counts.inventory++;
        counts.vision++; // Vision is also inventory
      }

      // Count by status
      if (list.listStatus === ListStatus.WAITING) counts.waiting++;
      else if (list.listStatus === ListStatus.IN_EXECUTION) counts.inExecution++;
      else if (list.listStatus === ListStatus.TERMINATED) counts.terminated++;
    });

    return counts;
  }, [lists]);

  // Filter lists by selected type and status
  const filteredLists = useMemo<ListExport[]>(() => {
    // Ensure lists is always an array
    const safeList = Array.isArray(lists) ? lists : [];

    if (!selectedListType && !selectedListStatus) {
      return safeList;
    }

    return safeList.filter(listExport => {
      const list = listExport.listHeader;

      // Apply type filter if selected
      const matchesType = !selectedListType || list.listType === selectedListType;

      // Apply status filter if selected
      const matchesStatus = !selectedListStatus || list.listStatus === selectedListStatus;

      // Both filters must match (AND logic)
      return matchesType && matchesStatus;
    });
  }, [lists, selectedListType, selectedListStatus]);

  const fetchListDetail = useCallback(async (listNumber: string): Promise<ListExport | null> => {
    const response = await apiClient.get(`/api/lists/${listNumber}`);
    if (response.status === 200 && response.data?.exported?.length > 0) {
      return response.data.exported[0];
    }
    return null;
  }, []);

  const openPrintWindow = useCallback((title: string, bodyHtml: string) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      toast.error('Popup bloccato: consentire l\'apertura per la stampa');
      return;
    }
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  // ========== SIDEBAR HANDLERS ==========

  const handleRefresh = useCallback(async () => {
    toast.loading('Aggiornamento in corso...', { id: 'refresh' });
    await fetchLists();
    toast.success('Liste aggiornate', { id: 'refresh' });
  }, [fetchLists]);

  const handleClear = useCallback(() => {
    setFilters({
      genericHeaderSearch: '',
      genericRowSearch: '',
      creationDate: '',
      completionDate: '',
      rowsView: '',
      code: '',
      listId: ''
    });
    setSelectedList(null);
    toast.success('Filtri puliti');
  }, []);

  const handleInsert = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di modificarla');
      return;
    }
    setIsEditModalOpen(true);
  }, [selectedList]);

  const handleReserve = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di prenotarla');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await reserveList(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, reserveList, fetchLists]);

  const handleRereserve = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di riprentarla');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await rereserveList(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, rereserveList, fetchLists]);

  const handleExecute = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di eseguirla');
      return;
    }

    // Business logic validation: can only execute WAITING lists
    const header = selectedList.listHeader;
    if (header.listStatus === ListStatus.TERMINATED) {
      toast.error('Impossibile eseguire una lista già terminata');
      return;
    }
    if (header.listStatus === ListStatus.IN_EXECUTION) {
      toast.error('La lista è già in esecuzione');
      return;
    }

    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await executeList(header.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, executeList, fetchLists]);

  const handleWaiting = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di metterla in attesa');
      return;
    }

    // Business logic validation: can only suspend IN_EXECUTION lists
    const header = selectedList.listHeader;
    if (header.listStatus === ListStatus.TERMINATED) {
      toast.error('Impossibile sospendere una lista già terminata');
      return;
    }
    if (header.listStatus === ListStatus.WAITING) {
      toast.info('La lista è già in attesa');
      return;
    }

    // ✅ CORRECT: Use listNumber (string) for Host API PUT /Lists/{listNumber}
    const success = await setListWaiting(header.listNumber);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, setListWaiting, fetchLists]);

  const handleTerminate = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di terminarla');
      return;
    }

    // Business logic validation: cannot terminate already terminated lists
    const header = selectedList.listHeader;
    if (header.listStatus === ListStatus.TERMINATED) {
      toast.error('La lista è già terminata');
      return;
    }

    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await terminateList(header.id);
    if (success) {
      await fetchLists();
      setSelectedList(null);
    }
  }, [selectedList, terminateList, fetchLists]);

  const handleUnprocessable = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di marcarla come inesedibile');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await setListUnprocessable(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, setListUnprocessable, fetchLists]);

  const handleEnablePTL = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di abilitare PTL');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await enablePTL(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, enablePTL, fetchLists]);

  const handleDisablePTL = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di disabilitare PTL');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await disablePTL(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, disablePTL, fetchLists]);

  const handleResetPTL = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di resettare PTL');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await resetPTL(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, resetPTL, fetchLists]);

  const handleResendPTL = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di re-inviare PTL');
      return;
    }
    // ✅ FIXED: Use numeric listId instead of listNumber string
    const success = await resendPTL(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, resendPTL, fetchLists]);

  const handleExecuteAll = useCallback(async () => {
    const targets = filteredLists.filter(listExport => {
      const header = listExport.listHeader;
      return header.listStatus === ListStatus.WAITING;
    });
    if (targets.length === 0) {
      toast.error('Nessuna lista in attesa da eseguire');
      return;
    }
    if (!window.confirm(`Eseguire ${targets.length} liste in attesa?`)) {
      return;
    }
    for (const listExport of targets) {
      await executeList(listExport.listHeader.id);
    }
    await fetchLists();
  }, [filteredLists, executeList, fetchLists]);

  const handlePause = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di metterla in pausa');
      return;
    }
    const success = await setListWaiting(selectedList.listHeader.listNumber);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, setListWaiting, fetchLists]);

  const handlePauseAll = useCallback(async () => {
    const targets = filteredLists.filter(listExport => {
      const header = listExport.listHeader;
      return header.listStatus === ListStatus.IN_EXECUTION;
    });
    if (targets.length === 0) {
      toast.error('Nessuna lista in esecuzione da mettere in pausa');
      return;
    }
    if (!window.confirm(`Mettere in pausa ${targets.length} liste?`)) {
      return;
    }
    for (const listExport of targets) {
      await setListWaiting(listExport.listHeader.listNumber);
    }
    await fetchLists();
  }, [filteredLists, setListWaiting, fetchLists]);

  const handleMerge = useCallback(() => {
    setIsMergeModalOpen(true);
  }, []);

  const handleMergeConfirm = useCallback(async (listIds: number[]) => {
    if (listIds.length < 2) {
      toast.error('Seleziona almeno due liste');
      return;
    }
    const result = await mergeLists(listIds);
    if (result) {
      setIsMergeModalOpen(false);
      await fetchLists();
    }
  }, [mergeLists, fetchLists]);

  const handleCreateDeposit = useCallback(() => {
    setQuickCreateType(ListType.REFILLING);
  }, []);

  const handleCreateVision = useCallback(() => {
    setQuickCreateType(ListType.INVENTORY);
  }, []);

  const handleQuickCreateConfirm = useCallback(async (data: { listNumber?: string; description?: string; priority?: number; areaId?: number }) => {
    if (quickCreateType === null) return;
    const result = await createQuickList({
      listNumber: data.listNumber,
      description: data.description,
      priority: data.priority,
      areaId: data.areaId,
      tipoLista: quickCreateType
    });
    if (result) {
      setQuickCreateType(null);
      await fetchLists();
    }
  }, [quickCreateType, createQuickList, fetchLists]);

  const handleChangePriority = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di cambiare priorita');
      return;
    }
    setIsPriorityModalOpen(true);
  }, [selectedList]);

  const handlePriorityConfirm = useCallback(async (value: string) => {
    const priority = Number(value);
    if (!selectedList || !Number.isFinite(priority)) {
      toast.error('Priorita non valida');
      return;
    }
    const success = await updatePriority([selectedList.listHeader.id], priority);
    if (success) {
      setIsPriorityModalOpen(false);
      await fetchLists();
    }
  }, [selectedList, updatePriority, fetchLists]);

  const handleChangeDestination = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di cambiare destinazione');
      return;
    }
    setIsDestinationModalOpen(true);
  }, [selectedList]);

  const handleDestinationConfirm = useCallback(async (value: string) => {
    const destinationGroupId = Number(value);
    if (!selectedList || !Number.isFinite(destinationGroupId)) {
      toast.error('Destinazione non valida');
      return;
    }
    const success = await updateDestination([selectedList.listHeader.id], destinationGroupId);
    if (success) {
      setIsDestinationModalOpen(false);
      await fetchLists();
    }
  }, [selectedList, updateDestination, fetchLists]);

  const handleAdvanceSequence = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di anticipare');
      return;
    }
    const success = await updateSequence([selectedList.listHeader.id], 'up');
    if (success) {
      await fetchLists();
    }
  }, [selectedList, updateSequence, fetchLists]);

  const handleDelaySequence = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di posticipare');
      return;
    }
    const success = await updateSequence([selectedList.listHeader.id], 'down');
    if (success) {
      await fetchLists();
    }
  }, [selectedList, updateSequence, fetchLists]);

  const handlePrintList = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista da stampare');
      return;
    }
    const listNumber = selectedList.listHeader.listNumber;
    const detail = await fetchListDetail(listNumber);
    if (!detail) {
      toast.error('Dettaglio lista non disponibile');
      return;
    }
    const header = detail.listHeader;
    const rows = detail.listRows || [];
    const rowsHtml = rows.map((row: any) => `
      <tr>
        <td>${row.rowNumber || ''}</td>
        <td>${row.item || ''}</td>
        <td>${row.lineDescription || ''}</td>
        <td>${row.requestedQty ?? ''}</td>
        <td>${row.processedQty ?? ''}</td>
      </tr>
    `).join('');
    const html = `
      <h1>Lista ${header.listNumber}</h1>
      <div><strong>Descrizione:</strong> ${header.listDescription || '-'}</div>
      <div><strong>Tipo:</strong> ${header.listType}</div>
      <table>
        <thead>
          <tr>
            <th>Riga</th>
            <th>Articolo</th>
            <th>Descrizione</th>
            <th>Qta Richiesta</th>
            <th>Qta Evasa</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
    openPrintWindow(`Lista ${header.listNumber}`, html);
  }, [selectedList, fetchListDetail, openPrintWindow]);

  const handlePrintOperations = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista da stampare');
      return;
    }
    const listId = selectedList.listHeader.id;
    const [warehouseOps, areaOps] = await Promise.all([
      getWarehouseOperations(listId),
      getAreaOperations(listId)
    ]);
    const warehouseRows = warehouseOps.map((op: any) => `
      <tr>
        <td>${op.magazzino || '-'}</td>
        <td>${op.numeroRighe}</td>
        <td>${op.qtaTotale}</td>
        <td>${op.qtaProcessata}</td>
        <td>${op.progressoPercentuale}%</td>
      </tr>
    `).join('');
    const areaRows = areaOps.map((op: any) => `
      <tr>
        <td>${op.area || '-'}</td>
        <td>${op.priorita}</td>
        <td>${op.sequenzaLancio}</td>
        <td>${op.numeroRighe}</td>
        <td>${op.qtaTotale}</td>
        <td>${op.qtaProcessata}</td>
      </tr>
    `).join('');
    const html = `
      <h1>Operazioni Lista ${selectedList.listHeader.listNumber}</h1>
      <h2>Operazioni per Magazzino</h2>
      <table>
        <thead>
          <tr>
            <th>Magazzino</th>
            <th>Righe</th>
            <th>Qta Totale</th>
            <th>Qta Processata</th>
            <th>Progresso</th>
          </tr>
        </thead>
        <tbody>${warehouseRows}</tbody>
      </table>
      <h2>Operazioni per Area</h2>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Priorita</th>
            <th>Sequenza</th>
            <th>Righe</th>
            <th>Qta Totale</th>
            <th>Qta Processata</th>
          </tr>
        </thead>
        <tbody>${areaRows}</tbody>
      </table>
    `;
    openPrintWindow(`Operazioni ${selectedList.listHeader.listNumber}`, html);
  }, [selectedList, openPrintWindow]);

  const handlePrintLog = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista per i log');
      return;
    }
    const listId = selectedList.listHeader.id;
    const response = await apiClient.get(`/api/lists/${listId}/logs`);
    const logs = response.data?.data || [];
    const rows = logs.map((log: any) => `
      <tr>
        <td>${log.timestamp || '-'}</td>
        <td>${log.severity || '-'}</td>
        <td>${log.username || '-'}</td>
        <td>${log.description || ''}</td>
      </tr>
    `).join('');
    const html = `
      <h1>Log Lista ${selectedList.listHeader.listNumber}</h1>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Livello</th>
            <th>Utente</th>
            <th>Descrizione</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    openPrintWindow(`Log ${selectedList.listHeader.listNumber}`, html);
  }, [selectedList, openPrintWindow]);

  const handleViewReservations = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista per vedere le prenotazioni');
      return;
    }
    setActiveDetailTab('reservations');
  }, [selectedList]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista da salvare come modello');
      return;
    }
    const result = await saveAsTemplate(selectedList.listHeader.id);
    if (result) {
      await fetchLists();
    }
  }, [selectedList, saveAsTemplate, fetchLists]);

  const handleReactivateRows = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista per riattivare le righe');
      return;
    }
    const success = await reactivateRows([selectedList.listHeader.id]);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, reactivateRows, fetchLists]);

  const handleReviveList = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista da riesumare');
      return;
    }
    if (!window.confirm('Riesumare la lista selezionata?')) {
      return;
    }
    const success = await reviveList(selectedList.listHeader.id);
    if (success) {
      await fetchLists();
    }
  }, [selectedList, reviveList, fetchLists]);

  const handleCopyTransform = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista da copiare');
      return;
    }
    setIsCopyTransformModalOpen(true);
  }, [selectedList]);

  const handleCopyTransformConfirm = useCallback(async (value: string) => {
    if (!selectedList) return;
    const targetType = Number(value);
    if (!Number.isFinite(targetType)) {
      toast.error('Tipo lista non valido');
      return;
    }
    const listNumber = selectedList.listHeader.listNumber;
    const detail = await fetchListDetail(listNumber);
    if (!detail) {
      toast.error('Dettaglio lista non disponibile');
      return;
    }
    const newList = await createQuickList({
      tipoLista: targetType,
      description: `${detail.listHeader.listDescription || listNumber} (Copia)`,
      priority: detail.listHeader.priority,
      areaId: detail.listHeader.idArea
    });
    if (!newList?.id) {
      return;
    }
    const rows = detail.listRows || [];
    for (const row of rows) {
      await apiClient.post(`/api/item-lists/${newList.id}/rows`, {
        itemCode: row.item,
        itemDescription: row.lineDescription,
        requestedQuantity: row.requestedQty,
        lot: row.lot,
        serialNumber: row.serialNumber
      });
    }
    setIsCopyTransformModalOpen(false);
    await fetchLists();
  }, [selectedList, fetchListDetail, createQuickList, fetchLists]);

  const handleOpenSummary = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista per il riepilogo');
      return;
    }
    navigate(`/lists/${selectedList.listHeader.id}`);
  }, [selectedList, navigate]);

  const handleSetPtlContainerType = useCallback(() => {
    if (!selectedList) {
      toast.error('Seleziona una lista per il tipo contenitore PTL');
      return;
    }
    setIsPtlContainerModalOpen(true);
  }, [selectedList]);

  const handlePtlContainerConfirm = useCallback(async (value: string) => {
    const containerTypeId = Number(value);
    if (!selectedList || !Number.isFinite(containerTypeId)) {
      toast.error('Tipo contenitore non valido');
      return;
    }
    const success = await setPtlContainerType([selectedList.listHeader.id], containerTypeId);
    if (success) {
      setIsPtlContainerModalOpen(false);
      await fetchLists();
    }
  }, [selectedList, setPtlContainerType, fetchLists]);

  // Handler for filtering by list type
  const handleFilterByType = useCallback((listType: ListType | null) => {
    // Toggle: if clicking same type, clear filter
    if (selectedListType === listType) {
      setSelectedListType(null);
    } else {
      setSelectedListType(listType);
    }
    // Clear selected list when changing filter
    setSelectedList(null);
  }, [selectedListType]);

  // Handler for filtering by list status
  const handleFilterByStatus = useCallback((listStatus: ListStatus | null) => {
    // Toggle: if clicking same status, clear filter
    if (selectedListStatus === listStatus) {
      setSelectedListStatus(null);
    } else {
      setSelectedListStatus(listStatus);
    }
    // Clear selected list when changing filter
    setSelectedList(null);
  }, [selectedListStatus]);

  const handleExit = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  // ========== FILTERS HANDLERS ==========

  const handleFilterChange = useCallback((newFilters: ListFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback(() => {
    fetchLists();
  }, [fetchLists]);

  // ========== TABLE HANDLERS ==========

  const handleSelectList = useCallback((list: ListExport) => {
    setSelectedList(list);
  }, []);

  const handleDoubleClickList = useCallback((list: ListExport) => {
    setSelectedList(list);
    setIsEditModalOpen(true);
  }, []);

  // ========== STATUS BAR HANDLERS ==========

  const handleToggleShowAll = useCallback((value: boolean) => {
    setShowAll(value);
  }, []);

  const handleTerminateSelected = useCallback(async () => {
    if (!selectedList) {
      toast.error('Seleziona una lista prima di terminarla');
      return;
    }
    handleTerminate();
  }, [selectedList, handleTerminate]);

  // ========== MODAL HANDLERS ==========

  const handleCreateSuccess = useCallback(async () => {
    setIsCreateModalOpen(false);
    await fetchLists();
    toast.success('Lista creata con successo');
  }, [fetchLists]);

  const handleEditSuccess = useCallback(async () => {
    setIsEditModalOpen(false);
    await fetchLists();
    toast.success('Lista aggiornata con successo');
  }, [fetchLists]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F5 - Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
      }
      // F6 - Clear
      if (e.key === 'F6') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleRefresh, handleClear]);

  const selectedListDetail = useMemo(() => {
    if (!selectedList) return null;
    const listId = selectedList.listHeader?.id;
    return {
      ...selectedList,
      id: listId,
      databaseId: listId
    };
  }, [selectedList]);

  const isOperationDisabled = !selectedList || operationLoading || listsLoading;

  return (
    <div className="h-screen flex flex-col bg-ferretto-gray-50">
      {/* Header - Ferretto Style */}
      <div className="bg-gradient-to-r from-ferretto-red to-ferretto-red-dark text-white px-6 py-4 shadow-ferretto-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold">Gestione Liste</h1>
            <p className="text-sm text-white/90 mt-1">
              Sistema di gestione completo per picking, refilling e inventario
            </p>
          </div>
          {listsLoading && (
            <div className="flex items-center gap-2 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Aggiornamento...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <ListsSidebar
          onRefresh={handleRefresh}
          onClear={handleClear}
          onInsert={handleInsert}
          onEdit={handleEdit}
          onReserve={handleReserve}
          onRereserve={handleRereserve}
          onExecute={handleExecute}
          onExecuteAll={handleExecuteAll}
          onPause={handlePause}
          onPauseAll={handlePauseAll}
          onWaiting={handleWaiting}
          onTerminate={handleTerminate}
          onUnprocessable={handleUnprocessable}
          onMerge={handleMerge}
          onCreateDeposit={handleCreateDeposit}
          onCreateVision={handleCreateVision}
          onChangePriority={handleChangePriority}
          onChangeDestination={handleChangeDestination}
          onAdvanceSequence={handleAdvanceSequence}
          onDelaySequence={handleDelaySequence}
          onPrintList={handlePrintList}
          onPrintOperations={handlePrintOperations}
          onPrintLog={handlePrintLog}
          onViewReservations={handleViewReservations}
          onSaveAsTemplate={handleSaveAsTemplate}
          onReactivateRows={handleReactivateRows}
          onReviveList={handleReviveList}
          onCopyTransform={handleCopyTransform}
          onOpenSummary={handleOpenSummary}
          onEnablePTL={handleEnablePTL}
          onDisablePTL={handleDisablePTL}
          onResetPTL={handleResetPTL}
          onResendPTL={handleResendPTL}
          onSetPtlContainerType={handleSetPtlContainerType}
          onSettings={handleOpenSettings}
          onExit={handleExit}
          disabled={isOperationDisabled}
        />

        {/* CENTER AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters Bar */}
          <ListsFiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />

          {/* Status Icons Bar */}
          <ListsStatusBar
            pickingCount={statusCounts.picking}
            refillingCount={statusCounts.refilling}
            visionCount={statusCounts.vision}
            inventoryCount={statusCounts.inventory}
            waitingCount={statusCounts.waiting}
            inExecutionCount={statusCounts.inExecution}
            terminatedCount={statusCounts.terminated}
            showAll={showAll}
            onToggleShowAll={handleToggleShowAll}
            onTerminateSelected={handleTerminateSelected}
            selectedListType={selectedListType}
            onFilterByType={handleFilterByType}
            selectedListStatus={selectedListStatus}
            onFilterByStatus={handleFilterByStatus}
          />

          {/* Lists Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {listsLoading ? (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                  <div className="spinner h-12 w-12 mx-auto mb-4"></div>
                  <p className="text-ferretto-dark">Caricamento liste...</p>
                </div>
              </div>
            ) : listsError ? (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center text-error">
                  <p className="font-medium">Errore nel caricamento</p>
                  <p className="text-sm mt-2 text-ferretto-dark">{listsError}</p>
                </div>
              </div>
            ) : (
              <ListsTable
                lists={filteredLists}
                selectedList={selectedList}
                onSelectList={handleSelectList}
                onDoubleClickList={handleDoubleClickList}
                onSetWaiting={async (listNumber) => {
                  const success = await setListWaiting(listNumber);
                  if (success) await fetchLists();
                }}
                onTerminate={async (listId) => {
                  const success = await terminateList(listId);
                  if (success) await fetchLists();
                }}
                operationLoading={operationLoading}
                isColumnVisible={isColumnVisible}
              />
            )}
          </div>

          {/* Bottom Tabs */}
          <ListsDetailTabs
            selectedList={selectedListDetail}
            activeTab={activeDetailTab}
            onTabChange={(tabId) => setActiveDetailTab(tabId as DetailTabId)}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditListModal
        isOpen={isEditModalOpen}
        list={selectedList}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Table Settings Panel */}
      <ListsTableSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        columns={columns}
        onColumnsChange={updateColumns}
      />

      <ListMergeModal
        isOpen={isMergeModalOpen}
        lists={filteredLists}
        initialSelectedIds={selectedList ? [selectedList.listHeader.id] : []}
        onClose={() => setIsMergeModalOpen(false)}
        onConfirm={handleMergeConfirm}
      />

      <ListPromptModal
        isOpen={isPriorityModalOpen}
        title="Cambio Priorita"
        description="Imposta la nuova priorita per la lista selezionata."
        inputLabel="Priorita"
        inputType="number"
        defaultValue={selectedList?.listHeader?.priority ?? 1}
        onConfirm={handlePriorityConfirm}
        onClose={() => setIsPriorityModalOpen(false)}
      />

      <ListPromptModal
        isOpen={isDestinationModalOpen}
        title="Cambia Destinazione"
        description="Seleziona il gruppo destinazione per la lista."
        inputLabel="Gruppo Destinazione"
        inputType="select"
        options={destinationOptions}
        onConfirm={handleDestinationConfirm}
        onClose={() => setIsDestinationModalOpen(false)}
      />

      <ListPromptModal
        isOpen={isPtlContainerModalOpen}
        title="Tipo Contenitore PTL"
        description="Seleziona il tipo contenitore PTL per la lista."
        inputLabel="Tipo Contenitore"
        inputType="select"
        options={containerOptions}
        onConfirm={handlePtlContainerConfirm}
        onClose={() => setIsPtlContainerModalOpen(false)}
      />

      <ListPromptModal
        isOpen={isCopyTransformModalOpen}
        title="Copia e Trasforma"
        description="Seleziona il tipo di lista per la copia."
        inputLabel="Tipo Lista"
        inputType="select"
        options={[
          { value: ListType.PICKING, label: 'Picking' },
          { value: ListType.REFILLING, label: 'Refilling' },
          { value: ListType.INVENTORY, label: 'Inventario' }
        ]}
        onConfirm={handleCopyTransformConfirm}
        onClose={() => setIsCopyTransformModalOpen(false)}
      />

      <QuickCreateListModal
        isOpen={quickCreateType !== null}
        listType={quickCreateType ?? ListType.PICKING}
        onClose={() => setQuickCreateType(null)}
        onConfirm={handleQuickCreateConfirm}
      />
    </div>
  );
}

// ============================================================================
// EJLOG WMS - Lists Page (Refactored to match Swing UI)
// Complete implementation with filters, toolbar, and detail tabs
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import { ItemListStatus, ItemListType } from '../../types/models';
import { getLists, List, ListType as LegacyListType, ListStatus as LegacyListStatus } from '../../services/listsService';
import { useListOperations } from '../../hooks/useListOperations';
import { ListsFilters, ListFilters } from '../../components/lists/ListsFilters';
import { ListsToolbar } from '../../components/lists/ListsToolbar';
import { ListsDetailTabs } from '../../components/lists/ListsDetailTabs';

// Transform backend list to frontend ItemList format
interface DisplayList {
  id: string; // This is numLista (listNumber like "PICK1742")
  databaseId: number; // This is the numeric ID from Liste.id database
  code: string;
  description?: string;
  rifLista?: string;
  listId?: string;
  areaDestinationGroupId?: number;
  sequenzaLancio?: number;
  itemListType: ItemListType;
  status: ItemListStatus;
  priority: number;
}

const ListsPage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [lists, setLists] = useState<DisplayList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<DisplayList | null>(null);
  const [selectedRows, setSelectedRows] = useState<DisplayList[]>([]);
  const [filters, setFilters] = useState<ListFilters>({});

  const {
    setListWaiting,
    terminateList,
    bookList,
    executeListNode,
    duplicateList,
    loading: operationLoading
  } = useListOperations();

  const fetchLists = async (appliedFilters?: ListFilters) => {
    try {
      setIsLoading(true);

      // Build query params from filters
      const queryParams: any = { limit: 100, offset: 0 };
      if (appliedFilters) {
        if (appliedFilters.listType) queryParams.listType = appliedFilters.listType;
        if (appliedFilters.listStatus) queryParams.listStatus = appliedFilters.listStatus;
        if (appliedFilters.listId) queryParams.listId = appliedFilters.listId;
        if (appliedFilters.listNumber) queryParams.listNumber = appliedFilters.listNumber;
        if (appliedFilters.orderNumber) queryParams.orderNumber = appliedFilters.orderNumber;
        if (appliedFilters.priority) queryParams.priority = appliedFilters.priority;
        if (appliedFilters.itemCode) queryParams.itemCode = appliedFilters.itemCode;
      }

      const response = await getLists(queryParams);

      console.log('📊 Liste ricevute dal backend:', response);

      if (response.result === 'OK' && response.exported) {
        const transformedLists: DisplayList[] = response.exported.map((list: List) => ({
          id: list.listHeader.listNumber,
          databaseId: (list.listHeader as any).id || 0,
          code: list.listHeader.listNumber,
          description: list.listHeader.listDescription,
          rifLista: list.listHeader.orderNumber || list.listHeader.listNumber,
          listId: list.listHeader.listNumber,
          areaDestinationGroupId: list.listHeader.auxHostInt01 ?? undefined,
          sequenzaLancio: list.listHeader.sequenzaLancio,
          itemListType: list.listHeader.listType as unknown as ItemListType,
          status: list.listHeader.listStatus as unknown as ItemListStatus,
          priority: list.listHeader.priority ?? 50
        }));

        setLists(transformedLists);
        console.log('✅ Liste caricate:', transformedLists.length);
      }
    } catch (error) {
      console.error('❌ Errore caricamento liste:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // ============================================================================
  // Filter Handlers
  // ============================================================================
  const handleFiltersChange = (newFilters: ListFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    console.log('🔍 Ricerca con filtri:', filters);
    fetchLists(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchLists(); // Reload without filters
  };

  // ============================================================================
  // Toolbar Handlers - RICERCA Section
  // ============================================================================
  const handleRefresh = () => {
    console.log('🔄 Refresh liste');
    fetchLists(filters);
  };

  // ============================================================================
  // Toolbar Handlers - GESTIONE Section
  // ============================================================================
  const handleCreate = () => {
    console.log('➕ Crea nuova lista');
    navigate('/lists/create');
    // TODO: Open CreateListDialog
  };

  const handleEdit = () => {
    if (!selectedList) return;
    console.log('✏️ Modifica lista:', selectedList.id);
    navigate(`/lists/${selectedList.id}/edit`);
    // TODO: Open EditListDialog
  };

  const handleDuplicate = async () => {
    if (!selectedList) return;
    console.log('📋 Duplica lista:', selectedList.databaseId);
    const result = await duplicateList(selectedList.databaseId);
    if (result) {
      console.log('✅ Lista duplicata:', result);
      await fetchLists(filters);
    }
  };

  const handleDelete = () => {
    if (!selectedList) return;
    if (!confirm(`Eliminare la lista ${selectedList.code}?`)) return;
    console.log('🗑️ Elimina lista:', selectedList.id);
    // TODO: Implement delete API endpoint
    alert('Funzione Elimina - Da implementare');
  };

  const handleDeleteAll = async () => {
    const confirmMessage = `⚠️ ATTENZIONE ⚠️\n\nStai per eliminare TUTTE le liste!\n\nQuesta operazione:\n- Eliminerà TUTTE le liste dal database\n- Eliminerà TUTTE le dipendenze (operazioni, missioni, prenotazioni)\n- NON è reversibile\n\nSei ASSOLUTAMENTE sicuro di voler procedere?\n\nDigita "ELIMINA TUTTO" per confermare.`;

    const userInput = prompt(confirmMessage);

    if (userInput !== 'ELIMINA TUTTO') {
      alert('Operazione annullata.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🗑️💥 Eliminazione TUTTE le liste...');

      const response = await fetch('http://localhost:3077/api/lists/delete-all?force=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}\n\n` +
          `Totale: ${result.data.total}\n` +
          `Eliminate: ${result.data.deleted}\n` +
          `Errori: ${result.data.failed}\n` +
          `Saltate: ${result.data.skipped}`
        );
        await fetchLists(filters);
      } else {
        throw new Error(result.message || 'Errore eliminazione liste');
      }
    } catch (error) {
      console.error('❌ Errore eliminazione tutte le liste:', error);
      alert(`Errore durante l'eliminazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedList) return;
    console.log('🖨️ Stampa lista:', selectedList.id);
    // TODO: Implement print functionality
    alert('Funzione Stampa - Da implementare');
  };

  const handleViewLog = () => {
    if (!selectedList) return;
    console.log('📜 Visualizza log lista:', selectedList.id);
    // TODO: Implement log viewer
    alert('Funzione Log - Da implementare');
  };

  // ============================================================================
  // Toolbar Handlers - STATO Section
  // ============================================================================
  const handleBook = async () => {
    if (!selectedList) return;
    console.log('📖 Prenota lista:', selectedList.databaseId);
    const success = await bookList(selectedList.databaseId);
    if (success) {
      await fetchLists(filters);
    }
  };

  const handleRebook = () => {
    if (!selectedList) return;
    console.log('🔁 Riprenota lista:', selectedList.id);
    // TODO: Implement rebook API endpoint
    alert('Funzione Riprenota - Da implementare');
  };

  const handleExecute = async () => {
    if (!selectedList) return;
    console.log('▶️ Esegui lista:', selectedList.databaseId);
    const success = await executeListNode(selectedList.databaseId);
    if (success) {
      await fetchLists(filters);
    }
  };

  const handlePause = () => {
    if (!selectedList) return;
    console.log('⏸️ Pausa lista:', selectedList.id);
    // TODO: Implement pause API endpoint
    alert('Funzione Pausa - Da implementare');
  };

  const handleTerminate = async () => {
    if (!selectedList) return;
    if (!confirm(`Terminare la lista ${selectedList.code}?`)) return;
    console.log('✅ Termina lista:', selectedList.databaseId);
    const success = await terminateList(selectedList.databaseId);
    if (success) {
      await fetchLists(filters);
    }
  };

  // ============================================================================
  // Toolbar Handlers - AVANZATE Section
  // ============================================================================
  const handleManageUnavailable = () => {
    if (!selectedList) return;
    console.log('⚠️ Gestisci inevadibilità lista:', selectedList.id);
    // TODO: Open UnavailableItemsDialog
    alert('Funzione Inevadibilità - Da implementare');
  };

  const handleChangePriority = () => {
    if (!selectedList) return;
    console.log('🔢 Cambia priorità lista:', selectedList.id);
    // TODO: Open ChangePriorityDialog
    alert('Funzione Cambia Priorità - Da implementare');
  };

  const handleChangeDestination = () => {
    if (!selectedList) return;
    console.log('📍 Cambia destinazione lista:', selectedList.id);
    // TODO: Open ChangeDestinationDialog
    alert('Funzione Cambia Destinazione - Da implementare');
  };

  const handleMoveUp = () => {
    if (!selectedList) return;
    console.log('⬆️ Anticipa lista:', selectedList.id);
    // TODO: Implement move-up API endpoint
    alert('Funzione Anticipa - Da implementare');
  };

  const handleMoveDown = () => {
    if (!selectedList) return;
    console.log('⬇️ Posticipa lista:', selectedList.id);
    // TODO: Implement move-down API endpoint
    alert('Funzione Posticipa - Da implementare');
  };

  // ============================================================================
  // Toolbar Handlers - PTL Section
  // ============================================================================
  const handleEnablePTL = () => {
    if (!selectedList) return;
    console.log('⚡ Abilita PTL lista:', selectedList.id);
    // TODO: Implement enable PTL API endpoint
    alert('Funzione Abilita PTL - Da implementare');
  };

  const handleDisablePTL = () => {
    if (!selectedList) return;
    console.log('🔌 Disabilita PTL lista:', selectedList.id);
    // TODO: Implement disable PTL API endpoint
    alert('Funzione Disabilita PTL - Da implementare');
  };

  const handleResendPTL = () => {
    if (!selectedList) return;
    console.log('📤 Reinvia PTL lista:', selectedList.id);
    // TODO: Implement resend PTL API endpoint
    alert('Funzione Reinvia PTL - Da implementare');
  };

  const handleResetPTL = () => {
    if (!selectedList) return;
    console.log('🔄 Reset PTL lista:', selectedList.id);
    // TODO: Implement reset PTL API endpoint
    alert('Funzione Reset PTL - Da implementare');
  };

  // ============================================================================
  // Table Configuration
  // ============================================================================
  const statusVariant = (status: ItemListStatus) => {
    switch (status) {
      case ItemListStatus.TERMINATA: return 'success';  // ✅ Aggiornato da COMPLETATA
      case ItemListStatus.IN_ESECUZIONE: return 'info';
      case ItemListStatus.SOSPESA: return 'warning';
      case ItemListStatus.ANNULLATA: return 'danger';
      default: return 'default';
    }
  };

  const columns: Column<DisplayList>[] = [
    { key: 'code', header: 'Codice', sortable: true },
    { key: 'description', header: 'Descrizione' },
    {
      key: 'rifLista',
      header: 'Rif. Lista',
      render: (list) => list.rifLista || '-'
    },
    {
      key: 'itemListType',
      header: 'Tipo',
      render: (list) => ItemListType[list.itemListType],
    },
    {
      key: 'status',
      header: 'Stato',
      render: (list) => (
        <Badge variant={statusVariant(list.status)}>
          {ItemListStatus[list.status]}
        </Badge>
      ),
    },
    { key: 'priority', header: 'Priorità' },
  ];

  const handleRowClick = (list: DisplayList) => {
    setSelectedList(list);
    console.log('✅ Lista selezionata:', list);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-ferretto-dark">Gestione Liste</h1>
      </div>

      {/* Filters Panel */}
      <ListsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Toolbar with all 24 buttons */}
      <ListsToolbar
        selectedList={selectedList}
        selectedListsCount={selectedList ? 1 : 0}
        isLoading={isLoading || operationLoading}
        onRefresh={handleRefresh}
        onClearFilters={handleClearFilters}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onPrint={handlePrint}
        onViewLog={handleViewLog}
        onBook={handleBook}
        onRebook={handleRebook}
        onExecute={handleExecute}
        onPause={handlePause}
        onTerminate={handleTerminate}
        onManageUnavailable={handleManageUnavailable}
        onChangePriority={handleChangePriority}
        onChangeDestination={handleChangeDestination}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onEnablePTL={handleEnablePTL}
        onDisablePTL={handleDisablePTL}
        onResendPTL={handleResendPTL}
        onResetPTL={handleResetPTL}
      />

      {/* Master Table */}
      <Card>
        <Table
          data={lists}
          columns={columns}
          loading={isLoading}
          onRowClick={handleRowClick}
        />
      </Card>

      {/* Detail Tabs - shows when list is selected */}
      <ListsDetailTabs
        selectedList={selectedList}
        onTabChange={(tabId) => console.log('📑 Tab changed:', tabId)}
      />
    </div>
  );
};

export default ListsPage;


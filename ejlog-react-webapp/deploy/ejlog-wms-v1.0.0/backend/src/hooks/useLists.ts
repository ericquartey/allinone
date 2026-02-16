// src/hooks/useLists.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getLists, type List as ServiceList, type ListHeader as ServiceListHeader, type ListRow as ServiceListRow } from '../services/listsService';
import type {
  List,
  ListRow,
  ListExport,
  ListFilters,
  StandardResponse,
} from '../types/lists';
import { ListType, ListStatus } from '../types/lists';
import {
  getStatusColor,
  calculateProgress,
  canExecuteList,
  canPauseList,
  canTerminateList,
  canEditList,
  canDeleteList,
  canCopyList,
} from '../utils/listUtils';

/**
 * Custom hook for managing lists state and operations
 * Now uses listsService.ts (getLists) directly for real database data
 */
export const useLists = (filters?: ListFilters) => {
  const [lists, setLists] = useState<ListExport[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stable reference for filters to prevent infinite loops
  const filtersRef = useRef<string>('');
  const currentFiltersStr = JSON.stringify(filters || {});

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 useLists: Fetching lists with filters:', filters);

      // Use getLists from listsService.ts directly - it works with real DB data
      const response = await getLists({
        limit: filters?.limit || 100,
        offset: filters?.offset || 0,
        listNumber: filters?.listNumber,
      });

      console.log('📦 useLists: Response from getLists:', response);

      if (response.result === 'OK' && response.exported) {
        console.log(`✅ useLists: Got ${response.exported.length} lists from backend`);

        // Transform ServiceList[] to ListExport[] format expected by UI
        const transformedLists: ListExport[] = response.exported.map((list: ServiceList) => ({
          listHeader: {
            ...list.listHeader,
            // Ensure enums are correctly typed
            listType: list.listHeader.listType as unknown as ListType,
            listStatus: list.listHeader.listStatus as unknown as ListStatus,
          },
          listRows: list.listRows || []
        }));

        console.log('✅ useLists: Transformed lists:', transformedLists);
        setLists(transformedLists);
        setTotalCount(response.total || response.exported.length);
      } else {
        const errorMsg = 'Errore nel caricamento delle liste';
        setError(errorMsg);
        console.error('❌ useLists: Error - response not OK:', response);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nel caricamento delle liste';
      setError(errorMsg);
      console.error('❌ useLists: Exception fetching lists:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getListByNumber = useCallback(async (listNumber: string): Promise<ListExport | null> => {
    setLoading(true);
    setError(null);

    try {
      const list = await listsApi.getListByNumber(listNumber);
      return list;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nel caricamento della lista';
      setError(errorMsg);
      console.error('Error fetching list:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createList = useCallback(async (data: {
    listNumber: string;
    listDescription?: string;
    listType: number;
    listStatus?: number;
    cause?: string;
    orderNumber?: string;
    priority?: number;
    exitPoint?: number;
    selectedWarehouses?: number[];
    rows: Array<{
      rowNumber: string;
      item: string;
      lineDescription?: string;
      requestedQty: number;
      lot?: string;
      serialNumber?: string;
      expiryDate?: string;
      rowSequence?: number;
      operatorInfo?: string;
      labelInfo?: string;
      auxHostText01?: string;
      auxHostText02?: string;
      auxHostText03?: string;
      auxHostText04?: string;
      auxHostText05?: string;
      auxHostInt01?: number;
      auxHostInt02?: number;
      auxHostInt03?: number;
      auxHostBit01?: boolean;
      auxHostBit02?: boolean;
      auxHostBit03?: boolean;
      auxHostDate01?: string;
      auxHostDate02?: string;
      auxHostDate03?: string;
      auxHostNum01?: number;
      auxHostNum02?: number;
      auxHostNum03?: number;
    }>;
    auxHostText01?: string;
    auxHostText02?: string;
    auxHostText03?: string;
    auxHostText04?: string;
    auxHostText05?: string;
    auxHostInt01?: number;
    auxHostInt02?: number;
    auxHostInt03?: number;
    auxHostBit01?: boolean;
    auxHostBit02?: boolean;
    auxHostBit03?: boolean;
    auxHostDate01?: string;
    auxHostDate02?: string;
    auxHostDate03?: string;
    auxHostNum01?: number;
    auxHostNum02?: number;
    auxHostNum03?: number;
  }): Promise<StandardResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await listsApi.createList(data);

      if (listsApi.isResponseOk(response)) {
        await fetchLists(); // Refresh the list
        return response;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore nella creazione della lista';
        setError(errorMsg);
        console.error('Error creating list:', errorMsg);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella creazione della lista';
      setError(errorMsg);
      console.error('Error creating list:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLists]);

  const updateList = useCallback(async (
    listNumber: string,
    data: {
      listDescription?: string;
      priority?: number;
      auxHostText01?: string;
      auxHostText02?: string;
      auxHostText03?: string;
      auxHostText04?: string;
      auxHostText05?: string;
      auxHostInt01?: number;
      auxHostInt02?: number;
      auxHostInt03?: number;
      auxHostBit01?: boolean;
      auxHostBit02?: boolean;
      auxHostBit03?: boolean;
      auxHostDate01?: string;
      auxHostDate02?: string;
      auxHostDate03?: string;
      auxHostNum01?: number;
      auxHostNum02?: number;
      auxHostNum03?: number;
    }
  ): Promise<StandardResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await listsApi.updateList(listNumber, data);

      if (listsApi.isResponseOk(response)) {
        await fetchLists(); // Refresh the list
        return response;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore nell\'aggiornamento della lista';
        setError(errorMsg);
        console.error('Error updating list:', errorMsg);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nell\'aggiornamento della lista';
      setError(errorMsg);
      console.error('Error updating list:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLists]);

  const deleteList = useCallback(async (listNumber: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await listsApi.deleteList(listNumber);

      if (listsApi.isResponseOk(response)) {
        await fetchLists(); // Refresh the list
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore nell\'eliminazione della lista';
        setError(errorMsg);
        console.error('Error deleting list:', errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nell\'eliminazione della lista';
      setError(errorMsg);
      console.error('Error deleting list:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLists]);

  useEffect(() => {
    // Only fetch if filters actually changed (by comparing stringified version)
    if (filtersRef.current !== currentFiltersStr) {
      filtersRef.current = currentFiltersStr;
      fetchLists();
    }
  }, [currentFiltersStr, fetchLists]);

  return {
    lists,
    totalCount,
    loading,
    error,
    fetchLists,
    getListByNumber,
    createList,
    updateList,
    deleteList
  };
};

/**
 * Custom hook for managing list rows operations
 */
export const useListRows = (listNumber?: string) => {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListRows = useCallback(async () => {
    if (!listNumber) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await listsApi.getListByNumber(listNumber);

      if (list && list.listRows) {
        setRows(list.listRows);
      } else {
        setRows([]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nel caricamento delle righe';
      setError(errorMsg);
      console.error('Error fetching list rows:', err);
    } finally {
      setLoading(false);
    }
  }, [listNumber]);

  const updateRows = useCallback(async (
    rows: Array<{
      rowNumber: string;
      item: string;
      requestedQty: number;
      lineDescription?: string;
      lot?: string;
      serialNumber?: string;
      expiryDate?: string;
      rowSequence?: number;
      operatorInfo?: string;
      labelInfo?: string;
      auxHostText01?: string;
      auxHostText02?: string;
      auxHostText03?: string;
      auxHostText04?: string;
      auxHostText05?: string;
      auxHostInt01?: number;
      auxHostInt02?: number;
      auxHostInt03?: number;
      auxHostBit01?: boolean;
      auxHostBit02?: boolean;
      auxHostBit03?: boolean;
      auxHostDate01?: string;
      auxHostDate02?: string;
      auxHostDate03?: string;
      auxHostNum01?: number;
      auxHostNum02?: number;
      auxHostNum03?: number;
    }>
  ): Promise<StandardResponse | null> => {
    if (!listNumber) {
      setError('Numero lista non specificato');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await listsApi.updateListRows(listNumber, rows);

      if (listsApi.isResponseOk(response)) {
        await fetchListRows(); // Refresh the rows
        return response;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore nell\'aggiornamento delle righe';
        setError(errorMsg);
        console.error('Error updating rows:', errorMsg);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nell\'aggiornamento delle righe';
      setError(errorMsg);
      console.error('Error updating rows:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [listNumber, fetchListRows]);

  useEffect(() => {
    fetchListRows();
  }, [fetchListRows]);

  return {
    rows,
    loading,
    error,
    fetchListRows,
    updateRows
  };
};

// ============================================================================
// HOOK: useListFilters
// Gestisce lo stato dei filtri per la ricerca delle liste
// ============================================================================

export interface UseListFiltersReturn {
  filters: ListFilters;
  setFilters: (filters: ListFilters) => void;
  updateFilter: <K extends keyof ListFilters>(key: K, value: ListFilters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const DEFAULT_FILTERS: ListFilters = {
  limit: 50,
  offset: 0,
};

export const useListFilters = (initialFilters?: ListFilters): UseListFiltersReturn => {
  const [filters, setFilters] = useState<ListFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const updateFilter = useCallback(<K extends keyof ListFilters>(
    key: K,
    value: ListFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset offset quando cambia un filtro
      ...(key !== 'offset' && key !== 'limit' ? { offset: 0 } : {}),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      if (key === 'limit' || key === 'offset') return false;
      return filters[key as keyof ListFilters] !== undefined;
    });
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
};

// ============================================================================
// HOOK: useListActions
// Gestisce le operazioni sulle liste (execute, pause, complete, cancel, etc.)
// ============================================================================

export interface UseListActionsReturn {
  executeList: (listNumber: string, userName?: string) => Promise<boolean>;
  pauseList: (listNumber: string) => Promise<boolean>;
  resumeList: (listNumber: string) => Promise<boolean>;
  completeList: (listNumber: string) => Promise<boolean>;
  cancelList: (listNumber: string, reason: string) => Promise<boolean>;
  copyList: (listNumber: string, newListNumber: string) => Promise<boolean>;
  updateListPriority: (listNumber: string, priority: number) => Promise<boolean>;
  isLoading: boolean;
}

export const useListActions = (onSuccess?: () => void): UseListActionsReturn => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Execute a list
   * Cambia stato da WAITING → IN_EXECUTION
   */
  const executeList = useCallback(async (
    listNumber: string,
    userName?: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Update list status to IN_EXECUTION (2)
      const response = await listsApi.updateList(listNumber, {
        auxHostText01: userName || 'SYSTEM',
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Lista ${listNumber} avviata con successo`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore avvio lista: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error executing list:', error);
      toast.error(`Errore avvio lista: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  /**
   * Pause a list
   * Cambia stato da IN_EXECUTION → SUSPENDED
   */
  const pauseList = useCallback(async (listNumber: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await listsApi.updateList(listNumber, {
        auxHostText01: 'PAUSED',
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Lista ${listNumber} messa in pausa`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore pausa lista: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error pausing list:', error);
      toast.error(`Errore pausa lista: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  /**
   * Resume a list
   * Cambia stato da SUSPENDED → IN_EXECUTION
   */
  const resumeList = useCallback(async (listNumber: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await listsApi.updateList(listNumber, {
        auxHostText01: 'RESUMED',
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Lista ${listNumber} ripresa`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore ripresa lista: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error resuming list:', error);
      toast.error(`Errore ripresa lista: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  /**
   * Complete a list
   * Cambia stato → TERMINATED
   */
  const completeList = useCallback(async (listNumber: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await listsApi.updateList(listNumber, {
        auxHostText01: 'COMPLETED',
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Lista ${listNumber} completata`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore completamento lista: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error completing list:', error);
      toast.error(`Errore completamento lista: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  /**
   * Cancel a list with reason
   * Aggiunge motivo annullamento e cambia stato
   */
  const cancelList = useCallback(async (
    listNumber: string,
    reason: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await listsApi.updateList(listNumber, {
        auxHostText01: 'CANCELLED',
        auxHostText02: reason, // Motivo annullamento
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Lista ${listNumber} annullata`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore annullamento lista: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error cancelling list:', error);
      toast.error(`Errore annullamento lista: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  /**
   * Copy a list
   * Crea una nuova lista duplicando i dati di quella esistente
   */
  const copyList = useCallback(async (
    listNumber: string,
    newListNumber: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Fetch original list
      const originalList = await listsApi.getListByNumber(listNumber);

      if (!originalList) {
        toast.error(`Lista ${listNumber} non trovata`);
        return false;
      }

      // Create new list with same data
      const response = await listsApi.createList({
        listNumber: newListNumber,
        listDescription: `${originalList.listHeader.listDescription || ''} (Copia)`,
        listType: originalList.listHeader.listType,
        listStatus: 1, // WAITING
        cause: originalList.listHeader.cause,
        orderNumber: originalList.listHeader.orderNumber,
        priority: originalList.listHeader.priority,
        exitPoint: originalList.listHeader.exitPoint,
        selectedWarehouses: originalList.listHeader.selectedWarehouses,
        rows: originalList.listRows.map(row => ({
          rowNumber: row.rowNumber,
          item: row.item,
          lineDescription: row.lineDescription,
          requestedQty: row.requestedQty,
          lot: row.lot,
          serialNumber: row.serialNumber,
          expiryDate: row.expiryDate,
          rowSequence: row.rowSequence,
          operatorInfo: row.operatorInfo,
          labelInfo: row.labelInfo,
        })),
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Lista ${listNumber} duplicata in ${newListNumber}`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore duplicazione lista: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error copying list:', error);
      toast.error(`Errore duplicazione lista: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  /**
   * Update list priority
   */
  const updateListPriority = useCallback(async (
    listNumber: string,
    priority: number
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await listsApi.updateList(listNumber, {
        priority,
      });

      if (listsApi.isResponseOk(response)) {
        toast.success(`Priorità lista ${listNumber} aggiornata`);
        onSuccess?.();
        return true;
      } else {
        const errorMsg = listsApi.getFirstErrorMessage(response) || 'Errore sconosciuto';
        toast.error(`Errore aggiornamento priorità: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error(`Errore aggiornamento priorità: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  return {
    executeList,
    pauseList,
    resumeList,
    completeList,
    cancelList,
    copyList,
    updateListPriority,
    isLoading,
  };
};

// ============================================================================
// HOOK: useListStatusColor
// Mappa ListStatus a colore Tailwind
// ============================================================================

export const useListStatusColor = (status: ListStatus | undefined): string => {
  return useMemo(() => {
    if (!status) return 'gray';
    return getStatusColor(status);
  }, [status]);
};

// ============================================================================
// HOOK: useListProgress
// Calcola la percentuale di completamento di una lista
// ============================================================================

export const useListProgress = (
  totalRows: number | undefined,
  completedRows: number | undefined
): number => {
  return useMemo(() => {
    return calculateProgress(totalRows || 0, completedRows || 0);
  }, [totalRows, completedRows]);
};

// ============================================================================
// HOOK: useListPermissions
// Verifica i permessi per le operazioni su una lista
// ============================================================================

export interface ListPermissions {
  canExecute: boolean;
  canPause: boolean;
  canTerminate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCopy: boolean;
}

export const useListPermissions = (list: List | undefined): ListPermissions => {
  return useMemo(() => {
    if (!list) {
      return {
        canExecute: false,
        canPause: false,
        canTerminate: false,
        canEdit: false,
        canDelete: false,
        canCopy: false,
      };
    }

    return {
      canExecute: canExecuteList(list),
      canPause: canPauseList(list),
      canTerminate: canTerminateList(list),
      canEdit: canEditList(list),
      canDelete: canDeleteList(list),
      canCopy: canCopyList(list),
    };
  }, [list]);
};

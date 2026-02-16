// src/hooks/useListOperations.ts

import { useState, useCallback } from 'react';
import { restApiClient } from '../services/api/restApiClient';
import { apiClient } from '../services/api/client';
import toast from 'react-hot-toast';

/**
 * Custom hook for list operations using REAL REST API endpoints
 *
 * âœ… FIXED: Now uses restApiClient for /api/item-lists/* endpoints
 * âœ… REMOVED: All mocks and workarounds
 * âœ… REAL DATA: Calls actual backend Java Spring Boot REST API
 *
 * Backend endpoints (ItemListsApiController.java):
 * - POST /api/item-lists/{id}/execute
 * - POST /api/item-lists/{id}/terminate
 * - POST /api/item-lists/{id}/suspend
 * - POST /api/item-lists/{id}/waiting
 * - POST /api/item-lists/{id}/reserve
 * - POST /api/item-lists/{id}/rereserve
 */
export const useListOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * âœ… Execute list - Uses REAL REST endpoint
   * Backend: ItemListsApiController.java line 239-302
   *
   * @param listId - List ID (numeric ID from listHeader.id)
   * @param options - Optional execution parameters
   */
  const executeList = useCallback(async (
    listId: number,
    options?: {
      areaId?: number;
      itemListEvadabilityType?: number;
      destinationGroupId?: number;
      userName?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (options?.areaId) params.append('areaId', options.areaId.toString());
      if (options?.itemListEvadabilityType !== undefined) {
        params.append('itemListEvadabilityType', options.itemListEvadabilityType.toString());
      }
      if (options?.destinationGroupId) {
        params.append('destinationGroupId', options.destinationGroupId.toString());
      }
      if (options?.userName) params.append('userName', options.userName);

      // âœ… REAL API CALL - Using numeric listId
      const url = `/api/item-lists/${listId}/execute${params.toString() ? '?' + params.toString() : ''}`;
      const response = await restApiClient.post(url, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} in esecuzione`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nell\'esecuzione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nell\'esecuzione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Execute error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Set list to waiting state - Uses REAL database API
   * Backend: Node.js API PUT /api/lists/{listNumber}/waiting
   *
   * @param listNumber - List Number (string like "PICK1742")
   */
  const setListWaiting = useCallback(async (listNumber: string) => {
    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using listNumber string
      const response = await apiClient.put(`/api/lists/${listNumber}/waiting`);

      if (response.status === 200) {
        toast.success(`Lista ${listNumber} messa in attesa`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nel mettere in attesa la lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nel mettere in attesa la lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Waiting error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Terminate list - Uses REAL database API
   * Backend: Node.js API POST /api/lists/{id}/terminate
   *
   * @param listId - List ID (numeric ID from database Liste.id)
   */
  const terminateList = useCallback(async (listId: number) => {
    // User confirmation (like Swing JOptionPane.showConfirmDialog)
    const confirmed = window.confirm(
      `Confermi la terminazione della lista #${listId}?\n\nQuesta operazione Ã¨ irreversibile.`
    );

    if (!confirmed) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using numeric listId
      const response = await apiClient.post(`/api/lists/${listId}/terminate`, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} terminata con successo`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nella terminazione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella terminazione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Terminate error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Book list - Uses REAL database API
   * Backend: Node.js API PUT /api/lists/{id}/book
   * Sets list status to BOOKED (idStatoControlloEvadibilita = 1)
   *
   * @param listId - List ID (numeric ID from database Liste.id)
   */
  const bookList = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using numeric listId
      const response = await apiClient.put(`/api/lists/${listId}/book`, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} prenotata con successo`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nella prenotazione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella prenotazione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Book error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Execute list (Node.js) - Uses REAL database API
   * Backend: Node.js API PUT /api/lists/{id}/execute
   * Sets list status to IN_EXECUTION (idStatoControlloEvadibilita = 2)
   *
   * @param listId - List ID (numeric ID from database Liste.id)
   */
  const executeListNode = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using numeric listId
      const response = await apiClient.put(`/api/lists/${listId}/execute`, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} in esecuzione`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nell\'esecuzione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nell\'esecuzione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] ExecuteNode error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Duplicate list - Uses REAL database API
   * Backend: Node.js API POST /api/lists/{id}/duplicate
   * Creates a copy of the list with all rows
   *
   * @param listId - List ID (numeric ID from database Liste.id)
   * @returns Object with newListId and newListNumber if successful, null otherwise
   */
  const duplicateList = useCallback(async (listId: number): Promise<{ newListId: number; newListNumber: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using numeric listId
      const response = await apiClient.post(`/api/lists/${listId}/duplicate`, null);

      if (response.status === 200 && response.data.result === 'OK') {
        const { newListId, newListNumber } = response.data;
        toast.success(`Lista duplicata: ${newListNumber} (ID: ${newListId})`);
        return { newListId, newListNumber };
      } else {
        const errorMsg = response.data?.message || 'Errore nella duplicazione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella duplicazione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Duplicate error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âš ï¸ Mark list as unprocessable (inesedibile) - PLACEHOLDER
   *
   * TODO: Backend needs endpoint POST /api/item-lists/{id}/mark-unprocessable
   * For now, shows info message
   *
   * @param listId - List ID (numeric ID from listHeader.id)
   */
  const setListUnprocessable = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/api/lists/${listId}/unprocessable`, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} marcata come non evadibile`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nella gestione inesedibili';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella gestione inesedibili';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Unprocessable error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Reserve list - Uses REAL REST endpoint
   * Backend: ItemListsApiController.java line 716-754
   *
   * @param listId - List ID (numeric ID from listHeader.id)
   */
  const reserveList = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using numeric listId
      const response = await restApiClient.post(`/api/item-lists/${listId}/reserve`, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} prenotata con successo`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nella prenotazione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella prenotazione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Reserve error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âœ… Re-reserve list - Uses REAL REST endpoint
   * Backend: ItemListsApiController.java line 758-796
   *
   * @param listId - List ID (numeric ID from listHeader.id)
   */
  const rereserveList = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);

    try {
      // âœ… REAL API CALL - Using numeric listId
      const response = await restApiClient.post(`/api/item-lists/${listId}/rereserve`, null);

      if (response.status === 200) {
        toast.success(`Lista #${listId} riprenotata con successo`);
        return true;
      } else {
        const errorMsg = response.data?.message || 'Errore nella riprenotazione della lista';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore nella riprenotazione della lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Rereserve error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * âŒ PTL Operations - Not supported via REST API
   *
   * These operations are system-wide (not per-list) and require direct SQL access.
   * Backend does NOT expose REST endpoints for PTL operations.
   *
   * Options:
   * 1. Keep error message (current approach)
   * 2. Implement backend endpoints in PTLApiController.java
   *
   * @param listId - List ID (numeric ID from listHeader.id)
   */
  const enablePTL = useCallback(async (_listId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/ptl/enable', null);
      if (response.status === 200) {
        toast.success('PTL abilitato');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore abilitazione PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore abilitazione PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Enable PTL error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disablePTL = useCallback(async (_listId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/ptl/disable', null);
      if (response.status === 200) {
        toast.success('PTL disabilitato');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore disabilitazione PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore disabilitazione PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Disable PTL error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPTL = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/ptl/reset', { listIds: [listId] });
      if (response.status === 200) {
        toast.success('PTL resettato');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore reset PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore reset PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Reset PTL error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendPTL = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/ptl/resend', { listIds: [listId] });
      if (response.status === 200) {
        toast.success('PTL reinviato');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore reinvio PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore reinvio PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Resend PTL error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePriority = useCallback(async (listIds: number[], priority: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/priority', { listIds, priority });
      if (response.status === 200) {
        toast.success('Priorita aggiornata');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore aggiornamento priorita';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore aggiornamento priorita';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Update priority error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDestination = useCallback(async (listIds: number[], destinationGroupId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/destination', { listIds, destinationGroupId });
      if (response.status === 200) {
        toast.success('Destinazione aggiornata');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore aggiornamento destinazione';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore aggiornamento destinazione';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Update destination error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSequence = useCallback(async (listIds: number[], direction: 'up' | 'down') => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/sequence', { listIds, direction });
      if (response.status === 200) {
        toast.success('Sequenza aggiornata');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore aggiornamento sequenza';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore aggiornamento sequenza';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Update sequence error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const mergeLists = useCallback(async (listIds: number[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/merge', { listIds });
      if (response.status === 200) {
        const newListNumber = response.data?.data?.newListNumber;
        toast.success(`Liste accorpate${newListNumber ? `: ${newListNumber}` : ''}`);
        return response.data?.data || null;
      }
      const errorMsg = response.data?.message || 'Errore accorpamento liste';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore accorpamento liste';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Merge error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reactivateRows = useCallback(async (listIds: number[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/reactivate-rows', { listIds });
      if (response.status === 200) {
        toast.success('Righe riattivate');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore riattivazione righe';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore riattivazione righe';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Reactivate rows error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reviveList = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/api/lists/${listId}/revive`, null);
      if (response.status === 200) {
        toast.success('Lista riesumata');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore riesumazione lista';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore riesumazione lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Revive error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setPtlContainerType = useCallback(async (listIds: number[], containerTypeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/lists/ptl/container-type', {
        listIds,
        containerTypeId
      });
      if (response.status === 200) {
        toast.success('Tipo contenitore PTL aggiornato');
        return true;
      }
      const errorMsg = response.data?.message || 'Errore tipo contenitore PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore tipo contenitore PTL';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] PTL container type error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAsTemplate = useCallback(async (listId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/api/lists/${listId}/save-as-template`, null);
      if (response.status === 200) {
        toast.success('Lista salvata come modello');
        return response.data?.data || null;
      }
      const errorMsg = response.data?.message || 'Errore salvataggio modello';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore salvataggio modello';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Save template error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDestinationGroups = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/lists/destination-groups');
      if (response.status === 200) {
        return response.data?.data || [];
      }
      return [];
    } catch (err: any) {
      console.error('[useListOperations] Destination groups error:', err);
      return [];
    }
  }, []);

  const fetchPtlContainerTypes = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/lists/ptl/container-types');
      if (response.status === 200) {
        return response.data?.data || [];
      }
      return [];
    } catch (err: any) {
      console.error('[useListOperations] PTL container types error:', err);
      return [];
    }
  }, []);

  const createQuickList = useCallback(async (data: {
    listNumber?: string;
    description?: string;
    tipoLista: number;
    priority?: number;
    areaId?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/item-lists', data);
      if (response.status === 201 || response.status === 200) {
        toast.success(`Lista creata: ${response.data?.data?.listNumber || data.listNumber || ''}`);
        return response.data?.data || null;
      }
      const errorMsg = response.data?.message || 'Errore creazione lista';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Errore creazione lista';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[useListOperations] Create quick list error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    // âœ… Real operations using REST API / Node.js API
    executeList,          // Spring Boot REST API
    executeListNode,      // Node.js API (new)
    setListWaiting,
    terminateList,
    bookList,            // Node.js API (new)
    duplicateList,       // Node.js API (new)
    reserveList,
    rereserveList,
    // âš ï¸ Placeholder/Not supported
    setListUnprocessable,
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
    createQuickList,
  };
};


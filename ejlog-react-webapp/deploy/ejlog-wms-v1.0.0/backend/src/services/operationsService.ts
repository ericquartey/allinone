// ============================================================================
// EJLOG WMS - Operations Service
// Service layer completo per gestione operazioni Picking/Refilling/Inventory
// ============================================================================

import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  PickingOperation,
  PickingList,
  CompletePickingRequest,
  CompletePickingResponse,
  BarcodeValidation,
  OperationFilters,
  OperationStatistics,
  RefillingOperation,
  CompleteRefillingRequest,
  UdcOption,
  CompartmentOption,
} from '../types/operations';

const API_BASE = API_BASE_URL;

// ============================================================================
// PICKING OPERATIONS
// ============================================================================

/**
 * Recupera tutte le operazioni di una lista
 */
export const getListOperations = async (listId: number): Promise<PickingOperation[]> => {
  const response = await axios.get(`${API_BASE}/mission-operations`, {
    params: { itemListId: listId },
  });
  return response.data;
};

/**
 * Recupera dettaglio singola operazione
 */
export const getOperation = async (operationId: number): Promise<PickingOperation> => {
  const response = await axios.get(`${API_BASE}/mission-operations/${operationId}`);
  return response.data;
};

/**
 * Recupera operazioni per macchina/magazzino
 */
export const getMachineOperations = async (
  machineId: number,
  username?: string
): Promise<PickingOperation[]> => {
  const response = await axios.get(`${API_BASE}/machines/${machineId}/mission-operations`, {
    params: { username },
  });
  return response.data;
};

/**
 * Recupera operazioni per UDC
 */
export const getUdcOperations = async (udcId: number): Promise<PickingOperation[]> => {
  const response = await axios.get(`${API_BASE}/loading-units/${udcId}/mission-operations`);
  return response.data;
};

/**
 * Filtra operazioni con parametri avanzati
 */
export const filterOperations = async (filters: OperationFilters): Promise<PickingOperation[]> => {
  const response = await axios.get(`${API_BASE}/mission-operations`, {
    params: filters,
  });
  return response.data;
};

// ============================================================================
// OPERATION COMPLETION
// ============================================================================

/**
 * Completa un'operazione di picking/refilling
 * POST /api/mission-operations/{id}/complete
 */
export const completeOperation = async (
  request: CompletePickingRequest
): Promise<CompletePickingResponse> => {
  const { operationId, ...params } = request;

  const response = await axios.post(
    `${API_BASE}/mission-operations/${operationId}/complete`,
    null,
    {
      params: {
        quantity: params.quantity,
        wastedQuantity: params.wastedQuantity,
        printerName: params.printerName,
        ignoreRemainingQuantity: params.ignoreRemainingQuantity,
        barcode: params.barcode,
        toteBarcode: params.udcBarcode,
        userName: params.userName,
        NrLabels: params.nrLabels,
        fullCompartment: params.compartmentId ? true : false,
      },
    }
  );

  return {
    success: response.status === 200,
    message: 'Operazione completata con successo',
    operationId: operationId,
    listCompleted: false, // Da determinare dal backend
  };
};

// ============================================================================
// BARCODE VALIDATION
// ============================================================================

/**
 * Valida un barcode scansionato contro l'operazione corrente
 */
export const validateBarcode = async (
  operationId: number,
  barcode: string,
  type: 'ITEM' | 'UDC' | 'COMPARTMENT'
): Promise<BarcodeValidation> => {
  try {
    // Recupera l'operazione corrente
    const operation = await getOperation(operationId);

    switch (type) {
      case 'ITEM':
        // Valida barcode articolo
        if (operation.itemBarcode === barcode || operation.itemCode === barcode) {
          return {
            valid: true,
            itemCode: operation.itemCode,
          };
        }
        return {
          valid: false,
          message: `Barcode articolo non valido. Atteso: ${operation.itemBarcode || operation.itemCode}`,
        };

      case 'UDC':
        // Valida barcode UDC
        if (operation.udcBarcode === barcode) {
          return {
            valid: true,
            message: 'UDC confermata',
          };
        }
        return {
          valid: false,
          message: `Barcode UDC non valido. Atteso: ${operation.udcBarcode}`,
        };

      case 'COMPARTMENT':
        // Valida barcode scomparto
        if (operation.compartmentBarcode === barcode) {
          return {
            valid: true,
            message: 'Scomparto confermato',
          };
        }
        return {
          valid: false,
          message: `Barcode scomparto non valido. Atteso: ${operation.compartmentBarcode}`,
        };

      default:
        return {
          valid: false,
          message: 'Tipo barcode non riconosciuto',
        };
    }
  } catch (error: any) {
    return {
      valid: false,
      message: error.response?.data?.message || 'Errore validazione barcode',
    };
  }
};

/**
 * Parse barcode complesso (GS1, EAN128, etc.)
 */
export const parseBarcode = async (barcode: string): Promise<BarcodeValidation> => {
  // TODO: Implementare parsing barcode complessi con regole configurabili
  // Per ora ritorniamo il barcode grezzo
  return {
    valid: true,
    itemCode: barcode,
  };
};

// ============================================================================
// LIST MANAGEMENT
// ============================================================================

/**
 * Recupera dettaglio lista completa con operazioni
 */
export const getListWithOperations = async (listId: number): Promise<PickingList> => {
  // Recupera info lista
  const listResponse = await axios.get(`/EjLogHostVertimag/Lists`, {
    params: {
      limit: 1,
      offset: 0,
      listNumber: listId,
    },
  });

  const listData = listResponse.data.exportedItems?.[0];
  if (!listData) {
    throw new Error('Lista non trovata');
  }

  // Recupera operazioni associate
  const operations = await getListOperations(listId);

  // Calcola statistiche
  const completedOps = operations.filter((op) => op.isCompleted);
  const totalQuantity = operations.reduce((sum, op) => sum + op.requestedQuantity, 0);
  const processedQuantity = operations.reduce((sum, op) => sum + op.processedQuantity, 0);

  return {
    id: listId,
    code: listData.listHeader.listNumber,
    description: listData.listHeader.listDescription || '',
    type: getListTypeString(listData.listHeader.listType),
    status: getListStatusString(listData.listHeader.listStatus),
    priority: listData.listHeader.priority || 50,
    totalRows: operations.length,
    completedRows: completedOps.length,
    totalQuantity,
    processedQuantity,
    progressPercentage: totalQuantity > 0 ? (processedQuantity / totalQuantity) * 100 : 0,
    operations,
    createdAt: new Date().toISOString(), // TODO: Prendere da backend
    createdBy: listData.listHeader.userList || 'system',
    orderNumber: listData.listHeader.orderNumber,
    cause: listData.listHeader.cause,
  };
};

/**
 * Avvia esecuzione lista
 */
export const executeList = async (
  listId: number,
  areaId: number,
  destinationGroupId: number,
  userName: string
): Promise<void> => {
  await axios.post(`${API_BASE}/item-lists/${listId}/execute`, null, {
    params: {
      areaId,
      destinationGroupId,
      userName,
      itemListEvadabilityType: 0, // Default
    },
  });
};

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calcola statistiche operazioni
 */
export const getOperationStatistics = async (
  filters: OperationFilters
): Promise<OperationStatistics> => {
  const operations = await filterOperations(filters);

  const completed = operations.filter((op) => op.isCompleted);
  const pending = operations.filter((op) => !op.isCompleted && op.canBeExecuted);
  const cancelled = operations.filter((op) => !op.isCompleted && !op.canBeExecuted);

  // Calcola tempo medio per operazione
  let totalTime = 0;
  let completedCount = 0;

  completed.forEach((op) => {
    if (op.completedAt && op.createdAt) {
      const start = new Date(op.createdAt).getTime();
      const end = new Date(op.completedAt).getTime();
      totalTime += (end - start) / 1000; // in secondi
      completedCount++;
    }
  });

  const averageTime = completedCount > 0 ? totalTime / completedCount : 0;
  const itemsPerHour = averageTime > 0 ? 3600 / averageTime : 0;

  return {
    totalOperations: operations.length,
    completedOperations: completed.length,
    pendingOperations: pending.length,
    cancelledOperations: cancelled.length,
    averageTimePerOperation: averageTime,
    totalTime,
    itemsPerHour,
    errorRate: 0, // TODO: Calcolare da errori effettivi
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getListTypeString(type: number): 'PICKING' | 'REFILLING' | 'INVENTORY' | 'TRANSFER' {
  switch (type) {
    case 1:
      return 'PICKING';
    case 2:
      return 'REFILLING';
    case 3:
      return 'INVENTORY';
    case 4:
      return 'TRANSFER';
    default:
      return 'PICKING';
  }
}

function getListStatusString(
  status: number
): 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' {
  switch (status) {
    case 0:
      return 'OPEN';
    case 1:
      return 'IN_PROGRESS';
    case 2:
      return 'COMPLETED';
    case 3:
      return 'CANCELLED';
    default:
      return 'OPEN';
  }
}

// ============================================================================
// REFILLING OPERATIONS
// ============================================================================

/**
 * Recupera UDC disponibili per refilling con info scomparti
 */
export const getAvailableUdcsForRefilling = async (
  locationId?: number,
  itemCode?: string
): Promise<UdcOption[]> => {
  try {
    const response = await axios.get(`${API_BASE}/loading-units`, {
      params: {
        locationId,
        itemCode,
        status: 'ACTIVE',
        limit: 50,
      },
    });

    // Trasforma i dati in formato UdcOption
    return response.data.map((udc: any) => ({
      id: udc.id,
      barcode: udc.barcode,
      currentWeight: udc.currentWeight,
      maxWeight: udc.maxWeight,
      fillPercentage: udc.maxWeight > 0 ? (udc.currentWeight / udc.maxWeight) * 100 : 0,
      location: udc.locationCode,
      compartments: udc.compartments?.map((comp: any) => ({
        id: comp.id,
        barcode: comp.barcode,
        position: comp.position,
        currentQuantity: comp.currentQuantity || 0,
        maxQuantity: comp.maxQuantity,
        fillPercentage: comp.maxQuantity > 0 ? (comp.currentQuantity / comp.maxQuantity) * 100 : 0,
        productCode: comp.itemCode,
        lot: comp.lot,
      })) || [],
    }));
  } catch (error: any) {
    console.error('Error fetching UDCs:', error);
    return [];
  }
};

/**
 * Verifica se è possibile fare merge con prodotto esistente in UDC
 */
export const canMergeWithExistingProduct = async (
  udcId: number,
  compartmentId: number,
  itemCode: string,
  lot?: string
): Promise<{ canMerge: boolean; reason?: string; existingQuantity?: number }> => {
  try {
    const response = await axios.get(
      `${API_BASE}/loading-units/${udcId}/compartments/${compartmentId}`
    );

    const compartment = response.data;

    // Verifica se il prodotto è lo stesso
    if (compartment.itemCode !== itemCode) {
      return {
        canMerge: false,
        reason: 'Prodotto diverso nello scomparto',
      };
    }

    // Verifica se il lotto è compatibile
    if (lot && compartment.lot && compartment.lot !== lot) {
      return {
        canMerge: false,
        reason: 'Lotto diverso nello scomparto',
      };
    }

    // Verifica se c'è spazio disponibile
    if (compartment.maxQuantity && compartment.currentQuantity >= compartment.maxQuantity) {
      return {
        canMerge: false,
        reason: 'Scomparto pieno',
      };
    }

    return {
      canMerge: true,
      existingQuantity: compartment.currentQuantity || 0,
    };
  } catch (error: any) {
    return {
      canMerge: false,
      reason: error.response?.data?.message || 'Errore verifica merge',
    };
  }
};

/**
 * Completa operazione di refilling
 */
export const completeRefillingOperation = async (
  request: CompleteRefillingRequest
): Promise<CompletePickingResponse> => {
  const { operationId, destinationUdcId, destinationCompartmentId, mergeWithExisting, ...params } =
    request;

  const response = await axios.post(
    `${API_BASE}/mission-operations/${operationId}/complete`,
    null,
    {
      params: {
        quantity: params.quantity,
        wastedQuantity: params.wastedQuantity,
        printerName: params.printerName,
        ignoreRemainingQuantity: params.ignoreRemainingQuantity,
        barcode: params.barcode,
        toteBarcode: params.udcBarcode,
        userName: params.userName,
        NrLabels: params.nrLabels,
        destinationUdcId,
        destinationCompartmentId,
        mergeWithExisting: mergeWithExisting ? 'true' : 'false',
      },
    }
  );

  return {
    success: response.status === 200,
    message: 'Operazione di refilling completata con successo',
    operationId: operationId,
    listCompleted: false,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

const operationsService = {
  getListOperations,
  getOperation,
  getMachineOperations,
  getUdcOperations,
  filterOperations,
  completeOperation,
  validateBarcode,
  parseBarcode,
  getListWithOperations,
  executeList,
  getOperationStatistics,
  // Refilling
  getAvailableUdcsForRefilling,
  canMergeWithExistingProduct,
  completeRefillingOperation,
};

export default operationsService;

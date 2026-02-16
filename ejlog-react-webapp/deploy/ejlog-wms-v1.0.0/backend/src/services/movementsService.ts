// ============================================================================
// EJLOG WMS - Movements Service
// Gestione movimenti di magazzino (prelievi, ingressi, rettifiche)
// ============================================================================

import { apiClient } from './api/client';

// ============================================================================
// ENUMS E COSTANTI
// ============================================================================

/**
 * Tipi di operazione movimento
 * Fonte: WSMovementsExport.java line 179-182
 */
export enum OperationType {
  PICKING = 1,        // Prelievo
  RECEIVING = 2,      // Ingresso
  ADJUSTMENT = 3,     // Rettifica
  END_OF_LINE = 5,    // Notifica di fine riga
  END_OF_LIST = 6,    // Fine lista
  LIST_EXECUTION = 10, // Lancio lista in esecuzione
  PTL_CONFIRMATION = 11 // Conferma PTL (se gestito PTL)
}

/**
 * Etichette italiane per i tipi operazione
 */
export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OperationType.PICKING]: 'Prelievo',
  [OperationType.RECEIVING]: 'Ingresso',
  [OperationType.ADJUSTMENT]: 'Rettifica',
  [OperationType.END_OF_LINE]: 'Fine Riga',
  [OperationType.END_OF_LIST]: 'Fine Lista',
  [OperationType.LIST_EXECUTION]: 'Lista in Esecuzione',
  [OperationType.PTL_CONFIRMATION]: 'Conferma PTL',
};

// ============================================================================
// TYPES E INTERFACCE
// ============================================================================

/**
 * Movimento di magazzino
 * Fonte: WSMovementsExport.java
 */
export interface Movement {
  id: number;
  plantId: number;
  operationType: OperationType;
  item: string;
  lot?: string | null;
  serialNumber?: string | null;
  expiryDate?: string | null;
  newQty: number;
  oldQty: number;
  deltaQty: number;
  listNumber?: string | null;
  lineNumber?: string | null;
  barcodePtl?: string | null;
  orderNumber?: string | null;
  cause?: string | null;
  noteCause?: string | null;
  userPpc?: string | null;
  userList?: string | null;
  warehouseId?: number | null;
  idLU?: number | null;
  // Campi ausiliari
  auxHostText01?: string | null;
  auxHostText02?: string | null;
  auxHostText03?: string | null;
  auxHostText04?: string | null;
  auxHostText05?: string | null;
  auxHostInt01?: number | null;
  auxHostInt02?: number | null;
  auxHostInt03?: number | null;
  auxHostDate01?: string | null;
  auxHostDate02?: string | null;
  auxHostDate03?: string | null;
  auxHostBit01?: boolean | null;
  auxHostBit02?: boolean | null;
  auxHostBit03?: boolean | null;
  auxHostNum01?: number | null;
  auxHostNum02?: number | null;
  auxHostNum03?: number | null;
}

/**
 * Parametri per la ricerca movimenti
 * Fonte: MovementsApiController.java line 73-79
 */
export interface GetMovementsParams {
  limit: number;           // Limite record caricabili (required, max 5000)
  offset?: number;         // Offset per paginazione
  itemCode?: string;       // Filtro per codice articolo
  operationType?: OperationType; // Filtro per tipo operazione
  numList?: string;        // Filtro per numero lista
  dateFrom?: string;       // Data inizio (formato: yyyyMMddHHmmss)
  dateTo?: string;         // Data fine (formato: yyyyMMddHHmmss)
}

/**
 * Errore API
 */
export interface ApiError {
  errorMessage: string;
  stackTrace?: string;
}

/**
 * Risposta generica API
 */
export interface ApiResponse<T> {
  result: 'OK' | 'NOT OK';
  message?: string;
  data?: T;
  errors?: ApiError[];
}

/**
 * Risposta API Movements
 * Fonte: WSMovementsResponse.java
 */
export interface MovementsResponse {
  result: 'OK' | 'NOT OK';
  message?: string;
  recordNumber?: number;
  exportedItem?: Movement[];
  errors?: ApiError[];
}

// ============================================================================
// FUNZIONI SERVIZIO
// ============================================================================

/**
 * Recupera la lista dei movimenti con filtri
 * GET /Movements
 *
 * @param params - Parametri di ricerca
 * @returns Promise con la lista dei movimenti
 */
export async function getMovements(params: GetMovementsParams): Promise<MovementsResponse> {
  try {
    // Validazione limite (max 5000 come da backend)
    const validLimit = Math.min(params.limit || 100, 5000);

    // Costruzione query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('limit', validLimit.toString());

    if (params.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }

    if (params.itemCode) {
      queryParams.append('itemCode', params.itemCode);
    }

    if (params.operationType !== undefined) {
      queryParams.append('operationType', params.operationType.toString());
    }

    if (params.numList) {
      queryParams.append('numList', params.numList);
    }

    if (params.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom);
    }

    if (params.dateTo) {
      queryParams.append('dateTo', params.dateTo);
    }

    const response = await apiClient.get<MovementsResponse>(
      `/Movements?${queryParams.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching movements:', error);
    throw error;
  }
}

/**
 * Recupera i movimenti per un articolo specifico
 *
 * @param itemCode - Codice articolo
 * @param limit - Numero massimo di movimenti da recuperare
 * @param offset - Offset per paginazione
 * @returns Promise con la lista dei movimenti dell'articolo
 */
export async function getMovementsByItem(
  itemCode: string,
  limit: number = 100,
  offset: number = 0
): Promise<MovementsResponse> {
  return getMovements({
    limit,
    offset,
    itemCode,
  });
}

/**
 * Recupera i movimenti per una lista specifica
 *
 * @param numList - Numero lista
 * @param limit - Numero massimo di movimenti da recuperare
 * @param offset - Offset per paginazione
 * @returns Promise con la lista dei movimenti della lista
 */
export async function getMovementsByList(
  numList: string,
  limit: number = 100,
  offset: number = 0
): Promise<MovementsResponse> {
  return getMovements({
    limit,
    offset,
    numList,
  });
}

/**
 * Recupera solo i movimenti di rettifica (adjustments)
 *
 * @param params - Parametri di ricerca aggiuntivi
 * @returns Promise con la lista delle rettifiche
 */
export async function getAdjustments(
  params: Omit<GetMovementsParams, 'operationType'>
): Promise<MovementsResponse> {
  return getMovements({
    ...params,
    operationType: OperationType.ADJUSTMENT,
  });
}

/**
 * Recupera solo i movimenti di prelievo (picking)
 *
 * @param params - Parametri di ricerca aggiuntivi
 * @returns Promise con la lista dei prelievi
 */
export async function getPickingMovements(
  params: Omit<GetMovementsParams, 'operationType'>
): Promise<MovementsResponse> {
  return getMovements({
    ...params,
    operationType: OperationType.PICKING,
  });
}

/**
 * Recupera solo i movimenti di ingresso (receiving)
 *
 * @param params - Parametri di ricerca aggiuntivi
 * @returns Promise con la lista degli ingressi
 */
export async function getReceivingMovements(
  params: Omit<GetMovementsParams, 'operationType'>
): Promise<MovementsResponse> {
  return getMovements({
    ...params,
    operationType: OperationType.RECEIVING,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formatta una data in formato backend (yyyyMMddHHmmss)
 *
 * @param date - Data da formattare
 * @returns Stringa formattata
 */
export function formatDateForBackend(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Parsifica una data dal formato backend (yyyyMMddHHmmss o ISO)
 *
 * @param dateString - Stringa data dal backend
 * @returns Data parsificata o null
 */
export function parseDateFromBackend(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  // Prova prima formato ISO
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Formato backend: yyyyMMddHHmmss (14 caratteri)
  if (dateString.length === 14) {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(dateString.substring(6, 8));
    const hours = parseInt(dateString.substring(8, 10));
    const minutes = parseInt(dateString.substring(10, 12));
    const seconds = parseInt(dateString.substring(12, 14));

    return new Date(year, month, day, hours, minutes, seconds);
  }

  return null;
}

/**
 * Ottiene l'etichetta italiana per un tipo operazione
 *
 * @param operationType - Tipo operazione
 * @returns Etichetta in italiano
 */
export function getOperationTypeLabel(operationType: OperationType): string {
  return OPERATION_TYPE_LABELS[operationType] || 'Sconosciuto';
}

/**
 * Ottiene il colore badge per un tipo operazione
 *
 * @param operationType - Tipo operazione
 * @returns Classe colore Tailwind
 */
export function getOperationTypeColor(operationType: OperationType): string {
  switch (operationType) {
    case OperationType.PICKING:
      return 'bg-blue-100 text-blue-800';
    case OperationType.RECEIVING:
      return 'bg-green-100 text-green-800';
    case OperationType.ADJUSTMENT:
      return 'bg-orange-100 text-orange-800';
    case OperationType.END_OF_LINE:
    case OperationType.END_OF_LIST:
      return 'bg-gray-100 text-gray-800';
    case OperationType.LIST_EXECUTION:
      return 'bg-purple-100 text-purple-800';
    case OperationType.PTL_CONFIRMATION:
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Formatta la quantità delta con segno
 *
 * @param deltaQty - Quantità delta
 * @returns Stringa formattata con segno
 */
export function formatDeltaQty(deltaQty: number): string {
  if (deltaQty > 0) {
    return `+${deltaQty.toFixed(2)}`;
  } else if (deltaQty < 0) {
    return deltaQty.toFixed(2);
  }
  return '0.00';
}

/**
 * Ottiene la classe colore per la quantità delta
 *
 * @param deltaQty - Quantità delta
 * @returns Classe colore Tailwind
 */
export function getDeltaQtyColor(deltaQty: number): string {
  if (deltaQty > 0) {
    return 'text-green-600';
  } else if (deltaQty < 0) {
    return 'text-red-600';
  }
  return 'text-gray-600';
}

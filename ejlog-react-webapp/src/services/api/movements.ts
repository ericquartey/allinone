import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { Movement, PaginationParams, ApiResponse } from '@/types/api';

/**
 * Movements Filter Parameters
 */
interface MovementsFilterParams extends PaginationParams {
  articleId?: string;
  fromDate?: string;
  toDate?: string;
  movementType?: string;
}

/**
 * Backend Movement Response (from WSMovementsExport)
 */
interface BackendMovement {
  id?: number;
  auxHostDate01?: string;
  item?: string;
  deltaQty?: number;
  oldQty?: number;
  newQty?: number;
  cause?: string;
  operationType?: number;
  listNumber?: string;
  lineNumber?: string;
  lot?: string;
  serialNumber?: string;
  idLU?: number;
  orderNumber?: string;
  userPpc?: string;
  userList?: string;
  warehouseId?: number;
  plantId?: number;
  noteCause?: string;
}

/**
 * Backend API Response
 */
interface BackendApiResponse {
  result?: string;
  message?: string;
  recordNumber?: number;
  exported?: BackendMovement[];
  errors?: any[];
}

/**
 * Transform backend movement to frontend Movement type
 */
const transformMovement = (backendMov: BackendMovement): Movement => {
  // Use item code from backend (no mock data)
  return {
    id: backendMov.id,
    data: backendMov.auxHostDate01,
    articleId: backendMov.item,
    item: backendMov.item ? {
      codice: backendMov.item,
      descrizione: backendMov.item, // Backend should provide description if needed
      um: 'PZ' // Default unit
    } : undefined,
    quantity: backendMov.deltaQty,
    oldQty: backendMov.oldQty,
    newQty: backendMov.newQty,
    movementType: backendMov.cause,
    tipoMovimento: backendMov.cause,
    operationType: backendMov.operationType,
    listNumber: backendMov.listNumber,
    lineNumber: backendMov.lineNumber,
    lot: backendMov.lot,
    lotto: backendMov.lot,
    serialNumber: backendMov.serialNumber,
    locationId: backendMov.idLU?.toString(),
    location: backendMov.idLU ? {
      codice: `UDC-${backendMov.idLU}`
    } : undefined,
    orderNumber: backendMov.orderNumber,
    user: backendMov.userPpc || backendMov.userList,
    utente: backendMov.userPpc || backendMov.userList,
    userPpc: backendMov.userPpc,
    userList: backendMov.userList,
    warehouseId: backendMov.warehouseId,
    plantId: backendMov.plantId,
    noteCause: backendMov.noteCause,
  };
};

/**
 * Movements API Service
 * Handles movement/transaction operations
 */
export const movementsService = {
  /**
   * Get movements with filters
   * @param params - Filter and pagination parameters
   * @returns Promise<ApiResponse<Movement>> - Movements data
   */
  getMovements: async (params: MovementsFilterParams = {}): Promise<ApiResponse<Movement>> => {
    const {
      skip = 0,
      take = 50,
      orderBy = undefined,
      articleId = undefined,
      fromDate = undefined,
      toDate = undefined,
      movementType = undefined
    } = params;

    // Backend uses 'limit' and 'offset' instead of 'take' and 'skip'
    const queryParams: Record<string, any> = {
      limit: take,
      offset: skip
    };
    if (articleId !== undefined) queryParams.itemCode = articleId;
    if (fromDate) queryParams.dateFrom = fromDate;
    if (toDate) queryParams.dateTo = toDate;
    if (movementType !== undefined) queryParams.operationType = movementType;
    if (orderBy) queryParams.orderBy = orderBy;

    const response = await apiClient.get<BackendApiResponse>(
      API_ENDPOINTS.MOVEMENTS,
      { params: queryParams }
    );

    // Transform backend response to frontend format
    const backendData = response.data;
    const movements = (backendData.exported || []).map(transformMovement);

    return {
      exported: movements,
      recordNumber: backendData.recordNumber || movements.length,
      message: backendData.message,
      errors: backendData.errors
    };
  },
};

export default movementsService;

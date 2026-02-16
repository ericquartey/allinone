// src/services/drawersApi.ts

import { apiClient } from './api/client';
import type {
  LoadingUnit,
  Compartment,
  LoadingUnitsResponse,
  CompartmentsResponse,
  CreateLoadingUnitRequest,
  UpdateLoadingUnitRequest,
  UpdateCompartmentFillPercentageRequest,
  BoxToCompartmentRequest,
  CreateCompartmentRequest,
  DrawerFilters,
  CompartmentFilters,
  CallLoadingUnitResponse,
  DestinationLocation
} from '../types/drawers';

const API_BASE_PATH = '/EjLogHostVertimag/api';
const NODE_EJLOG_BASE_PATH = '/api/EjLogHostVertimag/api';

/**
 * API Client for Loading Units (Drawers/UDC/Cassetti) and Compartments (Supporti/Scomparti)
 * Based on Swagger endpoints from ejlog.json
 */
export const drawersApi = {
  // ================== Loading Units (Drawers) ==================

  /**
   * Get all loading units with optional filters - USES REAL DATABASE DATA
   */
  getAllLoadingUnits: async (filters?: DrawerFilters): Promise<LoadingUnitsResponse> => {
    const params = new URLSearchParams();
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    if (filters?.search) params.append('search', filters.search);

    console.log('[drawersApi] Fetching UDC from REAL database via /api/udc:', Object.fromEntries(params));

    const response = await apiClient.get<any>(`/api/udc`, {
      params,
      headers: { 'Accept': 'application/json' }
    });

    console.log('[drawersApi] UDC response from database:', response.data);

    const extractItems = (payload: any): any[] => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.data)) return payload.data;
      if (payload.data) return extractItems(payload.data);
      if (payload.result) return extractItems(payload.result);
      return [];
    };
    const items = extractItems(response.data);
    const total =
      response.data?.total ??
      response.data?.totalCount ??
      response.data?.count ??
      response.data?.data?.total ??
      response.data?.data?.totalCount ??
      response.data?.data?.count ??
      (Array.isArray(items) ? items.length : 0);

    // Map real database fields to frontend LoadingUnit interface
    const mappedItems: LoadingUnit[] = items.map(item => ({
      id: item.id,
      code: item.numeroUdc || item.id?.toString() || '',
      barcode: item.barcode,
      description: item.descrizione || '',
      warehouseId: item.idMagazzino || 1,
      width: item.larghezza || 0,
      depth: item.profondita || 0,
      height: item.altezza || 0,
      compartmentCount: item.numSupporti || 0,
      emptyCompartmentCount: (item.numSupporti || 0) - (item.numProdotti || 0), // Calculate empty compartments
      isBlocked: item.bloccataManualmente || item.bloccataPerCriterio || false,
      weight: item.peso || 0,
      productsCount: item.numProdotti || 0,
      lastMovement: item.dataUltimaMovimentazione,
      locationCode: item.idLocazione ? `LOC-${item.idLocazione}` : undefined,
      ...item  // Include all other database fields
    }));

    console.log('[drawersApi] Mapped real database items:', mappedItems);

    return {
      items: mappedItems,
      totalCount: total
    };
  },

  /**
   * Get a single loading unit by ID
   */
  getLoadingUnitById: async (id: number): Promise<LoadingUnit> => {
    const response = await apiClient.get<LoadingUnit>(`${API_BASE_PATH}/loading-units/${id}`, {
      headers: { 'Accept': 'application/json' }
    });

    return response.data;
  },

  /**
   * Create a new loading unit
   */
  createLoadingUnit: async (data: CreateLoadingUnitRequest): Promise<LoadingUnit> => {
    const response = await apiClient.put<LoadingUnit>(`${API_BASE_PATH}/loading-units`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return response.data;
  },

  /**
   * Update an existing loading unit
   */
  updateLoadingUnit: async (id: number, data: UpdateLoadingUnitRequest): Promise<LoadingUnit> => {
    const response = await apiClient.patch<LoadingUnit>(`${API_BASE_PATH}/loading-units/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return response.data;
  },

  /**
   * Delete a loading unit
   */
  deleteLoadingUnit: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_BASE_PATH}/loading-units/${id}`, {
      headers: { 'Accept': 'application/json' }
    });
  },

  /**
   * Call (richiama) a loading unit to a specific location
   */
  callLoadingUnit: async (id: number, destinationId?: number): Promise<CallLoadingUnitResponse> => {
    const params = new URLSearchParams();
    if (destinationId !== undefined) {
      params.append('destinationId', destinationId.toString());
    }

    const response = await apiClient.post<CallLoadingUnitResponse>(
      `${NODE_EJLOG_BASE_PATH}/loading-units/${id}/call`,
      null,
      {
        params,
        headers: { 'Accept': 'application/json' }
      }
    );

    return response.data;
  },

  /**
   * Get destination locations (Locazioni) for drawer call
   */
  getDestinationLocations: async (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DestinationLocation[]> => {
    const response = await apiClient.get<{ success?: boolean; data?: DestinationLocation[] }>(
      `/api/locations`,
      {
        params: {
          search: params?.search,
          limit: params?.limit,
          offset: params?.offset,
        },
        headers: { 'Accept': 'application/json' },
      }
    );

    if (response.data?.success === false) {
      return [];
    }

    return response.data?.data || [];
  },

  // ================== Compartments ==================

  /**
   * Get all compartments for a specific loading unit - USES REAL DATABASE DATA
   */
  getCompartmentsByLoadingUnit: async (loadingUnitId: number, filters?: CompartmentFilters): Promise<CompartmentsResponse> => {
    console.log(`[drawersApi] Fetching compartments for UDC ${loadingUnitId} from /api/udc/${loadingUnitId}/compartments`);

    // First, fetch the UDC to get its dimensions
    const udcResponse = await apiClient.get<{ data: any[] }>(`/api/udc`, {
      params: { limit: 1, offset: 0 },
      headers: { 'Accept': 'application/json' }
    });

    // Find the specific UDC
    let udcWidth = 1950; // Default width in mm
    let udcDepth = 650;  // Default depth in mm

    if (udcResponse.data?.data) {
      const udc = udcResponse.data.data.find((u: any) => u.id === loadingUnitId);
      if (udc) {
        udcWidth = udc.larghezza || 1950;
        udcDepth = udc.profondita || 650;
        console.log(`[drawersApi] UDC ${loadingUnitId} dimensions: ${udcWidth}mm × ${udcDepth}mm`);
      }
    }

    const response = await apiClient.get<any>(
      `/api/udc/${loadingUnitId}/compartments`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    console.log('[drawersApi] Compartments response:', response.data);

    const extractItems = (payload: any): any[] => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.data)) return payload.data;
      if (payload.data) return extractItems(payload.data);
      if (payload.result) return extractItems(payload.result);
      return [];
    };
    // Backend may return { data: [...] } or a raw array
    const items = extractItems(response.data);
    const total =
      response.data?.total ??
      response.data?.totalCount ??
      response.data?.count ??
      response.data?.data?.total ??
      response.data?.data?.totalCount ??
      response.data?.data?.count ??
      (Array.isArray(items) ? items.length : 0);

    // Map real database fields to frontend Compartment interface
    // IMPORTANT: posX, posY, dimX, dimY use NORMALIZED COORDINATES (0-1000000 microns)
    // These values represent fractions of the total UDC dimensions:
    // - 1000000 µm = 100% of the UDC dimension
    // - Example: dimX=333320 µm = 33.332% of UDC width
    //
    // Formula: absolute_value = (normalized_value / 1000000) * udc_dimension
    const NORMALIZATION_FACTOR = 1000000;

const readNumber = (obj: any, keys: string[]) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
  }
  return null;
};

const readText = (obj: any, keys: string[]) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return null;
};

const resolveAxis = (raw: number | null, total: number) => {
  if (raw === null || raw === undefined || !Number.isFinite(raw)) return 0;
  if (total > 0 && raw <= total * 2) return Math.round(raw);
  return Math.round((raw / NORMALIZATION_FACTOR) * total);
};

const resolveSize = (raw: number | null, total: number, fallback: number | null) => {
  if (raw !== null && raw !== undefined && Number.isFinite(raw)) {
    return resolveAxis(raw, total);
  }
  if (fallback !== null && fallback !== undefined && Number.isFinite(fallback)) {
    return Math.round(fallback);
  }
  return 0;
};

const mappedItems: Compartment[] = items.map(item => {
  const articleCode = readText(item, [
    'articleCode',
    'ArticleCode',
    'codiceArticolo',
    'CodiceArticolo',
    'itemCode',
    'ItemCode'
  ]);
  const articleDescription = readText(item, [
    'articleDescription',
    'ArticleDescription',
    'descrizioneArticolo',
    'DescrizioneArticolo'
  ]);
  const quantity = readNumber(item, [
    'qtaProdotti',
    'QtaProdotti',
    'quantity',
    'Quantity',
    'stockedQuantity',
    'StockedQuantity'
  ]);

  const products = [];
  if (articleCode) {
    products.push({
      id: item.idArticoloOmogeneo ?? item.idArticolo ?? 0,
      item: {
        code: articleCode,
        description: articleDescription || 'Nessuna descrizione',
      },
      stockedQuantity: quantity ?? 0,
      lot: readText(item, ['aggregazione1', 'lot', 'lotCode']) || null,
      serialNumber: readText(item, ['aggregazione2', 'serialNumber']) || null,
      sscc: readText(item, ['auxTesto01', 'sscc']) || null,
      expirationDate: readText(item, ['auxData01', 'expirationDate']) || null,
      weight: readNumber(item, ['peso', 'weight']) ?? null,
    });
  }

  const posXRaw = readNumber(item, ['posX', 'posx', 'PosX', 'x', 'X']);
  const posYRaw = readNumber(item, ['posY', 'posy', 'PosY', 'y', 'Y']);
  const dimXRaw = readNumber(item, ['dimX', 'dimx', 'DimX']);
  const dimYRaw = readNumber(item, ['dimY', 'dimy', 'DimY']);
  const widthFallback = readNumber(item, ['larghezza', 'Larghezza', 'width', 'Width']);
  const depthFallback = readNumber(item, ['profondita', 'Profondita', 'depth', 'Depth']);

  const fillPercentage = readNumber(item, [
    'pctRiempimento',
    'PctRiempimento',
    'pctriempimento',
    'fillPercentage',
    'fillPercent'
  ]) ?? 0;

  return {
    id: item.id,
    barcode: item.barcode || item.coordinate || '',
    xPosition: resolveAxis(posXRaw, udcWidth),
    yPosition: resolveAxis(posYRaw, udcDepth),
    width: resolveSize(dimXRaw, udcWidth, widthFallback),
    depth: resolveSize(dimYRaw, udcDepth, depthFallback),
    fillPercentage,
    loadingUnitId: readNumber(item, ['idUdc', 'idUDC', 'udcId', 'loadingUnitId']) ?? loadingUnitId,
    products,
    description: item.descrizione || item.description || `Cassetto ${item.coordinate}`,
    row: item.riga ?? item.row,
    column: item.colonna ?? item.column,
    progressive: item.progressivo,
    weight: item.peso ?? item.weight,
    tare: item.tara ?? item.tare,
    maxProducts: item.maxProdotti ?? item.maxProducts,
    maxQuantity: item.maxQtaProdotti ?? item.maxQuantity,
    currentQuantity: quantity ?? 0,
    isBlocked: item.bloccatoManualmente || item.bloccatoPerCriterio || item.isBlocked || false,
    isReserved: (item.numeroPrenotazioni ?? item.reservationCount ?? 0) > 0,
    reservationCount: item.numeroPrenotazioni ?? item.reservationCount ?? 0,
    lastModified: item.dataModificaContenuto || item.lastModified,
    lastInventory: item.dataUltimoInventario || item.lastInventory,
    articleCode,
    articleDescription,
    ...item
  };
});

console.log('[drawersApi] Mapped compartments with UDC dimensions:', mappedItems);
    console.log(`[drawersApi] Total compartment width: ${mappedItems.reduce((sum, c) => sum + c.width, 0)}mm (UDC width: ${udcWidth}mm)`);

    // Debug: Log products for each compartment
    mappedItems.forEach((comp, idx) => {
      if (comp.products && comp.products.length > 0) {
        console.log(`[drawersApi] Compartment ${idx + 1} (ID: ${comp.id}) has ${comp.products.length} product(s):`, comp.products);
      } else if (comp.articleCode) {
        console.warn(`[drawersApi] Compartment ${idx + 1} (ID: ${comp.id}) has articleCode="${comp.articleCode}" but NO products array!`);
      }
    });

    return {
      items: mappedItems,
      totalCount: total
    };
  },

  /**
   * Update compartment fill percentage
   */
  updateCompartmentFillPercentage: async (
    compartmentId: number,
    percentage: number
  ): Promise<Compartment> => {
    const params = new URLSearchParams();
    params.append('percentage', percentage.toString());

    const response = await apiClient.put<Compartment>(
      `${API_BASE_PATH}/compartments/${compartmentId}/fill-percentage`,
      null,
      {
        params,
        headers: { 'Accept': 'application/json' }
      }
    );

    return response.data;
  },

  /**
   * Box to compartment operation
   */
  boxToCompartment: async (
    compartmentId: number,
    request: BoxToCompartmentRequest
  ): Promise<Compartment> => {
    const params = new URLSearchParams();
    if (request.barcode) params.append('barcode', request.barcode);
    if (request.command !== undefined) params.append('command', request.command.toString());

    const response = await apiClient.put<Compartment>(
      `${API_BASE_PATH}/compartments/${compartmentId}/box-to-compartment`,
      null,
      {
        params,
        headers: { 'Accept': 'application/json' }
      }
    );

    return response.data;
  },

  /**
   * Create a new compartment for a loading unit
   */
  createCompartment: async (
    loadingUnitId: number,
    request: CreateCompartmentRequest
  ): Promise<Compartment> => {
    const params = new URLSearchParams();
    params.append('xPosition', request.xPosition.toString());
    params.append('yPosition', request.yPosition.toString());
    params.append('width', request.width.toString());
    params.append('depth', request.depth.toString());

    const response = await apiClient.post<Compartment>(
      `${API_BASE_PATH}/loading-units/${loadingUnitId}/compartments`,
      null,
      {
        params,
        headers: { 'Accept': 'application/json' }
      }
    );

    return response.data;
  },

  // ================== Mission Operations ==================

  /**
   * Get all mission operations for a loading unit
   */
  getMissionOperationsByLoadingUnit: async (loadingUnitId: number): Promise<any[]> => {
    const response = await apiClient.get(
      `${API_BASE_PATH}/loading-units/${loadingUnitId}/mission-operations`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    return response.data;
  },

  // ================== Utility Methods ==================

  /**
   * Get fill percentage color based on value
   */
  getFillPercentageColor: (percentage: number): string => {
    // Gradiente continuo da verde chiaro (0%) a rosso scuro (100%)
    // Più è pieno, più il colore è scuro
    if (percentage === 0) return '#f0fdf4'; // green-50 (completamente vuoto)
    if (percentage < 10) return '#dcfce7'; // green-100 (quasi vuoto)
    if (percentage < 20) return '#bbf7d0'; // green-200
    if (percentage < 30) return '#86efac'; // green-300
    if (percentage < 40) return '#fef9c3'; // yellow-100 (inizio riempimento significativo)
    if (percentage < 50) return '#fef08a'; // yellow-200
    if (percentage < 60) return '#fde047'; // yellow-300
    if (percentage < 70) return '#fed7aa'; // orange-200 (più della metà pieno)
    if (percentage < 80) return '#fdba74'; // orange-300
    if (percentage < 90) return '#fb923c'; // orange-400
    if (percentage < 95) return '#f97316'; // orange-500
    if (percentage < 100) return '#ea580c'; // orange-600 (quasi pieno)
    return '#dc2626'; // red-600 (completamente pieno)
  },

  /**
   * Get fill percentage label
   */
  getFillPercentageLabel: (percentage: number): string => {
    if (percentage === 0) return 'Vuoto';
    if (percentage < 25) return 'Basso';
    if (percentage < 50) return 'Medio-Basso';
    if (percentage < 75) return 'Medio-Alto';
    if (percentage < 100) return 'Alto';
    return 'Pieno';
  }
};

export default drawersApi;

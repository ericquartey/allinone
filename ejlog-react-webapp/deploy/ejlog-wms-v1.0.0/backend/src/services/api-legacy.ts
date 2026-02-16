/**
 * Servizio API Centralizzato per EjLog Backend
 * Base URL: http://localhost:3079/EjLogHostVertimag
 *
 * Questo servizio mappa le funzionalità del sistema Java Swing
 * alle API REST del backend, utilizzando il database reale.
 */

// Use relative URL in development to leverage Vite proxy (CORS bypass)
const BASE_URL = import.meta.env.DEV
  ? '/api/EjLogHostVertimag'  // Development: use Vite proxy with /api prefix
  : 'http://localhost:3079/EjLogHostVertimag';  // Production: full URL

const API_TIMEOUT = 30000;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface APIResponse<T> {
  result: string;
  recordNumber?: number;
  message?: string;
  exportedItems?: T[];
  errors?: APIError[];
}

export interface APIError {
  errorCode: number;
  errorMessage: string;
  description?: string;
  stackTrace?: string;
}

// Items Types
export interface Item {
  code: string;
  description: string;
  shortDescription?: string;
  barcode?: string;
  measurementUnit?: string;
  weight?: number;
  minimumStock?: number;
  height?: number;
  width?: number;
  depth?: number;
  unitPrice?: number;
  itemTypeManagement?: number;
  itemCategory?: string;
  fifoRangeDays?: number;
  inStock?: boolean;
  understock?: boolean;
  itemTypeBatch?: string;
  itemTypeSerialNumber?: string;
  auxHostText01?: string;
  auxHostInt01?: number | null;
  auxHostDate01?: string | null;
  auxHostBit01?: boolean | null;
  auxHostNum01?: number | null;
}

export interface ItemCommand {
  item: string;
  command: 1 | 2; // 1=Insert/Update, 2=Delete
  description?: string;
  shortDescription?: string;
  barcode?: string;
  measurementUnit?: string;
  weight?: number;
  minimumStock?: number;
  height?: number;
  width?: number;
  depth?: number;
  unitPrice?: number;
  itemTypeManagement?: number;
  itemCategory?: string;
  fifoRangeDays?: number;
  auxHostText01?: string;
  auxHostInt01?: number | null;
  auxHostDate01?: string | null;
  auxHostBit01?: boolean | null;
  auxHostNum01?: number | null;
}

// Lists Types
export interface ListHeader {
  listNumber: string;
  listDescription?: string;
  listType: 0 | 1 | 2; // 0=Picking, 1=Refilling, 2=Inventory
  listStatus: 1 | 2 | 3; // 1=Waiting, 2=InProgress, 3=Completed
  cause?: string;
  orderNumber?: string;
  priority?: number;
  exitPoint?: string;
  selectedWarehouses?: number[];
  auxHostText01?: string;
  auxHostInt01?: number | null;
}

export interface ListRow {
  listNumber?: string;
  rowNumber: string;
  item: string;
  lineDescription?: string;
  requestedQty: number;
  processedQty?: number;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string | null;
  barcodePtl?: string;
  rowSequence?: number;
}

export interface List {
  listHeader: ListHeader;
  listRows: ListRow[];
}

export interface ListCommand {
  listHeader: ListHeader & { command: 1 | 2 | 3 | 4 }; // 1=New, 2=Delete, 3=UpdateHeader, 4=UpdateRows
  listRows?: ListRow[];
}

// Stock Types
export interface Stock {
  item: string;
  description?: string;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  qty: number;
  warehouseId: number;
  LU?: number; // Unità di carico
}

// Movements Types
export interface Movement {
  id: number;
  plantId?: number;
  listNumber?: string;
  lineNumber?: string;
  operationType: number;
  item: string;
  serialNumber?: string;
  expiryDate?: string;
  newQty: number;
  oldQty: number;
  deltaQty: number;
  barcodePtl?: string;
  orderNumber?: string;
  cause?: string;
  noteCause?: string;
  userPpc?: string;
  userList?: string;
  warehouseId: number;
  idLU?: number;
}

// Orders Types
export interface Order {
  order: string;
  description: string;
}

export interface OrderCommand {
  order: string;
  command: 1 | 2; // 1=Insert/Update, 2=Delete
  description: string;
}

// Barcodes Types
export interface Barcode {
  item: string;
  barccodes: string[]; // Typo nel backend: "barccodes" invece di "barcodes"
}

export interface BarcodeCommand {
  item: string;
  barcode: string;
  command: 1 | 2; // 1=Insert, 2=Delete
}

// User Types
export interface User {
  userName: string;
  accessLevel: number;
  description?: string;
  lockPpcLogin: boolean;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  /**
   * Generic fetch wrapper with timeout and error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Authentication failed');
        }
        if (response.status === 404) {
          throw new Error('Resource not found');
        }
        if (response.status === 400) {
          throw new Error('Bad request - check parameters');
        }
        if (response.status === 500) {
          throw new Error('Internal server error');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  // ==========================================================================
  // ITEMS API - Gestione Articoli (AnagraficaArticoloPanel)
  // ==========================================================================

  /**
   * Get items list with pagination and filters
   * Maps to: AnagraficaArticoloPanel functionality
   */
  async getItems(params: {
    limit: number;
    offset?: number;
    itemCode?: string;
  }): Promise<APIResponse<Item>> {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.itemCode && { itemCode: params.itemCode }),
    });

    return this.fetch<APIResponse<Item>>(`/Items?${query}`);
  }

  /**
   * Import/Update/Delete items
   * Maps to: AnagraficaArticoloModificaPanel functionality
   */
  async manageItems(items: ItemCommand[]): Promise<APIResponse<any>> {
    return this.fetch<APIResponse<any>>('/Items', {
      method: 'POST',
      body: JSON.stringify(items),
    });
  }

  // ==========================================================================
  // LISTS API - Gestione Liste (GestioneListePanel)
  // ==========================================================================

  /**
   * Get lists with filters
   * Maps to: GestioneListePanel functionality
   */
  async getLists(params: {
    limit: number;
    offset?: number;
    listNumber?: string;
    listType?: 0 | 1 | 2;
    listStatus?: 1 | 2 | 3;
  }): Promise<APIResponse<List>> {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.listNumber && { listNumber: params.listNumber }),
      ...(params.listType !== undefined && { listType: params.listType.toString() }),
      ...(params.listStatus !== undefined && { listStatus: params.listStatus.toString() }),
    });

    return this.fetch<APIResponse<List>>(`/Lists?${query}`);
  }

  /**
   * Create/Update/Delete lists
   * Maps to: GestioneListeModificaPanel functionality
   */
  async manageLists(lists: ListCommand[]): Promise<APIResponse<any>> {
    return this.fetch<APIResponse<any>>('/Lists', {
      method: 'POST',
      body: JSON.stringify(lists),
    });
  }

  // ==========================================================================
  // STOCK API - Giacenze Magazzino
  // ==========================================================================

  /**
   * Get stock/inventory data
   * Maps to: Stock visualization panels
   */
  async getStock(params: {
    limit: number;
    offset?: number;
    warehouseId?: number;
    itemCode?: string;
    lot?: string;
    serialNumber?: string;
    expiryDate?: string; // Format: yyyyMMdd
    trayId?: number;
    groupByTray?: boolean;
  }): Promise<APIResponse<Stock>> {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.warehouseId !== undefined && { warehouseId: params.warehouseId.toString() }),
      ...(params.itemCode && { itemCode: params.itemCode }),
      ...(params.lot && { lot: params.lot }),
      ...(params.serialNumber && { serialNumber: params.serialNumber }),
      ...(params.expiryDate && { expiryDate: params.expiryDate }),
      ...(params.trayId !== undefined && { trayId: params.trayId.toString() }),
      ...(params.groupByTray !== undefined && { groupByTray: params.groupByTray.toString() }),
    });

    return this.fetch<APIResponse<Stock>>(`/Stock?${query}`);
  }

  // ==========================================================================
  // MOVEMENTS API - Movimenti Magazzino
  // ==========================================================================

  /**
   * Get warehouse movements
   * Maps to: Movements visualization panels
   */
  async getMovements(params: {
    limit: number;
    offset?: number;
    itemCode?: string;
    operationType?: number;
    numList?: string;
    dateFrom?: string; // Format: yyyyMMddHHmmss
    dateTo?: string; // Format: yyyyMMddHHmmss
  }): Promise<APIResponse<Movement>> {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.itemCode && { itemCode: params.itemCode }),
      ...(params.operationType !== undefined && { operationType: params.operationType.toString() }),
      ...(params.numList && { numList: params.numList }),
      ...(params.dateFrom && { dateFrom: params.dateFrom }),
      ...(params.dateTo && { dateTo: params.dateTo }),
    });

    return this.fetch<APIResponse<Movement>>(`/Movements?${query}`);
  }

  // ==========================================================================
  // ORDERS API - Gestione Commesse
  // ==========================================================================

  /**
   * Get orders list
   */
  async getOrders(params: {
    limit: number;
    offset?: number;
    order?: string;
  }): Promise<APIResponse<Order>> {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.order && { order: params.order }),
    });

    return this.fetch<APIResponse<Order>>(`/Orders?${query}`);
  }

  /**
   * Import/Update/Delete orders
   */
  async manageOrders(orders: OrderCommand[]): Promise<APIResponse<any>> {
    return this.fetch<APIResponse<any>>('/Orders', {
      method: 'POST',
      body: JSON.stringify(orders),
    });
  }

  // ==========================================================================
  // BARCODES API - Gestione Barcode
  // ==========================================================================

  /**
   * Get barcodes
   */
  async getBarcodes(params: {
    limit: number;
    offset?: number;
    itemCode?: string;
  }): Promise<APIResponse<Barcode>> {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.itemCode && { itemCode: params.itemCode }),
    });

    return this.fetch<APIResponse<Barcode>>(`/Barcodes?${query}`);
  }

  /**
   * Import/Delete barcodes
   */
  async manageBarcodes(barcodes: BarcodeCommand[]): Promise<APIResponse<any>> {
    return this.fetch<APIResponse<any>>('/Barcodes', {
      method: 'POST',
      body: JSON.stringify(barcodes),
    });
  }

  // ==========================================================================
  // USER API - Gestione Utenti
  // ==========================================================================

  /**
   * Get users list
   * Maps to: GestioneUtentiPanel functionality
   */
  async getUsers(username?: string): Promise<User[]> {
    const query = username ? `?username=${username}` : '';
    return this.fetch<User[]>(`/User${query}`);
  }

  /**
   * User authentication
   * Maps to: Login functionality (new endpoint)
   */
  async login(username: string, password: string): Promise<User> {
    return this.fetch<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Test endpoint connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetch('/test');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format date for API (yyyyMMdd)
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Format datetime for API (yyyyMMddHHmmss)
   */
  static formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parse API date (yyyyMMdd) to Date
   */
  static parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.length !== 8) return null;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  /**
   * Parse API datetime (yyyyMMddHHmmss) to Date
   */
  static parseDateTime(dateTimeStr: string): Date | null {
    if (!dateTimeStr || dateTimeStr.length !== 14) return null;
    const year = parseInt(dateTimeStr.substring(0, 4));
    const month = parseInt(dateTimeStr.substring(4, 6)) - 1;
    const day = parseInt(dateTimeStr.substring(6, 8));
    const hours = parseInt(dateTimeStr.substring(8, 10));
    const minutes = parseInt(dateTimeStr.substring(10, 12));
    const seconds = parseInt(dateTimeStr.substring(12, 14));
    return new Date(year, month, day, hours, minutes, seconds);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const api = new APIClient();
export default api;


/**
 * Stock/Products Type Definitions
 * Based on real data from backend API: GET /Stock
 */

/**
 * Stock item as returned by the backend API
 */
export interface StockItem {
  /** Warehouse ID */
  warehouseId: number;
  /** Item code */
  item: string;
  /** Item description */
  description: string;
  /** Lot number */
  lot: string;
  /** Serial number */
  serialNumber: string;
  /** Expiry date (formatted as yyyy-MM-dd) */
  expiryDate: string | null;
  /** Quantity available */
  qty: number;
  /** Loading Unit ID */
  LU: number | null;
  /** Deprecated: same as LU */
  lu?: number | null;
}

/**
 * Stock API Response wrapper
 */
export interface StockResponse {
  /** Response message */
  message: string;
  /** Result status: "OK" or "ERROR" */
  result: string;
  /** Number of records returned */
  recordNumber: number;
  /** Array of error messages, if any */
  errors: string[] | null;
  /** Array of stock items */
  exported: StockItem[];
}

/**
 * Stock search filters
 * Maps to API query parameters
 */
export interface StockFilters {
  /** Maximum number of results */
  limit: number;
  /** Offset for pagination */
  offset?: number;
  /** Filter by warehouse ID */
  warehouseId?: number;
  /** Filter by item code (partial match) */
  itemCode?: string;
  /** Filter by lot number */
  lot?: string;
  /** Filter by serial number */
  serialNumber?: string;
  /** Filter by expiry date (yyyy-MM-dd) */
  expiryDate?: string;
  /** Filter by tray/UDC ID */
  trayId?: number;
  /** Group results by tray */
  groupByTray?: boolean;
}

/**
 * Extended filters for UI (matching Swing interface)
 */
export interface ExtendedStockFilters extends StockFilters {
  /** Filter by description (not supported by backend, client-side filter) */
  description?: string;
  /** Filter by quantity range */
  qtyMin?: number;
  qtyMax?: number;
  /** Filter by location X coordinate */
  locationX?: string;
  /** Filter by location Y coordinate */
  locationY?: string;
  /** Filter by location Z coordinate */
  locationZ?: string;
  /** Filter by height class */
  heightClass?: string;
}

/**
 * Stock table sort configuration
 */
export interface StockSort {
  /** Column to sort by */
  column: keyof StockItem;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Stock operation types (matching Swing buttons)
 */
export type StockOperation =
  | 'refresh'      // Aggiorna
  | 'clear'        // Pulisci
  | 'extractUdc'   // Estrai UDC
  | 'order'        // Ordina
  | 'search';      // Ricerca

/**
 * Stock export format
 */
export type StockExportFormat = 'csv' | 'excel' | 'pdf';

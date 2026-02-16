/**
 * Stock API Service
 * Handles all HTTP requests to the Stock/Products backend API
 * Backend: GET /Stock on port 3077
 */

import {
  StockItem,
  StockResponse,
  StockFilters
} from '../types/stock';

const API_BASE_URL = '/api';

/**
 * Fetch stock items with filters
 * Maps to: GET /Stock
 *
 * @param filters - Query parameters for filtering stock
 * @returns Promise with stock response
 */
export async function fetchStock(filters: StockFilters): Promise<StockResponse> {
  // Build query params from filters
  const params = new URLSearchParams();

  // Required parameter
  params.append('limit', filters.limit.toString());

  // Optional parameters
  if (filters.offset !== undefined) {
    params.append('offset', filters.offset.toString());
  }
  if (filters.warehouseId !== undefined) {
    params.append('warehouseId', filters.warehouseId.toString());
  }
  if (filters.itemCode) {
    params.append('itemCode', filters.itemCode);
  }
  if (filters.lot) {
    params.append('lot', filters.lot);
  }
  if (filters.serialNumber) {
    params.append('serialNumber', filters.serialNumber);
  }
  if (filters.expiryDate) {
    params.append('expiryDate', filters.expiryDate);
  }
  if (filters.trayId !== undefined) {
    params.append('trayId', filters.trayId.toString());
  }
  if (filters.groupByTray !== undefined) {
    params.append('groupByTray', filters.groupByTray.toString());
  }

  const url = `${API_BASE_URL}/Stock?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch stock: ${response.status} ${errorText}`);
  }

  const data: StockResponse = await response.json();

  // Check if backend returned errors
  if (data.result !== 'OK') {
    const errorMsg = data.errors?.join(', ') || 'Unknown error';
    throw new Error(`Backend error: ${errorMsg}`);
  }

  return data;
}

/**
 * Fetch all stock items (no limit)
 * Useful for exports or full data retrieval
 *
 * @param filters - Optional filters (limit will be set to a high value)
 * @returns Promise with all stock items
 */
export async function fetchAllStock(filters?: Omit<StockFilters, 'limit'>): Promise<StockItem[]> {
  const response = await fetchStock({
    ...filters,
    limit: 100000, // High limit to get all records
  });

  return response.exported;
}

/**
 * Fetch stock items with pagination
 *
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of items per page
 * @param filters - Optional additional filters
 * @returns Promise with stock response
 */
export async function fetchStockPaginated(
  page: number,
  pageSize: number,
  filters?: Omit<StockFilters, 'limit' | 'offset'>
): Promise<StockResponse> {
  return fetchStock({
    ...filters,
    limit: pageSize,
    offset: page * pageSize,
  });
}

/**
 * Search stock by item code (partial match)
 *
 * @param itemCode - Item code to search (partial match)
 * @param limit - Maximum number of results
 * @returns Promise with matching stock items
 */
export async function searchStockByItem(itemCode: string, limit: number = 50): Promise<StockItem[]> {
  const response = await fetchStock({
    limit,
    itemCode,
  });

  return response.exported;
}

/**
 * Get stock for a specific warehouse
 *
 * @param warehouseId - Warehouse ID
 * @param limit - Maximum number of results
 * @returns Promise with stock items for the warehouse
 */
export async function getStockByWarehouse(warehouseId: number, limit: number = 100): Promise<StockItem[]> {
  const response = await fetchStock({
    limit,
    warehouseId,
  });

  return response.exported;
}

/**
 * Get stock grouped by tray/UDC
 *
 * @param trayId - Optional tray ID to filter by
 * @param limit - Maximum number of results
 * @returns Promise with stock items grouped by tray
 */
export async function getStockByTray(trayId?: number, limit: number = 100): Promise<StockItem[]> {
  const response = await fetchStock({
    limit,
    groupByTray: true,
    trayId,
  });

  return response.exported;
}

/**
 * Get stock expiring before a specific date
 *
 * @param expiryDate - Expiry date (yyyy-MM-dd format)
 * @param limit - Maximum number of results
 * @returns Promise with expiring stock items
 */
export async function getExpiringStock(expiryDate: string, limit: number = 50): Promise<StockItem[]> {
  const response = await fetchStock({
    limit,
    expiryDate,
  });

  return response.exported;
}

/**
 * Find stock by lot number
 *
 * @param lot - Lot number to search
 * @param limit - Maximum number of results
 * @returns Promise with stock items matching the lot
 */
export async function getStockByLot(lot: string, limit: number = 50): Promise<StockItem[]> {
  const response = await fetchStock({
    limit,
    lot,
  });

  return response.exported;
}

/**
 * Find stock by serial number
 *
 * @param serialNumber - Serial number to search
 * @param limit - Maximum number of results
 * @returns Promise with stock items matching the serial number
 */
export async function getStockBySerial(serialNumber: string, limit: number = 50): Promise<StockItem[]> {
  const response = await fetchStock({
    limit,
    serialNumber,
  });

  return response.exported;
}

/**
 * Check if stock response is successful
 *
 * @param response - Stock response from API
 * @returns True if result is OK
 */
export function isStockResponseOk(response: StockResponse): boolean {
  return response.result === 'OK' && (response.errors === null || response.errors.length === 0);
}

/**
 * Get error messages from stock response
 *
 * @param response - Stock response from API
 * @returns Array of error messages (empty if no errors)
 */
export function getStockErrorMessages(response: StockResponse): string[] {
  if (!response.errors) return [];
  return response.errors;
}

/**
 * Export stock data to CSV format
 *
 * @param items - Stock items to export
 * @returns CSV string
 */
export function exportStockToCSV(items: StockItem[]): string {
  const headers = [
    'Warehouse ID',
    'Item Code',
    'Description',
    'Lot',
    'Serial Number',
    'Expiry Date',
    'Quantity',
    'Loading Unit'
  ];

  const rows = items.map(item => [
    item.warehouseId,
    item.item,
    item.description,
    item.lot,
    item.serialNumber,
    item.expiryDate || '',
    item.qty,
    item.LU || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell =>
      typeof cell === 'string' && cell.includes(',')
        ? `"${cell}"`
        : cell
    ).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download stock data as CSV file
 *
 * @param items - Stock items to download
 * @param filename - Filename for the download
 */
export function downloadStockAsCSV(items: StockItem[], filename: string = 'stock-export.csv'): void {
  const csvContent = exportStockToCSV(items);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


/**
 * API Endpoints Constants
 * Centralized endpoint definitions for the EjLog API
 */

// Base paths
const EJLOG_BASE = '/api/EjLogHostVertimag';
const API_BASE = '/api';

/**
 * API Endpoints Object
 * Type-safe endpoint definitions
 */
export const API_ENDPOINTS = {
  // Authentication
  USER_LOGIN: `${EJLOG_BASE}/User/Login`,
  USER_LOGOUT: `${EJLOG_BASE}/User/Logout`,
  USER: `${EJLOG_BASE}/User`,

  // Lists
  LISTS: `${EJLOG_BASE}/Lists`,
  LISTS_VIEW: `${EJLOG_BASE}/Lists/ViewList`,

  // Items
  ITEMS: `${EJLOG_BASE}/Items`,
  ITEMS_SEARCH: `${EJLOG_BASE}/Items/Search`,

  // Products
  PRODUCTS: `${EJLOG_BASE}/Products`,
  PRODUCTS_SEARCH: `${EJLOG_BASE}/Products/Search`,

  // Stock
  STOCK: `${EJLOG_BASE}/Stock`,
  STOCK_MOVEMENTS: `${EJLOG_BASE}/Stock/Movements`,

  // Movements
  MOVEMENTS: `${EJLOG_BASE}/Stock/Movements`,

  // Barcodes
  BARCODES: `${EJLOG_BASE}/Barcodes`,

  // Orders
  ORDERS: `${EJLOG_BASE}/Orders`,

  // Reservations
  RESERVATIONS: `${EJLOG_BASE}/Reservations`,

  // Loading Units (UDC)
  LOADING_UNITS: `${API_BASE}/loading-units`,

  // Locations (Backend Java)
  LOCATIONS: `${EJLOG_BASE}/Locations`,

  // Compartments/Drawers (Backend Node.js)
  COMPARTMENTS: `${API_BASE}/compartments`,

  // Machines
  MACHINES: `${API_BASE}/machines`,

  // Workstations
  WORKSTATIONS: `${API_BASE}/workstations`,

  // Users
  USERS: `${API_BASE}/users`,

  // Notifications
  NOTIFICATIONS: `${API_BASE}/notifications`,
  NOTIFICATIONS_UNREAD: `${API_BASE}/notifications/unread-count`,

  // Health Check
  HEALTH: `${API_BASE}/health`,
  READY: `${API_BASE}/ready`,

  // Test
  TEST: `${API_BASE}/test`,
} as const;

/**
 * Type for API endpoint keys
 */
export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

/**
 * Type for API endpoint values
 */
export type ApiEndpointValue = typeof API_ENDPOINTS[ApiEndpointKey];

/**
 * Helper to build endpoint with parameters
 * @param endpoint - Base endpoint
 * @param params - URL parameters as object
 * @returns Full URL with query string
 */
export const buildEndpoint = (
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string => {
  if (!params) return endpoint;

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

/**
 * Helper to build endpoint with path parameters
 * @param endpoint - Base endpoint with :param placeholders
 * @param pathParams - Path parameters as object
 * @returns Full URL with replaced path parameters
 *
 * @example
 * buildEndpointWithPath('/api/lists/:id', { id: '123' })
 * // Returns: '/api/lists/123'
 */
export const buildEndpointWithPath = (
  endpoint: string,
  pathParams: Record<string, string | number>
): string => {
  let result = endpoint;

  Object.entries(pathParams).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });

  return result;
};

export default API_ENDPOINTS;

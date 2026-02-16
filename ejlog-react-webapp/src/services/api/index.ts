/**
 * API Services Central Export
 * Provides convenient access to all API services
 * 🎉 ALL API SERVICES ARE NOW 100% TYPESCRIPT! 🎉
 */

// Export API client
export { default as apiClient, authHelpers } from './client';

// Export endpoints
export { API_ENDPOINTS, buildEndpoint, buildEndpointWithPath } from './endpoints';
export type { ApiEndpointKey, ApiEndpointValue } from './endpoints';

// Export TypeScript services (ALL MIGRATED!)
export { default as authService } from './auth';
export { default as listsService } from './lists';
export { default as itemsService } from './items';
export { default as productsService } from './products';
export { default as stockService } from './stock';
export { default as movementsService } from './movements';
export { default as reservationsService } from './reservations';

// Re-export all hooks from specialized API files
export * from './listsApi';
export * from './listTemplatesApi';
export * from './itemsApi';
export * from './productsApi';
export * from './stockApi';
export * from './movementsApi';
export * from './reservationsApi';
export * from './ejlogAdapterApi';
export * from './masAdapterApi';

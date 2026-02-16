/**
 * API Re-export - Bridge to new API structure
 * This file re-exports everything from the new API folder structure
 * to maintain compatibility with existing imports
 */

export * from './api/index';

// Default export for apiClient
export { apiClient as default } from './api/index';

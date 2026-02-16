/**
 * Lists Details Service
 * Handles API calls for list detail tabs data
 */

import { apiClient } from './api/client';

export interface WarehouseOperation {
  magazzino: string;
  numeroRighe: number;
  qtaTotale: number;
  qtaProcessata: number;
  progressoPercentuale: number;
}

export interface AreaOperation {
  area: string;
  priorita: number;
  sequenzaLancio: number;
  numeroRighe: number;
  qtaTotale: number;
  qtaProcessata: number;
  progressoPercentuale: number;
}

/**
 * Get warehouse operations for a list
 * @param listId - Numeric list ID from Liste.id
 */
export const getWarehouseOperations = async (listId: number): Promise<WarehouseOperation[]> => {
  try {
    const response = await apiClient.get(`/api/lists/${listId}/operations/warehouse`);
    if (response.data.result === 'OK') {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('[getWarehouseOperations] Error:', error);
    return [];
  }
};

/**
 * Get area operations for a list
 * @param listId - Numeric list ID from Liste.id
 */
export const getAreaOperations = async (listId: number): Promise<AreaOperation[]> => {
  try {
    const response = await apiClient.get(`/api/lists/${listId}/operations/area`);
    if (response.data.result === 'OK') {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('[getAreaOperations] Error:', error);
    return [];
  }
};

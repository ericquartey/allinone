// ============================================================================
// EJLOG WMS - Warehouses API Service
// API per la gestione dei magazzini
// ============================================================================

import axios from 'axios';
import type {
  Warehouse,
  WarehouseFilters,
  WarehouseRequest,
  WarehouseListResponse,
  WarehouseArea,
} from '../../types/warehouse';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3077/api';

/**
 * Ottiene lista magazzini con filtri
 */
export const getWarehouses = async (
  filters?: WarehouseFilters
): Promise<WarehouseListResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/warehouses`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

/**
 * Ottiene dettagli di un magazzino specifico
 */
export const getWarehouseById = async (id: number): Promise<Warehouse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/warehouses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching warehouse ${id}:`, error);
    throw error;
  }
};

/**
 * Crea nuovo magazzino
 */
export const createWarehouse = async (
  data: WarehouseRequest
): Promise<Warehouse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/warehouses`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
};

/**
 * Modifica magazzino esistente
 */
export const updateWarehouse = async (
  id: number,
  data: WarehouseRequest
): Promise<Warehouse> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/warehouses/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating warehouse ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina magazzino
 */
export const deleteWarehouse = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/warehouses/${id}`);
  } catch (error) {
    console.error(`Error deleting warehouse ${id}:`, error);
    throw error;
  }
};

/**
 * Associa area a magazzino
 */
export const associateWarehouseArea = async (
  warehouseId: number,
  areaId: number
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/warehouses/${warehouseId}/areas/${areaId}`);
  } catch (error) {
    console.error(`Error associating area to warehouse ${warehouseId}:`, error);
    throw error;
  }
};

/**
 * Ottiene aree disponibili
 */
export const getAvailableAreas = async (): Promise<WarehouseArea[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/areas`);
    return response.data;
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

/**
 * Crea UDC Terra per magazzino
 */
export const createUDCTerra = async (warehouseId: number): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/warehouses/${warehouseId}/udc-terra`);
  } catch (error) {
    console.error(`Error creating UDC Terra for warehouse ${warehouseId}:`, error);
    throw error;
  }
};

/**
 * Crea struttura Vertimag 2020
 */
export const createVertimag2020 = async (warehouseId: number): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/warehouses/${warehouseId}/vertimag-2020`);
  } catch (error) {
    console.error(`Error creating Vertimag 2020 for warehouse ${warehouseId}:`, error);
    throw error;
  }
};

/**
 * Crea struttura PTL
 */
export const createPTLStructure = async (warehouseId: number): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/warehouses/${warehouseId}/ptl-structure`);
  } catch (error) {
    console.error(`Error creating PTL structure for warehouse ${warehouseId}:`, error);
    throw error;
  }
};

/**
 * Modifica descrizione locazioni
 */
export const updateLocationDescription = async (
  warehouseId: number,
  locationId: number,
  description: string
): Promise<void> => {
  try {
    await axios.put(
      `${API_BASE_URL}/warehouses/${warehouseId}/locations/${locationId}`,
      { description }
    );
  } catch (error) {
    console.error(`Error updating location description:`, error);
    throw error;
  }
};

/**
 * Gestione uscita locazioni
 */
export const exitLocation = async (
  warehouseId: number,
  locationId: number
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/warehouses/${warehouseId}/locations/${locationId}/exit`
    );
  } catch (error) {
    console.error(`Error exiting location:`, error);
    throw error;
  }
};


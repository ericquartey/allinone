// ============================================================================
// EJLOG WMS - Locations Service
// Gestione ubicazioni magazzino - Service Layer
//
// FIXATO: Ora usa axios direttamente con API_ENDPOINTS.LOCATIONS
// - FIX 1: Endpoint corretto /api/EjLogHostVertimag/Locations
// - FIX 2: Supporta formato risposta backend (array diretto)
// - FIX 3: Genera ID se mancante
// ============================================================================

import { apiClient, ApiResponse } from './api';
import { API_ENDPOINTS } from './api/endpoints';
import axios from 'axios';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum LocationType {
  RACK = 'RACK',
  FLOOR = 'FLOOR',
  STAGING = 'STAGING',
  BUFFER = 'BUFFER',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  PICKING = 'PICKING',
  RESERVE = 'RESERVE',
}

export enum LocationStatus {
  EMPTY = 'EMPTY',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
  RESERVED = 'RESERVED',
  BLOCKED = 'BLOCKED',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface LocationCapacity {
  maxWeight: number;
  currentWeight: number;
  maxVolume: number;
  currentVolume: number;
}

export interface LocationDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface LocationUDC {
  barcode: string;
  products: number;
  totalQuantity: number;
}

export interface Location {
  id: number;
  code: string;
  description: string;
  zone: string;
  type: LocationType;
  status: LocationStatus;
  currentUDC?: LocationUDC;
  capacity: LocationCapacity;
  dimensions: LocationDimensions;
  isBlocked: boolean;
  blockReason?: string;
  lastMovement?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocationParams {
  code: string;
  description: string;
  zone: string;
  type: LocationType;
  maxWeight: number;
  maxVolume: number;
  width: number;
  depth: number;
  height: number;
}

export interface UpdateLocationParams {
  description?: string;
  zone?: string;
  type?: LocationType;
  maxWeight?: number;
  maxVolume?: number;
}

export interface BlockLocationParams {
  reason: string;
}

export interface LocationFilters {
  zone?: string;
  type?: LocationType;
  status?: LocationStatus;
  search?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Recupera tutte le ubicazioni
 * FIX: Usa axios direttamente con API_ENDPOINTS.LOCATIONS
 */
export async function getLocations(filters?: LocationFilters): Promise<ApiResponse<Location[]>> {
  try {
    console.log('[locationsService] Fetching locations from:', API_ENDPOINTS.LOCATIONS);

    const params = new URLSearchParams();
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(API_ENDPOINTS.LOCATIONS, {
      params,
      headers: { 'Accept': 'application/json' }
    });

    console.log('[locationsService] Got response:', response.data);

    // FIX 2: Backend Java restituisce array diretto, non wrapped in {exported: []}
    const items = Array.isArray(response.data) ? response.data : [];

    // FIX 3: Genera ID se mancante
    const locationsWithIds = items.map((item: any, index: number) => ({
      ...item,
      id: item.id || `location-${index}`,
      // Map backend fields to frontend interface
      code: item.code || item.locationCode || '',
      description: item.description || '',
      zone: item.zone || '',
      type: item.type || LocationType.RACK,
      status: item.status || LocationStatus.EMPTY,
      currentUDC: item.currentUDC,
      capacity: item.capacity || {
        maxWeight: 0,
        currentWeight: 0,
        maxVolume: 0,
        currentVolume: 0,
      },
      dimensions: item.dimensions || {
        width: 0,
        depth: 0,
        height: 0,
      },
      isBlocked: item.isBlocked || false,
      blockReason: item.blockReason,
      lastMovement: item.lastMovement,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    console.log('[locationsService] Mapped locations:', locationsWithIds);

    return {
      result: 'OK',
      data: locationsWithIds,
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle ubicazioni',
    };
  }
}

/**
 * Recupera una singola ubicazione per codice
 * FIX: Usa axios direttamente con API_ENDPOINTS.LOCATIONS
 */
export async function getLocationByCode(code: string): Promise<ApiResponse<Location>> {
  try {
    const response = await axios.get(`${API_ENDPOINTS.LOCATIONS}/${code}`, {
      headers: { 'Accept': 'application/json' }
    });

    // FIX: Assicura che l'ID esista
    const location = {
      ...response.data,
      id: response.data.id || code,
    };

    return {
      result: 'OK',
      data: location,
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dell\'ubicazione',
    };
  }
}

/**
 * Crea una nuova ubicazione
 */
export async function createLocation(params: CreateLocationParams): Promise<ApiResponse<Location>> {
  try {
    return await apiClient.post<Location>('/locations', params);
  } catch (error) {
    console.error('Error creating location:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella creazione dell\'ubicazione',
    };
  }
}

/**
 * Aggiorna un'ubicazione esistente
 */
export async function updateLocation(
  code: string,
  params: UpdateLocationParams
): Promise<ApiResponse<Location>> {
  try {
    return await apiClient.put<Location>(`/locations/${code}`, params);
  } catch (error) {
    console.error('Error updating location:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiornamento dell\'ubicazione',
    };
  }
}

/**
 * Blocca un'ubicazione
 */
export async function blockLocation(
  code: string,
  params: BlockLocationParams
): Promise<ApiResponse<Location>> {
  try {
    return await apiClient.post<Location>(`/locations/${code}/block`, params);
  } catch (error) {
    console.error('Error blocking location:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel blocco dell\'ubicazione',
    };
  }
}

/**
 * Sblocca un'ubicazione
 */
export async function unblockLocation(code: string): Promise<ApiResponse<Location>> {
  try {
    return await apiClient.post<Location>(`/locations/${code}/unblock`, {});
  } catch (error) {
    console.error('Error unblocking location:', error);
    return {
      result: 'ERROR',
      message: 'Errore nello sblocco dell\'ubicazione',
    };
  }
}

/**
 * Elimina un'ubicazione (solo se vuota)
 */
export async function deleteLocation(code: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`/locations/${code}`);
  } catch (error) {
    console.error('Error deleting location:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'eliminazione dell\'ubicazione',
    };
  }
}

/**
 * Recupera le zone disponibili
 */
export async function getZones(): Promise<ApiResponse<string[]>> {
  try {
    return await apiClient.get<string[]>('/locations/zones');
  } catch (error) {
    console.error('Error fetching zones:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle zone',
    };
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateLocationCreation(params: CreateLocationParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.code || params.code.trim().length === 0) {
    errors.code = 'Il codice è obbligatorio';
  } else if (params.code.length < 2 || params.code.length > 20) {
    errors.code = 'Il codice deve essere tra 2 e 20 caratteri';
  }

  if (!params.zone || params.zone.trim().length === 0) {
    errors.zone = 'La zona è obbligatoria';
  }

  if (!params.type) {
    errors.type = 'Il tipo è obbligatorio';
  }

  if (params.maxWeight <= 0) {
    errors.maxWeight = 'Il peso massimo deve essere maggiore di zero';
  }

  if (params.maxVolume <= 0) {
    errors.maxVolume = 'Il volume massimo deve essere maggiore di zero';
  }

  if (params.width <= 0 || params.depth <= 0 || params.height <= 0) {
    errors.dimensions = 'Tutte le dimensioni devono essere maggiori di zero';
  }

  return errors;
}

export function validateLocationUpdate(params: UpdateLocationParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (params.maxWeight !== undefined && params.maxWeight <= 0) {
    errors.maxWeight = 'Il peso massimo deve essere maggiore di zero';
  }

  if (params.maxVolume !== undefined && params.maxVolume <= 0) {
    errors.maxVolume = 'Il volume massimo deve essere maggiore di zero';
  }

  return errors;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcola la percentuale di occupazione peso
 */
export function getWeightOccupancy(location: Location): number {
  if (location.capacity.maxWeight === 0) return 0;
  return (location.capacity.currentWeight / location.capacity.maxWeight) * 100;
}

/**
 * Calcola la percentuale di occupazione volume
 */
export function getVolumeOccupancy(location: Location): number {
  if (location.capacity.maxVolume === 0) return 0;
  return (location.capacity.currentVolume / location.capacity.maxVolume) * 100;
}

/**
 * Determina se un'ubicazione è disponibile per stoccaggio
 */
export function isLocationAvailable(location: Location): boolean {
  return (
    !location.isBlocked &&
    location.status !== LocationStatus.FULL &&
    location.status !== LocationStatus.BLOCKED
  );
}

/**
 * Determina il colore del badge per lo status
 */
export function getLocationStatusColor(status: LocationStatus): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case LocationStatus.EMPTY:
      return 'default';
    case LocationStatus.PARTIAL:
      return 'warning';
    case LocationStatus.FULL:
      return 'error';
    case LocationStatus.RESERVED:
      return 'warning';
    case LocationStatus.BLOCKED:
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Ottiene la label tradotta per il tipo di ubicazione
 */
export function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    [LocationType.RACK]: 'Scaffalatura',
    [LocationType.FLOOR]: 'Pavimento',
    [LocationType.STAGING]: 'Area Staging',
    [LocationType.BUFFER]: 'Buffer',
    [LocationType.RECEIVING]: 'Ricevimento',
    [LocationType.SHIPPING]: 'Spedizione',
    [LocationType.PICKING]: 'Prelievo',
    [LocationType.RESERVE]: 'Riserva',
  };
  return labels[type] || type;
}

/**
 * Ottiene la label tradotta per lo status
 */
export function getLocationStatusLabel(status: LocationStatus): string {
  const labels: Record<LocationStatus, string> = {
    [LocationStatus.EMPTY]: 'Vuota',
    [LocationStatus.PARTIAL]: 'Parziale',
    [LocationStatus.FULL]: 'Piena',
    [LocationStatus.RESERVED]: 'Riservata',
    [LocationStatus.BLOCKED]: 'Bloccata',
  };
  return labels[status] || status;
}

/**
 * Filtra le ubicazioni in base ai criteri forniti
 */
export function filterLocations(locations: Location[], filters: LocationFilters): Location[] {
  return locations.filter((location) => {
    if (filters.zone && location.zone !== filters.zone) return false;
    if (filters.type && location.type !== filters.type) return false;
    if (filters.status && location.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        location.code.toLowerCase().includes(searchLower) ||
        location.description.toLowerCase().includes(searchLower) ||
        location.zone.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}

/**
 * Ordina le ubicazioni per occupazione (peso)
 */
export function sortLocationsByOccupancy(locations: Location[], ascending = true): Location[] {
  return [...locations].sort((a, b) => {
    const occA = getWeightOccupancy(a);
    const occB = getWeightOccupancy(b);
    return ascending ? occA - occB : occB - occA;
  });
}

/**
 * Raggruppa le ubicazioni per zona
 */
export function groupLocationsByZone(locations: Location[]): Record<string, Location[]> {
  return locations.reduce((acc, location) => {
    if (!acc[location.zone]) {
      acc[location.zone] = [];
    }
    acc[location.zone].push(location);
    return acc;
  }, {} as Record<string, Location[]>);
}

/**
 * Calcola statistiche per una lista di ubicazioni
 */
export function getLocationStats(locations: Location[]) {
  const total = locations.length;
  const empty = locations.filter((l) => l.status === LocationStatus.EMPTY).length;
  const partial = locations.filter((l) => l.status === LocationStatus.PARTIAL).length;
  const full = locations.filter((l) => l.status === LocationStatus.FULL).length;
  const blocked = locations.filter((l) => l.isBlocked).length;
  const available = locations.filter((l) => isLocationAvailable(l)).length;

  const totalMaxWeight = locations.reduce((sum, l) => sum + l.capacity.maxWeight, 0);
  const totalCurrentWeight = locations.reduce((sum, l) => sum + l.capacity.currentWeight, 0);
  const avgOccupancy = total > 0 ? (totalCurrentWeight / totalMaxWeight) * 100 : 0;

  return {
    total,
    empty,
    partial,
    full,
    blocked,
    available,
    avgOccupancy,
    totalMaxWeight,
    totalCurrentWeight,
  };
}

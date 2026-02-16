// ============================================================================
// EJLOG WMS - Workstations Service
// Gestione postazioni operative - Service Layer
// ============================================================================

import { apiClient, ApiResponse } from './api';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum WorkstationType {
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  QUALITY_CONTROL = 'QUALITY_CONTROL',
  INVENTORY = 'INVENTORY',
  REFILLING = 'REFILLING',
  RETURNS = 'RETURNS',
  KITTING = 'KITTING',
  GENERAL = 'GENERAL',
}

export enum WorkstationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
}

export enum DeviceType {
  PRINTER = 'PRINTER',
  SCANNER = 'SCANNER',
  SCALE = 'SCALE',
  TERMINAL = 'TERMINAL',
  TABLET = 'TABLET',
  WORKSTATION_PC = 'WORKSTATION_PC',
  LABEL_PRINTER = 'LABEL_PRINTER',
  BARCODE_READER = 'BARCODE_READER',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface WorkstationDevice {
  id: number;
  type: DeviceType;
  name: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  isConnected: boolean;
  lastConnection?: string;
}

export interface WorkstationUser {
  username: string;
  fullName: string;
  loginTime: string;
  role?: string;
}

export interface WorkstationActivity {
  id: number;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

export interface WorkstationPerformance {
  tasksCompleted: number;
  tasksInProgress: number;
  averageTaskTime: number;
  errorCount: number;
  uptime: number;
  productivity: number;
}

export interface Workstation {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: WorkstationType;
  status: WorkstationStatus;
  zone?: string;
  location?: string;
  devices: WorkstationDevice[];
  currentUser?: WorkstationUser;
  performance: WorkstationPerformance;
  isEnabled: boolean;
  requiresAuthentication: boolean;
  allowMultipleUsers: boolean;
  maxConcurrentTasks: number;
  ipAddress?: string;
  macAddress?: string;
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

export interface CreateWorkstationParams {
  code: string;
  name: string;
  description?: string;
  type: WorkstationType;
  zone?: string;
  location?: string;
  requiresAuthentication?: boolean;
  allowMultipleUsers?: boolean;
  maxConcurrentTasks?: number;
  ipAddress?: string;
  macAddress?: string;
  notes?: string;
}

export interface UpdateWorkstationParams {
  name?: string;
  description?: string;
  type?: WorkstationType;
  status?: WorkstationStatus;
  zone?: string;
  location?: string;
  requiresAuthentication?: boolean;
  allowMultipleUsers?: boolean;
  maxConcurrentTasks?: number;
  ipAddress?: string;
  macAddress?: string;
  notes?: string;
}

export interface WorkstationFilters {
  type?: WorkstationType;
  status?: WorkstationStatus;
  zone?: string;
  search?: string;
  isEnabled?: boolean;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface AddDeviceParams {
  type: DeviceType;
  name: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Recupera tutte le postazioni operative
 */
export async function getWorkstations(filters?: WorkstationFilters): Promise<ApiResponse<Workstation[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isEnabled !== undefined) params.append('isEnabled', String(filters.isEnabled));

    const queryString = params.toString();
    const url = queryString ? `/workstations?${queryString}` : '/workstations';

    return await apiClient.get<Workstation[]>(url);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle postazioni operative',
    };
  }
}

/**
 * Recupera una singola postazione per codice
 */
export async function getWorkstationByCode(code: string): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.get<Workstation>(`/workstations/${code}`);
  } catch (error) {
    console.error('Error fetching workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero della postazione operativa',
    };
  }
}

/**
 * Crea una nuova postazione operativa
 */
export async function createWorkstation(params: CreateWorkstationParams): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.post<Workstation>('/workstations', params);
  } catch (error) {
    console.error('Error creating workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella creazione della postazione operativa',
    };
  }
}

/**
 * Aggiorna una postazione operativa esistente
 */
export async function updateWorkstation(
  code: string,
  params: UpdateWorkstationParams
): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.put<Workstation>(`/workstations/${code}`, params);
  } catch (error) {
    console.error('Error updating workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiornamento della postazione operativa',
    };
  }
}

/**
 * Cambia lo status di una postazione
 */
export async function updateWorkstationStatus(
  code: string,
  status: WorkstationStatus
): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.post<Workstation>(`/workstations/${code}/status`, { status });
  } catch (error) {
    console.error('Error updating workstation status:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel cambiamento dello status',
    };
  }
}

/**
 * Abilita/Disabilita una postazione
 */
export async function toggleWorkstationEnabled(code: string, enabled: boolean): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.post<Workstation>(`/workstations/${code}/toggle`, { enabled });
  } catch (error) {
    console.error('Error toggling workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel cambio stato della postazione',
    };
  }
}

/**
 * Elimina una postazione operativa
 */
export async function deleteWorkstation(code: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`/workstations/${code}`);
  } catch (error) {
    console.error('Error deleting workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'eliminazione della postazione operativa',
    };
  }
}

/**
 * Login utente su postazione
 */
export async function loginToWorkstation(code: string, params: LoginParams): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.post<Workstation>(`/workstations/${code}/login`, params);
  } catch (error) {
    console.error('Error logging in to workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel login alla postazione',
    };
  }
}

/**
 * Logout utente da postazione
 */
export async function logoutFromWorkstation(code: string): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.post<Workstation>(`/workstations/${code}/logout`, {});
  } catch (error) {
    console.error('Error logging out from workstation:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel logout dalla postazione',
    };
  }
}

/**
 * Aggiungi dispositivo a postazione
 */
export async function addDevice(code: string, params: AddDeviceParams): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.post<Workstation>(`/workstations/${code}/devices`, params);
  } catch (error) {
    console.error('Error adding device:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiunta del dispositivo',
    };
  }
}

/**
 * Rimuovi dispositivo da postazione
 */
export async function removeDevice(code: string, deviceId: number): Promise<ApiResponse<Workstation>> {
  try {
    return await apiClient.delete<Workstation>(`/workstations/${code}/devices/${deviceId}`);
  } catch (error) {
    console.error('Error removing device:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella rimozione del dispositivo',
    };
  }
}

/**
 * Recupera attività recenti della postazione
 */
export async function getWorkstationActivity(code: string, limit = 50): Promise<ApiResponse<WorkstationActivity[]>> {
  try {
    return await apiClient.get<WorkstationActivity[]>(`/workstations/${code}/activity?limit=${limit}`);
  } catch (error) {
    console.error('Error fetching workstation activity:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle attività',
    };
  }
}

/**
 * Recupera le zone disponibili
 */
export async function getZones(): Promise<ApiResponse<string[]>> {
  try {
    return await apiClient.get<string[]>('/workstations/zones');
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

export function validateWorkstationCreation(params: CreateWorkstationParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.code || params.code.trim().length === 0) {
    errors.code = 'Il codice è obbligatorio';
  } else if (params.code.length < 2 || params.code.length > 20) {
    errors.code = 'Il codice deve essere tra 2 e 20 caratteri';
  }

  if (!params.name || params.name.trim().length === 0) {
    errors.name = 'Il nome è obbligatorio';
  } else if (params.name.length < 3 || params.name.length > 100) {
    errors.name = 'Il nome deve essere tra 3 e 100 caratteri';
  }

  if (!params.type) {
    errors.type = 'Il tipo è obbligatorio';
  }

  if (params.maxConcurrentTasks !== undefined && params.maxConcurrentTasks < 1) {
    errors.maxConcurrentTasks = 'Il numero di task concorrenti deve essere almeno 1';
  }

  if (params.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(params.ipAddress)) {
    errors.ipAddress = 'Indirizzo IP non valido';
  }

  if (params.macAddress && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(params.macAddress)) {
    errors.macAddress = 'Indirizzo MAC non valido';
  }

  return errors;
}

export function validateWorkstationUpdate(params: UpdateWorkstationParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (params.name !== undefined && params.name.trim().length === 0) {
    errors.name = 'Il nome non può essere vuoto';
  } else if (params.name && (params.name.length < 3 || params.name.length > 100)) {
    errors.name = 'Il nome deve essere tra 3 e 100 caratteri';
  }

  if (params.maxConcurrentTasks !== undefined && params.maxConcurrentTasks < 1) {
    errors.maxConcurrentTasks = 'Il numero di task concorrenti deve essere almeno 1';
  }

  if (params.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(params.ipAddress)) {
    errors.ipAddress = 'Indirizzo IP non valido';
  }

  if (params.macAddress && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(params.macAddress)) {
    errors.macAddress = 'Indirizzo MAC non valido';
  }

  return errors;
}

export function validateDeviceAddition(params: AddDeviceParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.type) {
    errors.type = 'Il tipo di dispositivo è obbligatorio';
  }

  if (!params.name || params.name.trim().length === 0) {
    errors.name = 'Il nome del dispositivo è obbligatorio';
  }

  if (params.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(params.ipAddress)) {
    errors.ipAddress = 'Indirizzo IP non valido';
  }

  return errors;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determina se una postazione è operativa
 */
export function isWorkstationOperational(workstation: Workstation): boolean {
  return (
    workstation.isEnabled &&
    workstation.status === WorkstationStatus.ACTIVE &&
    !workstation.performance ||
    workstation.performance.errorCount < 10
  );
}

/**
 * Determina se una postazione è disponibile per login
 */
export function isWorkstationAvailable(workstation: Workstation): boolean {
  return (
    workstation.isEnabled &&
    workstation.status === WorkstationStatus.ACTIVE &&
    (!workstation.currentUser || workstation.allowMultipleUsers)
  );
}

/**
 * Determina il colore del badge per lo status
 */
export function getWorkstationStatusColor(status: WorkstationStatus): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case WorkstationStatus.ACTIVE:
      return 'success';
    case WorkstationStatus.BUSY:
      return 'warning';
    case WorkstationStatus.MAINTENANCE:
      return 'warning';
    case WorkstationStatus.INACTIVE:
      return 'default';
    case WorkstationStatus.OFFLINE:
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Ottiene la label tradotta per il tipo di postazione
 */
export function getWorkstationTypeLabel(type: WorkstationType): string {
  const labels: Record<WorkstationType, string> = {
    [WorkstationType.RECEIVING]: 'Ricevimento',
    [WorkstationType.SHIPPING]: 'Spedizione',
    [WorkstationType.PICKING]: 'Prelievo',
    [WorkstationType.PACKING]: 'Confezionamento',
    [WorkstationType.QUALITY_CONTROL]: 'Controllo Qualità',
    [WorkstationType.INVENTORY]: 'Inventario',
    [WorkstationType.REFILLING]: 'Rifornimento',
    [WorkstationType.RETURNS]: 'Resi',
    [WorkstationType.KITTING]: 'Kitting',
    [WorkstationType.GENERAL]: 'Generale',
  };
  return labels[type] || type;
}

/**
 * Ottiene la label tradotta per lo status
 */
export function getWorkstationStatusLabel(status: WorkstationStatus): string {
  const labels: Record<WorkstationStatus, string> = {
    [WorkstationStatus.ACTIVE]: 'Attiva',
    [WorkstationStatus.INACTIVE]: 'Inattiva',
    [WorkstationStatus.MAINTENANCE]: 'In Manutenzione',
    [WorkstationStatus.OFFLINE]: 'Offline',
    [WorkstationStatus.BUSY]: 'Occupata',
  };
  return labels[status] || status;
}

/**
 * Ottiene la label tradotta per il tipo di dispositivo
 */
export function getDeviceTypeLabel(type: DeviceType): string {
  const labels: Record<DeviceType, string> = {
    [DeviceType.PRINTER]: 'Stampante',
    [DeviceType.SCANNER]: 'Scanner',
    [DeviceType.SCALE]: 'Bilancia',
    [DeviceType.TERMINAL]: 'Terminale',
    [DeviceType.TABLET]: 'Tablet',
    [DeviceType.WORKSTATION_PC]: 'PC Postazione',
    [DeviceType.LABEL_PRINTER]: 'Stampante Etichette',
    [DeviceType.BARCODE_READER]: 'Lettore Barcode',
  };
  return labels[type] || type;
}

/**
 * Filtra le postazioni in base ai criteri forniti
 */
export function filterWorkstations(workstations: Workstation[], filters: WorkstationFilters): Workstation[] {
  return workstations.filter((workstation) => {
    if (filters.type && workstation.type !== filters.type) return false;
    if (filters.status && workstation.status !== filters.status) return false;
    if (filters.zone && workstation.zone !== filters.zone) return false;
    if (filters.isEnabled !== undefined && workstation.isEnabled !== filters.isEnabled) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        workstation.code.toLowerCase().includes(searchLower) ||
        workstation.name.toLowerCase().includes(searchLower) ||
        (workstation.zone && workstation.zone.toLowerCase().includes(searchLower)) ||
        (workstation.location && workstation.location.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
}

/**
 * Ordina le postazioni per produttività
 */
export function sortWorkstationsByProductivity(workstations: Workstation[], ascending = false): Workstation[] {
  return [...workstations].sort((a, b) => {
    const prodA = a.performance?.productivity || 0;
    const prodB = b.performance?.productivity || 0;
    return ascending ? prodA - prodB : prodB - prodA;
  });
}

/**
 * Raggruppa le postazioni per tipo
 */
export function groupWorkstationsByType(workstations: Workstation[]): Record<string, Workstation[]> {
  return workstations.reduce((acc, workstation) => {
    const typeLabel = getWorkstationTypeLabel(workstation.type);
    if (!acc[typeLabel]) {
      acc[typeLabel] = [];
    }
    acc[typeLabel].push(workstation);
    return acc;
  }, {} as Record<string, Workstation[]>);
}

/**
 * Raggruppa le postazioni per zona
 */
export function groupWorkstationsByZone(workstations: Workstation[]): Record<string, Workstation[]> {
  return workstations.reduce((acc, workstation) => {
    const zone = workstation.zone || 'Senza Zona';
    if (!acc[zone]) {
      acc[zone] = [];
    }
    acc[zone].push(workstation);
    return acc;
  }, {} as Record<string, Workstation[]>);
}

/**
 * Calcola statistiche per una lista di postazioni
 */
export function getWorkstationStats(workstations: Workstation[]) {
  const total = workstations.length;
  const active = workstations.filter((w) => w.status === WorkstationStatus.ACTIVE).length;
  const inactive = workstations.filter((w) => w.status === WorkstationStatus.INACTIVE).length;
  const maintenance = workstations.filter((w) => w.status === WorkstationStatus.MAINTENANCE).length;
  const offline = workstations.filter((w) => w.status === WorkstationStatus.OFFLINE).length;
  const busy = workstations.filter((w) => w.status === WorkstationStatus.BUSY).length;

  const enabled = workstations.filter((w) => w.isEnabled).length;
  const withUser = workstations.filter((w) => w.currentUser !== undefined).length;

  const totalTasks = workstations.reduce((sum, w) => sum + (w.performance?.tasksCompleted || 0), 0);
  const totalInProgress = workstations.reduce((sum, w) => sum + (w.performance?.tasksInProgress || 0), 0);
  const totalErrors = workstations.reduce((sum, w) => sum + (w.performance?.errorCount || 0), 0);

  const avgProductivity =
    total > 0
      ? workstations.reduce((sum, w) => sum + (w.performance?.productivity || 0), 0) / total
      : 0;

  const connectedDevices = workstations.reduce((sum, w) => {
    return sum + w.devices.filter((d) => d.isConnected).length;
  }, 0);

  const totalDevices = workstations.reduce((sum, w) => sum + w.devices.length, 0);

  return {
    total,
    active,
    inactive,
    maintenance,
    offline,
    busy,
    enabled,
    withUser,
    totalTasks,
    totalInProgress,
    totalErrors,
    avgProductivity,
    connectedDevices,
    totalDevices,
  };
}

/**
 * Formatta il tempo di attività
 */
export function formatUptime(uptime: number): string {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Formatta la produttività in percentuale
 */
export function formatProductivity(productivity: number): string {
  return `${Math.round(productivity)}%`;
}

/**
 * Calcola il tempo medio per task
 */
export function calculateAverageTaskTime(workstation: Workstation): string {
  const avgTime = workstation.performance?.averageTaskTime || 0;
  const minutes = Math.floor(avgTime / 60);
  const seconds = avgTime % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Determina se un dispositivo è critico (non connesso)
 */
export function hasDisconnectedDevices(workstation: Workstation): boolean {
  return workstation.devices.some((device) => !device.isConnected);
}

/**
 * Conta dispositivi connessi
 */
export function countConnectedDevices(workstation: Workstation): number {
  return workstation.devices.filter((d) => d.isConnected).length;
}

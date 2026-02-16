// ============================================================================
// EJLOG WMS - Bay API Service
// API per gestione Baia Operatore (Operator Bay)
// ============================================================================

import { apiClient } from './client';

/**
 * Priorità prenotazione
 */
export enum ReservationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Stato prenotazione
 */
export enum ReservationStatus {
  PENDING = 'PENDING',       // In attesa
  ASSIGNED = 'ASSIGNED',     // Assegnata a baia
  IN_PROGRESS = 'IN_PROGRESS', // In esecuzione
  COMPLETED = 'COMPLETED',   // Completata
  CANCELLED = 'CANCELLED',   // Annullata
  ERROR = 'ERROR',           // Errore
}

/**
 * Tipo operazione
 */
export enum OperationType {
  PICKING = 'PICKING',           // Prelievo
  PUTAWAY = 'PUTAWAY',           // Stoccaggio
  REPLENISHMENT = 'REPLENISHMENT', // Rifornimento
  TRANSFER = 'TRANSFER',         // Trasferimento
  INVENTORY = 'INVENTORY',       // Inventario
}

/**
 * Stato step guidance
 */
export enum GuidanceStepStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR',
}

/**
 * Prenotazione baia
 */
export interface Reservation {
  id: number;
  code: string;
  type: OperationType;
  priority: ReservationPriority;
  status: ReservationStatus;
  bayId: number | null;
  bayName: string | null;
  operatorId: number | null;
  operatorName: string | null;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  uom: string;
  sourceLocation: string | null;
  targetLocation: string | null;
  createdAt: string;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedDuration: number | null; // secondi
  notes: string | null;
}

/**
 * Step di guidance per operatore
 */
export interface GuidanceStep {
  id: number;
  reservationId: number;
  stepNumber: number;
  totalSteps: number;
  status: GuidanceStepStatus;
  instruction: string;
  instructionEn: string | null;
  location: string | null;
  expectedBarcode: string | null;
  expectedQuantity: number | null;
  visualAid: string | null; // URL immagine o icona
  audioInstruction: string | null; // URL file audio
  requiresConfirmation: boolean;
  requiresScan: boolean;
  completedAt: string | null;
}

/**
 * Guidance completa
 */
export interface Guidance {
  reservationId: number;
  currentStep: number;
  totalSteps: number;
  steps: GuidanceStep[];
  progress: number; // 0-100
}

/**
 * Statistiche baia
 */
export interface BayStats {
  bayId: number;
  bayName: string;
  isActive: boolean;
  operatorId: number | null;
  operatorName: string | null;
  activeReservationId: number | null;
  completedToday: number;
  avgCompletionTime: number; // secondi
  lastActivityAt: string | null;
}

/**
 * Request per conferma operazione
 */
export interface ConfirmOperationRequest {
  reservationId: number;
  stepId: number;
  barcode?: string;
  quantity?: number;
  notes?: string;
}

/**
 * Response conferma operazione
 */
export interface ConfirmOperationResponse {
  success: boolean;
  message: string;
  nextStep: GuidanceStep | null;
  guidance: Guidance | null;
  completed: boolean;
}

/**
 * Request per completamento prenotazione
 */
export interface CompleteReservationRequest {
  reservationId: number;
  notes?: string;
  anomalies?: string[];
}

/**
 * Response completamento prenotazione
 */
export interface CompleteReservationResponse {
  success: boolean;
  message: string;
  completedReservation: Reservation;
  nextReservation: Reservation | null;
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Ottiene lista prenotazioni attive per baia
 */
export async function getActiveReservations(
  bayId?: number,
  status?: ReservationStatus[]
): Promise<Reservation[]> {
  const params: any = {};

  if (bayId) params.bayId = bayId;
  if (status) params.status = status.join(',');

  const response = await apiClient.get('/api/bay/reservations', { params });
  return response.data;
}

/**
 * Ottiene dettagli prenotazione
 */
export async function getReservationById(id: number): Promise<Reservation> {
  const response = await apiClient.get(`/api/bay/reservations/${id}`);
  return response.data;
}

/**
 * Ottiene guidance completa per prenotazione
 */
export async function getGuidance(reservationId: number): Promise<Guidance> {
  const response = await apiClient.get(`/api/bay/guidance/${reservationId}`);
  return response.data;
}

/**
 * Ottiene step corrente della guidance
 */
export async function getCurrentStep(reservationId: number): Promise<GuidanceStep> {
  const response = await apiClient.get(`/api/bay/guidance/${reservationId}/current`);
  return response.data;
}

/**
 * Conferma operazione (step guidance)
 */
export async function confirmOperation(
  request: ConfirmOperationRequest
): Promise<ConfirmOperationResponse> {
  const response = await apiClient.post('/api/bay/confirm', request);
  return response.data;
}

/**
 * Completa prenotazione
 */
export async function completeReservation(
  request: CompleteReservationRequest
): Promise<CompleteReservationResponse> {
  const response = await apiClient.post('/api/bay/complete', request);
  return response.data;
}

/**
 * Annulla prenotazione
 */
export async function cancelReservation(
  reservationId: number,
  reason: string
): Promise<void> {
  await apiClient.post(`/api/bay/reservations/${reservationId}/cancel`, { reason });
}

/**
 * Assegna prenotazione a baia e operatore
 */
export async function assignReservation(
  reservationId: number,
  bayId: number,
  operatorId: number
): Promise<Reservation> {
  const response = await apiClient.post(`/api/bay/reservations/${reservationId}/assign`, {
    bayId,
    operatorId,
  });
  return response.data;
}

/**
 * Rilascia prenotazione (libera baia)
 */
export async function releaseReservation(reservationId: number): Promise<void> {
  await apiClient.post(`/api/bay/reservations/${reservationId}/release`);
}

/**
 * Ottiene statistiche baie
 */
export async function getBayStats(bayId?: number): Promise<BayStats[]> {
  const params = bayId ? { bayId } : {};
  const response = await apiClient.get('/api/bay/stats', { params });
  return response.data;
}

/**
 * Segna operatore come pronto
 */
export async function setOperatorReady(
  bayId: number,
  operatorId: number
): Promise<Reservation | null> {
  const response = await apiClient.post('/api/bay/operator-ready', {
    bayId,
    operatorId,
  });
  return response.data;
}

/**
 * Richiedi prossima prenotazione disponibile
 */
export async function getNextReservation(
  bayId: number,
  operatorId: number
): Promise<Reservation | null> {
  const response = await apiClient.post('/api/bay/next-reservation', {
    bayId,
    operatorId,
  });
  return response.data;
}

/**
 * Segnala problema durante operazione
 */
export async function reportIssue(
  reservationId: number,
  stepId: number,
  issue: {
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }
): Promise<void> {
  await apiClient.post(`/api/bay/reservations/${reservationId}/issue`, {
    stepId,
    ...issue,
  });
}

/**
 * Richiedi assistenza supervisor
 */
export async function requestAssistance(
  reservationId: number,
  reason: string
): Promise<void> {
  await apiClient.post(`/api/bay/reservations/${reservationId}/assistance`, {
    reason,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ottiene colore per priorità
 */
export function getPriorityColor(priority: ReservationPriority): string {
  switch (priority) {
    case ReservationPriority.URGENT:
      return 'text-red-600 bg-red-50 border-red-300';
    case ReservationPriority.HIGH:
      return 'text-orange-600 bg-orange-50 border-orange-300';
    case ReservationPriority.NORMAL:
      return 'text-blue-600 bg-blue-50 border-blue-300';
    case ReservationPriority.LOW:
      return 'text-gray-600 bg-gray-50 border-gray-300';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-300';
  }
}

/**
 * Ottiene label per tipo operazione
 */
export function getOperationTypeLabel(type: OperationType): string {
  switch (type) {
    case OperationType.PICKING:
      return 'Prelievo';
    case OperationType.PUTAWAY:
      return 'Stoccaggio';
    case OperationType.REPLENISHMENT:
      return 'Rifornimento';
    case OperationType.TRANSFER:
      return 'Trasferimento';
    case OperationType.INVENTORY:
      return 'Inventario';
    default:
      return type;
  }
}

/**
 * Ottiene icona per tipo operazione
 */
export function getOperationTypeIcon(type: OperationType): string {
  switch (type) {
    case OperationType.PICKING:
      return '📦'; // Box
    case OperationType.PUTAWAY:
      return '📥'; // Inbox
    case OperationType.REPLENISHMENT:
      return '🔄'; // Refresh
    case OperationType.TRANSFER:
      return '🚚'; // Truck
    case OperationType.INVENTORY:
      return '📋'; // Clipboard
    default:
      return '📦';
  }
}

/**
 * Formatta durata stimata
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

/**
 * Calcola progresso guidance
 */
export function calculateProgress(guidance: Guidance): number {
  const completedSteps = guidance.steps.filter(
    (s) => s.status === GuidanceStepStatus.COMPLETED
  ).length;
  return Math.round((completedSteps / guidance.totalSteps) * 100);
}

export default {
  // Queries
  getActiveReservations,
  getReservationById,
  getGuidance,
  getCurrentStep,
  getBayStats,
  getNextReservation,

  // Commands
  confirmOperation,
  completeReservation,
  cancelReservation,
  assignReservation,
  releaseReservation,
  setOperatorReady,
  reportIssue,
  requestAssistance,

  // Utilities
  getPriorityColor,
  getOperationTypeLabel,
  getOperationTypeIcon,
  formatDuration,
  calculateProgress,
};

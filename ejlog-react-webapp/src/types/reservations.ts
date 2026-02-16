// ============================================================================
// EJLOG WMS - Reservation Types
// Tipi TypeScript per la gestione delle prenotazioni
// ============================================================================

import type { PaginationParams, SortParams, SearchParams } from './models';

// ============================================================================
// ENUMERAZIONI
// ============================================================================

export enum ReservationStatus {
  DA_ESEGUIRE = 0,
  IN_ESECUZIONE = 1,
  COMPLETATA = 2,
  ANNULLATA = 3,
  SOSPESA = 4,
}

// ============================================================================
// MODELLI
// ============================================================================

export interface Reservation {
  id: number;
  code: string;
  listId: number;
  listCode: string;
  listRowId?: number;
  itemId: number;
  itemCode: string;
  itemDescription?: string;
  itemUm?: string;
  quantityToMove: number;
  confirmedQuantity?: number;
  remainingQuantity: number;
  status: ReservationStatus;
  udcId: number;
  udcBarcode: string;
  productId: number;
  productQty: number;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  locationId: number;
  locationCode: string;
  locationWarehouse?: string;
  locationX?: number;
  locationY?: number;
  locationZ?: number;
  priority: number;
  isCompleted: boolean;
  barcodeConfirmed?: boolean;
  operatorUserName?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ConfirmReservationRequest {
  confirmedQuantity: number;
  settleRow?: boolean;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  barcode?: string;
}

// ============================================================================
// FILTRI
// ============================================================================

export interface ReservationFilters extends PaginationParams, SortParams, SearchParams {
  listId?: number;
  itemId?: number;
  status?: ReservationStatus;
  udcId?: number;
  locationId?: number;
}

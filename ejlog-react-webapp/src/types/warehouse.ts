// ============================================================================
// EJLOG WMS - Warehouse Types
// Types per la gestione magazzini
// ============================================================================

/**
 * Tipo di magazzino
 */
export enum WarehouseType {
  VERTIMAG = 'Vertimag',
  CONTROLLER = 'Controller',
  PTL = 'PTL',
  STANDARD = 'Standard',
  REFRIGERATO = 'Refrigerato',
  ALTA_ROTAZIONE = 'Alta Rotazione',
}

/**
 * Stato del magazzino
 */
export enum WarehouseStatus {
  OK = 'OK',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  MANUTENZIONE = 'MANUTENZIONE',
  OFFLINE = 'OFFLINE',
}

/**
 * Interfaccia principale per il magazzino
 */
export interface Warehouse {
  idMagazzino: number;
  descrizione: string;
  tipoMagazzino: WarehouseType | string;
  statoMagazzino: WarehouseStatus;
  area: string;
  indirizzo?: string;
  capacita?: number;
  occupazione?: number;
  dataCreazione?: string;
  dataUltimaModifica?: string;
  note?: string;
}

/**
 * Filtri per la ricerca magazzini
 */
export interface WarehouseFilters {
  descrizione?: string;
  tipoMagazzino?: string;
  statoMagazzino?: WarehouseStatus;
  area?: string;
}

/**
 * Request per creazione/modifica magazzino
 */
export interface WarehouseRequest {
  descrizione: string;
  tipoMagazzino: string;
  area: string;
  indirizzo?: string;
  capacita?: number;
  note?: string;
}

/**
 * Response API per lista magazzini
 */
export interface WarehouseListResponse {
  data: Warehouse[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Area associabile al magazzino
 */
export interface WarehouseArea {
  id: number;
  codice: string;
  descrizione: string;
}

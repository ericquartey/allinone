// src/types/lists.ts

/**
 * TypeScript types for Lists Management
 * Based on backend API: ListApiController.java
 * Backend entities: Lista, RigaLista
 * Backend models: WSListHeaderExported, WSListRowExported
 */

/**
 * List Type enumeration
 * Based on TipoListaEnum in backend
 * IMPORTANT: Backend uses 1-based indexing!
 */
export enum ListType {
  PICKING = 1,
  REFILLING = 2,
  INVENTORY = 3
}

/**
 * List Status enumeration
 * Based on StatoListaEnum in backend
 */
export enum ListStatus {
  WAITING = 1,
  IN_EXECUTION = 2,
  TERMINATED = 3,
  SUSPENDED = 4
}

/**
 * Host Command enumeration for list operations
 * Based on HostCommandListEnum in backend
 */
export enum HostCommandList {
  NUOVA_LISTA = 1,      // Create new list
  ELIMINA_LISTA = 2,    // Delete list
  AGGIORNA_LISTA = 3,   // Update list header
  AGGIORNA_RIGA = 4     // Update list rows
}

/**
 * List Row interface
 * Maps to WSListRowExported in backend
 */
export interface ListRow {
  // Core fields
  listNumber: string;
  rowNumber: string;
  item: string;
  lineDescription?: string;
  requestedQty: number;
  processedQty?: number;

  // Lot and serial tracking
  lot?: string;
  serialNumber?: string;
  expiryDate?: string; // ISO date string

  // Additional fields
  barcodePtl?: string;
  rowSequence?: number;
  operatorInfo?: string;
  labelInfo?: string;

  // Auxiliary text fields (01-05)
  auxHostText01?: string;
  auxHostText02?: string;
  auxHostText03?: string;
  auxHostText04?: string;
  auxHostText05?: string;

  // Auxiliary integer fields (01-03)
  auxHostInt01?: number;
  auxHostInt02?: number;
  auxHostInt03?: number;

  // Auxiliary boolean fields (01-03)
  auxHostBit01?: boolean;
  auxHostBit02?: boolean;
  auxHostBit03?: boolean;

  // Auxiliary date fields (01-03)
  auxHostDate01?: string; // ISO date string
  auxHostDate02?: string;
  auxHostDate03?: string;

  // Auxiliary numeric fields (01-03)
  auxHostNum01?: number;
  auxHostNum02?: number;
  auxHostNum03?: number;
}

/**
 * List Header interface
 * Maps to WSListHeaderExported in backend
 */
export interface List {
  // Core fields
  id?: number;
  listNumber: string;
  listDescription?: string;
  listType: ListType;
  listStatus?: ListStatus;
  idArea?: number;
  idGruppoDestinazione?: number;

  // Related entities
  cause?: string; // Causale movimento code
  orderNumber?: string; // Commessa

  // Operation fields
  priority?: number;
  sequenzaLancio?: number;
  exitPoint?: number; // ID of GruppoDestinazione
  selectedWarehouses?: number[]; // Array of warehouse IDs
  userList?: string;
  utente?: string;
  numeroRighe?: number;
  numeroRigheTerminate?: number;
  numeroRigheNonEvadibili?: number;
  idCausaleMovimento?: number;
  terminata?: number;

  // Auxiliary text fields (01-05)
  auxHostText01?: string;
  auxHostText02?: string;
  auxHostText03?: string;
  auxHostText04?: string;
  auxHostText05?: string;

  // Auxiliary integer fields (01-03)
  auxHostInt01?: number;
  auxHostInt02?: number;
  auxHostInt03?: number;

  // Auxiliary boolean fields (01-03)
  auxHostBit01?: boolean;
  auxHostBit02?: boolean;
  auxHostBit03?: boolean;

  // Auxiliary date fields (01-03)
  auxHostDate01?: string; // ISO date string
  auxHostDate02?: string;
  auxHostDate03?: string;

  // Auxiliary numeric fields (01-03)
  auxHostNum01?: number;
  auxHostNum02?: number;
  auxHostNum03?: number;

  // List rows (populated when fetching list details)
  rows?: ListRow[];

  // Metadata (for display purposes)
  totalRows?: number;
  completedRows?: number;
  nomeArea?: string;
  locazionePTL?: string;
  dataCreazione?: string;
  dataModifica?: string;
  dataLancio?: string;
  dataInizioEvasione?: string;
  dataFineEvasione?: string;
  barcode?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * List with rows export format
 * Maps to WSListExport in backend
 */
export interface ListExport {
  listHeader: List;
  listRows: ListRow[];
}

/**
 * Filter options for list search
 * Based on GET /api/Lists query parameters
 */
export interface ListFilters {
  limit?: number;
  offset?: number;
  listNumber?: string;
  listType?: ListType;
  listStatus?: ListStatus;
}

/**
 * Response from GET /api/Lists
 * Maps to WSListsResponse in backend
 */
export interface ListsResponse {
  result: string; // "OK" or "NOT OK"
  message?: string;
  recordNumber: number;
  exported: ListExport[];
  errors?: WSError[];
}

/**
 * Error response structure
 * Maps to WSError in backend
 */
export interface WSError {
  errorMessage?: string;
  stackTrace?: string;
  description?: string;
}

/**
 * Imported list result
 * Maps to WSListImported in backend
 */
export interface ListImported {
  listNumber?: string;
  command?: number;
  status: string; // "OK" or "KO"
  message?: string;
}

/**
 * Standard response for POST operations
 * Maps to WSStandardResponse in backend
 */
export interface StandardResponse {
  result: string; // "OK" or "NOT OK"
  importedLists?: ListImported[];
  errors?: WSError[];
}

/**
 * Request body for creating a new list
 * Command: NUOVA_LISTA
 */
export interface CreateListRequest {
  command: HostCommandList.NUOVA_LISTA;
  listHeader: {
    listNumber: string;
    listDescription?: string;
    listType: ListType;
    listStatus?: ListStatus;
    cause?: string;
    orderNumber?: string;
    priority?: number;
    exitPoint?: number;
    selectedWarehouses?: number[];

    // Auxiliary fields (optional)
    auxHostText01?: string;
    auxHostText02?: string;
    auxHostText03?: string;
    auxHostText04?: string;
    auxHostText05?: string;
    auxHostInt01?: number;
    auxHostInt02?: number;
    auxHostInt03?: number;
    auxHostBit01?: boolean;
    auxHostBit02?: boolean;
    auxHostBit03?: boolean;
    auxHostDate01?: string;
    auxHostDate02?: string;
    auxHostDate03?: string;
    auxHostNum01?: number;
    auxHostNum02?: number;
    auxHostNum03?: number;
  };
  listRows: {
    rowNumber: string;
    item: string;
    lineDescription?: string;
    requestedQty: number;
    lot?: string;
    serialNumber?: string;
    expiryDate?: string;
    rowSequence?: number;
    operatorInfo?: string;
    labelInfo?: string;

    // Auxiliary fields (optional)
    auxHostText01?: string;
    auxHostText02?: string;
    auxHostText03?: string;
    auxHostText04?: string;
    auxHostText05?: string;
    auxHostInt01?: number;
    auxHostInt02?: number;
    auxHostInt03?: number;
    auxHostBit01?: boolean;
    auxHostBit02?: boolean;
    auxHostBit03?: boolean;
    auxHostDate01?: string;
    auxHostDate02?: string;
    auxHostDate03?: string;
    auxHostNum01?: number;
    auxHostNum02?: number;
    auxHostNum03?: number;
  }[];
}

/**
 * Request body for updating list header
 * Command: AGGIORNA_LISTA
 */
export interface UpdateListRequest {
  command: HostCommandList.AGGIORNA_LISTA;
  listHeader: {
    listNumber: string;
    listDescription?: string;
    priority?: number;

    // Auxiliary fields (optional)
    auxHostText01?: string;
    auxHostText02?: string;
    auxHostText03?: string;
    auxHostText04?: string;
    auxHostText05?: string;
    auxHostInt01?: number;
    auxHostInt02?: number;
    auxHostInt03?: number;
    auxHostBit01?: boolean;
    auxHostBit02?: boolean;
    auxHostBit03?: boolean;
    auxHostDate01?: string;
    auxHostDate02?: string;
    auxHostDate03?: string;
    auxHostNum01?: number;
    auxHostNum02?: number;
    auxHostNum03?: number;
  };
  listRows: [];
}

/**
 * Request body for deleting a list
 * Command: ELIMINA_LISTA
 */
export interface DeleteListRequest {
  command: HostCommandList.ELIMINA_LISTA;
  listHeader: {
    listNumber: string;
  };
  listRows: [];
}

/**
 * Request body for updating list rows
 * Command: AGGIORNA_RIGA
 */
export interface UpdateListRowsRequest {
  command: HostCommandList.AGGIORNA_RIGA;
  listHeader: {
    listNumber: string;
  };
  listRows: {
    listNumber: string;
    rowNumber: string;
    item: string;
    requestedQty: number;
    lineDescription?: string;
    lot?: string;
    serialNumber?: string;
    expiryDate?: string;
    rowSequence?: number;
    operatorInfo?: string;
    labelInfo?: string;

    // Auxiliary fields (optional)
    auxHostText01?: string;
    auxHostText02?: string;
    auxHostText03?: string;
    auxHostText04?: string;
    auxHostText05?: string;
    auxHostInt01?: number;
    auxHostInt02?: number;
    auxHostInt03?: number;
    auxHostBit01?: boolean;
    auxHostBit02?: boolean;
    auxHostBit03?: boolean;
    auxHostDate01?: string;
    auxHostDate02?: string;
    auxHostDate03?: string;
    auxHostNum01?: number;
    auxHostNum02?: number;
    auxHostNum03?: number;
  }[];
}

/**
 * Helper type for form data
 */
export interface ListFormData {
  listNumber: string;
  listDescription?: string;
  listType: ListType;
  listStatus?: ListStatus;
  cause?: string;
  orderNumber?: string;
  priority?: number;
  exitPoint?: number;
  selectedWarehouses?: number[];
  rows: ListRowFormData[];

  // Collapsible auxiliary sections
  showAuxFields?: boolean;
  auxHostText01?: string;
  auxHostText02?: string;
  auxHostText03?: string;
  auxHostText04?: string;
  auxHostText05?: string;
  auxHostInt01?: number;
  auxHostInt02?: number;
  auxHostInt03?: number;
  auxHostBit01?: boolean;
  auxHostBit02?: boolean;
  auxHostBit03?: boolean;
  auxHostDate01?: string;
  auxHostDate02?: string;
  auxHostDate03?: string;
  auxHostNum01?: number;
  auxHostNum02?: number;
  auxHostNum03?: number;
}

/**
 * Helper type for row form data
 */
export interface ListRowFormData {
  rowNumber: string;
  item: string;
  lineDescription?: string;
  requestedQty: number;
  processedQty?: number;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  rowSequence?: number;

  // Collapsible auxiliary sections
  showAuxFields?: boolean;
  auxHostText01?: string;
  auxHostText02?: string;
  auxHostText03?: string;
  auxHostText04?: string;
  auxHostText05?: string;
  auxHostInt01?: number;
  auxHostInt02?: number;
  auxHostInt03?: number;
  auxHostBit01?: boolean;
  auxHostBit02?: boolean;
  auxHostBit03?: boolean;
  auxHostDate01?: string;
  auxHostDate02?: string;
  auxHostDate03?: string;
  auxHostNum01?: number;
  auxHostNum02?: number;
  auxHostNum03?: number;
}

/**
 * Helper function to get list type label
 */
export const getListTypeLabel = (type: ListType): string => {
  switch (type) {
    case ListType.PICKING:
      return 'Picking';
    case ListType.REFILLING:
      return 'Refilling';
    case ListType.INVENTORY:
      return 'Inventory';
    default:
      return 'Unknown';
  }
};

/**
 * Helper function to get list status label
 */
export const getListStatusLabel = (status: ListStatus): string => {
  switch (status) {
    case ListStatus.WAITING:
      return 'In Attesa';
    case ListStatus.IN_EXECUTION:
      return 'In Esecuzione';
    case ListStatus.TERMINATED:
      return 'Terminata';
    case ListStatus.SUSPENDED:
      return 'Sospesa';
    default:
      return 'Unknown';
  }
};

/**
 * Helper function to get list status color
 */
export const getListStatusColor = (status: ListStatus): string => {
  switch (status) {
    case ListStatus.WAITING:
      return 'yellow';
    case ListStatus.IN_EXECUTION:
      return 'blue';
    case ListStatus.TERMINATED:
      return 'green';
    case ListStatus.SUSPENDED:
      return 'gray';
    default:
      return 'gray';
  }
};

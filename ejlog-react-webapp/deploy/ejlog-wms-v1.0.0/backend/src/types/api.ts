// ============================================================================
// EJLOG WMS - API Type Definitions
// Core types for API requests and responses
// ============================================================================

export type ListType = 'PICKING' | 'REFILLING' | 'INVENTORY' | 'VISION';
export type ListStatus = 'CREATED' | 'IN_EXECUTION' | 'COMPLETED' | 'CANCELLED' | 'IN_ATTESA';

export interface List {
  id: string;
  listNumber: string;
  listType: ListType;
  status: ListStatus;
  createdAt: string;
  completedAt?: string | null;
  priority: number;
  assignedTo?: string | null;
  refLista?: string;
  area?: string;
  gruppoDestinazione?: string;
  sequenzaLanco?: number;
  progress?: number;
  nLocazione?: string;
  pil?: string;
}

export interface PaginationParams {
  skip: number;
  take: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  result?: T[];
  exported?: T[];
  recordNumber: number;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
}

// Item/Article types
export interface Item {
  id: string;
  codArticle: string;
  descArticle: string;
  quantity: number;
  unit?: string;
  location?: string;
}

// Warehouse types
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type?: string;
}

// User types
export interface User {
  username: string;
  roles: string[];
  accessLevel: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Movement types
export interface Movement {
  id?: number;
  data?: string; // auxHostDate01 from backend
  articleId?: string; // item code
  item?: {
    codice?: string;
    descrizione?: string;
    um?: string;
  };
  quantity?: number; // deltaQty from backend
  oldQty?: number;
  newQty?: number;
  movementType?: string; // cause from backend
  tipoMovimento?: string; // alternative field name
  operationType?: number; // 1=prelievo, 2=ingresso, 3=rettifica
  listNumber?: string;
  lineNumber?: string;
  lot?: string;
  lotto?: string; // alternative field name
  serialNumber?: string;
  locationId?: string; // idLU
  location?: {
    codice?: string;
  };
  orderNumber?: string;
  user?: string; // userPpc or userList
  utente?: string; // alternative field name
  userPpc?: string;
  userList?: string;
  warehouseId?: number;
  plantId?: number;
  noteCause?: string;
}

// ============================================================================
// EJLOG WMS - Items Service Layer
// Centralized service for item/product management operations
// ============================================================================

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Item type enumeration
 */
export enum ItemType {
  PRODUCT = 0,
  RAW_MATERIAL = 1,
  SEMI_FINISHED = 2,
  FINISHED_GOOD = 3,
  CONSUMABLE = 4,
  SPARE_PART = 5,
}

/**
 * Item status enumeration
 */
export enum ItemStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  DISCONTINUED = 3,
  BLOCKED = 4,
}

/**
 * Unit of measure enumeration
 */
export enum UnitOfMeasure {
  PIECE = 'PZ',
  KG = 'KG',
  LITER = 'L',
  METER = 'M',
  BOX = 'BOX',
  PALLET = 'PLT',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Item interface - represents a product/article in the warehouse
 */
export interface Item {
  itemId: number;
  itemCode: string;
  itemDescription: string;
  itemType: ItemType;
  itemStatus: ItemStatus;
  unitOfMeasure: UnitOfMeasure;

  // Tracking requirements
  requiresLot: boolean;
  requiresSerialNumber: boolean;
  requiresExpiryDate: boolean;

  // Physical characteristics
  weight?: number;
  volume?: number;
  length?: number;
  width?: number;
  height?: number;

  // Classification
  category?: string;
  subCategory?: string;
  brand?: string;
  supplier?: string;

  // Barcodes
  barcode?: string;
  alternativeBarcodes?: string[];

  // Stock management
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;

  // Pricing
  unitCost?: number;
  unitPrice?: number;

  // Notes
  notes?: string;

  // Metadata
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/**
 * Item summary interface - lightweight version for lists
 */
export interface ItemSummary {
  itemId: number;
  itemCode: string;
  itemDescription: string;
  itemType: ItemType;
  itemStatus: ItemStatus;
  unitOfMeasure: UnitOfMeasure;
  barcode?: string;
  category?: string;
  currentStock?: number;
  requiresLot: boolean;
  requiresSerialNumber: boolean;
  requiresExpiryDate: boolean;
}

/**
 * Item stock information
 */
export interface ItemStock {
  itemCode: string;
  warehouseId: number;
  warehouseName: string;
  areaId?: number;
  areaName?: string;
  locationCode?: string;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  blockedQuantity: number;
  udcBarcode?: string;
  lastMovementDate?: string;
}

/**
 * Item movement/transaction
 */
export interface ItemMovement {
  movementId: number;
  movementDate: string;
  movementType: string;
  itemCode: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  fromLocation?: string;
  toLocation?: string;
  fromUdc?: string;
  toUdc?: string;
  listNumber?: string;
  operatorId?: string;
  operatorName?: string;
  notes?: string;
}

/**
 * Create item parameters
 */
export interface CreateItemParams {
  itemCode: string;
  itemDescription: string;
  itemType: ItemType;
  unitOfMeasure: UnitOfMeasure;
  requiresLot: boolean;
  requiresSerialNumber: boolean;
  requiresExpiryDate: boolean;
  weight?: number;
  volume?: number;
  category?: string;
  barcode?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  notes?: string;
}

/**
 * Update item parameters
 */
export interface UpdateItemParams {
  itemCode: string;
  itemDescription?: string;
  itemStatus?: ItemStatus;
  unitOfMeasure?: UnitOfMeasure;
  weight?: number;
  volume?: number;
  category?: string;
  barcode?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  notes?: string;
}

/**
 * Item filter parameters
 */
export interface ItemFilterParams {
  itemCode?: string;
  itemDescription?: string;
  itemType?: ItemType;
  itemStatus?: ItemStatus;
  category?: string;
  requiresLot?: boolean;
  requiresSerialNumber?: boolean;
  requiresExpiryDate?: boolean;
  barcode?: string;
  limit?: number;
  offset?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  result: 'OK' | 'ERROR';
  message?: string;
  data?: T;
  exportedItems?: T[];
  recordNumber?: number;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get list of items with optional filtering
 */
export async function getItems(filters?: ItemFilterParams): Promise<ApiResponse<ItemSummary[]>> {
  try {
    const response = await axios.post(`${API_BASE_URL}/items/search`, filters || {});
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

/**
 * Get item by ID
 */
export async function getItemById(itemId: number): Promise<Item | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/${itemId}`);
    if (response.data.result === 'OK') {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching item ${itemId}:`, error);
    throw error;
  }
}

/**
 * Get item by code
 */
export async function getItemByCode(itemCode: string): Promise<Item | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/code/${itemCode}`);
    if (response.data.result === 'OK') {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching item ${itemCode}:`, error);
    throw error;
  }
}

/**
 * Get item by barcode
 */
export async function getItemByBarcode(barcode: string): Promise<Item | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/barcode/${barcode}`);
    if (response.data.result === 'OK') {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching item by barcode ${barcode}:`, error);
    throw error;
  }
}

/**
 * Create new item
 */
export async function createItem(params: CreateItemParams): Promise<ApiResponse<Item>> {
  try {
    const response = await axios.post(`${API_BASE_URL}/items`, params);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

/**
 * Update existing item
 */
export async function updateItem(params: UpdateItemParams): Promise<ApiResponse<Item>> {
  try {
    const response = await axios.put(`${API_BASE_URL}/items/${params.itemCode}`, params);
    return response.data;
  } catch (error) {
    console.error(`Error updating item ${params.itemCode}:`, error);
    throw error;
  }
}

/**
 * Delete item
 */
export async function deleteItem(itemCode: string): Promise<ApiResponse<void>> {
  try {
    const response = await axios.delete(`${API_BASE_URL}/items/${itemCode}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${itemCode}:`, error);
    throw error;
  }
}

// ============================================================================
// STOCK OPERATIONS
// ============================================================================

/**
 * Get stock levels for an item across all warehouses
 */
export async function getItemStock(itemCode: string): Promise<ItemStock[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/${itemCode}/stock`);
    if (response.data.result === 'OK') {
      return response.data.exportedItems || [];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching stock for item ${itemCode}:`, error);
    throw error;
  }
}

/**
 * Get stock levels for an item in a specific warehouse
 */
export async function getItemStockByWarehouse(
  itemCode: string,
  warehouseId: number
): Promise<ItemStock[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/items/${itemCode}/stock/warehouse/${warehouseId}`
    );
    if (response.data.result === 'OK') {
      return response.data.exportedItems || [];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching stock for item ${itemCode} in warehouse ${warehouseId}:`, error);
    throw error;
  }
}

/**
 * Get item movements/transactions
 */
export async function getItemMovements(
  itemCode: string,
  fromDate?: string,
  toDate?: string
): Promise<ItemMovement[]> {
  try {
    const params: { fromDate?: string; toDate?: string } = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const response = await axios.get(`${API_BASE_URL}/items/${itemCode}/movements`, { params });
    if (response.data.result === 'OK') {
      return response.data.exportedItems || [];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching movements for item ${itemCode}:`, error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get item type label
 */
export function getItemTypeLabel(type: ItemType): string {
  const labels: { [key in ItemType]: string } = {
    [ItemType.PRODUCT]: 'Prodotto',
    [ItemType.RAW_MATERIAL]: 'Materia Prima',
    [ItemType.SEMI_FINISHED]: 'Semilavorato',
    [ItemType.FINISHED_GOOD]: 'Prodotto Finito',
    [ItemType.CONSUMABLE]: 'Consumabile',
    [ItemType.SPARE_PART]: 'Ricambio',
  };
  return labels[type] || 'Sconosciuto';
}

/**
 * Get item status label
 */
export function getItemStatusLabel(status: ItemStatus): string {
  const labels: { [key in ItemStatus]: string } = {
    [ItemStatus.ACTIVE]: 'Attivo',
    [ItemStatus.INACTIVE]: 'Inattivo',
    [ItemStatus.DISCONTINUED]: 'Dismesso',
    [ItemStatus.BLOCKED]: 'Bloccato',
  };
  return labels[status] || 'Sconosciuto';
}

/**
 * Get unit of measure label
 */
export function getUnitOfMeasureLabel(uom: UnitOfMeasure): string {
  const labels: { [key in UnitOfMeasure]: string } = {
    [UnitOfMeasure.PIECE]: 'Pezzi',
    [UnitOfMeasure.KG]: 'Chilogrammi',
    [UnitOfMeasure.LITER]: 'Litri',
    [UnitOfMeasure.METER]: 'Metri',
    [UnitOfMeasure.BOX]: 'Scatole',
    [UnitOfMeasure.PALLET]: 'Pallet',
  };
  return labels[uom] || uom;
}

/**
 * Calculate total stock quantity
 */
export function calculateTotalStock(stockLevels: ItemStock[]): number {
  return stockLevels.reduce((total, stock) => total + stock.quantity, 0);
}

/**
 * Calculate total available quantity
 */
export function calculateAvailableStock(stockLevels: ItemStock[]): number {
  return stockLevels.reduce((total, stock) => total + stock.availableQuantity, 0);
}

/**
 * Check if item is low on stock
 */
export function isLowStock(item: Item, currentStock: number): boolean {
  if (!item.minStockLevel) return false;
  return currentStock < item.minStockLevel;
}

/**
 * Check if item is overstocked
 */
export function isOverstocked(item: Item, currentStock: number): boolean {
  if (!item.maxStockLevel) return false;
  return currentStock > item.maxStockLevel;
}

/**
 * Validate item creation
 */
export function validateItemCreation(params: CreateItemParams): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (!params.itemCode || params.itemCode.trim() === '') {
    errors.itemCode = 'Codice articolo obbligatorio';
  }

  if (!params.itemDescription || params.itemDescription.trim() === '') {
    errors.itemDescription = 'Descrizione articolo obbligatoria';
  }

  if (params.weight && params.weight < 0) {
    errors.weight = 'Il peso non può essere negativo';
  }

  if (params.volume && params.volume < 0) {
    errors.volume = 'Il volume non può essere negativo';
  }

  if (params.minStockLevel && params.maxStockLevel) {
    if (params.minStockLevel > params.maxStockLevel) {
      errors.stockLevels = 'Il livello minimo non può superare il livello massimo';
    }
  }

  return errors;
}

/**
 * Validate item update
 */
export function validateItemUpdate(params: UpdateItemParams): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (!params.itemCode || params.itemCode.trim() === '') {
    errors.itemCode = 'Codice articolo obbligatorio';
  }

  if (params.weight && params.weight < 0) {
    errors.weight = 'Il peso non può essere negativo';
  }

  if (params.volume && params.volume < 0) {
    errors.volume = 'Il volume non può essere negativo';
  }

  return errors;
}

/**
 * Filter items by search term (itemCode or itemDescription)
 */
export function filterItemsBySearch(items: ItemSummary[], searchTerm: string): ItemSummary[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return items;
  }

  const term = searchTerm.toLowerCase().trim();
  return items.filter(
    (item) =>
      item.itemCode.toLowerCase().includes(term) ||
      item.itemDescription.toLowerCase().includes(term) ||
      (item.barcode && item.barcode.toLowerCase().includes(term))
  );
}

/**
 * Sort items by specified field
 */
export function sortItems(
  items: ItemSummary[],
  field: keyof ItemSummary,
  ascending: boolean = true
): ItemSummary[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return ascending ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

/**
 * Group items by category
 */
export function groupItemsByCategory(items: ItemSummary[]): { [category: string]: ItemSummary[] } {
  return items.reduce((groups, item) => {
    const category = item.category || 'Non Categorizzato';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as { [category: string]: ItemSummary[] });
}

/**
 * Get items requiring specific tracking
 */
export function getItemsRequiringLot(items: ItemSummary[]): ItemSummary[] {
  return items.filter((item) => item.requiresLot);
}

export function getItemsRequiringSerialNumber(items: ItemSummary[]): ItemSummary[] {
  return items.filter((item) => item.requiresSerialNumber);
}

export function getItemsRequiringExpiryDate(items: ItemSummary[]): ItemSummary[] {
  return items.filter((item) => item.requiresExpiryDate);
}

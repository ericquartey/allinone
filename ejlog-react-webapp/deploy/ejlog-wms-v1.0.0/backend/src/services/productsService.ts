// ============================================================================
// EJLOG WMS - Products Service
// Gestione prodotti - Service Layer
// TIMESTAMP: 2025-11-28 12:30 - FORCE REBUILD WITH MOCK DATA
// ============================================================================

import { apiClient, ApiResponse } from './api';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum ProductCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  SEMI_FINISHED = 'SEMI_FINISHED',
  FINISHED_GOOD = 'FINISHED_GOOD',
  PACKAGING = 'PACKAGING',
  SPARE_PART = 'SPARE_PART',
  CONSUMABLE = 'CONSUMABLE',
  TOOL = 'TOOL',
  OTHER = 'OTHER',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  PENDING = 'PENDING',
}

export enum StockLevel {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  EXCESS = 'EXCESS',
}

export enum UnitOfMeasure {
  PIECE = 'PIECE',
  KG = 'KG',
  GRAM = 'GRAM',
  LITER = 'LITER',
  METER = 'METER',
  BOX = 'BOX',
  PALLET = 'PALLET',
  PACK = 'PACK',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProductDimensions {
  width: number;
  depth: number;
  height: number;
  weight: number;
  volume?: number;
}

export interface ProductStock {
  available: number;
  reserved: number;
  inTransit: number;
  total: number;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
  stockLevel: StockLevel;
}

export interface ProductPricing {
  cost?: number;
  price?: number;
  currency?: string;
}

export interface ProductSupplier {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  leadTime?: number;
  minOrderQty?: number;
}

export interface ProductLocation {
  locationCode: string;
  zone: string;
  quantity: number;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  code: string;
  sku: string;
  barcode?: string;
  description: string;
  longDescription?: string;
  category: ProductCategory;
  status: ProductStatus;
  unitOfMeasure: UnitOfMeasure;
  dimensions: ProductDimensions;
  stock: ProductStock;
  pricing?: ProductPricing;
  manufacturer?: string;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  expiryDays?: number;
  batchTracked: boolean;
  serialTracked: boolean;
  lotTracked: boolean;
  perishable: boolean;
  hazardous: boolean;
  fragile: boolean;
  stackable: boolean;
  primarySupplier?: ProductSupplier;
  locations?: ProductLocation[];
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateProductParams {
  code: string;
  sku: string;
  barcode?: string;
  description: string;
  longDescription?: string;
  category: ProductCategory;
  unitOfMeasure: UnitOfMeasure;
  width: number;
  depth: number;
  height: number;
  weight: number;
  minLevel?: number;
  maxLevel?: number;
  reorderPoint?: number;
  cost?: number;
  price?: number;
  manufacturer?: string;
  brand?: string;
  model?: string;
  batchTracked?: boolean;
  serialTracked?: boolean;
  lotTracked?: boolean;
  perishable?: boolean;
  hazardous?: boolean;
  fragile?: boolean;
  stackable?: boolean;
  expiryDays?: number;
  notes?: string;
}

export interface UpdateProductParams {
  description?: string;
  longDescription?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  unitOfMeasure?: UnitOfMeasure;
  width?: number;
  depth?: number;
  height?: number;
  weight?: number;
  minLevel?: number;
  maxLevel?: number;
  reorderPoint?: number;
  cost?: number;
  price?: number;
  manufacturer?: string;
  brand?: string;
  model?: string;
  batchTracked?: boolean;
  serialTracked?: boolean;
  lotTracked?: boolean;
  perishable?: boolean;
  hazardous?: boolean;
  fragile?: boolean;
  stackable?: boolean;
  expiryDays?: number;
  notes?: string;
}

export interface ProductFilters {
  category?: ProductCategory;
  status?: ProductStatus;
  stockLevel?: StockLevel;
  search?: string;
  manufacturer?: string;
  brand?: string;
  perishable?: boolean;
  hazardous?: boolean;
}

export interface AdjustStockParams {
  quantity: number;
  reason: string;
  notes?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Recupera tutti i prodotti
 */
export async function getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
  try {
    // ========================================================================
    // NOTA: Backend endpoint /products non sempre disponibile
    // Usiamo mock data temporaneo per testing frontend
    // ========================================================================

    console.warn('[Products Service] Using mock data for /products endpoint - 15 products available');

    // Mock data per testing frontend - 15 prodotti realistici
    const mockProducts: Product[] = [
      {
        id: 1,
        code: 'ART001',
        sku: 'VIT-M6-20-ZN',
        barcode: '8012345678901',
        description: 'Vite M6x20 zincata',
        category: ProductCategory.SPARE_PART,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 6, depth: 6, height: 20, weight: 0.005 },
        stock: { available: 1500, reserved: 200, inTransit: 0, total: 1700, minLevel: 500, maxLevel: 3000, reorderPoint: 800, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 0.05, price: 0.12, currency: 'EUR' },
        manufacturer: 'FastenPro',
        brand: 'FastenPro',
        batchTracked: false,
        serialTracked: false,
        lotTracked: true,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        code: 'ART002',
        sku: 'DADO-M6-AUTO',
        barcode: '8012345678902',
        description: 'Dado M6 autobloccante',
        category: ProductCategory.SPARE_PART,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 10, depth: 10, height: 5, weight: 0.003 },
        stock: { available: 2300, reserved: 150, inTransit: 500, total: 2950, minLevel: 800, maxLevel: 5000, reorderPoint: 1200, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 0.03, price: 0.08, currency: 'EUR' },
        manufacturer: 'FastenPro',
        brand: 'FastenPro',
        batchTracked: false,
        serialTracked: false,
        lotTracked: true,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-01-15T10:05:00Z',
      },
      {
        id: 3,
        code: 'MAT001',
        sku: 'LAMIERA-2MM-ACC',
        barcode: '8012345678903',
        description: 'Lamiera acciaio 2mm',
        category: ProductCategory.RAW_MATERIAL,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.KG,
        dimensions: { width: 1000, depth: 2000, height: 2, weight: 31.4 },
        stock: { available: 120, reserved: 30, inTransit: 0, total: 150, minLevel: 50, maxLevel: 500, reorderPoint: 100, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 4.50, price: 7.80, currency: 'EUR' },
        manufacturer: 'SteelItalia',
        brand: 'SteelItalia',
        batchTracked: true,
        serialTracked: false,
        lotTracked: true,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-02-10T14:20:00Z',
      },
      {
        id: 4,
        code: 'ELE001',
        sku: 'MOT-EL-2.2KW',
        barcode: '8012345678904',
        description: 'Motore elettrico 2.2kW',
        category: ProductCategory.FINISHED_GOOD,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 250, depth: 350, height: 280, weight: 18.5 },
        stock: { available: 12, reserved: 3, inTransit: 0, total: 15, minLevel: 5, maxLevel: 30, reorderPoint: 8, stockLevel: StockLevel.LOW },
        pricing: { cost: 280.00, price: 450.00, currency: 'EUR' },
        manufacturer: 'ElectroMotors',
        brand: 'ElectroMotors Pro',
        batchTracked: false,
        serialTracked: true,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: true,
        stackable: false,
        createdAt: '2024-03-05T09:15:00Z',
      },
      {
        id: 5,
        code: 'PKG001',
        sku: 'SCATOLA-40X30X20',
        barcode: '8012345678905',
        description: 'Scatola cartone 40x30x20cm',
        category: ProductCategory.PACKAGING,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 400, depth: 300, height: 200, weight: 0.350 },
        stock: { available: 450, reserved: 50, inTransit: 200, total: 700, minLevel: 200, maxLevel: 1000, reorderPoint: 300, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 0.80, price: 1.50, currency: 'EUR' },
        manufacturer: 'PackagingPlus',
        brand: 'EcoBox',
        batchTracked: false,
        serialTracked: false,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: true,
        stackable: true,
        createdAt: '2024-01-20T11:00:00Z',
      },
      {
        id: 6,
        code: 'CONS001',
        sku: 'OLIO-TAGL-5L',
        barcode: '8012345678906',
        description: 'Olio da taglio 5L',
        category: ProductCategory.CONSUMABLE,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.LITER,
        dimensions: { width: 180, depth: 120, height: 250, weight: 4.5 },
        stock: { available: 85, reserved: 15, inTransit: 0, total: 100, minLevel: 30, maxLevel: 200, reorderPoint: 50, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 12.50, price: 22.00, currency: 'EUR' },
        manufacturer: 'LubriTech',
        brand: 'CoolCut',
        batchTracked: true,
        serialTracked: false,
        lotTracked: true,
        perishable: true,
        hazardous: true,
        fragile: false,
        stackable: true,
        expiryDays: 730,
        createdAt: '2024-02-15T13:30:00Z',
      },
      {
        id: 7,
        code: 'TOOL001',
        sku: 'PUNTE-HSS-SET',
        barcode: '8012345678907',
        description: 'Set punte HSS 1-10mm (19pz)',
        category: ProductCategory.TOOL,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PACK,
        dimensions: { width: 220, depth: 140, height: 35, weight: 0.950 },
        stock: { available: 28, reserved: 5, inTransit: 0, total: 33, minLevel: 10, maxLevel: 50, reorderPoint: 15, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 35.00, price: 59.90, currency: 'EUR' },
        manufacturer: 'ToolMaster',
        brand: 'ToolMaster Pro',
        batchTracked: false,
        serialTracked: false,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: true,
        stackable: true,
        createdAt: '2024-03-01T10:45:00Z',
      },
      {
        id: 8,
        code: 'SEMI001',
        sku: 'FLANGIA-80-GREZZO',
        barcode: '8012345678908',
        description: 'Flangia Ø80mm grezza',
        category: ProductCategory.SEMI_FINISHED,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 80, depth: 80, height: 25, weight: 0.850 },
        stock: { available: 145, reserved: 25, inTransit: 0, total: 170, minLevel: 50, maxLevel: 300, reorderPoint: 80, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 5.20, price: 9.50, currency: 'EUR' },
        manufacturer: 'MeccanicaPrecisa',
        brand: 'MeccanicaPrecisa',
        batchTracked: true,
        serialTracked: false,
        lotTracked: true,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-02-20T15:00:00Z',
      },
      {
        id: 9,
        code: 'FIN001',
        sku: 'RIDUTTORE-1-50',
        barcode: '8012345678909',
        description: 'Riduttore 1:50 flangiato',
        category: ProductCategory.FINISHED_GOOD,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 180, depth: 220, height: 200, weight: 12.5 },
        stock: { available: 8, reserved: 2, inTransit: 5, total: 15, minLevel: 5, maxLevel: 25, reorderPoint: 10, stockLevel: StockLevel.LOW },
        pricing: { cost: 180.00, price: 320.00, currency: 'EUR' },
        manufacturer: 'GearTech',
        brand: 'GearTech Industry',
        batchTracked: false,
        serialTracked: true,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: true,
        stackable: false,
        createdAt: '2024-03-10T09:00:00Z',
      },
      {
        id: 10,
        code: 'HYD001',
        sku: 'CIL-IDR-50-300',
        barcode: '8012345678910',
        description: 'Cilindro idraulico Ø50 C=300mm',
        category: ProductCategory.FINISHED_GOOD,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 60, depth: 60, height: 450, weight: 8.200 },
        stock: { available: 6, reserved: 1, inTransit: 0, total: 7, minLevel: 3, maxLevel: 15, reorderPoint: 5, stockLevel: StockLevel.LOW },
        pricing: { cost: 220.00, price: 380.00, currency: 'EUR' },
        manufacturer: 'HydroSystem',
        brand: 'HydroSystem Pro',
        batchTracked: false,
        serialTracked: true,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: true,
        stackable: false,
        createdAt: '2024-03-15T14:00:00Z',
      },
      {
        id: 11,
        code: 'RAW001',
        sku: 'TUBO-ACC-25MM',
        barcode: '8012345678911',
        description: 'Tubo acciaio Ø25mm sp.2mm',
        category: ProductCategory.RAW_MATERIAL,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.METER,
        dimensions: { width: 25, depth: 25, height: 6000, weight: 2.950 },
        stock: { available: 340, reserved: 60, inTransit: 0, total: 400, minLevel: 100, maxLevel: 800, reorderPoint: 200, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 3.80, price: 6.50, currency: 'EUR' },
        manufacturer: 'TubiMetal',
        brand: 'TubiMetal',
        batchTracked: true,
        serialTracked: false,
        lotTracked: true,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-02-05T10:30:00Z',
      },
      {
        id: 12,
        code: 'PKG002',
        sku: 'PALLET-EUR-120X80',
        barcode: '8012345678912',
        description: 'Pallet Europallet 120x80cm',
        category: ProductCategory.PACKAGING,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 1200, depth: 800, height: 144, weight: 25.0 },
        stock: { available: 45, reserved: 10, inTransit: 20, total: 75, minLevel: 20, maxLevel: 100, reorderPoint: 30, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 12.00, price: 18.50, currency: 'EUR' },
        manufacturer: 'PalletItalia',
        brand: 'EuroPallet',
        batchTracked: false,
        serialTracked: false,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-01-10T08:00:00Z',
      },
      {
        id: 13,
        code: 'DISC001',
        sku: 'GUARN-OR-20X3',
        barcode: '8012345678913',
        description: 'Guarnizione O-Ring 20x3mm NBR',
        category: ProductCategory.SPARE_PART,
        status: ProductStatus.DISCONTINUED,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 20, depth: 20, height: 3, weight: 0.002 },
        stock: { available: 5, reserved: 0, inTransit: 0, total: 5, minLevel: 0, maxLevel: 0, reorderPoint: 0, stockLevel: StockLevel.OUT_OF_STOCK },
        pricing: { cost: 0.15, price: 0.35, currency: 'EUR' },
        manufacturer: 'SealTech',
        brand: 'SealTech',
        batchTracked: false,
        serialTracked: false,
        lotTracked: true,
        perishable: true,
        hazardous: false,
        fragile: false,
        stackable: true,
        expiryDays: 1825,
        createdAt: '2023-05-15T12:00:00Z',
      },
      {
        id: 14,
        code: 'ART003',
        sku: 'ROND-M6-PIANA',
        barcode: '8012345678914',
        description: 'Rondella M6 piana zincata',
        category: ProductCategory.SPARE_PART,
        status: ProductStatus.ACTIVE,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 12, depth: 12, height: 1.6, weight: 0.001 },
        stock: { available: 3200, reserved: 400, inTransit: 0, total: 3600, minLevel: 1000, maxLevel: 5000, reorderPoint: 1500, stockLevel: StockLevel.NORMAL },
        pricing: { cost: 0.01, price: 0.03, currency: 'EUR' },
        manufacturer: 'FastenPro',
        brand: 'FastenPro',
        batchTracked: false,
        serialTracked: false,
        lotTracked: true,
        perishable: false,
        hazardous: false,
        fragile: false,
        stackable: true,
        createdAt: '2024-01-15T10:10:00Z',
      },
      {
        id: 15,
        code: 'PEND001',
        sku: 'MOT-EL-5.5KW-PEND',
        barcode: '8012345678915',
        description: 'Motore elettrico 5.5kW (in arrivo)',
        category: ProductCategory.FINISHED_GOOD,
        status: ProductStatus.PENDING,
        unitOfMeasure: UnitOfMeasure.PIECE,
        dimensions: { width: 320, depth: 420, height: 350, weight: 35.0 },
        stock: { available: 0, reserved: 0, inTransit: 10, total: 10, minLevel: 2, maxLevel: 15, reorderPoint: 5, stockLevel: StockLevel.OUT_OF_STOCK },
        pricing: { cost: 520.00, price: 850.00, currency: 'EUR' },
        manufacturer: 'ElectroMotors',
        brand: 'ElectroMotors Pro',
        batchTracked: false,
        serialTracked: true,
        lotTracked: false,
        perishable: false,
        hazardous: false,
        fragile: true,
        stackable: false,
        createdAt: '2024-03-20T16:00:00Z',
      },
    ];

    // Apply filters if provided (same logic as backend would)
    let filteredProducts = [...mockProducts];

    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }
      if (filters.status) {
        filteredProducts = filteredProducts.filter(p => p.status === filters.status);
      }
      if (filters.stockLevel) {
        filteredProducts = filteredProducts.filter(p => p.stock.stockLevel === filters.stockLevel);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.code.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.barcode?.toLowerCase().includes(searchLower)
        );
      }
      if (filters.manufacturer) {
        filteredProducts = filteredProducts.filter(p => p.manufacturer?.toLowerCase().includes(filters.manufacturer!.toLowerCase()));
      }
      if (filters.brand) {
        filteredProducts = filteredProducts.filter(p => p.brand?.toLowerCase().includes(filters.brand!.toLowerCase()));
      }
      if (filters.perishable !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.perishable === filters.perishable);
      }
      if (filters.hazardous !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.hazardous === filters.hazardous);
      }
    }

    return {
      result: 'OK',
      data: filteredProducts,
      message: 'Prodotti caricati con successo (mock data)',
    };

    // ========================================================================
    // CODICE ORIGINALE DA RIABILITARE QUANDO BACKEND SARA' PRONTO:
    // ========================================================================
    // const params = new URLSearchParams();
    // if (filters?.category) params.append('category', filters.category);
    // if (filters?.status) params.append('status', filters.status);
    // if (filters?.stockLevel) params.append('stockLevel', filters.stockLevel);
    // if (filters?.search) params.append('search', filters.search);
    // if (filters?.manufacturer) params.append('manufacturer', filters.manufacturer);
    // if (filters?.brand) params.append('brand', filters.brand);
    // if (filters?.perishable !== undefined) params.append('perishable', String(filters.perishable));
    // if (filters?.hazardous !== undefined) params.append('hazardous', String(filters.hazardous));
    //
    // const queryString = params.toString();
    // const url = queryString ? `/products?${queryString}` : '/products';
    //
    // return await apiClient.get<Product[]>(url);
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei prodotti',
    };
  }
}

/**
 * Recupera un singolo prodotto per codice
 */
export async function getProductByCode(code: string): Promise<ApiResponse<Product>> {
  try {
    return await apiClient.get<Product>(`/products/${code}`);
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero del prodotto',
    };
  }
}

/**
 * Recupera un prodotto per barcode
 */
export async function getProductByBarcode(barcode: string): Promise<ApiResponse<Product>> {
  try {
    return await apiClient.get<Product>(`/products/barcode/${barcode}`);
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero del prodotto',
    };
  }
}

/**
 * Crea un nuovo prodotto
 */
export async function createProduct(params: CreateProductParams): Promise<ApiResponse<Product>> {
  try {
    return await apiClient.post<Product>('/products', params);
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella creazione del prodotto',
    };
  }
}

/**
 * Aggiorna un prodotto esistente
 */
export async function updateProduct(
  code: string,
  params: UpdateProductParams
): Promise<ApiResponse<Product>> {
  try {
    return await apiClient.put<Product>(`/products/${code}`, params);
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiornamento del prodotto',
    };
  }
}

/**
 * Aggiorna lo status di un prodotto
 */
export async function updateProductStatus(
  code: string,
  status: ProductStatus
): Promise<ApiResponse<Product>> {
  try {
    return await apiClient.post<Product>(`/products/${code}/status`, { status });
  } catch (error) {
    console.error('Error updating product status:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiornamento dello status',
    };
  }
}

/**
 * Elimina un prodotto
 */
export async function deleteProduct(code: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`/products/${code}`);
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'eliminazione del prodotto',
    };
  }
}

/**
 * Aggiusta il livello di stock manualmente
 */
export async function adjustStock(
  code: string,
  params: AdjustStockParams
): Promise<ApiResponse<Product>> {
  try {
    return await apiClient.post<Product>(`/products/${code}/adjust-stock`, params);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiustamento dello stock',
    };
  }
}

/**
 * Recupera le categorie disponibili
 */
export async function getCategories(): Promise<ApiResponse<string[]>> {
  try {
    return await apiClient.get<string[]>('/products/categories');
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle categorie',
    };
  }
}

/**
 * Recupera i produttori disponibili
 */
export async function getManufacturers(): Promise<ApiResponse<string[]>> {
  try {
    return await apiClient.get<string[]>('/products/manufacturers');
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei produttori',
    };
  }
}

/**
 * Recupera i brand disponibili
 */
export async function getBrands(): Promise<ApiResponse<string[]>> {
  try {
    return await apiClient.get<string[]>('/products/brands');
  } catch (error) {
    console.error('Error fetching brands:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei brand',
    };
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateProductCreation(params: CreateProductParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.code || params.code.trim().length === 0) {
    errors.code = 'Il codice è obbligatorio';
  } else if (params.code.length < 2 || params.code.length > 50) {
    errors.code = 'Il codice deve essere tra 2 e 50 caratteri';
  }

  if (!params.sku || params.sku.trim().length === 0) {
    errors.sku = 'Lo SKU è obbligatorio';
  } else if (params.sku.length < 2 || params.sku.length > 50) {
    errors.sku = 'Lo SKU deve essere tra 2 e 50 caratteri';
  }

  if (!params.description || params.description.trim().length === 0) {
    errors.description = 'La descrizione è obbligatoria';
  } else if (params.description.length < 3 || params.description.length > 200) {
    errors.description = 'La descrizione deve essere tra 3 e 200 caratteri';
  }

  if (!params.category) {
    errors.category = 'La categoria è obbligatoria';
  }

  if (!params.unitOfMeasure) {
    errors.unitOfMeasure = 'L\'unità di misura è obbligatoria';
  }

  if (params.width <= 0 || params.depth <= 0 || params.height <= 0) {
    errors.dimensions = 'Tutte le dimensioni devono essere maggiori di zero';
  }

  if (params.weight <= 0) {
    errors.weight = 'Il peso deve essere maggiore di zero';
  }

  if (params.minLevel !== undefined && params.minLevel < 0) {
    errors.minLevel = 'Il livello minimo non può essere negativo';
  }

  if (params.maxLevel !== undefined && params.maxLevel < 0) {
    errors.maxLevel = 'Il livello massimo non può essere negativo';
  }

  if (
    params.minLevel !== undefined &&
    params.maxLevel !== undefined &&
    params.minLevel > params.maxLevel
  ) {
    errors.levels = 'Il livello minimo non può essere maggiore del massimo';
  }

  if (params.reorderPoint !== undefined && params.reorderPoint < 0) {
    errors.reorderPoint = 'Il punto di riordino non può essere negativo';
  }

  if (params.cost !== undefined && params.cost < 0) {
    errors.cost = 'Il costo non può essere negativo';
  }

  if (params.price !== undefined && params.price < 0) {
    errors.price = 'Il prezzo non può essere negativo';
  }

  if (params.expiryDays !== undefined && params.expiryDays < 0) {
    errors.expiryDays = 'I giorni di scadenza non possono essere negativi';
  }

  return errors;
}

export function validateProductUpdate(params: UpdateProductParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (params.description !== undefined && params.description.trim().length === 0) {
    errors.description = 'La descrizione non può essere vuota';
  } else if (params.description && (params.description.length < 3 || params.description.length > 200)) {
    errors.description = 'La descrizione deve essere tra 3 e 200 caratteri';
  }

  if (params.width !== undefined && params.width <= 0) {
    errors.width = 'La larghezza deve essere maggiore di zero';
  }

  if (params.depth !== undefined && params.depth <= 0) {
    errors.depth = 'La profondità deve essere maggiore di zero';
  }

  if (params.height !== undefined && params.height <= 0) {
    errors.height = 'L\'altezza deve essere maggiore di zero';
  }

  if (params.weight !== undefined && params.weight <= 0) {
    errors.weight = 'Il peso deve essere maggiore di zero';
  }

  if (params.minLevel !== undefined && params.minLevel < 0) {
    errors.minLevel = 'Il livello minimo non può essere negativo';
  }

  if (params.maxLevel !== undefined && params.maxLevel < 0) {
    errors.maxLevel = 'Il livello massimo non può essere negativo';
  }

  if (params.cost !== undefined && params.cost < 0) {
    errors.cost = 'Il costo non può essere negativo';
  }

  if (params.price !== undefined && params.price < 0) {
    errors.price = 'Il prezzo non può essere negativo';
  }

  if (params.expiryDays !== undefined && params.expiryDays < 0) {
    errors.expiryDays = 'I giorni di scadenza non possono essere negativi';
  }

  return errors;
}

export function validateStockAdjustment(params: AdjustStockParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.reason || params.reason.trim().length === 0) {
    errors.reason = 'La motivazione è obbligatoria';
  }

  if (params.quantity === 0) {
    errors.quantity = 'La quantità non può essere zero';
  }

  return errors;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcola il volume del prodotto in m³
 */
export function calculateVolume(product: Product): number {
  const { width, depth, height } = product.dimensions;
  // Convert mm to m and calculate volume
  return (width / 1000) * (depth / 1000) * (height / 1000);
}

/**
 * Determina se un prodotto è disponibile per spedizione
 */
export function isProductAvailable(product: Product): boolean {
  return (
    product.status === ProductStatus.ACTIVE &&
    product.stock.available > 0
  );
}

/**
 * Determina se un prodotto ha stock basso
 */
export function hasLowStock(product: Product): boolean {
  return product.stock.stockLevel === StockLevel.LOW || product.stock.stockLevel === StockLevel.OUT_OF_STOCK;
}

/**
 * Determina se un prodotto deve essere riordinato
 */
export function shouldReorder(product: Product): boolean {
  return product.stock.total <= product.stock.reorderPoint;
}

/**
 * Determina il colore del badge per lo status
 */
export function getProductStatusColor(status: ProductStatus): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case ProductStatus.ACTIVE:
      return 'success';
    case ProductStatus.PENDING:
      return 'warning';
    case ProductStatus.INACTIVE:
      return 'default';
    case ProductStatus.DISCONTINUED:
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Determina il colore del badge per il livello di stock
 */
export function getStockLevelColor(level: StockLevel): 'success' | 'warning' | 'error' | 'default' {
  switch (level) {
    case StockLevel.OUT_OF_STOCK:
      return 'error';
    case StockLevel.LOW:
      return 'warning';
    case StockLevel.NORMAL:
      return 'success';
    case StockLevel.HIGH:
      return 'success';
    case StockLevel.EXCESS:
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Ottiene la label tradotta per la categoria
 */
export function getCategoryLabel(category: ProductCategory): string {
  const labels: Record<ProductCategory, string> = {
    [ProductCategory.RAW_MATERIAL]: 'Materia Prima',
    [ProductCategory.SEMI_FINISHED]: 'Semilavorato',
    [ProductCategory.FINISHED_GOOD]: 'Prodotto Finito',
    [ProductCategory.PACKAGING]: 'Imballaggio',
    [ProductCategory.SPARE_PART]: 'Ricambio',
    [ProductCategory.CONSUMABLE]: 'Consumabile',
    [ProductCategory.TOOL]: 'Utensile',
    [ProductCategory.OTHER]: 'Altro',
  };
  return labels[category] || category;
}

/**
 * Ottiene la label tradotta per lo status
 */
export function getProductStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    [ProductStatus.ACTIVE]: 'Attivo',
    [ProductStatus.INACTIVE]: 'Inattivo',
    [ProductStatus.DISCONTINUED]: 'Dismesso',
    [ProductStatus.PENDING]: 'In Attesa',
  };
  return labels[status] || status;
}

/**
 * Ottiene la label tradotta per il livello di stock
 */
export function getStockLevelLabel(level: StockLevel): string {
  const labels: Record<StockLevel, string> = {
    [StockLevel.OUT_OF_STOCK]: 'Esaurito',
    [StockLevel.LOW]: 'Basso',
    [StockLevel.NORMAL]: 'Normale',
    [StockLevel.HIGH]: 'Alto',
    [StockLevel.EXCESS]: 'Eccesso',
  };
  return labels[level] || level;
}

/**
 * Ottiene la label tradotta per l'unità di misura
 */
export function getUnitOfMeasureLabel(unit: UnitOfMeasure): string {
  const labels: Record<UnitOfMeasure, string> = {
    [UnitOfMeasure.PIECE]: 'Pezzi',
    [UnitOfMeasure.KG]: 'Kg',
    [UnitOfMeasure.GRAM]: 'Grammi',
    [UnitOfMeasure.LITER]: 'Litri',
    [UnitOfMeasure.METER]: 'Metri',
    [UnitOfMeasure.BOX]: 'Scatole',
    [UnitOfMeasure.PALLET]: 'Pallet',
    [UnitOfMeasure.PACK]: 'Confezioni',
  };
  return labels[unit] || unit;
}

/**
 * Filtra i prodotti in base ai criteri forniti
 */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.status && product.status !== filters.status) return false;
    if (filters.stockLevel && product.stock.stockLevel !== filters.stockLevel) return false;
    if (filters.manufacturer && product.manufacturer !== filters.manufacturer) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    if (filters.perishable !== undefined && product.perishable !== filters.perishable) return false;
    if (filters.hazardous !== undefined && product.hazardous !== filters.hazardous) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        product.code.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchLower)) ||
        (product.manufacturer && product.manufacturer.toLowerCase().includes(searchLower)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
}

/**
 * Ordina i prodotti per livello di stock (priorità ai bassi)
 */
export function sortProductsByStockLevel(products: Product[], ascending = true): Product[] {
  const levelOrder: Record<StockLevel, number> = {
    [StockLevel.OUT_OF_STOCK]: 0,
    [StockLevel.LOW]: 1,
    [StockLevel.NORMAL]: 2,
    [StockLevel.HIGH]: 3,
    [StockLevel.EXCESS]: 4,
  };

  return [...products].sort((a, b) => {
    const orderA = levelOrder[a.stock.stockLevel];
    const orderB = levelOrder[b.stock.stockLevel];
    return ascending ? orderA - orderB : orderB - orderA;
  });
}

/**
 * Raggruppa i prodotti per categoria
 */
export function groupProductsByCategory(products: Product[]): Record<string, Product[]> {
  return products.reduce((acc, product) => {
    const categoryLabel = getCategoryLabel(product.category);
    if (!acc[categoryLabel]) {
      acc[categoryLabel] = [];
    }
    acc[categoryLabel].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
}

/**
 * Calcola statistiche per una lista di prodotti
 */
export function getProductStats(products: Product[]) {
  const total = products.length;
  const active = products.filter((p) => p.status === ProductStatus.ACTIVE).length;
  const inactive = products.filter((p) => p.status === ProductStatus.INACTIVE).length;
  const discontinued = products.filter((p) => p.status === ProductStatus.DISCONTINUED).length;

  const outOfStock = products.filter((p) => p.stock.stockLevel === StockLevel.OUT_OF_STOCK).length;
  const lowStock = products.filter((p) => p.stock.stockLevel === StockLevel.LOW).length;
  const needReorder = products.filter((p) => shouldReorder(p)).length;

  const totalValue = products.reduce((sum, p) => {
    const price = p.pricing?.price || 0;
    const qty = p.stock.total;
    return sum + (price * qty);
  }, 0);

  const totalWeight = products.reduce((sum, p) => sum + (p.dimensions.weight * p.stock.total), 0);

  const perishable = products.filter((p) => p.perishable).length;
  const hazardous = products.filter((p) => p.hazardous).length;

  return {
    total,
    active,
    inactive,
    discontinued,
    outOfStock,
    lowStock,
    needReorder,
    totalValue,
    totalWeight,
    perishable,
    hazardous,
  };
}

/**
 * Formatta il prezzo con valuta
 */
export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Formatta il peso
 */
export function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} kg`;
  }
  return `${weight.toFixed(0)} g`;
}

/**
 * Formatta il volume
 */
export function formatVolume(volume: number): string {
  return `${volume.toFixed(3)} m³`;
}

/**
 * Calcola la percentuale di stock disponibile rispetto al massimo
 */
export function getStockPercentage(product: Product): number {
  if (product.stock.maxLevel === 0) return 0;
  return (product.stock.total / product.stock.maxLevel) * 100;
}

// ============================================================================
// EJLOG WMS - Dashboard Types
// Definizione tipi TypeScript per sistema dashboard modulare
// ============================================================================

/**
 * Tipi di widget disponibili nella dashboard
 */
export enum WidgetType {
  PRODUCTS_OVERVIEW = 'products_overview',
  ITEMS_ANALYTICS = 'items_analytics',
  MOVEMENTS_REALTIME = 'movements_realtime',
  LOCATIONS_HEATMAP = 'locations_heatmap',
  KPI_CARDS = 'kpi_cards',
}

/**
 * Configurazione singolo widget
 */
export interface WidgetConfig {
  id: WidgetType;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  refreshInterval?: number; // in secondi, opzionale
}

/**
 * Configurazione completa dashboard
 */
export interface DashboardConfig {
  widgets: WidgetConfig[];
  layout: 'grid' | 'list';
  autoRefresh: boolean;
  refreshInterval: number; // in secondi
}

// ============================================================================
// PRODUCTS OVERVIEW WIDGET
// ============================================================================

/**
 * Dati distribuzione prodotti per categoria
 */
export interface ProductCategoryData {
  category: string;
  count: number;
  value: number; // valore totale in EUR
  percentage: number;
  color?: string;
}

/**
 * Top prodotto per presenza
 */
export interface TopProduct {
  id: number;
  code: string;
  description: string;
  quantity: number;
  value: number;
}

/**
 * Dati completi widget Products Overview
 */
export interface ProductsOverviewData {
  totalProducts: number;
  totalValue: number;
  categories: ProductCategoryData[];
  topProducts: TopProduct[];
  lastUpdate: string; // ISO timestamp
}

// ============================================================================
// ITEMS ANALYTICS WIDGET
// ============================================================================

/**
 * Stato articolo per analytics
 */
export enum ItemStatus {
  DISPONIBILE = 'Disponibile',
  IN_TRANSITO = 'In Transito',
  RISERVATO = 'Riservato',
  BLOCCATO = 'Bloccato',
}

/**
 * Dati articoli per stato
 */
export interface ItemsByStatusData {
  status: ItemStatus;
  count: number;
  percentage: number;
  color?: string;
}

/**
 * Trend settimanale/mensile
 */
export interface ItemTrendData {
  date: string; // formato YYYY-MM-DD
  disponibili: number;
  inTransito: number;
  riservati: number;
  bloccati: number;
}

/**
 * Dati completi widget Items Analytics
 */
export interface ItemsAnalyticsData {
  totalItems: number;
  averageStock: number;
  byStatus: ItemsByStatusData[];
  weeklyTrend: ItemTrendData[];
  monthlyTrend: ItemTrendData[];
  lastUpdate: string;
}

// ============================================================================
// MOVEMENTS REALTIME WIDGET
// ============================================================================

/**
 * Tipo movimento
 */
export enum MovementType {
  ENTRATA = 'Entrata',
  USCITA = 'Uscita',
  TRASFERIMENTO = 'Trasferimento',
  RETTIFICA = 'Rettifica',
}

/**
 * Dati movimento per periodo
 */
export interface MovementData {
  date: string; // formato YYYY-MM-DD HH:mm
  entrate: number;
  uscite: number;
  trasferimenti: number;
  total: number;
}

/**
 * Statistiche velocità rotazione
 */
export interface RotationStats {
  hourly: number; // movimenti/ora
  daily: number; // movimenti/giorno
  weekly: number; // movimenti/settimana
  trend: 'up' | 'down' | 'stable';
}

/**
 * Picco di attività
 */
export interface ActivityPeak {
  time: string; // HH:mm
  count: number;
  type: 'entrate' | 'uscite' | 'mixed';
}

/**
 * Dati completi widget Movements Realtime
 */
export interface MovementsRealtimeData {
  totalToday: number;
  hourlyData: MovementData[];
  dailyData: MovementData[]; // ultimi 30 giorni
  rotation: RotationStats;
  peaks: ActivityPeak[];
  lastUpdate: string;
}

// ============================================================================
// LOCATIONS HEATMAP WIDGET
// ============================================================================

/**
 * Utilizzo ubicazione
 */
export interface LocationUsage {
  locationId: number;
  locationCode: string;
  areaName: string;
  occupancyRate: number; // percentuale 0-100
  itemCount: number;
  activityLevel: 'low' | 'medium' | 'high';
  lastMovement?: string; // ISO timestamp
}

/**
 * Zona magazzino
 */
export interface WarehouseZone {
  zoneId: number;
  zoneName: string;
  totalLocations: number;
  occupiedLocations: number;
  averageOccupancy: number;
  activityScore: number; // 0-100
}

/**
 * Dati completi widget Locations Heatmap
 */
export interface LocationsHeatmapData {
  totalLocations: number;
  occupiedLocations: number;
  averageOccupancy: number;
  locations: LocationUsage[];
  zones: WarehouseZone[];
  mostActiveZone: string;
  leastActiveZone: string;
  lastUpdate: string;
}

// ============================================================================
// KPI CARDS WIDGET
// ============================================================================

/**
 * Tipo KPI
 */
export enum KPIType {
  TOTAL_PRODUCTS = 'total_products',
  MOVEMENTS_TODAY = 'movements_today',
  EFFICIENCY = 'efficiency',
  ALERTS = 'alerts',
}

/**
 * Trend KPI
 */
export interface KPITrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  comparisonPeriod: string; // es: "vs ieri", "vs settimana scorsa"
}

/**
 * Singolo KPI
 */
export interface KPICard {
  id: KPIType;
  title: string;
  value: number | string;
  unit?: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: KPITrend;
  subtitle?: string;
}

/**
 * Dati completi widget KPI Cards
 */
export interface KPICardsData {
  cards: KPICard[];
  lastUpdate: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Risposta generica API dashboard
 */
export interface DashboardApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

/**
 * Parametri filtro dashboard
 */
export interface DashboardFilters {
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  areaId?: number;
  machineId?: number;
  refresh?: boolean;
}

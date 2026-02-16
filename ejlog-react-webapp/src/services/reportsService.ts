// ============================================================================
// EJLOG WMS - Reports Service
// Gestione report e statistiche - Service Layer
// ============================================================================

import { apiClient, ApiResponse } from './api';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum ReportType {
  INVENTORY = 'INVENTORY',
  MOVEMENTS = 'MOVEMENTS',
  PICKING = 'PICKING',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  PRODUCTIVITY = 'PRODUCTIVITY',
  LOCATION_OCCUPANCY = 'LOCATION_OCCUPANCY',
  UDC_STATUS = 'UDC_STATUS',
  USER_ACTIVITY = 'USER_ACTIVITY',
  PERFORMANCE = 'PERFORMANCE',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TimePeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ReportFilter {
  zone?: string;
  type?: string;
  user?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface Report {
  id: number;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  filters?: ReportFilter;
  generatedBy: string;
  generatedAt?: string;
  completedAt?: string;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
  createdAt?: string;
}

export interface ReportTemplate {
  id: number;
  name: string;
  description?: string;
  type: ReportType;
  defaultFormat: ReportFormat;
  defaultFilters?: ReportFilter;
  isSystem: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalMovements: number;
  totalItems: number;
  totalUDCs: number;
  totalLocations: number;
  occupancyRate: number;
  activeUsers: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface MovementStats {
  date: string;
  inbound: number;
  outbound: number;
  internal: number;
  total: number;
}

export interface ProductivityStats {
  user: string;
  tasksCompleted: number;
  itemsProcessed: number;
  avgTimePerTask: number;
  efficiency: number;
}

export interface LocationOccupancyStats {
  zone: string;
  total: number;
  empty: number;
  partial: number;
  full: number;
  occupancyRate: number;
}

export interface InventoryStats {
  category: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  avgRotation: number;
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface GenerateReportParams {
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  filters?: ReportFilter;
  timePeriod?: TimePeriod;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  type: ReportType;
  defaultFormat: ReportFormat;
  defaultFilters?: ReportFilter;
}

export interface UpdateTemplateParams {
  name?: string;
  description?: string;
  defaultFormat?: ReportFormat;
  defaultFilters?: ReportFilter;
}

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  zone?: string;
}

// ============================================================================
// API FUNCTIONS - Reports
// ============================================================================

/**
 * Recupera tutti i report generati
 */
export async function getReports(): Promise<ApiResponse<Report[]>> {
  try {
    return await apiClient.get<Report[]>('/reports');
  } catch (error) {
    console.error('Error fetching reports:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei report',
    };
  }
}

/**
 * Recupera un singolo report per ID
 */
export async function getReportById(id: number): Promise<ApiResponse<Report>> {
  try {
    return await apiClient.get<Report>(`/reports/${id}`);
  } catch (error) {
    console.error('Error fetching report:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero del report',
    };
  }
}

/**
 * Genera un nuovo report
 */
export async function generateReport(params: GenerateReportParams): Promise<ApiResponse<Report>> {
  try {
    return await apiClient.post<Report>('/reports/generate', params);
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella generazione del report',
    };
  }
}

/**
 * Scarica un report completato
 */
export async function downloadReport(id: number): Promise<ApiResponse<Blob>> {
  try {
    return await apiClient.get<Blob>(`/reports/${id}/download`);
  } catch (error) {
    console.error('Error downloading report:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel download del report',
    };
  }
}

/**
 * Elimina un report
 */
export async function deleteReport(id: number): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`/reports/${id}`);
  } catch (error) {
    console.error('Error deleting report:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'eliminazione del report',
    };
  }
}

/**
 * Rigenera un report esistente
 */
export async function regenerateReport(id: number): Promise<ApiResponse<Report>> {
  try {
    return await apiClient.post<Report>(`/reports/${id}/regenerate`, {});
  } catch (error) {
    console.error('Error regenerating report:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella rigenerazione del report',
    };
  }
}

// ============================================================================
// API FUNCTIONS - Templates
// ============================================================================

/**
 * Recupera tutti i template di report
 */
export async function getTemplates(): Promise<ApiResponse<ReportTemplate[]>> {
  try {
    return await apiClient.get<ReportTemplate[]>('/reports/templates');
  } catch (error) {
    console.error('Error fetching templates:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei template',
    };
  }
}

/**
 * Recupera un singolo template per ID
 */
export async function getTemplateById(id: number): Promise<ApiResponse<ReportTemplate>> {
  try {
    return await apiClient.get<ReportTemplate>(`/reports/templates/${id}`);
  } catch (error) {
    console.error('Error fetching template:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero del template',
    };
  }
}

/**
 * Crea un nuovo template
 */
export async function createTemplate(params: CreateTemplateParams): Promise<ApiResponse<ReportTemplate>> {
  try {
    return await apiClient.post<ReportTemplate>('/reports/templates', params);
  } catch (error) {
    console.error('Error creating template:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella creazione del template',
    };
  }
}

/**
 * Aggiorna un template esistente
 */
export async function updateTemplate(
  id: number,
  params: UpdateTemplateParams
): Promise<ApiResponse<ReportTemplate>> {
  try {
    return await apiClient.put<ReportTemplate>(`/reports/templates/${id}`, params);
  } catch (error) {
    console.error('Error updating template:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'aggiornamento del template',
    };
  }
}

/**
 * Elimina un template (solo se non è di sistema)
 */
export async function deleteTemplate(id: number): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`/reports/templates/${id}`);
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      result: 'ERROR',
      message: 'Errore nell\'eliminazione del template',
    };
  }
}

/**
 * Genera un report da un template
 */
export async function generateFromTemplate(
  templateId: number,
  format?: ReportFormat,
  filters?: ReportFilter
): Promise<ApiResponse<Report>> {
  try {
    return await apiClient.post<Report>(`/reports/templates/${templateId}/generate`, {
      format,
      filters,
    });
  } catch (error) {
    console.error('Error generating report from template:', error);
    return {
      result: 'ERROR',
      message: 'Errore nella generazione del report da template',
    };
  }
}

// ============================================================================
// API FUNCTIONS - Statistics
// ============================================================================

/**
 * Recupera le statistiche della dashboard
 */
export async function getDashboardStats(filters?: DashboardFilters): Promise<ApiResponse<DashboardStats>> {
  try {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.zone) params.append('zone', filters.zone);

    const queryString = params.toString();
    const url = queryString ? `/reports/stats/dashboard?${queryString}` : '/reports/stats/dashboard';

    return await apiClient.get<DashboardStats>(url);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle statistiche',
    };
  }
}

/**
 * Recupera le statistiche dei movimenti
 */
export async function getMovementStats(
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<MovementStats[]>> {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const queryString = params.toString();
    const url = queryString ? `/reports/stats/movements?${queryString}` : '/reports/stats/movements';

    return await apiClient.get<MovementStats[]>(url);
  } catch (error) {
    console.error('Error fetching movement stats:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle statistiche movimenti',
    };
  }
}

/**
 * Recupera le statistiche di produttività
 */
export async function getProductivityStats(
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<ProductivityStats[]>> {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const queryString = params.toString();
    const url = queryString ? `/reports/stats/productivity?${queryString}` : '/reports/stats/productivity';

    return await apiClient.get<ProductivityStats[]>(url);
  } catch (error) {
    console.error('Error fetching productivity stats:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle statistiche produttività',
    };
  }
}

/**
 * Recupera le statistiche di occupazione ubicazioni
 */
export async function getLocationOccupancyStats(): Promise<ApiResponse<LocationOccupancyStats[]>> {
  try {
    return await apiClient.get<LocationOccupancyStats[]>('/reports/stats/location-occupancy');
  } catch (error) {
    console.error('Error fetching location occupancy stats:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle statistiche occupazione',
    };
  }
}

/**
 * Recupera le statistiche di inventario
 */
export async function getInventoryStats(): Promise<ApiResponse<InventoryStats[]>> {
  try {
    return await apiClient.get<InventoryStats[]>('/reports/stats/inventory');
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero delle statistiche inventario',
    };
  }
}

// ============================================================================
// API FUNCTIONS - Report Data (Real Data Fetching)
// ============================================================================

/**
 * Recupera i dati per il report giacenze
 */
export async function getStockReportData(filters?: ReportFilter): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const queryString = params.toString();
    const url = queryString ? `/reports/data/stock?${queryString}` : '/reports/data/stock';

    return await apiClient.get<any[]>(url);
  } catch (error) {
    console.error('Error fetching stock report data:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei dati giacenze',
    };
  }
}

/**
 * Recupera i dati per il report movimenti
 */
export async function getMovementsReportData(filters?: ReportFilter): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const queryString = params.toString();
    const url = queryString ? `/reports/data/movements?${queryString}` : '/reports/data/movements';

    return await apiClient.get<any[]>(url);
  } catch (error) {
    console.error('Error fetching movements report data:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei dati movimenti',
    };
  }
}

/**
 * Recupera i dati per il report liste
 */
export async function getListsReportData(filters?: ReportFilter): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const queryString = params.toString();
    const url = queryString ? `/reports/data/lists?${queryString}` : '/reports/data/lists';

    return await apiClient.get<any[]>(url);
  } catch (error) {
    console.error('Error fetching lists report data:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei dati liste',
    };
  }
}

/**
 * Recupera i dati per il report produttività
 */
export async function getProductivityReportData(filters?: ReportFilter): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.user) params.append('user', filters.user);

    const queryString = params.toString();
    const url = queryString ? `/reports/data/productivity?${queryString}` : '/reports/data/productivity';

    return await apiClient.get<any[]>(url);
  } catch (error) {
    console.error('Error fetching productivity report data:', error);
    return {
      result: 'ERROR',
      message: 'Errore nel recupero dei dati produttività',
    };
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateReportGeneration(params: GenerateReportParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.name || params.name.trim().length === 0) {
    errors.name = 'Il nome è obbligatorio';
  } else if (params.name.length < 3 || params.name.length > 100) {
    errors.name = 'Il nome deve essere tra 3 e 100 caratteri';
  }

  if (!params.type) {
    errors.type = 'Il tipo di report è obbligatorio';
  }

  if (!params.format) {
    errors.format = 'Il formato è obbligatorio';
  }

  if (params.timePeriod === TimePeriod.CUSTOM) {
    if (!params.dateFrom) {
      errors.dateFrom = 'La data di inizio è obbligatoria per periodo personalizzato';
    }
    if (!params.dateTo) {
      errors.dateTo = 'La data di fine è obbligatoria per periodo personalizzato';
    }
    if (params.dateFrom && params.dateTo && params.dateFrom > params.dateTo) {
      errors.dateRange = 'La data di inizio deve essere precedente alla data di fine';
    }
  }

  return errors;
}

export function validateTemplateCreation(params: CreateTemplateParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.name || params.name.trim().length === 0) {
    errors.name = 'Il nome è obbligatorio';
  } else if (params.name.length < 3 || params.name.length > 100) {
    errors.name = 'Il nome deve essere tra 3 e 100 caratteri';
  }

  if (!params.type) {
    errors.type = 'Il tipo di report è obbligatorio';
  }

  if (!params.defaultFormat) {
    errors.defaultFormat = 'Il formato predefinito è obbligatorio';
  }

  return errors;
}

export function validateTemplateUpdate(params: UpdateTemplateParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (params.name !== undefined) {
    if (params.name.trim().length === 0) {
      errors.name = 'Il nome non può essere vuoto';
    } else if (params.name.length < 3 || params.name.length > 100) {
      errors.name = 'Il nome deve essere tra 3 e 100 caratteri';
    }
  }

  return errors;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ottiene la label tradotta per il tipo di report
 */
export function getReportTypeLabel(type: ReportType): string {
  const labels: Record<ReportType, string> = {
    [ReportType.INVENTORY]: 'Inventario',
    [ReportType.MOVEMENTS]: 'Movimenti',
    [ReportType.PICKING]: 'Prelievi',
    [ReportType.RECEIVING]: 'Ricevimenti',
    [ReportType.SHIPPING]: 'Spedizioni',
    [ReportType.PRODUCTIVITY]: 'Produttività',
    [ReportType.LOCATION_OCCUPANCY]: 'Occupazione Ubicazioni',
    [ReportType.UDC_STATUS]: 'Stato UDC',
    [ReportType.USER_ACTIVITY]: 'Attività Utenti',
    [ReportType.PERFORMANCE]: 'Performance',
  };
  return labels[type] || type;
}

/**
 * Ottiene la label tradotta per il formato
 */
export function getReportFormatLabel(format: ReportFormat): string {
  const labels: Record<ReportFormat, string> = {
    [ReportFormat.PDF]: 'PDF',
    [ReportFormat.EXCEL]: 'Excel',
    [ReportFormat.CSV]: 'CSV',
    [ReportFormat.JSON]: 'JSON',
  };
  return labels[format] || format;
}

/**
 * Ottiene la label tradotta per lo status
 */
export function getReportStatusLabel(status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    [ReportStatus.PENDING]: 'In Attesa',
    [ReportStatus.GENERATING]: 'Generazione',
    [ReportStatus.COMPLETED]: 'Completato',
    [ReportStatus.FAILED]: 'Fallito',
  };
  return labels[status] || status;
}

/**
 * Ottiene il colore del badge per lo status
 */
export function getReportStatusColor(status: ReportStatus): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case ReportStatus.COMPLETED:
      return 'success';
    case ReportStatus.GENERATING:
    case ReportStatus.PENDING:
      return 'warning';
    case ReportStatus.FAILED:
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Ottiene la label tradotta per il periodo temporale
 */
export function getTimePeriodLabel(period: TimePeriod): string {
  const labels: Record<TimePeriod, string> = {
    [TimePeriod.TODAY]: 'Oggi',
    [TimePeriod.YESTERDAY]: 'Ieri',
    [TimePeriod.THIS_WEEK]: 'Questa Settimana',
    [TimePeriod.LAST_WEEK]: 'Settimana Scorsa',
    [TimePeriod.THIS_MONTH]: 'Questo Mese',
    [TimePeriod.LAST_MONTH]: 'Mese Scorso',
    [TimePeriod.THIS_YEAR]: 'Quest\'Anno',
    [TimePeriod.CUSTOM]: 'Personalizzato',
  };
  return labels[period] || period;
}

/**
 * Formatta la dimensione del file
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calcola le date per un periodo temporale
 */
export function getDateRangeForPeriod(period: TimePeriod): { dateFrom: string; dateTo: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let dateFrom: Date;
  let dateTo: Date = today;

  switch (period) {
    case TimePeriod.TODAY:
      dateFrom = today;
      break;

    case TimePeriod.YESTERDAY:
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - 1);
      dateTo = dateFrom;
      break;

    case TimePeriod.THIS_WEEK:
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay());
      break;

    case TimePeriod.LAST_WEEK:
      dateFrom = new Date(today);
      dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay() - 7);
      dateTo = new Date(dateFrom);
      dateTo.setDate(dateTo.getDate() + 6);
      break;

    case TimePeriod.THIS_MONTH:
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    case TimePeriod.LAST_MONTH:
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
      break;

    case TimePeriod.THIS_YEAR:
      dateFrom = new Date(now.getFullYear(), 0, 1);
      break;

    default:
      return null;
  }

  return {
    dateFrom: dateFrom.toISOString().split('T')[0],
    dateTo: dateTo.toISOString().split('T')[0],
  };
}

/**
 * Filtra i report
 */
export function filterReports(
  reports: Report[],
  filters: { type?: ReportType; status?: ReportStatus; search?: string }
): Report[] {
  return reports.filter((report) => {
    if (filters.type && report.type !== filters.type) return false;
    if (filters.status && report.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        report.name.toLowerCase().includes(searchLower) ||
        (report.description && report.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
}

/**
 * Ordina i report per data di generazione
 */
export function sortReportsByDate(reports: Report[], ascending = false): Report[] {
  return [...reports].sort((a, b) => {
    const dateA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
    const dateB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Calcola le statistiche dei report
 */
export function getReportsStats(reports: Report[]) {
  const total = reports.length;
  const completed = reports.filter((r) => r.status === ReportStatus.COMPLETED).length;
  const generating = reports.filter((r) => r.status === ReportStatus.GENERATING).length;
  const pending = reports.filter((r) => r.status === ReportStatus.PENDING).length;
  const failed = reports.filter((r) => r.status === ReportStatus.FAILED).length;

  const totalSize = reports
    .filter((r) => r.status === ReportStatus.COMPLETED && r.fileSize)
    .reduce((sum, r) => sum + (r.fileSize || 0), 0);

  const totalRecords = reports
    .filter((r) => r.status === ReportStatus.COMPLETED && r.recordCount)
    .reduce((sum, r) => sum + (r.recordCount || 0), 0);

  return {
    total,
    completed,
    generating,
    pending,
    failed,
    totalSize,
    totalRecords,
    successRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

/**
 * Raggruppa i report per tipo
 */
export function groupReportsByType(reports: Report[]): Record<string, Report[]> {
  return reports.reduce((acc, report) => {
    const type = report.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(report);
    return acc;
  }, {} as Record<string, Report[]>);
}

/**
 * Determina se un report può essere scaricato
 */
export function canDownloadReport(report: Report): boolean {
  return report.status === ReportStatus.COMPLETED && !!report.fileUrl;
}

/**
 * Determina se un report può essere rigenerato
 */
export function canRegenerateReport(report: Report): boolean {
  return report.status === ReportStatus.FAILED || report.status === ReportStatus.COMPLETED;
}

/**
 * Determina se un template può essere eliminato
 */
export function canDeleteTemplate(template: ReportTemplate): boolean {
  return !template.isSystem;
}

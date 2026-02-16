// src/utils/listUtils.ts

/**
 * Utility functions for Lists Management
 * Fornisce helper per formattazione, calcoli e mapping dei dati delle liste
 */

import { ListType, ListStatus, type List, type ListRow } from '../types/lists';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Mapping ListStatus to color (TailwindCSS classes)
 */
export const getStatusColor = (status: ListStatus): string => {
  switch (status) {
    case ListStatus.WAITING:
      return 'yellow'; // Giallo - In Attesa
    case ListStatus.IN_EXECUTION:
      return 'blue'; // Azzurro - In Esecuzione
    case ListStatus.TERMINATED:
      return 'green'; // Verde - Terminata
    case ListStatus.SUSPENDED:
      return 'gray'; // Grigio - Sospesa
    default:
      return 'gray';
  }
};

/**
 * Get Tailwind background color class
 */
export const getStatusBgColor = (status: ListStatus): string => {
  const color = getStatusColor(status);
  return `bg-${color}-100`;
};

/**
 * Get Tailwind text color class
 */
export const getStatusTextColor = (status: ListStatus): string => {
  const color = getStatusColor(status);
  return `text-${color}-800`;
};

/**
 * Get Tailwind border color class
 */
export const getStatusBorderColor = (status: ListStatus): string => {
  const color = getStatusColor(status);
  return `border-${color}-300`;
};

/**
 * Get status label in Italian
 */
export const getStatusLabel = (status: ListStatus): string => {
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
      return 'Sconosciuto';
  }
};

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * Get list type label in Italian
 */
export const getTypeLabel = (type: ListType): string => {
  switch (type) {
    case ListType.PICKING:
      return 'Picking';
    case ListType.REFILLING:
      return 'Rifornimento';
    case ListType.INVENTORY:
      return 'Inventario';
    default:
      return 'Sconosciuto';
  }
};

/**
 * Get list type icon name (lucide-react)
 */
export const getTypeIcon = (type: ListType): string => {
  switch (type) {
    case ListType.PICKING:
      return 'Package';
    case ListType.REFILLING:
      return 'ArrowUpCircle';
    case ListType.INVENTORY:
      return 'ClipboardCheck';
    default:
      return 'List';
  }
};

/**
 * Get list type color
 */
export const getTypeColor = (type: ListType): string => {
  switch (type) {
    case ListType.PICKING:
      return 'blue';
    case ListType.REFILLING:
      return 'purple';
    case ListType.INVENTORY:
      return 'orange';
    default:
      return 'gray';
  }
};

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

/**
 * Get priority badge color based on value
 * Alta: >= 70 (red)
 * Media: 30-69 (yellow)
 * Bassa: < 30 (green)
 */
export const getPriorityBadgeColor = (priority: number): string => {
  if (priority >= 70) return 'red';
  if (priority >= 30) return 'yellow';
  return 'green';
};

/**
 * Get priority label
 */
export const getPriorityLabel = (priority: number): string => {
  if (priority >= 70) return 'Alta';
  if (priority >= 30) return 'Media';
  return 'Bassa';
};

/**
 * Get priority level (Alta/Media/Bassa) as enum
 */
export enum PriorityLevel {
  BASSA = 'BASSA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export const getPriorityLevel = (priority: number): PriorityLevel => {
  if (priority >= 70) return PriorityLevel.ALTA;
  if (priority >= 30) return PriorityLevel.MEDIA;
  return PriorityLevel.BASSA;
};

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculate list completion percentage
 * @param totalRows - Total number of rows in list
 * @param completedRows - Number of completed rows
 * @returns Percentage (0-100)
 */
export const calculateProgress = (totalRows: number, completedRows: number): number => {
  if (totalRows === 0) return 0;
  return Math.round((completedRows / totalRows) * 100);
};

/**
 * Calculate progress from list rows
 * A row is considered completed if processedQty >= requestedQty
 */
export const calculateProgressFromRows = (rows: ListRow[]): number => {
  if (!rows || rows.length === 0) return 0;

  const completedRows = rows.filter(row => {
    const processedQty = row.processedQty || 0;
    const requestedQty = row.requestedQty || 0;
    return processedQty >= requestedQty;
  }).length;

  return calculateProgress(rows.length, completedRows);
};

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage === 0) return 'gray';
  if (percentage < 50) return 'red';
  if (percentage < 100) return 'yellow';
  return 'green';
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format list code/number
 * Aggiunge prefisso o formattazione se necessario
 */
export const formatListCode = (code: string): string => {
  return code.toUpperCase().trim();
};

/**
 * Format date to Italian locale
 */
export const formatDate = (date: string | Date | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: it });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format datetime to Italian locale
 */
export const formatDateTime = (date: string | Date | undefined): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Format quantity with thousands separator
 */
export const formatQuantity = (qty: number | undefined): string => {
  if (qty === undefined || qty === null) return '-';
  return new Intl.NumberFormat('it-IT').format(qty);
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if list can be executed
 */
export const canExecuteList = (list: List): boolean => {
  return list.listStatus === ListStatus.WAITING || list.listStatus === ListStatus.SUSPENDED;
};

/**
 * Check if list can be paused
 */
export const canPauseList = (list: List): boolean => {
  return list.listStatus === ListStatus.IN_EXECUTION;
};

/**
 * Check if list can be terminated
 */
export const canTerminateList = (list: List): boolean => {
  return list.listStatus === ListStatus.IN_EXECUTION || list.listStatus === ListStatus.SUSPENDED;
};

/**
 * Check if list can be edited
 */
export const canEditList = (list: List): boolean => {
  return list.listStatus === ListStatus.WAITING || list.listStatus === ListStatus.SUSPENDED;
};

/**
 * Check if list can be deleted
 */
export const canDeleteList = (list: List): boolean => {
  return list.listStatus === ListStatus.WAITING || list.listStatus === ListStatus.TERMINATED;
};

/**
 * Check if list can be copied
 */
export const canCopyList = (list: List): boolean => {
  // Can always copy a list
  return true;
};

// ============================================================================
// ROW STATUS HELPERS
// ============================================================================

/**
 * Row status enumeration
 */
export enum RowStatus {
  NUOVA = 'NUOVA',
  PARZIALE = 'PARZIALE',
  EVASA = 'EVASA',
  INEVADIBILE = 'INEVADIBILE',
}

/**
 * Get row status based on quantities
 */
export const getRowStatus = (row: ListRow): RowStatus => {
  const processedQty = row.processedQty || 0;
  const requestedQty = row.requestedQty || 0;

  if (processedQty === 0) return RowStatus.NUOVA;
  if (processedQty >= requestedQty) return RowStatus.EVASA;
  if (processedQty > 0 && processedQty < requestedQty) return RowStatus.PARZIALE;
  return RowStatus.INEVADIBILE;
};

/**
 * Get row status label
 */
export const getRowStatusLabel = (status: RowStatus): string => {
  switch (status) {
    case RowStatus.NUOVA:
      return 'Nuova';
    case RowStatus.PARZIALE:
      return 'Parziale';
    case RowStatus.EVASA:
      return 'Evasa';
    case RowStatus.INEVADIBILE:
      return 'Inevadibile';
    default:
      return 'Sconosciuta';
  }
};

/**
 * Get row status color
 */
export const getRowStatusColor = (status: RowStatus): string => {
  switch (status) {
    case RowStatus.NUOVA:
      return 'gray';
    case RowStatus.PARZIALE:
      return 'yellow';
    case RowStatus.EVASA:
      return 'green';
    case RowStatus.INEVADIBILE:
      return 'red';
    default:
      return 'gray';
  }
};

// ============================================================================
// SORTING HELPERS
// ============================================================================

/**
 * Sort lists by priority (descending)
 */
export const sortByPriority = (a: List, b: List): number => {
  const priorityA = a.priority || 0;
  const priorityB = b.priority || 0;
  return priorityB - priorityA;
};

/**
 * Sort lists by creation date (descending)
 */
export const sortByCreationDate = (a: List, b: List): number => {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return dateB - dateA;
};

/**
 * Sort lists by status (custom order)
 */
export const sortByStatus = (a: List, b: List): number => {
  const statusOrder = {
    [ListStatus.IN_EXECUTION]: 1,
    [ListStatus.WAITING]: 2,
    [ListStatus.SUSPENDED]: 3,
    [ListStatus.TERMINATED]: 4,
  };

  const orderA = a.listStatus ? statusOrder[a.listStatus] : 999;
  const orderB = b.listStatus ? statusOrder[b.listStatus] : 999;

  return orderA - orderB;
};

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Count lists by type
 */
export const countListsByType = (lists: List[], type: ListType): number => {
  return lists.filter(list => list.listType === type).length;
};

/**
 * Count lists by status
 */
export const countListsByStatus = (lists: List[], status: ListStatus): number => {
  return lists.filter(list => list.listStatus === status).length;
};

/**
 * Calculate average priority
 */
export const calculateAveragePriority = (lists: List[]): number => {
  if (lists.length === 0) return 0;

  const sum = lists.reduce((acc, list) => acc + (list.priority || 0), 0);
  return Math.round(sum / lists.length);
};

/**
 * Get lists statistics
 */
export interface ListsStatistics {
  total: number;
  picking: number;
  refilling: number;
  inventory: number;
  waiting: number;
  inExecution: number;
  completed: number;
  suspended: number;
  averagePriority: number;
  averageProgress: number;
}

export const getListsStatistics = (lists: List[]): ListsStatistics => {
  return {
    total: lists.length,
    picking: countListsByType(lists, ListType.PICKING),
    refilling: countListsByType(lists, ListType.REFILLING),
    inventory: countListsByType(lists, ListType.INVENTORY),
    waiting: countListsByStatus(lists, ListStatus.WAITING),
    inExecution: countListsByStatus(lists, ListStatus.IN_EXECUTION),
    completed: countListsByStatus(lists, ListStatus.TERMINATED),
    suspended: countListsByStatus(lists, ListStatus.SUSPENDED),
    averagePriority: calculateAveragePriority(lists),
    averageProgress: lists.length > 0
      ? Math.round(
          lists.reduce((acc, list) => {
            const total = list.totalRows || 0;
            const completed = list.completedRows || 0;
            return acc + calculateProgress(total, completed);
          }, 0) / lists.length
        )
      : 0,
  };
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  getStatusColor,
  getStatusBgColor,
  getStatusTextColor,
  getStatusBorderColor,
  getStatusLabel,
  getTypeLabel,
  getTypeIcon,
  getTypeColor,
  getPriorityBadgeColor,
  getPriorityLabel,
  getPriorityLevel,
  calculateProgress,
  calculateProgressFromRows,
  getProgressColor,
  formatListCode,
  formatDate,
  formatDateTime,
  formatQuantity,
  canExecuteList,
  canPauseList,
  canTerminateList,
  canEditList,
  canDeleteList,
  canCopyList,
  getRowStatus,
  getRowStatusLabel,
  getRowStatusColor,
  sortByPriority,
  sortByCreationDate,
  sortByStatus,
  countListsByType,
  countListsByStatus,
  calculateAveragePriority,
  getListsStatistics,
};

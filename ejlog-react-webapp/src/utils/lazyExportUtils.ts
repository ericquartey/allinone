// ============================================================================
// EJLOG WMS - Lazy Export Utilities
// Wrapper for lazy loading heavy export libraries (jsPDF, html2canvas, xlsx)
// ============================================================================

import type { ExportFormat } from './exportUtils';

/**
 * Column definition for export
 */
export interface ExportColumn<T = any> {
  header: string;
  accessor: string | ((row: T) => string | number);
}

/**
 * Export options interface
 */
export interface ExportOptions<T = any> {
  filename: string;
  title: string;
  columns: ExportColumn<T>[];
  data: T[];
}

/**
 * Lazy-loaded export function
 * This function dynamically imports the heavy export libraries only when needed
 *
 * @param format - Export format (CSV, EXCEL, PDF)
 * @param options - Export configuration
 */
export const lazyExportData = async <T = any>(
  format: ExportFormat,
  options: ExportOptions<T>
): Promise<void> => {
  // Dynamically import the export utilities
  // This ensures heavy libraries are only loaded when user actually exports
  const { exportData } = await import('./exportUtils');

  // Call the actual export function
  return exportData(format, options);
};

/**
 * Preload export libraries in the background
 * Can be called when user hovers over export button
 */
export const preloadExportLibraries = (): void => {
  // Start loading export utilities in background
  import('./exportUtils').catch((err) => {
    console.error('Failed to preload export libraries:', err);
  });
};

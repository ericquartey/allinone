// ============================================================================
// EJLOG WMS - Export Utilities
// Utility functions per export dati in Excel, CSV, PDF
// ============================================================================

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

/**
 * Formato file di export supportati
 */
export type ExportFormat = 'excel' | 'csv' | 'pdf';

/**
 * Opzioni per export Excel
 */
export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  includeHeaders?: boolean;
  columnWidths?: number[];
}

/**
 * Opzioni per export CSV
 */
export interface CSVExportOptions {
  filename: string;
  delimiter?: string;
  includeHeaders?: boolean;
  encoding?: string;
}

/**
 * Opzioni per export PDF
 */
export interface PDFExportOptions {
  filename: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
  includeHeaders?: boolean;
  columnStyles?: Record<string, any>;
  footerText?: string;
}

/**
 * Column definition per export
 */
export interface ExportColumn<T = any> {
  key: keyof T | string;
  header: string;
  width?: number;
  format?: (value: any, row: T) => string;
}

// ============================================================================
// EXCEL EXPORT
// ============================================================================

/**
 * Export dati in formato Excel (.xlsx)
 *
 * @example
 * ```ts
 * const columns: ExportColumn<Item>[] = [
 *   { key: 'code', header: 'Codice', width: 15 },
 *   { key: 'description', header: 'Descrizione', width: 30 },
 *   { key: 'quantity', header: 'Quantità', format: (val) => val.toFixed(2) }
 * ];
 *
 * await exportToExcel(items, columns, {
 *   filename: 'articoli_export',
 *   sheetName: 'Articoli'
 * });
 * ```
 */
export async function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExcelExportOptions
): Promise<void> {
  const {
    filename,
    sheetName = 'Sheet1',
    includeHeaders = true,
    columnWidths = [],
  } = options;

  try {
    // Prepare data for Excel
    const rows: any[][] = [];

    // Headers
    if (includeHeaders) {
      rows.push(columns.map((col) => col.header));
    }

    // Data rows
    data.forEach((row) => {
      const rowData = columns.map((col) => {
        const value = getNestedValue(row, col.key as string);
        return col.format ? col.format(value, row) : value ?? '';
      });
      rows.push(rowData);
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    const wscols = columns.map((col, idx) => ({
      wch: columnWidths[idx] || col.width || 15,
    }));
    ws['!cols'] = wscols;

    // Style headers (bold)
    if (includeHeaders) {
      columns.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E0E0E0' } },
          };
        }
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // Download
    saveAs(blob, `${filename}.xlsx`);

    console.log(`✅ Exported ${data.length} rows to ${filename}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Failed to export to Excel');
  }
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Export dati in formato CSV
 *
 * @example
 * ```ts
 * await exportToCSV(items, columns, {
 *   filename: 'articoli_export',
 *   delimiter: ';',
 *   encoding: 'utf-8'
 * });
 * ```
 */
export async function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: CSVExportOptions
): Promise<void> {
  const {
    filename,
    delimiter = ',',
    includeHeaders = true,
    encoding = 'utf-8',
  } = options;

  try {
    // Prepare data for CSV
    const rows: any[][] = [];

    // Headers
    if (includeHeaders) {
      rows.push(columns.map((col) => col.header));
    }

    // Data rows
    data.forEach((row) => {
      const rowData = columns.map((col) => {
        const value = getNestedValue(row, col.key as string);
        return col.format ? col.format(value, row) : value ?? '';
      });
      rows.push(rowData);
    });

    // Generate CSV string
    const csv = Papa.unparse(rows, {
      delimiter,
      newline: '\r\n',
      header: false, // We already added headers manually
    });

    // Create Blob with BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: `text/csv;charset=${encoding}` });

    // Download
    saveAs(blob, `${filename}.csv`);

    console.log(`✅ Exported ${data.length} rows to ${filename}.csv`);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export to CSV');
  }
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Export dati in formato PDF
 *
 * @example
 * ```ts
 * await exportToPDF(items, columns, {
 *   filename: 'articoli_report',
 *   title: 'Report Articoli',
 *   orientation: 'landscape',
 *   footerText: `Generato il ${new Date().toLocaleDateString()}`
 * });
 * ```
 */
export async function exportToPDF<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: PDFExportOptions
): Promise<void> {
  const {
    filename,
    title,
    orientation = 'portrait',
    pageSize = 'a4',
    includeHeaders = true,
    columnStyles = {},
    footerText,
  } = options;

  try {
    // Create PDF document
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });

    // Title
    if (title) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }

    // Prepare table data
    const headers = includeHeaders ? [columns.map((col) => col.header)] : [];
    const body = data.map((row) =>
      columns.map((col) => {
        const value = getNestedValue(row, col.key as string);
        return col.format ? col.format(value, row) : String(value ?? '');
      })
    );

    // Generate table
    autoTable(doc, {
      head: headers,
      body,
      startY: title ? 30 : 10,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [220, 0, 0], // Ferrari Red
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles,
      margin: { top: title ? 30 : 10 },
      didDrawPage: (data) => {
        // Footer on each page
        if (footerText) {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            footerText,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }
      },
    });

    // Download PDF
    doc.save(`${filename}.pdf`);

    console.log(`✅ Exported ${data.length} rows to ${filename}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to export to PDF');
  }
}

// ============================================================================
// GENERIC EXPORT FUNCTION
// ============================================================================

/**
 * Export dati in uno dei formati supportati
 *
 * @example
 * ```ts
 * await exportData(items, columns, 'excel', {
 *   filename: 'my_export',
 *   sheetName: 'Data'
 * });
 * ```
 */
export async function exportData<T>(
  data: T[],
  columns: ExportColumn<T>[],
  format: ExportFormat,
  options: ExcelExportOptions | CSVExportOptions | PDFExportOptions
): Promise<void> {
  switch (format) {
    case 'excel':
      await exportToExcel(data, columns, options as ExcelExportOptions);
      break;
    case 'csv':
      await exportToCSV(data, columns, options as CSVExportOptions);
      break;
    case 'pdf':
      await exportToPDF(data, columns, options as PDFExportOptions);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue(obj, 'user.address.city')
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'long') {
    return d.toLocaleString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('it-IT');
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value);
}

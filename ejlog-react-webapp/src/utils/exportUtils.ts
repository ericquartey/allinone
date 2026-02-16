// ============================================================================
// EJLOG WMS - Export Utilities
// Funzioni helper per esportare dati in vari formati (CSV, Excel, PDF)
// ============================================================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'CSV' | 'EXCEL' | 'PDF';

export interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => any);
  width?: number; // For PDF table width
}

export interface ExportOptions {
  filename?: string;
  title?: string;
  columns: ExportColumn[];
  data: any[];
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Esporta dati in formato CSV
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename = 'export', columns, data } = options;

  // Prepara i dati per CSV
  const csvData = data.map(row => {
    const csvRow: Record<string, any> = {};
    columns.forEach(col => {
      const value = typeof col.accessor === 'function'
        ? col.accessor(row)
        : row[col.accessor];
      csvRow[col.header] = value ?? '';
    });
    return csvRow;
  });

  // Converti in CSV
  const csv = Papa.unparse(csvData);

  // Download file
  downloadFile(csv, `${filename}_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
}

// ============================================================================
// EXCEL EXPORT
// ============================================================================

/**
 * Esporta dati in formato Excel (.xlsx)
 */
export function exportToExcel(options: ExportOptions): void {
  const { filename = 'export', title, columns, data } = options;

  // Crea workbook
  const wb = XLSX.utils.book_new();

  // Prepara i dati
  const excelData = data.map(row => {
    const excelRow: Record<string, any> = {};
    columns.forEach(col => {
      const value = typeof col.accessor === 'function'
        ? col.accessor(row)
        : row[col.accessor];
      excelRow[col.header] = value ?? '';
    });
    return excelRow;
  });

  // Crea worksheet dai dati
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Imposta larghezza colonne
  const colWidths = columns.map(col => ({
    wch: col.width || 15
  }));
  ws['!cols'] = colWidths;

  // Aggiungi il worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, title || 'Report');

  // Scrivi file
  XLSX.writeFile(wb, `${filename}_${getTimestamp()}.xlsx`);
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Esporta dati in formato PDF
 */
export function exportToPDF(options: ExportOptions): void {
  const { filename = 'export', title = 'Report', columns, data } = options;

  // Crea documento PDF
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape, millimeters, A4

  // Titolo
  doc.setFontSize(18);
  doc.setTextColor(205, 32, 44); // Ferrari Red
  doc.text(title, 14, 20);

  // Data generazione
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generato il: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);

  // Prepara headers
  const headers = columns.map(col => col.header);

  // Prepara body
  const body = data.map(row => {
    return columns.map(col => {
      const value = typeof col.accessor === 'function'
        ? col.accessor(row)
        : row[col.accessor];
      return formatPDFValue(value);
    });
  });

  // Crea tabella
  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 35,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [205, 32, 44], // Ferrari Red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, any>),
  });

  // Salva PDF
  doc.save(`${filename}_${getTimestamp()}.pdf`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Genera un timestamp per il nome file
 */
function getTimestamp(): string {
  return format(new Date(), 'yyyyMMdd_HHmmss');
}

/**
 * Download di un file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Formatta un valore per il PDF (gestisce Date, numeri, etc)
 */
function formatPDFValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return format(value, 'dd/MM/yyyy HH:mm');
  }

  if (typeof value === 'number') {
    return value.toLocaleString('it-IT');
  }

  return String(value);
}

// ============================================================================
// EXPORT WRAPPER (per facilitare l'uso)
// ============================================================================

/**
 * Funzione generica di export che delega al formato appropriato
 */
export function exportData(format: ExportFormat, options: ExportOptions): void {
  switch (format) {
    case 'CSV':
      exportToCSV(options);
      break;
    case 'EXCEL':
      exportToExcel(options);
      break;
    case 'PDF':
      exportToPDF(options);
      break;
    default:
      console.error('Formato export non supportato:', format);
  }
}

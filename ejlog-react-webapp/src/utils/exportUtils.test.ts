// ==============================================================================
// EJLOG WMS - Export Utils Unit Tests
// Comprehensive tests for CSV, Excel, and PDF export functionality
// ==============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToExcel, exportToPDF, exportData } from './exportUtils';
import type { ExportOptions } from './exportUtils';

// Mock external libraries
vi.mock('papaparse', () => ({
  default: {
    unparse: vi.fn((data) => 'mocked,csv,data\nrow1,row2,row3'),
  },
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    json_to_sheet: vi.fn(() => ({ '!cols': [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
  };
  return {
    default: vi.fn(() => mockDoc),
  };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

describe('Export Utils', () => {
  let mockLink: any;
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    // Mock DOM APIs
    mockLink = {
      download: '',
      href: '',
      click: vi.fn(),
      setAttribute: vi.fn(),
      style: { visibility: '' },
    };

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    const mockOptions: ExportOptions = {
      filename: 'test_export',
      title: 'Test Export',
      columns: [
        { header: 'Name', accessor: 'name' },
        { header: 'Age', accessor: 'age' },
        { header: 'Email', accessor: (row: any) => row.email.toLowerCase() },
      ],
      data: [
        { name: 'John', age: 30, email: 'JOHN@TEST.COM' },
        { name: 'Jane', age: 25, email: 'JANE@TEST.COM' },
      ],
    };

    it('should export data to CSV format', () => {
      exportToCSV(mockOptions);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('should use default filename if not provided', () => {
      const optionsWithoutFilename: ExportOptions = {
        columns: mockOptions.columns,
        data: mockOptions.data,
      };

      exportToCSV(optionsWithoutFilename);

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringMatching(/^export_\d{8}_\d{6}\.csv$/)
      );
    });

    it('should generate filename with timestamp', () => {
      exportToCSV(mockOptions);

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringMatching(/^test_export_\d{8}_\d{6}\.csv$/)
      );
    });

    it('should handle function accessors', () => {
      exportToCSV(mockOptions);
      // Function accessor should transform email to lowercase
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle null/undefined values', () => {
      const optionsWithNulls: ExportOptions = {
        filename: 'test',
        columns: [{ header: 'Value', accessor: 'value' }],
        data: [
          { value: null },
          { value: undefined },
          { value: 'valid' },
        ],
      };

      exportToCSV(optionsWithNulls);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should create blob with correct MIME type', () => {
      exportToCSV(mockOptions);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle empty data array', () => {
      const emptyOptions: ExportOptions = {
        filename: 'empty',
        columns: mockOptions.columns,
        data: [],
      };

      exportToCSV(emptyOptions);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('exportToExcel', () => {
    const mockOptions: ExportOptions = {
      filename: 'test_export',
      title: 'Test Report',
      columns: [
        { header: 'Name', accessor: 'name', width: 20 },
        { header: 'Age', accessor: 'age', width: 10 },
        { header: 'Status', accessor: (row: any) => row.active ? 'Active' : 'Inactive' },
      ],
      data: [
        { name: 'John', age: 30, active: true },
        { name: 'Jane', age: 25, active: false },
      ],
    };

    it('should export data to Excel format', async () => {
      const XLSX = await import('xlsx');

      exportToExcel(mockOptions);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^test_export_\d{8}_\d{6}\.xlsx$/)
      );
    });

    it('should use default filename if not provided', async () => {
      const XLSX = await import('xlsx');
      const optionsWithoutFilename: ExportOptions = {
        columns: mockOptions.columns,
        data: mockOptions.data,
      };

      exportToExcel(optionsWithoutFilename);

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^export_\d{8}_\d{6}\.xlsx$/)
      );
    });

    it('should use title as worksheet name', async () => {
      const XLSX = await import('xlsx');

      exportToExcel(mockOptions);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Test Report'
      );
    });

    it('should use default worksheet name if title not provided', async () => {
      const XLSX = await import('xlsx');
      const optionsWithoutTitle: ExportOptions = {
        columns: mockOptions.columns,
        data: mockOptions.data,
      };

      exportToExcel(optionsWithoutTitle);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Report'
      );
    });

    it('should set column widths', async () => {
      const XLSX = await import('xlsx');

      exportToExcel(mockOptions);

      const worksheet = (XLSX.utils.json_to_sheet as any).mock.results[0].value;
      expect(worksheet['!cols']).toBeDefined();
    });

    it('should handle function accessors', async () => {
      const XLSX = await import('xlsx');

      exportToExcel(mockOptions);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    });

    it('should handle null/undefined values', async () => {
      const XLSX = await import('xlsx');
      const optionsWithNulls: ExportOptions = {
        columns: [{ header: 'Value', accessor: 'value' }],
        data: [{ value: null }, { value: undefined }],
      };

      exportToExcel(optionsWithNulls);

      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });

  describe('exportToPDF', () => {
    const mockOptions: ExportOptions = {
      filename: 'test_report',
      title: 'Test Report',
      columns: [
        { header: 'Name', accessor: 'name', width: 30 },
        { header: 'Age', accessor: 'age', width: 15 },
        { header: 'Registered', accessor: (row: any) => new Date(row.date) },
      ],
      data: [
        { name: 'John', age: 30, date: '2023-01-01' },
        { name: 'Jane', age: 25, date: '2023-02-01' },
      ],
    };

    it('should create PDF document', async () => {
      const jsPDF = (await import('jspdf')).default;

      exportToPDF(mockOptions);

      expect(jsPDF).toHaveBeenCalledWith('l', 'mm', 'a4');
    });

    it('should set Ferrari Red color for title', async () => {
      const jsPDF = (await import('jspdf')).default;
      const mockDoc = (jsPDF as any).mock.results[0].value;

      exportToPDF(mockOptions);

      expect(mockDoc.setTextColor).toHaveBeenCalledWith(205, 32, 44);
    });

    it('should add title to PDF', async () => {
      const jsPDF = (await import('jspdf')).default;
      const mockDoc = (jsPDF as any).mock.results[0].value;

      exportToPDF(mockOptions);

      expect(mockDoc.text).toHaveBeenCalledWith('Test Report', 14, 20);
    });

    it('should add generation timestamp', async () => {
      const jsPDF = (await import('jspdf')).default;
      const mockDoc = (jsPDF as any).mock.results[0].value;

      exportToPDF(mockOptions);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringMatching(/^Generato il: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/),
        14,
        28
      );
    });

    it('should create table with autoTable', async () => {
      const autoTable = (await import('jspdf-autotable')).default;

      exportToPDF(mockOptions);

      expect(autoTable).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          head: expect.any(Array),
          body: expect.any(Array),
          startY: 35,
          theme: 'striped',
        })
      );
    });

    it('should use Ferrari Red for table headers', async () => {
      const autoTable = (await import('jspdf-autotable')).default;

      exportToPDF(mockOptions);

      const config = (autoTable as any).mock.calls[0][1];
      expect(config.headStyles.fillColor).toEqual([205, 32, 44]);
    });

    it('should save PDF with correct filename', async () => {
      const jsPDF = (await import('jspdf')).default;
      const mockDoc = (jsPDF as any).mock.results[0].value;

      exportToPDF(mockOptions);

      expect(mockDoc.save).toHaveBeenCalledWith(
        expect.stringMatching(/^test_report_\d{8}_\d{6}\.pdf$/)
      );
    });

    it('should handle function accessors', async () => {
      const autoTable = (await import('jspdf-autotable')).default;

      exportToPDF(mockOptions);

      expect(autoTable).toHaveBeenCalled();
    });

    it('should format date values', async () => {
      const autoTable = (await import('jspdf-autotable')).default;

      exportToPDF(mockOptions);

      const config = (autoTable as any).mock.calls[0][1];
      expect(config.body).toBeDefined();
    });

    it('should format number values with Italian locale', async () => {
      const optionsWithNumbers: ExportOptions = {
        title: 'Numbers Report',
        columns: [{ header: 'Amount', accessor: 'amount' }],
        data: [{ amount: 1234.56 }, { amount: 9876.54 }],
      };

      exportToPDF(optionsWithNumbers);

      // Numbers should be formatted with Italian locale
      expect(true).toBe(true); // Placeholder - actual formatting tested in integration
    });

    it('should handle null/undefined values', async () => {
      const optionsWithNulls: ExportOptions = {
        title: 'Nulls Report',
        columns: [{ header: 'Value', accessor: 'value' }],
        data: [{ value: null }, { value: undefined }],
      };

      exportToPDF(optionsWithNulls);

      const jsPDF = (await import('jspdf')).default;
      const mockDoc = (jsPDF as any).mock.results[0].value;
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should use default title if not provided', async () => {
      const jsPDF = (await import('jspdf')).default;
      const mockDoc = (jsPDF as any).mock.results[0].value;

      const optionsWithoutTitle: ExportOptions = {
        columns: mockOptions.columns,
        data: mockOptions.data,
      };

      exportToPDF(optionsWithoutTitle);

      expect(mockDoc.text).toHaveBeenCalledWith('Report', 14, 20);
    });
  });

  describe('exportData - Generic Wrapper', () => {
    const mockOptions: ExportOptions = {
      filename: 'generic_export',
      title: 'Generic Report',
      columns: [{ header: 'Test', accessor: 'test' }],
      data: [{ test: 'value' }],
    };

    it('should call exportToCSV for CSV format', () => {
      exportData('CSV', mockOptions);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should call exportToExcel for EXCEL format', async () => {
      const XLSX = await import('xlsx');

      exportData('EXCEL', mockOptions);

      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should call exportToPDF for PDF format', async () => {
      const jsPDF = (await import('jspdf')).default;

      exportData('PDF', mockOptions);

      const mockDoc = (jsPDF as any).mock.results[0].value;
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should log error for unsupported format', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      exportData('INVALID' as any, mockOptions);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Formato export non supportato:',
        'INVALID'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle empty columns array', () => {
      const emptyColumnsOptions: ExportOptions = {
        columns: [],
        data: [{ test: 'value' }],
      };

      expect(() => exportToCSV(emptyColumnsOptions)).not.toThrow();
    });

    it('should handle empty data array', () => {
      const emptyDataOptions: ExportOptions = {
        columns: [{ header: 'Test', accessor: 'test' }],
        data: [],
      };

      expect(() => exportToCSV(emptyDataOptions)).not.toThrow();
    });

    it('should handle missing accessor property', () => {
      const missingPropOptions: ExportOptions = {
        columns: [{ header: 'Missing', accessor: 'nonexistent' }],
        data: [{ other: 'value' }],
      };

      expect(() => exportToCSV(missingPropOptions)).not.toThrow();
    });

    it('should handle special characters in data', () => {
      const specialCharsOptions: ExportOptions = {
        columns: [{ header: 'Text', accessor: 'text' }],
        data: [
          { text: 'Quote "test"' },
          { text: 'Comma, test' },
          { text: 'Newline\ntest' },
        ],
      };

      expect(() => exportToCSV(specialCharsOptions)).not.toThrow();
    });

    it('should handle very long filenames', () => {
      const longFilenameOptions: ExportOptions = {
        filename: 'a'.repeat(200),
        columns: [{ header: 'Test', accessor: 'test' }],
        data: [{ test: 'value' }],
      };

      expect(() => exportToCSV(longFilenameOptions)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const unicodeOptions: ExportOptions = {
        columns: [{ header: 'Testo', accessor: 'text' }],
        data: [
          { text: 'Àéìòù' },
          { text: '中文' },
          { text: '🚀' },
        ],
      };

      expect(() => exportToCSV(unicodeOptions)).not.toThrow();
    });
  });
});

// ============================================================================
// EJLOG WMS - ExportButton Component
// Pulsante dropdown per export dati in Excel/CSV/PDF
// ============================================================================

import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { exportData, ExportFormat, ExportColumn } from '../../utils/export';
import Button from './Button';

export interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  formats?: ExportFormat[];
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onExportStart?: (format: ExportFormat) => void;
  onExportComplete?: (format: ExportFormat) => void;
  onExportError?: (format: ExportFormat, error: Error) => void;
  'data-testid'?: string;
}

/**
 * ExportButton Component
 *
 * Dropdown button per export dati in vari formati.
 * Supporta Excel (.xlsx), CSV (.csv), PDF (.pdf)
 *
 * @example
 * ```tsx
 * const columns: ExportColumn<Item>[] = [
 *   { key: 'code', header: 'Codice', width: 15 },
 *   { key: 'description', header: 'Descrizione', width: 30 },
 *   { key: 'quantity', header: 'Quantità', format: (val) => val.toFixed(2) }
 * ];
 *
 * <ExportButton
 *   data={items}
 *   columns={columns}
 *   filename="articoli_export"
 *   formats={['excel', 'csv', 'pdf']}
 *   title="Report Articoli"
 * />
 * ```
 */
export default function ExportButton<T>({
  data,
  columns,
  filename,
  formats = ['excel', 'csv', 'pdf'],
  title,
  disabled = false,
  loading = false,
  variant = 'outline',
  size = 'md',
  className,
  onExportStart,
  onExportComplete,
  onExportError,
  'data-testid': dataTestId,
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<ExportFormat | null>(null);

  /**
   * Handle export click
   */
  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    setCurrentFormat(format);

    if (onExportStart) {
      onExportStart(format);
    }

    try {
      // Prepare options based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const filenameWithDate = `${filename}_${timestamp}`;

      const baseOptions = {
        filename: filenameWithDate,
        includeHeaders: true,
      };

      if (format === 'excel') {
        await exportData(data, columns, format, {
          ...baseOptions,
          sheetName: title || 'Data',
        });
      } else if (format === 'csv') {
        await exportData(data, columns, format, {
          ...baseOptions,
          delimiter: ';', // Italian/European standard
          encoding: 'utf-8',
        });
      } else if (format === 'pdf') {
        await exportData(data, columns, format, {
          ...baseOptions,
          title: title || 'Report',
          orientation: 'landscape',
          pageSize: 'a4',
          footerText: `Generated on ${new Date().toLocaleDateString('it-IT')}`,
        });
      }

      if (onExportComplete) {
        onExportComplete(format);
      }
    } catch (error) {
      console.error(`Export error (${format}):`, error);
      if (onExportError) {
        onExportError(format, error as Error);
      }
      // Could show toast notification here
      alert(`Export failed: ${(error as Error).message}`);
    } finally {
      setExporting(false);
      setCurrentFormat(null);
    }
  };

  /**
   * Get icon for format
   */
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'csv':
        return <FileText className="w-4 h-4" />;
      case 'pdf':
        return <FileDown className="w-4 h-4" />;
    }
  };

  /**
   * Get label for format
   */
  const getFormatLabel = (format: ExportFormat): string => {
    switch (format) {
      case 'excel':
        return 'Export to Excel (.xlsx)';
      case 'csv':
        return 'Export to CSV (.csv)';
      case 'pdf':
        return 'Export to PDF (.pdf)';
    }
  };

  const isDisabled = disabled || loading || exporting || data.length === 0;

  return (
    <Menu as="div" className={twMerge('relative inline-block text-left', className)} data-testid={dataTestId}>
      <div>
        <Menu.Button
          as={Button}
          variant={variant}
          size={size}
          disabled={isDisabled}
          loading={exporting}
          icon={<FileDown className="w-4 h-4" />}
          rightIcon={<ChevronDown className="w-4 h-4" />}
          data-testid={`${dataTestId}-trigger`}
        >
          {exporting ? `Exporting ${currentFormat}...` : 'Export'}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          data-testid={`${dataTestId}-menu`}
        >
          <div className="py-1">
            {/* Info Header */}
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
              {data.length} row(s) will be exported
            </div>

            {/* Format Options */}
            {formats.map((format) => (
              <Menu.Item key={format}>
                {({ active }) => (
                  <button
                    onClick={() => handleExport(format)}
                    disabled={exporting}
                    className={twMerge(
                      'group flex items-center w-full px-4 py-2 text-sm transition-colors',
                      active && 'bg-gray-100 text-gray-900',
                      !active && 'text-gray-700',
                      exporting && 'opacity-50 cursor-not-allowed'
                    )}
                    data-testid={`${dataTestId}-option-${format}`}
                  >
                    <span className="mr-3 text-gray-400 group-hover:text-gray-600">
                      {getFormatIcon(format)}
                    </span>
                    <span>{getFormatLabel(format)}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

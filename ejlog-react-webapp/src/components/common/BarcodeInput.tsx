// ============================================================================
// EJLOG WMS - BarcodeInput Component
// Specialized input for barcode scanner integration with visual feedback
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';

// Scan states
export type ScanState = 'idle' | 'scanning' | 'success' | 'error';

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// BarcodeInput props interface
export interface BarcodeInputProps {
  /** Callback when barcode is scanned (receives barcode string) */
  onScan: (barcode: string) => void | Promise<void>;
  /** Optional validation function (returns { valid: boolean, message?: string }) */
  onValidate?: (barcode: string) => ValidationResult | Promise<ValidationResult>;
  /** Input placeholder */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Clear input after successful scan (default: true) */
  clearOnScan?: boolean;
  /** Debounce time for scanner detection (ms, default: 100) */
  scanDebounce?: number;
  /** Additional CSS classes */
  className?: string;
  /** Optional label */
  label?: string;
  /** External error message */
  error?: string;
}

/**
 * BarcodeInput Component
 *
 * Specialized input for barcode scanner integration with visual feedback.
 * Detects fast input from barcode scanners and triggers callbacks.
 *
 * Features:
 * - Auto-focus capability
 * - Fast input detection (simulates scanner)
 * - Visual feedback for scanning state
 * - Success/error states
 * - Debounced manual input
 * - Enter key support
 *
 * @example
 * ```tsx
 * <BarcodeInput
 *   onScan={(barcode) => console.log('Scanned:', barcode)}
 *   onValidate={(barcode) => ({ valid: barcode.length > 5 })}
 *   autoFocus
 * />
 * ```
 */
const BarcodeInput = ({
  onScan,
  onValidate,
  placeholder = 'Scansiona barcode o inserisci manualmente...',
  autoFocus = true,
  disabled = false,
  clearOnScan = true,
  scanDebounce = 100,
  className = '',
  label,
  error: externalError,
}: BarcodeInputProps): JSX.Element => {
  const [value, setValue] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeypressRef = useRef<number>(Date.now());

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  // Reset scan state after 2 seconds
  useEffect(() => {
    if (scanState === 'success' || scanState === 'error') {
      const timeout = setTimeout(() => {
        setScanState('idle');
        setErrorMessage('');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [scanState]);

  const handleScan = useCallback(
    async (barcode: string): Promise<void> => {
      const trimmedBarcode = barcode.trim();

      if (!trimmedBarcode) {
        return;
      }

      // Validate if validator provided
      if (onValidate) {
        const validation = await onValidate(trimmedBarcode);
        if (!validation.valid) {
          setScanState('error');
          setErrorMessage(validation.message || 'Barcode non valido');
          return;
        }
      }

      // Trigger scan callback
      if (onScan) {
        try {
          await onScan(trimmedBarcode);
          setScanState('success');
          setErrorMessage('');

          // Clear input if configured
          if (clearOnScan) {
            setValue('');
          }
        } catch (err) {
          setScanState('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'Errore durante la scansione'
          );
        }
      }

      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [onScan, onValidate, clearOnScan]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setValue(newValue);

    // Detect fast typing (barcode scanner behavior)
    const now = Date.now();
    const timeSinceLastKeypress = now - lastKeypressRef.current;
    lastKeypressRef.current = now;

    // If typing is very fast (< 50ms between keystrokes), likely a scanner
    const isProbablyScanner = timeSinceLastKeypress < 50;

    if (isProbablyScanner || isScanning) {
      setIsScanning(true);
      setScanState('scanning');
    }

    // Clear previous timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Set timeout to trigger scan
    scanTimeoutRef.current = setTimeout(() => {
      if (newValue.trim()) {
        handleScan(newValue);
      }
      setIsScanning(false);
    }, scanDebounce);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    // Enter key triggers immediate scan
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();

      // Clear timeout if exists
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      setIsScanning(false);
      handleScan(value);
    }

    // Escape key clears input
    if (e.key === 'Escape') {
      setValue('');
      setScanState('idle');
      setErrorMessage('');
    }
  };

  const handleBlur = (): void => {
    // If user leaves input without scanning, clear scanning state
    setTimeout(() => {
      setIsScanning(false);
      if (scanState === 'scanning') {
        setScanState('idle');
      }
    }, 200);
  };

  const getIconComponent = (): JSX.Element => {
    switch (scanState) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'scanning':
        return <Search className="h-5 w-5 text-ferretto-red animate-pulse" />;
      default:
        return <Search className="h-5 w-5 text-gray-400" />;
    }
  };

  const getBorderColor = (): string => {
    if (disabled) return 'border-gray-200';
    switch (scanState) {
      case 'success':
        return 'border-green-400 ring-2 ring-green-200';
      case 'error':
        return 'border-red-400 ring-2 ring-red-200';
      case 'scanning':
        return 'border-ferretto-red ring-2 ring-red-100';
      default:
        return 'border-gray-300 focus:border-ferretto-red focus:ring-2 focus:ring-red-100';
    }
  };

  const displayError = externalError || errorMessage;

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor="barcode-input"
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getIconComponent()}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id="barcode-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-24 py-3 rounded-lg transition-all duration-200
            placeholder-gray-400 text-gray-900
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
            focus:outline-none
            ${getBorderColor()}
            ${className || 'text-base'}
          `}
          autoComplete="off"
          spellCheck="false"
          data-testid="barcode-input"
        />

        {/* Status Badge */}
        {scanState !== 'idle' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span
              className={`
                text-xs font-medium px-2 py-1 rounded-md
                ${scanState === 'scanning' ? 'bg-ferretto-red text-white' : ''}
                ${scanState === 'success' ? 'bg-green-100 text-green-700' : ''}
                ${scanState === 'error' ? 'bg-red-100 text-red-700' : ''}
              `}
            >
              {scanState === 'scanning' && 'Scansione...'}
              {scanState === 'success' && 'OK'}
              {scanState === 'error' && 'Errore'}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="text-sm text-red-600 flex items-center mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          {displayError}
        </p>
      )}

      {/* Help Text */}
      {!displayError && scanState === 'idle' && (
        <p className="text-xs text-gray-500 mt-1">
          Scansiona con lettore barcode o premi Invio dopo l'inserimento manuale
        </p>
      )}
    </div>
  );
};

export default BarcodeInput;

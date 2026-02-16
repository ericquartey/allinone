// ============================================================================
// EJLOG WMS - BarcodeScanner Component
// Componente specializzato per input barcode con hardware scanner support
// ============================================================================

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { twMerge } from 'tailwind-merge';

export interface BarcodeScannerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSubmit'> {
  onScan: (barcode: string) => void | Promise<void>;
  onValidate?: (barcode: string) => Promise<{ valid: boolean; message?: string }>;
  autoFocus?: boolean;
  audioFeedback?: boolean;
  visualFeedback?: boolean;
  clearOnScan?: boolean;
  minLength?: number;
  maxLength?: number;
  scanDelay?: number; // ms delay before processing (for hardware scanners)
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: boolean;
  'data-testid'?: string;
}

export interface BarcodeScannerRef {
  focus: () => void;
  clear: () => void;
  setValue: (value: string) => void;
}

/**
 * BarcodeScanner Component
 *
 * Componente di input specializzato per scansione barcode con supporto per:
 * - Hardware barcode scanner (automatico con Enter key)
 * - Input manuale da tastiera
 * - Validazione real-time
 * - Audio feedback (beep success/error)
 * - Visual feedback (colori border)
 * - Auto-clear dopo scansione
 * - Auto-focus on mount
 *
 * @example
 * ```tsx
 * <BarcodeScanner
 *   label="Scan Barcode Articolo"
 *   onScan={handleBarcodeScan}
 *   onValidate={validateBarcode}
 *   audioFeedback
 *   visualFeedback
 *   clearOnScan
 *   autoFocus
 * />
 * ```
 */
const BarcodeScanner = forwardRef<BarcodeScannerRef, BarcodeScannerProps>(
  (
    {
      onScan,
      onValidate,
      autoFocus = true,
      audioFeedback = true,
      visualFeedback = true,
      clearOnScan = true,
      minLength = 1,
      maxLength = 50,
      scanDelay = 100,
      loading = false,
      disabled = false,
      placeholder = 'Scan or type barcode...',
      label,
      error,
      success,
      className,
      'data-testid': dataTestId,
      ...inputProps
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationState, setValidationState] = useState<'idle' | 'success' | 'error'>('idle');
    const [validationMessage, setValidationMessage] = useState<string>('');
    const scanTimeoutRef = useRef<NodeJS.Timeout>();

    // Audio context for beep sounds
    const audioContextRef = useRef<AudioContext>();

    useEffect(() => {
      if (audioFeedback && typeof window !== 'undefined' && window.AudioContext) {
        audioContextRef.current = new AudioContext();
      }
      return () => {
        audioContextRef.current?.close();
      };
    }, [audioFeedback]);

    // Auto-focus on mount
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    // Imperative handle for parent control
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        setValue('');
        setValidationState('idle');
        setValidationMessage('');
      },
      setValue: (val: string) => setValue(val),
    }));

    /**
     * Play beep sound (success or error)
     */
    const playBeep = (type: 'success' | 'error') => {
      if (!audioFeedback || !audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Success: 1200Hz short beep
      // Error: 400Hz longer beep
      oscillator.frequency.value = type === 'success' ? 1200 : 400;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (type === 'success' ? 0.1 : 0.3));

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + (type === 'success' ? 0.1 : 0.3));
    };

    /**
     * Process scanned barcode
     */
    const processScan = async (barcode: string) => {
      const trimmed = barcode.trim();

      // Validate length
      if (trimmed.length < minLength || trimmed.length > maxLength) {
        setValidationState('error');
        setValidationMessage(`Barcode must be between ${minLength} and ${maxLength} characters`);
        playBeep('error');
        return;
      }

      // Custom validation
      if (onValidate) {
        setIsValidating(true);
        try {
          const result = await onValidate(trimmed);
          if (!result.valid) {
            setValidationState('error');
            setValidationMessage(result.message || 'Invalid barcode');
            playBeep('error');
            return;
          }
        } catch (err) {
          console.error('Barcode validation error:', err);
          setValidationState('error');
          setValidationMessage('Validation failed');
          playBeep('error');
          return;
        } finally {
          setIsValidating(false);
        }
      }

      // Success
      setValidationState('success');
      setValidationMessage('');
      playBeep('success');

      // Call onScan callback
      try {
        await onScan(trimmed);
      } catch (err) {
        console.error('Barcode scan handler error:', err);
        setValidationState('error');
        setValidationMessage('Processing failed');
        playBeep('error');
        return;
      }

      // Clear input if configured
      if (clearOnScan) {
        setValue('');
        setValidationState('idle');
        // Re-focus after clear
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    /**
     * Handle input change
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setValidationState('idle');
      setValidationMessage('');

      // Clear any pending scan timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };

    /**
     * Handle Enter key (hardware scanner or manual entry)
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim() && !isValidating && !loading && !disabled) {
        e.preventDefault();
        // Delay to allow hardware scanner to finish input
        scanTimeoutRef.current = setTimeout(() => {
          processScan(value);
        }, scanDelay);
      }
    };

    /**
     * Compute border color based on state
     */
    const getBorderColor = () => {
      if (error || validationState === 'error') return 'border-red-500';
      if (success || validationState === 'success') return 'border-green-500';
      if (isValidating || loading) return 'border-yellow-500';
      return 'border-gray-300 focus:border-ferrRed';
    };

    const displayError = error || validationMessage;

    return (
      <div className={twMerge('space-y-2', className)} data-testid={dataTestId}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {inputProps.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            {...inputProps}
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading || isValidating}
            placeholder={placeholder}
            className={twMerge(
              'w-full px-4 py-2 border rounded-lg',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ferrRed focus:ring-opacity-50',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              'font-mono text-lg', // Monospace for barcode readability
              getBorderColor()
            )}
            data-testid={`${dataTestId}-input`}
          />

          {/* Loading/Validating Spinner */}
          {(isValidating || loading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {/* Success Icon */}
          {visualFeedback && validationState === 'success' && !isValidating && !loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="h-5 w-5 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Error Icon */}
          {visualFeedback && validationState === 'error' && !isValidating && !loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Error Message */}
        {displayError && (
          <p className="text-sm text-red-600" role="alert" data-testid={`${dataTestId}-error`}>
            {displayError}
          </p>
        )}

        {/* Help Text */}
        {!displayError && inputProps.title && (
          <p className="text-sm text-gray-500">{inputProps.title}</p>
        )}

        {/* Instruction hint */}
        <p className="text-xs text-gray-400 italic">
          {autoFocus ? '🎯 Ready to scan' : 'Click to scan'} • Press Enter to submit
        </p>
      </div>
    );
  }
);

BarcodeScanner.displayName = 'BarcodeScanner';

export default BarcodeScanner;

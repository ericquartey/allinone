// ============================================================================
// EJLOG WMS - Unified Barcode Scanner Hook
// Hook avanzato per gestire scanner USB, camera QR e input manuale
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

/**
 * Tipi di scanner supportati
 */
export enum ScannerType {
  KEYBOARD_WEDGE = 'keyboard_wedge', // Scanner USB/wireless (keyboard wedge)
  CAMERA = 'camera',                 // Camera per QR/barcode
  MANUAL = 'manual',                 // Input manuale
}

/**
 * Configurazione scanner
 */
export interface BarcodeScannerOptions {
  onScan: (barcode: string, type: ScannerType) => void;
  onError?: (error: Error) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number;
  enabled?: boolean;
  allowCamera?: boolean;
  allowKeyboard?: boolean;
  beep?: boolean;
  validate?: (barcode: string) => boolean;
  transform?: (barcode: string) => string;
}

/**
 * Stato dello scanner
 */
export interface BarcodeScannerState {
  buffer: string;
  isScanning: boolean;
  lastScan: string | null;
  scanCount: number;
  cameraActive: boolean;
}

/**
 * Azioni disponibili
 */
export interface BarcodeScannerActions {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  clearBuffer: () => void;
  manualScan: (barcode: string) => void;
  reset: () => void;
}

/**
 * Hook unificato per gestione scanner barcode
 *
 * Supporta:
 * - Scanner USB/wireless (keyboard wedge mode)
 * - Camera QR/barcode scanner
 * - Input manuale
 *
 * @example
 * ```tsx
 * const { state, actions } = useBarcodeScanner({
 *   onScan: (barcode) => console.log('Scanned:', barcode),
 *   minLength: 8,
 *   beep: true,
 * });
 *
 * // Start camera scanner
 * <button onClick={actions.startCamera}>Scan QR</button>
 * ```
 */
export function useBarcodeScanner(
  options: BarcodeScannerOptions
): { state: BarcodeScannerState; actions: BarcodeScannerActions } {
  const {
    onScan,
    onError,
    minLength = 3,
    maxLength = 50,
    timeout = 100,
    enabled = true,
    allowCamera = true,
    allowKeyboard = true,
    beep = false,
    validate,
    transform,
  } = options;

  // State
  const [buffer, setBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);

  // Refs
  const timeoutRef = useRef<NodeJS.Timeout>();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Riproduce beep quando barcode scansionato
   */
  const playBeep = useCallback(() => {
    if (!beep) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.warn('[Barcode] Beep error:', error);
    }
  }, [beep]);

  /**
   * Processa barcode scansionato
   */
  const processScan = useCallback(
    (rawBarcode: string, type: ScannerType) => {
      // Pulisci e trasforma
      let barcode = rawBarcode.trim();

      if (transform) {
        barcode = transform(barcode);
      }

      // Valida lunghezza
      if (barcode.length < minLength || barcode.length > maxLength) {
        console.warn(`[Barcode] Invalid length: ${barcode.length} (min: ${minLength}, max: ${maxLength})`);
        onError?.(new Error(`Barcode length invalid: ${barcode.length}`));
        return;
      }

      // Validazione custom
      if (validate && !validate(barcode)) {
        console.warn('[Barcode] Validation failed:', barcode);
        onError?.(new Error('Barcode validation failed'));
        return;
      }

      // Beep e aggiorna stato
      playBeep();
      setLastScan(barcode);
      setScanCount((prev) => prev + 1);

      // Callback
      onScan(barcode, type);

      console.log(`[Barcode] Scanned (${type}):`, barcode);
    },
    [minLength, maxLength, validate, transform, playBeep, onScan, onError]
  );

  /**
   * Gestione keyboard wedge scanner (USB/wireless)
   */
  useEffect(() => {
    if (!enabled || !allowKeyboard) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignora se focus su input/textarea (tranne se specificamente abilitato)
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (isInputField && !target.dataset.barcodeEnabled) {
        return;
      }

      // Enter termina la scansione
      if (e.key === 'Enter') {
        if (buffer.length >= minLength) {
          processScan(buffer, ScannerType.KEYBOARD_WEDGE);
          setBuffer('');
        }
        return;
      }

      // Accumula caratteri (solo alfanumerici e alcuni simboli)
      if (e.key.length === 1) {
        setBuffer((prev) => {
          const newBuffer = prev + e.key;

          // Limita lunghezza buffer
          if (newBuffer.length > maxLength) {
            return '';
          }

          return newBuffer;
        });

        // Reset buffer dopo timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setBuffer('');
        }, timeout);

        // Previeni default per evitare inserimento in campi input non abilitati
        if (!isInputField) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, allowKeyboard, buffer, minLength, maxLength, timeout, processScan]);

  /**
   * Start camera scanner
   */
  const startCamera = useCallback(async () => {
    if (!allowCamera) {
      toast.error('Camera scanner non abilitato');
      return;
    }

    try {
      setIsScanning(true);

      // Inizializza Html5Qrcode se necessario
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      const qrCode = html5QrCodeRef.current;

      // Configura scanner
      await qrCode.start(
        { facingMode: 'environment' }, // Usa camera posteriore
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successo
          processScan(decodedText, ScannerType.CAMERA);
          stopCamera();
        },
        (errorMessage) => {
          // Errore decodifica (normale durante scansione)
          // Non logghiamo per evitare spam
        }
      );

      setCameraActive(true);
      toast.success('Camera scanner attiva');
    } catch (error) {
      console.error('[Barcode] Camera start error:', error);
      toast.error('Impossibile avviare camera scanner');
      onError?.(error as Error);
      setIsScanning(false);
    }
  }, [allowCamera, processScan, onError]);

  /**
   * Stop camera scanner
   */
  const stopCamera = useCallback(() => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          setCameraActive(false);
          setIsScanning(false);
          console.log('[Barcode] Camera stopped');
        })
        .catch((error) => {
          console.error('[Barcode] Camera stop error:', error);
        });
    }
  }, []);

  /**
   * Clear buffer manualmente
   */
  const clearBuffer = useCallback(() => {
    setBuffer('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  /**
   * Scan manuale (da input utente)
   */
  const manualScan = useCallback(
    (barcode: string) => {
      processScan(barcode, ScannerType.MANUAL);
    },
    [processScan]
  );

  /**
   * Reset completo stato scanner
   */
  const reset = useCallback(() => {
    clearBuffer();
    setLastScan(null);
    setScanCount(0);
    stopCamera();
  }, [clearBuffer, stopCamera]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCamera]);

  return {
    state: {
      buffer,
      isScanning,
      lastScan,
      scanCount,
      cameraActive,
    },
    actions: {
      startCamera,
      stopCamera,
      clearBuffer,
      manualScan,
      reset,
    },
  };
}

/**
 * Hook semplificato per keyboard wedge scanner
 */
export function useKeyboardScanner(options: {
  onScan: (barcode: string) => void;
  minLength?: number;
  enabled?: boolean;
}) {
  return useBarcodeScanner({
    ...options,
    allowCamera: false,
    allowKeyboard: true,
  });
}

/**
 * Hook semplificato per camera scanner
 */
export function useCameraScanner(options: {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
}) {
  return useBarcodeScanner({
    ...options,
    allowCamera: true,
    allowKeyboard: false,
  });
}

export default useBarcodeScanner;

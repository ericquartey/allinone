// ============================================================================
// EJLOG WMS - useBarcode Hook
// Hook per scanner barcode
// ============================================================================

import { useEffect, useState, useRef } from 'react';

interface UseBarcodeOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  timeout?: number;
  enabled?: boolean;
}

export const useBarcode = ({
  onScan,
  minLength = 4,
  timeout = 100,
  enabled = true,
}: UseBarcodeOptions) => {
  const [buffer, setBuffer] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignora se focus su input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Enter termina la scansione
      if (e.key === 'Enter') {
        if (buffer.length >= minLength) {
          onScan(buffer);
          setBuffer('');
        }
        return;
      }

      // Accumula caratteri
      setBuffer((prev) => prev + e.key);

      // Reset buffer dopo timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setBuffer('');
      }, timeout);
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, buffer, minLength, timeout, onScan]);

  return { buffer };
};

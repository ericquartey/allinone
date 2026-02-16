/**
 * useRealTimeData Hook
 * Feature B - Real-Time Dashboard Data Polling
 *
 * Hook per aggiornamenti automatici dei dati con polling configurabile
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRealTimeDataOptions {
  interval?: number; // Intervallo polling in ms (default: 30000 = 30s)
  enabled?: boolean; // Abilita/disabilita polling (default: true)
  onError?: (error: Error) => void; // Callback per gestire errori
  refetchOnMount?: boolean; // Ricarica dati al mount (default: true)
}

interface UseRealTimeDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  isLive: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

/**
 * Hook per fetch automatico e real-time polling di dati
 *
 * @param url - URL dell'API da chiamare
 * @param options - Opzioni di configurazione
 * @returns Oggetto con dati, stato loading, indicatore live e controlli
 *
 * @example
 * ```tsx
 * const { data, isLive, refetch } = useRealTimeData('/api/items', { interval: 30000 });
 *
 * return (
 *   <div>
 *     {isLive && <span className="badge-live">🔴 LIVE</span>}
 *     <button onClick={refetch}>Refresh</button>
 *     {data && <ItemsList items={data} />}
 *   </div>
 * );
 * ```
 */
export function useRealTimeData<T = any>(
  url: string,
  options: UseRealTimeDataOptions = {}
): UseRealTimeDataReturn<T> {
  const {
    interval = 30000, // Default 30 secondi
    enabled = true,
    onError,
    refetchOnMount = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Funzione per fetch dati
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!isMountedRef.current) return;

      // Supporta sia formato { data: ... } che array diretto
      const extractedData = result.data || result.exported || result;

      setData(extractedData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      if (onError) {
        onError(error);
      }

      console.error(`[useRealTimeData] Error fetching ${url}:`, error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [url, onError]);

  // Funzione per avviare polling
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  // Funzione per fermare polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Setup polling
  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Primo fetch immediato se refetchOnMount è true
    if (refetchOnMount) {
      fetchData();
    }

    // Setup interval per polling
    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, interval, fetchData, refetchOnMount]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLive: isPolling && !error,
    error,
    lastUpdate,
    refetch: fetchData,
    startPolling,
    stopPolling,
  };
}

/**
 * Hook semplificato per real-time data con intervallo fisso di 30s
 *
 * @example
 * ```tsx
 * const { data: items, isLive } = useRealTime('/api/items');
 * ```
 */
export function useRealTime<T = any>(url: string) {
  return useRealTimeData<T>(url, { interval: 30000 });
}

export default useRealTimeData;

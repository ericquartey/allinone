/**
 * Hook React per connessione WebSocket real-time
 *
 * Fornisce aggiornamenti in tempo reale dal server per:
 * - Liste (cambi di stato, nuove liste, eliminazioni)
 * - UDC (aggiornamenti cassetti)
 * - Stock (variazioni giacenze)
 *
 * Gestisce automaticamente riconnessioni in caso di disconnessione
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  enabled?: boolean; // Permette di abilitare/disabilitare la connessione
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  send: (message: any) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
}

/**
 * Hook per gestire connessioni WebSocket con riconnessione automatica
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onOpen,
    onClose,
    onError,
    onMessage,
    enabled = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const manualCloseRef = useRef(false);

  /**
   * Pulisce i timer di riconnessione
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Connette al server WebSocket
   */
  const connect = useCallback(() => {
    if (!enabled) {
      console.log('[WebSocket] Connessione disabilitata');
      return;
    }

    // Non tentare di riconnettersi se abbiamo superato il massimo
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('[WebSocket] Raggiunto numero massimo di tentativi di riconnessione');
      return;
    }

    // Se c'è già una connessione attiva, non fare nulla
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Connessione già attiva');
      return;
    }

    try {
      console.log(`[WebSocket] Tentativo di connessione a ${url}...`);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connesso');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        manualCloseRef.current = false;
        onOpen?.();
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] Disconnesso (code: ${event.code}, reason: ${event.reason})`);
        setIsConnected(false);
        wsRef.current = null;
        onClose?.();

        // Riconnetti automaticamente solo se non è stata una chiusura manuale
        if (!manualCloseRef.current && enabled) {
          reconnectAttemptsRef.current++;
          console.log(`[WebSocket] Tentativo riconnessione ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectInterval}ms...`);

          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Errore:', error);
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Messaggio ricevuto:', message.type);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Errore parsing messaggio:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Errore creazione connessione:', error);
    }
  }, [url, enabled, maxReconnectAttempts, reconnectInterval, onOpen, onClose, onError, onMessage, clearReconnectTimeout]);

  /**
   * Disconnette dal server WebSocket
   */
  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    clearReconnectTimeout();

    if (wsRef.current) {
      console.log('[WebSocket] Chiusura connessione...');
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [clearReconnectTimeout]);

  /**
   * Invia un messaggio al server WebSocket
   */
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageStr);
      console.log('[WebSocket] Messaggio inviato:', message);
    } else {
      console.warn('[WebSocket] Impossibile inviare messaggio: connessione non attiva');
    }
  }, []);

  /**
   * Sottoscrive un canale specifico
   */
  const subscribe = useCallback((channel: string) => {
    send({ type: 'subscribe', channel });
    console.log(`[WebSocket] Iscritto al canale: ${channel}`);
  }, [send]);

  /**
   * Disiscrivi da un canale specifico
   */
  const unsubscribe = useCallback((channel: string) => {
    send({ type: 'unsubscribe', channel });
    console.log(`[WebSocket] Disiscritto dal canale: ${channel}`);
  }, [send]);

  /**
   * Forza una riconnessione
   */
  const reconnect = useCallback(() => {
    console.log('[WebSocket] Riconnessione manuale richiesta');
    disconnect();
    setTimeout(() => {
      reconnectAttemptsRef.current = 0;
      connect();
    }, 500);
  }, [disconnect, connect]);

  /**
   * Effetto per gestire connessione/disconnessione
   */
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup al dismount del componente
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    unsubscribe,
    reconnect
  };
}

export default useWebSocket;

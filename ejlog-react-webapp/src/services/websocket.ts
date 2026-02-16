// ============================================================================
// EJLOG WMS - WebSocket Service
// Servizio per comunicazione real-time con backend (allarmi, stato macchine, etc)
// ============================================================================

import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

/**
 * Eventi WebSocket disponibili
 */
export enum WebSocketEvent {
  // Eventi di connessione
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_ERROR = 'reconnect_error',
  RECONNECT_FAILED = 'reconnect_failed',

  // Eventi applicativi
  ALARM_NEW = 'alarm:new',
  ALARM_UPDATED = 'alarm:updated',
  ALARM_RESOLVED = 'alarm:resolved',

  MACHINE_STATUS = 'machine:status',
  MACHINE_ERROR = 'machine:error',

  BAY_OPERATION = 'bay:operation',
  BAY_GUIDANCE = 'bay:guidance',

  RESERVATION_UPDATED = 'reservation:updated',
  RESERVATION_COMPLETED = 'reservation:completed',

  STOCK_UPDATED = 'stock:updated',

  NOTIFICATION = 'notification',
  BROADCAST = 'broadcast',
}

/**
 * Configurazione WebSocket
 */
interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
  debug?: boolean;
}

/**
 * Tipo per i listener degli eventi
 */
type EventListener = (data: any) => void;

/**
 * Servizio WebSocket Singleton per comunicazione real-time
 */
class WebSocketService {
  private socket: Socket | null = null;
  private readonly config: Required<WebSocketConfig>;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || this.getDefaultUrl(),
      autoConnect: config.autoConnect ?? false,
      reconnection: config.reconnection ?? true,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      reconnectionAttempts: config.reconnectionAttempts ?? 10,
      debug: config.debug ?? (import.meta.env.DEV || false),
    };

    this.log('WebSocket Service initialized', this.config);
  }

  /**
   * Determina URL del backend WebSocket
   */
  private getDefaultUrl(): string {
    // In development usa localhost:3077
    if (import.meta.env.DEV) {
      return 'http://localhost:3077';
    }
    // In production usa origin corrente
    return window.location.origin;
  }

  /**
   * Log helper (solo in debug mode)
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }

  /**
   * Connette al server WebSocket
   */
  connect(): void {
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    this.log('Connecting to', this.config.url);

    // Crea socket con configurazione
    this.socket = io(this.config.url, {
      transports: ['websocket', 'polling'],
      reconnection: this.config.reconnection,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionAttempts: this.config.reconnectionAttempts,
      auth: {
        token: localStorage.getItem('auth_token') || undefined,
      },
    });

    // Setup event handlers di sistema
    this.setupSystemHandlers();
  }

  /**
   * Configura gestori eventi di sistema
   */
  private setupSystemHandlers(): void {
    if (!this.socket) return;

    this.socket.on(WebSocketEvent.CONNECT, () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.log('Connected to server');
      toast.success('Connessione real-time attiva', { duration: 2000 });
      this.emit('internal:connected', null);
    });

    this.socket.on(WebSocketEvent.DISCONNECT, (reason: string) => {
      this.isConnected = false;
      this.log('Disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Il server ha forzato la disconnessione
        toast.error('Disconnesso dal server');
      }

      this.emit('internal:disconnected', { reason });
    });

    this.socket.on(WebSocketEvent.CONNECT_ERROR, (error: Error) => {
      this.log('Connection error:', error.message);

      if (this.reconnectAttempts === 0) {
        toast.error('Impossibile connettersi al server real-time');
      }
    });

    this.socket.on(WebSocketEvent.RECONNECT_ATTEMPT, (attempt: number) => {
      this.reconnectAttempts = attempt;
      this.log(`Reconnection attempt ${attempt}/${this.config.reconnectionAttempts}`);
    });

    this.socket.on(WebSocketEvent.RECONNECT, (attempt: number) => {
      this.log(`Reconnected after ${attempt} attempts`);
      toast.success('Riconnesso al server', { duration: 2000 });
    });

    this.socket.on(WebSocketEvent.RECONNECT_FAILED, () => {
      this.log('Reconnection failed - max attempts reached');
      toast.error('Impossibile riconnettersi. Aggiorna la pagina.', {
        duration: 10000,
      });
    });
  }

  /**
   * Disconnette dal server
   */
  disconnect(): void {
    if (this.socket) {
      this.log('Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Sottoscrive un evento
   */
  on(event: string | WebSocketEvent, callback: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Registra listener sul socket
    if (this.socket) {
      this.socket.on(event, callback);
    }

    this.log(`Listener registered for event: ${event}`);
  }

  /**
   * Rimuove sottoscrizione evento
   */
  off(event: string | WebSocketEvent, callback?: EventListener): void {
    if (callback) {
      // Rimuovi specifico listener
      this.listeners.get(event)?.delete(callback);

      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      // Rimuovi tutti i listener per l'evento
      this.listeners.delete(event);

      if (this.socket) {
        this.socket.off(event);
      }
    }

    this.log(`Listener removed for event: ${event}`);
  }

  /**
   * Emette un evento verso il server
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      this.log('Cannot emit - not connected');
      return;
    }

    this.log(`Emitting event: ${event}`, data);
    this.socket.emit(event, data);
  }

  /**
   * Invia richiesta con callback (request/response pattern)
   */
  request<T = any>(event: string, data: any, timeout = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Request timeout for event: ${event}`));
      }, timeout);

      this.socket.emit(event, data, (response: T) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  /**
   * Getter per stato connessione
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Getter per numero tentativi di riconnessione
   */
  get attempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Helper per sottoscrivere allarmi
   */
  onAlarm(callback: (alarm: any) => void): () => void {
    this.on(WebSocketEvent.ALARM_NEW, callback);
    this.on(WebSocketEvent.ALARM_UPDATED, callback);

    // Ritorna funzione cleanup
    return () => {
      this.off(WebSocketEvent.ALARM_NEW, callback);
      this.off(WebSocketEvent.ALARM_UPDATED, callback);
    };
  }

  /**
   * Helper per sottoscrivere stato macchine
   */
  onMachineStatus(callback: (status: any) => void): () => void {
    this.on(WebSocketEvent.MACHINE_STATUS, callback);

    return () => {
      this.off(WebSocketEvent.MACHINE_STATUS, callback);
    };
  }

  /**
   * Helper per sottoscrivere operazioni baia
   */
  onBayOperation(callback: (operation: any) => void): () => void {
    this.on(WebSocketEvent.BAY_OPERATION, callback);
    this.on(WebSocketEvent.BAY_GUIDANCE, callback);

    return () => {
      this.off(WebSocketEvent.BAY_OPERATION, callback);
      this.off(WebSocketEvent.BAY_GUIDANCE, callback);
    };
  }

  /**
   * Helper per sottoscrivere aggiornamenti stock
   */
  onStockUpdate(callback: (update: any) => void): () => void {
    this.on(WebSocketEvent.STOCK_UPDATED, callback);

    return () => {
      this.off(WebSocketEvent.STOCK_UPDATED, callback);
    };
  }

  /**
   * Helper per notifiche generiche
   */
  onNotification(callback: (notification: any) => void): () => void {
    this.on(WebSocketEvent.NOTIFICATION, callback);

    return () => {
      this.off(WebSocketEvent.NOTIFICATION, callback);
    };
  }
}

/**
 * Istanza singleton del servizio WebSocket
 * Usa questa per tutte le comunicazioni real-time
 */
export const wsService = new WebSocketService({
  autoConnect: false, // Connessione manuale dopo login
  debug: import.meta.env.DEV,
});

/**
 * Hook React per usare WebSocket in componenti
 */
export function useWebSocket() {
  return {
    connect: () => wsService.connect(),
    disconnect: () => wsService.disconnect(),
    on: (event: string | WebSocketEvent, callback: EventListener) =>
      wsService.on(event, callback),
    off: (event: string | WebSocketEvent, callback?: EventListener) =>
      wsService.off(event, callback),
    emit: (event: string, data: any) => wsService.emit(event, data),
    request: <T = any>(event: string, data: any, timeout?: number) =>
      wsService.request<T>(event, data, timeout),
    connected: wsService.connected,

    // Helper methods
    onAlarm: (callback: EventListener) => wsService.onAlarm(callback),
    onMachineStatus: (callback: EventListener) => wsService.onMachineStatus(callback),
    onBayOperation: (callback: EventListener) => wsService.onBayOperation(callback),
    onStockUpdate: (callback: EventListener) => wsService.onStockUpdate(callback),
    onNotification: (callback: EventListener) => wsService.onNotification(callback),
  };
}

export default wsService;


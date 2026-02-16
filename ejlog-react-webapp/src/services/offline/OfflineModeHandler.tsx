import React, { FC, useState, useEffect, createContext, useContext } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

// Types
interface OfflineData {
  id: string;
  type: 'operation' | 'scan' | 'movement' | 'update';
  data: any;
  timestamp: Date;
  synced: boolean;
}

interface OfflineContextType {
  isOnline: boolean;
  isPending: boolean;
  pendingCount: number;
  addOfflineData: (type: string, data: any) => void;
  syncOfflineData: () => Promise<void>;
  clearOfflineData: () => void;
}

// LocalStorage keys
const OFFLINE_DATA_KEY = 'ejlog_offline_data';
const LAST_SYNC_KEY = 'ejlog_last_sync';

// Context
const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOfflineMode = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineMode must be used within OfflineModeProvider');
  }
  return context;
};

// Provider Props
interface OfflineModeProviderProps {
  children: React.ReactNode;
  apiBaseUrl?: string;
}

export const OfflineModeProvider: FC<OfflineModeProviderProps> = ({
  children,
  apiBaseUrl = '/api'
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPending, setIsPending] = useState(false);
  const [pendingData, setPendingData] = useState<OfflineData[]>([]);

  // Load offline data from localStorage
  useEffect(() => {
    loadOfflineData();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: ONLINE');
      setIsOnline(true);
      // Auto-sync when coming back online
      syncOfflineData();
    };

    const handleOffline = () => {
      console.log('Network: OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_DATA_KEY);
      if (stored) {
        const data: OfflineData[] = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        data.forEach(item => {
          item.timestamp = new Date(item.timestamp);
        });
        setPendingData(data.filter(item => !item.synced));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const saveOfflineData = (data: OfflineData[]) => {
    try {
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const addOfflineData = (type: string, data: any) => {
    const offlineItem: OfflineData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      data,
      timestamp: new Date(),
      synced: false
    };

    const updated = [...pendingData, offlineItem];
    setPendingData(updated);
    saveOfflineData(updated);

    console.log('Added offline data:', offlineItem);
  };

  const syncOfflineData = async () => {
    if (!isOnline || pendingData.length === 0 || isPending) {
      return;
    }

    setIsPending(true);

    try {
      console.log(`Syncing ${pendingData.length} offline items...`);

      // Process each pending item
      for (const item of pendingData) {
        if (item.synced) continue;

        try {
          // Determine endpoint based on type
          let endpoint = '';
          let method = 'POST';

          switch (item.type) {
            case 'operation':
              endpoint = `${apiBaseUrl}/operations`;
              break;
            case 'scan':
              endpoint = `${apiBaseUrl}/scans`;
              break;
            case 'movement':
              endpoint = `${apiBaseUrl}/movements`;
              break;
            case 'update':
              endpoint = `${apiBaseUrl}/${item.data.entity}/${item.data.id}`;
              method = 'PUT';
              break;
            default:
              console.warn('Unknown offline data type:', item.type);
              continue;
          }

          // Sync to server
          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
            },
            body: JSON.stringify(item.data)
          });

          if (response.ok) {
            // Mark as synced
            item.synced = true;
            console.log('Synced:', item.id);
          } else {
            console.error('Failed to sync:', item.id, response.status);
          }
        } catch (error) {
          console.error('Sync error for item:', item.id, error);
        }
      }

      // Update storage
      const stillPending = pendingData.filter(item => !item.synced);
      setPendingData(stillPending);
      saveOfflineData(pendingData); // Save all (including synced) for history

      // Update last sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log('Sync complete. Remaining:', stillPending.length);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsPending(false);
    }
  };

  const clearOfflineData = () => {
    setPendingData([]);
    localStorage.removeItem(OFFLINE_DATA_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  };

  const value: OfflineContextType = {
    isOnline,
    isPending,
    pendingCount: pendingData.length,
    addOfflineData,
    syncOfflineData,
    clearOfflineData
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Offline Status Banner Component
export const OfflineStatusBanner: FC = () => {
  const { isOnline, isPending, pendingCount, syncOfflineData } = useOfflineMode();
  const [isVisible, setIsVisible] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else {
      // Delay hiding to show success message
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 transition-all ${
        isOnline ? 'bg-green-600' : 'bg-orange-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                Connesso - {pendingCount > 0 ? `Sincronizzazione ${pendingCount} elementi...` : 'Tutti i dati sincronizzati'}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                Modalità Offline - {pendingCount} {pendingCount === 1 ? 'elemento' : 'elementi'} in attesa
              </span>
            </>
          )}
        </div>

        {isOnline && pendingCount > 0 && !isPending && (
          <button
            onClick={() => syncOfflineData()}
            className="px-4 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizza Ora
          </button>
        )}

        {isPending && (
          <div className="flex items-center gap-2 text-white text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sincronizzazione...
          </div>
        )}
      </div>
    </div>
  );
};

// Offline Indicator (for mobile bottom navigation)
export const OfflineIndicator: FC = () => {
  const { isOnline, pendingCount } = useOfflineMode();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${isOnline ? 'bg-orange-500' : 'bg-red-500'} text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium`}>
      {isOnline ? (
        <>
          <Cloud className="w-4 h-4" />
          <span>{pendingCount} da sync</span>
        </>
      ) : (
        <>
          <CloudOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

// Offline Data Manager Component (for settings/debug)
export const OfflineDataManager: FC = () => {
  const { pendingCount, syncOfflineData, clearOfflineData, isOnline, isPending } = useOfflineMode();
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const lastSyncStr = localStorage.getItem(LAST_SYNC_KEY);
    if (lastSyncStr) {
      setLastSync(new Date(lastSyncStr));
    }
  }, [isPending]);

  const handleClear = () => {
    clearOfflineData();
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CloudOff className="w-5 h-5 text-gray-600" />
        Gestione Dati Offline
      </h3>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Stato Connessione</div>
            <div className="text-sm text-gray-600">
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
            {isOnline ? (
              <Wifi className="w-6 h-6 text-green-600" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-600" />
            )}
          </div>
        </div>

        {/* Pending Count */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Dati in Attesa</div>
            <div className="text-sm text-gray-600">
              {pendingCount} {pendingCount === 1 ? 'elemento' : 'elementi'} da sincronizzare
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {pendingCount}
          </div>
        </div>

        {/* Last Sync */}
        {lastSync && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Ultima Sincronizzazione</div>
              <div className="text-sm text-gray-600">
                {lastSync.toLocaleString('it-IT')}
              </div>
            </div>
            <RefreshCw className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => syncOfflineData()}
            disabled={!isOnline || pendingCount === 0 || isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sincronizzazione...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sincronizza Ora
              </>
            )}
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={pendingCount === 0}
            className="px-4 py-3 border-2 border-red-600 text-red-600 rounded-lg font-medium disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-red-50"
          >
            Cancella Tutti
          </button>
        </div>

        {/* Warning */}
        {!isOnline && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <div className="font-medium mb-1">Modalità Offline Attiva</div>
              <div>
                Le modifiche verranno salvate localmente e sincronizzate automaticamente quando la connessione sarà ripristinata.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Conferma Cancellazione
            </h3>
            <p className="text-gray-700 mb-6">
              Sei sicuro di voler cancellare tutti i dati offline non sincronizzati?
              Questa azione non può essere annullata.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Cancella
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for offline-aware API calls
export const useOfflineAPI = () => {
  const { isOnline, addOfflineData } = useOfflineMode();

  const apiCall = async <T,>(
    endpoint: string,
    options: RequestInit = {},
    offlineType?: string
  ): Promise<T | null> => {
    if (!isOnline && offlineType) {
      // Save for later sync
      addOfflineData(offlineType, {
        endpoint,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined
      });
      return null;
    }

    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      if (offlineType) {
        addOfflineData(offlineType, {
          endpoint,
          method: options.method || 'GET',
          body: options.body ? JSON.parse(options.body as string) : undefined
        });
      }
      throw error;
    }
  };

  return { apiCall, isOnline };
};

// ============================================================================
// EJLOG WMS - Workstation Context
// Gestione stato sessione postazione RF
// ============================================================================

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// ============================================================================
// Types
// ============================================================================

export interface Location {
  id: number;
  code: string;
  description: string;
  type: string;
  isTerminal: boolean;
  warehouseId?: number;
  warehouseName?: string;
}

export interface UDC {
  id: number;
  code: string;
  description?: string;
  locationId: number;
  locationCode: string;
}

export interface WorkstationStatus {
  location: Location | null;
  udc: UDC | null;
  isAssociated: boolean;
  lastUpdate: string;
}

interface WorkstationContextType {
  // State
  location: Location | null;
  udc: UDC | null;
  isAssociated: boolean;
  isLoading: boolean;

  // Actions
  associate: (location: Location) => Promise<void>;
  dissociate: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  clearWorkstation: () => void;
}

// ============================================================================
// Context
// ============================================================================

const WorkstationContext = createContext<WorkstationContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface WorkstationProviderProps {
  children: ReactNode;
}

export function WorkstationProvider({ children }: WorkstationProviderProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [udc, setUdc] = useState<UDC | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAssociated = location !== null;

  // ============================================================================
  // Session Storage Management
  // ============================================================================

  const STORAGE_KEY = 'workstation_session';

  const saveToStorage = useCallback((data: WorkstationStatus) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const loadFromStorage = useCallback((): WorkstationStatus | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading workstation from storage:', error);
      return null;
    }
  }, []);

  const clearStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // ============================================================================
  // API Functions
  // ============================================================================

  /**
   * GET /api/workstation/status
   * Recupera stato postazione corrente dal backend
   */
  const fetchWorkstationStatus = useCallback(async (): Promise<WorkstationStatus> => {
    // Check for mock token - skip backend request
    const token = localStorage.getItem('token') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('ejlog_auth_token');

    if (token && token.startsWith('dev-mock-token')) {
      // Return empty status without making API call
      return {
        location: null,
        udc: null,
        isAssociated: false,
        lastUpdate: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch('/api/workstation/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookie
      });

      if (!response.ok) {
        // Silently return empty status for 404 (endpoint not implemented yet)
        // or 500 (proxy error to port 3002 which doesn't have this endpoint)
        if (response.status === 404 || response.status === 500) {
          return {
            location: null,
            udc: null,
            isAssociated: false,
            lastUpdate: new Date().toISOString(),
          };
        }
        throw new Error('Failed to fetch workstation status');
      }

      const data = await response.json();
      return {
        location: data.location || null,
        udc: data.udc || null,
        isAssociated: !!data.location,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      // Silently return empty status on error (avoid console spam)
      return {
        location: null,
        udc: null,
        isAssociated: false,
        lastUpdate: new Date().toISOString(),
      };
    }
  }, []);

  /**
   * POST /api/workstation/associate
   * Associa postazione a una location
   */
  const associateWorkstation = useCallback(async (newLocation: Location): Promise<void> => {
    try {
      const response = await fetch('/api/workstation/associate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          locationId: newLocation.id,
          locationCode: newLocation.code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to associate workstation');
      }

      // Update state
      setLocation(newLocation);
      setUdc(null); // Clear UDC on new association

      // Save to storage
      saveToStorage({
        location: newLocation,
        udc: null,
        isAssociated: true,
        lastUpdate: new Date().toISOString(),
      });

      toast.success(`Postazione associata a ${newLocation.code}`);
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante l\'associazione postazione';
      toast.error(errorMessage);
      throw error;
    }
  }, [saveToStorage]);

  /**
   * POST /api/workstation/dissociate
   * Dissocia postazione dalla location corrente
   */
  const dissociateWorkstation = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/workstation/dissociate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to dissociate workstation');
      }

      // Clear state
      setLocation(null);
      setUdc(null);
      clearStorage();

      toast.success('Postazione dissociata');
    } catch (error: any) {
      const errorMessage = error.message || 'Errore durante la dissociazione postazione';
      toast.error(errorMessage);
      throw error;
    }
  }, [clearStorage]);

  /**
   * Refresh workstation status from backend
   */
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await fetchWorkstationStatus();
      setLocation(status.location);
      setUdc(status.udc);
      saveToStorage(status);
    } catch (error) {
      console.error('Error refreshing workstation status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorkstationStatus, saveToStorage]);

  /**
   * Clear workstation state (client-side only)
   */
  const clearWorkstation = useCallback(() => {
    setLocation(null);
    setUdc(null);
    clearStorage();
  }, [clearStorage]);

  // ============================================================================
  // Initial Load
  // ============================================================================

  useEffect(() => {
    // Check if we have a mock token (development mode bypass)
    const token = localStorage.getItem('token') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('ejlog_auth_token');

    const isMockToken = token && token.startsWith('dev-mock-token');

    if (isMockToken) {
      console.log('[WorkstationContext] Mock token detected - skipping backend requests');
      setIsLoading(false);
      return;
    }

    // Try loading from storage first (faster)
    const stored = loadFromStorage();
    if (stored) {
      setLocation(stored.location);
      setUdc(stored.udc);
    }

    // Then refresh from backend
    refreshStatus();
  }, [loadFromStorage, refreshStatus]);

  // ============================================================================
  // Periodic Refresh (every 30 seconds)
  // ============================================================================

  useEffect(() => {
    // Skip periodic refresh with mock tokens
    const token = localStorage.getItem('token') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('ejlog_auth_token');
    const isMockToken = token && token.startsWith('dev-mock-token');

    if (isMockToken || !isAssociated) return;

    const interval = setInterval(() => {
      refreshStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAssociated, refreshStatus]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: WorkstationContextType = {
    // State
    location,
    udc,
    isAssociated,
    isLoading,

    // Actions
    associate: associateWorkstation,
    dissociate: dissociateWorkstation,
    refreshStatus,
    clearWorkstation,
  };

  return (
    <WorkstationContext.Provider value={value}>
      {children}
    </WorkstationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWorkstationContext() {
  const context = useContext(WorkstationContext);
  if (context === undefined) {
    throw new Error('useWorkstationContext must be used within a WorkstationProvider');
  }
  return context;
}

export default WorkstationContext;

// ============================================================================
// EJLOG WMS - Settings Hooks
// React Query hooks for system configuration and settings
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type {
  Config,
  ConfigFilters,
  CreateConfigRequest,
  UpdateConfigRequest,
  ConfigId,
  HostSettings,
  HostExchangeMode,
  Schedule,
  SystemProperty,
  ConfigHistory,
} from '../types/settings';

const API_BASE = 'http://localhost:3077/api/settings';

// ============================================================================
// Query Keys
// ============================================================================

export const settingsKeys = {
  all: ['settings'] as const,
  configs: () => [...settingsKeys.all, 'configs'] as const,
  config: (filters?: ConfigFilters) => [...settingsKeys.configs(), filters] as const,
  configHistory: (id: ConfigId) => [...settingsKeys.all, 'history', id] as const,
  host: () => [...settingsKeys.all, 'host'] as const,
  schedules: () => [...settingsKeys.all, 'schedules'] as const,
  systemProperties: () => [...settingsKeys.all, 'system-properties'] as const,
};

// ============================================================================
// Config CRUD Hooks
// ============================================================================

/**
 * Fetch all configs with optional filters
 */
export function useConfigs(filters?: ConfigFilters) {
  return useQuery({
    queryKey: settingsKeys.config(filters),
    queryFn: async (): Promise<Config[]> => {
      const params = new URLSearchParams();
      if (filters?.sezione) params.append('sezione', filters.sezione);
      if (filters?.sottosezione) params.append('sottosezione', filters.sottosezione);
      if (filters?.chiave) params.append('chiave', filters.chiave);
      if (filters?.searchText) params.append('search', filters.searchText);

      const response = await fetch(`${API_BASE}/config?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle configurazioni');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch config by sezione
 */
export function useConfigsBySezione(sezione: string) {
  return useQuery({
    queryKey: settingsKeys.config({ sezione }),
    queryFn: async (): Promise<Config[]> => {
      const response = await fetch(`${API_BASE}/config/${sezione}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Errore nel caricamento configurazioni per sezione: ${sezione}`);
      }

      return response.json();
    },
    enabled: !!sezione,
  });
}

/**
 * Fetch config history
 */
export function useConfigHistory(id: ConfigId) {
  return useQuery({
    queryKey: settingsKeys.configHistory(id),
    queryFn: async (): Promise<ConfigHistory[]> => {
      const response = await fetch(
        `${API_BASE}/config/${id.sezione}/${id.sottosezione}/${id.chiave}/history`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Errore nel caricamento storico configurazione');
      }

      return response.json();
    },
    enabled: !!(id.sezione && id.sottosezione && id.chiave),
  });
}

/**
 * Create new config
 */
export function useCreateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConfigRequest): Promise<Config> => {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nella creazione della configurazione');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.configs() });
      toast.success('Configurazione creata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nella creazione della configurazione');
    },
  });
}

/**
 * Update existing config
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateConfigRequest): Promise<Config> => {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nell\'aggiornamento della configurazione');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.configs() });
      toast.success('Configurazione aggiornata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nell\'aggiornamento della configurazione');
    },
  });
}

/**
 * Delete config
 */
export function useDeleteConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: ConfigId): Promise<void> => {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(id),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nell\'eliminazione della configurazione');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.configs() });
      toast.success('Configurazione eliminata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nell\'eliminazione della configurazione');
    },
  });
}

// ============================================================================
// Host Settings Hooks
// ============================================================================

/**
 * Fetch host settings (exchange mode)
 */
export function useHostSettings() {
  return useQuery({
    queryKey: settingsKeys.host(),
    queryFn: async (): Promise<HostSettings> => {
      const response = await fetch(`${API_BASE}/host/exchange-mode`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento impostazioni Host');
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Update host exchange mode
 */
export function useUpdateHostExchangeMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: HostExchangeMode): Promise<HostSettings> => {
      const response = await fetch(`${API_BASE}/host/exchange-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nel cambio modalità scambio Host');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.host() });
      toast.success('Modalità scambio Host aggiornata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nel cambio modalità scambio Host');
    },
  });
}

/**
 * Fetch schedules
 */
export function useSchedules() {
  return useQuery({
    queryKey: settingsKeys.schedules(),
    queryFn: async (): Promise<Schedule[]> => {
      const response = await fetch(`${API_BASE}/host/schedules`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento schedulazioni');
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Update schedule
 */
export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: Schedule): Promise<Schedule> => {
      const response = await fetch(`${API_BASE}/host/schedules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nell\'aggiornamento schedulazione');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.schedules() });
      toast.success('Schedulazione aggiornata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nell\'aggiornamento schedulazione');
    },
  });
}

// ============================================================================
// System Properties Hooks
// ============================================================================

/**
 * Fetch system properties
 */
export function useSystemProperties() {
  return useQuery({
    queryKey: settingsKeys.systemProperties(),
    queryFn: async (): Promise<SystemProperty[]> => {
      const response = await fetch(`${API_BASE}/system/properties`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento proprietà di sistema');
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Update system property
 */
export function useUpdateSystemProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (property: SystemProperty): Promise<SystemProperty> => {
      const response = await fetch(`${API_BASE}/system/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(property),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nell\'aggiornamento proprietà di sistema');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.systemProperties() });
      toast.success('Proprietà di sistema aggiornata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nell\'aggiornamento proprietà di sistema');
    },
  });
}

// ============================================================================
// Composite Hook - All Settings Management
// ============================================================================

/**
 * Composite hook for managing all settings operations
 */
export function useSettingsManagement(filters?: ConfigFilters) {
  const configs = useConfigs(filters);
  const createConfig = useCreateConfig();
  const updateConfig = useUpdateConfig();
  const deleteConfig = useDeleteConfig();

  return {
    // Config data
    configs: configs.data ?? [],
    isLoadingConfigs: configs.isLoading,
    isErrorConfigs: configs.isError,
    errorConfigs: configs.error,

    // Config mutations
    createConfig: createConfig.mutate,
    updateConfig: updateConfig.mutate,
    deleteConfig: deleteConfig.mutate,
    isCreating: createConfig.isPending,
    isUpdating: updateConfig.isPending,
    isDeleting: deleteConfig.isPending,

    // Refresh
    refetchConfigs: configs.refetch,
  };
}


// ============================================================================
// EJLOG WMS - Integrations API Service
// Backend: /api/integrations
// ============================================================================

export type IntegrationKey = 'sap' | 'erp' | 'edi' | 'mes' | 'tms' | 'ecommerce';

export interface IntegrationResponse<T = any> {
  success: boolean;
  data: {
    key: IntegrationKey | string;
    enabled: boolean;
    config: T;
    updatedAt?: string | null;
    updatedBy?: string | null;
  };
  error?: string;
}

export interface IntegrationListResponse {
  success: boolean;
  data: Array<{
    key: IntegrationKey | string;
    enabled: boolean;
    updatedAt?: string | null;
    updatedBy?: string | null;
  }>;
  error?: string;
}

const API_BASE = '/api/integrations';

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || data?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
};

export const integrationsApi = {
  getIntegration: async <T = any>(key: IntegrationKey): Promise<IntegrationResponse<T>> => {
    const response = await fetch(`${API_BASE}/${key}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  saveIntegration: async <T = any>(
    key: IntegrationKey,
    payload: { enabled: boolean; config: T }
  ): Promise<IntegrationResponse<T>> => {
    const response = await fetch(`${API_BASE}/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  listIntegrations: async (): Promise<IntegrationListResponse> => {
    const response = await fetch(`${API_BASE}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  getIntegrationsStatus: async (): Promise<{ success: boolean; data: any[]; error?: string }> => {
    const response = await fetch(`${API_BASE}/status`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  getIntegrationLogs: async (
    params?: { key?: IntegrationKey | string; limit?: number; offset?: number }
  ): Promise<{ success: boolean; data: any[]; error?: string }> => {
    const search = new URLSearchParams();
    if (params?.key) search.set('key', params.key);
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString();
    const response = await fetch(`${API_BASE}/logs${qs ? `?${qs}` : ''}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  runIntegrationSync: async (
    key: IntegrationKey,
    payload?: { direction?: string; flows?: string[] }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(response);
  },

  previewIntegration: async (
    key: IntegrationKey,
    payload?: { flow?: string; limit?: number }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(response);
  },

  exportEdi: async (
    key: IntegrationKey,
    payload?: { flow?: string; limit?: number; messageType?: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/edi/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(response);
  },

  sendEdi: async (
    key: IntegrationKey,
    payload?: { flow?: string; limit?: number; messageType?: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/edi/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(response);
  },

  importEdi: async (
    key: IntegrationKey,
    payload: { flow?: string; content: string; messageType?: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/edi/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  validateOdata: async (
    key: IntegrationKey
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/odata/validate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  suggestOdata: async (
    key: IntegrationKey
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/odata/suggest`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  getEdiInbox: async (
    key: IntegrationKey,
    params?: { limit?: number; offset?: number }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString();
    const response = await fetch(`${API_BASE}/${key}/edi/inbox${qs ? `?${qs}` : ''}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  getEdiInboxItem: async (
    key: IntegrationKey,
    id: number
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/edi/inbox/${id}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  updateEdiInboxConfig: async (
    key: IntegrationKey,
    id: number,
    payload: { overrideTipoLista?: number | null; overrideAreaId?: number | null; overrideMachineId?: number | null }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/edi/inbox/${id}/config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  applyEdiInbox: async (
    key: IntegrationKey,
    inboxId: number,
    appliedBy?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/edi/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ inboxId, appliedBy }),
    });
    return handleResponse(response);
  },

  getEdiApplyErrors: async (
    key: IntegrationKey,
    params: { inboxId: number; limit?: number; offset?: number; reason?: string; itemCode?: string; orderNumber?: string }
  ): Promise<{ success: boolean; data?: any; total?: number; error?: string }> => {
    const search = new URLSearchParams();
    search.set('inboxId', String(params.inboxId));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.offset) search.set('offset', String(params.offset));
    if (params.reason) search.set('reason', params.reason);
    if (params.itemCode) search.set('itemCode', params.itemCode);
    if (params.orderNumber) search.set('orderNumber', params.orderNumber);
    const response = await fetch(`${API_BASE}/${key}/edi/apply-errors?${search.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  getItemMappings: async (
    key: IntegrationKey,
    params?: { limit?: number; offset?: number; search?: string }
  ): Promise<{ success: boolean; data?: any; total?: number; error?: string }> => {
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    if (params?.search) search.set('search', params.search);
    const qs = search.toString();
    const response = await fetch(`${API_BASE}/${key}/item-mappings${qs ? `?${qs}` : ''}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  suggestItemMappings: async (
    key: IntegrationKey,
    params: { search: string; limit?: number }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const search = new URLSearchParams();
    search.set('search', params.search);
    if (params.limit) search.set('limit', String(params.limit));
    const response = await fetch(`${API_BASE}/${key}/item-mappings/suggest?${search.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  suggestItemMappingsFromErrors: async (
    key: IntegrationKey,
    params: { inboxId: number; limit?: number }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const search = new URLSearchParams();
    search.set('inboxId', String(params.inboxId));
    if (params.limit) search.set('limit', String(params.limit));
    const response = await fetch(`${API_BASE}/${key}/item-mappings/suggest-errors?${search.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  saveItemMapping: async (
    key: IntegrationKey,
    payload: { externalCode: string; itemId?: number | null; itemCode?: string | null; description?: string | null }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/item-mappings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteItemMapping: async (
    key: IntegrationKey,
    id: number
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/item-mappings/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(response);
  },

  testIntegration: async <T = any>(
    key: IntegrationKey,
    payload: { enabled: boolean; config: T }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await fetch(`${API_BASE}/${key}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};

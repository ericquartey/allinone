/**
 * Scheduler API Client
 * Provides methods to interact with the scheduler backend
 */

import type {
  Schedulazione,
  SchedulerStatus,
  SchedulerSummary,
  CreateSchedulazioneRequest,
  UpdateSchedulazioneRequest,
  JobType,
  JobConfigurationParam,
  JobProgress,
  SchedulerConfig,
  HistoricalDataPolicy,
  HostSchedulazione,
  SchedulerParamProfile,
  ApiResponse,
  SchedulerActionResponse,
} from '../types/scheduler';

// ============================================================================
// BASE API CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3077';
const API_PREFIX = '/api';

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// SCHEDULER STATUS & OVERVIEW
// ============================================================================

/**
 * Get complete scheduler status
 * Endpoint: GET /api/scheduler-status
 */
export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  return apiRequest<SchedulerStatus>('/scheduler-status');
}

/**
 * Get scheduler summary (stats only)
 * Endpoint: GET /api/scheduler-summary
 */
export async function getSchedulerSummary(): Promise<SchedulerSummary> {
  return apiRequest<SchedulerSummary>('/scheduler-summary');
}

/**
 * Get scheduler configuration
 * Endpoint: GET /api/scheduler-config
 */
export async function getSchedulerConfig(): Promise<SchedulerConfig> {
  return apiRequest<SchedulerConfig>('/scheduler-config');
}

// ============================================================================
// SCHEDULAZIONE CRUD OPERATIONS
// ============================================================================

/**
 * Get all schedulazioni
 * Endpoint: GET /api/scheduler
 * Query params: ?schedulerId=MAIN_SCHED&showAll=true
 */
export async function getAllSchedulazioni(params?: {
  schedulerId?: string;
  showAll?: boolean;
  gruppo?: string;
}): Promise<Schedulazione[]> {
  const queryParams = new URLSearchParams();

  if (params?.schedulerId) {
    queryParams.append('schedulerId', params.schedulerId);
  }
  if (params?.showAll !== undefined) {
    queryParams.append('showAll', params.showAll.toString());
  }
  if (params?.gruppo) {
    queryParams.append('gruppo', params.gruppo);
  }

  const query = queryParams.toString();
  const endpoint = query ? `/scheduler?${query}` : '/scheduler';

  return apiRequest<Schedulazione[]>(endpoint);
}

/**
 * Get single schedulazione by ID
 * Endpoint: GET /api/scheduler/:id
 */
export async function getSchedulazione(id: number): Promise<Schedulazione> {
  return apiRequest<Schedulazione>(`/scheduler/${id}`);
}

/**
 * Create new schedulazione
 * Endpoint: POST /api/scheduler
 */
export async function createSchedulazione(
  data: CreateSchedulazioneRequest
): Promise<Schedulazione> {
  return apiRequest<Schedulazione>('/scheduler', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update existing schedulazione
 * Endpoint: PATCH /api/scheduler/:id
 */
export async function updateSchedulazione(
  id: number,
  data: UpdateSchedulazioneRequest
): Promise<Schedulazione> {
  return apiRequest<Schedulazione>(`/scheduler/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete schedulazione
 * Endpoint: DELETE /api/scheduler/:id
 */
export async function deleteSchedulazione(id: number): Promise<void> {
  return apiRequest<void>(`/scheduler/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// SCHEDULER ACTIONS
// ============================================================================

/**
 * Execute job immediately (one-shot)
 * Endpoint: POST /api/scheduler/:id/execute
 * @param forceIfStopped - Execute even if job is stopped (requires confirmation)
 */
export async function executeNow(
  id: number,
  forceIfStopped = false
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify({ forceIfStopped }),
  });
}

/**
 * Execute job after delay
 * Endpoint: POST /api/scheduler/:id/execute-delayed
 * @param delay - Delay in milliseconds
 */
export async function executeAfterDelay(
  id: number,
  delay: number
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/execute-delayed`, {
    method: 'POST',
    body: JSON.stringify({ delay }),
  });
}

/**
 * Enable schedulazione (for automatic execution)
 * Endpoint: POST /api/scheduler/:id/enable
 */
export async function enableSchedulazione(
  id: number
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/enable`, {
    method: 'POST',
  });
}

/**
 * Disable schedulazione (stop automatic execution)
 * Endpoint: POST /api/scheduler/:id/disable
 */
export async function disableSchedulazione(
  id: number
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/disable`, {
    method: 'POST',
  });
}

/**
 * Interrupt running job (if interruptible)
 * Endpoint: POST /api/scheduler/:id/interrupt
 */
export async function interruptSchedulazione(
  id: number
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/interrupt`, {
    method: 'POST',
  });
}

/**
 * Clear error message
 * Endpoint: POST /api/scheduler/:id/clear-error
 */
export async function clearErrorMessage(
  id: number
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/clear-error`, {
    method: 'POST',
  });
}

/**
 * Restore job (delete and re-enable)
 * Endpoint: POST /api/scheduler/:id/restore
 */
export async function restoreJob(
  id: number
): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>(`/scheduler/${id}/restore`, {
    method: 'POST',
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Enable multiple schedulazioni
 * Endpoint: POST /api/scheduler/batch/enable
 */
export async function enableMultipleSchedulazioni(
  ids: number[]
): Promise<SchedulerActionResponse[]> {
  return apiRequest<SchedulerActionResponse[]>('/scheduler/batch/enable', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * Disable multiple schedulazioni
 * Endpoint: POST /api/scheduler/batch/disable
 */
export async function disableMultipleSchedulazioni(
  ids: number[]
): Promise<SchedulerActionResponse[]> {
  return apiRequest<SchedulerActionResponse[]>('/scheduler/batch/disable', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * Clear error messages for multiple schedulazioni
 * Endpoint: POST /api/scheduler/batch/clear-errors
 */
export async function clearMultipleErrors(
  ids: number[]
): Promise<SchedulerActionResponse[]> {
  return apiRequest<SchedulerActionResponse[]>('/scheduler/batch/clear-errors', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ============================================================================
// JOB PROGRESS & MONITORING
// ============================================================================

/**
 * Get job execution progress
 * Endpoint: GET /api/scheduler/:id/progress
 */
export async function getJobProgress(id: number): Promise<JobProgress | null> {
  try {
    return await apiRequest<JobProgress>(`/scheduler/${id}/progress`);
  } catch (error) {
    // Return null if job is not running
    return null;
  }
}

/**
 * Get progress for all running jobs
 * Endpoint: GET /api/scheduler/progress
 */
export async function getAllJobProgress(): Promise<JobProgress[]> {
  return apiRequest<JobProgress[]>('/scheduler/progress');
}

// ============================================================================
// JOB TYPES & CONFIGURATION
// ============================================================================

/**
 * Get all available job types
 * Endpoint: GET /api/scheduler/job-types
 */
export async function getAvailableJobTypes(): Promise<JobType[]> {
  return apiRequest<JobType[]>('/scheduler/job-types');
}

/**
 * Get job types by group
 * Endpoint: GET /api/scheduler/job-types?group=System
 */
export async function getJobTypesByGroup(group: string): Promise<JobType[]> {
  return apiRequest<JobType[]>(`/scheduler/job-types?group=${encodeURIComponent(group)}`);
}

/**
 * Get job configuration parameters
 * Endpoint: GET /api/scheduler/configuration/:jobClass
 */
export async function getJobConfiguration(
  jobClass: string
): Promise<JobConfigurationParam[]> {
  return apiRequest<JobConfigurationParam[]>(
    `/scheduler/configuration/${encodeURIComponent(jobClass)}`
  );
}

/**
 * Validate job configuration
 * Endpoint: POST /api/scheduler/configuration/validate
 */
export async function validateJobConfiguration(
  jobClass: string,
  params: Record<string, string>
): Promise<ApiResponse<boolean>> {
  return apiRequest<ApiResponse<boolean>>('/scheduler/configuration/validate', {
    method: 'POST',
    body: JSON.stringify({ jobClass, params }),
  });
}

// ============================================================================
// ADVANCED OPERATIONS
// ============================================================================

/**
 * Get historical data policies
 * Endpoint: GET /api/scheduler/historical-policies
 */
export async function getHistoricalPolicies(): Promise<HistoricalDataPolicy[]> {
  return apiRequest<HistoricalDataPolicy[]>('/scheduler/historical-policies');
}

/**
 * Update historical data policy
 * Endpoint: PATCH /api/scheduler/historical-policies/:tableName
 */
export async function updateHistoricalPolicy(
  tableName: string,
  policy: Partial<HistoricalDataPolicy>
): Promise<HistoricalDataPolicy> {
  return apiRequest<HistoricalDataPolicy>(
    `/scheduler/historical-policies/${encodeURIComponent(tableName)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(policy),
    }
  );
}

/**
 * Get HOST-linked schedulazioni
 * Endpoint: GET /api/scheduler/host
 */
export async function getHostSchedulazioni(): Promise<HostSchedulazione[]> {
  return apiRequest<HostSchedulazione[]>('/scheduler/host');
}

/**
 * Restore default jobs
 * Endpoint: POST /api/scheduler/restore-defaults
 * Creates default jobs if they don't exist:
 * - CalcoloValoriRiepilogativiJob
 * - StoricizzaValoriRiepilogativiJob
 * - TableCleaner
 */
export async function restoreDefaultJobs(): Promise<SchedulerActionResponse> {
  return apiRequest<SchedulerActionResponse>('/scheduler/restore-defaults', {
    method: 'POST',
  });
}

// ============================================================================
// SCHEDULER IDS
// ============================================================================

/**
 * Get all scheduler IDs
 * Endpoint: GET /api/scheduler/scheduler-ids
 */
export async function getSchedulerIds(): Promise<string[]> {
  return apiRequest<string[]>('/scheduler/scheduler-ids');
}

/**
 * Get scheduler parameter profiles
 * Endpoint: GET /api/scheduler/profiles
 */
export async function getSchedulerParamProfiles(): Promise<SchedulerParamProfile[]> {
  return apiRequest<SchedulerParamProfile[]>('/scheduler/profiles');
}

/**
 * Create or update scheduler parameter profile
 * Endpoint: POST /api/scheduler/profiles
 */
export async function upsertSchedulerParamProfile(
  profile: Pick<SchedulerParamProfile, 'name' | 'params'>
): Promise<SchedulerParamProfile> {
  return apiRequest<SchedulerParamProfile>('/scheduler/profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Search schedulazioni
 * Endpoint: GET /api/scheduler/search?q=query
 */
export async function searchSchedulazioni(query: string): Promise<Schedulazione[]> {
  return apiRequest<Schedulazione[]>(
    `/scheduler/search?q=${encodeURIComponent(query)}`
  );
}

/**
 * Get schedulazioni by status
 * Endpoint: GET /api/scheduler/by-status/:status
 */
export async function getSchedulazioniByStatus(
  status: 'running' | 'stopped' | 'error' | 'modified'
): Promise<Schedulazione[]> {
  return apiRequest<Schedulazione[]>(`/scheduler/by-status/${status}`);
}

// ============================================================================
// WEBSOCKET CONNECTION (for real-time updates)
// ============================================================================

/**
 * Connect to scheduler WebSocket for real-time updates
 * WebSocket URL: ws://localhost:3077/ws/scheduler
 */
export function connectSchedulerWebSocket(
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/scheduler`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Scheduler WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('Scheduler WebSocket error:', error);
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = () => {
    console.log('Scheduler WebSocket closed');
  };

  return ws;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse API error to user-friendly message
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Check if scheduler is available
 * Endpoint: GET /api/scheduler/health
 */
export async function checkSchedulerHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    return await apiRequest<{ healthy: boolean; message: string }>('/scheduler/health');
  } catch (error) {
    return {
      healthy: false,
      message: parseApiError(error),
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Status & Overview
  getSchedulerStatus,
  getSchedulerSummary,
  getSchedulerConfig,

  // CRUD
  getAllSchedulazioni,
  getSchedulazione,
  createSchedulazione,
  updateSchedulazione,
  deleteSchedulazione,

  // Actions
  executeNow,
  executeAfterDelay,
  enableSchedulazione,
  disableSchedulazione,
  interruptSchedulazione,
  clearErrorMessage,
  restoreJob,

  // Batch Operations
  enableMultipleSchedulazioni,
  disableMultipleSchedulazioni,
  clearMultipleErrors,

  // Progress & Monitoring
  getJobProgress,
  getAllJobProgress,

  // Job Types & Configuration
  getAvailableJobTypes,
  getJobTypesByGroup,
  getJobConfiguration,
  validateJobConfiguration,

  // Advanced
  getHistoricalPolicies,
  updateHistoricalPolicy,
  getHostSchedulazioni,
  restoreDefaultJobs,

  // Scheduler IDs
  getSchedulerIds,
  getSchedulerParamProfiles,
  upsertSchedulerParamProfile,

  // Search & Filter
  searchSchedulazioni,
  getSchedulazioniByStatus,

  // WebSocket
  connectSchedulerWebSocket,

  // Utilities
  parseApiError,
  checkSchedulerHealth,
};


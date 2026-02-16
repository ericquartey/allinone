/**
 * TypeScript Types for EjLog Scheduler Module
 * Ported from Java Swing Application
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum SchedulerSecurityLevel {
  ALL = 'ALL',
  SUPERUSER = 'SUPERUSER',
  ADMIN = 'ADMIN',
}

export enum JobScheduleType {
  CRON = 'CRON',
  INTERVAL = 'INTERVAL',
}

export enum JobStatus {
  DISABLED = 'DISABLED',           // stopped=true OR abilitata=false
  ENABLED = 'ENABLED',             // stopped=false AND abilitata=true, scheduled
  EXECUTING = 'EXECUTING',         // Currently running
  COMPLETED = 'COMPLETED',         // Finished execution
  ERROR = 'ERROR',                 // Has error message
  MODIFIED = 'MODIFIED',           // Modified, needs restart
}

export enum SchedulazioneFunzioneEnum {
  TABLE_CLEANING = 'TABLE_CLEANING',
  BATCH_EXECUTOR = 'BATCH_EXECUTOR',
  SQL_EXECUTOR = 'SQL_EXECUTOR',
  EXPORT_LOGS = 'EXPORT_LOGS',
  CHANGE_LOCATION_STATUS = 'CHANGE_LOCATION_STATUS',
  MANAGE_UDC = 'MANAGE_UDC',
  CLEAN_HOST_DATA = 'CLEAN_HOST_DATA',
  SYSTEM_REBOOT = 'SYSTEM_REBOOT',
  CUSTOM_REPORT = 'CUSTOM_REPORT',
  CLEAN_PTL_UDC = 'CLEAN_PTL_UDC',
}

// ============================================================================
// MAIN ENTITIES
// ============================================================================

/**
 * Schedulazione Entity
 * Maps to: PROMAG.dbo.Schedulazione table
 */
export interface Schedulazione {
  id: number;
  nome: string;                          // Job name (unique)
  descrizione: string;                   // Description
  gruppo: string | null;                 // Job group (e.g., "HOST", "SYSTEM")
  classe: string;                        // Fully qualified job class name
  idSchedulatore: string;                // Scheduler ID (e.g., "MAIN_SCHED")
  funzione: string | null;               // Function enum ID
  parametri: string | null;              // Key=Value parameters (semicolon separated)
  cronExpression: string | null;         // Quartz cron expression
  intervallo: number | null;             // Interval in milliseconds
  ripetizioni: number | null;            // Number of repetitions (null = infinite)
  messaggioErrore: string | null;        // Last error message
  stopped: boolean;                      // Manual stop flag
  abilitata: boolean;                    // Enabled flag
  modificata: boolean;                   // Modified flag (needs restart)

  // Computed fields (not in DB)
  isRunning?: boolean;                   // Is currently scheduled
  isExecuting?: boolean;                 // Is currently executing
  progress?: number;                     // Execution progress (0-100)
  progressMessage?: string;              // Progress message
  interruptible?: boolean;               // Can be interrupted
  configurable?: boolean;                // Has configuration panel

  // Timestamps (optional)
  createdAt?: string;
  updatedAt?: string;
  lastExecutedAt?: string | null;
  nextExecutionAt?: string | null;
}

/**
 * Scheduler Status Summary
 * Used for dashboard cards
 */
export interface SchedulerSummary {
  total: number;                         // Total schedulazioni
  active: number;                        // Active (enabled and scheduled)
  running: number;                       // Currently executing
  errors: number;                        // With error messages
  stopped: number;                       // Manually stopped
  modified: number;                      // Modified, needs restart
  prenotazioni: {
    totalPrenotazioni: number;
    abilitate: number;
    nonAbilitate: number;
  };
}

/**
 * Complete Scheduler Status
 * Response from /api/scheduler-status
 */
export interface SchedulerStatus {
  success: boolean;
  schedulerExists: boolean;              // Scheduler module is running
  running: boolean;                      // Scheduler is active
  prenotatoreEnabled: boolean;           // Prenotatore feature enabled
  schedulerIds: string[];                // Available scheduler IDs
  schedulazioni: Schedulazione[];        // All schedulazioni
  summary: SchedulerSummary;
}

// ============================================================================
// JOB CONFIGURATION
// ============================================================================

/**
 * Job Configuration Parameter
 * Used in job-specific configuration panels
 */
export interface JobConfigurationParam {
  key: string;                           // Parameter key
  value: string;                         // Parameter value
  type: 'string' | 'number' | 'boolean' | 'file' | 'date' | 'select';
  required: boolean;                     // Is required
  description: string;                   // User-friendly description
  options?: string[];                    // For select type
  placeholder?: string;                  // Input placeholder
  validation?: {
    min?: number;                        // For number type
    max?: number;                        // For number type
    pattern?: string;                    // Regex pattern
    message?: string;                    // Validation error message
  };
}

/**
 * Job Type Information
 * Available job classes
 */
export interface JobType {
  className: string;                     // Fully qualified class name
  name: string;                          // Display name
  description: string;                   // Description
  group: string;                         // Group (e.g., "System", "Export", "Maintenance")
  configurable: boolean;                 // Has configuration panel
  interruptible: boolean;                // Can be interrupted
  requiresHost: boolean;                 // Requires HOST link
  defaultScheduler: string;              // Default scheduler ID
  icon?: string;                         // Icon name/path
}

/**
 * Parsed Job Parameters
 * Helper for working with semicolon-separated key=value pairs
 */
export interface SchedulazioneParams {
  [key: string]: string;
}

// ============================================================================
// SCHEDULER ACTIONS
// ============================================================================

/**
 * Scheduler Action Request
 */
export interface SchedulerActionRequest {
  schedulazioneId: number;
  action: SchedulerAction;
  params?: Record<string, any>;
}

export enum SchedulerAction {
  EXECUTE_NOW = 'EXECUTE_NOW',
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
  INTERRUPT = 'INTERRUPT',
  CLEAR_ERROR = 'CLEAR_ERROR',
  RESTORE = 'RESTORE',
}

/**
 * Scheduler Action Response
 */
export interface SchedulerActionResponse {
  success: boolean;
  message: string;
  schedulazione?: Schedulazione;
  error?: string;
}

// ============================================================================
// FORM DATA
// ============================================================================

/**
 * Create Schedulazione Form Data
 */
export interface CreateSchedulazioneRequest {
  nome: string;
  descrizione?: string;
  gruppo?: string;
  classe: string;
  idSchedulatore: string;
  funzione?: string;
  parametri?: string;
  cronExpression?: string;
  intervallo?: number;
  ripetizioni?: number;
  stopped?: boolean;
  abilitata?: boolean;
}

/**
 * Update Schedulazione Form Data
 */
export interface UpdateSchedulazioneRequest {
  nome?: string;
  descrizione?: string;
  gruppo?: string;
  classe?: string;
  idSchedulatore?: string;
  funzione?: string;
  parametri?: string;
  cronExpression?: string;
  intervallo?: number;
  ripetizioni?: number;
  stopped?: boolean;
  abilitata?: boolean;
  messaggioErrore?: string | null;
  modificata?: boolean;
}

// ============================================================================
// JOB PROGRESS
// ============================================================================

/**
 * Job Execution Progress
 * Real-time progress updates
 */
export interface JobProgress {
  schedulazioneId: number;
  nome: string;
  progress: number;                      // 0-100
  message: string;                       // Progress message
  startedAt: string;                     // ISO timestamp
  estimatedCompletion?: string;          // ISO timestamp
}

// ============================================================================
// SCHEDULER CONFIGURATION
// ============================================================================

/**
 * Scheduler Module Configuration
 */
export interface SchedulerConfig {
  schedulerIds: string[];                // Managed scheduler IDs
  defaultSchedulerId: string;            // Default scheduler ID
  checkStatusInterval: number;           // Check status interval (ms)
  enablePrenotatore: boolean;            // Enable prenotatore feature
  flagNoHost: boolean;                   // Disable HOST-linked jobs
  properties: {
    [key: string]: string;
  };
}

// ============================================================================
// PARAMETER PROFILES
// ============================================================================

export interface SchedulerParamProfile {
  id: string;
  name: string;
  params: string;
}

// ============================================================================
// HISTORICAL DATA
// ============================================================================

/**
 * Historical Data Retention Policy
 */
export interface HistoricalDataPolicy {
  tableName: string;
  retentionDays: number;
  archiveEnabled: boolean;
  archivePath?: string;
  cleanupSchedule: string;               // Cron expression
}

// ============================================================================
// HOST SCHEDULERS
// ============================================================================

/**
 * HOST-linked Scheduler
 */
export interface HostSchedulazione extends Schedulazione {
  hostId: string;
  hostName: string;
  hostStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

// ============================================================================
// UI STATE
// ============================================================================

/**
 * Scheduler Management UI State
 */
export interface SchedulerManagementState {
  selectedRows: Schedulazione[];
  showAllSchedulers: boolean;
  autoRefresh: boolean;
  refreshInterval: number;               // milliseconds
  filterSchedulerId: string | null;
  filterStatus: JobStatus | null;
  searchQuery: string;
  sortBy: keyof Schedulazione;
  sortOrder: 'asc' | 'desc';
}

/**
 * Modal State
 */
export interface SchedulerModalState {
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isConfigureModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isHistoryModalOpen: boolean;
  isHostModalOpen: boolean;
  selectedSchedulazione: Schedulazione | null;
}

// ============================================================================
// COLOR CODING
// ============================================================================

/**
 * Row Color Configuration
 * Visual status indicators
 */
export interface RowColorConfig {
  backgroundColor: string;
  textColor: string;
  description: string;
  priority: number;                      // Higher priority wins
}

export const ROW_COLORS: Record<string, RowColorConfig> = {
  RUNNING_WITH_ERRORS: {
    backgroundColor: 'bg-red-500',
    textColor: 'text-yellow-300',
    description: 'Running with errors',
    priority: 1,
  },
  EXECUTING: {
    backgroundColor: 'bg-purple-500',
    textColor: 'text-yellow-300',
    description: 'Currently executing',
    priority: 2,
  },
  HAS_ERROR: {
    backgroundColor: 'bg-yellow-400',
    textColor: 'text-red-700',
    description: 'Has error message',
    priority: 3,
  },
  ENABLED: {
    backgroundColor: 'bg-green-500',
    textColor: 'text-blue-900',
    description: 'Enabled and scheduled',
    priority: 4,
  },
  STOPPED: {
    backgroundColor: 'bg-orange-500',
    textColor: 'text-red-700',
    description: 'Stopped/disabled',
    priority: 5,
  },
  MODIFIED: {
    backgroundColor: 'bg-green-600',
    textColor: 'text-black',
    description: 'Modified, needs restart',
    priority: 6,
  },
  DEFAULT: {
    backgroundColor: 'bg-gray-800',
    textColor: 'text-white',
    description: 'Default state',
    priority: 7,
  },
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Sort Params
 */
export interface SortParams {
  field: keyof Schedulazione;
  order: 'asc' | 'desc';
}

/**
 * Filter Params
 */
export interface FilterParams {
  schedulerId?: string;
  status?: JobStatus;
  gruppo?: string;
  search?: string;
  hasErrors?: boolean;
  isRunning?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS (Type Guards)
// ============================================================================

export function isSchedulazioneExecuting(s: Schedulazione): boolean {
  return s.isExecuting === true;
}

export function isSchedulazioneRunning(s: Schedulazione): boolean {
  return s.isRunning === true;
}

export function isSchedulazioneStopped(s: Schedulazione): boolean {
  return s.stopped === true;
}

export function isSchedulazioneEnabled(s: Schedulazione): boolean {
  return s.abilitata === true && !s.stopped;
}

export function hasSchedulazioneError(s: Schedulazione): boolean {
  return s.messaggioErrore !== null && s.messaggioErrore !== undefined && s.messaggioErrore !== '';
}

export function isSchedulazioneModified(s: Schedulazione): boolean {
  return s.modificata === true;
}

export function canExecuteNow(s: Schedulazione): boolean {
  return isSchedulazioneEnabled(s);
}

export function canEnable(s: Schedulazione): boolean {
  return isSchedulazioneStopped(s) && s.abilitata === true;
}

export function canDisable(s: Schedulazione): boolean {
  return !isSchedulazioneStopped(s) && isSchedulazioneEnabled(s);
}

export function canInterrupt(s: Schedulazione): boolean {
  return isSchedulazioneExecuting(s) && s.interruptible === true;
}

export function canEdit(s: Schedulazione): boolean {
  return isSchedulazioneStopped(s) || !isSchedulazioneEnabled(s);
}

export function canDelete(s: Schedulazione): boolean {
  return isSchedulazioneStopped(s) || !isSchedulazioneEnabled(s);
}

export function canConfigure(s: Schedulazione): boolean {
  return s.configurable === true;
}

// ============================================================================
// PARAMETER PARSING UTILITIES
// ============================================================================

/**
 * Parse semicolon-separated parameters
 * Format: "key1=value1;key2=value2"
 */
export function parseSchedulazioneParams(parametri: string | null): SchedulazioneParams {
  if (!parametri) return {};

  return parametri.split(';').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as SchedulazioneParams);
}

/**
 * Serialize parameters to string
 * Format: "key1=value1;key2=value2"
 */
export function serializeSchedulazioneParams(params: SchedulazioneParams): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
}

/**
 * Get row color based on schedulazione state
 */
export function getSchedulazioneRowColor(s: Schedulazione): RowColorConfig {
  // Priority order: higher numbers checked first
  if (isSchedulazioneRunning(s) && hasSchedulazioneError(s)) {
    return ROW_COLORS.RUNNING_WITH_ERRORS;
  }
  if (isSchedulazioneExecuting(s)) {
    return ROW_COLORS.EXECUTING;
  }
  if (hasSchedulazioneError(s)) {
    return ROW_COLORS.HAS_ERROR;
  }
  if (isSchedulazioneEnabled(s)) {
    return ROW_COLORS.ENABLED;
  }
  if (isSchedulazioneStopped(s)) {
    return ROW_COLORS.STOPPED;
  }
  if (isSchedulazioneModified(s)) {
    return ROW_COLORS.MODIFIED;
  }
  return ROW_COLORS.DEFAULT;
}

/**
 * Format cron expression to human-readable text
 */
export function formatCronExpression(cron: string | null): string {
  if (!cron) return 'N/A';

  // Simple formatting (can be enhanced with cronstrue library)
  const parts = cron.split(' ');
  if (parts.length !== 6) return cron;

  const [sec, min, hour, day, month, weekday] = parts;

  if (cron === '0 0 * * * ?') return 'Every hour';
  if (cron === '0 */15 * * * ?') return 'Every 15 minutes';
  if (cron === '0 0 0 * * ?') return 'Every day at midnight';
  if (cron === '0 0 2 * * ?') return 'Every day at 2 AM';
  if (cron === '0 0 0 ? * MON') return 'Every Monday at midnight';

  return cron;
}

/**
 * Format interval to human-readable text
 */
export function formatIntervallo(intervallo: number | null, ripetizioni: number | null): string {
  if (!intervallo) return 'N/A';

  const seconds = intervallo / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  let timeStr = '';
  if (hours >= 1) {
    timeStr = `${hours.toFixed(1)} hours`;
  } else if (minutes >= 1) {
    timeStr = `${minutes.toFixed(0)} minutes`;
  } else {
    timeStr = `${seconds} seconds`;
  }

  const repetitionsStr = ripetizioni === null ? '∞' : `${ripetizioni}x`;

  return `${timeStr} (${repetitionsStr})`;
}

/**
 * Get job status enum from schedulazione
 */
export function getJobStatus(s: Schedulazione): JobStatus {
  if (isSchedulazioneExecuting(s)) return JobStatus.EXECUTING;
  if (hasSchedulazioneError(s)) return JobStatus.ERROR;
  if (isSchedulazioneModified(s)) return JobStatus.MODIFIED;
  if (isSchedulazioneEnabled(s)) return JobStatus.ENABLED;
  return JobStatus.DISABLED;
}

/**
 * Get schedule type from schedulazione
 */
export function getScheduleType(s: Schedulazione): JobScheduleType {
  return s.cronExpression ? JobScheduleType.CRON : JobScheduleType.INTERVAL;
}

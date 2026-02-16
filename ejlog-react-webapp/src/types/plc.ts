/**
 * PLC Controller Module - TypeScript Type Definitions
 *
 * Types for PLC devices, commands, databuffer, and signal management
 */

// ============================================
// PLC Device Types
// ============================================

export type PLCDeviceType =
  | 'TRASLO'           // Transfer system
  | 'NAVETTA'          // Shuttle
  | 'SATELLITE'        // Satellite
  | 'VERTIMAG'         // Vertical magazine
  | 'ELEVATOR'         // Elevator
  | 'CONVEYOR'         // Conveyor belt
  | 'ROBOT'            // Robot arm
  | 'GENERIC';         // Generic PLC

export type PLCDeviceStatus =
  | 'ONLINE'           // Connected and operational
  | 'OFFLINE'          // Disconnected
  | 'ERROR'            // Error state
  | 'MAINTENANCE'      // Maintenance mode
  | 'INITIALIZING';    // Starting up

export type PLCConnectionType =
  | 'S7_TCP'           // Siemens S7 TCP/IP
  | 'MODBUS_TCP'       // Modbus TCP
  | 'PROFINET'         // PROFINET
  | 'ETHERNET_IP'      // EtherNet/IP
  | 'OPC_UA';          // OPC UA

export interface PLCDevice {
  id: string;
  name: string;
  code: string;
  type: PLCDeviceType;
  status: PLCDeviceStatus;

  // Connection
  connectionType: PLCConnectionType;
  ipAddress: string;
  port: number;
  rack: number;
  slot: number;

  // Status
  isConnected: boolean;
  lastConnectionTime: Date | null;
  uptime: number; // seconds

  // Configuration
  databufferSize: number;
  pollingInterval: number; // ms
  timeout: number; // ms

  // Metadata
  location: string;
  description: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;

  // Statistics
  commandsSentTotal: number;
  commandsFailedTotal: number;
  lastCommandTime: Date | null;
  alarmCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PLC Command Types
// ============================================

export type PLCCommandStatus =
  | 'PENDING'          // Waiting to be sent
  | 'SENT'             // Sent to PLC
  | 'ACKNOWLEDGED'     // PLC acknowledged
  | 'EXECUTED'         // Command executed
  | 'ERROR'            // Error occurred
  | 'TIMEOUT';         // Timeout

export type PLCCommandType =
  | 'START'            // Start device
  | 'STOP'             // Stop device
  | 'RESET'            // Reset device
  | 'PAUSE'            // Pause operation
  | 'RESUME'           // Resume operation
  | 'MOVE'             // Move command
  | 'LOAD'             // Load operation
  | 'UNLOAD'           // Unload operation
  | 'EMERGENCY_STOP'   // Emergency stop
  | 'WRITE_SIGNAL'     // Write signal value
  | 'CUSTOM';          // Custom command

export interface PLCCommand {
  id: string;
  deviceId: string;
  deviceName: string;

  // Command details
  type: PLCCommandType;
  command: string;
  parameters: Record<string, any>;

  // Execution
  status: PLCCommandStatus;
  priority: number; // 0-10, higher = more urgent

  // Timing
  createdAt: Date;
  sentAt: Date | null;
  acknowledgedAt: Date | null;
  executedAt: Date | null;

  // Result
  response: any | null;
  errorMessage: string | null;
  executionTime: number | null; // ms

  // Audit
  userId: string;
  userName: string;
  reason: string;
}

export interface PLCCommandTemplate {
  id: string;
  name: string;
  description: string;
  type: PLCCommandType;
  command: string;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    defaultValue: any;
    required: boolean;
    description: string;
  }[];
  deviceTypes: PLCDeviceType[];
}

// ============================================
// Databuffer Types
// ============================================

export interface DatabufferBlock {
  dbNumber: number;
  startByte: number;
  length: number;
  data: Uint8Array;
  lastUpdate: Date;
}

export interface DatabufferValue {
  address: string; // e.g., "DB1.DBX0.0" or "DB1.DBW10"
  dbNumber: number;
  offset: number;
  bitOffset?: number;
  dataType: SignalDataType;
  value: any;
  rawValue: Uint8Array;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
  timestamp: Date;
}

// ============================================
// Signal Types
// ============================================

export type SignalDataType =
  | 'BIT'              // Boolean, 1 bit
  | 'BYTE'             // 8 bits
  | 'CHAR'             // 8 bits signed
  | 'WORD'             // 16 bits
  | 'INT'              // 16 bits signed
  | 'DWORD'            // 32 bits
  | 'DINT'             // 32 bits signed
  | 'REAL'             // 32 bits float
  | 'STRING'           // Variable length string
  | 'DATE'             // Date
  | 'TIME'             // Time
  | 'DATE_TIME'        // Date + Time
  | 'S5TIME';          // Siemens S5 Time

export type SignalDirection =
  | 'INPUT'            // From PLC
  | 'OUTPUT'           // To PLC
  | 'BIDIRECTIONAL';   // Both

export interface Signal {
  id: string;
  deviceId: string;
  name: string;
  description: string;

  // Address
  address: string;    // e.g., "DB1.DBX0.0"
  dbNumber: number;
  byteOffset: number;
  bitOffset?: number;

  // Type
  dataType: SignalDataType;
  direction: SignalDirection;

  // Value
  value: any;
  rawValue: Uint8Array;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
  timestamp: Date;

  // Configuration
  unit: string;       // e.g., "mm", "°C", "rpm"
  minValue?: number;
  maxValue?: number;
  scaleFactor?: number;

  // Monitoring
  isMonitored: boolean;
  updateInterval: number; // ms
  lastUpdate: Date | null;

  // Metadata
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SignalHistory {
  signalId: string;
  values: {
    value: any;
    timestamp: Date;
    quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
  }[];
  startTime: Date;
  endTime: Date;
  sampleCount: number;
}

export interface SignalAlarm {
  id: string;
  signalId: string;
  signalName: string;
  type: 'HIGH' | 'LOW' | 'CHANGE' | 'OUT_OF_RANGE';
  condition: string;
  threshold: number | null;
  currentValue: any;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
}

export interface SignalMonitorConfig {
  signalId: string;
  enabled: boolean;
  updateInterval: number; // ms
  alarms: {
    highThreshold?: number;
    lowThreshold?: number;
    changeThreshold?: number;
    enabled: boolean;
  };
  logging: {
    enabled: boolean;
    retentionDays: number;
  };
}

export interface SignalGroup {
  id: string;
  name: string;
  description: string;
  deviceId: string;
  signals: string[]; // signal IDs
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PLC Control Panel Types
// ============================================

export interface ShuttlePosition {
  x: number;
  y: number;
  z: number;
  orientation: number; // degrees
  velocity: number;    // mm/s
  acceleration: number; // mm/s²
}

export interface ShuttleStatus {
  deviceId: string;
  position: ShuttlePosition;
  isMoving: boolean;
  isLoaded: boolean;
  loadWeight: number; // kg
  batteryLevel: number; // percentage
  errorCode: number | null;
  mode: 'AUTO' | 'MANUAL' | 'EMERGENCY';
}

export interface TransferLineStatus {
  deviceId: string;
  currentPosition: number; // mm
  targetPosition: number; // mm
  height: number; // mm
  forkCount: 1 | 2 | 4;
  activeForks: boolean[];
  isMoving: boolean;
  load: {
    isPresent: boolean;
    weight: number; // kg
    height: number; // mm
  } | null;
  safetyInterlocks: {
    name: string;
    active: boolean;
  }[];
}

export interface VerticalMagazineStatus {
  deviceId: string;
  currentLevel: number;
  totalLevels: number;
  isMoving: boolean;
  direction: 'UP' | 'DOWN' | 'STOPPED';
  loadedPositions: boolean[];
  capacity: number;
  occupancy: number;
}

// ============================================
// Request/Response Types
// ============================================

export interface GetPLCDevicesRequest {
  type?: PLCDeviceType;
  status?: PLCDeviceStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GetPLCDevicesResponse {
  devices: PLCDevice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SendPLCCommandRequest {
  deviceId: string;
  type: PLCCommandType;
  command: string;
  parameters: Record<string, any>;
  priority?: number;
  reason?: string;
}

export interface SendPLCCommandResponse {
  commandId: string;
  status: PLCCommandStatus;
  message: string;
}

export interface ReadDatabufferRequest {
  deviceId: string;
  dbNumber: number;
  startByte: number;
  length: number;
}

export interface ReadDatabufferResponse {
  deviceId: string;
  dbNumber: number;
  data: number[]; // byte array
  timestamp: Date;
}

export interface WriteSignalRequest {
  deviceId: string;
  address: string;
  dataType: SignalDataType;
  value: any;
  reason?: string;
}

export interface WriteSignalResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}

export interface GetSignalHistoryRequest {
  signalId: string;
  startTime: Date;
  endTime: Date;
  maxSamples?: number;
}

export interface GetSignalHistoryResponse {
  signalId: string;
  history: SignalHistory;
}

// ============================================
// WebSocket Event Types
// ============================================

export interface PLCStatusUpdateEvent {
  type: 'plc:status-update';
  deviceId: string;
  status: PLCDeviceStatus;
  isConnected: boolean;
  timestamp: Date;
}

export interface PLCCommandStatusEvent {
  type: 'plc:command-status';
  commandId: string;
  status: PLCCommandStatus;
  response: any;
  errorMessage: string | null;
  timestamp: Date;
}

export interface SignalValueUpdateEvent {
  type: 'signal:value-update';
  deviceId: string;
  signals: {
    address: string;
    value: any;
    quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
    timestamp: Date;
  }[];
}

export interface DatabufferUpdateEvent {
  type: 'databuffer:update';
  deviceId: string;
  dbNumber: number;
  startByte: number;
  data: number[];
  timestamp: Date;
}

// ============================================
// Filter Types
// ============================================

export interface PLCDeviceFilters {
  type: PLCDeviceType | 'ALL';
  status: PLCDeviceStatus | 'ALL';
  search: string;
  connectionType: PLCConnectionType | 'ALL';
  location: string | 'ALL';
}

export interface SignalFilters {
  deviceId: string | 'ALL';
  dataType: SignalDataType | 'ALL';
  direction: SignalDirection | 'ALL';
  category: string | 'ALL';
  isMonitored: boolean | 'ALL';
  search: string;
}

// ============================================
// UI State Types
// ============================================

export interface PLCModuleState {
  selectedDeviceId: string | null;
  selectedSignals: string[];
  monitoredSignals: string[];
  commandQueue: PLCCommand[];
  connectionStatus: Map<string, PLCDeviceStatus>;
}

// ============================================
// Utility Types
// ============================================

export type PLCDeviceTypeLabel = {
  [K in PLCDeviceType]: string;
};

export const PLCDeviceTypeLabels: PLCDeviceTypeLabel = {
  TRASLO: 'Traslo (Transfer)',
  NAVETTA: 'Navetta (Shuttle)',
  SATELLITE: 'Satellite',
  VERTIMAG: 'Vertimag',
  ELEVATOR: 'Elevator',
  CONVEYOR: 'Conveyor',
  ROBOT: 'Robot',
  GENERIC: 'Generic PLC'
};

export const PLCDeviceStatusColors = {
  ONLINE: 'green',
  OFFLINE: 'gray',
  ERROR: 'red',
  MAINTENANCE: 'yellow',
  INITIALIZING: 'blue'
} as const;

export const SignalDataTypeSizes = {
  BIT: 0.125,
  BYTE: 1,
  CHAR: 1,
  WORD: 2,
  INT: 2,
  DWORD: 4,
  DINT: 4,
  REAL: 4,
  STRING: -1, // Variable
  DATE: 2,
  TIME: 4,
  DATE_TIME: 8,
  S5TIME: 2
} as const;

// ============================================
// Signal Request/Response Types
// ============================================

export interface GetSignalsRequest {
  deviceId?: string;
  dataType?: SignalDataType;
  direction?: SignalDirection;
  category?: string;
  search?: string;
  isMonitored?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetSignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetSignalHistoryRequest {
  signalId: string;
  startTime: Date;
  endTime: Date;
  maxSamples?: number;
}

export interface UpdateSignalConfigRequest {
  signalId: string;
  config: Partial<SignalMonitorConfig>;
}

export interface GetSignalAlarmsRequest {
  signalId?: string;
  deviceId?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  acknowledged?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetSignalAlarmsResponse {
  alarms: SignalAlarm[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AcknowledgeAlarmRequest {
  alarmId: string;
  userName: string;
  notes?: string;
}

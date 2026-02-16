// ============================================================================
// EJLOG WMS - AI Assistant Types
// Type definitions for AI Assistant functionality
// ============================================================================

import { AIModel, AIContextDepth } from './settings';

/**
 * Chat message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message
 */
export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

/**
 * AI chat request
 */
export interface AIChatRequest {
  message: string;
  context: AIContext;
  model?: AIModel;
  language?: 'it' | 'en';
}

/**
 * AI chat response
 */
export interface AIChatResponse {
  response: string;
  suggestions?: AISuggestion[];
  actions?: AIAction[];
  executedActions?: Array<{
    action: string;
    params?: any;
    result?: any;
  }>;
}

/**
 * AI context for requests
 */
export interface AIContext {
  user?: {
    userName?: string;
    userLevel?: number;
  };
  page?: string;
  pageData?: any;
  entityId?: string | number;
  entityType?: 'machine' | 'drawer' | 'list' | string;
  settings?: {
    contextDepth?: AIContextDepth;
  };
  conversationHistory?: Message[];
}

/**
 * AI suggestion
 */
export interface AISuggestion {
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
}

/**
 * AI action
 */
export interface AIAction {
  type: string;
  label: string;
  endpoint?: string;
  payload?: any;
}

/**
 * Machine context for AI
 */
export interface MachineContext {
  id: number;
  name: string;
  active: boolean;
  recentAlarms?: MachineAlarm[];
}

/**
 * Machine alarm
 */
export interface MachineAlarm {
  code: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

/**
 * Drawer context for AI
 */
export interface DrawerContext {
  id: number;
  code: string;
  width: number;
  depth: number;
  height?: number;
  compartments?: CompartmentContext[];
  totalCompartments: number;
  averageFill: number;
}

/**
 * Compartment context
 */
export interface CompartmentContext {
  id: number;
  posX: number;
  posY: number;
  width: number;
  depth: number;
  fillPercentage: number;
}

/**
 * Operation context for AI
 */
export interface OperationContext {
  id: number;
  type: number;
  status: number;
  requestedQty: number;
  remainingQty: number;
  itemId?: number;
  operatorUserName?: string;
}

/**
 * List context for AI
 */
export interface ListContext {
  id: number;
  listNumber: string;
  listType: number;
  status: number;
  createdAt: string;
  rows?: ListRowContext[];
  totalRows: number;
}

/**
 * List row context
 */
export interface ListRowContext {
  id: number;
  itemId: number;
  requestedQty: number;
  completedQty: number;
}

/**
 * System state for AI
 */
export interface SystemState {
  machines: {
    total: number;
    active: number;
  };
  lists: {
    total: number;
    inExecution: number;
  };
  timestamp: string;
}

/**
 * Error for troubleshooting
 */
export interface ErrorContext {
  code: string;
  description: string;
  timestamp?: string;
  type?: string;
}

/**
 * Troubleshoot request
 */
export interface TroubleshootRequest {
  error: ErrorContext;
  context: any;
  systemState?: SystemState;
}

/**
 * Troubleshoot response
 */
export interface TroubleshootResponse {
  diagnosis: string;
  possibleCauses?: string[];
  suggestedFixes?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

/**
 * Voice recognition options
 */
export interface VoiceRecognitionOptions {
  language: string;
  enabled: boolean;
  continuous?: boolean;
  interimResults?: boolean;
}

/**
 * Voice recognition result
 */
export interface VoiceRecognitionResult {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}



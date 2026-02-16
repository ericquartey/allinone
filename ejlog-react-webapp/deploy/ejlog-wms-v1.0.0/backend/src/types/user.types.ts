/**
 * User Management Types & Interfaces
 * EjLog React WebApp - User Management Module
 */

// ============================================================================
// Core Entities
// ============================================================================

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface UserGroup {
  id: number;
  nome: string;
  descrizione: string;
  livelloPrivilegi: number; // 0=superuser, 1=admin, 2+=user
}

export interface User {
  id: number;
  utente: string; // username
  gruppoUtente: UserGroup;
  lingua: Language;
  dataUltimoLogin: string | null;
  idPostazioneUltimoLogin: number | null;
  barcode: string | null;
  lockPpcLogin: boolean;
}

// ============================================================================
// Login History
// ============================================================================

export interface LoginAttempt {
  id: number;
  username: string;
  attemptTimestamp: string;
  ipAddress: string;
  success: boolean;
  failureReason: string | null;
  userAgent: string;
}

export interface LoginHistoryFilters {
  username?: string;
  dateFrom?: string;
  dateTo?: string;
  successOnly?: boolean;
  failedOnly?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Token Management
// ============================================================================

export interface TokenHistory {
  id: number;
  tokenId: string;
  username: string;
  issuedAt: string;
  expiresAt: string;
  clientIp: string;
  isRevoked: boolean;
  lastUsedAt: string | null;
}

export type TokenStatus = 'active' | 'expiring' | 'expired' | 'revoked';

export interface TokenWithStatus extends TokenHistory {
  status: TokenStatus;
  expiresInMinutes: number;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateUserDTO {
  username: string;
  password: string;
  groupId: number;
  languageId?: number;
  barcode?: string;
  lockPpcLogin?: boolean;
}

export interface UpdateUserDTO {
  groupId: number;
  languageId?: number;
  barcode?: string;
  lockPpcLogin?: boolean;
}

export interface ChangePasswordDTO {
  oldPassword?: string; // Required for current user changing own password
  newPassword: string;
}

// ============================================================================
// Search & Filters
// ============================================================================

export interface UserSearchParams {
  username?: string;
  groupId?: number;
  limit?: number;
  offset?: number;
}

export interface UserSearchResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// UI State
// ============================================================================

export type UserDialogMode = 'create' | 'edit';

export interface UserFilters {
  username: string;
  groupId: number | null;
  activeOnly: boolean;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

// ============================================================================
// Permissions
// ============================================================================

export interface UserPermissions {
  canCreateUser: boolean;
  canEditUser: (targetUser: User) => boolean;
  canDeleteUser: (targetUser: User) => boolean;
  canChangePassword: (targetUser: User) => boolean;
  canViewTokens: boolean;
  canRevokeTokens: boolean;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

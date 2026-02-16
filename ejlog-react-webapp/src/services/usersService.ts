// ============================================================================
// EJLOG WMS - Users Service Layer
// Centralized service for user management operations
// ============================================================================

import apiClient from './api';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * User access level enumeration
 * Maps to GruppoUtente.livelloPrivilegi
 */
export enum UserAccessLevel {
  SUPERUSERS = 0,
  ADMINS = 1,
  USERS = 2,
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * User interface - represents a system user
 * Maps to WSUser.java
 */
export interface User {
  userName: string;
  description?: string | null;
  accessLevel: UserAccessLevel;
  lockPpcLogin?: boolean | null;
}

/**
 * User with claims (authentication response)
 * Maps to WSUserClaims.java
 */
export interface UserClaims extends User {
  token?: string;
  expiresAt?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  result: 'OK' | 'NOT OK';
  message?: string;
  data?: T;
  exportedItems?: T[];
  recordNumber?: number;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get list of users with optional filtering by username
 */
export async function getUsers(username?: string): Promise<ApiResponse<UserClaims[]>> {
  try {
    const params = username ? { username } : {};
    const response = await apiClient.get('/User', { params });
    return {
      result: 'OK',
      exportedItems: response.data || [],
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<UserClaims | null> {
  try {
    const response = await getUsers(username);
    if (response.result === 'OK' && response.exportedItems && response.exportedItems.length > 0) {
      return response.exportedItems[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error);
    throw error;
  }
}

/**
 * Create new users (supports bulk creation)
 */
export async function createUsers(users: User[]): Promise<ApiResponse<User[]>> {
  try {
    const response = await apiClient.post('/User', users);
    return response.data;
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
}

/**
 * Create a single user
 */
export async function createUser(user: User): Promise<ApiResponse<User[]>> {
  return createUsers([user]);
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<UserClaims | null> {
  try {
    const response = await apiClient.post('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });

    if (response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get access level label in Italian
 */
export function getAccessLevelLabel(level: UserAccessLevel): string {
  const labels: { [key in UserAccessLevel]: string } = {
    [UserAccessLevel.SUPERUSERS]: 'Super Amministratore',
    [UserAccessLevel.ADMINS]: 'Amministratore',
    [UserAccessLevel.USERS]: 'Utente',
  };
  return labels[level] || 'Sconosciuto';
}

/**
 * Validate user creation
 */
export function validateUserCreation(user: Partial<User>): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (!user.userName || user.userName.trim() === '') {
    errors.userName = 'Nome utente obbligatorio';
  }

  if (user.userName && user.userName.length > 250) {
    errors.userName = 'Nome utente troppo lungo (max 250 caratteri)';
  }

  if (user.accessLevel === undefined || user.accessLevel === null) {
    errors.accessLevel = 'Livello accesso obbligatorio';
  }

  if (
    user.accessLevel !== undefined &&
    ![UserAccessLevel.SUPERUSERS, UserAccessLevel.ADMINS, UserAccessLevel.USERS].includes(
      user.accessLevel
    )
  ) {
    errors.accessLevel = 'Livello accesso non valido';
  }

  return errors;
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: User): boolean {
  return user.accessLevel === UserAccessLevel.ADMINS || user.accessLevel === UserAccessLevel.SUPERUSERS;
}

/**
 * Check if user has superuser privileges
 */
export function isSuperUser(user: User): boolean {
  return user.accessLevel === UserAccessLevel.SUPERUSERS;
}

/**
 * Filter users by search term (userName)
 */
export function filterUsersBySearch(users: UserClaims[], searchTerm: string): UserClaims[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return users;
  }

  const term = searchTerm.toLowerCase().trim();
  return users.filter((user) => user.userName.toLowerCase().includes(term));
}

/**
 * Sort users by userName
 */
export function sortUsers(users: UserClaims[], ascending: boolean = true): UserClaims[] {
  return [...users].sort((a, b) => {
    return ascending
      ? a.userName.localeCompare(b.userName)
      : b.userName.localeCompare(a.userName);
  });
}

/**
 * Group users by access level
 */
export function groupUsersByAccessLevel(
  users: UserClaims[]
): { [level: string]: UserClaims[] } {
  return users.reduce((groups, user) => {
    const levelLabel = getAccessLevelLabel(user.accessLevel);
    if (!groups[levelLabel]) {
      groups[levelLabel] = [];
    }
    groups[levelLabel].push(user);
    return groups;
  }, {} as { [level: string]: UserClaims[] });
}

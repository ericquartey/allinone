// ============================================================================
// EJLOG WMS - Permissions Utilities
// Helper per gestione permessi
// ============================================================================

import { User, UserAccessLevel } from '../types/models';

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;

  // Admin ha tutti i permessi
  if (user.accessLevel === UserAccessLevel.SYSTEM ||
      user.accessLevel === UserAccessLevel.AMMINISTRATORE) {
    return true;
  }

  // Check permission in user.permissions array
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }

  return false;
};

export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;

  return permissions.some(permission => hasPermission(user, permission));
};

export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;

  return permissions.every(permission => hasPermission(user, permission));
};

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;

  return user.accessLevel === UserAccessLevel.SYSTEM ||
         user.accessLevel === UserAccessLevel.AMMINISTRATORE;
};

export const isSupervisor = (user: User | null): boolean => {
  if (!user) return false;

  return user.accessLevel >= UserAccessLevel.SUPERVISORE;
};

export const canViewConfig = (user: User | null): boolean => {
  return isSupervisor(user);
};

export const canEditConfig = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canExecuteOperations = (user: User | null): boolean => {
  if (!user) return false;

  // Tutti gli utenti attivi possono eseguire operazioni
  return user.isActive;
};

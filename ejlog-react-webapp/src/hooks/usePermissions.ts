// ============================================================================
// EJLOG WMS - Permissions Hook
// Hook per gestire permessi e autorizzazioni utente
// ============================================================================

import React, { useMemo } from 'react';
import { useAppSelector } from '../app/hooks';
import { UserAccessLevel } from '../types/models';
import { hasMenuAccess, getAccessiblePaths, type MenuItem } from '../config/menuConfig';

export interface UsePermissionsReturn {
  user: any | null;
  isAuthenticated: boolean;
  accessLevel: UserAccessLevel | null;
  permissions: string[];

  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAccessLevel: (requiredLevel: UserAccessLevel) => boolean;
  hasMinAccessLevel: (minLevel: UserAccessLevel) => boolean;

  // Menu checks
  canAccessMenuItem: (menuItem: MenuItem) => boolean;
  canAccessPath: (path: string) => boolean;
  accessiblePaths: string[];

  // Role checks
  isOperator: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  isSystem: boolean;
}

/**
 * Hook per gestire permessi e controlli di autorizzazione
 *
 * @example
 * ```tsx
 * const { hasPermission, isAdmin } = usePermissions();
 *
 * if (hasPermission('items.create')) {
 *   return <CreateItemButton />;
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const permissions = useMemo(() => {
    const rawPermissions = user?.permissions;
    return Array.isArray(rawPermissions) ? rawPermissions : [];
  }, [user]);

  const accessLevel = useMemo(() => {
    return user?.accessLevel || null;
  }, [user]);

  // Permission checks
  const hasPermission = useMemo(
    () => (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAllPermissions = useMemo(
    () => (requiredPermissions: string[]) => {
      return requiredPermissions.every((perm) => permissions.includes(perm));
    },
    [permissions]
  );

  const hasAnyPermission = useMemo(
    () => (requiredPermissions: string[]) => {
      return requiredPermissions.some((perm) => permissions.includes(perm));
    },
    [permissions]
  );

  const hasAccessLevel = useMemo(
    () => (requiredLevel: UserAccessLevel) => {
      if (accessLevel === null) return false;
      return accessLevel === requiredLevel;
    },
    [accessLevel]
  );

  const hasMinAccessLevel = useMemo(
    () => (minLevel: UserAccessLevel) => {
      if (accessLevel === null) return false;
      return accessLevel >= minLevel;
    },
    [accessLevel]
  );

  // Menu checks
  const canAccessMenuItem = useMemo(
    () => (menuItem: MenuItem) => {
      if (!user) return false;
      return hasMenuAccess(menuItem, {
        accessLevel: user.accessLevel,
        permissions: user.permissions,
      });
    },
    [user]
  );

  const accessiblePaths = useMemo(() => {
    if (!user) return [];
    return getAccessiblePaths({
      accessLevel: user.accessLevel,
      permissions: user.permissions,
    });
  }, [user]);

  const canAccessPath = useMemo(
    () => (path: string) => {
      return accessiblePaths.includes(path);
    },
    [accessiblePaths]
  );

  // Role checks
  const isOperator = useMemo(
    () => accessLevel === UserAccessLevel.OPERATORE,
    [accessLevel]
  );

  const isSupervisor = useMemo(
    () => accessLevel === UserAccessLevel.SUPERVISORE,
    [accessLevel]
  );

  const isAdmin = useMemo(
    () => accessLevel === UserAccessLevel.AMMINISTRATORE,
    [accessLevel]
  );

  const isSystem = useMemo(
    () => accessLevel === UserAccessLevel.SYSTEM,
    [accessLevel]
  );

  return {
    user,
    isAuthenticated,
    accessLevel,
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasAccessLevel,
    hasMinAccessLevel,
    canAccessMenuItem,
    canAccessPath,
    accessiblePaths,
    isOperator,
    isSupervisor,
    isAdmin,
    isSystem,
  };
}

/**
 * HOC per proteggere componenti con permessi
 *
 * @example
 * ```tsx
 * const ProtectedComponent = withPermission(
 *   MyComponent,
 *   { requiredPermissions: ['items.create'] }
 * );
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredPermissions?: string[];
    requiredAccessLevel?: UserAccessLevel;
    fallback?: React.ReactNode;
  }
) {
  return (props: P) => {
    const { hasAllPermissions, hasMinAccessLevel } = usePermissions();

    // Check permissions
    if (options.requiredPermissions) {
      if (!hasAllPermissions(options.requiredPermissions)) {
        return options.fallback ?? null;
      }
    }

    // Check access level
    if (options.requiredAccessLevel !== undefined) {
      if (!hasMinAccessLevel(options.requiredAccessLevel)) {
        return options.fallback ?? null;
      }
    }

    return React.createElement(Component, props);
  };
}

/**
 * Componente per rendering condizionale basato su permessi
 *
 * @example
 * ```tsx
 * <PermissionGuard requiredPermissions={['items.create']}>
 *   <CreateButton />
 * </PermissionGuard>
 * ```
 */
export interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredAccessLevel?: UserAccessLevel;
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermissions,
  requiredAccessLevel,
  requireAll = true,
  fallback = null,
}) => {
  const { hasAllPermissions, hasAnyPermission, hasMinAccessLevel } = usePermissions();

  // Check access level
  if (requiredAccessLevel !== undefined) {
    if (!hasMinAccessLevel(requiredAccessLevel)) {
      return fallback;
    }
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback;
    }
  }

  return children;
};

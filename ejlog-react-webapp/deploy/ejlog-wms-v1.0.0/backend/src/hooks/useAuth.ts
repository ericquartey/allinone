// ============================================================================
// EJLOG WMS - useAuth Hook
// Hook per gestione autenticazione
// ============================================================================

import { useAppSelector } from '../app/hooks';
import { hasPermission, isAdmin, isSupervisor } from '../utils/permissions';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin: isAdmin(user),
    isSupervisor: isSupervisor(user),
    hasPermission: (permission: string) => hasPermission(user, permission),
  };
};

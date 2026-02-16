// ============================================================================
// EJLOG WMS - Users List Page (New)
// Wrapper around advanced UsersList with password + lock/unlock actions
// ============================================================================

import React from 'react';
import { useAppSelector } from '../../app/hooks';
import { UsersList } from '../../components/users/UsersList';

const UsersListPage: React.FC = () => {
  const authUser = useAppSelector((state) => state.auth.user);

  const roles = (authUser as any)?.roles || [];
  const permissions = (authUser as any)?.permissions || [];
  const isAdmin =
    roles.includes('ADMIN') ||
    roles.includes('SUPERUSER') ||
    permissions.includes('*');

  const currentUserIdRaw = (authUser as any)?.id ?? (authUser as any)?.userId ?? 0;
  const currentUserId = Number(currentUserIdRaw) || 0;

  return <UsersList currentUserId={currentUserId} isAdmin={isAdmin} />;
};

export default UsersListPage;

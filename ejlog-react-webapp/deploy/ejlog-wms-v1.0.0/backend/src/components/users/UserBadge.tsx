/**
 * UserBadge Component
 * Reusable badge for displaying user groups, levels, and statuses
 */

import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { UserGroup, TokenStatus } from '@/types/user.types';
import { Shield, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';

// ============================================================================
// User Group Badge
// ============================================================================

interface UserGroupBadgeProps {
  group: UserGroup;
  showIcon?: boolean;
}

export const UserGroupBadge: FC<UserGroupBadgeProps> = ({ group, showIcon = true }) => {
  // Color coding based on privilege level
  // 0 = Superuser (Red), 1 = Admin (Orange), 2+ = User (Blue)
  const getVariant = (level: number) => {
    if (level === 0) return 'destructive'; // Red
    if (level === 1) return 'default'; // Orange/Default
    return 'secondary'; // Blue/Secondary
  };

  const variant = getVariant(group.livelloPrivilegi);

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {showIcon && <Shield className="h-3 w-3" />}
      <span>{group.nome}</span>
    </Badge>
  );
};

// ============================================================================
// Privilege Level Badge
// ============================================================================

interface PrivilegeLevelBadgeProps {
  level: number;
  label?: string;
}

export const PrivilegeLevelBadge: FC<PrivilegeLevelBadgeProps> = ({ level, label }) => {
  const getConfig = (level: number) => {
    if (level === 0) {
      return {
        variant: 'destructive' as const,
        label: label || 'Superuser',
        className: 'bg-red-600 hover:bg-red-700',
      };
    }
    if (level === 1) {
      return {
        variant: 'default' as const,
        label: label || 'Admin',
        className: 'bg-orange-600 hover:bg-orange-700',
      };
    }
    return {
      variant: 'secondary' as const,
      label: label || 'User',
      className: 'bg-blue-600 hover:bg-blue-700',
    };
  };

  const config = getConfig(level);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

// ============================================================================
// Token Status Badge
// ============================================================================

interface TokenStatusBadgeProps {
  status: TokenStatus;
  expiresInMinutes?: number;
}

export const TokenStatusBadge: FC<TokenStatusBadgeProps> = ({
  status,
  expiresInMinutes,
}) => {
  const getConfig = (status: TokenStatus) => {
    switch (status) {
      case 'active':
        return {
          variant: 'default' as const,
          label: 'Attivo',
          icon: CheckCircle2,
          className: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'expiring':
        return {
          variant: 'default' as const,
          label: expiresInMinutes
            ? `Scade in ${expiresInMinutes}m`
            : 'In scadenza',
          icon: Clock,
          className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        };
      case 'expired':
        return {
          variant: 'destructive' as const,
          label: 'Scaduto',
          icon: XCircle,
          className: 'bg-red-600 hover:bg-red-700',
        };
      case 'revoked':
        return {
          variant: 'secondary' as const,
          label: 'Revocato',
          icon: Ban,
          className: 'bg-gray-600 hover:bg-gray-700',
        };
      default:
        return {
          variant: 'secondary' as const,
          label: 'Sconosciuto',
          icon: XCircle,
          className: '',
        };
    }
  };

  const config = getConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

// ============================================================================
// Login Success Badge
// ============================================================================

interface LoginSuccessBadgeProps {
  success: boolean;
}

export const LoginSuccessBadge: FC<LoginSuccessBadgeProps> = ({ success }) => {
  if (success) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Successo
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <XCircle className="h-3 w-3 mr-1" />
      Fallito
    </Badge>
  );
};

// ============================================================================
// Active Status Badge
// ============================================================================

interface ActiveStatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const ActiveStatusBadge: FC<ActiveStatusBadgeProps> = ({
  active,
  activeLabel = 'Attivo',
  inactiveLabel = 'Inattivo',
}) => {
  if (active) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
        {activeLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-gray-600 hover:bg-gray-700">
      {inactiveLabel}
    </Badge>
  );
};

// ============================================================================
// EJLOG WMS - Badge Component
// Status indicator badge with variants and sizes
// ============================================================================

import { ReactNode } from 'react';

// Badge variants
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary';

// Badge sizes
export type BadgeSize = 'sm' | 'md' | 'lg';

// Badge props interface
export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  size?: BadgeSize;
  className?: string;
}

/**
 * Badge component for displaying status indicators
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" size="sm">Failed</Badge>
 * ```
 */
function Badge({ variant = 'default', children, size = 'md', className = '' }: BadgeProps): JSX.Element {
  const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-ferretto-red/10 text-ferretto-red border-ferretto-red/20',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${
        variantClasses[variant] || variantClasses.default
      } ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;

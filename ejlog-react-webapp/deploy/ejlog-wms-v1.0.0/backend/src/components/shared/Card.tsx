// ============================================================================
// EJLOG WMS - Card Component (Enhanced Ferretto Theme)
// Professional card container with Ferretto industrial styling
// ============================================================================

import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerAction,
  footer,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  loading = false,
  ...props
}) => {
  // Base card styles
  const baseClasses = clsx(
    'rounded-ferretto',
    'transition-all duration-200',
    hoverable && 'hover:shadow-ferretto-lg cursor-pointer'
  );

  // Variant styles
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-ferretto',
    elevated: 'bg-white shadow-ferretto-lg',
    outlined: 'bg-white border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200',
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={clsx(baseClasses, variantClasses[variant], paddingClasses[padding], className)}>
        <div className="animate-pulse">
          {title && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              {subtitle && <div className="h-4 bg-gray-200 rounded w-1/2"></div>}
            </div>
          )}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {/* Card Header */}
      {(title || subtitle || headerAction) && (
        <div className={clsx(
          'border-b border-gray-200',
          paddingClasses[padding],
          'pb-4'
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className={clsx(
        paddingClasses[padding],
        (title || subtitle || headerAction) && 'pt-4'
      )}>
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className={clsx(
          'bg-gray-50 border-t border-gray-200 rounded-b-ferretto',
          paddingClasses[padding],
          'mt-4'
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

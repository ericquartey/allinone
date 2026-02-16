// ============================================================================
// EJLOG WMS - Button Component (Enhanced Ferretto Theme)
// Professional button component with Ferretto industrial styling
// ============================================================================

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ariaLabel,
  ariaDescribedBy,
  ...props
}) => {
  // Base classes with Ferretto styling
  const baseClasses = clsx(
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-ferretto',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-95',
    fullWidth && 'w-full'
  );

  // Variant styles - Ferretto industrial theme
  const variantClasses = {
    primary: clsx(
      'bg-ferretto-red text-white',
      'hover:bg-ferretto-red-dark hover:shadow-ferretto-md',
      'focus:ring-ferretto-red'
    ),
    secondary: clsx(
      'bg-gray-700 text-white',
      'hover:bg-gray-800 hover:shadow-ferretto-md',
      'focus:ring-gray-600'
    ),
    outline: clsx(
      'bg-white text-ferretto-red border-2 border-ferretto-red',
      'hover:bg-ferretto-red hover:text-white hover:shadow-ferretto-md',
      'focus:ring-ferretto-red'
    ),
    ghost: clsx(
      'bg-transparent text-gray-700',
      'hover:bg-gray-100',
      'focus:ring-gray-300'
    ),
    danger: clsx(
      'bg-error text-white',
      'hover:bg-red-600 hover:shadow-ferretto-md',
      'focus:ring-error'
    ),
    success: clsx(
      'bg-success text-white',
      'hover:bg-green-700 hover:shadow-ferretto-md',
      'focus:ring-success'
    ),
    warning: clsx(
      'bg-warning text-white',
      'hover:bg-yellow-600 hover:shadow-ferretto-md',
      'focus:ring-warning'
    ),
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Icon size based on button size
  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className={clsx('animate-spin', iconSizeClasses[size])}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Icon wrapper component
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <span className={clsx('inline-flex', iconSizeClasses[size])} aria-hidden="true">
      {children}
    </span>
  );

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && <LoadingSpinner />}

      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <IconWrapper>{icon}</IconWrapper>
      )}

      {/* Button text/children */}
      {children}

      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <IconWrapper>{icon}</IconWrapper>
      )}
    </button>
  );
};

export default Button;

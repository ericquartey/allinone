// ============================================================================
// EJLOG WMS - Card Component
// Container component with padding, hover effects, and click handling
// ============================================================================

import { forwardRef, HTMLAttributes, ReactNode } from 'react';

// Card padding options
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

// Card props interface
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      padding = 'md',
      hover = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'bg-white rounded-lg border border-gray-200 shadow-sm transition-all';

    const paddingStyles: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? 'hover:shadow-md cursor-pointer hover:border-gray-300'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

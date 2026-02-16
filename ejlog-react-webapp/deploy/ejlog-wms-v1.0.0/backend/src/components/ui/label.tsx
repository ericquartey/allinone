import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className = '', required = false, error = false, disabled = false, ...props }, ref) => {
    const errorClasses = error ? 'text-red-600' : 'text-gray-700';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return (
      <label
        ref={ref}
        className={`label block text-sm font-medium ${errorClasses} ${disabledClasses} ${className}`}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

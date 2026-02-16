// ============================================================================
// EJLOG WMS - Input Component
// Campo input riutilizzabile con supporto WCAG 2.1 Level AA
// ============================================================================

import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  hideLabel?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  hideLabel = false,
  className = '',
  id,
  required,
  ...props
}) => {
  // Generate unique ID for accessibility
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  // Build aria-describedby attribute
  const ariaDescribedBy = [
    helperText ? helperId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${hideLabel ? 'sr-only' : ''}`}
        >
          {label}
          {required && <span className="text-ferrRed ml-1" aria-label="campo obbligatorio">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg border ${
            error ? 'border-red-500' : 'border-gray-300'
          } px-4 py-2 ${icon ? 'pl-10' : ''} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ferrRed focus:border-transparent ${className}`}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={ariaDescribedBy}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;

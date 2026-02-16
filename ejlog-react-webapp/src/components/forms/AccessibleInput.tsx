// ==============================================================================
// EJLOG WMS - Accessible Input Component
// Form input with WCAG 2.1 Level AA compliance
// ==============================================================================

import React, { useId } from 'react';

export interface AccessibleInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  hideLabel?: boolean; // Visually hide label but keep for screen readers
}

const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  hint,
  required = false,
  id,
  hideLabel = false,
  className = '',
  ...inputProps
}) => {
  // Generate unique ID if not provided
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  // Build aria-describedby attribute
  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-group">
      {/* Label */}
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium text-gray-700 mb-1 ${
          hideLabel ? 'sr-only' : ''
        }`}
      >
        {label}
        {required && (
          <span
            aria-label="campo obbligatorio"
            className="text-ferrRed ml-1"
          >
            *
          </span>
        )}
      </label>

      {/* Hint text */}
      {hint && (
        <p
          id={hintId}
          className="text-sm text-gray-600 mb-1"
        >
          {hint}
        </p>
      )}

      {/* Input field */}
      <input
        id={inputId}
        className={`
          mt-1 block w-full rounded-md shadow-sm
          transition-colors duration-200
          ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-ferrRed focus:ring-ferrRed'
          }
          focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 mt-1 flex items-start"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default AccessibleInput;

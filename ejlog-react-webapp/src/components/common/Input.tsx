// ============================================================================
// EJLOG WMS - Input Component
// Form input with label, error handling, icons, and helper text
// ============================================================================

import { forwardRef, InputHTMLAttributes, ComponentType } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Input props interface
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      inputClassName = '',
      type = 'text',
      required = false,
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className={`space-y-1 ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon
                className={`h-5 w-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`}
              />
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={type}
            className={`
              block w-full rounded-lg shadow-sm transition-all duration-200
              ${Icon ? 'pl-10' : 'pl-3'}
              ${hasError ? 'pr-10' : 'pr-3'}
              py-2.5 text-sm
              ${
                hasError
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-ferretto-red focus:border-ferretto-red'
              }
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${inputClassName}
            `}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${props.name}-error`
                : helperText
                  ? `${props.name}-helper`
                  : undefined
            }
            {...props}
          />

          {/* Error Icon */}
          {hasError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {hasError && error ? (
          <p
            id={`${props.name}-error`}
            className="text-sm text-red-600 flex items-center"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={`${props.name}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

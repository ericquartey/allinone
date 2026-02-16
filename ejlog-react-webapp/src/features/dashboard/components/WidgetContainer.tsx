// ============================================================================
// EJLOG WMS - Widget Container
// Container riutilizzabile per tutti i widget dashboard
// ============================================================================

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../../../components/shared/Spinner';

interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  children: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  footerAction?: ReactNode;
}

/**
 * Container standard per widget dashboard
 * Include: header con titolo, loading state, error handling, animazioni
 */
export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  subtitle,
  icon,
  isLoading = false,
  error = null,
  children,
  headerAction,
  className = '',
  footerAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg
              className="w-16 h-16 text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Errore caricamento dati</h4>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer (opzionale) */}
      {footerAction && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          {footerAction}
        </div>
      )}
    </motion.div>
  );
};

export default WidgetContainer;

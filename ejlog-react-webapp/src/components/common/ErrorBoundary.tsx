// ============================================================================
// EJLOG WMS - Error Boundary Component
// Global error handling with toast notifications and fallback UI
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors globally
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Show toast notification
    toast.error(`Errore: ${error.message}`, {
      duration: 5000,
      position: 'top-right',
    });

    // Send to error tracking service (if available)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="mt-6 text-2xl font-bold text-center text-gray-900">
              Oops! Qualcosa è andato storto
            </h1>

            <p className="mt-4 text-center text-gray-600">
              Si è verificato un errore inatteso. Prova a ricaricare la pagina o contatta l'assistenza se il problema persiste.
            </p>

            {error && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Dettagli errore:</p>
                <p className="mt-2 text-sm text-gray-600 font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}

            {import.meta.env.DEV && errorInfo && (
              <details className="mt-4">
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Stack trace (solo in development)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 text-xs rounded-lg overflow-auto max-h-64">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="mt-8 flex space-x-4">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Riprova
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Torna alla Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

/**
 * Hook per gestire errori API globalmente
 */
export function useApiErrorHandler(): void {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      console.error('[useApiErrorHandler] Unhandled Promise Rejection:', event.reason);

      // Extract error message
      const error = event.reason;
      let errorMessage = 'Errore di rete';

      if (error?.response) {
        const status = error.response.status;
        if (status === 500) {
          errorMessage = 'Errore interno del server';
        } else if (status === 404) {
          errorMessage = 'Risorsa non trovata';
        } else if (status === 401) {
          errorMessage = 'Non autorizzato';
        } else if (status === 403) {
          errorMessage = 'Accesso negato';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right',
      });
    };

    const handleError = (event: ErrorEvent): void => {
      console.error('[useApiErrorHandler] Global Error:', event.error);

      if (event.error?.response) {
        const status = event.error.response.status;
        if (status === 500) {
          toast.error('Errore interno del server');
        } else if (status === 404) {
          toast.error('Risorsa non trovata');
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}

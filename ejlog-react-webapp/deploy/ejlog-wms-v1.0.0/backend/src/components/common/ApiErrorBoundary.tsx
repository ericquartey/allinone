// ============================================================================
// EJLOG WMS - API Error Boundary
// Error Boundary React avanzato per gestione errori API e runtime
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { normalizeError, logApiError, type NormalizedError, ErrorType } from '../../utils/apiIntegration';

/**
 * Props per ApiErrorBoundary
 */
interface ApiErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI personalizzata */
  fallback?: (error: NormalizedError, retry: () => void) => ReactNode;
  /** Callback su errore catturato */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Nome del componente per logging */
  componentName?: string;
}

/**
 * State per ApiErrorBoundary
 */
interface ApiErrorBoundaryState {
  hasError: boolean;
  error: NormalizedError | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary avanzato per catch di errori runtime e API
 * Integrato con sistema di logging centralizzato
 *
 * @example
 * ```tsx
 * <ApiErrorBoundary componentName="ListsPage">
 *   <ListsManagementPage />
 * </ApiErrorBoundary>
 * ```
 */
export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    // Normalizza l'errore
    const normalized = normalizeError(error as any);

    return {
      hasError: true,
      error: normalized,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName = 'Unknown', onError } = this.props;

    // Log dettagliato
    logApiError(`ErrorBoundary:${componentName}`, error as any, {
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });

    // Callback personalizzata
    if (onError) {
      onError(error, errorInfo);
    }

    // TODO: Invio a servizio di error tracking
    // sendErrorToTracking(error, errorInfo, componentName);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Usa fallback personalizzato se fornito
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Fallback di default
      return <DefaultErrorFallback error={error} errorInfo={errorInfo} onRetry={this.handleRetry} />;
    }

    return children;
  }
}

/**
 * Fallback UI di default
 */
interface DefaultErrorFallbackProps {
  error: NormalizedError;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
}

function DefaultErrorFallback({ error, errorInfo, onRetry }: DefaultErrorFallbackProps): JSX.Element {
  const isDev = import.meta.env.DEV;

  // Icona in base al tipo di errore
  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return '🌐';
      case ErrorType.AUTHENTICATION:
        return '🔒';
      case ErrorType.AUTHORIZATION:
        return '⛔';
      case ErrorType.NOT_FOUND:
        return '🔍';
      case ErrorType.SERVER_ERROR:
        return '⚠️';
      case ErrorType.TIMEOUT:
        return '⏱️';
      default:
        return '❌';
    }
  };

  // Suggerimenti in base al tipo
  const getErrorSuggestions = (): string[] => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return [
          'Verifica la connessione internet',
          'Controlla che il server sia raggiungibile',
          'Prova a ricaricare la pagina',
        ];
      case ErrorType.AUTHENTICATION:
        return [
          'La sessione potrebbe essere scaduta',
          'Effettua nuovamente il login',
        ];
      case ErrorType.AUTHORIZATION:
        return [
          'Non hai i permessi necessari',
          'Contatta l\'amministratore di sistema',
        ];
      case ErrorType.SERVER_ERROR:
        return [
          'Il server sta avendo problemi',
          'Riprova tra qualche minuto',
          'Se il problema persiste, contatta il supporto',
        ];
      case ErrorType.TIMEOUT:
        return [
          'La richiesta ha impiegato troppo tempo',
          'Verifica la connessione',
          'Riprova',
        ];
      default:
        return ['Riprova l\'operazione', 'Se il problema persiste, contatta il supporto'];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-6xl">{getErrorIcon()}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Si è verificato un errore</h1>
            <p className="text-sm text-gray-500">
              Tipo: {error.type}
              {error.statusCode && ` (HTTP ${error.statusCode})`}
            </p>
          </div>
        </div>

        {/* Messaggio errore */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error.message}</p>
          <p className="text-xs text-red-600 mt-1">
            {error.timestamp.toLocaleString('it-IT')}
          </p>
        </div>

        {/* Suggerimenti */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Cosa puoi fare:</h2>
          <ul className="space-y-2">
            {getErrorSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-blue-600 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Riprova
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ↻ Ricarica Pagina
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ← Indietro
          </button>
        </div>

        {/* Dettagli tecnici (solo in dev) */}
        {isDev && errorInfo && (
          <details className="mt-6 p-4 bg-gray-100 rounded-lg">
            <summary className="cursor-pointer font-semibold text-gray-900">
              🔧 Dettagli Tecnici (solo sviluppo)
            </summary>
            <pre className="mt-3 text-xs text-gray-700 overflow-auto max-h-96">
              {JSON.stringify(
                {
                  error: {
                    type: error.type,
                    message: error.message,
                    statusCode: error.statusCode,
                    timestamp: error.timestamp,
                  },
                  componentStack: errorInfo.componentStack,
                  originalError: error.originalError,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * HOC per wrappare componenti con Error Boundary
 */
export function withApiErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ApiErrorBoundary componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} />
    </ApiErrorBoundary>
  );

  WrappedComponent.displayName = `withApiErrorBoundary(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ApiErrorBoundary;

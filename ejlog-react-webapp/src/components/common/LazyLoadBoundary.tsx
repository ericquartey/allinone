// ============================================================================
// EJLOG WMS - Lazy Load Boundary
// Suspense boundary ottimizzato per lazy loading
// ============================================================================

import React, { Suspense, type ReactNode } from 'react';

/**
 * Props per LazyLoadBoundary
 */
interface LazyLoadBoundaryProps {
  children: ReactNode;
  /** Fallback personalizzato (opzionale) */
  fallback?: ReactNode;
  /** Nome della route per logging (opzionale) */
  routeName?: string;
}

/**
 * Loading Skeleton ottimizzato
 * Fornisce feedback visivo durante il caricamento lazy
 */
export function LoadingSkeleton(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner animato */}
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>

        {/* Testo caricamento */}
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-700">Caricamento...</p>
          <p className="text-sm text-gray-500 mt-1">
            Preparazione interfaccia
          </p>
        </div>

        {/* Skeleton placeholder (opzionale per UX migliore) */}
        <div className="mt-8 w-96 mx-auto space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton minimalista per route rapide
 */
export function MinimalLoadingSkeleton(): JSX.Element {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="ml-3 text-gray-600">Caricamento...</span>
    </div>
  );
}

/**
 * Loading Skeleton con logo per branding
 */
export function BrandedLoadingSkeleton(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo o brand */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
            <span className="text-3xl font-bold text-blue-600">EJ</span>
          </div>
        </div>

        {/* Spinner */}
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>

        {/* Testo */}
        <div className="mt-6">
          <p className="text-xl font-bold text-gray-800">EjLog WMS</p>
          <p className="text-sm text-gray-600 mt-2">
            Caricamento modulo...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy Load Boundary con Suspense
 * Wrappa lazy loaded components con gestione loading state
 *
 * @example
 * ```tsx
 * <LazyLoadBoundary routeName="Lists">
 *   <ListsPage />
 * </LazyLoadBoundary>
 * ```
 */
export function LazyLoadBoundary({
  children,
  fallback,
  routeName,
}: LazyLoadBoundaryProps): JSX.Element {
  // Log caricamento route (solo in dev)
  React.useEffect(() => {
    if (import.meta.env.DEV && routeName) {
      console.log(`[LazyLoad] Loading route: ${routeName}`);
    }
  }, [routeName]);

  return (
    <Suspense fallback={fallback || <LoadingSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * HOC per wrappare automaticamente componenti lazy con boundary
 */
export function withLazyLoadBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    routeName?: string;
  }
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <LazyLoadBoundary
      fallback={options?.fallback}
      routeName={options?.routeName}
    >
      <Component {...props} />
    </LazyLoadBoundary>
  );

  WrappedComponent.displayName = `withLazyLoadBoundary(${options?.routeName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Performance observer per lazy loading
 * Traccia timing di caricamento delle route
 */
export class LazyLoadMetrics {
  private static metrics = new Map<string, number>();

  static start(routeName: string): void {
    this.metrics.set(routeName, performance.now());
  }

  static end(routeName: string): number | undefined {
    const startTime = this.metrics.get(routeName);
    if (!startTime) return undefined;

    const duration = performance.now() - startTime;
    this.metrics.delete(routeName);

    if (import.meta.env.DEV) {
      console.log(`[LazyLoad] ${routeName} loaded in ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  static clear(): void {
    this.metrics.clear();
  }
}

export default LazyLoadBoundary;

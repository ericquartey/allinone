// ============================================================================
// EJLOG WMS - Loading Component
// Loading spinner with configurable size and optional text
// ============================================================================

// Loading sizes
export type LoadingSize = 'sm' | 'md' | 'lg';

// Loading props interface
export interface LoadingProps {
  size?: LoadingSize;
  text?: string;
}

/**
 * Loading spinner component
 *
 * @example
 * ```tsx
 * <Loading size="md" text="Caricamento dati..." />
 * ```
 */
function Loading({ size = 'md', text = '' }: LoadingProps): JSX.Element {
  const sizes: Record<LoadingSize, string> = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizes[size]} border-4 border-gray-200 border-t-ferretto-red rounded-full animate-spin`}
        role="status"
        aria-label={text || 'Caricamento in corso'}
      />
      {text && (
        <p className="mt-4 text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
}

export default Loading;

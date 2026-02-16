// ============================================================================
// EJLOG WMS - CapacityIndicator Component
// Visualizzatore capacità locazione per operazioni putaway
// ============================================================================

import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export interface LocationCapacity {
  locationCode: string;
  currentWeight?: number;
  maxWeight?: number;
  currentVolume?: number;
  maxVolume?: number;
  currentItems?: number;
  maxItems?: number;
  utilizationPercentage: number;
}

export interface CapacityIndicatorProps {
  capacity: LocationCapacity;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * CapacityIndicator Component
 *
 * Visualizza la capacità di una locazione con:
 * - Progress bar colorata (verde/giallo/rosso in base a utilizzo)
 * - Percentuale utilizzo
 * - Dettagli peso/volume/items (opzionale)
 * - Warning icon se capacità >80%
 *
 * Colori:
 * - Verde (0-70%): Capacità OK
 * - Giallo (70-90%): Attenzione
 * - Rosso (90-100%): Quasi piena
 *
 * @example
 * ```tsx
 * <CapacityIndicator
 *   capacity={{
 *     locationCode: 'A-01-01',
 *     currentWeight: 850,
 *     maxWeight: 1000,
 *     utilizationPercentage: 85
 *   }}
 *   showDetails
 * />
 * ```
 */
export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  capacity,
  showDetails = false,
  compact = false,
  className = '',
}) => {
  const { utilizationPercentage } = capacity;

  // Determina colore in base a utilizzo
  const getColorClass = () => {
    if (utilizationPercentage >= 90) return 'bg-red-500';
    if (utilizationPercentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColorClass = () => {
    if (utilizationPercentage >= 90) return 'text-red-700';
    if (utilizationPercentage >= 70) return 'text-yellow-700';
    return 'text-green-700';
  };

  const getBorderColorClass = () => {
    if (utilizationPercentage >= 90) return 'border-red-500';
    if (utilizationPercentage >= 70) return 'border-yellow-500';
    return 'border-green-500';
  };

  const getIcon = () => {
    if (utilizationPercentage >= 90)
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (utilizationPercentage >= 70)
      return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };

  // Compact Mode: solo progress bar senza dettagli
  if (compact) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700">Capacità</span>
          <span className={`font-bold ${getTextColorClass()}`}>
            {utilizationPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColorClass()}`}
            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // Full Mode: dettagli completi
  return (
    <div className={`border-2 ${getBorderColorClass()} rounded-lg p-4 bg-white ${className}`}>
      {/* Header con icona */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold text-gray-900">
            Capacità Locazione {capacity.locationCode}
          </h3>
        </div>
        <span className={`text-2xl font-bold ${getTextColorClass()}`}>
          {utilizationPercentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-500 ${getColorClass()}`}
            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Dettagli Capacità */}
      {showDetails && (
        <div className="space-y-2 text-sm">
          {/* Peso */}
          {capacity.maxWeight !== undefined && (
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Peso (kg)</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(capacity.currentWeight)} / {formatNumber(capacity.maxWeight)}
              </span>
            </div>
          )}

          {/* Volume */}
          {capacity.maxVolume !== undefined && (
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Volume (m³)</span>
              <span className="font-semibold text-gray-900">
                {formatNumber(capacity.currentVolume)} / {formatNumber(capacity.maxVolume)}
              </span>
            </div>
          )}

          {/* Items Count */}
          {capacity.maxItems !== undefined && (
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 font-medium">Articoli</span>
              <span className="font-semibold text-gray-900">
                {capacity.currentItems || 0} / {capacity.maxItems}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Warning Message */}
      {utilizationPercentage >= 90 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Attenzione:</strong> Capacità quasi esaurita. Considera locazioni alternative.
        </div>
      )}

      {utilizationPercentage >= 70 && utilizationPercentage < 90 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <strong>Nota:</strong> Capacità in esaurimento. Monitora disponibilità.
        </div>
      )}
    </div>
  );
};

export default CapacityIndicator;

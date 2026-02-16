// ============================================================================
// EJLOG WMS - LocationSuggestion Component
// Suggerimenti locazione ottimale per operazioni putaway
// ============================================================================

import React from 'react';
import { MapPin, Star, TrendingUp, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import CapacityIndicator, { LocationCapacity } from './CapacityIndicator';

export interface LocationSuggestion {
  locationCode: string;
  locationDescription?: string;
  zone?: string;
  areaId?: string;
  score: number; // 0-100
  capacity: LocationCapacity;
  distance?: number; // metri dalla posizione corrente
  isPrimary?: boolean; // Suggerimento principale (algoritmo ABC)
  reasons: string[]; // Motivazioni suggerimento
  warnings?: string[]; // Eventuali warning
}

export interface LocationSuggestionProps {
  suggestion: LocationSuggestion;
  onSelect?: () => void;
  selected?: boolean;
  showCapacity?: boolean;
  className?: string;
}

/**
 * LocationSuggestion Component
 *
 * Card suggerimento locazione per putaway con:
 * - Score (0-100) con stelle visuali
 * - Motivi del suggerimento
 * - Capacità residua con CapacityIndicator
 * - Distanza dalla posizione corrente
 * - Badge "Primary" se suggerimento principale
 * - Warning se presenti problemi
 *
 * Algoritmo Scoring considera:
 * - Classificazione ABC articolo
 * - Capacità residua locazione
 * - Zona ottimale (picking/reserve/buffer)
 * - Distanza da posizione corrente
 * - Rotazione articolo
 *
 * @example
 * ```tsx
 * <LocationSuggestion
 *   suggestion={{
 *     locationCode: 'A-01-05',
 *     score: 95,
 *     isPrimary: true,
 *     capacity: {...},
 *     reasons: ['Classificazione ABC: A', 'Zona picking ottimale']
 *   }}
 *   onSelect={handleSelectLocation}
 *   showCapacity
 * />
 * ```
 */
export const LocationSuggestion: React.FC<LocationSuggestionProps> = ({
  suggestion,
  onSelect,
  selected = false,
  showCapacity = true,
  className = '',
}) => {
  const { score, isPrimary } = suggestion;

  // Calcola numero stelle (0-5) in base a score
  const starCount = Math.round((score / 100) * 5);

  // Colore score in base a valore
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getBorderColor = () => {
    if (selected) return 'border-blue-500 ring-4 ring-blue-200';
    if (isPrimary) return 'border-green-500';
    if (score >= 80) return 'border-green-300';
    if (score >= 60) return 'border-yellow-300';
    return 'border-gray-300';
  };

  return (
    <div
      className={`
        relative border-2 rounded-lg p-4 transition-all duration-200
        ${getBorderColor()}
        ${selected ? 'bg-blue-50 shadow-lg' : 'bg-white shadow-sm hover:shadow-md'}
        ${onSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onSelect}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            <Zap className="w-3 h-3" />
            Suggerita
          </span>
        </div>
      )}

      {/* Header: Location Code + Score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{suggestion.locationCode}</h3>
            {suggestion.locationDescription && (
              <p className="text-sm text-gray-600">{suggestion.locationDescription}</p>
            )}
            {suggestion.zone && (
              <p className="text-xs text-gray-500">
                Zona: <span className="font-medium">{suggestion.zone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor()}`}>{score}</div>
          <div className="flex items-center gap-0.5 justify-end mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < starCount ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reasons (Motivazioni) */}
      {suggestion.reasons && suggestion.reasons.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-xs font-semibold text-gray-700 mb-2">Perché questa locazione:</p>
          {suggestion.reasons.map((reason, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Distance */}
      {suggestion.distance !== undefined && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>
            Distanza: <span className="font-semibold">{suggestion.distance}m</span>
          </span>
        </div>
      )}

      {/* Capacity Indicator */}
      {showCapacity && (
        <div className="mb-3">
          <CapacityIndicator capacity={suggestion.capacity} compact />
        </div>
      )}

      {/* Warnings */}
      {suggestion.warnings && suggestion.warnings.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-1">
          {suggestion.warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span className="text-yellow-800">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Select Indicator */}
      {selected && (
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Selezionata
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSuggestion;

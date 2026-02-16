// ============================================================================
// EJLOG WMS - ReservationCard Component
// Card per visualizzare i dettagli di una prenotazione durante picking RF
// ============================================================================

import React from 'react';
import { Package, MapPin, Hash, TrendingUp } from 'lucide-react';

export interface Reservation {
  id: string;
  itemCode: string;
  itemDescription: string;
  requestedQty: number;
  pickedQty: number;
  remainingQty: number;
  locationCode: string;
  locationDescription?: string;
  udcBarcode?: string;
  unit?: string;
  lot?: string;
  serialNumber?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface ReservationCardProps {
  reservation: Reservation;
  showProgress?: boolean;
  className?: string;
  onSelect?: () => void;
  selected?: boolean;
}

/**
 * ReservationCard Component
 *
 * Mostra i dettagli di una prenotazione picking con:
 * - Informazioni articolo (codice, descrizione)
 * - Quantità richiesta vs già prelevata
 * - Locazione di prelievo
 * - UDC se presente
 * - Progress bar se showProgress=true
 *
 * @example
 * ```tsx
 * <ReservationCard
 *   reservation={reservation}
 *   showProgress
 *   selected={selectedId === reservation.id}
 *   onSelect={() => setSelectedId(reservation.id)}
 * />
 * ```
 */
export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  showProgress = true,
  className = '',
  onSelect,
  selected = false,
}) => {
  const progressPercentage = reservation.requestedQty > 0
    ? (reservation.pickedQty / reservation.requestedQty) * 100
    : 0;

  const statusColors = {
    PENDING: 'border-gray-300 bg-white',
    IN_PROGRESS: 'border-blue-500 bg-blue-50',
    COMPLETED: 'border-green-500 bg-green-50',
    CANCELLED: 'border-red-500 bg-red-50',
  };

  const statusLabels = {
    PENDING: 'Da Fare',
    IN_PROGRESS: 'In Corso',
    COMPLETED: 'Completata',
    CANCELLED: 'Annullata',
  };

  return (
    <div
      className={`
        border-2 rounded-lg p-4 transition-all duration-200
        ${statusColors[reservation.status]}
        ${selected ? 'ring-4 ring-blue-300 shadow-lg' : 'shadow-sm hover:shadow-md'}
        ${onSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onSelect}
    >
      {/* Header: Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${
              reservation.status === 'PENDING'
                ? 'bg-gray-200 text-gray-700'
                : reservation.status === 'IN_PROGRESS'
                ? 'bg-blue-200 text-blue-800'
                : reservation.status === 'COMPLETED'
                ? 'bg-green-200 text-green-800'
                : 'bg-red-200 text-red-800'
            }
          `}
        >
          {statusLabels[reservation.status]}
        </span>
        {reservation.id && (
          <span className="text-xs text-gray-500">#{reservation.id}</span>
        )}
      </div>

      {/* Item Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <Package className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {reservation.itemCode}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {reservation.itemDescription}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">{reservation.locationCode}</span>
          {reservation.locationDescription && (
            <span className="text-gray-500">- {reservation.locationDescription}</span>
          )}
        </div>

        {/* UDC if present */}
        {reservation.udcBarcode && (
          <div className="flex items-center gap-2 text-sm">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">UDC: {reservation.udcBarcode}</span>
          </div>
        )}
      </div>

      {/* Quantity Information */}
      <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Quantità</span>
          </div>
          <span className="text-sm text-gray-600">
            {reservation.unit || 'PZ'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Richiesta</div>
            <div className="text-lg font-bold text-gray-900">
              {reservation.requestedQty}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Prelevata</div>
            <div className="text-lg font-bold text-blue-600">
              {reservation.pickedQty}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Rimanente</div>
            <div className="text-lg font-bold text-orange-600">
              {reservation.remainingQty}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Progresso</span>
            <span className="font-semibold">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercentage === 100
                  ? 'bg-green-500'
                  : progressPercentage > 0
                  ? 'bg-blue-500'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Additional Info (Lot, Serial) */}
      {(reservation.lot || reservation.serialNumber) && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
          {reservation.lot && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Lotto:</span> {reservation.lot}
            </div>
          )}
          {reservation.serialNumber && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">S/N:</span> {reservation.serialNumber}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationCard;

// ============================================================================
// EJLOG WMS - Reservation Queue Component
// Coda prenotazioni attive per baia operatore
// ============================================================================

import { FC, useMemo, useState } from 'react';
import {
  Reservation,
  ReservationPriority,
  ReservationStatus,
  OperationType,
  getPriorityColor,
  getOperationTypeLabel,
  getOperationTypeIcon,
  formatDuration,
} from '../../services/api/bayApi';
import { Clock, Package, MapPin, User, AlertCircle, Filter } from 'lucide-react';

interface ReservationQueueProps {
  reservations: Reservation[];
  activeReservationId?: number | null;
  onReservationSelect?: (reservation: Reservation) => void;
  isLoading?: boolean;
}

/**
 * Coda prenotazioni per baia operatore
 *
 * Mostra:
 * - Lista prenotazioni ordinate per priorità
 * - Filtri per tipo/priorità
 * - Contatori real-time
 * - Evidenziazione prenotazione attiva
 */
export const ReservationQueue: FC<ReservationQueueProps> = ({
  reservations,
  activeReservationId,
  onReservationSelect,
  isLoading = false,
}) => {
  const [filterType, setFilterType] = useState<OperationType | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<ReservationPriority | 'ALL'>('ALL');

  // Filtra prenotazioni
  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    if (filterType !== 'ALL') {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    if (filterPriority !== 'ALL') {
      filtered = filtered.filter((r) => r.priority === filterPriority);
    }

    // Ordina per priorità e data
    return filtered.sort((a, b) => {
      // Prima per priorità
      const priorityOrder = {
        [ReservationPriority.URGENT]: 0,
        [ReservationPriority.HIGH]: 1,
        [ReservationPriority.NORMAL]: 2,
        [ReservationPriority.LOW]: 3,
      };

      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Poi per data creazione (più vecchie prima)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [reservations, filterType, filterPriority]);

  // Statistiche
  const stats = useMemo(() => {
    return {
      total: reservations.length,
      urgent: reservations.filter((r) => r.priority === ReservationPriority.URGENT).length,
      high: reservations.filter((r) => r.priority === ReservationPriority.HIGH).length,
      inProgress: reservations.filter((r) => r.status === ReservationStatus.IN_PROGRESS).length,
      pending: reservations.filter((r) => r.status === ReservationStatus.PENDING).length,
    };
  }, [reservations]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Coda Prenotazioni
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {stats.total} totali
            </span>
            {stats.urgent > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 animate-pulse">
                {stats.urgent} urgenti
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase">In attesa</div>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
            <div className="text-xs text-blue-600 uppercase">In corso</div>
            <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
          </div>
          <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-200">
            <div className="text-xs text-red-600 uppercase">Alta priorità</div>
            <div className="text-2xl font-bold text-red-700">{stats.high}</div>
          </div>
          <div className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
            <div className="text-xs text-orange-600 uppercase">Urgenti</div>
            <div className="text-2xl font-bold text-orange-700">{stats.urgent}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-500" />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ALL">Tutti i tipi</option>
            <option value={OperationType.PICKING}>Prelievo</option>
            <option value={OperationType.PUTAWAY}>Stoccaggio</option>
            <option value={OperationType.REPLENISHMENT}>Rifornimento</option>
            <option value={OperationType.TRANSFER}>Trasferimento</option>
            <option value={OperationType.INVENTORY}>Inventario</option>
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ALL">Tutte le priorità</option>
            <option value={ReservationPriority.URGENT}>Urgente</option>
            <option value={ReservationPriority.HIGH}>Alta</option>
            <option value={ReservationPriority.NORMAL}>Normale</option>
            <option value={ReservationPriority.LOW}>Bassa</option>
          </select>

          <div className="text-sm text-gray-500">
            {filteredReservations.length} di {reservations.length}
          </div>
        </div>
      </div>

      {/* Reservation list */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredReservations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessuna prenotazione disponibile</p>
          </div>
        ) : (
          filteredReservations.map((reservation) => {
            const isActive = reservation.id === activeReservationId;
            const priorityColors = getPriorityColor(reservation.priority);

            return (
              <div
                key={reservation.id}
                className={`
                  px-6 py-4 cursor-pointer transition-all
                  ${isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}
                `}
                onClick={() => onReservationSelect?.(reservation)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Type icon */}
                    <div className="text-3xl">
                      {getOperationTypeIcon(reservation.type)}
                    </div>

                    <div>
                      {/* Code */}
                      <div className="font-mono text-sm font-bold text-gray-900">
                        {reservation.code}
                      </div>
                      {/* Type */}
                      <div className="text-sm text-gray-600">
                        {getOperationTypeLabel(reservation.type)}
                      </div>
                    </div>
                  </div>

                  {/* Priority badge */}
                  <span
                    className={`
                      inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase border-2
                      ${priorityColors}
                    `}
                  >
                    {reservation.priority === ReservationPriority.URGENT && '🔥 '}
                    {reservation.priority}
                  </span>
                </div>

                {/* Item info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {reservation.itemCode}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {reservation.itemDescription}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {reservation.quantity} {reservation.uom}
                  </div>
                </div>

                {/* Locations */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {reservation.sourceLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-xs text-gray-500">Da:</div>
                        <div className="font-semibold text-gray-900">
                          {reservation.sourceLocation}
                        </div>
                      </div>
                    </div>
                  )}
                  {reservation.targetLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-xs text-gray-500">A:</div>
                        <div className="font-semibold text-gray-900">
                          {reservation.targetLocation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    {reservation.operatorName && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {reservation.operatorName}
                      </div>
                    )}
                    {reservation.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{formatDuration(reservation.estimatedDuration)}
                      </div>
                    )}
                  </div>

                  {/* Creation time */}
                  <div>
                    Creata: {new Date(reservation.createdAt).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    OPERAZIONE ATTIVA
                  </div>
                )}

                {/* Notes */}
                {reservation.notes && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-800">{reservation.notes}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReservationQueue;

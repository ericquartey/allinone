import { useReservation } from '../../hooks/useReservations';
import Modal from '../common/Modal';
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * ReservationDetailModal - Modal per visualizzare dettagli prenotazione
 *
 * Features:
 * - Informazioni generali
 * - Progress bar quantità
 * - History/audit log
 */
function ReservationDetailModal({  isOpen, onClose, reservationId  }: any): JSX.Element {
  const { data: reservation, isLoading, isError } = useReservation(reservationId);

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Dettaglio Prenotazione" size="2xl">
        <div className="flex items-center justify-center p-12">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-ferretto-red" />
        </div>
      </Modal>
    );
  }

  if (isError || !reservation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Dettaglio Prenotazione" size="2xl">
        <div className="p-6 text-center text-red-600">
          Errore nel caricamento dei dettagli della prenotazione
        </div>
      </Modal>
    );
  }

  const progressPercentage = (reservation.quantityMoved / reservation.quantityReserved) * 100;

  const statusColors = {
    ATTIVA: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETATA: 'bg-gray-100 text-gray-800',
    ANNULLATA: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    ATTIVA: 'Attiva',
    IN_PROGRESS: 'In Corso',
    COMPLETATA: 'Completata',
    ANNULLATA: 'Annullata',
  };

  const actionLabels = {
    CREATED: 'Creata',
    ASSIGNED: 'Assegnata',
    STARTED: 'Iniziata',
    PARTIAL_MOVE: 'Movimentazione parziale',
    COMPLETED: 'Completata',
    CANCELLED: 'Annullata',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dettaglio Prenotazione" size="2xl">
      <div className="p-6 space-y-6">
        {/* General Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informazioni Generali
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">ID Prenotazione</div>
              <div className="font-semibold font-mono">{reservation.id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Stato</div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[reservation.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {statusLabels[reservation.status] || reservation.status}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Articolo</div>
              <div className="font-semibold">{reservation.articleCode}</div>
              <div className="text-sm text-gray-600">{reservation.articleDescription}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">UDC</div>
              <div className="font-semibold font-mono">{reservation.udc}</div>
              {reservation.udcBarcode && (
                <div className="text-sm text-gray-600">Barcode: {reservation.udcBarcode}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quantity Progress */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantità</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-semibold">
                {reservation.quantityMoved} / {reservation.quantityReserved}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-ferretto-red h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              {Math.round(progressPercentage)}% completato
            </div>
          </div>
        </div>

        {/* Locations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Locazioni</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Locazione Sorgente</div>
              <div className="font-semibold font-mono bg-gray-100 px-3 py-2 rounded">
                {reservation.locationSource}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Locazione Destinazione</div>
              <div className="font-semibold font-mono bg-gray-100 px-3 py-2 rounded">
                {reservation.locationDestination}
              </div>
            </div>
          </div>
        </div>

        {/* List Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista Associata</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">ID Lista</div>
                <div className="font-semibold">{reservation.listId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Descrizione</div>
                <div className="font-semibold">{reservation.listDescription}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Priorità</div>
                <div className="font-semibold">{reservation.priority}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Operatore Assegnato</div>
                <div className="font-semibold">{reservation.assignedTo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {reservation.notes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Note</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{reservation.notes}</p>
            </div>
          </div>
        )}

        {/* History/Audit Log */}
        {reservation.history && reservation.history.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Storico Operazioni
            </h3>
            <div className="space-y-3">
              {reservation.history.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex-shrink-0">
                    <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900">
                        {actionLabels[event.action] || event.action}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString('it-IT')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{event.details}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Utente: {event.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReservationDetailModal;

// ============================================================================
// EJLOG WMS - Picking RF Page (Enhanced)
// Pagina RF per operazioni di picking con workflow step-by-step e barcode scanner
// Versione Enhanced con PickingWorkflow component
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PackageIcon, ArrowLeft, RefreshCw } from 'lucide-react';
import PickingWorkflow from '../../components/operations/PickingWorkflow';
import { Reservation } from '../../components/operations/ReservationCard';
import {
  useConfirmReservationMutation,
  useGetListsQuery,
  useLazyGetListRowsQuery,
} from '../../services/api';

/**
 * PickingRFPage Component
 *
 * Pagina RF per esecuzione picking con workflow completo:
 * 1. Selezione lista da processare
 * 2. Workflow step-by-step con PickingWorkflow component
 * 3. Gestione prenotazioni e conferma prelievi
 * 4. Progress tracking e feedback real-time
 *
 * Query Params:
 * - listId: ID della lista da processare (opzionale, può essere scansionato)
 *
 * @example
 * URL: /rf/picking?listId=PICK-001
 */
const PickingRFPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listIdParam = searchParams.get('listId');

  const [listId, setListId] = useState<string | null>(listIdParam);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [confirmReservation] = useConfirmReservationMutation();
  const [getListRows] = useLazyGetListRowsQuery();

  // Carica liste picking reali (listType=1 = PICKING)
  const { data: listsData, isLoading: isLoadingAvailableLists } = useGetListsQuery({
    limit: 20,
    offset: 0,
    tipoLista: 1, // Solo liste di tipo PICKING
  });

  // Carica lista se listId presente in query params
  useEffect(() => {
    if (listIdParam) {
      loadList(listIdParam);
    }
  }, [listIdParam]);

  /**
   * Carica lista e trasforma righe in prenotazioni REALI dal database
   */
  const loadList = async (code: string) => {
    setIsLoadingList(true);

    try {
      // Trova la lista dal code usando listsData
      const list = listsData?.data.find((l) => l.code === code);
      if (!list) {
        toast.error(`Lista ${code} non trovata`);
        setListId(null);
        setIsLoadingList(false);
        return;
      }

      // Carica le righe della lista usando l'ID
      const result = await getListRows({ id: list.id, limit: 100 }).unwrap();

      if (!result || !result.data || result.data.length === 0) {
        toast.error('Lista vuota o senza righe');
        setListId(null);
        setIsLoadingList(false);
        return;
      }

      // Trasforma ItemListRow REALI in Reservation
      const realReservations: Reservation[] = result.data.map((row) => ({
        id: row.id?.toString() || `RES-${row.rowNumber}`,
        itemCode: row.itemCode || '',
        itemDescription: row.description || row.articleDescription || '',
        requestedQty: row.requestedQuantity || 0,
        pickedQty: row.movedQuantity || 0,
        remainingQty: (row.requestedQuantity || 0) - (row.movedQuantity || 0),
        locationCode: 'N/A', // TODO: aggiungere location se disponibile nel backend
        locationDescription: undefined,
        udcBarcode: undefined,
        unit: 'PZ',
        lot: row.lot,
        serialNumber: row.serialNumber,
        status: row.completed
          ? 'COMPLETED'
          : row.unfulfillable
          ? 'COMPLETED' // Unfulfillable considerato come completato
          : (row.movedQuantity || 0) > 0
          ? 'IN_PROGRESS'
          : 'PENDING',
      }));

      setReservations(realReservations);
      setListId(code);
      toast.success(`Lista ${code} caricata - ${realReservations.length} righe reali dal database`);
    } catch (error) {
      toast.error('Errore nel caricamento della lista');
      console.error('Load list error:', error);
      setListId(null);
    } finally {
      setIsLoadingList(false);
    }
  };

  /**
   * Conferma prelievo di una prenotazione
   */
  const handlePickComplete = async (
    reservationId: string,
    quantity: number,
    udcBarcode: string
  ): Promise<void> => {
    try {
      // Chiamata API per confermare prenotazione
      // await confirmReservation({ id: reservationId, quantity, udcBarcode }).unwrap();

      // Mock: aggiorna stato locale
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                pickedQty: r.pickedQty + quantity,
                remainingQty: r.remainingQty - quantity,
                status: r.remainingQty - quantity === 0 ? 'COMPLETED' : 'IN_PROGRESS',
              }
            : r
        )
      );

      toast.success(`Prelevati ${quantity} ${reservations.find((r) => r.id === reservationId)?.unit || 'PZ'}`);
    } catch (error) {
      toast.error('Errore durante la conferma del prelievo');
      throw error; // Propaga errore per gestione in PickingWorkflow
    }
  };

  /**
   * Workflow completato - tutte le prenotazioni processate
   */
  const handleWorkflowComplete = () => {
    toast.success('Picking completato! Tutte le prenotazioni sono state processate.', {
      duration: 4000,
    });

    setTimeout(() => {
      navigate('/lists');
    }, 2000);
  };

  /**
   * Annulla operazione e torna alle liste
   */
  const handleCancel = () => {
    if (confirm('Vuoi annullare l\'operazione di picking?')) {
      navigate('/lists');
    }
  };

  /**
   * Reset e ricarica lista
   */
  const handleReloadList = () => {
    if (listId) {
      loadList(listId);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/operations/lists')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Torna a Operazioni Liste"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <PackageIcon className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold">Picking RF</h1>
                  <p className="text-sm text-gray-400">Operazione con Barcode Scanner</p>
                </div>
              </div>
            </div>

            {listId && (
              <button
                onClick={handleReloadList}
                disabled={isLoadingList}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                title="Ricarica lista"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
                Ricarica
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoadingList && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Caricamento lista...</p>
          </div>
        )}

        {/* Lista non selezionata: Scan per iniziare */}
        {!listId && !isLoadingList && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center">
              <PackageIcon className="w-20 h-20 text-blue-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">Inizia Picking RF</h2>
              <p className="text-gray-400 mb-8">
                Scansiona il barcode di una lista picking per iniziare l'operazione
              </p>

              {/* Liste Picking Disponibili dal Database */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-gray-500 text-left">
                  Liste Picking Disponibili:
                  {listsData && ` (${listsData.data.length} liste)`}
                </p>

                {/* Loading state */}
                {isLoadingAvailableLists && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-400 mt-2">Caricamento liste...</p>
                  </div>
                )}

                {/* Liste reali dal database */}
                {!isLoadingAvailableLists && listsData?.data && listsData.data.length > 0 ? (
                  listsData.data.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => loadList(list.code)}
                      className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold">{list.code}</div>
                        <div className="text-sm text-gray-400">
                          {list.description || 'Picking List'} - {list.totalRows} righe - {list.status}
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-gray-400 transform rotate-180" />
                    </button>
                  ))
                ) : (
                  !isLoadingAvailableLists && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Nessuna lista picking disponibile</p>
                    </div>
                  )
                )}
              </div>

              <p className="text-xs text-gray-500">
                Usa uno scanner barcode per selezionare rapidamente una lista
              </p>
            </div>
          </div>
        )}

        {/* Picking Workflow Attivo */}
        {listId && !isLoadingList && reservations.length > 0 && (
          <PickingWorkflow
            listId={listId}
            reservations={reservations}
            onPickComplete={handlePickComplete}
            onWorkflowComplete={handleWorkflowComplete}
            onCancel={handleCancel}
          />
        )}

        {/* Lista vuota */}
        {listId && !isLoadingList && reservations.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-900 bg-opacity-50 border-2 border-yellow-600 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-yellow-200 mb-2">Lista Vuota</h3>
              <p className="text-yellow-300 mb-4">
                La lista {listId} non contiene prenotazioni da processare.
              </p>
              <button
                onClick={() => setListId(null)}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Seleziona Altra Lista
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 py-3">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-xs text-gray-500 text-center">
            RF Picking Mode - Usa scanner barcode hardware per operazioni rapide
          </p>
        </div>
      </div>
    </div>
  );
};

export default PickingRFPage;

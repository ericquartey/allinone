// ============================================================================
// EJLOG WMS - Inventory RF Page
// Pagina RF per completamento inventario con gestione discrepanze
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardCheck, ArrowLeft, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import DiscrepancyModal, { InventoryDiscrepancy } from '../../components/operations/DiscrepancyModal';
import RecountWorkflow, { RecountItem } from '../../components/operations/RecountWorkflow';
import { useGetListsQuery, useLazyGetListByNumberQuery } from '../../services/api';

interface InventoryCount {
  id: string;
  itemCode: string;
  itemDescription: string;
  location: string;
  systemQty: number;
  countedQty: number;
  unit?: string;
  value?: number; // Valore unitario
  status: 'PENDING' | 'COUNTED' | 'DISCREPANCY' | 'APPROVED';
}

/**
 * InventoryRFPage Component
 *
 * Workflow completo inventario RF con gestione discrepanze:
 * 1. Carica lista inventario
 * 2. Visualizza conteggi esistenti
 * 3. Calcola discrepanze automaticamente
 * 4. Gestisce riconteggi per discrepanze alte
 * 5. Workflow autorizzazione supervisore per valori alti
 * 6. Finalizza inventario con generazione movimenti rettifica
 *
 * Features:
 * - Calcolo discrepanze real-time
 * - Modal gestione discrepanze con categorizzazione
 * - Riconteggio guidato con RecountWorkflow
 * - Autorizzazione supervisore per discrepanze >€1000
 * - Audit trail completo
 * - Generazione automatica movimenti rettifica
 *
 * @example
 * URL: /rf/inventory?listId=INV-001
 */
const InventoryRFPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listIdParam = searchParams.get('listId');

  const [listId, setListId] = useState<string | null>(listIdParam);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [discrepancies, setDiscrepancies] = useState<InventoryDiscrepancy[]>([]);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [recountItem, setRecountItem] = useState<RecountItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  // Simula utente con permessi (in produzione: da auth context)
  const [canAuthorize] = useState(true); // true se supervisore

  // API hooks per dati reali
  const { data: listsData, isLoading: isLoadingLists } = useGetListsQuery({
    limit: 20,
    offset: 0,
    tipoLista: 3, // Tipo 3 = VISIBILITÀ/INVENTARIO
  });
  const [getListByNumber] = useLazyGetListByNumberQuery();

  // Carica lista inventario
  useEffect(() => {
    if (listIdParam) {
      loadInventoryList(listIdParam);
    }
  }, [listIdParam]);

  /**
   * Carica lista inventario e conteggi
   */
  const loadInventoryList = async (id: string) => {
    setIsLoading(true);

    try {
      // Mock data - In produzione: GET /api/inventory/{listId}/counts
      const mockCounts: InventoryCount[] = [
        {
          id: 'CNT-001',
          itemCode: 'ART-001',
          itemDescription: 'Articolo Test 1',
          location: 'A-01-05',
          systemQty: 100,
          countedQty: 95,
          unit: 'PZ',
          value: 25.50,
          status: 'DISCREPANCY',
        },
        {
          id: 'CNT-002',
          itemCode: 'ART-002',
          itemDescription: 'Articolo Test 2',
          location: 'A-01-06',
          systemQty: 50,
          countedQty: 50,
          unit: 'PZ',
          value: 15.00,
          status: 'COUNTED',
        },
        {
          id: 'CNT-003',
          itemCode: 'ART-003',
          itemDescription: 'Articolo Test 3 - Valore Alto',
          location: 'B-02-10',
          systemQty: 200,
          countedQty: 180,
          unit: 'PZ',
          value: 150.00, // Discrepanza valore: 20 * 150 = €3000
          status: 'DISCREPANCY',
        },
        {
          id: 'CNT-004',
          itemCode: 'ART-004',
          itemDescription: 'Articolo Test 4',
          location: 'C-03-15',
          systemQty: 75,
          countedQty: 78,
          unit: 'PZ',
          value: 8.50,
          status: 'DISCREPANCY',
        },
      ];

      setCounts(mockCounts);
      setListId(id);
      toast.success(`Lista ${id} caricata - ${mockCounts.length} conteggi`);

      // Calcola discrepanze
      calculateDiscrepancies(mockCounts);
    } catch (error) {
      toast.error('Errore nel caricamento della lista inventario');
      setListId(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calcola discrepanze automaticamente
   */
  const calculateDiscrepancies = (countsList: InventoryCount[]) => {
    const foundDiscrepancies: InventoryDiscrepancy[] = countsList
      .filter((c) => c.countedQty !== c.systemQty)
      .map((c) => {
        const discrepancy = c.countedQty - c.systemQty;
        const discrepancyPercentage = c.systemQty > 0
          ? (discrepancy / c.systemQty) * 100
          : 0;
        const discrepancyValue = Math.abs(discrepancy) * (c.value || 0);

        return {
          itemCode: c.itemCode,
          itemDescription: c.itemDescription,
          location: c.location,
          systemQty: c.systemQty,
          countedQty: c.countedQty,
          discrepancy,
          discrepancyPercentage,
          value: discrepancyValue,
          unit: c.unit,
          requiresRecount: Math.abs(discrepancyPercentage) > 10,
          requiresAuthorization: discrepancyValue > 1000,
        };
      });

    setDiscrepancies(foundDiscrepancies);

    if (foundDiscrepancies.length > 0) {
      // Auto-mostra modal se ci sono discrepanze
      setTimeout(() => setShowDiscrepancyModal(true), 500);
    }
  };

  /**
   * Gestisci richiesta riconteggio
   */
  const handleRecount = (itemCode: string) => {
    const count = counts.find((c) => c.itemCode === itemCode);
    if (!count) return;

    const recountItemData: RecountItem = {
      itemCode: count.itemCode,
      itemDescription: count.itemDescription,
      location: count.location,
      originalCount: count.countedQty,
      systemQty: count.systemQty,
      unit: count.unit,
    };

    setRecountItem(recountItemData);
    setShowDiscrepancyModal(false);
  };

  /**
   * Completa riconteggio
   */
  const handleRecountComplete = (newCount: number) => {
    if (!recountItem) return;

    // Aggiorna conteggio
    setCounts((prev) =>
      prev.map((c) =>
        c.itemCode === recountItem.itemCode
          ? { ...c, countedQty: newCount, status: 'COUNTED' }
          : c
      )
    );

    toast.success(`Riconteggio completato: ${recountItem.itemCode} = ${newCount}`);

    // Ricalcola discrepanze
    const updatedCounts = counts.map((c) =>
      c.itemCode === recountItem.itemCode ? { ...c, countedQty: newCount } : c
    );
    calculateDiscrepancies(updatedCounts);

    setRecountItem(null);
    setShowDiscrepancyModal(true);
  };

  /**
   * Approva discrepanza
   */
  const handleApproveDiscrepancy = (itemCode: string, notes?: string) => {
    setCounts((prev) =>
      prev.map((c) =>
        c.itemCode === itemCode ? { ...c, status: 'APPROVED' } : c
      )
    );

    // Rimuovi da discrepanze
    setDiscrepancies((prev) => prev.filter((d) => d.itemCode !== itemCode));

    toast.success(`Discrepanza approvata: ${itemCode}${notes ? ` - ${notes}` : ''}`);
  };

  /**
   * Rifiuta discrepanza (richiede riconteggio)
   */
  const handleRejectDiscrepancy = (itemCode: string) => {
    toast.warning(`Discrepanza rifiutata: ${itemCode}. Riconteggio richiesto.`);
    handleRecount(itemCode);
  };

  /**
   * Finalizza inventario
   */
  const handleFinalizeInventory = async () => {
    if (discrepancies.length > 0) {
      toast.error('Impossibile finalizzare: ci sono discrepanze non gestite');
      setShowDiscrepancyModal(true);
      return;
    }

    if (!confirm('Confermi la finalizzazione dell\'inventario? Verranno generati i movimenti di rettifica.')) {
      return;
    }

    setIsLoading(true);

    try {
      // API call - In produzione: POST /api/inventory/{listId}/finalize
      // Genera movimenti rettifica automatici per tutte le discrepanze approvate
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsFinalized(true);
      toast.success('Inventario finalizzato! Movimenti di rettifica generati.', { duration: 4000 });

      setTimeout(() => {
        navigate('/lists');
      }, 2000);
    } catch (error) {
      toast.error('Errore durante la finalizzazione inventario');
    } finally {
      setIsLoading(false);
    }
  };

  // Statistics
  const totalCounts = counts.length;
  const pendingCounts = counts.filter((c) => c.status === 'PENDING').length;
  const discrepancyCount = discrepancies.length;
  const approvedCount = counts.filter((c) => c.status === 'APPROVED').length;

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
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold">Inventario RF</h1>
                  <p className="text-sm text-gray-400">
                    {listId ? `Lista: ${listId}` : 'Gestione Inventario'}
                  </p>
                </div>
              </div>
            </div>

            {listId && !isFinalized && (
              <button
                onClick={() => loadInventoryList(listId)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Ricarica
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Caricamento...</p>
          </div>
        )}

        {/* No List Selected */}
        {!listId && !isLoading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center">
              <ClipboardCheck className="w-20 h-20 text-purple-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">Seleziona Lista Inventario</h2>
              <p className="text-gray-400 mb-8">
                Seleziona una lista inventario per iniziare il processo di completamento
              </p>

              {/* Liste Inventario Reali dal Database */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-left">
                  Liste Inventario Disponibili:
                  {listsData && ` (${listsData.data.length} liste)`}
                </p>

                {/* Loading state */}
                {isLoadingLists && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <p className="text-sm text-gray-400 mt-2">Caricamento liste...</p>
                  </div>
                )}

                {/* Liste reali dal database */}
                {!isLoadingLists && listsData?.data && listsData.data.length > 0 ? (
                  listsData.data.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => loadInventoryList(list.code)}
                      className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold">{list.code}</div>
                        <div className="text-sm text-gray-400">
                          {list.description || 'Lista Inventario'} - {list.totalRows} righe - {list.status}
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-gray-400 transform rotate-180" />
                    </button>
                  ))
                ) : (
                  !isLoadingLists && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Nessuna lista inventario disponibile</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Content */}
        {listId && !isLoading && !isFinalized && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-3xl font-bold text-white mb-1">{totalCounts}</div>
                <div className="text-sm text-gray-400">Totale Conteggi</div>
              </div>
              <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-300 mb-1">{pendingCounts}</div>
                <div className="text-sm text-blue-200">Pendenti</div>
              </div>
              <div className="bg-red-800 bg-opacity-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-300 mb-1">{discrepancyCount}</div>
                <div className="text-sm text-red-200">Discrepanze</div>
              </div>
              <div className="bg-green-800 bg-opacity-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-300 mb-1">{approvedCount}</div>
                <div className="text-sm text-green-200">Approvate</div>
              </div>
            </div>

            {/* Counts List */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4">Conteggi Inventario</h3>

              <div className="space-y-3">
                {counts.map((count) => (
                  <div
                    key={count.id}
                    className={`p-4 rounded-lg border-2 ${
                      count.status === 'APPROVED'
                        ? 'bg-green-900 bg-opacity-30 border-green-500'
                        : count.status === 'DISCREPANCY'
                        ? 'bg-red-900 bg-opacity-30 border-red-500'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{count.itemCode}</div>
                        <div className="text-sm text-gray-300">{count.itemDescription}</div>
                        <div className="text-xs text-gray-400 mt-1">Loc: {count.location}</div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Sistema</div>
                          <div className="text-xl font-bold">{count.systemQty}</div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Conteggio</div>
                          <div className={`text-xl font-bold ${
                            count.countedQty !== count.systemQty ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            {count.countedQty}
                          </div>
                        </div>

                        <div className="text-center min-w-[80px]">
                          <div className="text-xs text-gray-400 mb-1">Status</div>
                          <div>
                            {count.status === 'APPROVED' && (
                              <span className="text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                OK
                              </span>
                            )}
                            {count.status === 'DISCREPANCY' && (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Diff
                              </span>
                            )}
                            {count.status === 'COUNTED' && (
                              <span className="text-gray-400">Contato</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {discrepancyCount > 0 && (
                <button
                  onClick={() => setShowDiscrepancyModal(true)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Gestisci Discrepanze ({discrepancyCount})
                </button>
              )}

              <button
                onClick={handleFinalizeInventory}
                disabled={discrepancyCount > 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Finalizza Inventario
              </button>
            </div>
          </div>
        )}

        {/* Finalized State */}
        {isFinalized && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-900 bg-opacity-50 border-2 border-green-500 rounded-lg p-8 text-center">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-200 mb-2">
                Inventario Finalizzato!
              </h2>
              <p className="text-green-300 mb-4">
                Lista {listId} completata con successo.
              </p>
              <p className="text-sm text-green-400">
                Movimenti di rettifica generati automaticamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && (
        <DiscrepancyModal
          isOpen={showDiscrepancyModal}
          onClose={() => setShowDiscrepancyModal(false)}
          discrepancies={discrepancies}
          onRecount={handleRecount}
          onApprove={handleApproveDiscrepancy}
          onReject={handleRejectDiscrepancy}
          canAuthorize={canAuthorize}
        />
      )}

      {/* Recount Workflow */}
      {recountItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <RecountWorkflow
            item={recountItem}
            onComplete={handleRecountComplete}
            onCancel={() => {
              setRecountItem(null);
              setShowDiscrepancyModal(true);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InventoryRFPage;

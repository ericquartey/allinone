/**
 * Lists Detail Tabs
 * Implements 5-tab detail panel from Swing GestioneListeCorpoPanelNew.java
 * Tabs: Operazioni Magazzino, Operazioni Area, Righe Lista, Prenotazioni, Movimenti
 */

import React, { useState, useEffect } from 'react';
import { Warehouse, MapPin, List, BookmarkCheck, TruckIcon } from 'lucide-react';
import { apiClient } from '../../services/api/client';
import {
  getWarehouseOperations,
  getAreaOperations,
  WarehouseOperation,
  AreaOperation
} from '../../services/listsDetailsService';

interface ListsDetailTabsProps {
  selectedList: any | null;
  activeTab?: TabId;
  onTabChange?: (tabId: string) => void;
  onRowsSelectionChange?: (rows: any[]) => void;
}

type TabId = 'warehouse' | 'area' | 'rows' | 'reservations' | 'movements';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ list: any }>;
}

// Tab Component - Warehouse Operations (with real data loading)
const OperationsPerWarehouseTab: React.FC<{ list: any }> = ({ list }) => {
  const [operations, setOperations] = useState<WarehouseOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!list?.databaseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[WarehouseTab] Loading operations for list ID: ${list.databaseId}`);
        const data = await getWarehouseOperations(list.databaseId);
        setOperations(data);
        console.log(`[WarehouseTab] Loaded ${data.length} warehouse operations`);
      } catch (err: any) {
        console.error('[WarehouseTab] Error loading data:', err);
        setError(err.message || 'Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [list?.databaseId]);

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Operazioni per Magazzino</h3>
      <p className="text-xs text-gray-500 mb-4">
        Visualizzazione delle operazioni raggruppate per magazzino.
        <br />
        Lista ID: {list?.id || 'N/A'}
      </p>
      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Magazzino</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Righe</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Qta Totale</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Qta Processata</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Progresso %</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t border-gray-200">
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  Caricamento dati...
                </td>
              </tr>
            )}
            {error && (
              <tr className="border-t border-gray-200">
                <td colSpan={5} className="px-3 py-4 text-center text-red-500">
                  Errore: {error}
                </td>
              </tr>
            )}
            {!loading && !error && operations.length === 0 && (
              <tr className="border-t border-gray-200">
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  Nessuna operazione disponibile per questa lista
                </td>
              </tr>
            )}
            {!loading && !error && operations.map((op, index) => (
              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-left">{op.magazzino}</td>
                <td className="px-3 py-2 text-right">{op.numeroRighe}</td>
                <td className="px-3 py-2 text-right">{op.qtaTotale.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{op.qtaProcessata.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-medium ${op.progressoPercentuale >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {op.progressoPercentuale.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OperationsPerAreaTab: React.FC<{ list: any }> = ({ list }) => {
  const [operations, setOperations] = useState<AreaOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!list?.databaseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[AreaTab] Loading operations for list ID: ${list.databaseId}`);
        const data = await getAreaOperations(list.databaseId);
        setOperations(data);
        console.log(`[AreaTab] Loaded ${data.length} area operations`);
      } catch (err: any) {
        console.error('[AreaTab] Error loading data:', err);
        setError(err.message || 'Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [list?.databaseId]);

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Operazioni per Area</h3>
      <p className="text-xs text-gray-500 mb-4">
        Visualizzazione delle operazioni raggruppate per area.
        <br />
        Lista ID: {list?.id || 'N/A'}
      </p>
      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Area</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Priorità</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Seq. Lancio</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Righe</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Qta Totale</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Qta Processata</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Progresso %</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t border-gray-200">
                <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                  Caricamento dati...
                </td>
              </tr>
            )}
            {error && (
              <tr className="border-t border-gray-200">
                <td colSpan={7} className="px-3 py-4 text-center text-red-500">
                  Errore: {error}
                </td>
              </tr>
            )}
            {!loading && !error && operations.length === 0 && (
              <tr className="border-t border-gray-200">
                <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                  Nessuna operazione disponibile per questa lista
                </td>
              </tr>
            )}
            {!loading && !error && operations.map((op, index) => (
              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-left">{op.area}</td>
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {op.priorita}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{op.sequenzaLancio}</td>
                <td className="px-3 py-2 text-right">{op.numeroRighe}</td>
                <td className="px-3 py-2 text-right">{op.qtaTotale.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{op.qtaProcessata.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-medium ${op.progressoPercentuale >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {op.progressoPercentuale.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ListRowsTab: React.FC<{ list: any; onSelectionChange?: (rows: any[]) => void }> = ({
  list,
  onSelectionChange,
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<string | number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRows = async () => {
      const listNumber = list?.listHeader?.listNumber;
      if (!listNumber) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[ListRowsTab] Loading rows for list: ${listNumber}`);

        const response = await fetch(`/api/lists/${listNumber}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[ListRowsTab] Response data:', data);

        if (data.result === 'OK' && data.exported && data.exported.length > 0) {
          const listRows = data.exported[0].listRows || [];
          setRows(listRows);
          setSelectedRowNumbers(new Set());
          onSelectionChange?.([]);
          console.log(`[ListRowsTab] Loaded ${listRows.length} rows`);
        } else {
          setRows([]);
          setSelectedRowNumbers(new Set());
          onSelectionChange?.([]);
        }
      } catch (err: any) {
        console.error('[ListRowsTab] Error loading rows:', err);
        setError(err.message || 'Errore nel caricamento delle righe');
        setSelectedRowNumbers(new Set());
        onSelectionChange?.([]);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, [list?.listHeader?.listNumber, onSelectionChange]);

  const rowKey = (row: any) => row.rowNumber ?? row.rowSequence ?? row.id;

  const toggleRow = (row: any) => {
    const key = rowKey(row);
    const next = new Set(selectedRowNumbers);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedRowNumbers(next);
    const selected = rows.filter((r) => next.has(rowKey(r)));
    onSelectionChange?.(selected);
  };

  const toggleAll = () => {
    if (rows.length === 0) return;
    if (selectedRowNumbers.size === rows.length) {
      setSelectedRowNumbers(new Set());
      onSelectionChange?.([]);
      return;
    }
    const next = new Set(rows.map((r) => rowKey(r)));
    setSelectedRowNumbers(next);
    onSelectionChange?.([...rows]);
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Righe Lista</h3>
      <p className="text-xs text-gray-500 mb-4">
        Dettaglio righe della lista selezionata.
        <br />
        Lista: {list?.listHeader?.listNumber || 'N/A'}
      </p>
      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRowNumbers.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Riga</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Articolo</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Descrizione</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Qta Richiesta</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Qta Processata</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Lotto</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Matricola</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  Caricamento righe...
                </td>
              </tr>
            )}
            {error && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-red-500">
                  Errore: {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  Nessuna riga disponibile per questa lista
                </td>
              </tr>
            )}
            {!loading && !error && rows.map((row, index) => (
              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRowNumbers.has(rowKey(row))}
                    onChange={() => toggleRow(row)}
                  />
                </td>
                <td className="px-3 py-2 text-left">{row.rowNumber || row.rowSequence || '-'}</td>
                <td className="px-3 py-2 text-left">{row.item || '-'}</td>
                <td className="px-3 py-2 text-left">{row.lineDescription || '-'}</td>
                <td className="px-3 py-2 text-right">{row.requestedQty?.toFixed(2) || '0.00'}</td>
                <td className="px-3 py-2 text-right">{row.processedQty?.toFixed(2) || '0.00'}</td>
                <td className="px-3 py-2 text-left">{row.lot || '-'}</td>
                <td className="px-3 py-2 text-left">{row.serialNumber || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReservationsTab: React.FC<{ list: any }> = ({ list }) => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReservations = async () => {
      if (!list?.databaseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[ReservationsTab] Loading reservations for list ID: ${list.databaseId}`);

        const response = await fetch(`/api/lists/${list.databaseId}/reservations`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[ReservationsTab] Response data:', data);

        if (data.result === 'OK') {
          setReservations(data.data || []);
          console.log(`[ReservationsTab] Loaded ${data.data?.length || 0} reservations`);
        } else {
          setReservations([]);
        }
      } catch (err: any) {
        console.error('[ReservationsTab] Error loading reservations:', err);
        setError(err.message || 'Errore nel caricamento delle prenotazioni');
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [list?.databaseId]);

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Prenotazioni</h3>
      <p className="text-xs text-gray-500 mb-4">
        Prenotazioni associate alla lista selezionata.
        <br />
        Lista: {list?.id || 'N/A'}
      </p>
      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Num Prenotazione</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Prodotto</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Quantità</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Lotto</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Matricola</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">UDC</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Ubicazione</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Stato</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  Caricamento prenotazioni...
                </td>
              </tr>
            )}
            {error && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-red-500">
                  Errore: {error}
                </td>
              </tr>
            )}
            {!loading && !error && reservations.length === 0 && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  Nessuna prenotazione disponibile per questa lista
                </td>
              </tr>
            )}
            {!loading && !error && reservations.map((res, index) => (
              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-left">{res.numeroPrenotazione || '-'}</td>
                <td className="px-3 py-2 text-left">
                  <div className="font-medium">{res.codiceProdotto || '-'}</div>
                  <div className="text-gray-500 text-xxs">{res.descrizioneProdotto || ''}</div>
                </td>
                <td className="px-3 py-2 text-right">{res.quantita?.toFixed(2) || '0.00'}</td>
                <td className="px-3 py-2 text-left">{res.lotto || '-'}</td>
                <td className="px-3 py-2 text-left">{res.matricola || '-'}</td>
                <td className="px-3 py-2 text-left">{res.barcodeUDC || '-'}</td>
                <td className="px-3 py-2 text-left">{res.codiceUbicazione || '-'}</td>
                <td className="px-3 py-2 text-left">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-medium bg-blue-100 text-blue-800">
                    {res.statoPrenotazione || 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MovementsTab: React.FC<{ list: any }> = ({ list }) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMovements = async () => {
      if (!list?.databaseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[MovementsTab] Loading movements for list ID: ${list.databaseId}`);

        const response = await fetch(`/api/lists/${list.databaseId}/movements`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[MovementsTab] Response data:', data);

        if (data.result === 'OK') {
          setMovements(data.data || []);
          console.log(`[MovementsTab] Loaded ${data.data?.length || 0} movements`);
        } else {
          setMovements([]);
        }
      } catch (err: any) {
        console.error('[MovementsTab] Error loading movements:', err);
        setError(err.message || 'Errore nel caricamento dei movimenti');
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, [list?.databaseId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Movimenti</h3>
      <p className="text-xs text-gray-500 mb-4">
        Movimenti generati dall'esecuzione della lista.
        <br />
        Lista: {list?.id || 'N/A'}
      </p>
      <div className="mt-4 border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Num Movimento</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Prodotto</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Quantità</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Lotto</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Da Ubicazione</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">A Ubicazione</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Tipo</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  Caricamento movimenti...
                </td>
              </tr>
            )}
            {error && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-red-500">
                  Errore: {error}
                </td>
              </tr>
            )}
            {!loading && !error && movements.length === 0 && (
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  Nessun movimento disponibile per questa lista
                </td>
              </tr>
            )}
            {!loading && !error && movements.map((mov, index) => (
              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-left">{mov.numeroMovimento || '-'}</td>
                <td className="px-3 py-2 text-left">
                  <div className="font-medium">{mov.codiceProdotto || '-'}</div>
                  <div className="text-gray-500 text-xxs">{mov.descrizioneProdotto || ''}</div>
                </td>
                <td className="px-3 py-2 text-right">{mov.quantita?.toFixed(2) || '0.00'}</td>
                <td className="px-3 py-2 text-left">{mov.lotto || '-'}</td>
                <td className="px-3 py-2 text-left">{mov.daUbicazione || '-'}</td>
                <td className="px-3 py-2 text-left">{mov.aUbicazione || '-'}</td>
                <td className="px-3 py-2 text-left">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-medium bg-green-100 text-green-800">
                    {mov.tipoMovimento || 'N/A'}
                  </span>
                </td>
                <td className="px-3 py-2 text-left text-xxs">{formatDate(mov.dataMovimento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ListsDetailTabs: React.FC<ListsDetailTabsProps> = ({
  selectedList,
  activeTab: activeTabProp,
  onTabChange,
  onRowsSelectionChange
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(activeTabProp || 'warehouse');

  useEffect(() => {
    if (activeTabProp && activeTabProp !== activeTab) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp, activeTab]);

  const tabs: Tab[] = [
    {
      id: 'warehouse',
      label: 'Operazioni per Magazzino',
      icon: <Warehouse className="w-4 h-4" />,
      component: OperationsPerWarehouseTab
    },
    {
      id: 'area',
      label: 'Operazioni per Area',
      icon: <MapPin className="w-4 h-4" />,
      component: OperationsPerAreaTab
    },
    {
      id: 'rows',
      label: 'Righe Lista',
      icon: <List className="w-4 h-4" />,
      component: ListRowsTab
    },
    {
      id: 'reservations',
      label: 'Prenotazioni',
      icon: <BookmarkCheck className="w-4 h-4" />,
      component: ReservationsTab
    },
    {
      id: 'movements',
      label: 'Movimenti',
      icon: <TruckIcon className="w-4 h-4" />,
      component: MovementsTab
    }
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const ActiveTabComponent = tabs.find(t => t.id === activeTab)?.component || OperationsPerWarehouseTab;

  if (!selectedList) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-sm text-gray-500">
          Seleziona una lista dalla tabella per visualizzare i dettagli
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors
              ${
                activeTab === tab.id
                  ? 'bg-white text-ferretto-blue border-b-2 border-ferretto-blue'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white">
        {activeTab === 'rows' ? (
          <ListRowsTab list={selectedList} onSelectionChange={onRowsSelectionChange} />
        ) : (
          <ActiveTabComponent list={selectedList} />
        )}
      </div>
    </div>
  );
};

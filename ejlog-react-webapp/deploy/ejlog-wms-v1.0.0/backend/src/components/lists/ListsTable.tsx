// src/components/lists/ListsTable.jsx

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { getListTypeLabel, getListStatusLabel, ListType, ListStatus } from '../../types/lists';

/**
 * LISTS TABLE - Complete Implementation with Dynamic Column Visibility
 *
 * Shows ALL fields from database with dynamic show/hide based on user configuration.
 * Uses isColumnVisible(key) function to control which columns are displayed.
 *
 * AVAILABLE COLUMNS (mapped to database fields):
 * - location -> locazionePTL (NLocazione/Pil - Real PTL location from LocazioniPTL table)
 * - listNumber -> listNumber (NumLista)
 * - reference -> orderNumber || listNumber (RifLista)
 * - description -> listDescription
 * - area -> auxHostText02
 * - destination -> auxHostInt01 (mapped to area name)
 * - priority -> priority
 * - sequence -> sequenzaLancio
 * - user -> utente/userList
 * - dateCreated -> dataCreazione
 * - dateModified -> dataModifica
 * - dateLaunched -> dataLancio
 * - dateStartExecution -> dataInizioEvasione
 * - dateEndExecution -> dataFineEvasione
 * - totalRows -> numeroRighe (calculated from listRows.length)
 * - completedRows -> numeroRigheTerminate (calculated)
 * - unprocessableRows -> numeroRigheNonEvadibili
 * - progress -> Barra progresso (completedRows/totalRows)
 * - listType -> listType (idTipoLista)
 * - listStatus -> listStatus (idStatoControlloEvadibilita)
 * - terminated -> terminata
 * - movementCause -> idCausaleMovimento (cause)
 * - barcode -> barcode
 */
interface ListsTableProps {
  lists?: any[];
  selectedList?: any;
  onSelectList?: (list: any) => void;
  onDoubleClickList?: (list: any) => void;
  onSetWaiting?: (list: any) => void;
  onTerminate?: (list: any) => void;
  operationLoading?: boolean;
  isColumnVisible?: (key: string) => boolean; // Function to check if column is visible
}

export const ListsTable: React.FC<ListsTableProps> = ({
  lists = [],
  selectedList,
  onSelectList,
  onDoubleClickList,
  onSetWaiting,
  onTerminate,
  operationLoading = false,
  isColumnVisible = () => true // Default: show all columns
 }) => {
  const [sortColumn, setSortColumn] = useState('listNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [processingListId, setProcessingListId] = useState(null);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedLists = () => {
    if (!lists || lists.length === 0) return [];

    return [...lists].sort((a, b) => {
      const aHeader = a.listHeader || {};
      const bHeader = b.listHeader || {};

      let aValue, bValue;

      switch (sortColumn) {
        case 'listNumber':
          aValue = aHeader.listNumber || '';
          bValue = bHeader.listNumber || '';
          break;
        case 'priority':
          aValue = aHeader.priority || 0;
          bValue = bHeader.priority || 0;
          break;
        case 'listType':
          aValue = aHeader.listType || 0;
          bValue = bHeader.listType || 0;
          break;
        case 'listStatus':
          aValue = aHeader.listStatus || 0;
          bValue = bHeader.listStatus || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedLists = getSortedLists();

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-ferretto-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4 text-ferretto-red" />
      : <ChevronDown className="h-4 w-4 text-ferretto-red" />;
  };

  const getProgressColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-300';
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Define all available columns with their properties
  const allColumns = [
    { key: 'location', label: 'NLocazione/Pil', sortable: true },
    { key: 'listNumber', label: 'NumLista', sortable: true },
    { key: 'reference', label: 'RifLista', sortable: true },
    { key: 'description', label: 'Descrizione', sortable: true },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'destination', label: 'GruppoDestinazione', sortable: true },
    { key: 'priority', label: 'Priorità', sortable: true },
    { key: 'sequence', label: 'SequenzaLancio', sortable: true },
    { key: 'user', label: 'Utente', sortable: true },
    { key: 'dateCreated', label: 'Data Creazione', sortable: true },
    { key: 'dateModified', label: 'Data Modifica', sortable: true },
    { key: 'dateLaunched', label: 'Data Lancio', sortable: true },
    { key: 'dateStartExecution', label: 'Inizio Evasione', sortable: true },
    { key: 'dateEndExecution', label: 'Fine Evasione', sortable: true },
    { key: 'totalRows', label: 'Totale Righe', sortable: true },
    { key: 'completedRows', label: 'Righe Completate', sortable: true },
    { key: 'unprocessableRows', label: 'Righe Non Evadibili', sortable: true },
    { key: 'progress', label: 'Progresso', sortable: false },
    { key: 'listType', label: 'Tipo Lista', sortable: true },
    { key: 'listStatus', label: 'Stato Lista', sortable: true },
    { key: 'terminated', label: 'Terminata', sortable: true },
    { key: 'movementCause', label: 'Causale Movimento', sortable: true },
    { key: 'barcode', label: 'Barcode', sortable: true },
  ];

  // Filter visible columns
  const visibleColumns = allColumns.filter(col => isColumnVisible(col.key));

  // Helper function to format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="table">
        <thead className="bg-gradient-to-r from-ferretto-gray-100 to-ferretto-gray-200 sticky top-0 z-10 shadow-sm">
          <tr>
            {visibleColumns.map(column => (
              <th key={column.key} className="px-3 py-3 text-left">
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-1 text-xs font-heading font-bold text-ferretto-dark uppercase tracking-wider hover:text-ferretto-red transition-colors"
                  >
                    {column.label}
                    <SortIcon column={column.key} />
                  </button>
                ) : (
                  <span className="text-xs font-heading font-bold text-ferretto-dark uppercase tracking-wider">
                    {column.label}
                  </span>
                )}
              </th>
            ))}
            {(onSetWaiting || onTerminate) && (
              <th className="px-3 py-3 text-center">
                <span className="text-xs font-heading font-bold text-ferretto-dark uppercase tracking-wider">
                  Azioni
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLists.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + ((onSetWaiting || onTerminate) ? 1 : 0)} className="px-6 py-8 text-center text-sm text-ferretto-gray-500">
                Nessuna lista trovata
              </td>
            </tr>
          ) : (
            sortedLists.map((listExport, index) => {
              const list = listExport.listHeader || {};
              const rows = listExport.listRows || [];
              const isSelected = selectedList?.listHeader?.listNumber === list.listNumber;
              const totalRows = rows.length || list.numeroRighe || list.totalRows || 0;
              const completedRows = rows.length
                ? rows.filter(row => row.processedQty >= row.requestedQty).length
                : (list.numeroRigheTerminate || list.completedRows || 0);
              const unprocessableRows = rows.length
                ? rows.filter(row => row.auxHostBit01 === true).length
                : (list.numeroRigheNonEvadibili || 0);
              const progressPercentage = totalRows > 0
                ? Math.round((completedRows / totalRows) * 100)
                : 0;

              // Helper function to render cell content based on column key
              const renderCell = (columnKey: string) => {
                switch (columnKey) {
                  case 'location':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{list.locazionePTL || '-'}</td>;

                  case 'listNumber':
                    return <td key={columnKey} className="px-3 py-2 text-sm font-medium text-ferretto-dark">{list.listNumber || '-'}</td>;

                  case 'reference':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{list.orderNumber || list.listNumber || '-'}</td>;

                  case 'description':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{list.listDescription || '-'}</td>;

                  case 'area':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{list.nomeArea || '-'}</td>;

                  case 'destination':
                    return (
                      <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">
                        {list.idGruppoDestinazione ?? '-'}
                      </td>
                    );

                  case 'priority':
                    return (
                      <td key={columnKey} className="px-3 py-2 text-sm text-center">
                        <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-bold ${
                          list.priority && list.priority <= 3
                            ? 'bg-error/20 text-error border border-error/30'
                            : list.priority && list.priority <= 6
                            ? 'bg-warning/20 text-warning border border-warning/30'
                            : 'bg-success/20 text-success border border-success/30'
                        }`}>
                          {list.priority ?? 9}
                        </span>
                      </td>
                    );

                  case 'sequence':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-center text-ferretto-dark">{list.sequenzaLancio || '-'}</td>;

                  case 'user':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{list.userList || list.utente || '-'}</td>;

                  case 'dateCreated':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{formatDate(list.dataCreazione)}</td>;

                  case 'dateModified':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{formatDate(list.dataModifica)}</td>;

                  case 'dateLaunched':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{formatDate(list.dataLancio)}</td>;

                  case 'dateStartExecution':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{formatDate(list.dataInizioEvasione)}</td>;

                  case 'dateEndExecution':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{formatDate(list.dataFineEvasione)}</td>;

                  case 'totalRows':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-center text-ferretto-dark">{totalRows}</td>;

                  case 'completedRows':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-center text-ferretto-dark">{completedRows}</td>;

                  case 'unprocessableRows':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-center text-ferretto-dark">{unprocessableRows}</td>;

                  case 'progress':
                    return (
                      <td key={columnKey} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-ferretto-gray-200 rounded-full h-4 overflow-hidden min-w-[80px]">
                            <div
                              className={`h-full ${getProgressColor(progressPercentage)} transition-all duration-300`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-ferretto-dark min-w-[60px]">
                            {completedRows}/{totalRows}
                          </span>
                        </div>
                      </td>
                    );

                  case 'listType':
                    return (
                      <td key={columnKey} className="px-3 py-2">
                        <span className={`badge ${
                          list.listType === ListType.PICKING
                            ? 'badge-warning'
                            : list.listType === ListType.REFILLING
                            ? 'bg-orange-100 text-orange-800'
                            : 'badge-info'
                        }`}>
                          {getListTypeLabel(list.listType)}
                        </span>
                      </td>
                    );

                  case 'listStatus':
                    return (
                      <td key={columnKey} className="px-3 py-2">
                        {list.listStatus !== undefined && (
                          <span className={`badge ${
                            list.listStatus === ListStatus.WAITING
                              ? 'badge-warning'
                              : list.listStatus === ListStatus.IN_EXECUTION
                              ? 'badge-info'
                              : list.listStatus === ListStatus.TERMINATED
                              ? 'badge-success'
                              : 'bg-ferretto-gray-100 text-ferretto-gray-800'
                          }`}>
                            {getListStatusLabel(list.listStatus)}
                          </span>
                        )}
                      </td>
                    );

                  case 'terminated':
                    return (
                      <td key={columnKey} className="px-3 py-2 text-sm text-center">
                        {list.listStatus === ListStatus.TERMINATED ? (
                          <span className="text-green-600 font-bold">SI</span>
                        ) : (
                          <span className="text-gray-400">NO</span>
                        )}
                      </td>
                    );

                  case 'movementCause':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">{list.cause || '-'}</td>;

                  case 'barcode':
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark font-mono">{list.barcode || '-'}</td>;

                  default:
                    return <td key={columnKey} className="px-3 py-2 text-sm text-ferretto-dark">-</td>;
                }
              };

              return (
                <tr
                  key={list.listNumber || index}
                  onClick={() => onSelectList(listExport)}
                  onDoubleClick={() => onDoubleClickList && onDoubleClickList(listExport)}
                  className={`cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-ferretto-red/10 border-l-4 border-l-ferretto-red shadow-sm'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-ferretto-gray-50'
                      : 'bg-ferretto-gray-50 hover:bg-ferretto-gray-100'
                  }`}
                >
                  {visibleColumns.map(column => renderCell(column.key))}

                  {/* Azioni */}
                  {(onSetWaiting || onTerminate) && (
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {onSetWaiting && list.listStatus !== ListStatus.WAITING && list.listStatus !== ListStatus.TERMINATED && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setProcessingListId(list.listNumber);
                              await onSetWaiting(list.listNumber);
                              setProcessingListId(null);
                            }}
                            disabled={processingListId === list.listNumber}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded transition-colors"
                            title="Metti lista in attesa"
                          >
                            {processingListId === list.listNumber ? 'Attendere...' : 'Attesa'}
                          </button>
                        )}
                        {onTerminate && list.listStatus !== ListStatus.TERMINATED && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setProcessingListId(list.listNumber);
                              await onTerminate(list.id);
                              setProcessingListId(null);
                            }}
                            disabled={processingListId === list.listNumber}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded transition-colors"
                            title="Termina lista"
                          >
                            {processingListId === list.listNumber ? 'Attendere...' : 'Termina'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

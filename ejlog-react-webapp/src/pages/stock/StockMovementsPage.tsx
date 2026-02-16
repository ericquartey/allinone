// ============================================================================
// EJLOG WMS - Stock Movements Page
// Refactored to use movementsService - Real backend integration
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import * as MovementsService from '../../services/movementsService';
import type { Movement, OperationType } from '../../services/movementsService';

const StockMovementsPage = () => {
  const navigate = useNavigate();

  // State
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<OperationType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('ALL');

  // Pagination
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Load movements from backend
  useEffect(() => {
    loadMovements();
  }, [limit, offset, typeFilter, dateFrom, dateTo, searchTerm]);

  const loadMovements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params: MovementsService.GetMovementsParams = {
        limit,
        offset,
      };

      // Add type filter if not ALL
      if (typeFilter !== 'ALL') {
        params.operationType = typeFilter;
      }

      // Add item code search if provided
      if (searchTerm) {
        params.itemCode = searchTerm;
      }

      // Add date filters
      if (dateFrom) {
        const dateFromObj = new Date(dateFrom);
        params.dateFrom = MovementsService.formatDateForBackend(dateFromObj);
      }

      if (dateTo) {
        const dateToObj = new Date(dateTo);
        // Set to end of day
        dateToObj.setHours(23, 59, 59, 999);
        params.dateTo = MovementsService.formatDateForBackend(dateToObj);
      }

      const response = await MovementsService.getMovements(params);

      if (response.result === 'OK' && response.exportedItem) {
        setMovements(response.exportedItem);
      } else {
        setError(response.message || 'Errore nel caricamento movimenti');
      }
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Errore di connessione al server');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique operators from loaded movements - MEMOIZED
  const uniqueOperators = useMemo(() => {
    return Array.from(new Set(movements.map((m) => m.userPpc || m.userList).filter(Boolean)));
  }, [movements]);

  // Client-side filtering (additional to backend filters) - MEMOIZED
  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesOperator = operatorFilter === 'ALL' ||
        movement.userPpc === operatorFilter ||
        movement.userList === operatorFilter;

      return matchesOperator;
    });
  }, [movements, operatorFilter]);

  // Statistics
  const stats = {
    totalMovements: movements.length,
    todayMovements: movements.filter((m) => {
      if (!m.id) return false;
      // Assuming movements from today are recent
      return true; // Backend doesn't provide timestamp, so we show all
    }).length,
    pickings: movements.filter((m) => m.operationType === MovementsService.OperationType.PICKING).length,
    receivings: movements.filter((m) => m.operationType === MovementsService.OperationType.RECEIVING).length,
    adjustments: movements.filter((m) => m.operationType === MovementsService.OperationType.ADJUSTMENT).length,
    others: movements.filter((m) =>
      m.operationType !== MovementsService.OperationType.PICKING &&
      m.operationType !== MovementsService.OperationType.RECEIVING &&
      m.operationType !== MovementsService.OperationType.ADJUSTMENT
    ).length,
  };

  const getMovementTypeBadge = (type: OperationType) => {
    const label = MovementsService.getOperationTypeLabel(type);
    const colorClass = MovementsService.getOperationTypeColor(type);

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';

    const date = MovementsService.parseDateFromBackend(dateString);
    if (!date) return dateString;

    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row: Movement) => (
        <div className="text-sm font-medium text-gray-900">
          #{row.id}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (row: Movement) => getMovementTypeBadge(row.operationType),
    },
    {
      key: 'product',
      label: 'Articolo',
      sortable: true,
      render: (row: Movement) => (
        <div>
          <div
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => navigate(`/items/${row.item}`)}
          >
            {row.item}
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantità',
      sortable: true,
      render: (row: Movement) => (
        <div className="text-center">
          <div className={`text-lg font-bold ${MovementsService.getDeltaQtyColor(row.deltaQty)}`}>
            {MovementsService.formatDeltaQty(row.deltaQty)}
          </div>
          <div className="text-xs text-gray-600">
            {row.oldQty.toFixed(2)} → {row.newQty.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      key: 'tracking',
      label: 'Tracciatura',
      render: (row: Movement) => (
        <div className="text-xs space-y-1">
          {row.lot && (
            <div className="flex items-center gap-1">
              <Badge variant="info" className="text-xs">LOT</Badge>
              <span className="font-mono">{row.lot}</span>
            </div>
          )}
          {row.serialNumber && (
            <div className="flex items-center gap-1">
              <Badge variant="warning" className="text-xs">SN</Badge>
              <span className="font-mono">{row.serialNumber}</span>
            </div>
          )}
          {row.expiryDate && (
            <div className="flex items-center gap-1">
              <Badge variant="error" className="text-xs">SCAD</Badge>
              <span className="text-xs">{formatDateTime(row.expiryDate)}</span>
            </div>
          )}
          {!row.lot && !row.serialNumber && !row.expiryDate && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'list',
      label: 'Lista/Ordine',
      render: (row: Movement) => (
        <div className="text-sm">
          {row.listNumber && (
            <div
              className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs"
              onClick={() => navigate(`/lists/${row.listNumber}`)}
            >
              Lista: {row.listNumber}
            </div>
          )}
          {row.orderNumber && (
            <div className="text-gray-700 text-xs">
              Ordine: {row.orderNumber}
            </div>
          )}
          {row.lineNumber && (
            <div className="text-gray-500 text-xs">
              Riga: {row.lineNumber}
            </div>
          )}
          {!row.listNumber && !row.orderNumber && !row.lineNumber && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'operator',
      label: 'Operatore',
      sortable: true,
      render: (row: Movement) => (
        <div className="text-sm">
          {row.userPpc && (
            <div className="font-medium text-gray-900">{row.userPpc}</div>
          )}
          {row.userList && row.userList !== row.userPpc && (
            <div className="text-xs text-gray-600">{row.userList}</div>
          )}
          {!row.userPpc && !row.userList && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'cause',
      label: 'Causale',
      render: (row: Movement) => (
        <div className="text-xs max-w-xs">
          {row.cause && (
            <div className="font-medium text-gray-700">{row.cause}</div>
          )}
          {row.noteCause && (
            <div className="text-gray-600 truncate" title={row.noteCause}>
              {row.noteCause}
            </div>
          )}
          {!row.cause && !row.noteCause && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: Movement) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => alert(`Dettagli movimento #${row.id}\nArticolo: ${row.item}\nDelta: ${row.deltaQty}`)}
          >
            Dettagli
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    alert('Esportazione movimenti in Excel...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setOperatorFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setOffset(0);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movimenti di Magazzino</h1>
            <p className="text-gray-600 mt-1">Storico completo dei movimenti di stock</p>
          </div>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <Button onClick={loadMovements} className="mt-4">
              Riprova
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimenti di Magazzino</h1>
          <p className="text-gray-600 mt-1">Storico completo dei movimenti di stock</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Stampa
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Esporta Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Totale Movimenti</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMovements}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Caricati</p>
            <p className="text-3xl font-bold text-blue-600">{stats.todayMovements}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Prelievi</p>
            <p className="text-3xl font-bold text-blue-600">{stats.pickings}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Ingressi</p>
            <p className="text-3xl font-bold text-green-600">{stats.receivings}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Rettifiche</p>
            <p className="text-3xl font-bold text-orange-600">{stats.adjustments}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Altri</p>
            <p className="text-3xl font-bold text-gray-600">{stats.others}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca Articolo
              </label>
              <input
                type="text"
                placeholder="Codice articolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Movimento
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value) as OperationType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutti i tipi</option>
                <option value={MovementsService.OperationType.PICKING}>Prelievo</option>
                <option value={MovementsService.OperationType.RECEIVING}>Ingresso</option>
                <option value={MovementsService.OperationType.ADJUSTMENT}>Rettifica</option>
                <option value={MovementsService.OperationType.END_OF_LINE}>Fine Riga</option>
                <option value={MovementsService.OperationType.END_OF_LIST}>Fine Lista</option>
                <option value={MovementsService.OperationType.LIST_EXECUTION}>Lista in Esecuzione</option>
                <option value={MovementsService.OperationType.PTL_CONFIRMATION}>Conferma PTL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operatore
              </label>
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutti gli operatori</option>
                {uniqueOperators.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periodo
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {(searchTerm || typeFilter !== 'ALL' || operatorFilter !== 'ALL' || dateFrom || dateTo) && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                Trovati <span className="font-semibold">{filteredMovements.length}</span> movimenti
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetFilters}
              >
                Reset Filtri
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Movements Table */}
      <Card>
        <Table columns={columns} data={filteredMovements} />

        {filteredMovements.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun movimento trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter !== 'ALL' || dateFrom || dateTo
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non ci sono movimenti da visualizzare'}
            </p>
          </div>
        )}

        {/* Pagination Info */}
        {filteredMovements.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              Visualizzati {filteredMovements.length} movimenti (limite: {limit})
            </div>
            {filteredMovements.length >= limit && (
              <div className="text-sm text-orange-600">
                Raggiunto limite di caricamento. Usa i filtri per affinare la ricerca.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StockMovementsPage;

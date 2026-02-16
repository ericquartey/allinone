import { useState, useMemo } from 'react';
import {
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Loading from '../components/common/Loading';
import Badge from '../components/common/Badge';
import { useMovements } from '../hooks/useMovements';

function MovementsPage() {
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [articleId, setArticleId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [movementType, setMovementType] = useState('');

  // Fetch movements data from real API
  const { data, isLoading, isError, error, refetch } = useMovements({
    skip: page * pageSize,
    take: pageSize,
    orderBy: 'data DESC',
    articleId: articleId || null,
    fromDate: fromDate || null,
    toDate: toDate || null,
    movementType: movementType || null,
  });

  const movements = data?.exported || data?.result || [];
  const totalCount = data?.recordNumber || 0;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!movements.length) {
      return {
        totalMovements: totalCount,
        incomingMovements: 0,
        outgoingMovements: 0,
        uniqueArticles: 0,
      };
    }

    const incoming = movements.filter(m => m.quantity > 0).length;
    const outgoing = movements.filter(m => m.quantity < 0).length;
    const uniqueArticles = new Set(movements.map(m => m.articleId || m.item?.id)).size;

    return {
      totalMovements: totalCount,
      incomingMovements: incoming,
      outgoingMovements: outgoing,
      uniqueArticles,
    };
  }, [movements, totalCount]);

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'data',
      header: 'Data',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">
            {row.original.data
              ? new Date(row.original.data).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'item.codice',
      header: 'Codice Articolo',
      cell: ({ row }) => (
        <span className="font-medium text-ferretto-red">
          {row.original.item?.codice || row.original.articleId || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'item.descrizione',
      header: 'Descrizione',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.item?.descrizione}>
          {row.original.item?.descrizione || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantità',
      cell: ({ row }) => {
        const quantity = row.original.quantity || 0;
        const isIncoming = quantity > 0;
        return (
          <div className="flex items-center space-x-2">
            {isIncoming ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`font-semibold ${
                isIncoming ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isIncoming ? '+' : ''}
              {quantity} {row.original.item?.um || 'PZ'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'movementType',
      header: 'Tipo Movimento',
      cell: ({ row }) => {
        const type = row.original.movementType || row.original.tipoMovimento || '-';
        let variant = 'gray';

        if (type.toLowerCase().includes('carico') || type.toLowerCase().includes('versamento')) {
          variant = 'green';
        } else if (type.toLowerCase().includes('scarico') || type.toLowerCase().includes('prelievo')) {
          variant = 'red';
        } else if (type.toLowerCase().includes('rettifica')) {
          variant = 'yellow';
        }

        return <Badge variant={variant}>{type}</Badge>;
      },
    },
    {
      accessorKey: 'location.codice',
      header: 'Ubicazione',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.location?.codice || row.original.locationId || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'lot',
      header: 'Lotto',
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {row.original.lot || row.original.lotto || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Utente',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.user || row.original.utente || '-'}
        </span>
      ),
    },
  ];

  const handleResetFilters = () => {
    setArticleId('');
    setFromDate('');
    setToDate('');
    setMovementType('');
    setPage(0);
  };

  const handleApplyFilters = () => {
    setPage(0);
    refetch();
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">
            Errore nel caricamento dei movimenti: {error?.message || 'Errore sconosciuto'}
          </p>
          <Button onClick={() => refetch()}>Riprova</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimenti di Magazzino</h1>
          <p className="text-gray-600 mt-1">
            Storico completo dei movimenti di carico e scarico
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati in tempo reale dal server EjLog
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={FunnelIcon}
          >
            Filtri
          </Button>
          <Button variant="outline" icon={ArrowDownTrayIcon}>
            Esporta
          </Button>
          <Button variant="primary" onClick={() => refetch()} icon={ArrowPathIcon}>
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Movimenti Totali</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalMovements.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Carichi</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.incomingMovements.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Scarichi</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.outgoingMovements.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
              <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Articoli Coinvolti</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.uniqueArticles.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-ferretto-red to-red-600">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri di Ricerca</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Articolo
              </label>
              <input
                type="text"
                value={articleId}
                onChange={(e) => setArticleId(e.target.value)}
                placeholder="Codice o ID articolo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Da
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data A
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Movimento
              </label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              >
                <option value="">Tutti</option>
                <option value="CARICO">Carico</option>
                <option value="SCARICO">Scarico</option>
                <option value="RETTIFICA">Rettifica</option>
                <option value="VERSAMENTO">Versamento</option>
                <option value="PRELIEVO">Prelievo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilters}>
              Applica Filtri
            </Button>
          </div>
        </Card>
      )}

      {/* Movements Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista Movimenti ({totalCount.toLocaleString()})
          </h3>
          <div className="text-sm text-gray-600">
            Pagina {page + 1} di {Math.ceil(totalCount / pageSize) || 1}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Caricamento movimenti..." />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12">
            <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun movimento trovato</p>
            <p className="text-gray-400 text-sm mt-2">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        ) : (
          <Table
            data={movements}
            columns={columns}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default MovementsPage;

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Loading from '../components/common/Loading';
import { useStock } from '../hooks/useStock';

function StockPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(1000); // Mostra tutti i record (max 1000)
  const [searchCode, setSearchCode] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [lotFilter, setLotFilter] = useState('');
  const [showOnlyPositive, setShowOnlyPositive] = useState(true);

  // Fetch stock data from real API
  const { data, isLoading, isError, error } = useStock({
    skip: page * pageSize,
    take: pageSize,
    orderBy: 'item.codice',
    searchCode: searchCode || null,
    searchDescription: searchDescription || null,
    locationId: locationFilter || null,
    lot: lotFilter || null,
    showOnlyPositive: showOnlyPositive,
  });

  // Extract stock from response
  const stock = data?.stock || [];
  const totalCount = data?.totalCount || 0;

  const getStockStatus = (stockItem) => {
    const quantity = stockItem.stockedQuantity || 0;
    const threshold = stockItem.inventoryThreshold || 0;

    if (quantity === 0) return { label: 'Esaurito', color: 'red' };
    if (quantity < threshold)
      return { label: 'Sotto Soglia', color: 'orange' };
    return { label: 'Disponibile', color: 'green' };
  };

  const getStatusBadge = (stockItem) => {
    const status = getStockStatus(stockItem);
    const styles = {
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
    };

    return (
      <div className="flex items-center space-x-2">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status.color]}`}
        >
          {status.label}
        </span>
        {(status.color === 'red' || status.color === 'orange') && (
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
        )}
      </div>
    );
  };

  const columns = [
    {
      accessorKey: 'item.codice',
      header: 'Codice',
      cell: ({ row }) => (
        <span className="font-medium text-ferretto-red">
          {row.original.item?.codice || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'item.descrizione',
      header: 'Descrizione',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.item?.descrizione || '-'}</span>
      ),
    },
    {
      accessorKey: 'lot',
      header: 'Lotto',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.lot || '-'}</span>
      ),
    },
    {
      accessorKey: 'stockedQuantity',
      header: 'Giacenza',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">
            {row.original.stockedQuantity || 0} {row.original.item?.um || 'PZ'}
          </div>
          <div className="text-xs text-gray-500">
            Soglia: {row.original.inventoryThreshold || 0}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'expirationDate',
      header: 'Scadenza',
      cell: ({ row }) => {
        const date = row.original.expirationDate;
        return date ? new Date(date).toLocaleDateString('it-IT') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => getStatusBadge(row.original),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento giacenze dal server..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento delle giacenze
        </div>
        <div className="text-gray-600">
          {error?.message || 'Errore sconosciuto'}
        </div>
        <Button onClick={() => window.location.reload()}>
          Ricarica la pagina
        </Button>
      </div>
    );
  }

  // Calculate statistics from real data
  const lowStockItems = stock.filter(
    (item) => (item.stockedQuantity || 0) < (item.inventoryThreshold || 0) && item.stockedQuantity > 0
  ).length;
  const outOfStockItems = stock.filter((item) => (item.stockedQuantity || 0) === 0).length;

  // For now, we'll calculate category distribution from the stock data if available
  // In a production environment, this could come from a separate analytics API
  const categoryDistribution = stock.reduce((acc, item) => {
    const category = item.item?.categoriaDesc || 'Altro';
    const existing = acc.find(c => c.name === category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: category,
        value: 1,
        color: ['#E30613', '#32373c', '#3b82f6', '#10b981', '#f59e0b'][acc.length % 5]
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestione Giacenze
          </h1>
          <p className="text-gray-600 mt-1">
            {totalCount} giacenze totali • Pagina {page + 1} • {stock.length} visualizzate
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati dal server EjLog
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filtri
          </Button>
          <Button variant="primary" onClick={() => toast.info('Export in sviluppo')}>
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Esporta Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Giacenze Totali</p>
              <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stock.length} in questa pagina
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sotto Soglia</p>
              <p className="text-3xl font-bold text-orange-600">
                {lowStockItems}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Richiedono attenzione
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Esauriti</p>
              <p className="text-3xl font-bold text-red-600">
                {outOfStockItems}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Giacenza zero
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Articolo
              </label>
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                placeholder="Cerca per codice..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <input
                type="text"
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                placeholder="Cerca per descrizione..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lotto
              </label>
              <input
                type="text"
                value={lotFilter}
                onChange={(e) => setLotFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                placeholder="Filtra per lotto..."
              />
            </div>
            <div className="flex items-end">
              <div className="w-full space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showOnlyPositive}
                    onChange={(e) => setShowOnlyPositive(e.target.checked)}
                    className="rounded border-gray-300 text-ferretto-red focus:ring-ferretto-red"
                  />
                  <span className="text-sm text-gray-700">Solo giacenze positive</span>
                </label>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchCode('');
                    setSearchDescription('');
                    setLotFilter('');
                    setLocationFilter('');
                    setShowOnlyPositive(true);
                  }}
                  className="w-full"
                >
                  Pulisci Filtri
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuzione per Categoria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Location Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Articoli per Ubicazione
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="location" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="items"
                fill="#E30613"
                radius={[8, 8, 0, 0]}
                name="Articoli"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Stock Table */}
      <Card padding="none">
        <div className="p-6">
          <Table data={stock} columns={columns} pageSize={10} searchable />
        </div>
      </Card>
    </div>
  );
}

export default StockPage;

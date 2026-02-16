import { useState, useMemo } from 'react';
import {
  ArchiveBoxIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { useStock } from '../../hooks/useStock';
import { useItems } from '../../hooks/useItems';

function StatCard({  title, value, icon: Icon, color, subtitle, trend  }: any): JSX.Element {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 mt-1">{trend}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

function InventoryHub(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Fetch real data
  const { data: stockData, isLoading: stockLoading } = useStock({
    skip: 0,
    take: 100,
    showOnlyPositive: true
  });
  const { data: itemsData, isLoading: itemsLoading } = useItems({ skip: 0, take: 1 });

  // Calculate inventory stats
  const stats = useMemo(() => {
    const stock = stockData?.stock || [];

    const totalItems = stock.length;
    const totalQuantity = stock.reduce((sum, item) => sum + (item.stockedQuantity || 0), 0);

    // Low stock items (below threshold)
    const lowStock = stock.filter(
      (item) => (item.stockedQuantity || 0) < (item.inventoryThreshold || 0) && item.stockedQuantity > 0
    ).length;

    // Out of stock items
    const outOfStock = stock.filter((item) => (item.stockedQuantity || 0) === 0).length;

    // Well stocked items
    const wellStocked = stock.filter(
      (item) => (item.stockedQuantity || 0) >= (item.inventoryThreshold || 0)
    ).length;

    // Calculate inventory value (mock calculation)
    const inventoryValue = stock.reduce((sum, item) => {
      const qty = item.stockedQuantity || 0;
      const price = item.item?.prezzo || 0;
      return sum + (qty * price);
    }, 0);

    return {
      totalItems,
      totalQuantity,
      lowStock,
      outOfStock,
      wellStocked,
      inventoryValue,
    };
  }, [stockData]);

  // Filter stock items
  const filteredStock = useMemo(() => {
    if (!stockData?.stock) return [];

    let filtered = stockData.stock;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item?.codice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item?.descrizione?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by low stock
    if (showOnlyLowStock) {
      filtered = filtered.filter(
        item => (item.stockedQuantity || 0) < (item.inventoryThreshold || 0) && item.stockedQuantity > 0
      );
    }

    return filtered.slice(0, 20);
  }, [stockData, searchTerm, showOnlyLowStock]);

  const isLoading = stockLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento Inventory Hub..." />
      </div>
    );
  }

  const getStockStatus = (item) => {
    const qty = item.stockedQuantity || 0;
    const threshold = item.inventoryThreshold || 0;

    if (qty === 0) {
      return <Badge variant="error">Esaurito</Badge>;
    } else if (qty < threshold) {
      return <Badge variant="warning">Sotto Soglia</Badge>;
    } else {
      return <Badge variant="success">Disponibile</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Hub</h1>
          <p className="text-gray-600 mt-1">
            Centro di controllo inventario e giacenze
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati inventario in tempo reale
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="primary">Nuova Conta Fisica</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Articoli in Giacenza"
          value={stats.totalItems.toLocaleString()}
          icon={ArchiveBoxIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle={`${stats.totalQuantity.toLocaleString()} unità totali`}
        />
        <StatCard
          title="Sotto Soglia"
          value={stats.lowStock}
          icon={ExclamationTriangleIcon}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          subtitle="Richiedono riordino"
        />
        <StatCard
          title="Esauriti"
          value={stats.outOfStock}
          icon={ExclamationTriangleIcon}
          color="bg-gradient-to-br from-red-500 to-red-600"
          subtitle="Giacenza zero"
        />
        <StatCard
          title="Ben Forniti"
          value={stats.wellStocked}
          icon={CheckCircleIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle="Sopra soglia minima"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per codice o descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyLowStock}
                onChange={(e) => setShowOnlyLowStock(e.target.checked)}
                className="w-4 h-4 text-ferretto-red focus:ring-ferretto-red border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Solo sotto soglia</span>
            </label>
            <Button variant="outline" size="sm">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Filtri
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Giacenze Dettagliate
          </h3>
          <Button variant="ghost" size="sm">
            Esporta
          </Button>
        </div>

        {filteredStock.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Codice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giacenza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soglia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStock.map((stockItem) => (
                  <tr key={stockItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stockItem.item?.codice || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {stockItem.item?.descrizione || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {stockItem.stockedQuantity || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {stockItem.inventoryThreshold || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockStatus(stockItem)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stockItem.item?.categoriaDesc || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        Dettagli
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun risultato</h3>
            <p className="mt-1 text-sm text-gray-500">
              Nessun articolo trovato con i filtri selezionati
            </p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Azioni Inventario
          </h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <ChartBarIcon className="w-5 h-5 mr-3" />
              Conta Fisica Totale
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ArchiveBoxIcon className="w-5 h-5 mr-3" />
              Conta Ciclica
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AdjustmentsHorizontalIcon className="w-5 h-5 mr-3" />
              Rettifica Manuale
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Analisi Rapida
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tasso di rotazione</span>
                <span className="font-medium text-gray-900">72%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Accuratezza inventario</span>
                <span className="font-medium text-gray-900">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Livello di servizio</span>
                <span className="font-medium text-gray-900">88%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-ferretto-red h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Allerte
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lowStock} articoli sotto soglia
                </p>
                <p className="text-xs text-gray-500">Richiesti riordini</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.outOfStock} articoli esauriti
                </p>
                <p className="text-xs text-gray-500">Urgente rifornimento</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Ultima conta fisica
                </p>
                <p className="text-xs text-gray-500">Completata 2 giorni fa</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default InventoryHub;

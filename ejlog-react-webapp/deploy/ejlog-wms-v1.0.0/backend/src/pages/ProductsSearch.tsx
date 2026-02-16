/**
 * Products Search Page
 * Displays warehouse stock/products with filters and operations
 * Replicates functionality from EjLog Swing interface
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { StockItem, StockFilters } from '../types/stock';
import { fetchStock, downloadStockAsCSV } from '../services/stockApi';

export default function ProductsSearch() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters state
  const [filters, setFilters] = useState<StockFilters>({
    limit: 10000,
    offset: 0,
  });

  // Search field states
  const [searchItem, setSearchItem] = useState('');
  const [searchLot, setSearchLot] = useState('');
  const [searchSerial, setSearchSerial] = useState('');
  const [searchWarehouse, setSearchWarehouse] = useState<string>('');
  const [searchTray, setSearchTray] = useState<string>('');

  // Load stock data
  const loadStock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchStock(filters);
      setStockItems(response.exported);
      setTotalRecords(response.recordNumber);
      toast.success(`Caricati ${response.recordNumber} prodotti`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(message);
      toast.error(`Errore: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadStock();
  }, []);

  // Handle search/refresh
  const handleSearch = () => {
    const newFilters: StockFilters = {
      limit: 10000,
      offset: 0,
    };

    if (searchItem.trim()) {
      newFilters.itemCode = searchItem.trim();
    }
    if (searchLot.trim()) {
      newFilters.lot = searchLot.trim();
    }
    if (searchSerial.trim()) {
      newFilters.serialNumber = searchSerial.trim();
    }
    if (searchWarehouse.trim()) {
      newFilters.warehouseId = parseInt(searchWarehouse);
    }
    if (searchTray.trim()) {
      newFilters.trayId = parseInt(searchTray);
    }

    setFilters(newFilters);
    loadStock();
  };

  // Clear filters
  const handleClear = () => {
    setSearchItem('');
    setSearchLot('');
    setSearchSerial('');
    setSearchWarehouse('');
    setSearchTray('');
    setFilters({ limit: 10000, offset: 0 });
    toast.success('Filtri puliti');
  };

  // Refresh data
  const handleRefresh = () => {
    loadStock();
  };

  // Extract to CSV
  const handleExtract = () => {
    if (stockItems.length === 0) {
      toast.error('Nessun dato da esportare');
      return;
    }

    downloadStockAsCSV(stockItems, `stock-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Dati esportati in CSV');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ricerca Prodotti / Stock</h1>
          <p className="text-gray-600 mt-2">
            Totale: {totalRecords} prodotti
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Item Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Articolo
              </label>
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es: ITEM001"
              />
            </div>

            {/* Lot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lotto
              </label>
              <input
                type="text"
                value={searchLot}
                onChange={(e) => setSearchLot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Numero lotto"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matricola
              </label>
              <input
                type="text"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Numero seriale"
              />
            </div>

            {/* Warehouse ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magazzino
              </label>
              <input
                type="number"
                value={searchWarehouse}
                onChange={(e) => setSearchWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ID Magazzino"
              />
            </div>

            {/* Tray/UDC ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UDC / Tray
              </label>
              <input
                type="number"
                value={searchTray}
                onChange={(e) => setSearchTray(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ID UDC"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Ricerca
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              Aggiorna
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
            >
              Pulisci
            </button>
            <button
              onClick={handleExtract}
              disabled={isLoading || stockItems.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              Estrai CSV
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Caricamento in corso...</p>
          </div>
        )}

        {/* Stock Table */}
        {!isLoading && stockItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Magazzino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Codice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrizione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lotto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matricola
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scadenza
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantità
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UDC
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.warehouseId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.item}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.lot || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.serialNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.expiryDate || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {item.qty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        {item.LU || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && stockItems.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">Nessun prodotto trovato</p>
            <p className="text-gray-400 mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        )}
      </div>
    </div>
  );
}

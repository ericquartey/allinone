import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Package,
  Loader2,
  AlertCircle,
  ShoppingCart,
  XCircle,
  Archive,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types
interface StockItem {
  code: string;
  description: string;
  lot?: string;
  warehouseId: number;
  quantity: number;
}

interface SearchFilters {
  code?: string;
  description?: string;
}

const MAX_RESULTS = 100;

export default function StockInventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // State
  const [filters, setFilters] = useState<SearchFilters>({
    code: searchParams.get('code') || '',
    description: searchParams.get('description') || '',
  });
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [pickingQuantity, setPickingQuantity] = useState<string>('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  // Focus code input on mount
  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  // Auto-search if params exist
  useEffect(() => {
    const codeParam = searchParams.get('code');
    const descParam = searchParams.get('description');
    if (codeParam || descParam) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    // Validate at least one filter
    if (!filters.code?.trim() && !filters.description?.trim()) {
      toast.error('Inserisci almeno un criterio di ricerca');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.code?.trim()) params.append('code', filters.code.trim());
      if (filters.description?.trim()) params.append('description', filters.description.trim());
      params.append('limit', MAX_RESULTS.toString());
      params.append('onlyPositive', 'true'); // Only show positive stock

      // Update URL with search params
      setSearchParams(params);

      // Call API
      const response = await fetch(`http://localhost:3077/api/stock/inventory?${params}`);

      if (!response.ok) {
        throw new Error('Errore durante la ricerca giacenze');
      }

      const data = await response.json();
      setStockItems(data);

      if (data.length === 0) {
        toast.success('Nessuna giacenza trovata');
      } else if (data.length === MAX_RESULTS) {
        toast.success(`Trovate ${MAX_RESULTS} giacenze (limite massimo raggiunto)`);
      } else {
        toast.success(`Trovate ${data.length} giacenze`);
      }
    } catch (err) {
      console.error('Stock search error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la ricerca');
      toast.error('Errore durante la ricerca giacenze');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ code: '', description: '' });
    setStockItems([]);
    setHasSearched(false);
    setError(null);
    setSearchParams({});
    codeInputRef.current?.focus();
  };

  const handleRowClick = (item: StockItem) => {
    setSelectedItem(item);
    setPickingQuantity('');
    setShowQuantityModal(true);
  };

  const handleCreatePicking = async () => {
    if (!selectedItem) return;

    const qty = parseFloat(pickingQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    if (qty > selectedItem.quantity) {
      toast.error('Quantità richiesta superiore alla giacenza disponibile');
      return;
    }

    try {
      // Call API to create picking order
      const response = await fetch('http://localhost:3077/api/picking-orders/temporary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCode: selectedItem.code,
          quantity: qty,
          userName: 'current-user', // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Errore durante la creazione ordine picking');
      }

      toast.success(`Ordine picking creato: ${selectedItem.code} - Qta ${qty}`);
      setShowQuantityModal(false);
      setSelectedItem(null);
      setPickingQuantity('');
    } catch (err) {
      console.error('Create picking error:', err);
      toast.error('Errore durante la creazione ordine picking');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const getTotalQuantity = () => {
    return stockItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Archive className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Giacenza</h1>
        </div>
        <p className="text-gray-600">
          Visualizza giacenze per codice o descrizione articolo (solo giacenze positive)
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Code Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Articolo
            </label>
            <div className="relative">
              <input
                ref={codeInputRef}
                type="text"
                value={filters.code}
                onChange={(e) => setFilters({ ...filters, code: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Codice articolo..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={isLoading}
              />
              <Package className="absolute right-3 top-3.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.description}
                onChange={(e) => setFilters({ ...filters, description: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Descrizione articolo..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={isLoading}
              />
              <Search className="absolute right-3 top-3.5 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Ricerca in corso...
              </>
            ) : (
              <>
                <Search size={20} />
                Cerca
              </>
            )}
          </button>

          <button
            onClick={handleClearFilters}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle size={20} />
            Pulisci
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-900 mb-1">Errore</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {hasSearched && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Risultati ({stockItems.length})
              {stockItems.length === MAX_RESULTS && (
                <span className="text-sm font-normal text-orange-600 ml-2">
                  (Limite massimo raggiunto)
                </span>
              )}
            </h2>
            {stockItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-green-600" />
                <span className="font-medium text-gray-700">
                  Totale: <span className="text-green-600">{getTotalQuantity()}</span>
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Ricerca in corso...</p>
              </div>
            </div>
          ) : stockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Archive size={48} className="mb-4 text-gray-400" />
              <p className="text-lg font-medium">Nessuna giacenza trovata</p>
              <p className="text-sm">Prova a modificare i criteri di ricerca</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Codice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrizione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lotto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantità
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {item.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.lot ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {item.lot}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-bold text-green-600">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Crea ordine picking"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {stockItems.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
              Visualizzate {stockItems.length} di max {MAX_RESULTS} giacenze (solo positive)
            </div>
          )}
        </div>
      )}

      {/* Quantity Modal */}
      {showQuantityModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Crea Ordine Picking
            </h3>

            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Codice:</div>
                  <div className="font-medium text-gray-900">{selectedItem.code}</div>
                  <div className="text-gray-600">Descrizione:</div>
                  <div className="font-medium text-gray-900 truncate">{selectedItem.description}</div>
                  <div className="text-gray-600">Disponibile:</div>
                  <div className="font-bold text-green-600">{selectedItem.quantity}</div>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità da prelevare
              </label>
              <input
                type="number"
                value={pickingQuantity}
                onChange={(e) => setPickingQuantity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePicking();
                  }
                }}
                placeholder="0"
                min="0"
                max={selectedItem.quantity}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center font-bold"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: {selectedItem.quantity}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreatePicking}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Conferma
              </button>
              <button
                onClick={() => {
                  setShowQuantityModal(false);
                  setSelectedItem(null);
                  setPickingQuantity('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


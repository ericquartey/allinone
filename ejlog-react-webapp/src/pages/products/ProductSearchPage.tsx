// ============================================================================
// EJLOG WMS - Product Search Page
// Ricerca prodotti nel sistema
// ============================================================================

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  MapPin,
  AlertCircle,
  Eye,
  XCircle,
  Barcode,
} from 'lucide-react';

interface Product {
  id: number;
  code: string;
  description: string;
  location?: string;
  stock?: number;
  uom?: string;
}

// Mock data per dimostrazione
const MOCK_PRODUCTS: Product[] = [
  { id: 1, code: 'ART001', description: 'Vite M6x20 zincata', location: 'A-01-02', stock: 1500, uom: 'PZ' },
  { id: 2, code: 'ART002', description: 'Dado M6 autobloccante', location: 'A-01-03', stock: 2300, uom: 'PZ' },
  { id: 3, code: 'ART003', description: 'Rondella M6 piana', location: 'A-01-04', stock: 3200, uom: 'PZ' },
  { id: 4, code: 'ART004', description: 'Bullone M8x30 classe 8.8', location: 'A-02-01', stock: 850, uom: 'PZ' },
  { id: 5, code: 'ART005', description: 'Guarnizione OR 20x3', location: 'B-01-05', stock: 450, uom: 'PZ' },
  { id: 6, code: 'MAT001', description: 'Lamiera acciaio 2mm', location: 'C-01-01', stock: 120, uom: 'KG' },
  { id: 7, code: 'MAT002', description: 'Tubo acciaio Ø25mm', location: 'C-02-03', stock: 340, uom: 'MT' },
  { id: 8, code: 'ELE001', description: 'Motore elettrico 2.2kW', location: 'D-01-01', stock: 12, uom: 'PZ' },
  { id: 9, code: 'ELE002', description: 'Riduttore 1:50', location: 'D-01-02', stock: 8, uom: 'PZ' },
  { id: 10, code: 'HYD001', description: 'Cilindro idraulico Ø50', location: 'E-01-01', stock: 6, uom: 'PZ' },
];

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  const [searchCode, setSearchCode] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    const code = searchCode.trim().toLowerCase();
    const desc = searchDescription.trim().toLowerCase();

    if (!code && !desc) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Filtra i prodotti mock
    const filtered = MOCK_PRODUCTS.filter((product) => {
      const matchCode = !code || product.code.toLowerCase().includes(code);
      const matchDesc = !desc || product.description.toLowerCase().includes(desc);
      return matchCode && matchDesc;
    });

    setResults(filtered);
    setHasSearched(true);
  };

  const handleReset = () => {
    setSearchCode('');
    setSearchDescription('');
    setResults([]);
    setHasSearched(false);
    codeInputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Search className="w-8 h-8 text-ferretto-red" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ricerca Prodotti</h1>
            <p className="text-sm text-gray-600 mt-1">
              Cerca prodotti per codice o descrizione
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Barcode className="w-4 h-4 inline mr-1" />
                Codice Prodotto
              </label>
              <input
                ref={codeInputRef}
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="es. ART001, MAT..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>

            {/* Description Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Descrizione
              </label>
              <input
                type="text"
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="es. vite, motore..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              className="flex items-center space-x-2 px-6 py-2 bg-ferretto-red text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Cerca</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Risultati Ricerca {results.length > 0 && `(${results.length})`}
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nessun prodotto trovato</p>
              <p className="text-sm text-gray-500 mt-1">
                Prova a modificare i criteri di ricerca
              </p>
            </div>
          ) : (
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
                      Ubicazione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giacenza
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Barcode className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {product.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{product.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{product.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {product.stock} {product.uom}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="inline-flex items-center space-x-1 text-ferretto-red hover:text-red-700"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">Dettagli</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      {!hasSearched && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Info:</strong> Inserisci un codice prodotto o una descrizione per iniziare la ricerca.
            Puoi utilizzare entrambi i filtri contemporaneamente per risultati più precisi.
          </p>
        </div>
      )}
    </div>
  );
}

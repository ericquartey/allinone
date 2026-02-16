// ============================================================================
// EJLOG WMS - Loading Units Page Real
// Pagina UDC completa con dati reali dal backend EjLog (porta 3077)
// Visualizzazione gerarchica: UDC → Scompartimenti → Prodotti
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PackageIcon,
  AlertTriangleIcon,
  BoxIcon,
  GridIcon,
  LayersIcon,
  SearchIcon,
  RefreshCwIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from 'lucide-react';
import Badge from '../../components/shared/Badge';
import {
  useGetLoadingUnitsQuery,
  useGetCompartmentsByLoadingUnitQuery,
} from '../../services/api/loadingUnitsApi';
import type { LoadingUnit, Compartment, Product } from '../../types/models';

/**
 * Componente per mostrare un singolo prodotto in un compartimento
 */
const ProductRow: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
      <PackageIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-blue-600">
            {product.item.code}
          </span>
          <span className="text-sm text-gray-700 truncate">
            {product.item.description}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
          <span>Qta: <strong>{product.stockedQuantity.toFixed(2)}</strong> {product.item.measureUnitDescription}</span>
          {product.lot && (
            <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
              Lotto: {product.lot}
            </span>
          )}
          {product.serialNumber && (
            <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
              SN: {product.serialNumber}
            </span>
          )}
          {product.expirationDate && (
            <span className="text-orange-600">
              Scad: {new Date(product.expirationDate).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente per mostrare un singolo compartimento con i suoi prodotti
 */
const CompartmentCard: React.FC<{ compartment: Compartment; udcId: number }> = ({
  compartment,
  udcId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasProducts = compartment.products && compartment.products.length > 0;
  const productsCount = compartment.products?.length || 0;

  const getFillColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header compartimento */}
      <div
        className="flex items-center gap-3 p-3 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        )}
        <GridIcon className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Compartimento #{compartment.id}</span>
            {compartment.barcode && (
              <span className="font-mono text-xs text-gray-600 bg-white px-2 py-0.5 rounded border">
                {compartment.barcode}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Dimensioni: {compartment.width}x{compartment.depth}
            {compartment.height && `x${compartment.height}`} mm | Pos: X{compartment.xPosition} Y{compartment.yPosition}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={productsCount > 0 ? 'success' : 'default'} size="sm">
            {productsCount} prodott{productsCount === 1 ? 'o' : 'i'}
          </Badge>
          <div className={`font-semibold ${getFillColor(compartment.fillPercentage)}`}>
            {compartment.fillPercentage}%
          </div>
        </div>
      </div>

      {/* Prodotti (espandibili) */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-white">
          {hasProducts ? (
            compartment.products!.map((product, idx) => (
              <ProductRow key={idx} product={product} />
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              Nessun prodotto in questo compartimento
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Componente per mostrare una singola UDC con i suoi compartimenti
 */
const LoadingUnitCard: React.FC<{ udc: LoadingUnit }> = ({ udc }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Query compartimenti solo se espanso
  const {
    data: compartments,
    isLoading: loadingCompartments,
    error: compartmentsError,
  } = useGetCompartmentsByLoadingUnitQuery(
    { id: udc.id, includeProducts: true },
    { skip: !isExpanded }
  );

  const getFillColor = (rate: number) => {
    if (rate >= 0.8) return 'bg-red-100 border-red-300';
    if (rate >= 0.5) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  return (
    <div className={`border-2 rounded-xl overflow-hidden shadow-md ${getFillColor(udc.areaFillRate)}`}>
      {/* Header UDC */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-700" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-gray-700" />
        )}
        <BoxIcon className="w-8 h-8 text-blue-700" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">UDC #{udc.id}</span>
            {udc.barcode && (
              <span className="font-mono text-sm text-gray-700 bg-white px-3 py-1 rounded-md border border-gray-300">
                {udc.barcode}
              </span>
            )}
            {udc.isBlockedFromEjlog && (
              <Badge variant="danger" size="sm">
                Bloccata
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            Dimensioni: {udc.width}x{udc.depth}
            {udc.height && `x${udc.height}`} mm
            {udc.currentLocation && ` | Posizione: ${udc.currentLocation}`}
            {udc.machineId && ` | Macchina: ${udc.machineId}`}
            {udc.bayNumber && ` | Baia: ${udc.bayNumber}`}
          </div>
          {udc.note && (
            <div className="text-xs text-gray-600 mt-1 italic">
              Note: {udc.note}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{udc.compartmentsCount}</div>
            <div className="text-xs text-gray-600">Compartimenti</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">
              {Math.round(udc.areaFillRate * 100)}%
            </div>
            <div className="text-xs text-gray-600">Riempimento</div>
          </div>
        </div>
      </div>

      {/* Compartimenti (espandibili) */}
      {isExpanded && (
        <div className="p-4 bg-white border-t-2">
          {loadingCompartments && (
            <div className="text-center py-8 text-gray-600">
              <RefreshCwIcon className="w-8 h-8 mx-auto mb-2 animate-spin" />
              Caricamento compartimenti...
            </div>
          )}

          {compartmentsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700">
              <AlertTriangleIcon className="w-6 h-6 mx-auto mb-2" />
              Errore caricamento compartimenti
            </div>
          )}

          {!loadingCompartments && !compartmentsError && compartments && (
            <div className="space-y-3">
              {compartments.length > 0 ? (
                compartments.map((compartment) => (
                  <CompartmentCard key={compartment.id} compartment={compartment} udcId={udc.id} />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nessun compartimento trovato per questa UDC
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Pagina principale LoadingUnitsPageReal
 */
const LoadingUnitsPageReal: React.FC = () => {
  const navigate = useNavigate();

  // Filtri
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);

  // Query UDC
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetLoadingUnitsQuery({
    skip,
    take,
    search,
  });

  // Filtra le UDC localmente (se necessario)
  const filteredUDCs = useMemo(() => {
    if (!data?.data) return [];
    return data.data;
  }, [data]);

  // Statistiche
  const stats = useMemo(() => {
    if (!filteredUDCs || filteredUDCs.length === 0) {
      return {
        total: 0,
        totalCompartments: 0,
        avgFillRate: 0,
        blocked: 0,
      };
    }

    const total = filteredUDCs.length;
    const totalCompartments = filteredUDCs.reduce((sum, udc) => sum + udc.compartmentsCount, 0);
    const avgFillRate =
      filteredUDCs.reduce((sum, udc) => sum + udc.areaFillRate, 0) / total;
    const blocked = filteredUDCs.filter((udc) => udc.isBlockedFromEjlog).length;

    return {
      total,
      totalCompartments,
      avgFillRate: Math.round(avgFillRate * 100),
      blocked,
    };
  }, [filteredUDCs]);

  // Rendering errore
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Errore caricamento UDC
          </h2>
          <p className="text-red-700 mb-4">
            Impossibile connettersi al backend EjLog sulla porta 3077.
            <br />
            Verifica che il backend sia avviato e accessibile.
            <br />
            Endpoint: GET /EjLogHostVertimag/api/loading-units
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestione UDC (Unità Di Carico)
          </h1>
          <p className="text-gray-600">Vista completa UDC, compartimenti e prodotti</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Ricarica
          </button>
        </div>
      </div>

      {/* Statistiche Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Totale UDC */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale UDC</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BoxIcon className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Totale Compartimenti */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Compartimenti</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompartments}</p>
            </div>
            <LayersIcon className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        {/* Riempimento Medio */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Riempimento Medio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgFillRate}%</p>
            </div>
            <GridIcon className="w-10 h-10 text-yellow-500 opacity-50" />
          </div>
        </div>

        {/* UDC Bloccate */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">UDC Bloccate</p>
              <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <AlertTriangleIcon className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca UDC per ID, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              setSearch('');
              setSkip(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Filtri
          </button>
        </div>
      </div>

      {/* Info Riga */}
      {!isLoading && data && (
        <div className="text-sm text-gray-600">
          Visualizzate <span className="font-semibold">{filteredUDCs.length}</span> di{' '}
          <span className="font-semibold">{data.total || stats.total}</span> UDC
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCwIcon className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Caricamento UDC...</p>
        </div>
      )}

      {/* Lista UDC */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredUDCs.length > 0 ? (
            filteredUDCs.map((udc) => <LoadingUnitCard key={udc.id} udc={udc} />)
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <BoxIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nessuna UDC trovata</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingUnitsPageReal;


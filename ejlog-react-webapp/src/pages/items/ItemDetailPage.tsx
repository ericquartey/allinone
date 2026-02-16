import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeftIcon,
  PencilIcon,
  CubeIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon,
  CurrencyEuroIcon,
  ScaleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Table from '../../components/common/Table';

// Real API function to fetch item details
const fetchItemDetail = async (id: string) => {
  const response = await axios.get(`/api/items/${id}`);

  if (!response.data.success) {
    throw new Error('Failed to fetch item details');
  }

  const item = response.data.data;

  // Map backend response to frontend format
  return {
    id: item.id,
    codice: item.code,
    descrizione: item.description,
    um: item.unitOfMeasure || 'PZ',
    barcode: item.barcode || '',
    categoriaDesc: item.categoryId ? `Categoria ${item.categoryId}` : 'Non specificata',
    giacenza: item.stock || 0,
    scortaMin: 0, // Not provided by backend
    peso: item.weight || 0,
    prezzoUnitario: item.price || 0,
    isActive: item.isActive,

    // Images from backend
    images: item.images || [],

    // Stock by location - map backend format to frontend format
    stockByLocation: (item.stockByLocation || []).map((loc: any) => ({
      locazione: loc.locationDescription || loc.locationCode || 'N/A',
      giacenza: loc.quantity,
      udcCount: loc.udcCount || 0,
      lastMovement: loc.lastMovement || new Date().toISOString(),
    })),

    // Mock movement history for now
    movements: [],
  };
};

function ItemDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('characteristics');
  const [searchFilter, setSearchFilter] = useState({ warehouse: '', udc: '' });

  // Fetch item details
  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItemDetail(id),
  });

  // Stock by location table columns
  const stockColumns = [
    {
      accessorKey: 'locazione',
      header: 'Locazione',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span className="font-mono font-medium">{row.original.locazione}</span>
        </div>
      ),
    },
    {
      accessorKey: 'giacenza',
      header: 'Giacenza',
      cell: ({ row }) => (
        <span className="font-semibold text-ferretto-red">
          {row.original.giacenza} {item?.um || 'PZ'}
        </span>
      ),
    },
    {
      accessorKey: 'udcCount',
      header: 'N° UDC',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.udcCount}</span>
      ),
    },
    {
      accessorKey: 'lastMovement',
      header: 'Ultimo Movimento',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.original.lastMovement).toLocaleDateString('it-IT')}
        </span>
      ),
    },
  ];

  // Movements table columns
  const movementColumns = [
    {
      accessorKey: 'data',
      header: 'Data',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.data).toLocaleString('it-IT')}
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const colors = {
          ENTRATA: 'bg-green-100 text-green-800',
          USCITA: 'bg-red-100 text-red-800',
          TRASFERIMENTO: 'bg-blue-100 text-blue-800',
        };
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              colors[row.original.tipo] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.tipo}
          </span>
        );
      },
    },
    {
      accessorKey: 'quantita',
      header: 'Quantità',
      cell: ({ row }) => {
        const q = row.original.quantita;
        return (
          <span className={`font-semibold ${q > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {q > 0 ? '+' : ''}{q}
          </span>
        );
      },
    },
    {
      accessorKey: 'locazione',
      header: 'Locazione',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.locazione}</span>
      ),
    },
    {
      accessorKey: 'operatore',
      header: 'Operatore',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.operatore}</span>
      ),
    },
    {
      accessorKey: 'nota',
      header: 'Nota',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.nota || '-'}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento dettagli articolo..." />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento dell'articolo
        </div>
        <Button onClick={() => navigate('/items')}>Torna alla lista</Button>
      </div>
    );
  }

  // Calculate stock percentage - if no min stock level, use a simple 100% when there's stock
  const stockPercentage = item.scortaMin > 0
    ? (item.giacenza / (item.scortaMin * 3)) * 100
    : item.giacenza > 0 ? 100 : 0;
  const isLowStock = item.scortaMin > 0 && item.giacenza < item.scortaMin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/items')}
            className="!p-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dettaglio Articolo
            </h1>
            <p className="text-gray-600 mt-1">
              {item.codice} • {item.descrizione}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="primary">
            <PencilIcon className="w-5 h-5 mr-2" />
            Modifica
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('characteristics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'characteristics'
                ? 'border-ferretto-red text-ferretto-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CubeIcon className="w-5 h-5" />
              <span>Caratteristiche Articolo</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('product-search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'product-search'
                ? 'border-ferretto-red text-ferretto-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-5 h-5" />
              <span>Ricerca Prodotto</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stock-search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stock-search'
                ? 'border-ferretto-red text-ferretto-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ScaleIcon className="w-5 h-5" />
              <span>Ricerca Giacenze</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content: Caratteristiche Articolo */}
      {activeTab === 'characteristics' && (
        <div className="space-y-6">
          {/* Image Gallery Card */}
          {item.images && item.images.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PhotoIcon className="w-5 h-5 mr-2 text-blue-600" />
                Immagini Articolo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {item.images.map((image: any, index: number) => (
                  <div
                    key={image.id || index}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                      image.isPrimary ? 'border-blue-500' : 'border-gray-200'
                    } hover:border-blue-400 transition-all`}
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {image.isPrimary && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Principale
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm">
                        Visualizza
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Status Card - Con colorazione verde se in giacenza */}
          <Card className={`${item.giacenza > 0 ? 'border-2 border-green-500 bg-green-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Stato Giacenza
              </h3>
              {item.giacenza > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  In Giacenza
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Giacenza Attuale</span>
                <span className={`text-2xl font-bold ${item.giacenza > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {item.giacenza} {item.um}
                </span>
              </div>
              {item.scortaMin > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scorta Minima</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {item.scortaMin} {item.um}
                  </span>
                </div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    item.giacenza === 0 ? 'bg-gray-400' : isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
              </div>
              {item.giacenza === 0 && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Articolo non presente in giacenza</span>
                </div>
              )}
              {isLowStock && item.giacenza > 0 && (
                <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Giacenza sotto soglia minima!</span>
                </div>
              )}
            </div>
          </Card>

          {/* Basic Info Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informazioni Base
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CubeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Codice Articolo</div>
                  <div className="font-semibold text-gray-900 font-mono">
                    {item.codice}
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Barcode</div>
                  <div className="font-semibold text-gray-900 font-mono">
                    {item.barcode || '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Categoria</div>
                  <div className="font-semibold text-gray-900">
                    {item.categoriaDesc}
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Unità di Misura</div>
                  <div className="font-semibold text-gray-900">{item.um}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Details */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dettagli Aggiuntivi
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Prezzo Unitario</div>
                <div className="font-semibold text-gray-900">
                  € {item.prezzoUnitario?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Peso</div>
                <div className="font-semibold text-gray-900">
                  {item.peso} kg
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Classe Rotazione</div>
                <div className="font-semibold text-gray-900">
                  {item.classeRotazioneWms || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">UDC Default</div>
                <div className="font-semibold text-gray-900">
                  {item.tipoUdcDefault || '-'}
                </div>
              </div>
            </div>
          </Card>

          {/* Dates - Currently not provided by backend */}
          {item.dataCreazione && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Date Rilevanti
              </h3>
              <div className="space-y-3">
                {item.dataCreazione && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Data Creazione</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(item.dataCreazione).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}
                {item.dataUltimaModifica && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ultima Modifica</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(item.dataUltimaModifica).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}
                {item.dataUltimaMovimentazione && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ultima Movimentazione</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(item.dataUltimaMovimentazione).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
        </div>
      )}

      {/* Tab Content: Ricerca Prodotto */}
      {activeTab === 'product-search' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dettaglio Mappe Presenti in Magazzino
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Visualizza la posizione fisica dell'articolo nelle diverse ubicazioni del magazzino
            </p>

            {/* Mappa Visuale Magazzino */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {item.stockByLocation?.map((location, index) => (
                <div
                  key={index}
                  className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <MapPinIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{location.locazione}</h4>
                        <p className="text-xs text-gray-500">Ubicazione</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      location.giacenza > 50 ? 'bg-green-100 text-green-800' :
                      location.giacenza > 20 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {location.giacenza} {item.um}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">N° UDC:</span>
                      <span className="font-semibold text-gray-900">{location.udcCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ultimo Movimento:</span>
                      <span className="font-medium text-gray-700">
                        {new Date(location.lastMovement).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>

                  {/* Barra progresso giacenza */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        location.giacenza > 50 ? 'bg-green-500' :
                        location.giacenza > 20 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(location.giacenza / item.giacenza) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tabella Dettagliata */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Dettaglio Completo Ubicazioni</h4>
              <Table
                data={item.stockByLocation || []}
                columns={stockColumns}
                pageSize={10}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: Ricerca Giacenze */}
      {activeTab === 'stock-search' && (
        <div className="space-y-6">
          {/* Filtri di ricerca - SEMPLIFICATO */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filtri di Ricerca Giacenze
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cerca Ubicazione
                </label>
                <input
                  type="text"
                  value={searchFilter.warehouse}
                  onChange={(e) => setSearchFilter(prev => ({ ...prev, warehouse: e.target.value }))}
                  placeholder="Filtra per nome ubicazione..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtra per UDC
                </label>
                <input
                  type="text"
                  value={searchFilter.udc}
                  onChange={(e) => setSearchFilter(prev => ({ ...prev, udc: e.target.value }))}
                  placeholder="Cerca UDC..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Raggruppamento per Magazzino - DATI REALI */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ScaleIcon className="w-5 h-5 mr-2 text-blue-600" />
              Giacenze Raggruppate per Magazzino
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.stockByLocation?.map((location, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{location.locazione}</h4>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CubeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Giacenza Totale:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {location.giacenza} {item.um}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">N° UDC:</span>
                      <span className="text-xl font-semibold text-blue-600">{location.udcCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">N° Ubicazioni:</span>
                      <span className="text-xl font-semibold text-gray-600">1</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Raggruppamento per UDC */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CubeIcon className="w-5 h-5 mr-2 text-purple-600" />
              Giacenze Raggruppate per UDC
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UDC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicazione
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giacenza
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ultimo Movimento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {item.stockByLocation?.map((location, index) =>
                    Array.from({ length: location.udcCount }, (_, udcIndex) => (
                      <tr key={`${index}-${udcIndex}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            UDC-{location.locazione}-{udcIndex + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm font-medium">{location.locazione}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.floor(location.giacenza / location.udcCount)} {item.um}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(location.lastMovement).toLocaleDateString('it-IT')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ItemDetailPage;

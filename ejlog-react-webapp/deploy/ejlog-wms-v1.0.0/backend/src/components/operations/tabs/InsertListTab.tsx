/**
 * Tab Inserimento Liste con Carrello Intelligente
 * Permette di creare una nuova lista operations con selezione articoli da giacenza
 * Sistema a carrello per aggiungere più articoli con riordinamento drag & drop
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useCreateListMutation, useAddListRowMutation } from '../../../services/api/listsApi';
import { ItemListType } from '../../../types/models';
import Button from '../../shared/Button';
import Input from '../../shared/Input';
import Alert from '../../shared/Alert';
import Badge from '../../shared/Badge';
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface CartItem {
  id: string; // Temporary ID for cart management
  itemCode: string;
  itemDescription: string;
  availableQuantity: number;
  requestedQuantity: number;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
}

const InsertListTab: React.FC = () => {
  // Form data per la lista (code viene generato automaticamente dal backend)
  const [formData, setFormData] = useState({
    description: '', // Descrizione/riferimento lista
    tipoLista: ItemListType.PICKING, // 0=Picking, 1=Stoccaggio, 2=Inventario/Refill
    priority: 1,
    areaId: 1,
  });

  // Stato carrello
  const [cart, setCart] = useState<CartItem[]>([]);

  // Ricerca articoli
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductList, setShowProductList] = useState(false); // Chiusa di default

  // Stato per prodotti caricati manualmente
  const [productsData, setProductsData] = useState<any>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<any>(null);

  // Carica prodotti solo quando l'utente apre la sezione prodotti (lazy load)
  useEffect(() => {
    if (!showProductList || productsData) return;
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);

        const response = await fetch('/api/EjLogHostVertimag/Stock?limit=500&skip=0');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const rawData = await response.json();
        const sourceData = rawData.data || rawData.stock || rawData.exportedItems || [];

        const transformedData = sourceData.map((rawProduct: any, idx: number) => {
          if (idx === 0) {
            console.log('First raw product structure:', rawProduct);
          }
          return {
            item: {
              id: rawProduct.itemId,
              code: rawProduct.itemCode || rawProduct.item || '',
              description: rawProduct.itemDescription || rawProduct.description || '',
            },
            stockedQuantity: rawProduct.availableQuantity || rawProduct.quantity || rawProduct.qty || 0,
            lot: rawProduct.lot || null,
            serialNumber: rawProduct.serialNumber || null,
            expirationDate: rawProduct.expiryDate || null,
            loadingUnitId: rawProduct.loadingUnitId || rawProduct.LU,
          };
        });

        if (!cancelled) {
          setProductsData({
            data: transformedData,
            total: rawData.totalCount || rawData.recordNumber || transformedData.length,
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error loading products:', err);
          setProductsError(err);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();
    return () => { cancelled = true; };
  }, [showProductList, productsData]);
  // Mutations
  const [createList, { isLoading: isCreating, isSuccess, isError, error, reset: resetCreateMutation }] = useCreateListMutation();
  const [addListRow] = useAddListRowMutation();

  // Filtra prodotti in base alla ricerca
  const filteredProducts = useMemo(() => {
    console.log('🔍 [InsertListTab] Filtering products:', {
      hasData: !!productsData?.data,
      totalProducts: productsData?.data?.length,
      searchTerm,
    });

    if (!productsData?.data) {
      console.log('⚠️ [InsertListTab] No products data available');
      return [];
    }

    if (!searchTerm.trim()) {
      // Se non c'è ricerca, mostra tutti i primi 20 prodotti
      const result = productsData.data.slice(0, 20);
      console.log('✅ [InsertListTab] Showing first 20 products:', result.length);
      return result;
    }

    // Filtra per termine di ricerca
    const term = searchTerm.toLowerCase();
    const result = productsData.data.filter(product =>
      product.item.code.toLowerCase().includes(term) ||
      product.item.description.toLowerCase().includes(term)
    ).slice(0, 20);
    console.log('✅ [InsertListTab] Filtered products:', result.length);
    return result;
  }, [productsData, searchTerm]);

  // Aggiungi articolo al carrello
  const handleAddToCart = (product: any) => {
    const existingItem = cart.find(item => item.itemCode === product.item.code);

    if (existingItem) {
      // Se già presente, incrementa la quantità
      setCart(cart.map(item =>
        item.itemCode === product.item.code
          ? { ...item, requestedQuantity: item.requestedQuantity + 1 }
          : item
      ));
    } else {
      // Aggiungi nuovo articolo
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random()}`,
        itemCode: product.item.code,
        itemDescription: product.item.description,
        availableQuantity: product.stockedQuantity,
        requestedQuantity: 1,
        lot: product.lot || undefined,
        serialNumber: product.serialNumber || undefined,
        expirationDate: product.expirationDate || undefined,
      };
      setCart([...cart, newItem]);
    }

    setSearchTerm('');
    // Non chiudere la lista, rimane visibile
  };

  // Rimuovi articolo dal carrello
  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Aggiorna quantità
  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }

    setCart(cart.map(item =>
      item.id === id
        ? { ...item, requestedQuantity: quantity }
        : item
    ));
  };

  // Muovi articolo su/giù
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCart = [...cart];
    [newCart[index - 1], newCart[index]] = [newCart[index], newCart[index - 1]];
    setCart(newCart);
  };

  const handleMoveDown = (index: number) => {
    if (index === cart.length - 1) return;
    const newCart = [...cart];
    [newCart[index], newCart[index + 1]] = [newCart[index + 1], newCart[index]];
    setCart(newCart);
  };

  // Svuota carrello
  const handleClearCart = () => {
    if (confirm('Sei sicuro di voler svuotare il carrello?')) {
      setCart([]);
    }
  };

  // Submit: Crea lista e aggiungi righe
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Aggiungi almeno un articolo al carrello prima di creare la lista');
      return;
    }

    try {
      // 1. Crea la lista in stato ATTESA (backend genera ID automaticamente)
      const payload = {
        description: formData.description,
        tipoLista: formData.tipoLista,
        stato: 1, // ListStatus.WAITING - In Attesa
        priority: formData.priority,
        areaId: formData.areaId,
      };

      console.log('📤 [InsertListTab] Sending payload to createList:', payload);
      console.log('📋 [InsertListTab] FormData state:', formData);

      const createdList = await createList(payload).unwrap();

      console.log('✅ Lista creata con ID:', createdList.id);

      // 2. Aggiungi le righe alla lista
      for (const item of cart) {
        await addListRow({
          listId: createdList.id,
          row: {
            itemCode: item.itemCode,
            itemDescription: item.itemDescription,
            requestedQuantity: item.requestedQuantity,
            lot: item.lot,
            serialNumber: item.serialNumber,
            expirationDate: item.expirationDate,
          },
        }).unwrap();
      }

      console.log(`✅ ${cart.length} righe aggiunte alla lista`);

      // Reset form e carrello
      setFormData({
        description: '',
        tipoLista: ItemListType.PICKING,
        priority: 1,
        areaId: 1,
      });
      setCart([]);

      // Reset success dopo 3 secondi
      setTimeout(() => {
        resetCreateMutation();
      }, 3000);
    } catch (err) {
      console.error('❌ Errore durante la creazione della lista:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Inserimento Nuova Lista</h2>
        <p className="text-gray-600 mt-1">
          Crea una nuova lista e aggiungi articoli dal magazzino
        </p>
      </div>

      {isSuccess && (
        <Alert
          type="success"
          title="Lista creata in stato ATTESA!"
          message={`Lista creata con successo con ${cart.length} articoli. La lista è ora in stato ATTESA.`}
        />
      )}

      {isError && (
        <Alert type="error" title="Errore durante la creazione">
          <div className="text-sm">
            <p>{error?.data?.message || error?.message || 'Si è verificato un errore durante la creazione della lista.'}</p>
            {error?.data?.details && (
              <p className="mt-2 font-mono text-xs bg-red-50 p-2 rounded">
                {JSON.stringify(error.data.details, null, 2)}
              </p>
            )}
            {error?.status && (
              <p className="mt-2 text-xs">Codice errore: {error.status}</p>
            )}
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ricerca e Aggiungi Articoli - SPOSTATA SOPRA E COLLASSABILE */}
        <div className="bg-white rounded-lg border-2 border-blue-300">
          {/* Header collassabile */}
          <button
            type="button"
            onClick={() => setShowProductList(!showProductList)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors rounded-t-lg"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
              Ricerca Articoli in Giacenza
              {cart.length > 0 && (
                <Badge variant="primary" className="ml-2">
                  {cart.length} nel carrello
                </Badge>
              )}
            </h3>
            {showProductList ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Contenuto collassabile */}
          {showProductList && (
            <div className="p-4 border-t border-gray-200">
              <div className="relative mb-3">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Inizia a digitare per filtrare gli articoli..."
                  disabled={isCreating}
                  className="pr-10"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* Loading */}
              {isLoadingProducts && (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Caricamento articoli...
                </div>
              )}

              {/* Error */}
              {productsError && (
                <Alert type="error" title="Errore caricamento articoli">
                  <div className="text-sm">
                    <p>Impossibile caricare gli articoli dalla giacenza.</p>
                    <p className="mt-2 font-mono text-xs bg-red-50 p-2 rounded">
                      {productsError.message || JSON.stringify(productsError)}
                    </p>
                    <p className="mt-2">Verifica che il backend sia attivo su porta 3077.</p>
                    <p className="mt-1 text-xs">Endpoint: GET /api/EjLogHostVertimag/Stock → http://localhost:3077/EjLogHostVertimag/Stock</p>
                  </div>
                </Alert>
              )}

          {/* Lista prodotti */}
          {!isLoadingProducts && !productsError && (
            <>
                  {filteredProducts.length > 0 ? (
                    <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto bg-white">
                      <div className="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-300 text-sm font-medium text-gray-700">
                        {searchTerm ? `${filteredProducts.length} articoli trovati` : 'Articoli disponibili in giacenza (primi 20)'}
                      </div>
                      {filteredProducts.map((product, index) => (
                        <div
                          key={index}
                          onClick={() => handleAddToCart(product)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{product.item.code}</div>
                              <div className="text-sm text-gray-600">{product.item.description}</div>
                              {product.lot && (
                                <div className="text-xs text-gray-500 mt-1">Lotto: {product.lot}</div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <Badge variant={product.stockedQuantity > 0 ? 'success' : 'danger'}>
                                Qta: {product.stockedQuantity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {productsData && productsData.data.length > 20 && !searchTerm && (
                        <div className="p-3 bg-gray-50 text-center text-sm text-gray-500 border-t">
                          Digita per cercare tra tutti gli articoli disponibili
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500">
                      <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">
                        {searchTerm ? 'Nessun articolo trovato' : 'Nessun articolo in giacenza'}
                      </p>
                      {searchTerm && (
                        <p className="text-sm mt-1">Prova a modificare il termine di ricerca</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Informazioni Lista */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Informazioni Lista</h3>

          {/* Stato Lista */}
          <div className="bg-white border-2 border-blue-400 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero Lista (Auto-generato)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={(() => {
                  const prefixMap: { [key: number]: string } = {
                    1: 'PICK',    // Picking
                    2: 'REF',     // Refilling
                    3: 'VIS',     // Visione
                    4: 'INV',     // Inventario
                    10: 'RIO',    // Riordino Inter-Magazzino
                  };
                  const prefix = prefixMap[formData.tipoLista] || 'LST';
                  return `${prefix}####`;
                })()}
                disabled
                className="flex-1 px-4 py-3 text-lg font-bold text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg cursor-not-allowed"
              />
              <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium border border-yellow-300">
                In Attesa
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Il numero sarà generato automaticamente al salvataggio (es: PICK0001, REF0002)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo Lista */}
            <div>
              <label htmlFor="tipoLista" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Lista *
              </label>
              <select
                id="tipoLista"
                value={formData.tipoLista}
                onChange={(e) => handleChange('tipoLista', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isCreating}
              >
                <option value={ItemListType.PICKING}>Picking (Prelievo)</option>
                <option value={ItemListType.REFILLING}>Refilling (Rifornimento)</option>
                <option value={ItemListType.VISIONE}>Visione (Controllo)</option>
                <option value={ItemListType.INVENTARIO}>Inventario</option>
                <option value={ItemListType.RIORDINO_INTER_MAGAZZINO}>Riordino Inter-Magazzino</option>
              </select>
            </div>

            {/* Descrizione */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrizione della lista (opzionale)"
                disabled={isCreating}
              />
            </div>

            {/* Priorità e Area */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                disabled={isCreating}
              />
            </div>

            <div>
              <label htmlFor="areaId" className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <Input
                id="areaId"
                type="number"
                min="1"
                value={formData.areaId}
                onChange={(e) => handleChange('areaId', parseInt(e.target.value))}
                required
                disabled={isCreating}
              />
            </div>
          </div>
        </div>

        {/* Carrello */}
        <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
              Carrello ({cart.length} articoli)
            </h3>
            {cart.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Svuota
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nessun articolo nel carrello</p>
              <p className="text-sm">Cerca e aggiungi articoli dalla giacenza</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Ordina */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Sposta su"
                    >
                      <ArrowUpIcon className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === cart.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Sposta giù"
                    >
                      <ArrowDownIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Info Articolo */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.itemCode}</div>
                    <div className="text-sm text-gray-600">{item.itemDescription}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Disponibili: {item.availableQuantity}
                      {item.lot && ` • Lotto: ${item.lot}`}
                    </div>
                  </div>

                  {/* Quantità */}
                  <div className="w-32">
                    <Input
                      type="number"
                      min="1"
                      max={item.availableQuantity}
                      value={item.requestedQuantity}
                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <div className="text-xs text-center text-gray-500 mt-1">Quantità</div>
                  </div>

                  {/* Rimuovi */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Rimuovi dal carrello"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || cart.length === 0}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creazione in corso...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Crea Lista ({cart.length} articoli)
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                code: '',
                description: '',
                tipoLista: ItemListType.PICKING,
                priority: 1,
                areaId: 1,
              });
              setCart([]);
            }}
            disabled={isCreating}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InsertListTab;



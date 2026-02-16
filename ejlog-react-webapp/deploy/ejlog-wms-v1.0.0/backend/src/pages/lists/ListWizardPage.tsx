// ============================================================================
// EJLOG WMS - List Wizard Page
// Wizard multi-step per creazione liste
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Wizard from '../../components/common/Wizard';
import { useGetStockQuery } from '../../services/api/stockApi';
import { useCreateListMutation } from '../../services/api';
import type { ItemListType } from '../../types/models';

interface ListFormData {
  itemListType: ItemListType;
  description: string;
  priority: number;
  areaId?: number;
  selectedItems: Array<{ itemId: number; quantity: number }>;
}

const ListWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ListFormData>({
    itemListType: 0, // Picking default
    description: '',
    priority: 5,
    selectedItems: [],
  });

  const [createList, { isLoading: isCreating }] = useCreateListMutation();

  // Carica giacenze reali dal database
  const { data: stockData, isLoading: isLoadingStock } = useGetStockQuery({ limit: 500 });

  // Raggruppa giacenze per articolo (un articolo può avere più righe stock con lotti/ubicazioni diverse)
  const items = useMemo(() => {
    if (!stockData?.items) return [];

    // Mappa per raggruppare per itemCode
    const itemsMap = new Map<string, {
      id: number;
      code: string;
      description: string;
      totalQuantity: number;
      availableQuantity: number;
    }>();

    stockData.items.forEach(stock => {
      const existing = itemsMap.get(stock.itemCode);
      if (existing) {
        existing.totalQuantity += stock.quantity;
        existing.availableQuantity += stock.availableQuantity;
      } else {
        itemsMap.set(stock.itemCode, {
          id: stock.itemId,
          code: stock.itemCode,
          description: stock.itemDescription || stock.itemCode,
          totalQuantity: stock.quantity,
          availableQuantity: stock.availableQuantity,
        });
      }
    });

    return Array.from(itemsMap.values());
  }, [stockData]);

  // Step 1: Header
  const Step1Header = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Informazioni Lista</h2>

      {/* ID Lista - Fisso 1748 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID Lista
        </label>
        <input
          type="text"
          value="1748"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
        />
        <p className="text-sm text-gray-500 mt-1">ID lista assegnato automaticamente</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo Lista <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.itemListType}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, itemListType: Number(e.target.value) as ItemListType }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value={0}>Picking</option>
          <option value={1}>Stoccaggio</option>
          <option value={2}>Inventario</option>
          <option value={3}>Trasferimento</option>
          <option value={4}>Rettifica</option>
          <option value={5}>Produzione</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descrizione lista..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priorità <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData((prev) => ({ ...prev, priority: Number(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-sm text-gray-500 mt-1">Da 1 (bassa) a 10 (alta)</p>
      </div>
    </div>
  );

  // Step 2: Selezione Articoli
  const Step2Items = () => {
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
      new Set(formData.selectedItems.map((item) => item.itemId))
    );

    const toggleItem = (itemId: number) => {
      const newSelected = new Set(selectedItemIds);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItemIds(newSelected);

      // Update form data
      const newSelectedItems = Array.from(newSelected).map((id) => {
        const existing = formData.selectedItems.find((item) => item.itemId === id);
        return existing || { itemId: id, quantity: 1 };
      });
      setFormData((prev) => ({ ...prev, selectedItems: newSelectedItems }));
    };

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Seleziona Articoli</h2>
        <p className="text-gray-600">Scegli gli articoli da includere nella lista</p>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 font-medium text-sm">
            Selezionati: {selectedItemIds.size} articoli
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoadingStock ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Caricamento giacenze...
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessun articolo in giacenza
              </div>
            ) : (
              items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{item.code}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs text-gray-500">Disponibile</div>
                        <div className="font-semibold text-green-600">{item.availableQuantity}</div>
                      </div>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Quantità
  const Step3Quantities = () => {
    const updateQuantity = (itemId: number, quantity: number) => {
      setFormData((prev) => ({
        ...prev,
        selectedItems: prev.selectedItems.map((item) =>
          item.itemId === itemId ? { ...item, quantity } : item
        ),
      }));
    };

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Imposta Quantità</h2>
        <p className="text-gray-600">Definisci le quantità per ogni articolo</p>

        <div className="space-y-2">
          {formData.selectedItems.map((selectedItem) => {
            const item = items.find((i) => i.id === selectedItem.itemId);
            if (!item) return null;

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.code}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="1"
                    value={selectedItem.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Step 4: Review
  const Step4Review = () => {
    const getTypeLabel = (type: ItemListType): string => {
      const labels: Record<number, string> = {
        0: 'Picking',
        1: 'Stoccaggio',
        2: 'Inventario',
        3: 'Trasferimento',
        4: 'Rettifica',
        5: 'Produzione',
      };
      return labels[type] || 'Sconosciuto';
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Riepilogo</h2>
        <p className="text-gray-600">Verifica i dati prima di creare la lista</p>

        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">ID Lista:</span>
            <span className="font-mono font-bold text-blue-600">1748</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Stato:</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
              In Attesa
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Tipo:</span>
            <span>{getTypeLabel(formData.itemListType)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Descrizione:</span>
            <span>{formData.description || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Priorità:</span>
            <span>{formData.priority}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Articoli:</span>
            <span>{formData.selectedItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Quantità Totale:</span>
            <span>
              {formData.selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 font-medium text-sm">Articoli Selezionati</div>
          <div className="divide-y">
            {formData.selectedItems.map((selectedItem) => {
              const item = items.find((i) => i.id === selectedItem.itemId);
              if (!item) return null;

              return (
                <div key={item.id} className="px-4 py-3 flex justify-between">
                  <div>
                    <div className="font-medium">{item.code}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">Qtà: {selectedItem.quantity}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Handle submit
  const handleSubmit = async () => {
    if (formData.selectedItems.length === 0) {
      toast.error('Seleziona almeno un articolo');
      return;
    }

    try {
      const result = await createList({
        listNumber: '1748', // ID Lista fisso
        tipoLista: formData.itemListType,
        descrizione: formData.description || undefined,
        priorita: formData.priority,
        areaId: formData.areaId || 1, // Default area
        stato: 1, // ListStatus.WAITING - In Attesa
        // rows: formData.selectedItems, // TODO: Backend deve accettare righe in creazione
      }).unwrap();

      toast.success('Lista 1748 creata in stato ATTESA!');
      navigate(`/lists/${result.id || '1748'}`);
    } catch (error: any) {
      const errorMsg = error?.data?.message || error?.message || 'Errore durante la creazione della lista';
      toast.error(errorMsg);
      console.error('Errore creazione lista:', error);
    }
  };

  const steps = [
    {
      id: 'header',
      title: 'Informazioni',
      content: <Step1Header />,
    },
    {
      id: 'items',
      title: 'Articoli',
      content: <Step2Items />,
    },
    {
      id: 'quantities',
      title: 'Quantità',
      content: <Step3Quantities />,
    },
    {
      id: 'review',
      title: 'Riepilogo',
      content: <Step4Review />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Crea Nuova Lista</h1>
          <p className="text-gray-600">Segui i passaggi per creare una nuova lista</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <Wizard
            steps={steps}
            onComplete={handleSubmit}
            onCancel={() => navigate('/lists')}
          />
        </div>
      </div>
    </div>
  );
};

export default ListWizardPage;

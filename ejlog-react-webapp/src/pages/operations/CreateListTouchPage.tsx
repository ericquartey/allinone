// ============================================================================
// EJLOG WMS - Create List Touch Page
// Pagina per creare nuove liste ottimizzata per touch mode
// Niente scroll, pulsanti grandi, interfaccia semplice
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateListMutation,
  useAddListRowMutation,
  useGetNextListNumberQuery,
} from '../../services/api/listsApi';
import {
  useGetItemsQuery,
} from '../../services/api/itemsApi';
import { useGetDestinationGroupsQuery } from '../../services/api/destinationGroupsApi';
import { useGetMachinesQuery } from '../../services/api/machinesApi';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import VirtualKeyboard from '../../components/touch/VirtualKeyboard';
import VirtualNumpad from '../../components/touch/VirtualNumpad';
import {
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type TabView = 'info' | 'items' | 'review';
type ListType = 'PICKING' | 'REFILLING';

interface ListFormData {
  type: ListType;
  description: string;
  areaId: number;
  priority: number;
  destinationGroupId: number | null;
  machineIds: number[];
}

interface SelectedItem {
  id: number;
  code: string;
  description: string;
  quantity: number;
}

const CreateListTouchPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<TabView>('info');
  const [formData, setFormData] = useState<ListFormData>({
    type: 'PICKING',
    description: '',
    areaId: 1,
    priority: 1,
    destinationGroupId: null,
    machineIds: [],
  });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentItemsPage, setCurrentItemsPage] = useState(0);

  // Stati tastiere virtuali
  const [showDescriptionKeyboard, setShowDescriptionKeyboard] = useState(false);
  const [showSearchKeyboard, setShowSearchKeyboard] = useState(false);
  const [showQuantityNumpad, setShowQuantityNumpad] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 6;

  // Converti tipo lista in numero per API
  const listTypeNumber = formData.type === 'PICKING' ? 0 : 2;

  // Query per prossimo numero lista
  const { data: nextNumber, isLoading: nextNumberLoading } = useGetNextListNumberQuery(listTypeNumber);

  // Query articoli con filtro per giacenza
  const { data: itemsResponse, isLoading: itemsLoading } = useGetItemsQuery({
    page: currentItemsPage,
    pageSize: 50, // Più articoli per la ricerca
    searchQuery: searchQuery,
  });

  // Query gruppi di destinazione e macchine
  const { data: destinationGroups = [], isLoading: destGroupsLoading } = useGetDestinationGroupsQuery();
  const { data: machines = [], isLoading: machinesLoading } = useGetMachinesQuery();

  const [createList, { isLoading: creating }] = useCreateListMutation();
  const [addListRow] = useAddListRowMutation();

  // Filtra articoli in base al tipo di lista
  const filteredItems = useMemo(() => {
    if (!itemsResponse?.data) return [];

    // Per PICKING: solo articoli in giacenza (simulato - in produzione verificare stock > 0)
    // Per REFILLING: tutti gli articoli del magazzino
    const items = itemsResponse.data;

    if (formData.type === 'PICKING') {
      // TODO: filtrare solo articoli con giacenza > 0 quando disponibile nel backend
      return items;
    }

    return items;
  }, [itemsResponse, formData.type]);

  // Paginazione articoli
  const paginatedItems = useMemo(() => {
    const start = 0; // Mostra sempre tutti con scroll interno
    const end = filteredItems.length;
    return filteredItems.slice(start, end);
  }, [filteredItems]);

  // Aggiungi articolo a lista
  const handleAddItem = (item: any) => {
    const existing = selectedItems.find(si => si.id === item.id);
    if (existing) {
      toast.error('Articolo già aggiunto');
      return;
    }

    const newItem: SelectedItem = {
      id: item.id,
      code: item.code,
      description: item.description,
      quantity: 1,
    };

    setSelectedItems([...selectedItems, newItem]);
    toast.success(`${item.code} aggiunto`);
  };

  // Rimuovi articolo
  const handleRemoveItem = (id: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
    toast.success('Articolo rimosso');
  };

  // Modifica quantità
  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(selectedItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  // Crea lista
  const handleCreateList = async () => {
    if (!formData.description.trim()) {
      toast.error('Inserisci una descrizione');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Aggiungi almeno un articolo');
      return;
    }

    try {
      // Mappa tipo lista a numero backend
      const tipoLista = formData.type === 'PICKING' ? 0 : 2;

      const createdList = await createList({
        tipoLista,
        areaId: formData.areaId,
        listReference: formData.description,
        priority: formData.priority,
        destinationGroupId: formData.destinationGroupId,
        machineIds: formData.machineIds,
      }).unwrap();

      if (!createdList?.id) {
        throw new Error('ID lista non valido');
      }

      for (const item of selectedItems) {
        await addListRow({
          listId: createdList.id,
          row: {
            itemCode: item.code,
            itemDescription: item.description,
            requestedQuantity: item.quantity,
          },
        }).unwrap();
      }

      toast.success('Lista creata con successo!');
      navigate('/operations/lists/touch');
    } catch (error: any) {
      console.error('Errore creazione lista:', error);
      toast.error(error?.data?.message || 'Errore durante la creazione');
    }
  };

  // ============================================================================
  // TAB 1: INFORMAZIONI LISTA
  // ============================================================================
  const renderInfoTab = () => (
    <div className="h-full flex flex-col p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Informazioni Lista</h2>

      {/* Tipo Lista */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Tipo Lista
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setFormData({ ...formData, type: 'PICKING' })}
            className={`h-24 rounded-xl border-4 font-bold text-xl transition-all ${
              formData.type === 'PICKING'
                ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105'
                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
            }`}
          >
            📦 PICKING
          </button>
          <button
            onClick={() => setFormData({ ...formData, type: 'REFILLING' })}
            className={`h-24 rounded-xl border-4 font-bold text-xl transition-all ${
              formData.type === 'REFILLING'
                ? 'bg-green-600 border-green-700 text-white shadow-lg scale-105'
                : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
            }`}
          >
            ♻️ REFILLING
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {formData.type === 'PICKING'
            ? 'Prelievo articoli dalla giacenza'
            : 'Versamento articoli nel magazzino'}
        </p>

        {/* Prossimo numero lista */}
        {nextNumber && !nextNumberLoading && (
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900">
                Prossimo numero:
              </span>
              <span className="text-2xl font-bold text-blue-700 font-mono">
                {nextNumber.nextNumber}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Descrizione */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Descrizione
        </label>
        <input
          type="text"
          value={formData.description}
          onClick={() => setShowDescriptionKeyboard(true)}
          onFocus={(e) => e.target.blur()} // Previene tastiera fisica
          readOnly
          placeholder="Es: Ordine cliente #12345"
          className="w-full h-16 px-6 text-lg border-4 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none cursor-pointer"
        />
      </div>
      {/* Priorità */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Priorità: {formData.priority}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(formData.priority - 1) * 25}%, #e5e7eb ${(formData.priority - 1) * 25}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Bassa</span>
          <span>Alta</span>
        </div>
      </div>

      {/* Gruppo Destinazione */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Gruppo Destinazione
        </label>
        {destGroupsLoading ? (
          <div className="flex justify-center p-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <select
            value={formData.destinationGroupId || ''}
            onChange={(e) => setFormData({ ...formData, destinationGroupId: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full h-16 px-6 text-lg border-4 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">Seleziona gruppo...</option>
            {destinationGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.description}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Macchine */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Macchine
        </label>
        {machinesLoading ? (
          <div className="flex justify-center p-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl">
            {machines.map((machine) => {
              const isSelected = formData.machineIds.includes(machine.id);
              return (
                <button
                  key={machine.id}
                  onClick={() => {
                    const newMachineIds = isSelected
                      ? formData.machineIds.filter(id => id !== machine.id)
                      : [...formData.machineIds, machine.id];
                    setFormData({ ...formData, machineIds: newMachineIds });
                  }}
                  className={`h-16 rounded-lg border-3 font-semibold text-sm transition-all ${
                    isSelected
                      ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {machine.description}
                </button>
              );
            })}
          </div>
        )}
        {formData.machineIds.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {formData.machineIds.length} macchina/e selezionata/e
          </p>
        )}
      </div>

      {/* Pulsante Avanti */}
      <div className="flex-1 flex items-end">
        <button
          onClick={() => setCurrentTab('items')}
          disabled={!formData.description.trim()}
          className={`w-full h-20 rounded-xl font-bold text-xl flex items-center justify-center space-x-3 ${
            formData.description.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Avanti</span>
          <ArrowRightIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // TAB 2: SELEZIONE ARTICOLI
  // ============================================================================
  const renderItemsTab = () => (
    <div className="h-full flex flex-col">
      {/* Header con ricerca */}
      <div className="p-4 bg-gray-50 border-b-4 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Seleziona Articoli
          {formData.type === 'PICKING' && (
            <Badge variant="info" className="ml-3">Solo in giacenza</Badge>
          )}
        </h2>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onClick={() => setShowSearchKeyboard(true)}
            onFocus={(e) => e.target.blur()} // Previene tastiera fisica
            readOnly
            placeholder="Cerca articolo..."
            className="w-full h-14 pl-14 pr-4 text-lg border-4 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none cursor-pointer"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedItems.length} articoli selezionati
          </div>
          <div className="text-sm text-gray-600">
            {filteredItems.length} disponibili
          </div>
        </div>
      </div>

      {/* Lista articoli (con scroll interno) */}
      <div className="flex-1 overflow-y-auto p-4">
        {itemsLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nessun articolo trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {paginatedItems.map((item) => {
              const isSelected = selectedItems.some(si => si.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => !isSelected && handleAddItem(item)}
                  disabled={isSelected}
                  className={`p-4 rounded-xl border-4 text-left transition-all ${
                    isSelected
                      ? 'bg-green-50 border-green-500 opacity-60'
                      : 'bg-white border-gray-300 hover:border-blue-500 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900">
                        {item.code}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer con pulsanti */}
      <div className="p-4 bg-gray-50 border-t-4 border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentTab('info')}
            className="h-16 bg-gray-200 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-300 flex items-center justify-center space-x-2"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span>Indietro</span>
          </button>
          <button
            onClick={() => setCurrentTab('review')}
            disabled={selectedItems.length === 0}
            className={`h-16 font-bold text-lg rounded-xl flex items-center justify-center space-x-2 ${
              selectedItems.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Riepilogo</span>
            <ArrowRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB 3: RIEPILOGO E CONFERMA
  // ============================================================================
  const renderReviewTab = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b-4 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Riepilogo Lista</h2>
      </div>

      {/* Informazioni lista */}
      <div className="p-4 bg-blue-50 border-b-2 border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Tipo</div>
            <div className="font-bold text-lg">
              {formData.type === 'PICKING' ? '📦 PICKING' : '♻️ REFILLING'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Priorità</div>
            <div className="font-bold text-lg">
              {'⭐'.repeat(formData.priority)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-600">Descrizione</div>
            <div className="font-bold text-lg">{formData.description}</div>
          </div>
          {formData.destinationGroupId && (
            <div className="col-span-2">
              <div className="text-gray-600">Gruppo Destinazione</div>
              <div className="font-bold text-lg">
                {destinationGroups.find(g => g.id === formData.destinationGroupId)?.description || 'N/A'}
              </div>
            </div>
          )}
          {formData.machineIds.length > 0 && (
            <div className="col-span-2">
              <div className="text-gray-600">Macchine</div>
              <div className="font-bold text-base">
                {formData.machineIds.map(id =>
                  machines.find(m => m.id === id)?.description
                ).filter(Boolean).join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista articoli selezionati (con scroll) */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-bold text-lg mb-3">
          Articoli ({selectedItems.length})
        </h3>
        <div className="space-y-3">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white border-4 border-gray-300 rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-bold text-lg">{item.code}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Quantità */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-sm text-gray-600">Quantità</div>
                  <div className="font-bold text-2xl">{item.quantity}</div>
                </div>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xl"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer con pulsanti */}
      <div className="p-4 bg-gray-50 border-t-4 border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentTab('items')}
            className="h-16 bg-gray-200 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-300 flex items-center justify-center space-x-2"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span>Indietro</span>
          </button>
          <button
            onClick={handleCreateList}
            disabled={creating}
            className="h-16 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {creating ? (
              <Spinner size="sm" />
            ) : (
              <>
                <CheckIcon className="w-6 h-6" />
                <span>Crea Lista</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER PRINCIPALE
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header fisso */}
      <div className="h-20 bg-ferretto-dark shadow-lg flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/operations/lists/touch')}
            className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-8 h-8 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <PlusIcon className="w-8 h-8" />
              <span>Nuova Lista</span>
            </h1>
            <p className="text-sm text-gray-300">Touch Mode</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
        >
          <HomeIcon className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="h-16 bg-white shadow-md flex items-center space-x-2 px-4 flex-shrink-0">
        <button
          onClick={() => setCurrentTab('info')}
          className={`flex-1 h-12 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
            currentTab === 'info'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ClipboardDocumentListIcon className="w-5 h-5" />
          <span>Info</span>
        </button>
        <button
          onClick={() => setCurrentTab('items')}
          className={`flex-1 h-12 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
            currentTab === 'items'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Articoli</span>
          {selectedItems.length > 0 && (
            <Badge variant="success">{selectedItems.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setCurrentTab('review')}
          disabled={selectedItems.length === 0}
          className={`flex-1 h-12 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
            currentTab === 'review'
              ? 'bg-blue-600 text-white shadow-lg'
              : selectedItems.length > 0
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <CheckIcon className="w-5 h-5" />
          <span>Riepilogo</span>
        </button>
      </div>

      {/* Contenuto Tab (occupa spazio restante, no scroll globale) */}
      <div className="flex-1 min-h-0">
        {currentTab === 'info' && renderInfoTab()}
        {currentTab === 'items' && renderItemsTab()}
        {currentTab === 'review' && renderReviewTab()}
      </div>

      {/* Virtual Keyboards */}
      {showDescriptionKeyboard && (
        <VirtualKeyboard
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          onClose={() => setShowDescriptionKeyboard(false)}
          maxLength={100}
          placeholder="Es: Ordine cliente #12345"
          title="Descrizione Lista"
        />
      )}

      {showSearchKeyboard && (
        <VirtualKeyboard
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={() => setShowSearchKeyboard(false)}
          maxLength={50}
          placeholder="Cerca articolo..."
          title="Cerca Articolo"
        />
      )}

      {showQuantityNumpad && editingItemId !== null && (
        <VirtualNumpad
          value={selectedItems.find(i => i.id === editingItemId)?.quantity.toString() || '1'}
          onChange={(value) => {
            const qty = parseInt(value) || 1;
            handleQuantityChange(editingItemId, qty);
          }}
          onClose={() => {
            setShowQuantityNumpad(false);
            setEditingItemId(null);
          }}
          maxLength={5}
          title="Quantità Articolo"
        />
      )}
    </div>
  );
};

export default CreateListTouchPage;

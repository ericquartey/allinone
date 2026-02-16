// ============================================================================
// EJLOG WMS - Warehouse Management Page
// Gestione completa dei magazzini con tutte le funzionalità - VERSIONE MIGLIORATA
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Trash2,
  Plus,
  Edit,
  Link as LinkIcon,
  Database,
  Package,
  Layers,
  FileText,
  LogOut,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import type { Warehouse, WarehouseFilters } from '../../types/warehouse';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  associateWarehouseArea,
  getAvailableAreas,
  createUDCTerra,
  createVertimag2020,
  createPTLStructure,
} from '../../services/api/warehousesApi';

// ============================================================================
// INTERFACES
// ============================================================================

interface WarehouseFormData {
  descrizione: string;
  tipoMagazzino: string;
  area: string;
  indirizzo?: string;
  capacita?: number;
  note?: string;
}

interface WarehouseArea {
  id: number;
  codice: string;
  descrizione: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const WarehouseManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State per i dati
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [areas, setAreas] = useState<WarehouseArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number>(1);

  // State per i filtri
  const [filters, setFilters] = useState<WarehouseFilters>({
    descrizione: '',
    tipoMagazzino: 'Tutti',
  });

  // State per i modals
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssociateAreaModal, setShowAssociateAreaModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State per forms
  const [formData, setFormData] = useState<WarehouseFormData>({
    descrizione: '',
    tipoMagazzino: 'Vertimag',
    area: 'Area 1',
  });

  // State per validazione
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Caricamento iniziale
  useEffect(() => {
    loadWarehouses();
    loadAreas();
  }, []);

  // Ricarica quando cambiano i filtri (con debounce implicito)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.descrizione || filters.tipoMagazzino !== 'Tutti') {
        loadWarehouses();
      }
    }, 500); // Debounce di 500ms

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const appliedFilters: WarehouseFilters = {
        descrizione: filters.descrizione || undefined,
        tipoMagazzino: filters.tipoMagazzino !== 'Tutti' ? filters.tipoMagazzino : undefined,
      };

      const response = await getWarehouses(appliedFilters);
      setWarehouses(response.data);
      setTotalRecords(response.total);

      // Solo un toast se è una ricerca esplicita, non automatica
      if (!loading) {
        toast.success(`${response.total} magazzini trovati`);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);

      // Mock data per sviluppo - SEMPRE disponibili
      const mockData = [
        {
          idMagazzino: 1,
          descrizione: 'Vertimag 1',
          tipoMagazzino: 'Vertimag',
          statoMagazzino: 'OK' as any,
          area: 'Area 1',
        },
        {
          idMagazzino: 99,
          descrizione: 'Controller',
          tipoMagazzino: 'Vertimag',
          statoMagazzino: 'OK' as any,
          area: 'Area 1',
        },
        {
          idMagazzino: 50001,
          descrizione: 'PTL',
          tipoMagazzino: 'PTL',
          statoMagazzino: 'OK' as any,
          area: 'Area 1',
        },
      ];

      // Filtra mock data
      let filteredData = mockData;
      if (filters.descrizione) {
        filteredData = filteredData.filter(w =>
          w.descrizione.toLowerCase().includes(filters.descrizione!.toLowerCase())
        );
      }
      if (filters.tipoMagazzino !== 'Tutti') {
        filteredData = filteredData.filter(w => w.tipoMagazzino === filters.tipoMagazzino);
      }

      setWarehouses(filteredData);
      setTotalRecords(filteredData.length);

      toast.info('Usando dati mock (API non disponibile)');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadAreas = async () => {
    try {
      const response = await getAvailableAreas();
      setAreas(response);
    } catch (error) {
      console.error('Error loading areas:', error);
      // Mock areas
      setAreas([
        { id: 1, codice: 'AREA-1', descrizione: 'Area 1' },
        { id: 2, codice: 'AREA-2', descrizione: 'Area 2' },
        { id: 3, codice: 'AREA-3', descrizione: 'Area 3' },
      ]);
    }
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.descrizione.trim()) {
      errors.descrizione = 'La descrizione è obbligatoria';
    }

    if (!formData.tipoMagazzino) {
      errors.tipoMagazzino = 'Il tipo magazzino è obbligatorio';
    }

    if (!formData.area.trim()) {
      errors.area = 'L\'area è obbligatoria';
    }

    if (formData.capacita && formData.capacita < 0) {
      errors.capacita = 'La capacità deve essere maggiore di zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleInsert = async () => {
    if (!validateForm()) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    try {
      setLoading(true);
      await createWarehouse(formData);
      toast.success('Magazzino creato con successo');
      setShowInsertModal(false);
      resetForm();
      await loadWarehouses();
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast.error('Errore nella creazione del magazzino');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWarehouse) return;

    if (!validateForm()) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    try {
      setLoading(true);
      await updateWarehouse(selectedWarehouse.idMagazzino, formData);
      toast.success('Magazzino modificato con successo');
      setShowEditModal(false);
      resetForm();
      await loadWarehouses();
    } catch (error) {
      console.error('Error updating warehouse:', error);
      toast.error('Errore nella modifica del magazzino');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino da eliminare');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedWarehouse) return;

    try {
      setLoading(true);
      await deleteWarehouse(selectedWarehouse.idMagazzino);
      toast.success(`Magazzino "${selectedWarehouse.descrizione}" eliminato`);
      setShowDeleteConfirm(false);
      setSelectedWarehouse(null);
      await loadWarehouses();
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast.error('Errore nell\'eliminazione del magazzino');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateArea = async () => {
    if (!selectedWarehouse) return;

    try {
      setLoading(true);
      await associateWarehouseArea(selectedWarehouse.idMagazzino, selectedAreaId);
      const selectedArea = areas.find(a => a.id === selectedAreaId);
      toast.success(`Area "${selectedArea?.descrizione}" associata con successo`);
      setShowAssociateAreaModal(false);
      await loadWarehouses();
    } catch (error) {
      console.error('Error associating area:', error);
      toast.error('Errore nell\'associazione dell\'area');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // SPECIAL OPERATIONS
  // ============================================================================

  const handleCreateUDCTerra = async () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino');
      return;
    }

    try {
      setLoading(true);
      await createUDCTerra(selectedWarehouse.idMagazzino);
      toast.success(`UDC Terra creato per "${selectedWarehouse.descrizione}"`);
      await loadWarehouses();
    } catch (error) {
      console.error('Error creating UDC Terra:', error);
      toast.error('Errore nella creazione UDC Terra');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVertimag2020 = async () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino');
      return;
    }

    try {
      setLoading(true);
      await createVertimag2020(selectedWarehouse.idMagazzino);
      toast.success(`Vertimag 2020 creato per "${selectedWarehouse.descrizione}"`);
      await loadWarehouses();
    } catch (error) {
      console.error('Error creating Vertimag 2020:', error);
      toast.error('Errore nella creazione Vertimag 2020');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePTL = async () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino');
      return;
    }

    try {
      setLoading(true);
      await createPTLStructure(selectedWarehouse.idMagazzino);
      toast.success(`Struttura PTL creata per "${selectedWarehouse.descrizione}"`);
      await loadWarehouses();
    } catch (error) {
      console.error('Error creating PTL structure:', error);
      toast.error('Errore nella creazione struttura PTL');
    } finally {
      setLoading(false);
    }
  };

  const handleManageAreas = () => {
    navigate('/config/areas');
  };

  const handleModifyLocationDesc = () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino');
      return;
    }
    toast.info('Funzionalità in fase di implementazione');
  };

  const handleExitLocation = () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino');
      return;
    }
    toast.info('Funzionalità in fase di implementazione');
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const resetForm = () => {
    setFormData({
      descrizione: '',
      tipoMagazzino: 'Vertimag',
      area: 'Area 1',
    });
    setFormErrors({});
  };

  const handleRefresh = () => {
    setFilters({ descrizione: '', tipoMagazzino: 'Tutti' });
    loadWarehouses();
    toast.success('Dati aggiornati');
  };

  const handleClearFilters = () => {
    setFilters({
      descrizione: '',
      tipoMagazzino: 'Tutti',
    });
    toast.info('Filtri puliti');
  };

  const openInsertModal = () => {
    resetForm();
    setShowInsertModal(true);
  };

  const openEditModal = () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino da modificare');
      return;
    }

    setFormData({
      descrizione: selectedWarehouse.descrizione,
      tipoMagazzino: selectedWarehouse.tipoMagazzino,
      area: selectedWarehouse.area,
      indirizzo: selectedWarehouse.indirizzo,
      capacita: selectedWarehouse.capacita,
      note: selectedWarehouse.note,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openAssociateAreaModal = () => {
    if (!selectedWarehouse) {
      toast.warning('Seleziona un magazzino');
      return;
    }
    setShowAssociateAreaModal(true);
  };

  // Gestione Enter per ricerca
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadWarehouses();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gestione Magazzini</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw size={16} />
            <span>Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 border-r border-gray-300 overflow-y-auto">
          {/* Ricerca */}
          <div className="p-4 border-b border-gray-300 bg-white">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Search size={18} />
              Ricerca
            </h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={<RefreshCw size={16} />}
                onClick={handleRefresh}
                loading={loading}
              >
                Aggiorna
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<X size={16} />}
                onClick={handleClearFilters}
              >
                Pulisci
              </Button>
            </div>
          </div>

          {/* Operazioni */}
          <div className="p-4 border-b border-gray-300 bg-white mt-2">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Edit size={18} />
              Operazioni
            </h3>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-start"
                icon={<Plus size={16} />}
                onClick={openInsertModal}
              >
                Inserisci
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={<Edit size={16} />}
                onClick={openEditModal}
                disabled={!selectedWarehouse}
              >
                Modifica
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="w-full justify-start"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
                disabled={!selectedWarehouse}
              >
                Elimina
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<LinkIcon size={16} />}
                onClick={openAssociateAreaModal}
                disabled={!selectedWarehouse}
              >
                Associa Area
              </Button>
            </div>
          </div>

          {/* Varie */}
          <div className="p-4 border-b border-gray-300 bg-white mt-2">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Layers size={18} />
              Varie
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<Database size={16} />}
                onClick={handleManageAreas}
              >
                Gestione Aree
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<Plus size={16} />}
                onClick={handleCreateUDCTerra}
                disabled={!selectedWarehouse || loading}
              >
                Crea UDC Terra
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<Package size={16} />}
                onClick={handleCreateVertimag2020}
                disabled={!selectedWarehouse || loading}
              >
                Crea Vertimag 2020
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<Layers size={16} />}
                onClick={handleCreatePTL}
                disabled={!selectedWarehouse || loading}
              >
                Crea struttura PTL
              </Button>
            </div>
          </div>

          {/* Locazioni */}
          <div className="p-4 bg-white mt-2">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={18} />
              Locazioni
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<FileText size={16} />}
                onClick={handleModifyLocationDesc}
                disabled={!selectedWarehouse}
              >
                Modifica Descrizione
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                icon={<LogOut size={16} />}
                onClick={handleExitLocation}
                disabled={!selectedWarehouse}
              >
                Uscita
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Magazzini
                </label>
                <input
                  type="text"
                  value={filters.descrizione}
                  onChange={(e) =>
                    setFilters({ ...filters, descrizione: e.target.value })
                  }
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ferretto-red focus:border-transparent transition-all"
                  placeholder="Cerca per descrizione..."
                />
              </div>
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo magazzino
                </label>
                <select
                  value={filters.tipoMagazzino}
                  onChange={(e) =>
                    setFilters({ ...filters, tipoMagazzino: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ferretto-red focus:border-transparent transition-all"
                >
                  <option value="Tutti">Tutti</option>
                  <option value="Vertimag">Vertimag</option>
                  <option value="PTL">PTL</option>
                  <option value="Controller">Controller</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <Button
                variant="primary"
                icon={<Search size={18} />}
                onClick={() => loadWarehouses()}
                loading={loading}
              >
                Cerca
              </Button>
            </div>
          </div>

          {/* Selected Warehouse Info */}
          {selectedWarehouse && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-900 font-medium">
                  Selezionato: {selectedWarehouse.descrizione} (ID: {selectedWarehouse.idMagazzino})
                </span>
                <button
                  onClick={() => setSelectedWarehouse(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Descrizione
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      TipoMagazzino
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      StatoMagazzino
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      IdMagazzino
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="animate-spin text-ferretto-red" size={32} />
                          <span className="text-gray-500">Caricamento in corso...</span>
                        </div>
                      </td>
                    </tr>
                  ) : warehouses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="text-gray-400" size={32} />
                          <span className="text-gray-500">Nessun magazzino trovato</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openInsertModal}
                            icon={<Plus size={16} />}
                          >
                            Crea Nuovo Magazzino
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    warehouses.map((warehouse) => (
                      <tr
                        key={warehouse.idMagazzino}
                        onClick={() => setSelectedWarehouse(warehouse)}
                        className={`border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                          selectedWarehouse?.idMagazzino === warehouse.idMagazzino
                            ? 'bg-blue-100 border-blue-300'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {warehouse.descrizione}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {warehouse.tipoMagazzino}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              warehouse.statoMagazzino === 'OK'
                                ? 'bg-green-100 text-green-800'
                                : warehouse.statoMagazzino === 'WARNING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : warehouse.statoMagazzino === 'ERROR'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {warehouse.statoMagazzino}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {warehouse.area}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {warehouse.idMagazzino}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Numero records: <span className="font-semibold">{totalRecords}</span> - max: 10000
              </span>
              <span className="text-xs text-gray-400">
                Selezionati: {selectedWarehouse ? 1 : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Inserisci */}
      {showInsertModal && (
        <Modal
          isOpen={showInsertModal}
          onClose={() => {
            setShowInsertModal(false);
            resetForm();
          }}
          title="Inserisci Nuovo Magazzino"
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Descrizione"
                value={formData.descrizione}
                onChange={(e) =>
                  setFormData({ ...formData, descrizione: e.target.value })
                }
                required
                error={formErrors.descrizione}
                placeholder="Es: Magazzino Centrale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Magazzino <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoMagazzino}
                onChange={(e) =>
                  setFormData({ ...formData, tipoMagazzino: e.target.value })
                }
                className={`w-full px-3 py-2 border ${
                  formErrors.tipoMagazzino ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-ferretto-red`}
              >
                <option value="Vertimag">Vertimag</option>
                <option value="PTL">PTL</option>
                <option value="Controller">Controller</option>
                <option value="Standard">Standard</option>
              </select>
              {formErrors.tipoMagazzino && (
                <p className="text-red-500 text-xs mt-1">{formErrors.tipoMagazzino}</p>
              )}
            </div>
            <div>
              <Input
                label="Area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
                error={formErrors.area}
                placeholder="Es: Area 1"
              />
            </div>
            <div>
              <Input
                label="Indirizzo"
                value={formData.indirizzo || ''}
                onChange={(e) =>
                  setFormData({ ...formData, indirizzo: e.target.value })
                }
                placeholder="Es: Via Roma 123"
              />
            </div>
            <div>
              <Input
                label="Capacità (kg)"
                type="number"
                value={formData.capacita?.toString() || ''}
                onChange={(e) =>
                  setFormData({ ...formData, capacita: parseInt(e.target.value) || undefined })
                }
                error={formErrors.capacita}
                placeholder="Es: 10000"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInsertModal(false);
                  resetForm();
                }}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                onClick={handleInsert}
                loading={loading}
              >
                Salva
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Modifica */}
      {showEditModal && selectedWarehouse && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
          title={`Modifica Magazzino: ${selectedWarehouse.descrizione}`}
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Descrizione"
                value={formData.descrizione}
                onChange={(e) =>
                  setFormData({ ...formData, descrizione: e.target.value })
                }
                required
                error={formErrors.descrizione}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Magazzino <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoMagazzino}
                onChange={(e) =>
                  setFormData({ ...formData, tipoMagazzino: e.target.value })
                }
                className={`w-full px-3 py-2 border ${
                  formErrors.tipoMagazzino ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-ferretto-red`}
              >
                <option value="Vertimag">Vertimag</option>
                <option value="PTL">PTL</option>
                <option value="Controller">Controller</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
            <div>
              <Input
                label="Area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
                error={formErrors.area}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                loading={loading}
              >
                Salva Modifiche
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Associa Area */}
      {showAssociateAreaModal && selectedWarehouse && (
        <Modal
          isOpen={showAssociateAreaModal}
          onClose={() => setShowAssociateAreaModal(false)}
          title="Associa Area al Magazzino"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Seleziona l'area da associare al magazzino{' '}
              <span className="font-semibold">"{selectedWarehouse.descrizione}"</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ferretto-red"
              >
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.descrizione} ({area.codice})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAssociateAreaModal(false)}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                onClick={handleAssociateArea}
                loading={loading}
              >
                Associa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && selectedWarehouse && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Conferma Eliminazione"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-1" size={24} />
              <div>
                <p className="text-gray-900 font-medium">
                  Sei sicuro di voler eliminare il magazzino?
                </p>
                <p className="text-gray-600 mt-2">
                  <span className="font-semibold">{selectedWarehouse.descrizione}</span>
                  <br />
                  <span className="text-sm text-gray-500">
                    ID: {selectedWarehouse.idMagazzino} - Area: {selectedWarehouse.area}
                  </span>
                </p>
                <p className="text-red-600 text-sm mt-3">
                  ⚠️ Questa azione non può essere annullata!
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annulla
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={loading}
                icon={<Trash2 size={16} />}
              >
                Elimina
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WarehouseManagementPage;

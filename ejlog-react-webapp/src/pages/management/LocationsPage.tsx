// ============================================================================
// EJLOG WMS - Locations Management Page
// Gestione CRUD ubicazioni magazzino con filtri avanzati e pagination
// Backend: /EjLogHostVertimag/Locations su porta 3077
// ============================================================================

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  Location,
  LocationFilters,
} from '../../services/api/locationsApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const LocationsPage: React.FC = () => {
  // State per filtri
  const [filters, setFilters] = useState<LocationFilters>({
    limit: 50,
    offset: 0,
  });
  const [localFilters, setLocalFilters] = useState({
    barcode: '',
    warehouseId: '',
    areaId: '',
    corridorId: '',
    enabled: '',
  });
  const [showFilters, setShowFilters] = useState(true);

  // State per modali
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // State per form
  const [formData, setFormData] = useState<Partial<Location>>({
    description: '',
    barcode: '',
    locationType: '',
    warehouseId: undefined,
    areaId: undefined,
    corridorId: undefined,
    bayId: undefined,
    channelId: undefined,
    x: undefined,
    y: undefined,
    z: undefined,
    w: undefined,
    maxUdc: 1,
    enabled: true,
    automated: false,
    widthMm: undefined,
    depthMm: undefined,
    heightMm: undefined,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // API hooks
  const { data: locations = [], isLoading, error, refetch } = useGetLocationsQuery(filters);
  const [createLocation, { isLoading: isCreating }] = useCreateLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateLocationMutation();
  const [deleteLocation, { isLoading: isDeleting }] = useDeleteLocationMutation();

  // ========================================================================
  // DEBUG LOGGING - E2E Fix
  // ========================================================================
  React.useEffect(() => {
    console.log('[LocationsPage] DEBUG - Query State:', {
      isLoading,
      error,
      dataLength: locations?.length || 0,
      filters,
      locationsData: locations,
    });

    if (error) {
      console.error('[LocationsPage] ERROR fetching locations:', error);
      const errorMessage = (error as any)?.data?.message || (error as any)?.message || 'Errore di rete';
      toast.error(`Errore caricamento ubicazioni: ${errorMessage}`);
    }

    if (!isLoading && locations.length > 0) {
      console.log('[LocationsPage] SUCCESS - Loaded locations:', locations);
      toast.success(`Caricate ${locations.length} ubicazioni`, { duration: 2000, id: 'loc-load' });
    }
  }, [locations, isLoading, error, filters]);

  // ========================================================================
  // FILTRI
  // ========================================================================

  const handleApplyFilters = () => {
    const newFilters: LocationFilters = {
      limit: 50,
      offset: 0,
    };

    if (localFilters.barcode) newFilters.barcode = localFilters.barcode;
    if (localFilters.warehouseId) newFilters.warehouseId = parseInt(localFilters.warehouseId);
    if (localFilters.areaId) newFilters.areaId = parseInt(localFilters.areaId);
    if (localFilters.corridorId) newFilters.corridorId = parseInt(localFilters.corridorId);
    if (localFilters.enabled !== '') newFilters.enabled = localFilters.enabled === 'true';

    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      barcode: '',
      warehouseId: '',
      areaId: '',
      corridorId: '',
      enabled: '',
    });
    setFilters({ limit: 50, offset: 0 });
  };

  // ========================================================================
  // FORM VALIDATION
  // ========================================================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      errors.description = 'Descrizione obbligatoria';
    }

    if (!formData.barcode?.trim()) {
      errors.barcode = 'Barcode obbligatorio';
    }

    if (!formData.locationType?.trim()) {
      errors.locationType = 'Tipo ubicazione obbligatorio';
    }

    if (!formData.warehouseId) {
      errors.warehouseId = 'Warehouse ID obbligatorio';
    }

    if (!formData.areaId) {
      errors.areaId = 'Area ID obbligatoria';
    }

    if (formData.maxUdc !== undefined && formData.maxUdc < 1) {
      errors.maxUdc = 'Max UDC deve essere almeno 1';
    }

    if (formData.x !== undefined && formData.x < 0) {
      errors.x = 'Coordinata X non può essere negativa';
    }

    if (formData.y !== undefined && formData.y < 0) {
      errors.y = 'Coordinata Y non può essere negativa';
    }

    if (formData.z !== undefined && formData.z < 0) {
      errors.z = 'Coordinata Z non può essere negativa';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ========================================================================
  // CRUD OPERATIONS
  // ========================================================================

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      await createLocation(formData).unwrap();
      toast.success('Ubicazione creata con successo');
      setIsCreateModalOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Errore durante la creazione dell\'ubicazione');
      console.error('Create location error:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLocation?.id || !validateForm()) return;

    try {
      await updateLocation({
        id: selectedLocation.id,
        data: formData,
      }).unwrap();
      toast.success('Ubicazione aggiornata con successo');
      setIsEditModalOpen(false);
      setSelectedLocation(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Errore durante l\'aggiornamento dell\'ubicazione');
      console.error('Update location error:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation?.id) return;

    try {
      await deleteLocation(selectedLocation.id).unwrap();
      toast.success('Ubicazione eliminata con successo');
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Errore durante l\'eliminazione dell\'ubicazione');
      console.error('Delete location error:', error);
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const resetForm = () => {
    setFormData({
      description: '',
      barcode: '',
      locationType: '',
      warehouseId: undefined,
      areaId: undefined,
      corridorId: undefined,
      bayId: undefined,
      channelId: undefined,
      x: undefined,
      y: undefined,
      z: undefined,
      w: undefined,
      maxUdc: 1,
      enabled: true,
      automated: false,
      widthMm: undefined,
      depthMm: undefined,
      heightMm: undefined,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      description: location.description,
      barcode: location.barcode,
      locationType: location.locationType,
      warehouseId: location.warehouseId,
      areaId: location.areaId,
      corridorId: location.corridorId,
      bayId: location.bayId,
      channelId: location.channelId,
      x: location.x,
      y: location.y,
      z: location.z,
      w: location.w,
      maxUdc: location.maxUdc,
      enabled: location.enabled,
      automated: location.automated,
      widthMm: location.widthMm,
      depthMm: location.depthMm,
      heightMm: location.heightMm,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const calculateFillPercentage = (numUdc?: number, maxUdc?: number): number => {
    if (!maxUdc || maxUdc === 0) return 0;
    return Math.round(((numUdc || 0) / maxUdc) * 100);
  };

  const getFillBadgeVariant = (percentage: number): 'success' | 'warning' | 'danger' | 'default' => {
    if (percentage === 0) return 'default';
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  };

  // ========================================================================
  // TABLE COLUMNS
  // ========================================================================

  const columns: Column<Location>[] = [
    {
      key: 'id',
      header: 'ID',
      width: 'w-16',
      render: (loc) => (
        <span className="font-mono text-sm text-gray-600">#{loc.id}</span>
      ),
    },
    {
      key: 'barcode',
      header: 'Barcode',
      sortable: true,
      render: (loc) => (
        <span className="font-mono font-semibold text-ferrRed">{loc.barcode || '-'}</span>
      ),
    },
    {
      key: 'description',
      header: 'Descrizione',
      sortable: true,
      render: (loc) => (
        <span className="font-semibold text-gray-900">{loc.description}</span>
      ),
    },
    {
      key: 'locationType',
      header: 'Tipo',
      render: (loc) => (
        loc.locationType ? (
          <Badge size="sm">{loc.locationType}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'warehouse',
      header: 'Magazzino',
      render: (loc) => (
        <span className="text-sm text-gray-600">
          WH{loc.warehouseId || '-'}
        </span>
      ),
    },
    {
      key: 'area',
      header: 'Area',
      render: (loc) => (
        <span className="text-sm text-gray-600">
          A{loc.areaId || '-'}
        </span>
      ),
    },
    {
      key: 'corridor',
      header: 'Corridoio',
      render: (loc) => (
        <span className="text-sm text-gray-600">
          {loc.corridorId ? `C${loc.corridorId}` : '-'}
        </span>
      ),
    },
    {
      key: 'udc',
      header: 'UDC (Curr/Max)',
      render: (loc) => {
        const fillPercentage = calculateFillPercentage(loc.numUdc, loc.maxUdc);
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {loc.numUdc || 0} / {loc.maxUdc || 0}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  fillPercentage === 0
                    ? 'bg-gray-400'
                    : fillPercentage < 50
                    ? 'bg-green-500'
                    : fillPercentage < 80
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Stato',
      render: (loc) => (
        <div className="flex flex-col space-y-1">
          <Badge
            size="sm"
            variant={loc.enabled ? 'success' : 'default'}
          >
            {loc.enabled ? 'Abilitata' : 'Disabilitata'}
          </Badge>
          {loc.automated && (
            <Badge size="sm" variant="info">
              Automatizzata
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Azioni',
      width: 'w-32',
      render: (loc) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(loc);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Modifica
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(loc);
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            disabled={(loc.numUdc || 0) > 0}
            title={(loc.numUdc || 0) > 0 ? 'Impossibile eliminare ubicazione con UDC presenti' : ''}
          >
            Elimina
          </button>
        </div>
      ),
    },
  ];

  // ========================================================================
  // FORM COMPONENT
  // ========================================================================

  const LocationForm: React.FC = () => (
    <div className="space-y-4">
      {/* Dati Principali */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Dati Principali</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Descrizione"
            placeholder="Es. Scaffale A1-B2-C3"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={formErrors.description}
            required
          />

          <Input
            label="Barcode"
            placeholder="Codice univoco ubicazione"
            value={formData.barcode || ''}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            error={formErrors.barcode}
            required
          />

          <Input
            label="Tipo Ubicazione"
            placeholder="Es. SCAFFALE, TERRA, BUFFER"
            value={formData.locationType || ''}
            onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
            error={formErrors.locationType}
            required
          />

          <Input
            label="Max UDC"
            type="number"
            placeholder="Capacità massima UDC"
            value={formData.maxUdc || ''}
            onChange={(e) => setFormData({ ...formData, maxUdc: e.target.value ? parseInt(e.target.value) : 1 })}
            error={formErrors.maxUdc}
            required
          />
        </div>
      </div>

      {/* Gerarchia Magazzino */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Gerarchia Magazzino</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Warehouse ID"
            type="number"
            placeholder="ID magazzino"
            value={formData.warehouseId || ''}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value ? parseInt(e.target.value) : undefined })}
            error={formErrors.warehouseId}
            required
          />

          <Input
            label="Area ID"
            type="number"
            placeholder="ID area"
            value={formData.areaId || ''}
            onChange={(e) => setFormData({ ...formData, areaId: e.target.value ? parseInt(e.target.value) : undefined })}
            error={formErrors.areaId}
            required
          />

          <Input
            label="Corridor ID"
            type="number"
            placeholder="ID corridoio"
            value={formData.corridorId || ''}
            onChange={(e) => setFormData({ ...formData, corridorId: e.target.value ? parseInt(e.target.value) : undefined })}
          />

          <Input
            label="Bay ID"
            type="number"
            placeholder="ID bay/campata"
            value={formData.bayId || ''}
            onChange={(e) => setFormData({ ...formData, bayId: e.target.value ? parseInt(e.target.value) : undefined })}
          />

          <Input
            label="Channel ID"
            type="number"
            placeholder="ID canale"
            value={formData.channelId || ''}
            onChange={(e) => setFormData({ ...formData, channelId: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Coordinate */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Coordinate</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="X"
            type="number"
            placeholder="0"
            value={formData.x || ''}
            onChange={(e) => setFormData({ ...formData, x: e.target.value ? parseInt(e.target.value) : undefined })}
            error={formErrors.x}
          />

          <Input
            label="Y"
            type="number"
            placeholder="0"
            value={formData.y || ''}
            onChange={(e) => setFormData({ ...formData, y: e.target.value ? parseInt(e.target.value) : undefined })}
            error={formErrors.y}
          />

          <Input
            label="Z"
            type="number"
            placeholder="0"
            value={formData.z || ''}
            onChange={(e) => setFormData({ ...formData, z: e.target.value ? parseInt(e.target.value) : undefined })}
            error={formErrors.z}
          />

          <Input
            label="W"
            type="number"
            placeholder="0"
            value={formData.w || ''}
            onChange={(e) => setFormData({ ...formData, w: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Dimensioni */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Dimensioni (mm)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Larghezza (mm)"
            type="number"
            placeholder="1000"
            value={formData.widthMm || ''}
            onChange={(e) => setFormData({ ...formData, widthMm: e.target.value ? parseInt(e.target.value) : undefined })}
          />

          <Input
            label="Profondità (mm)"
            type="number"
            placeholder="800"
            value={formData.depthMm || ''}
            onChange={(e) => setFormData({ ...formData, depthMm: e.target.value ? parseInt(e.target.value) : undefined })}
          />

          <Input
            label="Altezza (mm)"
            type="number"
            placeholder="1500"
            value={formData.heightMm || ''}
            onChange={(e) => setFormData({ ...formData, heightMm: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Flags */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Opzioni</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled || false}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-ferrRed border-gray-300 rounded focus:ring-ferrRed"
            />
            <span className="text-sm text-gray-700">Ubicazione Abilitata</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.automated || false}
              onChange={(e) => setFormData({ ...formData, automated: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Ubicazione Automatizzata</span>
          </label>
        </div>
      </div>
    </div>
  );

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Ubicazioni</h1>
          <p className="text-gray-600 mt-1">Gestione ubicazioni di magazzino e capacità</p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Nuova Ubicazione
        </Button>
      </div>

      {/* Filtri Avanzati */}
      <Card
        title="Filtri Avanzati"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showFilters ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            }
          >
            {showFilters ? 'Nascondi' : 'Mostra'}
          </Button>
        }
      >
        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Barcode..."
                value={localFilters.barcode}
                onChange={(e) => setLocalFilters({ ...localFilters, barcode: e.target.value })}
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Input
                placeholder="Warehouse ID..."
                type="number"
                value={localFilters.warehouseId}
                onChange={(e) => setLocalFilters({ ...localFilters, warehouseId: e.target.value })}
              />
              <Input
                placeholder="Area ID..."
                type="number"
                value={localFilters.areaId}
                onChange={(e) => setLocalFilters({ ...localFilters, areaId: e.target.value })}
              />
              <Input
                placeholder="Corridor ID..."
                type="number"
                value={localFilters.corridorId}
                onChange={(e) => setLocalFilters({ ...localFilters, corridorId: e.target.value })}
              />
              <div>
                <select
                  value={localFilters.enabled}
                  onChange={(e) => setLocalFilters({ ...localFilters, enabled: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ferrRed focus:border-transparent"
                >
                  <option value="">Tutti gli stati</option>
                  <option value="true">Solo abilitate</option>
                  <option value="false">Solo disabilitate</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="primary" onClick={handleApplyFilters}>
                Applica Filtri
              </Button>
              <Button variant="ghost" onClick={handleResetFilters}>
                Reset Filtri
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tabella */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Trovate <span className="font-semibold">{locations.length}</span> ubicazioni
          </div>
        </div>
        <Table
          data={locations}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nessuna ubicazione trovata"
        />
      </Card>

      {/* Modal Creazione */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Nuova Ubicazione"
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              disabled={isCreating}
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={isCreating}
              disabled={isCreating}
            >
              Crea Ubicazione
            </Button>
          </div>
        }
      >
        <LocationForm />
      </Modal>

      {/* Modal Modifica */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLocation(null);
          resetForm();
        }}
        title={`Modifica Ubicazione: ${selectedLocation?.barcode}`}
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedLocation(null);
                resetForm();
              }}
              disabled={isUpdating}
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              loading={isUpdating}
              disabled={isUpdating}
            >
              Salva Modifiche
            </Button>
          </div>
        }
      >
        <LocationForm />
      </Modal>

      {/* Dialog Conferma Eliminazione */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedLocation(null);
        }}
        onConfirm={handleDelete}
        title="Conferma Eliminazione"
        message={`Sei sicuro di voler eliminare l'ubicazione "${selectedLocation?.barcode}" (${selectedLocation?.description})? Questa azione non può essere annullata. ATTENZIONE: Verifica che l'ubicazione sia vuota prima di eliminarla.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default LocationsPage;


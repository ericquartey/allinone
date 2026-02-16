// ============================================================================
// EJLOG WMS - Workstations Management Page
// Gestione CRUD postazioni di lavoro con filtri e form validazione
// Backend: /EjLogHostVertimag/Workstations su porta 3077
// ============================================================================

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  useGetWorkstationsQuery,
  useCreateWorkstationMutation,
  useUpdateWorkstationMutation,
  useDeleteWorkstationMutation,
  Workstation,
  WorkstationFilters,
} from '../../services/api/workstationsApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const WorkstationsPage: React.FC = () => {
  // State per filtri
  const [filters, setFilters] = useState<WorkstationFilters>({});
  const [localFilters, setLocalFilters] = useState({
    ipAddress: '',
    connectedUserId: '',
  });

  // State per modali
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState<Workstation | null>(null);

  // State per form
  const [formData, setFormData] = useState<Partial<Workstation>>({
    description: '',
    ipAddress: '',
    workstationType: '',
    locationId: undefined,
    areaIds: '',
    zoneIds: '',
    roles: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // API hooks
  const { data: workstations = [], isLoading, error, refetch } = useGetWorkstationsQuery(filters);
  const [createWorkstation, { isLoading: isCreating }] = useCreateWorkstationMutation();
  const [updateWorkstation, { isLoading: isUpdating }] = useUpdateWorkstationMutation();
  const [deleteWorkstation, { isLoading: isDeleting }] = useDeleteWorkstationMutation();

  // ========================================================================
  // DEBUG LOGGING - E2E Fix
  // ========================================================================
  React.useEffect(() => {
    console.log('[WorkstationsPage] DEBUG - Query State:', {
      isLoading,
      error,
      dataLength: workstations?.length || 0,
      filters,
      workstationsData: workstations,
    });

    if (error) {
      console.error('[WorkstationsPage] ERROR fetching workstations:', error);
      const errorMessage = (error as any)?.data?.message || (error as any)?.message || 'Errore di rete';
      toast.error(`Errore caricamento postazioni: ${errorMessage}`);
    }

    if (!isLoading && workstations.length > 0) {
      console.log('[WorkstationsPage] SUCCESS - Loaded workstations:', workstations);
      toast.success(`Caricate ${workstations.length} postazioni`, { duration: 2000, id: 'ws-load' });
    }
  }, [workstations, isLoading, error, filters]);

  // ========================================================================
  // FILTRI
  // ========================================================================

  const handleApplyFilters = () => {
    const newFilters: WorkstationFilters = {};
    if (localFilters.ipAddress) newFilters.ipAddress = localFilters.ipAddress;
    if (localFilters.connectedUserId) newFilters.connectedUserId = parseInt(localFilters.connectedUserId);
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setLocalFilters({ ipAddress: '', connectedUserId: '' });
    setFilters({});
  };

  // ========================================================================
  // FORM VALIDATION
  // ========================================================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      errors.description = 'Descrizione obbligatoria';
    }

    if (!formData.ipAddress?.trim()) {
      errors.ipAddress = 'Indirizzo IP obbligatorio';
    } else {
      // Validazione formato IP (semplice)
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(formData.ipAddress)) {
        errors.ipAddress = 'Formato IP non valido (es. 192.168.1.100)';
      }
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
      await createWorkstation(formData).unwrap();
      toast.success('Postazione creata con successo');
      setIsCreateModalOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Errore durante la creazione della postazione');
      console.error('Create workstation error:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWorkstation?.id || !validateForm()) return;

    try {
      await updateWorkstation({
        id: selectedWorkstation.id,
        data: formData,
      }).unwrap();
      toast.success('Postazione aggiornata con successo');
      setIsEditModalOpen(false);
      setSelectedWorkstation(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Errore durante l\'aggiornamento della postazione');
      console.error('Update workstation error:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkstation?.id) return;

    try {
      await deleteWorkstation(selectedWorkstation.id).unwrap();
      toast.success('Postazione eliminata con successo');
      setIsDeleteDialogOpen(false);
      setSelectedWorkstation(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Errore durante l\'eliminazione della postazione');
      console.error('Delete workstation error:', error);
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const resetForm = () => {
    setFormData({
      description: '',
      ipAddress: '',
      workstationType: '',
      locationId: undefined,
      areaIds: '',
      zoneIds: '',
      roles: '',
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (workstation: Workstation) => {
    setSelectedWorkstation(workstation);
    setFormData({
      description: workstation.description,
      ipAddress: workstation.ipAddress,
      workstationType: workstation.workstationType,
      locationId: workstation.locationId,
      areaIds: workstation.areaIds,
      zoneIds: workstation.zoneIds,
      roles: workstation.roles,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (workstation: Workstation) => {
    setSelectedWorkstation(workstation);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('it-IT');
  };

  // ========================================================================
  // TABLE COLUMNS
  // ========================================================================

  const columns: Column<Workstation>[] = [
    {
      key: 'id',
      header: 'ID',
      width: 'w-16',
      render: (ws) => (
        <span className="font-mono text-sm text-gray-600">#{ws.id}</span>
      ),
    },
    {
      key: 'description',
      header: 'Descrizione',
      sortable: true,
      render: (ws) => (
        <span className="font-semibold text-gray-900">{ws.description}</span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Indirizzo IP',
      sortable: true,
      render: (ws) => (
        <span className="font-mono text-sm text-ferrRed">{ws.ipAddress || '-'}</span>
      ),
    },
    {
      key: 'workstationType',
      header: 'Tipo',
      render: (ws) => (
        ws.workstationType ? (
          <Badge size="sm">{ws.workstationType}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'connectedUserName',
      header: 'Utente Connesso',
      render: (ws) => (
        ws.connectedUserName ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm">{ws.connectedUserName}</span>
          </div>
        ) : (
          <span className="text-gray-400">Nessuno</span>
        )
      ),
    },
    {
      key: 'lastConnectionDate',
      header: 'Ultima Connessione',
      render: (ws) => (
        <span className="text-sm text-gray-600">{formatDate(ws.lastConnectionDate)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Azioni',
      width: 'w-32',
      render: (ws) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(ws);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Modifica
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(ws);
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
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

  const WorkstationForm: React.FC = () => (
    <div className="space-y-4">
      <Input
        label="Descrizione"
        placeholder="Es. Postazione Picking 1"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        error={formErrors.description}
        required
      />

      <Input
        label="Indirizzo IP"
        placeholder="Es. 192.168.1.100"
        value={formData.ipAddress || ''}
        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
        error={formErrors.ipAddress}
        required
      />

      <Input
        label="Tipo Postazione"
        placeholder="Es. PICKING, REFILLING, ADMIN"
        value={formData.workstationType || ''}
        onChange={(e) => setFormData({ ...formData, workstationType: e.target.value })}
      />

      <Input
        label="Location ID"
        type="number"
        placeholder="ID ubicazione associata"
        value={formData.locationId || ''}
        onChange={(e) => setFormData({ ...formData, locationId: e.target.value ? parseInt(e.target.value) : undefined })}
      />

      <Input
        label="Area IDs"
        placeholder="IDs aree separate da virgola (es. 1,2,3)"
        value={formData.areaIds || ''}
        onChange={(e) => setFormData({ ...formData, areaIds: e.target.value })}
        helperText="IDs delle aree accessibili dalla postazione"
      />

      <Input
        label="Zone IDs"
        placeholder="IDs zone separate da virgola"
        value={formData.zoneIds || ''}
        onChange={(e) => setFormData({ ...formData, zoneIds: e.target.value })}
        helperText="IDs delle zone accessibili dalla postazione"
      />

      <Input
        label="Ruoli"
        placeholder="Ruoli separati da virgola"
        value={formData.roles || ''}
        onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
        helperText="Ruoli necessari per accedere alla postazione"
      />
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Postazioni</h1>
          <p className="text-gray-600 mt-1">Gestione postazioni di lavoro e terminali</p>
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
          Nuova Postazione
        </Button>
      </div>

      {/* Filtri */}
      <Card title="Filtri">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Indirizzo IP..."
            value={localFilters.ipAddress}
            onChange={(e) => setLocalFilters({ ...localFilters, ipAddress: e.target.value })}
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <Input
            placeholder="ID Utente Connesso..."
            type="number"
            value={localFilters.connectedUserId}
            onChange={(e) => setLocalFilters({ ...localFilters, connectedUserId: e.target.value })}
          />
          <div className="flex space-x-2">
            <Button variant="primary" onClick={handleApplyFilters} fullWidth>
              Filtra
            </Button>
            <Button variant="ghost" onClick={handleResetFilters} fullWidth>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabella */}
      <Card>
        <Table
          data={workstations}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nessuna postazione trovata"
        />
      </Card>

      {/* Modal Creazione */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Nuova Postazione"
        size="lg"
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
              Crea Postazione
            </Button>
          </div>
        }
      >
        <WorkstationForm />
      </Modal>

      {/* Modal Modifica */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedWorkstation(null);
          resetForm();
        }}
        title={`Modifica Postazione: ${selectedWorkstation?.description}`}
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedWorkstation(null);
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
        <WorkstationForm />
      </Modal>

      {/* Dialog Conferma Eliminazione */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedWorkstation(null);
        }}
        onConfirm={handleDelete}
        title="Conferma Eliminazione"
        message={`Sei sicuro di voler eliminare la postazione "${selectedWorkstation?.description}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WorkstationsPage;


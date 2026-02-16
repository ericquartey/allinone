// ============================================================================
// EJLOG WMS - Workstation List Page
// Gestione Postazioni di lavoro e assegnazione operatori
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  Activity,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Edit,
  X,
} from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import * as WorkstationsService from '../../services/workstationsService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const WorkstationListPage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [workstations, setWorkstations] = useState<WorkstationsService.Workstation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [enabledFilter, setEnabledFilter] = useState<string>('ALL');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadWorkstations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await WorkstationsService.getWorkstations();

      if (result.result === 'OK' && result.data) {
        setWorkstations(result.data);
      } else {
        setError(result.message || 'Errore nel caricamento delle postazioni');
      }
    } catch (err) {
      console.error('Error loading workstations:', err);
      setError('Errore nel caricamento delle postazioni');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkstations();
  }, [loadWorkstations]);

  // ============================================================================
  // FILTERING & STATISTICS
  // ============================================================================

  const filteredWorkstations = useMemo(() => {
    const filters: WorkstationsService.WorkstationFilters = {
      type: typeFilter !== 'ALL' ? (typeFilter as WorkstationsService.WorkstationType) : undefined,
      status:
        statusFilter !== 'ALL' ? (statusFilter as WorkstationsService.WorkstationStatus) : undefined,
      zone: zoneFilter !== 'ALL' ? zoneFilter : undefined,
      search: searchTerm || undefined,
    };

    let filtered = WorkstationsService.filterWorkstations(workstations, filters);

    // Apply enabled filter
    if (enabledFilter === 'ENABLED') {
      filtered = filtered.filter((ws) => ws.isEnabled);
    } else if (enabledFilter === 'DISABLED') {
      filtered = filtered.filter((ws) => !ws.isEnabled);
    }

    return filtered;
  }, [workstations, searchTerm, typeFilter, statusFilter, zoneFilter, enabledFilter]);

  const stats = useMemo(() => WorkstationsService.getWorkstationStats(workstations), [workstations]);

  const zones = useMemo(() => {
    const uniqueZones = new Set(
      workstations.map((ws) => ws.zone).filter((zone): zone is string => zone !== undefined)
    );
    return Array.from(uniqueZones).sort();
  }, [workstations]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setZoneFilter('ALL');
    setEnabledFilter('ALL');
  };

  const handleViewDetails = (code: string) => {
    navigate(`/workstations/${code}`);
  };

  const handleToggleEnabled = async (code: string, currentlyEnabled: boolean) => {
    try {
      const result = await WorkstationsService.toggleWorkstationEnabled(code, !currentlyEnabled);

      if (result.result === 'OK') {
        alert(
          `Postazione ${currentlyEnabled ? 'disabilitata' : 'abilitata'} con successo!`
        );
        await loadWorkstations();
      } else {
        alert(result.message || 'Errore nell\'operazione');
      }
    } catch (error) {
      console.error('Error toggling workstation:', error);
      alert('Errore nell\'operazione');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la postazione ${code}?`)) {
      return;
    }

    try {
      const result = await WorkstationsService.deleteWorkstation(code);

      if (result.result === 'OK') {
        alert('Postazione eliminata con successo!');
        await loadWorkstations();
      } else {
        alert(result.message || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting workstation:', error);
      alert('Errore nell\'eliminazione della postazione');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Postazioni</h1>
          <p className="text-gray-600 mt-1">
            Postazioni di lavoro e monitoraggio operatori - {filteredWorkstations.length} risultati
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova Postazione
        </Button>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Monitor className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Totale</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Attive</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Con Utente</p>
              <p className="text-2xl font-bold text-purple-600">{stats.withUser}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Inattive</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Manutenzione</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filtri</h2>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cerca
            </label>
            <input
              type="text"
              placeholder="Codice, nome, zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti i tipi</option>
              <option value={WorkstationsService.WorkstationType.RECEIVING}>Ricevimento</option>
              <option value={WorkstationsService.WorkstationType.SHIPPING}>Spedizione</option>
              <option value={WorkstationsService.WorkstationType.PICKING}>Prelievo</option>
              <option value={WorkstationsService.WorkstationType.PACKING}>Confezionamento</option>
              <option value={WorkstationsService.WorkstationType.QUALITY_CONTROL}>
                Controllo Qualità
              </option>
              <option value={WorkstationsService.WorkstationType.INVENTORY}>Inventario</option>
              <option value={WorkstationsService.WorkstationType.REFILLING}>Rifornimento</option>
              <option value={WorkstationsService.WorkstationType.RETURNS}>Resi</option>
              <option value={WorkstationsService.WorkstationType.KITTING}>Kitting</option>
              <option value={WorkstationsService.WorkstationType.GENERAL}>Generale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti gli stati</option>
              <option value={WorkstationsService.WorkstationStatus.ACTIVE}>Attiva</option>
              <option value={WorkstationsService.WorkstationStatus.INACTIVE}>Inattiva</option>
              <option value={WorkstationsService.WorkstationStatus.MAINTENANCE}>Manutenzione</option>
              <option value={WorkstationsService.WorkstationStatus.OFFLINE}>Offline</option>
              <option value={WorkstationsService.WorkstationStatus.BUSY}>Occupata</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutte le zone</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stato Abilitazione</label>
            <select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutte</option>
              <option value="ENABLED">Solo Abilitate</option>
              <option value="DISABLED">Solo Disabilitate</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset Filtri
          </Button>
        </div>
      </Card>

      {/* Workstations Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Postazioni di Lavoro</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost">
              Esporta Excel
            </Button>
          </div>
        </div>

        {filteredWorkstations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nessuna postazione trovata</p>
            <p className="text-sm mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <Table
            columns={[
              {
                key: 'code',
                label: 'Codice',
                render: (row) => (
                  <button
                    className="text-blue-600 hover:underline font-semibold"
                    onClick={() => handleViewDetails(row.code)}
                  >
                    {row.code}
                  </button>
                ),
              },
              {
                key: 'name',
                label: 'Nome',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    {row.description && <p className="text-sm text-gray-600">{row.description}</p>}
                  </div>
                ),
              },
              {
                key: 'type',
                label: 'Tipo',
                render: (row) => (
                  <Badge variant="default">
                    {WorkstationsService.getWorkstationTypeLabel(row.type)}
                  </Badge>
                ),
              },
              {
                key: 'status',
                label: 'Stato',
                render: (row) => (
                  <Badge variant={WorkstationsService.getWorkstationStatusColor(row.status)}>
                    {WorkstationsService.getWorkstationStatusLabel(row.status)}
                  </Badge>
                ),
              },
              {
                key: 'zone',
                label: 'Zona',
                render: (row) => (
                  <span className="font-medium text-gray-700">{row.zone || '-'}</span>
                ),
              },
              {
                key: 'currentUser',
                label: 'Utente Corrente',
                render: (row) =>
                  row.currentUser ? (
                    <div>
                      <p className="font-medium">{row.currentUser.username}</p>
                      <p className="text-sm text-gray-600">
                        Login: {new Date(row.currentUser.loginTime).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  ),
              },
              {
                key: 'performance',
                label: 'Performance',
                render: (row) => (
                  <div className="text-sm">
                    <p className="font-medium">
                      {row.performance.tasksCompleted} task
                      <span className="text-xs text-gray-600 ml-1">
                        ({WorkstationsService.formatProductivity(row.performance.productivity)})
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Uptime: {WorkstationsService.formatUptime(row.performance.uptime)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'devices',
                label: 'Dispositivi',
                render: (row) => {
                  const connectedDevices = WorkstationsService.countConnectedDevices(row);
                  const hasDisconnected = WorkstationsService.hasDisconnectedDevices(row);

                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {connectedDevices}/{row.devices.length}
                      </span>
                      {hasDisconnected && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    </div>
                  );
                },
              },
              {
                key: 'enabled',
                label: 'Abilitata',
                render: (row) => (
                  <Badge variant={row.isEnabled ? 'success' : 'error'}>
                    {row.isEnabled ? 'Sì' : 'No'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                label: 'Azioni',
                render: (row) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleViewDetails(row.code)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={row.isEnabled ? 'warning' : 'success'}
                      onClick={() => handleToggleEnabled(row.code, row.isEnabled)}
                    >
                      {row.isEnabled ? 'Disabilita' : 'Abilita'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(row.code)}
                      disabled={
                        row.status === WorkstationsService.WorkstationStatus.ACTIVE ||
                        row.currentUser !== undefined
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredWorkstations}
          />
        )}
      </Card>

      {/* Create Workstation Modal */}
      {showCreateModal && (
        <CreateWorkstationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadWorkstations();
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// CREATE WORKSTATION MODAL
// ============================================================================

interface CreateWorkstationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateWorkstationModal: React.FC<CreateWorkstationModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<WorkstationsService.CreateWorkstationParams>({
    code: '',
    name: '',
    type: WorkstationsService.WorkstationType.GENERAL,
    description: '',
    zone: '',
    location: '',
    ipAddress: '',
    macAddress: '',
    requiresAuthentication: true,
    allowMultipleUsers: false,
    maxConcurrentTasks: 1,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof WorkstationsService.CreateWorkstationParams, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    setFormErrors({});

    const validationErrors = WorkstationsService.validateWorkstationCreation(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSaving(true);

    try {
      const result = await WorkstationsService.createWorkstation(formData);

      if (result.result === 'OK') {
        alert('Postazione creata con successo!');
        onSuccess();
      } else {
        alert(result.message || 'Errore nella creazione');
      }
    } catch (error) {
      console.error('Error creating workstation:', error);
      alert('Errore nella creazione della postazione');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Nuova Postazione</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informazioni Base</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="WS001"
                />
                {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Postazione Picking Zona A"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    handleInputChange('type', e.target.value as WorkstationsService.WorkstationType)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={WorkstationsService.WorkstationType.RECEIVING}>Ricevimento</option>
                  <option value={WorkstationsService.WorkstationType.SHIPPING}>Spedizione</option>
                  <option value={WorkstationsService.WorkstationType.PICKING}>Prelievo</option>
                  <option value={WorkstationsService.WorkstationType.PACKING}>
                    Confezionamento
                  </option>
                  <option value={WorkstationsService.WorkstationType.QUALITY_CONTROL}>
                    Controllo Qualità
                  </option>
                  <option value={WorkstationsService.WorkstationType.INVENTORY}>Inventario</option>
                  <option value={WorkstationsService.WorkstationType.REFILLING}>
                    Rifornimento
                  </option>
                  <option value={WorkstationsService.WorkstationType.RETURNS}>Resi</option>
                  <option value={WorkstationsService.WorkstationType.KITTING}>Kitting</option>
                  <option value={WorkstationsService.WorkstationType.GENERAL}>Generale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                <input
                  type="text"
                  value={formData.zone || ''}
                  onChange={(e) => handleInputChange('zone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ZONA_A"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrizione dettagliata della postazione..."
                />
              </div>
            </div>
          </div>

          {/* Network Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Configurazione di Rete</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo IP
                </label>
                <input
                  type="text"
                  value={formData.ipAddress || ''}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.ipAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="192.168.1.100"
                />
                {formErrors.ipAddress && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ipAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo MAC
                </label>
                <input
                  type="text"
                  value={formData.macAddress || ''}
                  onChange={(e) => handleInputChange('macAddress', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.macAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00:1A:2B:3C:4D:5E"
                />
                {formErrors.macAddress && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.macAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ubicazione</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Corridoio 3, Posizione 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Simultanei Max
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxConcurrentTasks}
                  onChange={(e) => handleInputChange('maxConcurrentTasks', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Impostazioni di Sicurezza</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.requiresAuthentication}
                  onChange={(e) => handleInputChange('requiresAuthentication', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Richiede Autenticazione Utente
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.allowMultipleUsers}
                  onChange={(e) => handleInputChange('allowMultipleUsers', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Permetti Utenti Multipli Simultanei
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creazione...' : 'Crea Postazione'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WorkstationListPage;

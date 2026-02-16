// ============================================================================
// EJLOG WMS - Workstation Detail Page
// Dettaglio e modifica postazione di lavoro
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Monitor,
  Activity,
  Users,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Wifi,
  WifiOff,
  Plus,
} from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import * as WorkstationsService from '../../services/workstationsService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const WorkstationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  // State management
  const [workstation, setWorkstation] = useState<WorkstationsService.Workstation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<WorkstationsService.UpdateWorkstationParams>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal states
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadWorkstation = useCallback(async () => {
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const result = await WorkstationsService.getWorkstationByCode(code);

      if (result.result === 'OK' && result.data) {
        setWorkstation(result.data);
        // Initialize edit form
        setEditForm({
          name: result.data.name,
          description: result.data.description,
          type: result.data.type,
          zone: result.data.zone,
          location: result.data.location,
          ipAddress: result.data.ipAddress,
          macAddress: result.data.macAddress,
          maxConcurrentTasks: result.data.maxConcurrentTasks,
        });
      } else {
        setError(result.message || 'Postazione non trovata');
      }
    } catch (err) {
      console.error('Error loading workstation:', err);
      setError('Errore nel caricamento della postazione');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadWorkstation();
  }, [loadWorkstation]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset form
      if (workstation) {
        setEditForm({
          name: workstation.name,
          description: workstation.description,
          type: workstation.type,
          zone: workstation.zone,
          location: workstation.location,
          ipAddress: workstation.ipAddress,
          macAddress: workstation.macAddress,
          maxConcurrentTasks: workstation.maxConcurrentTasks,
        });
      }
      setFormErrors({});
    }
    setEditMode(!editMode);
  };

  const handleSaveEdit = async () => {
    if (!code || !workstation) return;

    setFormErrors({});

    const validationErrors = WorkstationsService.validateWorkstationUpdate(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSaving(true);

    try {
      const result = await WorkstationsService.updateWorkstation(code, editForm);

      if (result.result === 'OK') {
        alert('Postazione aggiornata con successo!');
        setEditMode(false);
        await loadWorkstation();
      } else {
        alert(result.message || 'Errore nell\'aggiornamento');
      }
    } catch (error) {
      console.error('Error updating workstation:', error);
      alert('Errore nell\'aggiornamento della postazione');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (newStatus: WorkstationsService.WorkstationStatus) => {
    if (!code || !confirm(`Confermi il cambio di stato a ${newStatus}?`)) return;

    try {
      const result = await WorkstationsService.updateWorkstationStatus(code, newStatus);

      if (result.result === 'OK') {
        alert('Stato aggiornato con successo!');
        await loadWorkstation();
      } else {
        alert(result.message || 'Errore nel cambio di stato');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Errore nel cambio di stato');
    }
  };

  const handleToggleEnabled = async () => {
    if (!code || !workstation) return;

    try {
      const result = await WorkstationsService.toggleWorkstationEnabled(
        code,
        !workstation.isEnabled
      );

      if (result.result === 'OK') {
        alert(
          `Postazione ${workstation.isEnabled ? 'disabilitata' : 'abilitata'} con successo!`
        );
        await loadWorkstation();
      } else {
        alert(result.message || 'Errore nell\'operazione');
      }
    } catch (error) {
      console.error('Error toggling enabled:', error);
      alert('Errore nell\'operazione');
    }
  };

  const handleDelete = async () => {
    if (!code || !confirm('Sei sicuro di voler eliminare questa postazione?')) return;

    try {
      const result = await WorkstationsService.deleteWorkstation(code);

      if (result.result === 'OK') {
        alert('Postazione eliminata con successo!');
        navigate('/workstations');
      } else {
        alert(result.message || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting workstation:', error);
      alert('Errore nell\'eliminazione della postazione');
    }
  };

  const handleLogout = async () => {
    if (!code || !confirm('Confermi il logout dell\'utente corrente?')) return;

    try {
      const result = await WorkstationsService.logoutFromWorkstation(code);

      if (result.result === 'OK') {
        alert('Utente disconnesso con successo!');
        await loadWorkstation();
      } else {
        alert(result.message || 'Errore nel logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Errore nel logout');
    }
  };

  const handleRemoveDevice = async (deviceId: number) => {
    if (!code || !confirm('Confermi la rimozione del dispositivo?')) return;

    try {
      const result = await WorkstationsService.removeDevice(code, deviceId);

      if (result.result === 'OK') {
        alert('Dispositivo rimosso con successo!');
        await loadWorkstation();
      } else {
        alert(result.message || 'Errore nella rimozione');
      }
    } catch (error) {
      console.error('Error removing device:', error);
      alert('Errore nella rimozione del dispositivo');
    }
  };

  const handleInputChange = (
    field: keyof WorkstationsService.UpdateWorkstationParams,
    value: any
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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

  if (error || !workstation) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="error">{error || 'Postazione non trovata'}</Alert>
        <Button variant="ghost" onClick={() => navigate('/workstations')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla lista
        </Button>
      </div>
    );
  }

  const isOperational = WorkstationsService.isWorkstationOperational(workstation);
  const isAvailable = WorkstationsService.isWorkstationAvailable(workstation);
  const connectedDevices = WorkstationsService.countConnectedDevices(workstation);
  const hasDisconnected = WorkstationsService.hasDisconnectedDevices(workstation);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workstations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{workstation.code}</h1>
              <Badge variant={WorkstationsService.getWorkstationStatusColor(workstation.status)}>
                {WorkstationsService.getWorkstationStatusLabel(workstation.status)}
              </Badge>
              <Badge variant={workstation.isEnabled ? 'success' : 'error'}>
                {workstation.isEnabled ? 'Abilitata' : 'Disabilitata'}
              </Badge>
              {isOperational && <CheckCircle className="w-5 h-5 text-green-500" />}
              {!isOperational && <AlertTriangle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-gray-600 mt-1">{workstation.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="ghost" onClick={handleEditToggle} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Annulla
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleEditToggle}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
              <Button
                variant={workstation.isEnabled ? 'warning' : 'success'}
                onClick={handleToggleEnabled}
              >
                {workstation.isEnabled ? 'Disabilita' : 'Abilita'}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={workstation.currentUser !== undefined}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Task Completati</p>
              <p className="text-2xl font-bold">{workstation.performance.tasksCompleted}</p>
              <p className="text-xs text-gray-600">
                Oggi: {workstation.performance.tasksCompletedToday}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Produttività</p>
              <p className="text-2xl font-bold">
                {WorkstationsService.formatProductivity(workstation.performance.productivity)}
              </p>
              <p className="text-xs text-gray-600">
                Media: {WorkstationsService.calculateAverageTaskTime(workstation)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-2xl font-bold">
                {WorkstationsService.formatUptime(workstation.performance.uptime)}
              </p>
              <p className="text-xs text-gray-600">Tempo operativo</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Dispositivi</p>
              <p className="text-2xl font-bold">
                {connectedDevices}/{workstation.devices.length}
              </p>
              <p className="text-xs text-gray-600">Connessi</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {hasDisconnected && (
        <Alert variant="warning">
          <AlertTriangle className="w-4 h-4 mr-2 inline" />
          Alcuni dispositivi sono disconnessi. Verificare i collegamenti.
        </Alert>
      )}

      {!isOperational && (
        <Alert variant="error">
          <AlertTriangle className="w-4 h-4 mr-2 inline" />
          La postazione non è operativa. Stato: {workstation.status}
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Informazioni Base</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg font-medium">
                  {workstation.code}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome {editMode && <span className="text-red-500">*</span>}
                </label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">{workstation.name}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                {editMode ? (
                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      handleInputChange(
                        'type',
                        e.target.value as WorkstationsService.WorkstationType
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={WorkstationsService.WorkstationType.RECEIVING}>
                      Ricevimento
                    </option>
                    <option value={WorkstationsService.WorkstationType.SHIPPING}>
                      Spedizione
                    </option>
                    <option value={WorkstationsService.WorkstationType.PICKING}>Prelievo</option>
                    <option value={WorkstationsService.WorkstationType.PACKING}>
                      Confezionamento
                    </option>
                    <option value={WorkstationsService.WorkstationType.QUALITY_CONTROL}>
                      Controllo Qualità
                    </option>
                    <option value={WorkstationsService.WorkstationType.INVENTORY}>
                      Inventario
                    </option>
                    <option value={WorkstationsService.WorkstationType.REFILLING}>
                      Rifornimento
                    </option>
                    <option value={WorkstationsService.WorkstationType.RETURNS}>Resi</option>
                    <option value={WorkstationsService.WorkstationType.KITTING}>Kitting</option>
                    <option value={WorkstationsService.WorkstationType.GENERAL}>Generale</option>
                  </select>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <Badge variant="default">
                      {WorkstationsService.getWorkstationTypeLabel(workstation.type)}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editForm.zone || ''}
                    onChange={(e) => handleInputChange('zone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-medium">
                    {workstation.zone || '-'}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                {editMode ? (
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    {workstation.description || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicazione</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">{workstation.location || '-'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Simultanei Max
                </label>
                {editMode ? (
                  <input
                    type="number"
                    min="1"
                    value={editForm.maxConcurrentTasks}
                    onChange={(e) =>
                      handleInputChange('maxConcurrentTasks', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-medium">
                    {workstation.maxConcurrentTasks}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Network Configuration */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Configurazione di Rete</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo IP
                </label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      value={editForm.ipAddress || ''}
                      onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        formErrors.ipAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="192.168.1.100"
                    />
                    {formErrors.ipAddress && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.ipAddress}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono">
                    {workstation.ipAddress || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo MAC
                </label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      value={editForm.macAddress || ''}
                      onChange={(e) => handleInputChange('macAddress', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        formErrors.macAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                    {formErrors.macAddress && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.macAddress}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono">
                    {workstation.macAddress || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg font-mono">
                  {workstation.hostname || '-'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ultimo Ping
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  {workstation.lastPing
                    ? new Date(workstation.lastPing).toLocaleString()
                    : 'Mai'}
                </div>
              </div>
            </div>
          </Card>

          {/* Devices */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Dispositivi ({workstation.devices.length})</h2>
              </div>
              <Button size="sm" onClick={() => setShowAddDeviceModal(true)} disabled={editMode}>
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi
              </Button>
            </div>

            {workstation.devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nessun dispositivo configurato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workstation.devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {device.isConnected ? (
                        <Wifi className="w-5 h-5 text-green-500" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" size="sm">
                            {WorkstationsService.getDeviceTypeLabel(device.type)}
                          </Badge>
                          <span className="text-sm text-gray-600">{device.identifier}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={device.isConnected ? 'success' : 'error'}>
                        {device.isConnected ? 'Connesso' : 'Disconnesso'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveDevice(device.id)}
                        disabled={editMode}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Current User */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Utente Corrente</h2>
            </div>

            {workstation.currentUser ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-medium">{workstation.currentUser.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nome Completo</p>
                  <p className="font-medium">{workstation.currentUser.fullName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Login</p>
                  <p className="text-sm">
                    {new Date(workstation.currentUser.loginTime).toLocaleString()}
                  </p>
                </div>
                <Button variant="warning" size="sm" onClick={handleLogout} className="w-full">
                  Disconnetti Utente
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nessun utente connesso</p>
              </div>
            )}
          </Card>

          {/* Status Management */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Gestione Stato</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Stato Corrente</p>
                <Badge
                  variant={WorkstationsService.getWorkstationStatusColor(workstation.status)}
                  className="text-sm px-3 py-1"
                >
                  {WorkstationsService.getWorkstationStatusLabel(workstation.status)}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Cambia Stato</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    size="sm"
                    variant={
                      workstation.status === WorkstationsService.WorkstationStatus.ACTIVE
                        ? 'success'
                        : 'ghost'
                    }
                    onClick={() =>
                      handleChangeStatus(WorkstationsService.WorkstationStatus.ACTIVE)
                    }
                    disabled={editMode}
                  >
                    Attiva
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      workstation.status === WorkstationsService.WorkstationStatus.INACTIVE
                        ? 'warning'
                        : 'ghost'
                    }
                    onClick={() =>
                      handleChangeStatus(WorkstationsService.WorkstationStatus.INACTIVE)
                    }
                    disabled={editMode}
                  >
                    Inattiva
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      workstation.status === WorkstationsService.WorkstationStatus.MAINTENANCE
                        ? 'warning'
                        : 'ghost'
                    }
                    onClick={() =>
                      handleChangeStatus(WorkstationsService.WorkstationStatus.MAINTENANCE)
                    }
                    disabled={editMode}
                  >
                    Manutenzione
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      workstation.status === WorkstationsService.WorkstationStatus.OFFLINE
                        ? 'error'
                        : 'ghost'
                    }
                    onClick={() =>
                      handleChangeStatus(WorkstationsService.WorkstationStatus.OFFLINE)
                    }
                    disabled={editMode}
                  >
                    Offline
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Configuration */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Configurazione</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Abilitata</span>
                <Badge variant={workstation.isEnabled ? 'success' : 'error'}>
                  {workstation.isEnabled ? 'Sì' : 'No'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Richiede Autenticazione</span>
                <Badge variant={workstation.requiresAuthentication ? 'warning' : 'default'}>
                  {workstation.requiresAuthentication ? 'Sì' : 'No'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Utenti Multipli</span>
                <Badge variant={workstation.allowMultipleUsers ? 'success' : 'default'}>
                  {workstation.allowMultipleUsers ? 'Sì' : 'No'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Operativa</span>
                {isOperational ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Disponibile</span>
                {isAvailable ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Info Sistema</h2>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Creato</p>
                <p className="font-medium">
                  {workstation.createdAt
                    ? new Date(workstation.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Ultimo Aggiornamento</p>
                <p className="font-medium">
                  {workstation.updatedAt
                    ? new Date(workstation.updatedAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Ultima Attività</p>
                <p className="font-medium">
                  {workstation.lastActivity
                    ? new Date(workstation.lastActivity).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <AddDeviceModal
          workstationCode={code!}
          onClose={() => setShowAddDeviceModal(false)}
          onSuccess={() => {
            setShowAddDeviceModal(false);
            loadWorkstation();
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// ADD DEVICE MODAL
// ============================================================================

interface AddDeviceModalProps {
  workstationCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  workstationCode,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<WorkstationsService.AddDeviceParams>({
    type: WorkstationsService.DeviceType.SCANNER,
    name: '',
    identifier: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof WorkstationsService.AddDeviceParams, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    const validationErrors = WorkstationsService.validateDeviceAddition(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSaving(true);

    try {
      const result = await WorkstationsService.addDevice(workstationCode, formData);

      if (result.result === 'OK') {
        alert('Dispositivo aggiunto con successo!');
        onSuccess();
      } else {
        alert(result.message || 'Errore nell\'aggiunta');
      }
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Errore nell\'aggiunta del dispositivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Aggiungi Dispositivo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                handleInputChange('type', e.target.value as WorkstationsService.DeviceType)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={WorkstationsService.DeviceType.PRINTER}>Stampante</option>
              <option value={WorkstationsService.DeviceType.SCANNER}>Scanner</option>
              <option value={WorkstationsService.DeviceType.SCALE}>Bilancia</option>
              <option value={WorkstationsService.DeviceType.TERMINAL}>Terminale</option>
              <option value={WorkstationsService.DeviceType.TABLET}>Tablet</option>
              <option value={WorkstationsService.DeviceType.WORKSTATION_PC}>PC Postazione</option>
              <option value={WorkstationsService.DeviceType.LABEL_PRINTER}>
                Stampante Etichette
              </option>
              <option value={WorkstationsService.DeviceType.BARCODE_READER}>
                Lettore Barcode
              </option>
            </select>
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
              placeholder="Scanner Zebra DS3608"
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identificatore <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => handleInputChange('identifier', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                formErrors.identifier ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="COM3, USB001, IP: 192.168.1.50"
            />
            {formErrors.identifier && (
              <p className="text-red-500 text-sm mt-1">{formErrors.identifier}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Aggiunta...' : 'Aggiungi'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WorkstationDetailPage;

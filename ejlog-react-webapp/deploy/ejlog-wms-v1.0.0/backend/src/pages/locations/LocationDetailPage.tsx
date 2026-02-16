// ============================================================================
// EJLOG WMS - Location Detail Page
// Dettaglio ubicazione con modalità visualizzazione/modifica - Refactored with locationsService
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import * as LocationsService from '../../services/locationsService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';

const LocationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [location, setLocation] = useState<LocationsService.Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editForm, setEditForm] = useState<LocationsService.UpdateLocationParams>({});

  // Load location
  const loadLocation = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const result = await LocationsService.getLocationByCode(code);
      if (result.result === 'OK' && result.data) {
        setLocation(result.data);
        setEditForm({
          description: result.data.description,
          zone: result.data.zone,
          type: result.data.type,
          maxWeight: result.data.capacity.maxWeight,
          maxVolume: result.data.capacity.maxVolume,
        });
      } else {
        setError(result.message || 'Ubicazione non trovata');
      }
    } catch (err) {
      console.error('Error loading location:', err);
      setError('Errore nel caricamento ubicazione');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!code || !location) return;
    setFormErrors({});

    const validationErrors = LocationsService.validateLocationUpdate(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await LocationsService.updateLocation(code, editForm);
      if (result.result === 'OK') {
        alert('Ubicazione aggiornata con successo!');
        setEditMode(false);
        await loadLocation();
      } else {
        alert(result.message || 'Errore nell\'aggiornamento');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Errore nell\'aggiornamento ubicazione');
    } finally {
      setSaving(false);
    }
  };

  // Handle block/unblock
  const handleBlock = async () => {
    if (!code) return;
    const reason = prompt('Motivo del blocco:');
    if (!reason) return;

    const result = await LocationsService.blockLocation(code, { reason });
    if (result.result === 'OK') {
      await loadLocation();
    } else {
      alert(result.message || 'Errore nel blocco');
    }
  };

  const handleUnblock = async () => {
    if (!code) return;
    const result = await LocationsService.unblockLocation(code);
    if (result.result === 'OK') {
      await loadLocation();
    } else {
      alert(result.message || 'Errore nello sblocco');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!code) return;
    if (!confirm(`Sei sicuro di voler eliminare l'ubicazione ${code}?`)) return;

    const result = await LocationsService.deleteLocation(code);
    if (result.result === 'OK') {
      alert('Ubicazione eliminata con successo!');
      navigate('/locations');
    } else {
      alert(result.message || 'Errore nell\'eliminazione');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="error">{error || 'Ubicazione non trovata'}</Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/locations')}>Torna alla Lista</Button>
        </div>
      </div>
    );
  }

  const weightOccupancy = LocationsService.getWeightOccupancy(location);
  const volumeOccupancy = LocationsService.getVolumeOccupancy(location);
  const isAvailable = LocationsService.isLocationAvailable(location);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{location.code}</h1>
            <Badge variant={LocationsService.getLocationStatusColor(location.status)}>
              {LocationsService.getLocationStatusLabel(location.status)}
            </Badge>
            {location.isBlocked && (
              <Badge variant="error">
                <AlertTriangle className="w-4 h-4 mr-1" />
                BLOCCATA
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">{location.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/locations')}>
            Torna alla Lista
          </Button>
          {editMode ? (
            <>
              <Button variant="ghost" onClick={() => {
                setEditMode(false);
                setFormErrors({});
              }}>
                Annulla
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? <><Spinner size="sm" className="mr-2" />Salvataggio...</> : 'Salva Modifiche'}
              </Button>
            </>
          ) : (
            <>
              {location.isBlocked ? (
                <Button variant="success" onClick={handleUnblock}>
                  Sblocca Ubicazione
                </Button>
              ) : (
                <Button variant="warning" onClick={handleBlock}>
                  Blocca Ubicazione
                </Button>
              )}
              <Button onClick={() => setEditMode(true)}>Modifica</Button>
              {location.status === LocationsService.LocationStatus.EMPTY && (
                <Button variant="error" onClick={handleDelete}>
                  Elimina
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Block Reason Alert */}
      {location.isBlocked && location.blockReason && (
        <Alert variant="warning">
          <strong>Motivo blocco:</strong> {location.blockReason}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Zona</p>
              <p className="text-xl font-bold">{location.zone}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="text-xl font-bold">
                {LocationsService.getLocationTypeLabel(location.type)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Occupazione Peso</p>
              <p className="text-xl font-bold">{Math.round(weightOccupancy)}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Occupazione Volume</p>
              <p className="text-xl font-bold">{Math.round(volumeOccupancy)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* General Info */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Informazioni Generali</h2>
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <input
                  type="text"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona
                </label>
                <select
                  value={editForm.zone || ''}
                  onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ZONA_A">Zona A</option>
                  <option value="ZONA_B">Zona B</option>
                  <option value="ZONA_C">Zona C</option>
                  <option value="STAGING">Staging</option>
                  <option value="RECEIVING">Ricevimento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={editForm.type || ''}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as LocationsService.LocationType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(LocationsService.LocationType).map((type) => (
                    <option key={type} value={type}>
                      {LocationsService.getLocationTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Codice:</span>
                <span className="font-semibold">{location.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Descrizione:</span>
                <span className="font-semibold">{location.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zona:</span>
                <span className="font-semibold">{location.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-semibold">
                  {LocationsService.getLocationTypeLabel(location.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disponibile:</span>
                <Badge variant={isAvailable ? 'success' : 'error'}>
                  {isAvailable ? 'Sì' : 'No'}
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Dimensions */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Dimensioni</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Larghezza:</span>
              <span className="font-semibold">{location.dimensions.width} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Profondità:</span>
              <span className="font-semibold">{location.dimensions.depth} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Altezza:</span>
              <span className="font-semibold">{location.dimensions.height} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume Totale:</span>
              <span className="font-semibold">
                {((location.dimensions.width * location.dimensions.depth * location.dimensions.height) / 1000000000).toFixed(2)} m³
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Capacity Information */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Capacità</h2>
        {editMode ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso Massimo (kg)
              </label>
              <input
                type="number"
                value={editForm.maxWeight || 0}
                onChange={(e) => setEditForm({ ...editForm, maxWeight: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={1}
              />
              {formErrors.maxWeight && (
                <p className="text-red-600 text-sm mt-1">{formErrors.maxWeight}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Massimo (m³)
              </label>
              <input
                type="number"
                step="0.1"
                value={editForm.maxVolume || 0}
                onChange={(e) => setEditForm({ ...editForm, maxVolume: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0.1}
              />
              {formErrors.maxVolume && (
                <p className="text-red-600 text-sm mt-1">{formErrors.maxVolume}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Weight Capacity */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Peso</span>
                <span className="text-sm text-gray-600">
                  {location.capacity.currentWeight} / {location.capacity.maxWeight} kg
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    weightOccupancy > 80
                      ? 'bg-red-500'
                      : weightOccupancy > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(weightOccupancy, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Occupazione: {Math.round(weightOccupancy)}%
              </p>
            </div>

            {/* Volume Capacity */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-sm text-gray-600">
                  {location.capacity.currentVolume.toFixed(2)} / {location.capacity.maxVolume.toFixed(2)} m³
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    volumeOccupancy > 80
                      ? 'bg-red-500'
                      : volumeOccupancy > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(volumeOccupancy, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Occupazione: {Math.round(volumeOccupancy)}%
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Current UDC */}
      {location.currentUDC && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">UDC Contenuta</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Barcode UDC:</span>
              <button
                onClick={() => navigate(`/udc/${location.currentUDC?.barcode}`)}
                className="text-blue-600 hover:underline font-semibold"
              >
                {location.currentUDC.barcode}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prodotti:</span>
              <span className="font-semibold">{location.currentUDC.products}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quantità Totale:</span>
              <span className="font-semibold">{location.currentUDC.totalQuantity} pz</span>
            </div>
          </div>
        </Card>
      )}

      {/* Activity Log */}
      {location.lastMovement && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Ultimo Movimento</h2>
          <div className="text-gray-600">
            {new Date(location.lastMovement).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationDetailPage;

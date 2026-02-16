// ============================================================================
// EJLOG WMS - Location List Page
// Gestione Locazioni di magazzino - Refactored with locationsService
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LocationsService from '../../services/locationsService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';

const LocationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationsService.Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load locations
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await LocationsService.getLocations();
      if (result.result === 'OK' && result.data) {
        setLocations(result.data);
      } else {
        setError(result.message || 'Errore nel caricamento delle ubicazioni');
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Errore nel caricamento delle ubicazioni');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    const filters: LocationsService.LocationFilters = {
      zone: zoneFilter !== 'ALL' ? zoneFilter : undefined,
      type: typeFilter !== 'ALL' ? (typeFilter as LocationsService.LocationType) : undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as LocationsService.LocationStatus) : undefined,
      search: searchTerm || undefined,
    };
    return LocationsService.filterLocations(locations, filters);
  }, [locations, searchTerm, zoneFilter, typeFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => LocationsService.getLocationStats(locations), [locations]);

  // Get status badge
  const getStatusBadge = useCallback((location: LocationsService.Location) => {
    if (location.isBlocked) {
      return <Badge variant="error">BLOCCATA</Badge>;
    }
    const variant = LocationsService.getLocationStatusColor(location.status);
    return <Badge variant={variant}>{LocationsService.getLocationStatusLabel(location.status)}</Badge>;
  }, []);

  // Get type badge
  const getTypeBadge = useCallback((type: LocationsService.LocationType) => {
    const variants: Record<LocationsService.LocationType, 'success' | 'warning' | 'error' | 'default'> = {
      [LocationsService.LocationType.RACK]: 'default',
      [LocationsService.LocationType.FLOOR]: 'default',
      [LocationsService.LocationType.STAGING]: 'warning',
      [LocationsService.LocationType.BUFFER]: 'warning',
      [LocationsService.LocationType.RECEIVING]: 'success',
      [LocationsService.LocationType.SHIPPING]: 'default',
      [LocationsService.LocationType.PICKING]: 'success',
      [LocationsService.LocationType.RESERVE]: 'default',
    };
    return <Badge variant={variants[type]}>{LocationsService.getLocationTypeLabel(type)}</Badge>;
  }, []);

  // Handle block/unblock
  const handleBlockLocation = async (code: string) => {
    const reason = prompt('Motivo del blocco:');
    if (!reason) return;

    const result = await LocationsService.blockLocation(code, { reason });
    if (result.result === 'OK') {
      await loadLocations();
    } else {
      alert(result.message || 'Errore nel blocco ubicazione');
    }
  };

  const handleUnblockLocation = async (code: string) => {
    const result = await LocationsService.unblockLocation(code);
    if (result.result === 'OK') {
      await loadLocations();
    } else {
      alert(result.message || 'Errore nello sblocco ubicazione');
    }
  };

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setZoneFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  }, []);

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
          <h1 className="text-3xl font-bold">Gestione Locazioni</h1>
          <p className="text-gray-600 mt-1">
            {filteredLocations.length} ubicazioni trovate
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/config/zones')}>
            Gestione Zone
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Nuova Ubicazione
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Totale</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Vuote</p>
            <p className="text-3xl font-bold text-green-600">{stats.empty}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Occupate</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.partial + stats.full}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Bloccate</p>
            <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Utilizzo Medio</p>
            <p className="text-3xl font-bold text-orange-600">{Math.round(stats.avgOccupancy)}%</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca
            </label>
            <input
              type="text"
              placeholder="Codice, descrizione, UDC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutte le zone</option>
              <option value="ZONA_A">Zona A</option>
              <option value="ZONA_B">Zona B</option>
              <option value="ZONA_C">Zona C</option>
              <option value="STAGING">Staging</option>
              <option value="RECEIVING">Ricevimento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti i tipi</option>
              {Object.values(LocationsService.LocationType).map((type) => (
                <option key={type} value={type}>
                  {LocationsService.getLocationTypeLabel(type)}
                </option>
              ))}
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
              {Object.values(LocationsService.LocationStatus).map((status) => (
                <option key={status} value={status}>
                  {LocationsService.getLocationStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Locations Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ubicazioni</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleResetFilters}>
              Reset Filtri
            </Button>
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nessuna ubicazione trovata</p>
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
                    onClick={() => navigate(`/locations/${row.code}`)}
                  >
                    {row.code}
                  </button>
                ),
              },
              {
                key: 'description',
                label: 'Descrizione',
                render: (row) => (
                  <span className="text-sm" title={row.description}>
                    {row.description.substring(0, 40)}
                    {row.description.length > 40 ? '...' : ''}
                  </span>
                ),
              },
              {
                key: 'zone',
                label: 'Zona',
                render: (row) => <span className="font-semibold">{row.zone}</span>,
              },
              {
                key: 'type',
                label: 'Tipo',
                render: (row) => getTypeBadge(row.type),
              },
              {
                key: 'status',
                label: 'Stato',
                render: (row) => getStatusBadge(row),
              },
              {
                key: 'currentUDC',
                label: 'UDC',
                render: (row) =>
                  row.currentUDC ? (
                    <button
                      onClick={() => navigate(`/udc/${row.currentUDC?.barcode}`)}
                      className="text-blue-600 hover:underline"
                    >
                      <div>
                        <p className="font-semibold">{row.currentUDC.barcode}</p>
                        <p className="text-xs text-gray-600">
                          {row.currentUDC.products} art. - {row.currentUDC.totalQuantity} pz
                        </p>
                      </div>
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  ),
              },
              {
                key: 'occupancy',
                label: 'Utilizzo',
                render: (row) => {
                  const percentage = Math.round(LocationsService.getWeightOccupancy(row));
                  return (
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{percentage}%</span>
                        <span className="text-gray-600">
                          {row.capacity.currentWeight}/{row.capacity.maxWeight}kg
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage > 80
                              ? 'bg-red-500'
                              : percentage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'dimensions',
                label: 'Dimensioni',
                render: (row) => (
                  <span className="text-xs text-gray-600">
                    {row.dimensions.width}×{row.dimensions.depth}×{row.dimensions.height}mm
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Azioni',
                render: (row) => (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/locations/${row.code}`)}
                    >
                      Dettagli
                    </Button>
                    {row.isBlocked ? (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUnblockLocation(row.code)}
                      >
                        Sblocca
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleBlockLocation(row.code)}
                      >
                        Blocca
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredLocations}
          />
        )}
      </Card>

      {/* Create Location Modal */}
      {showCreateModal && (
        <CreateLocationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadLocations();
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// CREATE LOCATION MODAL COMPONENT
// ============================================================================

interface CreateLocationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLocationModal: React.FC<CreateLocationModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<LocationsService.CreateLocationParams>({
    code: '',
    description: '',
    zone: '',
    type: LocationsService.LocationType.RACK,
    maxWeight: 500,
    maxVolume: 2.5,
    width: 1200,
    depth: 800,
    height: 2000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = LocationsService.validateLocationCreation(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await LocationsService.createLocation(formData);
      if (result.result === 'OK') {
        alert('Ubicazione creata con successo!');
        onSuccess();
      } else {
        alert(result.message || 'Errore durante la creazione');
      }
    } catch (error) {
      console.error('Error creating location:', error);
      alert('Errore durante la creazione ubicazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crea Nuova Ubicazione</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice *
              </label>
              <input
                type="text"
                placeholder="A-01-01-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona *
              </label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleziona zona...</option>
                <option value="ZONA_A">Zona A</option>
                <option value="ZONA_B">Zona B</option>
                <option value="ZONA_C">Zona C</option>
                <option value="STAGING">Staging</option>
                <option value="RECEIVING">Ricevimento</option>
              </select>
              {errors.zone && <p className="text-red-600 text-sm mt-1">{errors.zone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione *
            </label>
            <input
              type="text"
              placeholder="Descrizione ubicazione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as LocationsService.LocationType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(LocationsService.LocationType).map((type) => (
                <option key={type} value={type}>
                  {LocationsService.getLocationTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Dimensioni (mm)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Larghezza *
                </label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profondità *
                </label>
                <input
                  type="number"
                  value={formData.depth}
                  onChange={(e) => setFormData({ ...formData, depth: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altezza *
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min={1}
                />
              </div>
            </div>
            {errors.dimensions && <p className="text-red-600 text-sm mt-1">{errors.dimensions}</p>}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Capacità</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Massimo (kg) *
                </label>
                <input
                  type="number"
                  value={formData.maxWeight}
                  onChange={(e) => setFormData({ ...formData, maxWeight: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min={1}
                />
                {errors.maxWeight && <p className="text-red-600 text-sm mt-1">{errors.maxWeight}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Massimo (m³) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.maxVolume}
                  onChange={(e) => setFormData({ ...formData, maxVolume: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min={0.1}
                />
                {errors.maxVolume && <p className="text-red-600 text-sm mt-1">{errors.maxVolume}</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creazione...
                </>
              ) : (
                'Crea Ubicazione'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LocationListPage;

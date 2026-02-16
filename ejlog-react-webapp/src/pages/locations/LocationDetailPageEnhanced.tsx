// ============================================================================
// EJLOG WMS - Location Detail Page (Enhanced)
// Comprehensive detail view for warehouse locations with full management capabilities
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import {
  useGetLocationByCodeQuery,
  useGetLocationHistoryQuery,
  useGetLocationMovementsQuery,
  useReserveLocationMutation,
  useUnreserveLocationMutation,
  useBlockLocationMutation,
  useUnblockLocationMutation,
  useUpdateLocationMutation,
} from '../../services/api/locationApi';
import {
  LocationStatusLabels,
  LocationStatusColors,
  LocationTypeLabels,
} from '../../types/location';

type TabType = 'info' | 'occupancy' | 'history' | 'movements' | 'config' | 'plc';

const LocationDetailPageEnhanced: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // API queries
  const {
    data: location,
    isLoading,
    error,
    refetch,
  } = useGetLocationByCodeQuery(code!, { skip: !code });

  const {
    data: history,
  } = useGetLocationHistoryQuery(
    { locationId: location?.id!, limit: 50 },
    { skip: !location || activeTab !== 'history' }
  );

  const {
    data: movements,
  } = useGetLocationMovementsQuery(
    { locationId: location?.id!, limit: 50 },
    { skip: !location || activeTab !== 'movements' }
  );

  // Mutations
  const [reserveLocation, { isLoading: isReserving }] = useReserveLocationMutation();
  const [unreserveLocation, { isLoading: isUnreserving }] = useUnreserveLocationMutation();
  const [blockLocation, { isLoading: isBlocking }] = useBlockLocationMutation();
  const [unblockLocation, { isLoading: isUnblocking }] = useUnblockLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateLocationMutation();

  const getStatusBadgeClass = (status: string): string => {
    const statusKey = status as keyof typeof LocationStatusColors;
    const color = LocationStatusColors[statusKey];
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
    };
    return colorClasses[color] || 'bg-gray-100 text-gray-800';
  };

  const handleReserve = async () => {
    if (!location) return;
    try {
      await reserveLocation({
        locationId: location.id,
        reservedBy: 'current-user', // TODO: Get from auth context
        reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
        reason: 'Manual reservation from detail page',
      }).unwrap();
      setActionResult({ type: 'success', message: 'Ubicazione riservata con successo' });
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante la riservazione',
      });
    }
  };

  const handleUnreserve = async () => {
    if (!location) return;
    try {
      await unreserveLocation({
        locationId: location.id,
        reason: 'Manual unreservation from detail page',
      }).unwrap();
      setActionResult({ type: 'success', message: 'Riservazione rimossa con successo' });
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante la rimozione riservazione',
      });
    }
  };

  const handleBlock = async () => {
    if (!location) return;
    const reason = prompt('Inserisci il motivo del blocco:');
    if (!reason) return;

    try {
      await blockLocation({
        locationId: location.id,
        reason,
        blockedBy: 'current-user', // TODO: Get from auth context
      }).unwrap();
      setActionResult({ type: 'success', message: 'Ubicazione bloccata con successo' });
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante il blocco',
      });
    }
  };

  const handleUnblock = async () => {
    if (!location) return;
    try {
      await unblockLocation({
        locationId: location.id,
        reason: 'Manual unblock from detail page',
      }).unwrap();
      setActionResult({ type: 'success', message: 'Ubicazione sbloccata con successo' });
      refetch();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante lo sblocco',
      });
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'info', label: 'Informazioni', icon: 'ℹ️' },
    { id: 'occupancy', label: 'Occupazione', icon: '📦' },
    { id: 'history', label: 'Storico', icon: '📜' },
    { id: 'movements', label: 'Movimenti', icon: '🔄' },
    { id: 'config', label: 'Configurazione', icon: '⚙️' },
    { id: 'plc', label: 'PLC Signals', icon: '🔌' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="space-y-6">
        <Alert variant="danger">
          <p className="font-semibold">Errore caricamento ubicazione</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : 'Ubicazione non trovata'}
          </p>
        </Alert>
        <Button variant="ghost" onClick={() => navigate('/locations')}>
          ← Torna alle ubicazioni
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/locations')}>
              ← Indietro
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{location.code}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {location.warehouseName} • {location.zoneName}
              </p>
              <p className="text-xs font-mono text-gray-400 mt-1">{location.barcode}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {location.status === 'AVAILABLE' && (
            <Button variant="secondary" size="md" onClick={handleReserve} loading={isReserving}>
              🔒 Riserva
            </Button>
          )}
          {location.status === 'RESERVED' && (
            <Button variant="secondary" size="md" onClick={handleUnreserve} loading={isUnreserving}>
              🔓 Libera Riservazione
            </Button>
          )}
          {location.status !== 'BLOCKED' && (
            <Button variant="danger" size="md" onClick={handleBlock} loading={isBlocking}>
              ⛔ Blocca
            </Button>
          )}
          {location.status === 'BLOCKED' && (
            <Button variant="success" size="md" onClick={handleUnblock} loading={isUnblocking}>
              ✓ Sblocca
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={() => navigate(`/locations/debug/${location.code}`)}>
            🔧 Debug
          </Button>
          <Button variant="ghost" size="md" onClick={() => refetch()}>
            ↻ Aggiorna
          </Button>
        </div>
      </div>

      {/* Action Result */}
      {actionResult && (
        <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
          {actionResult.message}
        </Alert>
      )}

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Stato</p>
          <p className="text-xl font-bold text-blue-900">
            {LocationStatusLabels[location.status]}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">Tipo</p>
          <p className="text-xl font-bold text-purple-900">
            {LocationTypeLabels[location.type]}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Occupazione</p>
          <p className="text-xl font-bold text-green-900">
            {location.isOccupied ? 'Occupata' : 'Libera'}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
          <p className="text-xs text-orange-600 font-medium">Utilizzo</p>
          <p className="text-xl font-bold text-orange-900">
            {location.capacity.utilizationPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Physical Properties */}
            <Card title="Proprietà Fisiche">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Corridoio</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.coordinates.aisle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Campata</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.coordinates.bay}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Livello</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.coordinates.level}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Posizione</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.coordinates.position}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Dimensioni (mm)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-600">Larghezza</p>
                      <p className="text-sm font-bold text-blue-900">
                        {location.dimensions.width}
                      </p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs text-green-600">Profondità</p>
                      <p className="text-sm font-bold text-green-900">
                        {location.dimensions.depth}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs text-purple-600">Altezza</p>
                      <p className="text-sm font-bold text-purple-900">
                        {location.dimensions.height}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Peso Max (kg)</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {location.dimensions.maxWeight}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Volume Max (m³)</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {location.dimensions.maxVolume.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Coordinate (mm)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">X:</p>
                      <p className="text-sm font-mono text-gray-900">{location.coordinates.x}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Y:</p>
                      <p className="text-sm font-mono text-gray-900">{location.coordinates.y}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Z:</p>
                      <p className="text-sm font-mono text-gray-900">{location.coordinates.z}</p>
                    </div>
                  </div>
                </div>

                {location.tags && location.tags.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {location.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Capacity & Access */}
            <Card title="Capacità e Accesso">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-2">Utilizzo Capacità</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-blue-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${location.capacity.utilizationPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-2xl font-bold text-blue-900">
                      {location.capacity.utilizationPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600">Max UDC</p>
                    <p className="text-lg font-bold text-green-900">
                      {location.capacity.maxUdcs}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600">Tipo Accesso</p>
                    <p className="text-lg font-bold text-purple-900">{location.accessType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Peso Corrente</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.capacity.currentWeight} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Volume Corrente</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.capacity.currentVolume.toFixed(2)} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Peso Max</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.capacity.maxWeight} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Volume Max</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {location.capacity.maxVolume.toFixed(2)} m³
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Configurazione</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Picking:</span>
                      <span className="font-semibold">
                        {location.config.isPickingLocation ? '✓ Sì' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stoccaggio:</span>
                      <span className="font-semibold">
                        {location.config.isStorageLocation ? '✓ Sì' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">FIFO:</span>
                      <span className="font-semibold">
                        {location.config.fifoEnabled ? '✓ Abilitato' : '✗ Disabilitato'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prodotti Misti:</span>
                      <span className="font-semibold">
                        {location.config.allowMixedProducts ? '✓ Sì' : '✗ No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
                  <p>Creato: {new Date(location.createdAt).toLocaleString('it-IT')}</p>
                  <p>Aggiornato: {new Date(location.updatedAt).toLocaleString('it-IT')}</p>
                  {location.lastMovementAt && (
                    <p>
                      Ultimo Movimento:{' '}
                      {new Date(location.lastMovementAt).toLocaleString('it-IT')}
                    </p>
                  )}
                  {location.lastInventoryAt && (
                    <p>
                      Ultimo Inventario:{' '}
                      {new Date(location.lastInventoryAt).toLocaleString('it-IT')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'occupancy' && (
          <Card title="Dettaglio Occupazione">
            {location.isOccupied && location.occupancy ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Barcode UDC</p>
                      <p className="text-2xl font-bold font-mono text-blue-900">
                        {location.occupancy.udcBarcode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Tipo UDC</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {location.occupancy.udcType}
                      </p>
                    </div>
                    {location.occupancy.itemCode && (
                      <>
                        <div>
                          <p className="text-xs text-blue-600 mb-1">Codice Articolo</p>
                          <p className="text-lg font-mono text-blue-900">
                            {location.occupancy.itemCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 mb-1">Descrizione</p>
                          <p className="text-sm text-blue-900">
                            {location.occupancy.itemDescription}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600">Quantità</p>
                    <p className="text-2xl font-bold text-green-900">
                      {location.occupancy.quantity}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600">Peso (kg)</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {location.occupancy.weight}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600">Volume (m³)</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {location.occupancy.volume.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600">Occupata da</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {Math.floor(
                        (Date.now() - new Date(location.occupancy.occupiedSince).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      giorni
                    </p>
                  </div>
                </div>

                {location.occupancy.reservedBy && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900">Riservato</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Riservato da: {location.occupancy.reservedBy}
                    </p>
                    {location.occupancy.reservedUntil && (
                      <p className="text-xs text-yellow-700">
                        Fino a: {new Date(location.occupancy.reservedUntil).toLocaleString('it-IT')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-green-50 rounded-lg">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg font-semibold text-green-700">Ubicazione Libera</p>
                <p className="text-sm text-green-600 mt-2">
                  Disponibile per nuovi stoccaggi
                </p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'history' && (
          <Card title="Storico Eventi">
            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((event) => (
                  <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {event.type}
                          </span>
                          {event.userName && (
                            <span className="text-xs text-gray-500">da {event.userName}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mt-2">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(event.timestamp).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nessun evento storico disponibile</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'movements' && (
          <Card title="Storico Movimenti">
            {movements && movements.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          UDC
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Articolo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantità
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Utente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                movement.movementType === 'IN'
                                  ? 'bg-green-100 text-green-800'
                                  : movement.movementType === 'OUT'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {movement.movementType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">
                            {movement.udcBarcode}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {movement.itemCode || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {movement.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {movement.userName}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(movement.timestamp).toLocaleString('it-IT')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nessun movimento registrato</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'config' && (
          <Card title="Configurazione Ubicazione">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Picking Configuration */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Configurazione Picking</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicazione Picking:</span>
                      <span className="font-semibold">
                        {location.config.isPickingLocation ? '✓ Sì' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priorità Picking:</span>
                      <span className="font-semibold">{location.config.pickingPriority}</span>
                    </div>
                  </div>
                </div>

                {/* Storage Configuration */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Configurazione Stoccaggio</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicazione Stoccaggio:</span>
                      <span className="font-semibold">
                        {location.config.isStorageLocation ? '✓ Sì' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priorità Stoccaggio:</span>
                      <span className="font-semibold">{location.config.storagePriority}</span>
                    </div>
                  </div>
                </div>

                {/* Product Rules */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Regole Prodotto</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prodotti Misti:</span>
                      <span className="font-semibold">
                        {location.config.allowMixedProducts ? '✓ Consentiti' : '✗ Vietati'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lotti Misti:</span>
                      <span className="font-semibold">
                        {location.config.allowMixedBatches ? '✓ Consentiti' : '✗ Vietati'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategia FIFO:</span>
                      <span className="font-semibold">
                        {location.config.fifoEnabled ? '✓ Abilitato' : '✗ Disabilitato'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategia LIFO:</span>
                      <span className="font-semibold">
                        {location.config.lifoEnabled ? '✓ Abilitato' : '✗ Disabilitato'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quality Control */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Controllo Qualità</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Richiede Controllo:</span>
                      <span className="font-semibold">
                        {location.config.requiresQualityCheck ? '✓ Sì' : '✗ No'}
                      </span>
                    </div>
                    {location.config.qualityCheckType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo Controllo:</span>
                        <span className="font-semibold">{location.config.qualityCheckType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              {location.restrictions && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3">Restrizioni</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-yellow-700 font-medium mb-1">Peso:</p>
                      <p className="text-yellow-900">
                        Min: {location.restrictions.minWeight} kg - Max:{' '}
                        {location.restrictions.maxWeight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-yellow-700 font-medium mb-1">Volume:</p>
                      <p className="text-yellow-900">
                        Min: {location.restrictions.minVolume.toFixed(2)} m³ - Max:{' '}
                        {location.restrictions.maxVolume.toFixed(2)} m³
                      </p>
                    </div>
                    {location.restrictions.requiresTemperatureControl && (
                      <div>
                        <p className="text-yellow-700 font-medium mb-1">Temperatura:</p>
                        <p className="text-yellow-900">
                          {location.restrictions.minTemperature}°C -{' '}
                          {location.restrictions.maxTemperature}°C
                        </p>
                      </div>
                    )}
                    {location.restrictions.requiresAuthorization && (
                      <div>
                        <p className="text-yellow-700 font-medium mb-1">Autorizzazione:</p>
                        <p className="text-yellow-900">Richiesta</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'plc' && (
          <Card title="Integrazione PLC">
            {location.plcDeviceId ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Device PLC Collegato</p>
                  <p className="text-lg font-mono font-semibold text-blue-900">
                    {location.plcDeviceId}
                  </p>
                </div>

                {location.plcSignalIds && location.plcSignalIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Segnali PLC Associati ({location.plcSignalIds.length})
                    </p>
                    <div className="space-y-2">
                      {location.plcSignalIds.map((signalId) => (
                        <div
                          key={signalId}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <p className="text-sm font-mono text-gray-900">{signalId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate(`/plc/devices/${location.plcDeviceId}`)}
                >
                  Vai al Device PLC →
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🔌</div>
                <p className="text-lg font-semibold text-gray-700">Nessuna Integrazione PLC</p>
                <p className="text-sm text-gray-500 mt-2">
                  Questa ubicazione non è collegata a dispositivi PLC
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default LocationDetailPageEnhanced;

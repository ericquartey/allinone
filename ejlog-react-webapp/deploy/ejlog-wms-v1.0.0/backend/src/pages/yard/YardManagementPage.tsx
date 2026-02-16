import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface YardLocation {
  id: string;
  code: string;
  type: 'TRAILER' | 'CONTAINER' | 'PARKING' | 'STAGING';
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  zone: string;
  capacity: string;
  currentVehicle?: {
    vehicleNumber: string;
    carrier: string;
    arrivalTime: string;
    operation: 'LOADING' | 'UNLOADING' | 'WAITING' | 'CROSS_DOCK';
    priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
    ordersCount?: number;
  };
  dwellTime?: number; // hours
}

const YardManagementPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<YardLocation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockLocations: YardLocation[] = [
    { id: '1', code: 'YARD-A01', type: 'TRAILER', status: 'OCCUPIED', zone: 'Zona A', capacity: '1 Trailer 13.6m', currentVehicle: { vehicleNumber: 'AB123CD', carrier: 'DHL Express', arrivalTime: '2025-11-20T08:00:00', operation: 'UNLOADING', priority: 'URGENT', ordersCount: 15 }, dwellTime: 2.5 },
    { id: '2', code: 'YARD-A02', type: 'TRAILER', status: 'EMPTY', zone: 'Zona A', capacity: '1 Trailer 13.6m' },
    { id: '3', code: 'YARD-A03', type: 'TRAILER', status: 'OCCUPIED', zone: 'Zona A', capacity: '1 Trailer 13.6m', currentVehicle: { vehicleNumber: 'EF456GH', carrier: 'UPS', arrivalTime: '2025-11-20T06:30:00', operation: 'LOADING', priority: 'HIGH', ordersCount: 22 }, dwellTime: 4.0 },
    { id: '4', code: 'YARD-B01', type: 'CONTAINER', status: 'OCCUPIED', zone: 'Zona B', capacity: '1 Container 40ft', currentVehicle: { vehicleNumber: 'IJ789KL', carrier: 'Maersk', arrivalTime: '2025-11-19T22:00:00', operation: 'WAITING', priority: 'NORMAL', ordersCount: 8 }, dwellTime: 12.5 },
    { id: '5', code: 'YARD-B02', type: 'CONTAINER', status: 'RESERVED', zone: 'Zona B', capacity: '1 Container 40ft' },
    { id: '6', code: 'YARD-B03', type: 'CONTAINER', status: 'EMPTY', zone: 'Zona B', capacity: '1 Container 40ft' },
    { id: '7', code: 'YARD-C01', type: 'PARKING', status: 'OCCUPIED', zone: 'Zona C', capacity: '3 Veicoli', currentVehicle: { vehicleNumber: 'MN012OP', carrier: 'Corriere Locale', arrivalTime: '2025-11-20T09:00:00', operation: 'CROSS_DOCK', priority: 'HIGH', ordersCount: 5 }, dwellTime: 1.5 },
    { id: '8', code: 'YARD-C02', type: 'PARKING', status: 'EMPTY', zone: 'Zona C', capacity: '3 Veicoli' },
    { id: '9', code: 'YARD-D01', type: 'STAGING', status: 'OCCUPIED', zone: 'Zona D', capacity: 'Area 100mq', currentVehicle: { vehicleNumber: 'QR345ST', carrier: 'TNT', arrivalTime: '2025-11-20T10:00:00', operation: 'UNLOADING', priority: 'NORMAL', ordersCount: 18 }, dwellTime: 0.5 },
    { id: '10', code: 'YARD-D02', type: 'STAGING', status: 'MAINTENANCE', zone: 'Zona D', capacity: 'Area 100mq' }
  ];

  const filteredLocations = mockLocations.filter((loc) => {
    const matchesSearch = loc.code.toLowerCase().includes(searchTerm.toLowerCase()) || (loc.currentVehicle && loc.currentVehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesZone = zoneFilter === 'ALL' || loc.zone === zoneFilter;
    const matchesStatus = statusFilter === 'ALL' || loc.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || loc.type === typeFilter;
    return matchesSearch && matchesZone && matchesStatus && matchesType;
  });

  const stats = {
    total: mockLocations.length,
    empty: mockLocations.filter(l => l.status === 'EMPTY').length,
    occupied: mockLocations.filter(l => l.status === 'OCCUPIED').length,
    reserved: mockLocations.filter(l => l.status === 'RESERVED').length,
    occupancyRate: (mockLocations.filter(l => l.status === 'OCCUPIED').length / mockLocations.length) * 100,
    avgDwellTime: mockLocations.filter(l => l.dwellTime).reduce((sum, l, _, arr) => sum + (l.dwellTime || 0) / arr.length, 0),
    vehiclesInYard: mockLocations.filter(l => l.currentVehicle).length
  };

  const getStatusBadge = (status: YardLocation['status']) => {
    const config = { EMPTY: { label: 'Libero', variant: 'success' as const }, OCCUPIED: { label: 'Occupato', variant: 'warning' as const }, RESERVED: { label: 'Riservato', variant: 'info' as const }, MAINTENANCE: { label: 'Manutenzione', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: YardLocation['type']) => {
    const labels = { TRAILER: 'Trailer', CONTAINER: 'Container', PARKING: 'Parcheggio', STAGING: 'Staging' };
    const colors = { TRAILER: 'bg-blue-100 text-blue-800', CONTAINER: 'bg-purple-100 text-purple-800', PARKING: 'bg-green-100 text-green-800', STAGING: 'bg-orange-100 text-orange-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[type]}`}>{labels[type]}</span>;
  };

  const getPriorityBadge = (priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW') => {
    const config = { URGENT: { label: 'Urgente', variant: 'danger' as const }, HIGH: { label: 'Alta', variant: 'warning' as const }, NORMAL: { label: 'Normale', variant: 'info' as const }, LOW: { label: 'Bassa', variant: 'secondary' as const } };
    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

  const getOperationBadge = (operation: 'LOADING' | 'UNLOADING' | 'WAITING' | 'CROSS_DOCK') => {
    const labels = { LOADING: 'Carico', UNLOADING: 'Scarico', WAITING: 'In Attesa', CROSS_DOCK: 'Cross-Dock' };
    const colors = { LOADING: 'bg-blue-100 text-blue-800', UNLOADING: 'bg-green-100 text-green-800', WAITING: 'bg-yellow-100 text-yellow-800', CROSS_DOCK: 'bg-purple-100 text-purple-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[operation]}`}>{labels[operation]}</span>;
  };

  const getDwellTimeColor = (hours: number) => {
    if (hours > 8) return 'text-red-600';
    if (hours > 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Piazzale</h1><p className="mt-2 text-gray-600">Gestisci locazioni yard e movimentazione veicoli</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Mappa yard')}>Mappa Piazzale</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo ingresso')}>Registra Ingresso</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Locazioni Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Libere</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.empty}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">Occupate</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.occupied}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Riservate</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.reserved}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Veicoli in Yard</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.vehiclesInYard}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Tasso Occupazione</div><div className="text-2xl font-bold text-purple-600 mt-1">{stats.occupancyRate.toFixed(0)}%</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Dwell Time Medio</div><div className="text-2xl font-bold text-orange-600 mt-1">{stats.avgDwellTime.toFixed(1)}h</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca codice, targa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Zona</label><select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutte</option><option value="Zona A">Zona A</option><option value="Zona B">Zona B</option><option value="Zona C">Zona C</option><option value="Zona D">Zona D</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="EMPTY">Libero</option><option value="OCCUPIED">Occupato</option><option value="RESERVED">Riservato</option><option value="MAINTENANCE">Manutenzione</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="TRAILER">Trailer</option><option value="CONTAINER">Container</option><option value="PARKING">Parcheggio</option><option value="STAGING">Staging</option></select></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLocations.map((location) => (
          <Card key={location.id} className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${location.status === 'EMPTY' ? 'border-green-200' : location.status === 'OCCUPIED' ? 'border-yellow-200' : location.status === 'RESERVED' ? 'border-blue-200' : 'border-red-200'}`} onClick={() => { setSelectedLocation(location); setShowDetailModal(true); }}>
            <div className="flex justify-between items-start mb-3">
              <div className="font-mono font-bold text-lg">{location.code}</div>
              {getStatusBadge(location.status)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Tipo</span>{getTypeBadge(location.type)}</div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Zona</span><span className="font-medium">{location.zone}</span></div>
              <div className="text-sm text-gray-600">{location.capacity}</div>
              {location.currentVehicle && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="font-medium font-mono text-sm">{location.currentVehicle.vehicleNumber}</div>
                  <div className="text-xs text-gray-600">{location.currentVehicle.carrier}</div>
                  <div className="flex gap-2">{getOperationBadge(location.currentVehicle.operation)}{getPriorityBadge(location.currentVehicle.priority)}</div>
                  {location.dwellTime && <div className={`text-sm font-medium ${getDwellTimeColor(location.dwellTime)}`}>Dwell: {location.dwellTime.toFixed(1)}h</div>}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showDetailModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedLocation.code}</h2><p className="text-gray-600 mt-1">{selectedLocation.zone}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Locazione</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedLocation.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedLocation.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Capacità</div><div className="font-medium">{selectedLocation.capacity}</div></div>
                </div>
              </Card>

              {selectedLocation.currentVehicle && (
                <>
                  <Card className="p-4 border-yellow-200 bg-yellow-50">
                    <h3 className="text-lg font-semibold mb-4 text-yellow-800">Veicolo Presente</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><div className="text-sm text-yellow-700">Targa</div><div className="font-mono font-medium text-lg text-yellow-900">{selectedLocation.currentVehicle.vehicleNumber}</div></div>
                      <div><div className="text-sm text-yellow-700">Vettore</div><div className="font-medium text-yellow-900">{selectedLocation.currentVehicle.carrier}</div></div>
                      <div><div className="text-sm text-yellow-700">Operazione</div><div className="mt-1">{getOperationBadge(selectedLocation.currentVehicle.operation)}</div></div>
                      <div><div className="text-sm text-yellow-700">Priorità</div><div className="mt-1">{getPriorityBadge(selectedLocation.currentVehicle.priority)}</div></div>
                      <div><div className="text-sm text-yellow-700">Arrivo</div><div className="font-medium text-yellow-900">{new Date(selectedLocation.currentVehicle.arrivalTime).toLocaleString('it-IT')}</div></div>
                      {selectedLocation.currentVehicle.ordersCount && <div><div className="text-sm text-yellow-700">Ordini</div><div className="font-medium text-lg text-yellow-900">{selectedLocation.currentVehicle.ordersCount}</div></div>}
                    </div>
                  </Card>

                  {selectedLocation.dwellTime && (
                    <Card className={`p-4 ${selectedLocation.dwellTime > 8 ? 'border-red-200 bg-red-50' : selectedLocation.dwellTime > 4 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                      <h3 className="text-lg font-semibold mb-3">Dwell Time</h3>
                      <div className={`text-3xl font-bold ${getDwellTimeColor(selectedLocation.dwellTime)}`}>{selectedLocation.dwellTime.toFixed(1)} ore</div>
                      <div className="text-sm text-gray-600 mt-2">{selectedLocation.dwellTime > 8 ? 'Attenzione: Tempo eccessivo!' : selectedLocation.dwellTime > 4 ? 'Monitorare situazione' : 'Tempo normale'}</div>
                    </Card>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Storico')}>Storico Locazione</Button>
                {selectedLocation.status === 'EMPTY' && <Button variant="primary" onClick={() => console.log('Riserva')}>Riserva</Button>}
                {selectedLocation.currentVehicle && <><Button variant="warning" onClick={() => console.log('Sposta')}>Sposta Veicolo</Button><Button variant="success" onClick={() => console.log('Libera')}>Libera Locazione</Button></>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YardManagementPage;

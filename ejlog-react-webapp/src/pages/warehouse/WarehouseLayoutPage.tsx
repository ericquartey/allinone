import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface LocationCell {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  bay: string;
  level: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' | 'MAINTENANCE';
  occupancy: number;
  capacity: number;
  type: 'PALLET' | 'SHELF' | 'FLOOR' | 'PICKING';
  udcCode?: string;
  lastActivity?: string;
}

const WarehouseLayoutPage: React.FC = () => {
  const [loading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('ZONA-A');
  const [selectedAisle, setSelectedAisle] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [selectedLocation, setSelectedLocation] = useState<LocationCell | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const zones = ['ZONA-A', 'ZONA-B', 'ZONA-C', 'ZONA-D'];
  const aisles = ['01', '02', '03', '04', '05', '06'];

  const mockLocations: LocationCell[] = [
    { id: '1', code: 'A-01-01-01', zone: 'ZONA-A', aisle: '01', bay: '01', level: '01', status: 'OCCUPIED', occupancy: 85, capacity: 1000, type: 'PALLET', udcCode: 'UDC-001', lastActivity: '2025-11-20T10:30:00' },
    { id: '2', code: 'A-01-01-02', zone: 'ZONA-A', aisle: '01', bay: '01', level: '02', status: 'OCCUPIED', occupancy: 100, capacity: 1000, type: 'PALLET', udcCode: 'UDC-045', lastActivity: '2025-11-19T15:20:00' },
    { id: '3', code: 'A-01-01-03', zone: 'ZONA-A', aisle: '01', bay: '01', level: '03', status: 'AVAILABLE', occupancy: 0, capacity: 1000, type: 'PALLET' },
    { id: '4', code: 'A-01-02-01', zone: 'ZONA-A', aisle: '01', bay: '02', level: '01', status: 'RESERVED', occupancy: 0, capacity: 1000, type: 'PALLET', lastActivity: '2025-11-20T09:00:00' },
    { id: '5', code: 'A-01-02-02', zone: 'ZONA-A', aisle: '01', bay: '02', level: '02', status: 'OCCUPIED', occupancy: 60, capacity: 1000, type: 'PALLET', udcCode: 'UDC-112', lastActivity: '2025-11-20T08:15:00' },
    { id: '6', code: 'A-01-02-03', zone: 'ZONA-A', aisle: '01', bay: '02', level: '03', status: 'BLOCKED', occupancy: 0, capacity: 1000, type: 'PALLET' },
    { id: '7', code: 'A-02-01-01', zone: 'ZONA-A', aisle: '02', bay: '01', level: '01', status: 'OCCUPIED', occupancy: 95, capacity: 1000, type: 'PALLET', udcCode: 'UDC-078', lastActivity: '2025-11-20T11:00:00' },
    { id: '8', code: 'A-02-01-02', zone: 'ZONA-A', aisle: '02', bay: '01', level: '02', status: 'AVAILABLE', occupancy: 0, capacity: 1000, type: 'PALLET' },
    { id: '9', code: 'A-02-01-03', zone: 'ZONA-A', aisle: '02', bay: '01', level: '03', status: 'MAINTENANCE', occupancy: 0, capacity: 1000, type: 'PALLET' },
    { id: '10', code: 'A-02-02-01', zone: 'ZONA-A', aisle: '02', bay: '02', level: '01', status: 'OCCUPIED', occupancy: 75, capacity: 1000, type: 'PALLET', udcCode: 'UDC-203', lastActivity: '2025-11-19T16:45:00' },
    { id: '11', code: 'B-01-01-01', zone: 'ZONA-B', aisle: '01', bay: '01', level: '01', status: 'OCCUPIED', occupancy: 100, capacity: 500, type: 'SHELF', lastActivity: '2025-11-20T09:30:00' },
    { id: '12', code: 'B-01-01-02', zone: 'ZONA-B', aisle: '01', bay: '01', level: '02', status: 'AVAILABLE', occupancy: 0, capacity: 500, type: 'SHELF' }
  ];

  const filteredLocations = mockLocations.filter((loc) => {
    const matchesZone = loc.zone === selectedZone;
    const matchesAisle = selectedAisle === 'ALL' || loc.aisle === selectedAisle;
    return matchesZone && matchesAisle;
  });

  const stats = {
    total: filteredLocations.length,
    available: filteredLocations.filter(l => l.status === 'AVAILABLE').length,
    occupied: filteredLocations.filter(l => l.status === 'OCCUPIED').length,
    reserved: filteredLocations.filter(l => l.status === 'RESERVED').length,
    blocked: filteredLocations.filter(l => l.status === 'BLOCKED').length,
    avgOccupancy: Math.round(filteredLocations.reduce((sum, l) => sum + l.occupancy, 0) / filteredLocations.length)
  };

  const getStatusColor = (status: LocationCell['status']) => {
    const config = {
      AVAILABLE: 'bg-green-500 hover:bg-green-600',
      OCCUPIED: 'bg-blue-500 hover:bg-blue-600',
      RESERVED: 'bg-yellow-500 hover:bg-yellow-600',
      BLOCKED: 'bg-red-500 hover:bg-red-600',
      MAINTENANCE: 'bg-gray-500 hover:bg-gray-600'
    };
    return config[status];
  };

  const getStatusBadge = (status: LocationCell['status']) => {
    const config = {
      AVAILABLE: { label: 'Disponibile', variant: 'success' as const },
      OCCUPIED: { label: 'Occupata', variant: 'info' as const },
      RESERVED: { label: 'Riservata', variant: 'warning' as const },
      BLOCKED: { label: 'Bloccata', variant: 'danger' as const },
      MAINTENANCE: { label: 'Manutenzione', variant: 'secondary' as const }
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy === 0) return 'text-gray-400';
    if (occupancy < 50) return 'text-green-600';
    if (occupancy < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderMapView = () => {
    const groupedByAisleBay = filteredLocations.reduce((acc, loc) => {
      const key = `${loc.aisle}-${loc.bay}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(loc);
      return acc;
    }, {} as Record<string, LocationCell[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedByAisleBay).map(([key, locations]) => {
          const [aisle, bay] = key.split('-');
          const sortedLocations = [...locations].sort((a, b) => parseInt(b.level) - parseInt(a.level));

          return (
            <div key={key} className="border border-gray-300 rounded-lg p-4">
              <div className="mb-3 font-semibold text-gray-700">Corridoio {aisle} - Scaffale {bay}</div>
              <div className="flex gap-2">
                {sortedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`w-24 h-24 rounded-lg cursor-pointer transition-all ${getStatusColor(loc.status)} text-white flex flex-col items-center justify-center`}
                    onClick={() => { setSelectedLocation(loc); setShowDetailModal(true); }}
                  >
                    <div className="text-xs font-semibold">Livello {loc.level}</div>
                    <div className="text-xs mt-1">{loc.status === 'OCCUPIED' ? loc.udcCode : loc.status}</div>
                    {loc.status === 'OCCUPIED' && (
                      <div className={`text-xs mt-1 font-bold ${getOccupancyColor(loc.occupancy)}`}>
                        {loc.occupancy}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredLocations.map((loc) => (
        <Card key={loc.id} className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedLocation(loc); setShowDetailModal(true); }}>
          <div className="flex justify-between items-start mb-3">
            <div className="font-semibold text-lg">{loc.code}</div>
            {getStatusBadge(loc.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium">{loc.type}</span>
            </div>
            {loc.udcCode && (
              <div className="flex justify-between">
                <span className="text-gray-600">UDC:</span>
                <span className="font-medium font-mono">{loc.udcCode}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Occupazione:</span>
              <span className={`font-medium ${getOccupancyColor(loc.occupancy)}`}>{loc.occupancy}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className={`h-2 rounded-full ${loc.occupancy > 80 ? 'bg-red-500' : loc.occupancy > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${loc.occupancy}%` }} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Layout Magazzino</h1>
          <p className="mt-2 text-gray-600">Visualizza e gestisci il layout del magazzino</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta mappa')}>Esporta Mappa</Button>
          <Button variant="primary" onClick={() => console.log('Configura layout')}>Configura Layout</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Totale Locazioni</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700">Disponibili</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.available}</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-700">Occupate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.occupied}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm font-medium text-yellow-700">Riservate</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.reserved}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">Bloccate</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.blocked}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Occupazione Media</div>
          <div className={`text-2xl font-bold mt-1 ${getOccupancyColor(stats.avgOccupancy)}`}>{stats.avgOccupancy}%</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              {zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corridoio</label>
            <select value={selectedAisle} onChange={(e) => setSelectedAisle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option>
              {aisles.map(aisle => <option key={aisle} value={aisle}>Corridoio {aisle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalità Vista</label>
            <div className="flex gap-2">
              <Button variant={viewMode === 'MAP' ? 'primary' : 'secondary'} onClick={() => setViewMode('MAP')} className="flex-1">Mappa</Button>
              <Button variant={viewMode === 'LIST' ? 'primary' : 'secondary'} onClick={() => setViewMode('LIST')} className="flex-1">Lista</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        {viewMode === 'MAP' ? renderMapView() : renderListView()}
      </Card>

      <Card className="p-4 bg-gray-50">
        <h3 className="text-sm font-semibold mb-3">Legenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Occupata</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Riservata</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Bloccata</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm">Manutenzione</span>
          </div>
        </div>
      </Card>

      {showDetailModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLocation.code}</h2>
                  <p className="text-gray-600 mt-1">Zona {selectedLocation.zone}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Locazione</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Stato</div>
                    <div className="mt-1">{getStatusBadge(selectedLocation.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Tipo</div>
                    <div className="font-medium">{selectedLocation.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Corridoio</div>
                    <div className="font-medium">{selectedLocation.aisle}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Scaffale</div>
                    <div className="font-medium">{selectedLocation.bay}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Livello</div>
                    <div className="font-medium">{selectedLocation.level}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Capacità</div>
                    <div className="font-medium">{selectedLocation.capacity} kg</div>
                  </div>
                </div>
              </Card>
              {selectedLocation.udcCode && (
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">UDC Presente</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Codice UDC:</span>
                      <span className="font-mono font-semibold text-blue-900">{selectedLocation.udcCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Occupazione:</span>
                      <span className={`font-semibold ${getOccupancyColor(selectedLocation.occupancy)}`}>{selectedLocation.occupancy}%</span>
                    </div>
                  </div>
                </Card>
              )}
              {selectedLocation.lastActivity && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Ultima Attività</h3>
                  <div className="text-gray-900">{new Date(selectedLocation.lastActivity).toLocaleString('it-IT')}</div>
                </Card>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('Storico movimenti')}>Storico Movimenti</Button>
                {selectedLocation.status === 'AVAILABLE' && <Button variant="primary" onClick={() => console.log('Prenota')}>Prenota Locazione</Button>}
                {selectedLocation.status === 'BLOCKED' && <Button variant="success" onClick={() => console.log('Sblocca')}>Sblocca Locazione</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseLayoutPage;

import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Dock {
  id: string;
  code: string;
  name: string;
  type: 'INBOUND' | 'OUTBOUND' | 'CROSSDOCK' | 'MIXED';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  location: string;
  capacity: string;
  currentAppointment?: {
    id: string;
    carrier: string;
    vehicleNumber: string;
    operation: 'LOADING' | 'UNLOADING';
    startTime: string;
    estimatedEnd: string;
  };
  todayAppointments: number;
  equipment: string[];
  notes?: string;
}

const DockManagementPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDock, setSelectedDock] = useState<Dock | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockDocks: Dock[] = [
    { id: '1', code: 'DOCK-01', name: 'Banchina Ricevimento 1', type: 'INBOUND', status: 'OCCUPIED', location: 'Area Nord', capacity: '3 Camion', currentAppointment: { id: 'APP-001', carrier: 'DHL', vehicleNumber: 'AB123CD', operation: 'UNLOADING', startTime: '2025-11-20T08:00:00', estimatedEnd: '2025-11-20T10:00:00' }, todayAppointments: 8, equipment: ['Transpallet', 'Scanner'], notes: '' },
    { id: '2', code: 'DOCK-02', name: 'Banchina Ricevimento 2', type: 'INBOUND', status: 'AVAILABLE', location: 'Area Nord', capacity: '2 Camion', todayAppointments: 6, equipment: ['Transpallet', 'Carrello'], notes: '' },
    { id: '3', code: 'DOCK-03', name: 'Banchina Spedizioni 1', type: 'OUTBOUND', status: 'RESERVED', location: 'Area Sud', capacity: '4 Camion', todayAppointments: 10, equipment: ['Transpallet', 'Scanner', 'Stampante'], notes: 'Prenotato per carico urgente ore 14:00' },
    { id: '4', code: 'DOCK-04', name: 'Banchina Spedizioni 2', type: 'OUTBOUND', status: 'OCCUPIED', location: 'Area Sud', capacity: '3 Camion', currentAppointment: { id: 'APP-002', carrier: 'UPS', vehicleNumber: 'EF456GH', operation: 'LOADING', startTime: '2025-11-20T09:30:00', estimatedEnd: '2025-11-20T11:30:00' }, todayAppointments: 9, equipment: ['Transpallet', 'Scanner'], notes: '' },
    { id: '5', code: 'DOCK-05', name: 'Banchina Cross-Dock', type: 'CROSSDOCK', status: 'AVAILABLE', location: 'Area Centrale', capacity: '2 Camion', todayAppointments: 12, equipment: ['Transpallet', 'Scanner', 'Nastro trasportatore'], notes: '' },
    { id: '6', code: 'DOCK-06', name: 'Banchina Mista 1', type: 'MIXED', status: 'MAINTENANCE', location: 'Area Est', capacity: '3 Camion', todayAppointments: 0, equipment: ['Transpallet'], notes: 'Manutenzione programmata - riapre domani' }
  ];

  const filteredDocks = mockDocks.filter((dock) => {
    const matchesSearch = dock.code.toLowerCase().includes(searchTerm.toLowerCase()) || dock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || dock.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || dock.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: mockDocks.length,
    available: mockDocks.filter(d => d.status === 'AVAILABLE').length,
    occupied: mockDocks.filter(d => d.status === 'OCCUPIED').length,
    reserved: mockDocks.filter(d => d.status === 'RESERVED').length,
    totalAppointments: mockDocks.reduce((sum, d) => sum + d.todayAppointments, 0)
  };

  const getStatusBadge = (status: Dock['status']) => {
    const config = { AVAILABLE: { label: 'Disponibile', variant: 'success' as const }, OCCUPIED: { label: 'Occupata', variant: 'info' as const }, MAINTENANCE: { label: 'Manutenzione', variant: 'secondary' as const }, RESERVED: { label: 'Riservata', variant: 'warning' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: Dock['type']) => {
    const config = { INBOUND: { label: 'Ingresso', color: 'bg-green-100 text-green-800' }, OUTBOUND: { label: 'Uscita', color: 'bg-blue-100 text-blue-800' }, CROSSDOCK: { label: 'Cross-Dock', color: 'bg-purple-100 text-purple-800' }, MIXED: { label: 'Mista', color: 'bg-gray-100 text-gray-800' } };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[type].color}`}>{config[type].label}</span>;
  };

  const getOperationBadge = (operation: 'LOADING' | 'UNLOADING') => operation === 'LOADING' ? <Badge variant="info">Carico</Badge> : <Badge variant="success">Scarico</Badge>;

  const columns = [
    { key: 'code', label: 'Codice', render: (row: Dock) => <div className="font-medium font-mono text-sm">{row.code}</div> },
    { key: 'name', label: 'Nome', render: (row: Dock) => <div><div className="font-medium">{row.name}</div><div className="text-sm text-gray-600">{row.location}</div></div> },
    { key: 'type', label: 'Tipo', render: (row: Dock) => getTypeBadge(row.type) },
    { key: 'status', label: 'Stato', render: (row: Dock) => getStatusBadge(row.status) },
    { key: 'current', label: 'Operazione Corrente', render: (row: Dock) => row.currentAppointment ? (<div className="text-sm"><div className="font-medium">{row.currentAppointment.carrier} - {row.currentAppointment.vehicleNumber}</div><div className="mt-1">{getOperationBadge(row.currentAppointment.operation)}</div></div>) : <div className="text-sm text-gray-500">-</div> },
    { key: 'appointments', label: 'Appuntamenti Oggi', render: (row: Dock) => <div className="font-medium text-center">{row.todayAppointments}</div> },
    { key: 'capacity', label: 'Capacità', render: (row: Dock) => <div className="text-sm">{row.capacity}</div> },
    { key: 'actions', label: 'Azioni', render: (row: Dock) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedDock(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'AVAILABLE' && <Button variant="primary" size="sm" onClick={() => console.log('Prenota')}>Prenota</Button>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Banchine</h1><p className="mt-2 text-gray-600">Gestisci banchine di carico/scarico e appuntamenti</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Calendario')}>Calendario Appuntamenti</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo appuntamento')}>Nuovo Appuntamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Totale Banchine</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Disponibili</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.available}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Occupate</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.occupied}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">Riservate</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.reserved}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Appuntamenti Oggi</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalAppointments}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per codice, nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="INBOUND">Ingresso</option><option value="OUTBOUND">Uscita</option><option value="CROSSDOCK">Cross-Dock</option><option value="MIXED">Mista</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="AVAILABLE">Disponibile</option><option value="OCCUPIED">Occupata</option><option value="RESERVED">Riservata</option><option value="MAINTENANCE">Manutenzione</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Banchine ({filteredDocks.length})</h2></div>
        <Table columns={columns} data={filteredDocks} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedDock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedDock.name}</h2><p className="text-gray-600 mt-1">Codice: {selectedDock.code}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Banchina</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedDock.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedDock.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Locazione</div><div className="font-medium">{selectedDock.location}</div></div>
                  <div><div className="text-sm text-gray-600">Capacità</div><div className="font-medium">{selectedDock.capacity}</div></div>
                  <div><div className="text-sm text-gray-600">Appuntamenti Oggi</div><div className="font-medium text-blue-600 text-lg">{selectedDock.todayAppointments}</div></div>
                </div>
              </Card>
              {selectedDock.currentAppointment && (
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">Operazione in Corso</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-sm text-blue-700">Vettore</div><div className="font-medium text-blue-900">{selectedDock.currentAppointment.carrier}</div></div>
                    <div><div className="text-sm text-blue-700">Veicolo</div><div className="font-medium font-mono text-blue-900">{selectedDock.currentAppointment.vehicleNumber}</div></div>
                    <div><div className="text-sm text-blue-700">Operazione</div><div className="mt-1">{getOperationBadge(selectedDock.currentAppointment.operation)}</div></div>
                    <div><div className="text-sm text-blue-700">Ora Inizio</div><div className="font-medium text-blue-900">{new Date(selectedDock.currentAppointment.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div></div>
                    <div><div className="text-sm text-blue-700">Fine Stimata</div><div className="font-medium text-blue-900">{new Date(selectedDock.currentAppointment.estimatedEnd).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div></div>
                  </div>
                </Card>
              )}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Equipaggiamento Disponibile</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDock.equipment.map((eq, idx) => (<Badge key={idx} variant="info">{eq}</Badge>))}
                </div>
              </Card>
              {selectedDock.notes && (
                <Card className="p-4 border-yellow-200 bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3>
                  <p className="text-yellow-900">{selectedDock.notes}</p>
                </Card>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('Calendario banchina')}>Calendario Banchina</Button>
                {selectedDock.status === 'AVAILABLE' && <Button variant="primary" onClick={() => console.log('Prenota')}>Prenota Banchina</Button>}
                {selectedDock.status === 'OCCUPIED' && <Button variant="success" onClick={() => console.log('Completa')}>Completa Operazione</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockManagementPage;

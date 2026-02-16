import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Appointment {
  id: string;
  appointmentNumber: string;
  type: 'INBOUND' | 'OUTBOUND' | 'BOTH';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  carrier: string;
  vehicleNumber?: string;
  dockAssigned?: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  estimatedDuration: number; // minutes
  actualArrival?: string;
  actualCompletion?: string;
  ordersCount: number;
  pallets?: number;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  contactPerson: string;
  contactPhone: string;
  notes?: string;
}

const AppointmentSchedulingPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('TODAY');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const mockAppointments: Appointment[] = [
    { id: '1', appointmentNumber: 'APT-2025-001', type: 'INBOUND', status: 'SCHEDULED', carrier: 'DHL Express', vehicleNumber: 'AB123CD', dockAssigned: 'DOCK-01', scheduledDate: '2025-11-20', scheduledTimeSlot: '08:00-10:00', estimatedDuration: 120, ordersCount: 15, pallets: 24, priority: 'URGENT', contactPerson: 'Mario Rossi', contactPhone: '+39 123 456 7890' },
    { id: '2', appointmentNumber: 'APT-2025-002', type: 'OUTBOUND', status: 'CONFIRMED', carrier: 'UPS', dockAssigned: 'DOCK-03', scheduledDate: '2025-11-20', scheduledTimeSlot: '10:00-12:00', estimatedDuration: 90, ordersCount: 22, pallets: 30, priority: 'HIGH', contactPerson: 'Luigi Bianchi', contactPhone: '+39 234 567 8901' },
    { id: '3', appointmentNumber: 'APT-2025-003', type: 'INBOUND', status: 'IN_PROGRESS', carrier: 'TNT', vehicleNumber: 'EF456GH', dockAssigned: 'DOCK-02', scheduledDate: '2025-11-20', scheduledTimeSlot: '12:00-14:00', estimatedDuration: 100, actualArrival: '2025-11-20T12:05:00', ordersCount: 18, pallets: 28, priority: 'NORMAL', contactPerson: 'Anna Verdi', contactPhone: '+39 345 678 9012' },
    { id: '4', appointmentNumber: 'APT-2025-004', type: 'BOTH', status: 'COMPLETED', carrier: 'FedEx', vehicleNumber: 'IJ789KL', dockAssigned: 'DOCK-04', scheduledDate: '2025-11-19', scheduledTimeSlot: '14:00-17:00', estimatedDuration: 180, actualArrival: '2025-11-19T14:10:00', actualCompletion: '2025-11-19T16:50:00', ordersCount: 35, pallets: 45, priority: 'HIGH', contactPerson: 'Paolo Neri', contactPhone: '+39 456 789 0123' },
    { id: '5', appointmentNumber: 'APT-2025-005', type: 'OUTBOUND', status: 'CANCELLED', carrier: 'Corriere Locale', scheduledDate: '2025-11-20', scheduledTimeSlot: '16:00-18:00', estimatedDuration: 60, ordersCount: 8, pallets: 12, priority: 'LOW', contactPerson: 'Giulia Gialli', contactPhone: '+39 567 890 1234', notes: 'Annullato per problemi logistici' },
    { id: '6', appointmentNumber: 'APT-2025-006', type: 'INBOUND', status: 'NO_SHOW', carrier: 'BRT', scheduledDate: '2025-11-20', scheduledTimeSlot: '06:00-08:00', estimatedDuration: 90, ordersCount: 12, pallets: 18, priority: 'NORMAL', contactPerson: 'Marco Blu', contactPhone: '+39 678 901 2345', notes: 'Vettore non presentato' }
  ];

  const filteredAppointments = mockAppointments.filter((apt) => {
    const matchesSearch = apt.appointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || apt.carrier.toLowerCase().includes(searchTerm.toLowerCase()) || (apt.vehicleNumber && apt.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || apt.type === typeFilter;
    const today = new Date().toISOString().split('T')[0];
    const matchesDate = dateFilter === 'ALL' || (dateFilter === 'TODAY' && apt.scheduledDate === today) || (dateFilter === 'TOMORROW' && apt.scheduledDate > today);
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const stats = {
    total: mockAppointments.length,
    scheduled: mockAppointments.filter(a => a.status === 'SCHEDULED').length,
    confirmed: mockAppointments.filter(a => a.status === 'CONFIRMED').length,
    inProgress: mockAppointments.filter(a => a.status === 'IN_PROGRESS').length,
    completed: mockAppointments.filter(a => a.status === 'COMPLETED').length,
    todayTotal: mockAppointments.filter(a => a.scheduledDate === new Date().toISOString().split('T')[0]).length,
    utilizationRate: (mockAppointments.filter(a => a.dockAssigned).length / mockAppointments.length) * 100
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const config = { SCHEDULED: { label: 'Programmato', variant: 'secondary' as const }, CONFIRMED: { label: 'Confermato', variant: 'info' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, CANCELLED: { label: 'Annullato', variant: 'danger' as const }, NO_SHOW: { label: 'No-Show', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: Appointment['type']) => {
    const labels = { INBOUND: 'Ingresso', OUTBOUND: 'Uscita', BOTH: 'Entrambi' };
    const colors = { INBOUND: 'bg-green-100 text-green-800', OUTBOUND: 'bg-blue-100 text-blue-800', BOTH: 'bg-purple-100 text-purple-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[type]}`}>{labels[type]}</span>;
  };

  const getPriorityBadge = (priority: Appointment['priority']) => {
    const config = { URGENT: { label: 'Urgente', variant: 'danger' as const }, HIGH: { label: 'Alta', variant: 'warning' as const }, NORMAL: { label: 'Normale', variant: 'info' as const }, LOW: { label: 'Bassa', variant: 'secondary' as const } };
    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

  const columns = [
    { key: 'number', label: 'Numero', render: (row: Appointment) => <div className="font-medium font-mono text-sm">{row.appointmentNumber}</div> },
    { key: 'type', label: 'Tipo', render: (row: Appointment) => getTypeBadge(row.type) },
    { key: 'status', label: 'Stato', render: (row: Appointment) => getStatusBadge(row.status) },
    { key: 'carrier', label: 'Vettore', render: (row: Appointment) => <div><div className="font-medium">{row.carrier}</div>{row.vehicleNumber && <div className="text-sm text-gray-600 font-mono">{row.vehicleNumber}</div>}</div> },
    { key: 'schedule', label: 'Programmazione', render: (row: Appointment) => <div className="text-sm"><div>{new Date(row.scheduledDate).toLocaleDateString('it-IT')}</div><div className="text-gray-600">{row.scheduledTimeSlot}</div></div> },
    { key: 'dock', label: 'Banchina', render: (row: Appointment) => row.dockAssigned ? <div className="font-mono text-sm">{row.dockAssigned}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'orders', label: 'Ordini/Pallet', render: (row: Appointment) => <div className="text-sm"><div>{row.ordersCount} ordini</div>{row.pallets && <div className="text-gray-600">{row.pallets} pallet</div>}</div> },
    { key: 'priority', label: 'Priorità', render: (row: Appointment) => getPriorityBadge(row.priority) },
    { key: 'actions', label: 'Azioni', render: (row: Appointment) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedAppointment(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'SCHEDULED' && <Button variant="primary" size="sm" onClick={() => console.log('Conferma')}>Conferma</Button>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Appuntamenti</h1><p className="mt-2 text-gray-600">Pianifica e gestisci appuntamenti di carico/scarico</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Calendario')}>Calendario</Button>
          <Button variant="primary" onClick={() => setShowScheduleModal(true)}>Nuovo Appuntamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">Programmati</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.scheduled}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Confermati</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.confirmed}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Corso</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completati</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Oggi</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.todayTotal}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Tasso Assegnazione</div><div className="text-2xl font-bold text-purple-600 mt-1">{stats.utilizationRate.toFixed(0)}%</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca numero, vettore, targa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="SCHEDULED">Programmato</option><option value="CONFIRMED">Confermato</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="CANCELLED">Annullato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="INBOUND">Ingresso</option><option value="OUTBOUND">Uscita</option><option value="BOTH">Entrambi</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Data</label><select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutte</option><option value="TODAY">Oggi</option><option value="TOMORROW">Domani</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Appuntamenti ({filteredAppointments.length})</h2></div>
        <Table columns={columns} data={filteredAppointments} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedAppointment.appointmentNumber}</h2><p className="text-gray-600 mt-1">{selectedAppointment.carrier}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Dettagli Appuntamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedAppointment.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Priorità</div><div className="mt-1">{getPriorityBadge(selectedAppointment.priority)}</div></div>
                  {selectedAppointment.vehicleNumber && <div><div className="text-sm text-gray-600">Targa</div><div className="font-mono font-medium">{selectedAppointment.vehicleNumber}</div></div>}
                  {selectedAppointment.dockAssigned && <div><div className="text-sm text-gray-600">Banchina Assegnata</div><div className="font-mono font-medium">{selectedAppointment.dockAssigned}</div></div>}
                  <div><div className="text-sm text-gray-600">Ordini</div><div className="font-medium">{selectedAppointment.ordersCount}</div></div>
                  {selectedAppointment.pallets && <div><div className="text-sm text-gray-600">Pallet</div><div className="font-medium">{selectedAppointment.pallets}</div></div>}
                  <div><div className="text-sm text-gray-600">Durata Stimata</div><div className="font-medium">{selectedAppointment.estimatedDuration} minuti</div></div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Programmazione</h3>
                <div className="space-y-3">
                  <div><div className="text-sm text-gray-600">Data Programmata</div><div className="font-medium">{new Date(selectedAppointment.scheduledDate).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
                  <div><div className="text-sm text-gray-600">Fascia Oraria</div><div className="font-medium">{selectedAppointment.scheduledTimeSlot}</div></div>
                  {selectedAppointment.actualArrival && <div><div className="text-sm text-gray-600">Arrivo Effettivo</div><div className="font-medium">{new Date(selectedAppointment.actualArrival).toLocaleString('it-IT')}</div></div>}
                  {selectedAppointment.actualCompletion && <div><div className="text-sm text-gray-600">Completamento</div><div className="font-medium">{new Date(selectedAppointment.actualCompletion).toLocaleString('it-IT')}</div></div>}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Contatti</h3>
                <div className="space-y-2">
                  <div><div className="text-sm text-gray-600">Referente</div><div className="font-medium">{selectedAppointment.contactPerson}</div></div>
                  <div><div className="text-sm text-gray-600">Telefono</div><div className="font-medium">{selectedAppointment.contactPhone}</div></div>
                </div>
              </Card>

              {selectedAppointment.notes && <Card className="p-4 border-yellow-200 bg-yellow-50"><h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3><p className="text-yellow-900">{selectedAppointment.notes}</p></Card>}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Modifica')}>Modifica</Button>
                {selectedAppointment.status === 'SCHEDULED' && <><Button variant="danger" onClick={() => console.log('Annulla')}>Annulla</Button><Button variant="primary" onClick={() => console.log('Conferma')}>Conferma</Button></>}
                {selectedAppointment.status === 'CONFIRMED' && <Button variant="success" onClick={() => console.log('Inizia')}>Inizia Operazione</Button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">Nuovo Appuntamento</h2><p className="text-gray-600 mt-1">Programma un nuovo appuntamento</p></div>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="INBOUND">Ingresso</option><option value="OUTBOUND">Uscita</option><option value="BOTH">Entrambi</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label><select className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="NORMAL">Normale</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vettore</label><input type="text" placeholder="Nome vettore" className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Data</label><input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fascia Oraria</label><select className="w-full px-3 py-2 border border-gray-300 rounded-md"><option>08:00-10:00</option><option>10:00-12:00</option><option>12:00-14:00</option><option>14:00-16:00</option><option>16:00-18:00</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Referente</label><input type="text" placeholder="Nome referente" className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label><input type="tel" placeholder="+39..." className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Annulla</Button>
                <Button variant="primary" onClick={() => { console.log('Crea appuntamento'); setShowScheduleModal(false); }}>Crea Appuntamento</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentSchedulingPage;

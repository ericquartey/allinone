import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface LaborMetrics {
  operatorId: string;
  operatorName: string;
  badge: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  zone: string;
  status: 'ACTIVE' | 'BREAK' | 'IDLE' | 'OFFLINE';
  tasksCompleted: number;
  tasksAssigned: number;
  unitsProcessed: number;
  hoursWorked: number;
  productivity: number; // units per hour
  accuracy: number; // percentage
  efficiency: number; // percentage
  utilizationRate: number; // percentage
  avgTaskTime: number; // minutes
}

interface ShiftPlan {
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  startTime: string;
  endTime: string;
  plannedOperators: number;
  actualOperators: number;
  plannedWorkload: number; // units
  actualWorkload: number;
  efficiency: number;
}

const LaborManagementPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [selectedOperator, setSelectedOperator] = useState<LaborMetrics | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [view, setView] = useState<'OPERATORS' | 'SHIFTS'>('OPERATORS');

  const mockOperators: LaborMetrics[] = [
    { operatorId: 'OP001', operatorName: 'Mario Rossi', badge: 'MR001', shift: 'MORNING', zone: 'Zona A', status: 'ACTIVE', tasksCompleted: 28, tasksAssigned: 30, unitsProcessed: 450, hoursWorked: 5.5, productivity: 82, accuracy: 98.5, efficiency: 95, utilizationRate: 88, avgTaskTime: 11 },
    { operatorId: 'OP002', operatorName: 'Luigi Bianchi', badge: 'LB002', shift: 'MORNING', zone: 'Zona B', status: 'ACTIVE', tasksCompleted: 32, tasksAssigned: 35, unitsProcessed: 520, hoursWorked: 5.5, productivity: 95, accuracy: 97.2, efficiency: 92, utilizationRate: 90, avgTaskTime: 10 },
    { operatorId: 'OP003', operatorName: 'Anna Verdi', badge: 'AV003', shift: 'MORNING', zone: 'Zona C', status: 'BREAK', tasksCompleted: 20, tasksAssigned: 25, unitsProcessed: 310, hoursWorked: 4.0, productivity: 78, accuracy: 99.1, efficiency: 80, utilizationRate: 75, avgTaskTime: 12 },
    { operatorId: 'OP004', operatorName: 'Paolo Neri', badge: 'PN004', shift: 'AFTERNOON', zone: 'Zona A', status: 'IDLE', tasksCompleted: 15, tasksAssigned: 20, unitsProcessed: 240, hoursWorked: 3.5, productivity: 69, accuracy: 96.8, efficiency: 75, utilizationRate: 65, avgTaskTime: 14 },
    { operatorId: 'OP005', operatorName: 'Giulia Gialli', badge: 'GG005', shift: 'AFTERNOON', zone: 'Zona B', status: 'ACTIVE', tasksCompleted: 38, tasksAssigned: 40, unitsProcessed: 610, hoursWorked: 6.0, productivity: 102, accuracy: 99.5, efficiency: 98, utilizationRate: 95, avgTaskTime: 9 },
    { operatorId: 'OP006', operatorName: 'Marco Blu', badge: 'MB006', shift: 'NIGHT', zone: 'Zona C', status: 'OFFLINE', tasksCompleted: 0, tasksAssigned: 0, unitsProcessed: 0, hoursWorked: 0, productivity: 0, accuracy: 0, efficiency: 0, utilizationRate: 0, avgTaskTime: 0 }
  ];

  const mockShiftPlans: ShiftPlan[] = [
    { shift: 'MORNING', startTime: '06:00', endTime: '14:00', plannedOperators: 12, actualOperators: 11, plannedWorkload: 1500, actualWorkload: 1280, efficiency: 85 },
    { shift: 'AFTERNOON', startTime: '14:00', endTime: '22:00', plannedOperators: 10, actualOperators: 10, plannedWorkload: 1200, actualWorkload: 1150, efficiency: 96 },
    { shift: 'NIGHT', startTime: '22:00', endTime: '06:00', plannedOperators: 6, actualOperators: 4, plannedWorkload: 600, actualWorkload: 350, efficiency: 58 }
  ];

  const filteredOperators = mockOperators.filter((op) => {
    const matchesSearch = op.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) || op.badge.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = shiftFilter === 'ALL' || op.shift === shiftFilter;
    const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;
    const matchesZone = zoneFilter === 'ALL' || op.zone === zoneFilter;
    return matchesSearch && matchesShift && matchesStatus && matchesZone;
  });

  const stats = {
    totalOperators: mockOperators.length,
    active: mockOperators.filter(o => o.status === 'ACTIVE').length,
    onBreak: mockOperators.filter(o => o.status === 'BREAK').length,
    idle: mockOperators.filter(o => o.status === 'IDLE').length,
    avgProductivity: mockOperators.filter(o => o.productivity > 0).reduce((sum, o, _, arr) => sum + o.productivity / arr.length, 0),
    avgEfficiency: mockOperators.filter(o => o.efficiency > 0).reduce((sum, o, _, arr) => sum + o.efficiency / arr.length, 0),
    totalUnits: mockOperators.reduce((sum, o) => sum + o.unitsProcessed, 0)
  };

  const getStatusBadge = (status: LaborMetrics['status']) => {
    const config = { ACTIVE: { label: 'Attivo', variant: 'success' as const }, BREAK: { label: 'Pausa', variant: 'warning' as const }, IDLE: { label: 'Inattivo', variant: 'secondary' as const }, OFFLINE: { label: 'Offline', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getShiftBadge = (shift: LaborMetrics['shift']) => {
    const config = { MORNING: { label: 'Mattino', color: 'bg-blue-100 text-blue-800' }, AFTERNOON: { label: 'Pomeriggio', color: 'bg-orange-100 text-orange-800' }, NIGHT: { label: 'Notte', color: 'bg-purple-100 text-purple-800' } };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[shift].color}`}>{config[shift].label}</span>;
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 95) return 'text-green-600';
    if (value >= 85) return 'text-blue-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const operatorColumns = [
    { key: 'badge', label: 'Badge', render: (row: LaborMetrics) => <div className="font-medium font-mono text-sm">{row.badge}</div> },
    { key: 'name', label: 'Nome', render: (row: LaborMetrics) => <div className="font-medium">{row.operatorName}</div> },
    { key: 'shift', label: 'Turno', render: (row: LaborMetrics) => getShiftBadge(row.shift) },
    { key: 'zone', label: 'Zona', render: (row: LaborMetrics) => <div className="text-sm">{row.zone}</div> },
    { key: 'status', label: 'Stato', render: (row: LaborMetrics) => getStatusBadge(row.status) },
    { key: 'tasks', label: 'Task', render: (row: LaborMetrics) => <div className="text-sm"><div className="font-medium">{row.tasksCompleted}/{row.tasksAssigned}</div><div className="text-gray-600">{row.tasksAssigned > 0 ? ((row.tasksCompleted / row.tasksAssigned) * 100).toFixed(0) : 0}%</div></div> },
    { key: 'units', label: 'Unità', render: (row: LaborMetrics) => <div className="font-medium">{row.unitsProcessed}</div> },
    { key: 'productivity', label: 'Produttività', render: (row: LaborMetrics) => <div className={`font-bold ${getPerformanceColor(row.productivity)}`}>{row.productivity}</div> },
    { key: 'efficiency', label: 'Efficienza', render: (row: LaborMetrics) => <div className={`font-bold ${getPerformanceColor(row.efficiency)}`}>{row.efficiency}%</div> },
    { key: 'accuracy', label: 'Accuratezza', render: (row: LaborMetrics) => <div className={`font-bold ${getPerformanceColor(row.accuracy)}`}>{row.accuracy}%</div> },
    { key: 'actions', label: 'Azioni', render: (row: LaborMetrics) => <Button variant="secondary" size="sm" onClick={() => { setSelectedOperator(row); setShowDetailModal(true); }}>Dettaglio</Button> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Manodopera</h1><p className="mt-2 text-gray-600">Monitora performance e produttività operatori</p></div>
        <div className="flex gap-3">
          <Button variant={view === 'OPERATORS' ? 'primary' : 'secondary'} onClick={() => setView('OPERATORS')}>Vista Operatori</Button>
          <Button variant={view === 'SHIFTS' ? 'primary' : 'secondary'} onClick={() => setView('SHIFTS')}>Vista Turni</Button>
          <Button variant="primary" onClick={() => console.log('Report')}>Genera Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Operatori</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOperators}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Attivi</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Pausa</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.onBreak}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">Inattivi</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.idle}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Unità Totali</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalUnits}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Produttività Media</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.avgProductivity.toFixed(0)}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Efficienza Media</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.avgEfficiency.toFixed(0)}%</div></Card>
      </div>

      {view === 'OPERATORS' && (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per nome, badge..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Turno</label><select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="MORNING">Mattino</option><option value="AFTERNOON">Pomeriggio</option><option value="NIGHT">Notte</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="ACTIVE">Attivo</option><option value="BREAK">Pausa</option><option value="IDLE">Inattivo</option><option value="OFFLINE">Offline</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Zona</label><select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutte</option><option value="Zona A">Zona A</option><option value="Zona B">Zona B</option><option value="Zona C">Zona C</option></select></div>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Operatori ({filteredOperators.length})</h2></div>
            <Table columns={operatorColumns} data={filteredOperators} keyExtractor={(row) => row.operatorId} />
          </Card>
        </>
      )}

      {view === 'SHIFTS' && (
        <div className="space-y-4">
          {mockShiftPlans.map((shift) => (
            <Card key={shift.shift} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div><h3 className="text-xl font-bold">{getShiftBadge(shift.shift as LaborMetrics['shift'])}</h3><p className="text-sm text-gray-600 mt-1">{shift.startTime} - {shift.endTime}</p></div>
                <div className={`text-3xl font-bold ${getPerformanceColor(shift.efficiency)}`}>{shift.efficiency}%</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div><div className="text-sm text-gray-600">Operatori Pianificati</div><div className="text-2xl font-bold text-gray-900 mt-1">{shift.plannedOperators}</div></div>
                <div><div className="text-sm text-gray-600">Operatori Effettivi</div><div className={`text-2xl font-bold mt-1 ${shift.actualOperators >= shift.plannedOperators ? 'text-green-600' : 'text-red-600'}`}>{shift.actualOperators}</div></div>
                <div><div className="text-sm text-gray-600">Carico Pianificato</div><div className="text-2xl font-bold text-gray-900 mt-1">{shift.plannedWorkload}</div></div>
                <div><div className="text-sm text-gray-600">Carico Effettivo</div><div className={`text-2xl font-bold mt-1 ${shift.actualWorkload >= shift.plannedWorkload ? 'text-green-600' : 'text-orange-600'}`}>{shift.actualWorkload}</div></div>
              </div>
              <div className="mt-4"><div className="text-sm text-gray-600 mb-1">Progresso</div><div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${shift.efficiency >= 85 ? 'bg-green-500' : shift.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(shift.efficiency, 100)}%` }} /></div></div>
            </Card>
          ))}
        </div>
      )}

      {showDetailModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedOperator.operatorName}</h2><p className="text-gray-600 mt-1">{selectedOperator.badge}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Generali</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Turno</div><div className="mt-1">{getShiftBadge(selectedOperator.shift)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedOperator.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Zona Assegnata</div><div className="font-medium">{selectedOperator.zone}</div></div>
                  <div><div className="text-sm text-gray-600">Ore Lavorate</div><div className="font-medium">{selectedOperator.hoursWorked}h</div></div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Performance</h3>
                <div className="space-y-4">
                  <div><div className="flex justify-between text-sm mb-1"><span>Produttività (unità/ora)</span><span className={`font-bold ${getPerformanceColor(selectedOperator.productivity)}`}>{selectedOperator.productivity}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${selectedOperator.productivity >= 95 ? 'bg-green-500' : selectedOperator.productivity >= 85 ? 'bg-blue-500' : selectedOperator.productivity >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(selectedOperator.productivity, 100)}%` }} /></div></div>
                  <div><div className="flex justify-between text-sm mb-1"><span>Efficienza</span><span className={`font-bold ${getPerformanceColor(selectedOperator.efficiency)}`}>{selectedOperator.efficiency}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${selectedOperator.efficiency >= 95 ? 'bg-green-500' : selectedOperator.efficiency >= 85 ? 'bg-blue-500' : selectedOperator.efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${selectedOperator.efficiency}%` }} /></div></div>
                  <div><div className="flex justify-between text-sm mb-1"><span>Accuratezza</span><span className={`font-bold ${getPerformanceColor(selectedOperator.accuracy)}`}>{selectedOperator.accuracy}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${selectedOperator.accuracy >= 95 ? 'bg-green-500' : selectedOperator.accuracy >= 85 ? 'bg-blue-500' : selectedOperator.accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${selectedOperator.accuracy}%` }} /></div></div>
                  <div><div className="flex justify-between text-sm mb-1"><span>Tasso Utilizzo</span><span className={`font-bold ${getPerformanceColor(selectedOperator.utilizationRate)}`}>{selectedOperator.utilizationRate}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${selectedOperator.utilizationRate >= 95 ? 'bg-green-500' : selectedOperator.utilizationRate >= 85 ? 'bg-blue-500' : selectedOperator.utilizationRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${selectedOperator.utilizationRate}%` }} /></div></div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Statistiche Oggi</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Task Completati</div><div className="text-2xl font-bold text-green-600 mt-1">{selectedOperator.tasksCompleted}</div></div>
                  <div><div className="text-sm text-gray-600">Task Assegnati</div><div className="text-2xl font-bold text-blue-600 mt-1">{selectedOperator.tasksAssigned}</div></div>
                  <div><div className="text-sm text-gray-600">Unità Processate</div><div className="text-2xl font-bold text-purple-600 mt-1">{selectedOperator.unitsProcessed}</div></div>
                  <div><div className="text-sm text-gray-600">Tempo Medio Task</div><div className="text-2xl font-bold text-orange-600 mt-1">{selectedOperator.avgTaskTime} min</div></div>
                </div>
              </Card>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Storico')}>Storico Performance</Button>
                <Button variant="primary" onClick={() => console.log('Assegna task')}>Assegna Nuovo Task</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborManagementPage;

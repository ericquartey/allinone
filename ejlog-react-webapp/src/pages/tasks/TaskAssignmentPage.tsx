import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Task {
  id: string;
  taskCode: string;
  type: 'PICKING' | 'REFILLING' | 'INVENTORY' | 'TRANSFER' | 'RECEIVING' | 'SHIPPING' | 'QUALITY_CHECK';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  assignedTo?: {
    id: string;
    name: string;
    badge: string;
  };
  zone: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  itemsCount?: number;
  description: string;
  notes?: string;
}

interface Operator {
  id: string;
  name: string;
  badge: string;
  status: 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFFLINE';
  currentTask?: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  zone: string;
  tasksCompletedToday: number;
  averageCompletionTime: number;
  efficiency: number; // percentage
}

const TaskAssignmentPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [view, setView] = useState<'TASKS' | 'OPERATORS'>('TASKS');

  const mockTasks: Task[] = [
    { id: '1', taskCode: 'TASK-001', type: 'PICKING', priority: 'URGENT', status: 'PENDING', zone: 'Zona A', estimatedDuration: 15, createdAt: '2025-11-20T08:00:00', deadline: '2025-11-20T09:00:00', itemsCount: 12, description: 'Prelievo ordine cliente ABC123' },
    { id: '2', taskCode: 'TASK-002', type: 'REFILLING', priority: 'HIGH', status: 'ASSIGNED', assignedTo: { id: 'OP1', name: 'Mario Rossi', badge: 'MR001' }, zone: 'Zona B', estimatedDuration: 30, createdAt: '2025-11-20T08:15:00', assignedAt: '2025-11-20T08:20:00', deadline: '2025-11-20T10:00:00', itemsCount: 8, description: 'Rifornimento scaffale B-12' },
    { id: '3', taskCode: 'TASK-003', type: 'INVENTORY', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedTo: { id: 'OP2', name: 'Luigi Bianchi', badge: 'LB002' }, zone: 'Zona C', estimatedDuration: 45, createdAt: '2025-11-20T08:30:00', assignedAt: '2025-11-20T08:35:00', startedAt: '2025-11-20T08:40:00', itemsCount: 25, description: 'Conteggio ciclico zona C' },
    { id: '4', taskCode: 'TASK-004', type: 'TRANSFER', priority: 'HIGH', status: 'PENDING', zone: 'Zona A', estimatedDuration: 20, createdAt: '2025-11-20T09:00:00', deadline: '2025-11-20T11:00:00', itemsCount: 6, description: 'Trasferimento materiale da A-10 a B-05' },
    { id: '5', taskCode: 'TASK-005', type: 'RECEIVING', priority: 'URGENT', status: 'ASSIGNED', assignedTo: { id: 'OP3', name: 'Anna Verdi', badge: 'AV003' }, zone: 'Banchina 1', estimatedDuration: 60, createdAt: '2025-11-20T09:15:00', assignedAt: '2025-11-20T09:20:00', deadline: '2025-11-20T11:00:00', itemsCount: 45, description: 'Ricezione merce fornitore XYZ' },
    { id: '6', taskCode: 'TASK-006', type: 'SHIPPING', priority: 'MEDIUM', status: 'COMPLETED', assignedTo: { id: 'OP1', name: 'Mario Rossi', badge: 'MR001' }, zone: 'Banchina 2', estimatedDuration: 25, actualDuration: 22, createdAt: '2025-11-20T07:00:00', assignedAt: '2025-11-20T07:05:00', startedAt: '2025-11-20T07:10:00', completedAt: '2025-11-20T07:32:00', itemsCount: 15, description: 'Carico spedizione ordine 5678' },
    { id: '7', taskCode: 'TASK-007', type: 'QUALITY_CHECK', priority: 'HIGH', status: 'BLOCKED', assignedTo: { id: 'OP4', name: 'Paolo Neri', badge: 'PN004' }, zone: 'QC Area', estimatedDuration: 40, createdAt: '2025-11-20T08:45:00', assignedAt: '2025-11-20T08:50:00', startedAt: '2025-11-20T09:00:00', itemsCount: 10, description: 'Controllo qualità lotto ABC-789', notes: 'In attesa approvazione supervisore' }
  ];

  const mockOperators: Operator[] = [
    { id: 'OP1', name: 'Mario Rossi', badge: 'MR001', status: 'AVAILABLE', skillLevel: 'EXPERT', zone: 'Zona A', tasksCompletedToday: 8, averageCompletionTime: 18, efficiency: 95 },
    { id: 'OP2', name: 'Luigi Bianchi', badge: 'LB002', status: 'BUSY', currentTask: 'TASK-003', skillLevel: 'ADVANCED', zone: 'Zona C', tasksCompletedToday: 6, averageCompletionTime: 22, efficiency: 88 },
    { id: 'OP3', name: 'Anna Verdi', badge: 'AV003', status: 'BUSY', currentTask: 'TASK-005', skillLevel: 'INTERMEDIATE', zone: 'Banchina 1', tasksCompletedToday: 4, averageCompletionTime: 28, efficiency: 82 },
    { id: 'OP4', name: 'Paolo Neri', badge: 'PN004', status: 'BUSY', currentTask: 'TASK-007', skillLevel: 'EXPERT', zone: 'QC Area', tasksCompletedToday: 5, averageCompletionTime: 20, efficiency: 92 },
    { id: 'OP5', name: 'Giulia Gialli', badge: 'GG005', status: 'AVAILABLE', skillLevel: 'ADVANCED', zone: 'Zona B', tasksCompletedToday: 7, averageCompletionTime: 19, efficiency: 90 },
    { id: 'OP6', name: 'Marco Blu', badge: 'MB006', status: 'BREAK', skillLevel: 'BEGINNER', zone: 'Zona A', tasksCompletedToday: 3, averageCompletionTime: 35, efficiency: 70 }
  ];

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch = task.taskCode.toLowerCase().includes(searchTerm.toLowerCase()) || task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || task.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const stats = {
    total: mockTasks.length,
    pending: mockTasks.filter(t => t.status === 'PENDING').length,
    assigned: mockTasks.filter(t => t.status === 'ASSIGNED').length,
    inProgress: mockTasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: mockTasks.filter(t => t.status === 'COMPLETED').length,
    operatorsAvailable: mockOperators.filter(o => o.status === 'AVAILABLE').length,
    operatorsBusy: mockOperators.filter(o => o.status === 'BUSY').length
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const config = { URGENT: { label: 'Urgente', variant: 'danger' as const }, HIGH: { label: 'Alta', variant: 'warning' as const }, MEDIUM: { label: 'Media', variant: 'info' as const }, LOW: { label: 'Bassa', variant: 'secondary' as const } };
    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

  const getStatusBadge = (status: Task['status']) => {
    const config = { PENDING: { label: 'In Attesa', variant: 'secondary' as const }, ASSIGNED: { label: 'Assegnato', variant: 'info' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, BLOCKED: { label: 'Bloccato', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: Task['type']) => {
    const labels = { PICKING: 'Prelievo', REFILLING: 'Stoccaggio', INVENTORY: 'Inventario', TRANSFER: 'Trasferimento', RECEIVING: 'Ricevimento', SHIPPING: 'Spedizione', QUALITY_CHECK: 'Controllo Qualità' };
    return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">{labels[type]}</span>;
  };

  const getOperatorStatusBadge = (status: Operator['status']) => {
    const config = { AVAILABLE: { label: 'Disponibile', variant: 'success' as const }, BUSY: { label: 'Occupato', variant: 'warning' as const }, BREAK: { label: 'Pausa', variant: 'info' as const }, OFFLINE: { label: 'Offline', variant: 'secondary' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getSkillBadge = (skill: Operator['skillLevel']) => {
    const config = { BEGINNER: 'bg-gray-100 text-gray-800', INTERMEDIATE: 'bg-blue-100 text-blue-800', ADVANCED: 'bg-purple-100 text-purple-800', EXPERT: 'bg-green-100 text-green-800' };
    const labels = { BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzato', EXPERT: 'Esperto' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[skill]}`}>{labels[skill]}</span>;
  };

  const handleAssignTask = () => {
    if (selectedTask && selectedOperator) {
      console.log(`Assegnazione task ${selectedTask.taskCode} a operatore ${selectedOperator}`);
      setShowAssignModal(false);
      setSelectedTask(null);
      setSelectedOperator('');
    }
  };

  const taskColumns = [
    { key: 'taskCode', label: 'Codice', render: (row: Task) => <div className="font-medium font-mono text-sm">{row.taskCode}</div> },
    { key: 'type', label: 'Tipo', render: (row: Task) => getTypeBadge(row.type) },
    { key: 'priority', label: 'Priorità', render: (row: Task) => getPriorityBadge(row.priority) },
    { key: 'status', label: 'Stato', render: (row: Task) => getStatusBadge(row.status) },
    { key: 'description', label: 'Descrizione', render: (row: Task) => <div><div className="font-medium">{row.description}</div><div className="text-sm text-gray-600">{row.zone} • {row.itemsCount} articoli • {row.estimatedDuration} min</div></div> },
    { key: 'assignedTo', label: 'Assegnato A', render: (row: Task) => row.assignedTo ? <div className="text-sm"><div className="font-medium">{row.assignedTo.name}</div><div className="text-gray-600">{row.assignedTo.badge}</div></div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'deadline', label: 'Scadenza', render: (row: Task) => row.deadline ? <div className="text-sm">{new Date(row.deadline).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'actions', label: 'Azioni', render: (row: Task) => <div className="flex gap-2">{row.status === 'PENDING' && <Button variant="primary" size="sm" onClick={() => { setSelectedTask(row); setShowAssignModal(true); }}>Assegna</Button>}{(row.status === 'ASSIGNED' || row.status === 'IN_PROGRESS') && <Button variant="secondary" size="sm" onClick={() => console.log('Riassegna')}>Riassegna</Button>}</div> }
  ];

  const operatorColumns = [
    { key: 'badge', label: 'Badge', render: (row: Operator) => <div className="font-medium font-mono text-sm">{row.badge}</div> },
    { key: 'name', label: 'Nome', render: (row: Operator) => <div className="font-medium">{row.name}</div> },
    { key: 'status', label: 'Stato', render: (row: Operator) => getOperatorStatusBadge(row.status) },
    { key: 'skill', label: 'Livello', render: (row: Operator) => getSkillBadge(row.skillLevel) },
    { key: 'zone', label: 'Zona', render: (row: Operator) => <div className="text-sm">{row.zone}</div> },
    { key: 'currentTask', label: 'Task Corrente', render: (row: Operator) => row.currentTask ? <div className="font-mono text-sm text-blue-600">{row.currentTask}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'stats', label: 'Statistiche Oggi', render: (row: Operator) => <div className="text-sm"><div>{row.tasksCompletedToday} task completati</div><div className="text-gray-600">Tempo medio: {row.averageCompletionTime} min</div><div className="text-gray-600">Efficienza: {row.efficiency}%</div></div> },
    { key: 'actions', label: 'Azioni', render: (row: Operator) => <Button variant="secondary" size="sm" onClick={() => console.log('Dettaglio operatore')}>Dettaglio</Button> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Assegnazione Task</h1><p className="mt-2 text-gray-600">Gestisci assegnazioni e monitora operatori</p></div>
        <div className="flex gap-3">
          <Button variant={view === 'TASKS' ? 'primary' : 'secondary'} onClick={() => setView('TASKS')}>Vista Task</Button>
          <Button variant={view === 'OPERATORS' ? 'primary' : 'secondary'} onClick={() => setView('OPERATORS')}>Vista Operatori</Button>
          <Button variant="primary" onClick={() => console.log('Auto-assegna')}>Auto-Assegna</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Task Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">In Attesa</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Assegnati</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.assigned}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Corso</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completati</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Operatori Liberi</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.operatorsAvailable}</div></Card>
        <Card className="p-4 border-orange-200 bg-orange-50"><div className="text-sm font-medium text-orange-700">Operatori Occupati</div><div className="text-2xl font-bold text-orange-600 mt-1">{stats.operatorsBusy}</div></Card>
      </div>

      {view === 'TASKS' && (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per codice, descrizione..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PICKING">Prelievo</option><option value="REFILLING">Stoccaggio</option><option value="INVENTORY">Inventario</option><option value="TRANSFER">Trasferimento</option><option value="RECEIVING">Ricevimento</option><option value="SHIPPING">Spedizione</option><option value="QUALITY_CHECK">Controllo Qualità</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PENDING">In Attesa</option><option value="ASSIGNED">Assegnato</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="BLOCKED">Bloccato</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutte</option><option value="URGENT">Urgente</option><option value="HIGH">Alta</option><option value="MEDIUM">Media</option><option value="LOW">Bassa</option></select></div>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Task ({filteredTasks.length})</h2></div>
            <Table columns={taskColumns} data={filteredTasks} keyExtractor={(row) => row.id} />
          </Card>
        </>
      )}

      {view === 'OPERATORS' && (
        <Card>
          <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Operatori ({mockOperators.length})</h2></div>
          <Table columns={operatorColumns} data={mockOperators} keyExtractor={(row) => row.id} />
        </Card>
      )}

      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">Assegna Task</h2><p className="text-gray-600 mt-1">{selectedTask.taskCode} - {selectedTask.description}</p></div>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Dettagli Task</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedTask.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Priorità</div><div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div></div>
                  <div><div className="text-sm text-gray-600">Zona</div><div className="font-medium">{selectedTask.zone}</div></div>
                  <div><div className="text-sm text-gray-600">Durata Stimata</div><div className="font-medium">{selectedTask.estimatedDuration} minuti</div></div>
                  <div><div className="text-sm text-gray-600">Articoli</div><div className="font-medium">{selectedTask.itemsCount}</div></div>
                  {selectedTask.deadline && <div><div className="text-sm text-gray-600">Scadenza</div><div className="font-medium">{new Date(selectedTask.deadline).toLocaleString('it-IT')}</div></div>}
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleziona Operatore</label>
                <div className="space-y-2">
                  {mockOperators.filter(op => op.status === 'AVAILABLE' || op.status === 'BUSY').map(operator => (
                    <div key={operator.id} className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOperator === operator.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${operator.status !== 'AVAILABLE' ? 'opacity-60' : ''}`} onClick={() => operator.status === 'AVAILABLE' && setSelectedOperator(operator.id)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{operator.name}</div>
                            <div className="font-mono text-sm text-gray-600">{operator.badge}</div>
                            {getOperatorStatusBadge(operator.status)}
                            {getSkillBadge(operator.skillLevel)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{operator.zone} • {operator.tasksCompletedToday} task oggi • Efficienza: {operator.efficiency}%</div>
                          {operator.currentTask && <div className="text-sm text-orange-600 mt-1">Task corrente: {operator.currentTask}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Annulla</Button>
                <Button variant="primary" onClick={handleAssignTask} disabled={!selectedOperator}>Assegna Task</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAssignmentPage;

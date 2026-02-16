import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Wave {
  id: string;
  waveNumber: string;
  status: 'PLANNING' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  type: 'SINGLE_ORDER' | 'BATCH' | 'CLUSTER' | 'ZONE' | 'WAVE';
  ordersCount: number;
  linesCount: number;
  unitsCount: number;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  assignedOperators: number;
  targetOperators: number;
  zones: string[];
  scheduledTime?: string;
  releaseTime?: string;
  startTime?: string;
  completionTime?: string;
  efficiency?: number;
  pickPath?: string;
}

const WavePlanningPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  const mockWaves: Wave[] = [
    { id: '1', waveNumber: 'WAVE-001', status: 'PLANNING', priority: 'URGENT', type: 'BATCH', ordersCount: 25, linesCount: 150, unitsCount: 450, estimatedDuration: 120, assignedOperators: 0, targetOperators: 5, zones: ['Zona A', 'Zona B'], scheduledTime: '2025-11-20T14:00:00', pickPath: 'OPTIMIZED' },
    { id: '2', waveNumber: 'WAVE-002', status: 'RELEASED', priority: 'HIGH', type: 'ZONE', ordersCount: 40, linesCount: 220, unitsCount: 680, estimatedDuration: 150, assignedOperators: 6, targetOperators: 6, zones: ['Zona A'], scheduledTime: '2025-11-20T10:00:00', releaseTime: '2025-11-20T10:00:00', pickPath: 'S_SHAPE' },
    { id: '3', waveNumber: 'WAVE-003', status: 'IN_PROGRESS', priority: 'NORMAL', type: 'CLUSTER', ordersCount: 15, linesCount: 95, unitsCount: 285, estimatedDuration: 90, actualDuration: 45, assignedOperators: 4, targetOperators: 4, zones: ['Zona B', 'Zona C'], scheduledTime: '2025-11-20T08:00:00', releaseTime: '2025-11-20T08:00:00', startTime: '2025-11-20T08:05:00', pickPath: 'LARGEST_GAP' },
    { id: '4', waveNumber: 'WAVE-004', status: 'COMPLETED', priority: 'NORMAL', type: 'WAVE', ordersCount: 50, linesCount: 300, unitsCount: 900, estimatedDuration: 180, actualDuration: 165, assignedOperators: 8, targetOperators: 8, zones: ['Zona A', 'Zona B', 'Zona C'], scheduledTime: '2025-11-19T14:00:00', releaseTime: '2025-11-19T14:00:00', startTime: '2025-11-19T14:05:00', completionTime: '2025-11-19T16:50:00', efficiency: 109, pickPath: 'OPTIMIZED' },
    { id: '5', waveNumber: 'WAVE-005', status: 'PLANNING', priority: 'LOW', type: 'SINGLE_ORDER', ordersCount: 5, linesCount: 30, unitsCount: 90, estimatedDuration: 45, assignedOperators: 0, targetOperators: 2, zones: ['Zona C'], scheduledTime: '2025-11-20T16:00:00', pickPath: 'RETURN' },
    { id: '6', waveNumber: 'WAVE-006', status: 'CANCELLED', priority: 'HIGH', type: 'BATCH', ordersCount: 20, linesCount: 120, unitsCount: 360, estimatedDuration: 100, assignedOperators: 0, targetOperators: 4, zones: ['Zona A', 'Zona B'], scheduledTime: '2025-11-20T12:00:00' }
  ];

  const filteredWaves = mockWaves.filter((wave) => {
    const matchesSearch = wave.waveNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || wave.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || wave.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: mockWaves.length,
    planning: mockWaves.filter(w => w.status === 'PLANNING').length,
    released: mockWaves.filter(w => w.status === 'RELEASED').length,
    inProgress: mockWaves.filter(w => w.status === 'IN_PROGRESS').length,
    completed: mockWaves.filter(w => w.status === 'COMPLETED').length,
    totalOrders: mockWaves.filter(w => w.status !== 'CANCELLED').reduce((sum, w) => sum + w.ordersCount, 0),
    avgEfficiency: mockWaves.filter(w => w.efficiency).reduce((sum, w, _, arr) => sum + (w.efficiency || 0) / arr.length, 0)
  };

  const getStatusBadge = (status: Wave['status']) => {
    const config = { PLANNING: { label: 'Pianificazione', variant: 'secondary' as const }, RELEASED: { label: 'Rilasciato', variant: 'info' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, CANCELLED: { label: 'Annullato', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getPriorityBadge = (priority: Wave['priority']) => {
    const config = { URGENT: { label: 'Urgente', variant: 'danger' as const }, HIGH: { label: 'Alta', variant: 'warning' as const }, NORMAL: { label: 'Normale', variant: 'info' as const }, LOW: { label: 'Bassa', variant: 'secondary' as const } };
    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

  const getTypeBadge = (type: Wave['type']) => {
    const labels = { SINGLE_ORDER: 'Ordine Singolo', BATCH: 'Batch', CLUSTER: 'Cluster', ZONE: 'Zona', WAVE: 'Wave' };
    const colors = { SINGLE_ORDER: 'bg-gray-100 text-gray-800', BATCH: 'bg-blue-100 text-blue-800', CLUSTER: 'bg-purple-100 text-purple-800', ZONE: 'bg-green-100 text-green-800', WAVE: 'bg-orange-100 text-orange-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[type]}`}>{labels[type]}</span>;
  };

  const columns = [
    { key: 'waveNumber', label: 'Numero Wave', render: (row: Wave) => <div className="font-medium font-mono text-sm">{row.waveNumber}</div> },
    { key: 'type', label: 'Tipo', render: (row: Wave) => getTypeBadge(row.type) },
    { key: 'priority', label: 'Priorità', render: (row: Wave) => getPriorityBadge(row.priority) },
    { key: 'status', label: 'Stato', render: (row: Wave) => getStatusBadge(row.status) },
    { key: 'orders', label: 'Ordini', render: (row: Wave) => <div className="text-sm"><div className="font-medium">{row.ordersCount} ordini</div><div className="text-gray-600">{row.linesCount} righe • {row.unitsCount} unità</div></div> },
    { key: 'zones', label: 'Zone', render: (row: Wave) => <div className="flex flex-wrap gap-1">{row.zones.map((zone, idx) => <Badge key={idx} variant="info">{zone}</Badge>)}</div> },
    { key: 'operators', label: 'Operatori', render: (row: Wave) => <div className="text-sm"><span className={row.assignedOperators >= row.targetOperators ? 'text-green-600' : 'text-orange-600'}>{row.assignedOperators}</span>/{row.targetOperators}</div> },
    { key: 'duration', label: 'Durata', render: (row: Wave) => <div className="text-sm">{row.actualDuration ? <div><div className="font-medium">{row.actualDuration} min</div><div className="text-gray-600">Est: {row.estimatedDuration} min</div></div> : <div className="font-medium">{row.estimatedDuration} min</div>}</div> },
    { key: 'scheduled', label: 'Programmato', render: (row: Wave) => row.scheduledTime ? <div className="text-sm">{new Date(row.scheduledTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'actions', label: 'Azioni', render: (row: Wave) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedWave(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'PLANNING' && <Button variant="primary" size="sm" onClick={() => console.log('Rilascia')}>Rilascia</Button>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Pianificazione Wave</h1><p className="mt-2 text-gray-600">Gestisci ondate di prelievo e ottimizza picking</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Auto-pianifica')}>Auto-Pianifica</Button>
          <Button variant="primary" onClick={() => setShowPlanningModal(true)}>Crea Nuova Wave</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Wave Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">Pianificazione</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.planning}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Rilasciate</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.released}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Corso</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completate</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Ordini Totali</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalOrders}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Efficienza Media</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.avgEfficiency.toFixed(0)}%</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per numero wave..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PLANNING">Pianificazione</option><option value="RELEASED">Rilasciato</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="CANCELLED">Annullato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="SINGLE_ORDER">Ordine Singolo</option><option value="BATCH">Batch</option><option value="CLUSTER">Cluster</option><option value="ZONE">Zona</option><option value="WAVE">Wave</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Wave ({filteredWaves.length})</h2></div>
        <Table columns={columns} data={filteredWaves} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedWave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedWave.waveNumber}</h2><p className="text-gray-600 mt-1">{getTypeBadge(selectedWave.type)}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Wave</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedWave.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Priorità</div><div className="mt-1">{getPriorityBadge(selectedWave.priority)}</div></div>
                  <div><div className="text-sm text-gray-600">Ordini</div><div className="font-medium text-lg">{selectedWave.ordersCount}</div></div>
                  <div><div className="text-sm text-gray-600">Righe</div><div className="font-medium text-lg">{selectedWave.linesCount}</div></div>
                  <div><div className="text-sm text-gray-600">Unità Totali</div><div className="font-medium text-lg">{selectedWave.unitsCount}</div></div>
                  <div><div className="text-sm text-gray-600">Operatori</div><div className="font-medium text-lg">{selectedWave.assignedOperators}/{selectedWave.targetOperators}</div></div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Zone Coinvolte</h3>
                <div className="flex flex-wrap gap-2">{selectedWave.zones.map((zone, idx) => <Badge key={idx} variant="info">{zone}</Badge>)}</div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Tempistiche</h3>
                <div className="space-y-3">
                  {selectedWave.scheduledTime && <div><div className="text-sm text-gray-600">Programmato</div><div className="font-medium">{new Date(selectedWave.scheduledTime).toLocaleString('it-IT')}</div></div>}
                  {selectedWave.releaseTime && <div><div className="text-sm text-gray-600">Rilasciato</div><div className="font-medium">{new Date(selectedWave.releaseTime).toLocaleString('it-IT')}</div></div>}
                  {selectedWave.startTime && <div><div className="text-sm text-gray-600">Iniziato</div><div className="font-medium">{new Date(selectedWave.startTime).toLocaleString('it-IT')}</div></div>}
                  {selectedWave.completionTime && <div><div className="text-sm text-gray-600">Completato</div><div className="font-medium">{new Date(selectedWave.completionTime).toLocaleString('it-IT')}</div></div>}
                  <div className="pt-3 border-t"><div className="text-sm text-gray-600">Durata Stimata</div><div className="font-medium">{selectedWave.estimatedDuration} minuti</div></div>
                  {selectedWave.actualDuration && <div><div className="text-sm text-gray-600">Durata Effettiva</div><div className="font-medium">{selectedWave.actualDuration} minuti</div></div>}
                </div>
              </Card>

              {selectedWave.efficiency && (
                <Card className="p-4 border-green-200 bg-green-50">
                  <h3 className="text-lg font-semibold mb-3 text-green-800">Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-green-700">Efficienza</span><span className="font-bold text-green-900 text-xl">{selectedWave.efficiency}%</span></div>
                    <div className="w-full bg-green-200 rounded-full h-3"><div className="bg-green-600 h-3 rounded-full" style={{ width: `${Math.min(selectedWave.efficiency, 100)}%` }} /></div>
                  </div>
                </Card>
              )}

              {selectedWave.pickPath && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Strategia Picking</h3>
                  <div className="font-medium">{selectedWave.pickPath === 'OPTIMIZED' ? 'Percorso Ottimizzato' : selectedWave.pickPath === 'S_SHAPE' ? 'S-Shape' : selectedWave.pickPath === 'LARGEST_GAP' ? 'Largest Gap' : 'Return'}</div>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Esporta')}>Esporta Dettagli</Button>
                {selectedWave.status === 'PLANNING' && <><Button variant="danger" onClick={() => console.log('Cancella')}>Cancella</Button><Button variant="primary" onClick={() => console.log('Rilascia')}>Rilascia Wave</Button></>}
                {selectedWave.status === 'RELEASED' && <Button variant="primary" onClick={() => console.log('Assegna operatori')}>Assegna Operatori</Button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">Crea Nuova Wave</h2><p className="text-gray-600 mt-1">Configura parametri per la nuova wave</p></div>
                <button onClick={() => setShowPlanningModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo Wave</label><select className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="BATCH">Batch</option><option value="CLUSTER">Cluster</option><option value="ZONE">Zona</option><option value="WAVE">Wave</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label><select className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="URGENT">Urgente</option><option value="HIGH">Alta</option><option value="NORMAL">Normale</option><option value="LOW">Bassa</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Zone</label><div className="space-y-2"><label className="flex items-center gap-2"><input type="checkbox" className="rounded" />Zona A</label><label className="flex items-center gap-2"><input type="checkbox" className="rounded" />Zona B</label><label className="flex items-center gap-2"><input type="checkbox" className="rounded" />Zona C</label></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Orario Programmato</label><input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Operatori Target</label><input type="number" min="1" placeholder="Numero operatori necessari" className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => setShowPlanningModal(false)}>Annulla</Button>
                <Button variant="primary" onClick={() => { console.log('Crea wave'); setShowPlanningModal(false); }}>Crea Wave</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WavePlanningPage;

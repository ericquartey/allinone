import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface CycleCount {
  id: string;
  countNumber: string;
  type: 'ABC' | 'RANDOM' | 'ZONE' | 'PRODUCT';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  plannedDate: string;
  startDate?: string;
  completedDate?: string;
  zone?: string;
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  operator?: string;
  notes?: string;
}

const CycleCountPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedCount, setSelectedCount] = useState<CycleCount | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockCounts: CycleCount[] = [
    { id: '1', countNumber: 'CC-2025-001', type: 'ABC', status: 'IN_PROGRESS', priority: 1, plannedDate: '2025-11-20', startDate: '2025-11-20', zone: 'ZONA-A', totalItems: 250, countedItems: 180, discrepancies: 12, operator: 'M.Rossi', notes: 'Conteggio classe A - alta priorità' },
    { id: '2', countNumber: 'CC-2025-002', type: 'ZONE', status: 'PLANNED', priority: 2, plannedDate: '2025-11-21', zone: 'ZONA-B', totalItems: 450, countedItems: 0, discrepancies: 0, notes: '' },
    { id: '3', countNumber: 'CC-2025-003', type: 'RANDOM', status: 'COMPLETED', priority: 3, plannedDate: '2025-11-18', startDate: '2025-11-18', completedDate: '2025-11-18', totalItems: 120, countedItems: 120, discrepancies: 5, operator: 'G.Bianchi' },
    { id: '4', countNumber: 'CC-2025-004', type: 'PRODUCT', status: 'IN_PROGRESS', priority: 1, plannedDate: '2025-11-20', startDate: '2025-11-20', totalItems: 80, countedItems: 45, discrepancies: 3, operator: 'A.Verdi', notes: 'Verifica prodotti specifici' },
    { id: '5', countNumber: 'CC-2025-005', type: 'ABC', status: 'PLANNED', priority: 2, plannedDate: '2025-11-22', zone: 'ZONA-C', totalItems: 300, countedItems: 0, discrepancies: 0 }
  ];

  const stats = {
    total: mockCounts.length,
    planned: mockCounts.filter(c => c.status === 'PLANNED').length,
    inProgress: mockCounts.filter(c => c.status === 'IN_PROGRESS').length,
    completed: mockCounts.filter(c => c.status === 'COMPLETED').length,
    totalDiscrepancies: mockCounts.reduce((sum, c) => sum + c.discrepancies, 0)
  };

  const filteredCounts = mockCounts.filter((count) => {
    const matchesSearch = count.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (count.zone && count.zone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || count.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || count.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: CycleCount['status']) => {
    const config = { PLANNED: { label: 'Pianificato', variant: 'secondary' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, CANCELLED: { label: 'Annullato', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: CycleCount['type']) => {
    const config = { ABC: { label: 'ABC Class', color: 'bg-purple-100 text-purple-800' }, RANDOM: { label: 'Random', color: 'bg-blue-100 text-blue-800' }, ZONE: { label: 'Per Zona', color: 'bg-green-100 text-green-800' }, PRODUCT: { label: 'Per Prodotto', color: 'bg-orange-100 text-orange-800' } };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[type].color}`}>{config[type].label}</span>;
  };

  const columns = [
    { key: 'countNumber', label: 'N. Conteggio', render: (row: CycleCount) => <div><div className="font-medium">{row.countNumber}</div><div className="text-xs text-gray-600">{new Date(row.plannedDate).toLocaleDateString('it-IT')}</div></div> },
    { key: 'type', label: 'Tipo', render: (row: CycleCount) => getTypeBadge(row.type) },
    { key: 'zone', label: 'Zona', render: (row: CycleCount) => <div className="text-sm">{row.zone || '-'}</div> },
    { key: 'progress', label: 'Progresso', render: (row: CycleCount) => { const percentage = row.totalItems > 0 ? Math.round((row.countedItems / row.totalItems) * 100) : 0; return (<div className="min-w-[120px]"><div className="flex justify-between text-sm mb-1"><span>{row.countedItems} / {row.totalItems}</span><span className="text-gray-600">{percentage}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${percentage === 100 ? 'bg-green-500' : percentage > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${percentage}%` }} /></div></div>); } },
    { key: 'discrepancies', label: 'Discrepanze', render: (row: CycleCount) => <div>{row.discrepancies > 0 ? <Badge variant="danger">{row.discrepancies}</Badge> : <Badge variant="success">0</Badge>}</div> },
    { key: 'status', label: 'Stato', render: (row: CycleCount) => getStatusBadge(row.status) },
    { key: 'operator', label: 'Operatore', render: (row: CycleCount) => <div className="text-sm">{row.operator || '-'}</div> },
    { key: 'actions', label: 'Azioni', render: (row: CycleCount) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedCount(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'PLANNED' && <Button variant="primary" size="sm" onClick={() => console.log('Start', row.id)}>Avvia</Button>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Conteggio Ciclico</h1><p className="mt-2 text-gray-600">Gestisci conteggi ciclici e discrepanze inventario</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta')}>Esporta</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo conteggio')}>Nuovo Conteggio</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Totale Conteggi</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Pianificati</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.planned}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Corso</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completati</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">Discrepanze Totali</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.totalDiscrepancies}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per numero, zona..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PLANNED">Pianificato</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="CANCELLED">Annullato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="ABC">ABC Class</option><option value="RANDOM">Random</option><option value="ZONE">Per Zona</option><option value="PRODUCT">Per Prodotto</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Conteggi Ciclici ({filteredCounts.length})</h2></div>
        <Table columns={columns} data={filteredCounts} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">Conteggio {selectedCount.countNumber}</h2><p className="text-gray-600 mt-1">Zona: {selectedCount.zone || 'N/A'}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Conteggio</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedCount.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedCount.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Data Pianificata</div><div className="font-medium">{new Date(selectedCount.plannedDate).toLocaleDateString('it-IT')}</div></div>
                  {selectedCount.startDate && <div><div className="text-sm text-gray-600">Data Inizio</div><div className="font-medium">{new Date(selectedCount.startDate).toLocaleDateString('it-IT')}</div></div>}
                  {selectedCount.completedDate && <div><div className="text-sm text-gray-600">Data Completamento</div><div className="font-medium text-green-600">{new Date(selectedCount.completedDate).toLocaleDateString('it-IT')}</div></div>}
                  <div><div className="text-sm text-gray-600">Articoli Totali</div><div className="font-medium">{selectedCount.totalItems}</div></div>
                  <div><div className="text-sm text-gray-600">Articoli Contati</div><div className="font-medium text-blue-600">{selectedCount.countedItems}</div></div>
                  <div><div className="text-sm text-gray-600">Discrepanze</div><div className={`font-medium ${selectedCount.discrepancies > 0 ? 'text-red-600' : 'text-green-600'}`}>{selectedCount.discrepancies}</div></div>
                  {selectedCount.operator && <div><div className="text-sm text-gray-600">Operatore</div><div className="font-medium">{selectedCount.operator}</div></div>}
                </div>
                {selectedCount.notes && <div className="mt-4 pt-4 border-t border-gray-200"><div className="text-sm text-gray-600">Note</div><div className="mt-1 text-gray-900">{selectedCount.notes}</div></div>}
              </Card>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('Export')}>Esporta Report</Button>
                {selectedCount.status === 'PLANNED' && <Button variant="primary" onClick={() => console.log('Start')}>Avvia Conteggio</Button>}
                {selectedCount.status === 'IN_PROGRESS' && <Button variant="success" onClick={() => console.log('Complete')}>Completa Conteggio</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleCountPage;

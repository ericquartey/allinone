import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface SlottingRecommendation {
  id: string;
  productCode: string;
  productName: string;
  currentLocation: string;
  recommendedLocation: string;
  reason: 'HIGH_VELOCITY' | 'SEASONAL' | 'WEIGHT' | 'FAMILY_GROUPING' | 'SPACE_UTILIZATION' | 'CROSS_DOCK';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  currentZone: string;
  recommendedZone: string;
  pickFrequency: number;
  estimatedSavings: number; // in seconds per pick
  quantity: number;
  weight: number;
  dimensions: string;
  score: number; // 0-100
}

interface SlottingAnalysis {
  totalProducts: number;
  needsOptimization: number;
  avgPickDistance: number;
  potentialSavings: number; // hours per week
  zoneEfficiency: { [key: string]: number };
  velocityDistribution: { fast: number; medium: number; slow: number };
}

const SlottingOptimizationPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [selectedRecommendation, setSelectedRecommendation] = useState<SlottingRecommendation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockRecommendations: SlottingRecommendation[] = [
    { id: '1', productCode: 'PROD-001', productName: 'Widget Fast Mover', currentLocation: 'C-15-04', recommendedLocation: 'A-02-01', reason: 'HIGH_VELOCITY', priority: 'CRITICAL', status: 'PENDING', currentZone: 'Zona C', recommendedZone: 'Zona A', pickFrequency: 45, estimatedSavings: 25, quantity: 500, weight: 2.5, dimensions: '30x20x10', score: 95 },
    { id: '2', productCode: 'PROD-002', productName: 'Heavy Component', currentLocation: 'A-12-05', recommendedLocation: 'A-01-01', reason: 'WEIGHT', priority: 'HIGH', status: 'PENDING', currentZone: 'Zona A', recommendedZone: 'Zona A', pickFrequency: 20, estimatedSavings: 15, quantity: 100, weight: 25.0, dimensions: '50x40x30', score: 88 },
    { id: '3', productCode: 'PROD-003', productName: 'Seasonal Item Winter', currentLocation: 'B-08-03', recommendedLocation: 'C-20-05', reason: 'SEASONAL', priority: 'MEDIUM', status: 'APPROVED', currentZone: 'Zona B', recommendedZone: 'Zona C', pickFrequency: 5, estimatedSavings: 8, quantity: 200, weight: 1.2, dimensions: '25x15x10', score: 72 },
    { id: '4', productCode: 'PROD-004', productName: 'Related Product A', currentLocation: 'C-10-02', recommendedLocation: 'B-05-03', reason: 'FAMILY_GROUPING', priority: 'MEDIUM', status: 'PENDING', currentZone: 'Zona C', recommendedZone: 'Zona B', pickFrequency: 30, estimatedSavings: 12, quantity: 300, weight: 3.0, dimensions: '35x25x15', score: 80 },
    { id: '5', productCode: 'PROD-005', productName: 'Small Parts Box', currentLocation: 'A-15-04', recommendedLocation: 'B-12-02', reason: 'SPACE_UTILIZATION', priority: 'LOW', status: 'IN_PROGRESS', currentZone: 'Zona A', recommendedZone: 'Zona B', pickFrequency: 15, estimatedSavings: 5, quantity: 1000, weight: 0.5, dimensions: '15x10x8', score: 65 },
    { id: '6', productCode: 'PROD-006', productName: 'Cross-Dock Item', currentLocation: 'B-20-01', recommendedLocation: 'DOCK-01', reason: 'CROSS_DOCK', priority: 'HIGH', status: 'COMPLETED', currentZone: 'Zona B', recommendedZone: 'Cross-Dock', pickFrequency: 50, estimatedSavings: 30, quantity: 150, weight: 5.0, dimensions: '40x30x20', score: 92 },
    { id: '7', productCode: 'PROD-007', productName: 'Popular Item', currentLocation: 'C-18-05', recommendedLocation: 'A-05-02', reason: 'HIGH_VELOCITY', priority: 'CRITICAL', status: 'REJECTED', currentZone: 'Zona C', recommendedZone: 'Zona A', pickFrequency: 55, estimatedSavings: 28, quantity: 400, weight: 1.8, dimensions: '28x18x12', score: 97 }
  ];

  const mockAnalysis: SlottingAnalysis = {
    totalProducts: 2500,
    needsOptimization: 450,
    avgPickDistance: 125, // meters
    potentialSavings: 18.5,
    zoneEfficiency: { 'Zona A': 92, 'Zona B': 78, 'Zona C': 65, 'Cross-Dock': 88 },
    velocityDistribution: { fast: 320, medium: 1200, slow: 980 }
  };

  const filteredRecommendations = mockRecommendations.filter((rec) => {
    const matchesSearch = rec.productCode.toLowerCase().includes(searchTerm.toLowerCase()) || rec.productName.toLowerCase().includes(searchTerm.toLowerCase()) || rec.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || rec.priority === priorityFilter;
    const matchesReason = reasonFilter === 'ALL' || rec.reason === reasonFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesReason;
  });

  const stats = {
    total: mockRecommendations.length,
    pending: mockRecommendations.filter(r => r.status === 'PENDING').length,
    approved: mockRecommendations.filter(r => r.status === 'APPROVED').length,
    inProgress: mockRecommendations.filter(r => r.status === 'IN_PROGRESS').length,
    completed: mockRecommendations.filter(r => r.status === 'COMPLETED').length,
    totalSavings: mockRecommendations.filter(r => r.status !== 'REJECTED').reduce((sum, r) => sum + r.estimatedSavings, 0)
  };

  const getPriorityBadge = (priority: SlottingRecommendation['priority']) => {
    const config = { CRITICAL: { label: 'Critico', variant: 'danger' as const }, HIGH: { label: 'Alta', variant: 'warning' as const }, MEDIUM: { label: 'Media', variant: 'info' as const }, LOW: { label: 'Bassa', variant: 'secondary' as const } };
    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

  const getStatusBadge = (status: SlottingRecommendation['status']) => {
    const config = { PENDING: { label: 'In Attesa', variant: 'secondary' as const }, APPROVED: { label: 'Approvato', variant: 'info' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, REJECTED: { label: 'Rifiutato', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getReasonBadge = (reason: SlottingRecommendation['reason']) => {
    const labels = { HIGH_VELOCITY: 'Alta Velocità', SEASONAL: 'Stagionale', WEIGHT: 'Peso', FAMILY_GROUPING: 'Raggruppamento', SPACE_UTILIZATION: 'Utilizzo Spazio', CROSS_DOCK: 'Cross-Dock' };
    const colors = { HIGH_VELOCITY: 'bg-red-100 text-red-800', SEASONAL: 'bg-blue-100 text-blue-800', WEIGHT: 'bg-orange-100 text-orange-800', FAMILY_GROUPING: 'bg-purple-100 text-purple-800', SPACE_UTILIZATION: 'bg-green-100 text-green-800', CROSS_DOCK: 'bg-yellow-100 text-yellow-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[reason]}`}>{labels[reason]}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const columns = [
    { key: 'productCode', label: 'Codice', render: (row: SlottingRecommendation) => <div className="font-medium font-mono text-sm">{row.productCode}</div> },
    { key: 'product', label: 'Prodotto', render: (row: SlottingRecommendation) => <div><div className="font-medium">{row.productName}</div><div className="text-xs text-gray-600">Freq: {row.pickFrequency}/giorno</div></div> },
    { key: 'current', label: 'Locazione Corrente', render: (row: SlottingRecommendation) => <div className="text-sm"><div className="font-mono">{row.currentLocation}</div><div className="text-gray-600">{row.currentZone}</div></div> },
    { key: 'recommended', label: 'Locazione Consigliata', render: (row: SlottingRecommendation) => <div className="text-sm"><div className="font-mono text-blue-600">{row.recommendedLocation}</div><div className="text-gray-600">{row.recommendedZone}</div></div> },
    { key: 'reason', label: 'Motivo', render: (row: SlottingRecommendation) => getReasonBadge(row.reason) },
    { key: 'priority', label: 'Priorità', render: (row: SlottingRecommendation) => getPriorityBadge(row.priority) },
    { key: 'score', label: 'Score', render: (row: SlottingRecommendation) => <div className={`font-bold text-lg ${getScoreColor(row.score)}`}>{row.score}</div> },
    { key: 'savings', label: 'Risparmio', render: (row: SlottingRecommendation) => <div className="text-sm"><div className="font-medium text-green-600">{row.estimatedSavings}s</div><div className="text-gray-600">per prelievo</div></div> },
    { key: 'status', label: 'Stato', render: (row: SlottingRecommendation) => getStatusBadge(row.status) },
    { key: 'actions', label: 'Azioni', render: (row: SlottingRecommendation) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedRecommendation(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'PENDING' && <><Button variant="success" size="sm" onClick={() => console.log('Approva')}>Approva</Button><Button variant="danger" size="sm" onClick={() => console.log('Rifiuta')}>Rifiuta</Button></>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Ottimizzazione Slotting</h1><p className="mt-2 text-gray-600">Ottimizza allocazione prodotti per efficienza prelievi</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Analizza')}>Ricalcola Analisi</Button>
          <Button variant="primary" onClick={() => console.log('Applica tutti')}>Applica Raccomandazioni</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Raccomandazioni</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">In Attesa</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Approvate</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Corso</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completate</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Risparmio Totale</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.totalSavings}s</div></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Analisi Globale</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Prodotti Totali</span><span className="font-medium">{mockAnalysis.totalProducts}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Necessitano Ottimizzazione</span><span className="font-medium text-orange-600">{mockAnalysis.needsOptimization}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Distanza Media Prelievo</span><span className="font-medium">{mockAnalysis.avgPickDistance}m</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Risparmio Potenziale</span><span className="font-medium text-green-600">{mockAnalysis.potentialSavings}h/settimana</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Efficienza Zone</h3>
          <div className="space-y-3">
            {Object.entries(mockAnalysis.zoneEfficiency).map(([zone, efficiency]) => (
              <div key={zone}><div className="flex justify-between text-sm mb-1"><span>{zone}</span><span className="font-medium">{efficiency}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${efficiency >= 85 ? 'bg-green-500' : efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${efficiency}%` }} /></div></div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Distribuzione Velocità</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">Fast Movers</div><div className="text-2xl font-bold text-red-600 mt-1">{mockAnalysis.velocityDistribution.fast}</div><div className="text-xs text-red-600 mt-1">Alta frequenza</div></Card>
          <Card className="p-3 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Medium Movers</div><div className="text-2xl font-bold text-blue-600 mt-1">{mockAnalysis.velocityDistribution.medium}</div><div className="text-xs text-blue-600 mt-1">Media frequenza</div></Card>
          <Card className="p-3 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">Slow Movers</div><div className="text-2xl font-bold text-gray-600 mt-1">{mockAnalysis.velocityDistribution.slow}</div><div className="text-xs text-gray-600 mt-1">Bassa frequenza</div></Card>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca prodotto, locazione..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PENDING">In Attesa</option><option value="APPROVED">Approvato</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="REJECTED">Rifiutato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutte</option><option value="CRITICAL">Critico</option><option value="HIGH">Alta</option><option value="MEDIUM">Media</option><option value="LOW">Bassa</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label><select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="HIGH_VELOCITY">Alta Velocità</option><option value="SEASONAL">Stagionale</option><option value="WEIGHT">Peso</option><option value="FAMILY_GROUPING">Raggruppamento</option><option value="SPACE_UTILIZATION">Utilizzo Spazio</option><option value="CROSS_DOCK">Cross-Dock</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Raccomandazioni ({filteredRecommendations.length})</h2></div>
        <Table columns={columns} data={filteredRecommendations} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedRecommendation.productName}</h2><p className="text-gray-600 mt-1">{selectedRecommendation.productCode}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Dettagli Raccomandazione</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Priorità</div><div className="mt-1">{getPriorityBadge(selectedRecommendation.priority)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedRecommendation.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Motivo</div><div className="mt-1">{getReasonBadge(selectedRecommendation.reason)}</div></div>
                  <div><div className="text-sm text-gray-600">Score Ottimizzazione</div><div className={`text-2xl font-bold ${getScoreColor(selectedRecommendation.score)}`}>{selectedRecommendation.score}/100</div></div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Locazioni</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Locazione Corrente</div><div className="font-mono text-lg font-medium mt-1">{selectedRecommendation.currentLocation}</div><div className="text-sm text-gray-600">{selectedRecommendation.currentZone}</div></div>
                  <div><div className="text-sm text-gray-600">Locazione Consigliata</div><div className="font-mono text-lg font-medium text-blue-600 mt-1">{selectedRecommendation.recommendedLocation}</div><div className="text-sm text-gray-600">{selectedRecommendation.recommendedZone}</div></div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Metriche Prodotto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Frequenza Prelievo</div><div className="font-medium text-lg">{selectedRecommendation.pickFrequency} prelievi/giorno</div></div>
                  <div><div className="text-sm text-gray-600">Risparmio Stimato</div><div className="font-medium text-lg text-green-600">{selectedRecommendation.estimatedSavings} secondi</div><div className="text-xs text-gray-600">per prelievo</div></div>
                  <div><div className="text-sm text-gray-600">Quantità in Stock</div><div className="font-medium text-lg">{selectedRecommendation.quantity} unità</div></div>
                  <div><div className="text-sm text-gray-600">Peso</div><div className="font-medium text-lg">{selectedRecommendation.weight} kg</div></div>
                  <div className="col-span-2"><div className="text-sm text-gray-600">Dimensioni</div><div className="font-medium text-lg">{selectedRecommendation.dimensions} cm</div></div>
                </div>
              </Card>

              <Card className="p-4 border-blue-200 bg-blue-50">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Impatto Stimato</h3>
                <div className="space-y-2 text-blue-900">
                  <div>• Riduzione distanza percorsa: <span className="font-medium">{(selectedRecommendation.estimatedSavings * 0.8).toFixed(0)}m/settimana</span></div>
                  <div>• Tempo risparmiato: <span className="font-medium">{(selectedRecommendation.estimatedSavings * selectedRecommendation.pickFrequency / 60).toFixed(1)} minuti/giorno</span></div>
                  <div>• Incremento produttività: <span className="font-medium">~{((selectedRecommendation.estimatedSavings / 30) * 100).toFixed(0)}%</span></div>
                </div>
              </Card>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Pianifica')}>Pianifica Spostamento</Button>
                {selectedRecommendation.status === 'PENDING' && <><Button variant="danger" onClick={() => console.log('Rifiuta')}>Rifiuta</Button><Button variant="success" onClick={() => console.log('Approva')}>Approva</Button></>}
                {selectedRecommendation.status === 'APPROVED' && <Button variant="primary" onClick={() => console.log('Esegui')}>Esegui Spostamento</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlottingOptimizationPage;

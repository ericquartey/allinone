import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Batch {
  id: string;
  batchNumber: string;
  lotNumber: string;
  productCode: string;
  productDescription: string;
  status: 'ACTIVE' | 'QUARANTINE' | 'RELEASED' | 'EXPIRED' | 'BLOCKED';
  quantity: number;
  unit: string;
  manufacturingDate: string;
  expiryDate: string;
  receivedDate: string;
  supplier?: string;
  location?: string;
  certificateNumber?: string;
  qualityStatus: 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_TESTED';
  traceabilityCode?: string;
  notes?: string;
}

const BatchManagementPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [qualityFilter, setQualityFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockBatches: Batch[] = [
    { id: '1', batchNumber: 'BATCH-2025-001', lotNumber: 'LOT-A12345', productCode: 'PROD-001', productDescription: 'Prodotto Farmaceutico A', status: 'ACTIVE', quantity: 5000, unit: 'PZ', manufacturingDate: '2025-10-15', expiryDate: '2026-10-15', receivedDate: '2025-10-20', supplier: 'Fornitore Alpha', location: 'ZONA-A-01-01-01', certificateNumber: 'CERT-2025-1001', qualityStatus: 'PASSED', traceabilityCode: 'TRC-A12345' },
    { id: '2', batchNumber: 'BATCH-2025-002', lotNumber: 'LOT-B67890', productCode: 'PROD-002', productDescription: 'Dispositivo Medico B', status: 'QUARANTINE', quantity: 1200, unit: 'PZ', manufacturingDate: '2025-11-01', expiryDate: '2027-11-01', receivedDate: '2025-11-10', supplier: 'Fornitore Beta', location: 'ZONA-Q-01-01-01', certificateNumber: 'CERT-2025-1102', qualityStatus: 'PENDING', traceabilityCode: 'TRC-B67890', notes: 'In attesa certificato di conformità CE' },
    { id: '3', batchNumber: 'BATCH-2024-089', lotNumber: 'LOT-C11223', productCode: 'PROD-003', productDescription: 'Alimento Surgelato C', status: 'EXPIRED', quantity: 800, unit: 'KG', manufacturingDate: '2024-06-01', expiryDate: '2025-11-15', receivedDate: '2024-06-05', supplier: 'Fornitore Gamma', location: 'ZONA-F-02-01-01', qualityStatus: 'NOT_TESTED' },
    { id: '4', batchNumber: 'BATCH-2025-003', lotNumber: 'LOT-D44556', productCode: 'PROD-004', productDescription: 'Componente Elettronico D', status: 'RELEASED', quantity: 10000, unit: 'PZ', manufacturingDate: '2025-09-20', expiryDate: '2030-09-20', receivedDate: '2025-09-25', supplier: 'Fornitore Delta', location: 'ZONA-B-03-02-01', certificateNumber: 'CERT-2025-0920', qualityStatus: 'PASSED', traceabilityCode: 'TRC-D44556' },
    { id: '5', batchNumber: 'BATCH-2025-004', lotNumber: 'LOT-E78901', productCode: 'PROD-005', productDescription: 'Materiale Chimico E', status: 'BLOCKED', quantity: 500, unit: 'L', manufacturingDate: '2025-08-10', expiryDate: '2026-08-10', receivedDate: '2025-08-15', supplier: 'Fornitore Epsilon', location: 'ZONA-C-04-01-01', certificateNumber: 'CERT-2025-0810', qualityStatus: 'FAILED', traceabilityCode: 'TRC-E78901', notes: 'Non conforme - concentrazione fuori specifica' }
  ];

  const today = new Date();
  const getDaysToExpiry = (expiryDate: string) => Math.ceil((new Date(expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const filteredBatches = mockBatches.filter((batch) => {
    const matchesSearch = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) || batch.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) || batch.productCode.toLowerCase().includes(searchTerm.toLowerCase()) || batch.productDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || batch.status === statusFilter;
    const matchesQuality = qualityFilter === 'ALL' || batch.qualityStatus === qualityFilter;
    const daysToExpiry = getDaysToExpiry(batch.expiryDate);
    const matchesExpiry = expiryFilter === 'ALL' || (expiryFilter === 'EXPIRING' && daysToExpiry <= 30 && daysToExpiry > 0) || (expiryFilter === 'EXPIRED' && daysToExpiry <= 0);
    return matchesSearch && matchesStatus && matchesQuality && matchesExpiry;
  });

  const stats = {
    total: mockBatches.length,
    active: mockBatches.filter(b => b.status === 'ACTIVE').length,
    quarantine: mockBatches.filter(b => b.status === 'QUARANTINE').length,
    expired: mockBatches.filter(b => getDaysToExpiry(b.expiryDate) <= 0).length,
    expiring: mockBatches.filter(b => { const days = getDaysToExpiry(b.expiryDate); return days > 0 && days <= 30; }).length
  };

  const getStatusBadge = (status: Batch['status']) => {
    const config = { ACTIVE: { label: 'Attivo', variant: 'success' as const }, QUARANTINE: { label: 'Quarantena', variant: 'warning' as const }, RELEASED: { label: 'Rilasciato', variant: 'info' as const }, EXPIRED: { label: 'Scaduto', variant: 'danger' as const }, BLOCKED: { label: 'Bloccato', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getQualityBadge = (quality: Batch['qualityStatus']) => {
    const config = { PASSED: { label: 'Conforme', variant: 'success' as const }, FAILED: { label: 'Non Conforme', variant: 'danger' as const }, PENDING: { label: 'In Verifica', variant: 'warning' as const }, NOT_TESTED: { label: 'Non Testato', variant: 'secondary' as const } };
    return <Badge variant={config[quality].variant}>{config[quality].label}</Badge>;
  };

  const getExpiryIndicator = (expiryDate: string) => {
    const days = getDaysToExpiry(expiryDate);
    if (days <= 0) return <Badge variant="danger">Scaduto</Badge>;
    if (days <= 7) return <Badge variant="danger">{days}gg</Badge>;
    if (days <= 30) return <Badge variant="warning">{days}gg</Badge>;
    if (days <= 90) return <Badge variant="info">{days}gg</Badge>;
    return <Badge variant="success">{days}gg</Badge>;
  };

  const columns = [
    { key: 'batchNumber', label: 'N. Lotto', render: (row: Batch) => <div><div className="font-medium font-mono text-sm">{row.batchNumber}</div><div className="text-xs text-gray-600">{row.lotNumber}</div></div> },
    { key: 'product', label: 'Prodotto', render: (row: Batch) => <div><div className="font-medium">{row.productCode}</div><div className="text-sm text-gray-600">{row.productDescription}</div></div> },
    { key: 'quantity', label: 'Quantità', render: (row: Batch) => <div className="font-medium">{row.quantity} {row.unit}</div> },
    { key: 'status', label: 'Stato', render: (row: Batch) => getStatusBadge(row.status) },
    { key: 'quality', label: 'Qualità', render: (row: Batch) => getQualityBadge(row.qualityStatus) },
    { key: 'expiry', label: 'Scadenza', render: (row: Batch) => <div className="text-sm"><div>{new Date(row.expiryDate).toLocaleDateString('it-IT')}</div><div className="mt-1">{getExpiryIndicator(row.expiryDate)}</div></div> },
    { key: 'location', label: 'Locazione', render: (row: Batch) => <div className="text-sm">{row.location || '-'}</div> },
    { key: 'actions', label: 'Azioni', render: (row: Batch) => <Button variant="secondary" size="sm" onClick={() => { setSelectedBatch(row); setShowDetailModal(true); }}>Dettaglio</Button> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Lotti</h1><p className="mt-2 text-gray-600">Gestisci lotti, scadenze e tracciabilità</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta')}>Esporta Report</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo lotto')}>Nuovo Lotto</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Totale Lotti</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Attivi</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">Quarantena</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.quarantine}</div></Card>
        <Card className="p-4 border-orange-200 bg-orange-50"><div className="text-sm font-medium text-orange-700">In Scadenza (30gg)</div><div className="text-2xl font-bold text-orange-600 mt-1">{stats.expiring}</div></Card>
        <Card className="p-4 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">Scaduti</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per lotto, prodotto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="ACTIVE">Attivo</option><option value="QUARANTINE">Quarantena</option><option value="RELEASED">Rilasciato</option><option value="EXPIRED">Scaduto</option><option value="BLOCKED">Bloccato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Qualità</label><select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PASSED">Conforme</option><option value="FAILED">Non Conforme</option><option value="PENDING">In Verifica</option><option value="NOT_TESTED">Non Testato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label><select value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="EXPIRING">In Scadenza (30gg)</option><option value="EXPIRED">Scaduti</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Lotti ({filteredBatches.length})</h2></div>
        <Table columns={columns} data={filteredBatches} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedBatch.batchNumber}</h2><p className="text-gray-600 mt-1">Lotto: {selectedBatch.lotNumber}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Prodotto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Codice Prodotto</div><div className="font-medium font-mono">{selectedBatch.productCode}</div></div>
                  <div><div className="text-sm text-gray-600">Descrizione</div><div className="font-medium">{selectedBatch.productDescription}</div></div>
                  <div><div className="text-sm text-gray-600">Quantità</div><div className="font-medium text-blue-600 text-lg">{selectedBatch.quantity} {selectedBatch.unit}</div></div>
                  {selectedBatch.location && <div><div className="text-sm text-gray-600">Locazione</div><div className="font-medium">{selectedBatch.location}</div></div>}
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Stato e Qualità</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><div className="text-sm text-gray-600">Stato Lotto</div><div className="mt-1">{getStatusBadge(selectedBatch.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato Qualità</div><div className="mt-1">{getQualityBadge(selectedBatch.qualityStatus)}</div></div>
                  {selectedBatch.certificateNumber && <div><div className="text-sm text-gray-600">N. Certificato</div><div className="font-medium font-mono">{selectedBatch.certificateNumber}</div></div>}
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Date e Scadenze</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><div className="text-sm text-gray-600">Data Produzione</div><div className="font-medium">{new Date(selectedBatch.manufacturingDate).toLocaleDateString('it-IT')}</div></div>
                  <div><div className="text-sm text-gray-600">Data Ricevimento</div><div className="font-medium">{new Date(selectedBatch.receivedDate).toLocaleDateString('it-IT')}</div></div>
                  <div><div className="text-sm text-gray-600">Data Scadenza</div><div className="font-medium">{new Date(selectedBatch.expiryDate).toLocaleDateString('it-IT')}</div><div className="mt-1">{getExpiryIndicator(selectedBatch.expiryDate)}</div></div>
                </div>
              </Card>
              {selectedBatch.traceabilityCode && (
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">Tracciabilità</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-sm text-blue-700">Codice Tracciabilità</div><div className="font-medium font-mono text-blue-900">{selectedBatch.traceabilityCode}</div></div>
                    {selectedBatch.supplier && <div><div className="text-sm text-blue-700">Fornitore</div><div className="font-medium text-blue-900">{selectedBatch.supplier}</div></div>}
                  </div>
                </Card>
              )}
              {selectedBatch.notes && (
                <Card className="p-4 border-yellow-200 bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3>
                  <p className="text-yellow-900">{selectedBatch.notes}</p>
                </Card>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('Storico movimenti')}>Storico Movimenti</Button>
                <Button variant="secondary" onClick={() => console.log('Stampa etichetta')}>Stampa Etichetta</Button>
                {selectedBatch.status === 'QUARANTINE' && <Button variant="success" onClick={() => console.log('Rilascia')}>Rilascia Lotto</Button>}
                {selectedBatch.status === 'BLOCKED' && <Button variant="primary" onClick={() => console.log('Sblocca')}>Sblocca Lotto</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagementPage;

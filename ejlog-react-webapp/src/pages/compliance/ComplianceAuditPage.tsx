import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface AuditRecord {
  id: string;
  auditNumber: string;
  type: 'INVENTORY' | 'PROCESS' | 'QUALITY' | 'SAFETY' | 'REGULATORY' | 'INTERNAL';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REMEDIATION';
  auditor: string;
  area: string;
  scheduledDate: string;
  completedDate?: string;
  score?: number; // 0-100
  findingsCount: number;
  criticalFindings: number;
  nonComplianceIssues: number;
  correctiveActions: number;
  dueDate?: string;
  notes?: string;
}

const ComplianceAuditPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockAudits: AuditRecord[] = [
    { id: '1', auditNumber: 'AUD-2025-001', type: 'INVENTORY', status: 'SCHEDULED', auditor: 'Mario Rossi', area: 'Zona A - Locazioni 1-50', scheduledDate: '2025-11-21T09:00:00', findingsCount: 0, criticalFindings: 0, nonComplianceIssues: 0, correctiveActions: 0 },
    { id: '2', auditNumber: 'AUD-2025-002', type: 'SAFETY', status: 'IN_PROGRESS', auditor: 'Luigi Bianchi', area: 'Banchine Carico/Scarico', scheduledDate: '2025-11-20T08:00:00', findingsCount: 0, criticalFindings: 0, nonComplianceIssues: 0, correctiveActions: 0 },
    { id: '3', auditNumber: 'AUD-2025-003', type: 'QUALITY', status: 'COMPLETED', auditor: 'Anna Verdi', area: 'Controllo Qualità Ingresso', scheduledDate: '2025-11-19T10:00:00', completedDate: '2025-11-19T14:30:00', score: 92, findingsCount: 3, criticalFindings: 0, nonComplianceIssues: 1, correctiveActions: 1 },
    { id: '4', auditNumber: 'AUD-2025-004', type: 'PROCESS', status: 'FAILED', auditor: 'Paolo Neri', area: 'Picking & Packing', scheduledDate: '2025-11-18T09:00:00', completedDate: '2025-11-18T15:00:00', score: 65, findingsCount: 12, criticalFindings: 3, nonComplianceIssues: 5, correctiveActions: 8, dueDate: '2025-11-25T18:00:00', notes: 'Rilevate criticità significative nei processi di prelievo' },
    { id: '5', auditNumber: 'AUD-2025-005', type: 'REGULATORY', status: 'REMEDIATION', auditor: 'Giulia Gialli', area: 'Gestione HACCP', scheduledDate: '2025-11-17T08:00:00', completedDate: '2025-11-17T12:00:00', score: 78, findingsCount: 6, criticalFindings: 1, nonComplianceIssues: 3, correctiveActions: 4, dueDate: '2025-11-24T18:00:00' },
    { id: '6', auditNumber: 'AUD-2025-006', type: 'INTERNAL', status: 'COMPLETED', auditor: 'Marco Blu', area: 'Documentazione Procedure', scheduledDate: '2025-11-16T14:00:00', completedDate: '2025-11-16T17:00:00', score: 95, findingsCount: 2, criticalFindings: 0, nonComplianceIssues: 0, correctiveActions: 2 }
  ];

  const filteredAudits = mockAudits.filter((audit) => {
    const matchesSearch = audit.auditNumber.toLowerCase().includes(searchTerm.toLowerCase()) || audit.area.toLowerCase().includes(searchTerm.toLowerCase()) || audit.auditor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || audit.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || audit.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: mockAudits.length,
    scheduled: mockAudits.filter(a => a.status === 'SCHEDULED').length,
    completed: mockAudits.filter(a => a.status === 'COMPLETED').length,
    failed: mockAudits.filter(a => a.status === 'FAILED').length,
    avgScore: mockAudits.filter(a => a.score).reduce((sum, a, _, arr) => sum + (a.score || 0) / arr.length, 0),
    totalFindings: mockAudits.reduce((sum, a) => sum + a.findingsCount, 0),
    criticalFindings: mockAudits.reduce((sum, a) => sum + a.criticalFindings, 0)
  };

  const getStatusBadge = (status: AuditRecord['status']) => {
    const config = { SCHEDULED: { label: 'Programmato', variant: 'secondary' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, FAILED: { label: 'Non Conforme', variant: 'danger' as const }, REMEDIATION: { label: 'In Rimedio', variant: 'info' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: AuditRecord['type']) => {
    const labels = { INVENTORY: 'Inventario', PROCESS: 'Processi', QUALITY: 'Qualità', SAFETY: 'Sicurezza', REGULATORY: 'Normativo', INTERNAL: 'Interno' };
    const colors = { INVENTORY: 'bg-blue-100 text-blue-800', PROCESS: 'bg-purple-100 text-purple-800', QUALITY: 'bg-green-100 text-green-800', SAFETY: 'bg-orange-100 text-orange-800', REGULATORY: 'bg-red-100 text-red-800', INTERNAL: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[type]}`}>{labels[type]}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const columns = [
    { key: 'number', label: 'Numero', render: (row: AuditRecord) => <div className="font-medium font-mono text-sm">{row.auditNumber}</div> },
    { key: 'type', label: 'Tipo', render: (row: AuditRecord) => getTypeBadge(row.type) },
    { key: 'status', label: 'Stato', render: (row: AuditRecord) => getStatusBadge(row.status) },
    { key: 'area', label: 'Area', render: (row: AuditRecord) => <div className="text-sm">{row.area}</div> },
    { key: 'auditor', label: 'Auditor', render: (row: AuditRecord) => <div className="font-medium">{row.auditor}</div> },
    { key: 'date', label: 'Data', render: (row: AuditRecord) => <div className="text-sm">{new Date(row.scheduledDate).toLocaleDateString('it-IT')}</div> },
    { key: 'score', label: 'Score', render: (row: AuditRecord) => row.score ? <div className={`font-bold text-lg ${getScoreColor(row.score)}`}>{row.score}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'findings', label: 'Rilievi', render: (row: AuditRecord) => <div className="text-sm"><div>{row.findingsCount} tot.</div>{row.criticalFindings > 0 && <div className="text-red-600 font-medium">{row.criticalFindings} critici</div>}</div> },
    { key: 'actions', label: 'Azioni', render: (row: AuditRecord) => <Button variant="secondary" size="sm" onClick={() => { setSelectedAudit(row); setShowDetailModal(true); }}>Dettaglio</Button> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Audit & Compliance</h1><p className="mt-2 text-gray-600">Gestisci audit e verifica conformità</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Report')}>Report Compliance</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo audit')}>Nuovo Audit</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Audit Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">Programmati</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.scheduled}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completati</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">Non Conformi</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Score Medio</div><div className={`text-2xl font-bold mt-1 ${getScoreColor(stats.avgScore)}`}>{stats.avgScore.toFixed(0)}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Rilievi Totali</div><div className="text-2xl font-bold text-orange-600 mt-1">{stats.totalFindings}</div></Card>
        <Card className="p-4 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">Rilievi Critici</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.criticalFindings}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca numero, area, auditor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="INVENTORY">Inventario</option><option value="PROCESS">Processi</option><option value="QUALITY">Qualità</option><option value="SAFETY">Sicurezza</option><option value="REGULATORY">Normativo</option><option value="INTERNAL">Interno</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="SCHEDULED">Programmato</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="FAILED">Non Conforme</option><option value="REMEDIATION">In Rimedio</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Audit ({filteredAudits.length})</h2></div>
        <Table columns={columns} data={filteredAudits} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedAudit.auditNumber}</h2><p className="text-gray-600 mt-1">{selectedAudit.area}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Audit</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedAudit.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedAudit.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Auditor</div><div className="font-medium">{selectedAudit.auditor}</div></div>
                  <div><div className="text-sm text-gray-600">Data Programmata</div><div className="font-medium">{new Date(selectedAudit.scheduledDate).toLocaleString('it-IT')}</div></div>
                  {selectedAudit.completedDate && <div><div className="text-sm text-gray-600">Data Completamento</div><div className="font-medium">{new Date(selectedAudit.completedDate).toLocaleString('it-IT')}</div></div>}
                  {selectedAudit.dueDate && <div><div className="text-sm text-gray-600">Scadenza Azioni</div><div className="font-medium text-red-600">{new Date(selectedAudit.dueDate).toLocaleString('it-IT')}</div></div>}
                </div>
              </Card>

              {selectedAudit.score && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Risultati</h3>
                  <div className="space-y-4">
                    <div><div className="text-sm text-gray-600 mb-2">Score Compliance</div><div className={`text-4xl font-bold ${getScoreColor(selectedAudit.score)}`}>{selectedAudit.score}/100</div><div className="w-full bg-gray-200 rounded-full h-3 mt-3"><div className={`h-3 rounded-full ${selectedAudit.score >= 90 ? 'bg-green-500' : selectedAudit.score >= 75 ? 'bg-blue-500' : selectedAudit.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${selectedAudit.score}%` }} /></div></div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div><div className="text-sm text-gray-600">Rilievi Totali</div><div className="text-2xl font-bold text-orange-600 mt-1">{selectedAudit.findingsCount}</div></div>
                      <div><div className="text-sm text-gray-600">Rilievi Critici</div><div className="text-2xl font-bold text-red-600 mt-1">{selectedAudit.criticalFindings}</div></div>
                      <div><div className="text-sm text-gray-600">Non Conformità</div><div className="text-2xl font-bold text-red-600 mt-1">{selectedAudit.nonComplianceIssues}</div></div>
                      <div><div className="text-sm text-gray-600">Azioni Correttive</div><div className="text-2xl font-bold text-blue-600 mt-1">{selectedAudit.correctiveActions}</div></div>
                    </div>
                  </div>
                </Card>
              )}

              {selectedAudit.notes && <Card className="p-4 border-yellow-200 bg-yellow-50"><h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3><p className="text-yellow-900">{selectedAudit.notes}</p></Card>}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Stampa report')}>Stampa Report</Button>
                {(selectedAudit.status === 'FAILED' || selectedAudit.status === 'REMEDIATION') && <Button variant="primary" onClick={() => console.log('Azioni correttive')}>Gestisci Azioni Correttive</Button>}
                {selectedAudit.status === 'SCHEDULED' && <Button variant="primary" onClick={() => console.log('Inizia audit')}>Inizia Audit</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceAuditPage;

import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Alert {
  id: string;
  alertCode: string;
  title: string;
  description: string;
  type: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  category: 'STOCK' | 'QUALITY' | 'SYSTEM' | 'OPERATION' | 'SECURITY';
  severity: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
  createdDate: string;
  acknowledgedDate?: string;
  resolvedDate?: string;
  source: string;
  affectedEntity?: string;
  affectedEntityId?: string;
  assignedTo?: string;
  actions?: string[];
  notes?: string;
}

const AlertsDashboardPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockAlerts: Alert[] = [
    {
      id: '1', alertCode: 'STK-LOW-001', title: 'Stock Basso Critico', description: 'Livello stock sotto soglia minima per prodotto PROD-12345',
      type: 'CRITICAL', category: 'STOCK', severity: 5, status: 'ACTIVE', createdDate: '2025-11-20T08:30:00',
      source: 'Sistema Inventario', affectedEntity: 'PROD-12345', affectedEntityId: '12345',
      actions: ['Riordina', 'Trasferisci da altra locazione'], notes: 'Stock disponibile: 5 unità (minimo: 50)'
    },
    {
      id: '2', alertCode: 'QUA-FAIL-002', title: 'Ispezione Qualità Fallita', description: 'Lotto LT-2025-456 non ha superato controllo qualità',
      type: 'ERROR', category: 'QUALITY', severity: 4, status: 'ACKNOWLEDGED', createdDate: '2025-11-20T09:15:00',
      acknowledgedDate: '2025-11-20T09:45:00', source: 'Quality Control', affectedEntity: 'LT-2025-456', assignedTo: 'M.Rossi',
      actions: ['Quarantena', 'Richiedi nuova ispezione'], notes: '12 difetti critici rilevati'
    },
    {
      id: '3', alertCode: 'SYS-PERF-003', title: 'Performance Database Degradata', description: 'Tempo risposta query superiore a soglia (>2s)',
      type: 'WARNING', category: 'SYSTEM', severity: 3, status: 'ACTIVE', createdDate: '2025-11-20T10:00:00',
      source: 'Monitor Sistema', actions: ['Ottimizza indici', 'Analizza query lente']
    },
    {
      id: '4', alertCode: 'OPR-DELAY-004', title: 'Ritardo Lista Prelievo', description: 'Lista PICK-2025-123 in ritardo di 2 ore su SLA',
      type: 'WARNING', category: 'OPERATION', severity: 3, status: 'ACKNOWLEDGED', createdDate: '2025-11-20T07:00:00',
      acknowledgedDate: '2025-11-20T08:30:00', source: 'Task Manager', affectedEntity: 'PICK-2025-123', assignedTo: 'G.Bianchi',
      actions: ['Riassegna operatore', 'Aumenta priorità'], notes: 'Operatore assente, riassegnata'
    },
    {
      id: '5', alertCode: 'SEC-AUTH-005', title: 'Tentativi Login Falliti', description: '5 tentativi falliti per utente admin da IP 192.168.1.50',
      type: 'ERROR', category: 'SECURITY', severity: 4, status: 'ACTIVE', createdDate: '2025-11-20T11:20:00',
      source: 'Auth Service', affectedEntity: 'admin', actions: ['Blocca IP', 'Reset password', 'Notifica amministratore']
    },
    {
      id: '6', alertCode: 'STK-EXP-006', title: 'Prodotti in Scadenza', description: '15 articoli in scadenza entro 7 giorni',
      type: 'WARNING', category: 'STOCK', severity: 2, status: 'ACTIVE', createdDate: '2025-11-20T06:00:00',
      source: 'Sistema Inventario', actions: ['Genera lista prioritaria', 'Notifica commerciale']
    },
    {
      id: '7', alertCode: 'OPR-IDLE-007', title: 'Postazione Inattiva', description: 'Workstation WS-05 inattiva da oltre 30 minuti',
      type: 'INFO', category: 'OPERATION', severity: 1, status: 'RESOLVED', createdDate: '2025-11-20T09:00:00',
      resolvedDate: '2025-11-20T10:00:00', source: 'Monitor Postazioni', affectedEntity: 'WS-05', notes: 'Operatore in pausa pranzo'
    },
    {
      id: '8', alertCode: 'QUA-TEMP-008', title: 'Temperatura Fuori Range', description: 'Cella frigorifera ZONA-F a 8°C (max: 5°C)',
      type: 'CRITICAL', category: 'QUALITY', severity: 5, status: 'ACTIVE', createdDate: '2025-11-20T11:45:00',
      source: 'Sensori Temperatura', affectedEntity: 'ZONA-F', actions: ['Verifica impianto', 'Trasferisci prodotti', 'Chiama tecnico']
    }
  ];

  const stats = {
    total: mockAlerts.length,
    critical: mockAlerts.filter(a => a.type === 'CRITICAL').length,
    active: mockAlerts.filter(a => a.status === 'ACTIVE').length,
    acknowledged: mockAlerts.filter(a => a.status === 'ACKNOWLEDGED').length,
    resolved: mockAlerts.filter(a => a.status === 'RESOLVED').length
  };

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch = alert.alertCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || alert.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || alert.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const getTypeBadge = (type: Alert['type']) => {
    const config = {
      CRITICAL: { label: 'Critico', variant: 'danger' as const },
      ERROR: { label: 'Errore', variant: 'danger' as const },
      WARNING: { label: 'Warning', variant: 'warning' as const },
      INFO: { label: 'Info', variant: 'info' as const }
    };
    return <Badge variant={config[type].variant}>{config[type].label}</Badge>;
  };

  const getCategoryBadge = (category: Alert['category']) => {
    const config = {
      STOCK: { label: 'Stock', color: 'bg-blue-100 text-blue-800' },
      QUALITY: { label: 'Qualità', color: 'bg-purple-100 text-purple-800' },
      SYSTEM: { label: 'Sistema', color: 'bg-gray-100 text-gray-800' },
      OPERATION: { label: 'Operazioni', color: 'bg-green-100 text-green-800' },
      SECURITY: { label: 'Sicurezza', color: 'bg-red-100 text-red-800' }
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[category].color}`}>{config[category].label}</span>;
  };

  const getStatusBadge = (status: Alert['status']) => {
    const config = {
      ACTIVE: { label: 'Attivo', variant: 'danger' as const },
      ACKNOWLEDGED: { label: 'Preso in Carico', variant: 'warning' as const },
      RESOLVED: { label: 'Risolto', variant: 'success' as const },
      IGNORED: { label: 'Ignorato', variant: 'secondary' as const }
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getSeverityIndicator = (severity: number) => {
    const colors = ['bg-gray-300', 'bg-blue-300', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-red-700'];
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div key={level} className={`w-2 h-4 rounded ${level <= severity ? colors[severity] : 'bg-gray-200'}`} />
        ))}
      </div>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleAcknowledge = (alertId: string) => {
    console.log('Acknowledge alert:', alertId);
    // In real app: API call to acknowledge
  };

  const handleResolve = (alertId: string) => {
    console.log('Resolve alert:', alertId);
    // In real app: API call to resolve
  };

  const handleIgnore = (alertId: string) => {
    console.log('Ignore alert:', alertId);
    // In real app: API call to ignore
  };

  const columns = [
    {
      key: 'severity',
      label: 'Severità',
      render: (row: Alert) => getSeverityIndicator(row.severity)
    },
    {
      key: 'alertCode',
      label: 'Codice',
      render: (row: Alert) => (
        <div>
          <div className="font-medium font-mono text-xs">{row.alertCode}</div>
          <div className="text-xs text-gray-600">{formatDateTime(row.createdDate)}</div>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Titolo',
      render: (row: Alert) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <div className="text-sm text-gray-600 truncate max-w-xs">{row.description}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row: Alert) => getTypeBadge(row.type)
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (row: Alert) => getCategoryBadge(row.category)
    },
    {
      key: 'source',
      label: 'Origine',
      render: (row: Alert) => (
        <div className="text-sm">
          <div>{row.source}</div>
          {row.affectedEntity && <div className="text-xs text-gray-600">{row.affectedEntity}</div>}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      render: (row: Alert) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: Alert) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSelectedAlert(row); setShowDetailModal(true); }}>
            Dettaglio
          </Button>
          {row.status === 'ACTIVE' && (
            <Button variant="primary" size="sm" onClick={() => handleAcknowledge(row.id)}>
              Prendi in Carico
            </Button>
          )}
        </div>
      )
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Avvisi</h1>
          <p className="mt-2 text-gray-600">Monitora e gestisci avvisi e notifiche di sistema</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta')}>Esporta Report</Button>
          <Button variant="primary" onClick={() => console.log('Configura regole')}>Configura Regole</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Totale Avvisi</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">Critici</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">Attivi</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.active}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm font-medium text-yellow-700">In Gestione</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.acknowledged}</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700">Risolti</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label>
            <input
              type="text"
              placeholder="Cerca per codice, titolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option>
              <option value="CRITICAL">Critico</option>
              <option value="ERROR">Errore</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutte</option>
              <option value="STOCK">Stock</option>
              <option value="QUALITY">Qualità</option>
              <option value="SYSTEM">Sistema</option>
              <option value="OPERATION">Operazioni</option>
              <option value="SECURITY">Sicurezza</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option>
              <option value="ACTIVE">Attivo</option>
              <option value="ACKNOWLEDGED">Preso in Carico</option>
              <option value="RESOLVED">Risolto</option>
              <option value="IGNORED">Ignorato</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Avvisi ({filteredAlerts.length})</h2>
        </div>
        <Table columns={columns} data={filteredAlerts} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAlert.title}</h2>
                    {getTypeBadge(selectedAlert.type)}
                    {getCategoryBadge(selectedAlert.category)}
                  </div>
                  <p className="text-gray-600 mt-1">Codice: {selectedAlert.alertCode}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Avviso</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Severità</div>
                    <div className="mt-1">{getSeverityIndicator(selectedAlert.severity)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Stato</div>
                    <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Origine</div>
                    <div className="font-medium">{selectedAlert.source}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Creazione</div>
                    <div className="font-medium">{formatDateTime(selectedAlert.createdDate)}</div>
                  </div>
                  {selectedAlert.acknowledgedDate && (
                    <div>
                      <div className="text-sm text-gray-600">Preso in Carico</div>
                      <div className="font-medium">{formatDateTime(selectedAlert.acknowledgedDate)}</div>
                    </div>
                  )}
                  {selectedAlert.resolvedDate && (
                    <div>
                      <div className="text-sm text-gray-600">Risolto</div>
                      <div className="font-medium text-green-600">{formatDateTime(selectedAlert.resolvedDate)}</div>
                    </div>
                  )}
                  {selectedAlert.affectedEntity && (
                    <div>
                      <div className="text-sm text-gray-600">Entità Coinvolta</div>
                      <div className="font-medium font-mono">{selectedAlert.affectedEntity}</div>
                    </div>
                  )}
                  {selectedAlert.assignedTo && (
                    <div>
                      <div className="text-sm text-gray-600">Assegnato A</div>
                      <div className="font-medium">{selectedAlert.assignedTo}</div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Descrizione</h3>
                <p className="text-gray-900">{selectedAlert.description}</p>
              </Card>

              {selectedAlert.actions && selectedAlert.actions.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Azioni Suggerite</h3>
                  <ul className="space-y-2">
                    {selectedAlert.actions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {selectedAlert.notes && (
                <Card className="p-4 border-yellow-200 bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3>
                  <p className="text-yellow-900">{selectedAlert.notes}</p>
                </Card>
              )}

              <div className="flex justify-end gap-3">
                {selectedAlert.status === 'ACTIVE' && (
                  <>
                    <Button variant="secondary" onClick={() => handleIgnore(selectedAlert.id)}>Ignora</Button>
                    <Button variant="primary" onClick={() => handleAcknowledge(selectedAlert.id)}>Prendi in Carico</Button>
                  </>
                )}
                {selectedAlert.status === 'ACKNOWLEDGED' && (
                  <Button variant="success" onClick={() => handleResolve(selectedAlert.id)}>Risolvi</Button>
                )}
                {selectedAlert.status === 'RESOLVED' && (
                  <Button variant="secondary" onClick={() => console.log('Reopen')}>Riapri</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsDashboardPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

// TypeScript interfaces
interface QualityInspection {
  id: string;
  inspectionNumber: string;
  type: 'RECEIVING' | 'PRODUCTION' | 'SHIPPING' | 'INVENTORY' | 'AUDIT';
  productCode: string;
  productDescription: string;
  lotNumber?: string;
  batchNumber?: string;
  inspectionDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ON_HOLD';
  priority: number;
  quantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  inspector?: string;
  location?: string;
  udcBarcode?: string;
  relatedOrder?: string;
  defectCount: number;
  notes?: string;
}

interface QualityDefect {
  defectCode: string;
  defectDescription: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  quantity: number;
  affectedArea?: string;
  correctiveAction?: string;
}

const QualityControlPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data - in produzione verranno dalle API
  const mockInspections: QualityInspection[] = [
    {
      id: '1',
      inspectionNumber: 'QC-2025-001',
      type: 'RECEIVING',
      productCode: 'COMP001',
      productDescription: 'Componente Base A',
      lotNumber: 'LOT-2025-001',
      inspectionDate: '2025-11-20',
      status: 'IN_PROGRESS',
      priority: 1,
      quantity: 1000,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      unit: 'PZ',
      inspector: 'M.Rossi',
      location: 'QC-AREA-01',
      udcBarcode: 'UDC-QC-001',
      relatedOrder: 'RO-2025-001',
      defectCount: 0,
      notes: 'Controllo prioritario per ordine urgente'
    },
    {
      id: '2',
      inspectionNumber: 'QC-2025-002',
      type: 'PRODUCTION',
      productCode: 'FIN001',
      productDescription: 'Prodotto Finito A',
      batchNumber: 'BATCH-2025-001',
      inspectionDate: '2025-11-20',
      status: 'FAILED',
      priority: 1,
      quantity: 500,
      acceptedQuantity: 450,
      rejectedQuantity: 50,
      unit: 'PZ',
      inspector: 'G.Bianchi',
      location: 'QC-AREA-02',
      udcBarcode: 'UDC-PROD-001',
      relatedOrder: 'PO-2025-001',
      defectCount: 3,
      notes: 'Rilevati difetti di assemblaggio - lotto segregato'
    },
    {
      id: '3',
      inspectionNumber: 'QC-2025-003',
      type: 'SHIPPING',
      productCode: 'FIN002',
      productDescription: 'Prodotto Finito B Premium',
      lotNumber: 'LOT-2025-005',
      inspectionDate: '2025-11-19',
      status: 'PASSED',
      priority: 2,
      quantity: 300,
      acceptedQuantity: 300,
      rejectedQuantity: 0,
      unit: 'PZ',
      inspector: 'A.Verdi',
      location: 'QC-AREA-03',
      udcBarcode: 'UDC-SHIP-001',
      relatedOrder: 'SO-2025-001',
      defectCount: 0,
      notes: ''
    },
    {
      id: '4',
      inspectionNumber: 'QC-2025-004',
      type: 'INVENTORY',
      productCode: 'COMP005',
      productDescription: 'Componente Y',
      lotNumber: 'LOT-C005',
      inspectionDate: '2025-11-18',
      status: 'PASSED',
      priority: 3,
      quantity: 2000,
      acceptedQuantity: 2000,
      rejectedQuantity: 0,
      unit: 'PZ',
      inspector: 'L.Neri',
      location: 'A-06-02',
      defectCount: 0,
      notes: 'Controllo inventario periodico'
    },
    {
      id: '5',
      inspectionNumber: 'QC-2025-005',
      type: 'RECEIVING',
      productCode: 'PACK001',
      productDescription: 'Imballo Primario',
      lotNumber: 'LOT-P001',
      inspectionDate: '2025-11-20',
      status: 'PENDING',
      priority: 2,
      quantity: 5000,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      unit: 'PZ',
      location: 'QC-AREA-01',
      udcBarcode: 'UDC-QC-005',
      relatedOrder: 'RO-2025-005',
      defectCount: 0,
      notes: ''
    },
    {
      id: '6',
      inspectionNumber: 'QC-2025-006',
      type: 'AUDIT',
      productCode: 'FIN003',
      productDescription: 'Prodotto Finito C',
      lotNumber: 'LOT-2025-010',
      inspectionDate: '2025-11-17',
      status: 'ON_HOLD',
      priority: 1,
      quantity: 1000,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      unit: 'PZ',
      inspector: 'M.Rossi',
      location: 'QC-AREA-AUDIT',
      defectCount: 1,
      notes: 'In attesa documentazione fornitore'
    }
  ];

  const mockDefects: Record<string, QualityDefect[]> = {
    '2': [
      {
        defectCode: 'D001',
        defectDescription: 'Componente mancante',
        severity: 'CRITICAL',
        quantity: 30,
        affectedArea: 'Assemblaggio',
        correctiveAction: 'Riassemblaggio completo'
      },
      {
        defectCode: 'D002',
        defectDescription: 'Difetto estetico - graffio',
        severity: 'MINOR',
        quantity: 15,
        affectedArea: 'Superficie esterna',
        correctiveAction: 'Pulitura e ripristino'
      },
      {
        defectCode: 'D003',
        defectDescription: 'Etichettatura errata',
        severity: 'MAJOR',
        quantity: 5,
        affectedArea: 'Etichetta prodotto',
        correctiveAction: 'Ri-etichettatura'
      }
    ],
    '6': [
      {
        defectCode: 'D004',
        defectDescription: 'Certificato di analisi mancante',
        severity: 'CRITICAL',
        quantity: 1000,
        affectedArea: 'Documentazione',
        correctiveAction: 'Richiedere certificato al fornitore'
      }
    ]
  };

  // Calcola le statistiche
  const stats = {
    total: mockInspections.length,
    pending: mockInspections.filter(i => i.status === 'PENDING').length,
    inProgress: mockInspections.filter(i => i.status === 'IN_PROGRESS').length,
    passed: mockInspections.filter(i => i.status === 'PASSED').length,
    failed: mockInspections.filter(i => i.status === 'FAILED').length,
    onHold: mockInspections.filter(i => i.status === 'ON_HOLD').length
  };

  // Filtra le ispezioni
  const filteredInspections = mockInspections.filter((inspection) => {
    const matchesSearch =
      inspection.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.lotNumber && inspection.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inspection.batchNumber && inspection.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inspection.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || inspection.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Funzione per ottenere il badge di stato
  const getStatusBadge = (status: QualityInspection['status']) => {
    const statusConfig = {
      PENDING: { label: 'In Attesa', variant: 'secondary' as const },
      IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const },
      PASSED: { label: 'Approvato', variant: 'success' as const },
      FAILED: { label: 'Respinto', variant: 'danger' as const },
      ON_HOLD: { label: 'Sospeso', variant: 'info' as const }
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Funzione per ottenere il badge del tipo
  const getTypeBadge = (type: QualityInspection['type']) => {
    const typeConfig = {
      RECEIVING: { label: 'Ricevimento', color: 'bg-blue-100 text-blue-800' },
      PRODUCTION: { label: 'Produzione', color: 'bg-purple-100 text-purple-800' },
      SHIPPING: { label: 'Spedizione', color: 'bg-green-100 text-green-800' },
      INVENTORY: { label: 'Inventario', color: 'bg-orange-100 text-orange-800' },
      AUDIT: { label: 'Audit', color: 'bg-red-100 text-red-800' }
    };
    const config = typeConfig[type];
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config.color}`}>{config.label}</span>;
  };

  // Funzione per ottenere il badge di priorità
  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="danger">Urgente</Badge>;
    if (priority === 2) return <Badge variant="warning">Alta</Badge>;
    if (priority === 3) return <Badge variant="info">Media</Badge>;
    return <Badge variant="secondary">Bassa</Badge>;
  };

  // Funzione per ottenere il badge di severity
  const getSeverityBadge = (severity: QualityDefect['severity']) => {
    const severityConfig = {
      CRITICAL: { label: 'Critico', variant: 'danger' as const },
      MAJOR: { label: 'Maggiore', variant: 'warning' as const },
      MINOR: { label: 'Minore', variant: 'info' as const }
    };
    const config = severityConfig[severity];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Gestione apertura dettaglio
  const handleOpenDetail = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowDetailModal(true);
  };

  // Gestione chiusura dettaglio
  const handleCloseDetail = () => {
    setSelectedInspection(null);
    setShowDetailModal(false);
  };

  // Gestione avvio ispezione
  const handleStartInspection = (inspectionId: string) => {
    console.log('Start inspection:', inspectionId);
    // In produzione: chiamata API per avviare l'ispezione
  };

  // Gestione approvazione
  const handleApprove = (inspectionId: string) => {
    console.log('Approve inspection:', inspectionId);
    // In produzione: chiamata API per approvare
  };

  // Gestione rigetto
  const handleReject = (inspectionId: string) => {
    console.log('Reject inspection:', inspectionId);
    // In produzione: chiamata API per respingere
  };

  // Colonne della tabella
  const columns = [
    {
      key: 'inspectionNumber',
      label: 'N. Ispezione',
      render: (row: QualityInspection) => (
        <div>
          <div className="font-medium">{row.inspectionNumber}</div>
          <div className="text-xs text-gray-600">
            {new Date(row.inspectionDate).toLocaleDateString('it-IT')}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row: QualityInspection) => getTypeBadge(row.type)
    },
    {
      key: 'product',
      label: 'Prodotto',
      render: (row: QualityInspection) => (
        <div>
          <button
            onClick={() => navigate(`/products/${row.productCode}`)}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {row.productCode}
          </button>
          <div className="text-sm text-gray-600">{row.productDescription}</div>
          {row.lotNumber && (
            <div className="text-xs text-gray-500 font-mono">Lotto: {row.lotNumber}</div>
          )}
          {row.batchNumber && (
            <div className="text-xs text-gray-500 font-mono">Batch: {row.batchNumber}</div>
          )}
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Quantità',
      render: (row: QualityInspection) => (
        <div className="text-sm">
          <div className="font-medium">Tot: {row.quantity} {row.unit}</div>
          <div className="text-green-600">OK: {row.acceptedQuantity} {row.unit}</div>
          {row.rejectedQuantity > 0 && (
            <div className="text-red-600">KO: {row.rejectedQuantity} {row.unit}</div>
          )}
        </div>
      )
    },
    {
      key: 'defects',
      label: 'Difetti',
      render: (row: QualityInspection) => (
        <div>
          {row.defectCount > 0 ? (
            <Badge variant="danger">{row.defectCount} difetti</Badge>
          ) : (
            <Badge variant="success">Nessun difetto</Badge>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      render: (row: QualityInspection) => getStatusBadge(row.status)
    },
    {
      key: 'priority',
      label: 'Priorità',
      render: (row: QualityInspection) => getPriorityBadge(row.priority)
    },
    {
      key: 'inspector',
      label: 'Ispettore',
      render: (row: QualityInspection) => (
        <div className="text-sm">
          {row.inspector || '-'}
          {row.location && (
            <div className="text-xs text-gray-600">{row.location}</div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: QualityInspection) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDetail(row)}
          >
            Dettaglio
          </Button>
          {row.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStartInspection(row.id)}
            >
              Avvia
            </Button>
          )}
          {row.status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleApprove(row.id)}
              >
                Approva
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReject(row.id)}
              >
                Respingi
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controllo Qualità</h1>
          <p className="mt-2 text-gray-600">
            Gestisci ispezioni, controlli qualità e non conformità
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => console.log('Esporta')}
          >
            Esporta
          </Button>
          <Button
            variant="primary"
            onClick={() => console.log('Nuova ispezione')}
          >
            Nuova Ispezione
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Totale</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">In Attesa</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">In Corso</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700">Approvati</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.passed}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">Respinti</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Sospesi</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.onHold}</div>
        </Card>
      </div>

      {/* Filtri */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ricerca
            </label>
            <input
              type="text"
              placeholder="Cerca per ispezione, prodotto, lotto, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">Tutti</option>
              <option value="PENDING">In Attesa</option>
              <option value="IN_PROGRESS">In Corso</option>
              <option value="PASSED">Approvato</option>
              <option value="FAILED">Respinto</option>
              <option value="ON_HOLD">Sospeso</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">Tutti</option>
              <option value="RECEIVING">Ricevimento</option>
              <option value="PRODUCTION">Produzione</option>
              <option value="SHIPPING">Spedizione</option>
              <option value="INVENTORY">Inventario</option>
              <option value="AUDIT">Audit</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabella ispezioni */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Ispezioni Qualità ({filteredInspections.length})
          </h2>
        </div>
        <Table
          columns={columns}
          data={filteredInspections}
          keyExtractor={(row) => row.id}
        />
      </Card>

      {/* Modal dettaglio */}
      {showDetailModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Dettaglio Ispezione {selectedInspection.inspectionNumber}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedInspection.productDescription}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenuto modal */}
            <div className="p-6 space-y-6">
              {/* Informazioni ispezione */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Ispezione</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Tipo Ispezione</div>
                    <div className="mt-1">{getTypeBadge(selectedInspection.type)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Stato</div>
                    <div className="mt-1">{getStatusBadge(selectedInspection.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Priorità</div>
                    <div className="mt-1">{getPriorityBadge(selectedInspection.priority)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Ispezione</div>
                    <div className="font-medium">
                      {new Date(selectedInspection.inspectionDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Prodotto</div>
                    <button
                      onClick={() => navigate(`/products/${selectedInspection.productCode}`)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {selectedInspection.productCode}
                    </button>
                  </div>
                  {selectedInspection.lotNumber && (
                    <div>
                      <div className="text-sm text-gray-600">Lotto</div>
                      <div className="font-medium font-mono">{selectedInspection.lotNumber}</div>
                    </div>
                  )}
                  {selectedInspection.batchNumber && (
                    <div>
                      <div className="text-sm text-gray-600">Batch</div>
                      <div className="font-medium font-mono">{selectedInspection.batchNumber}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600">Quantità Totale</div>
                    <div className="font-medium">{selectedInspection.quantity} {selectedInspection.unit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Quantità Accettata</div>
                    <div className="font-medium text-green-600">{selectedInspection.acceptedQuantity} {selectedInspection.unit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Quantità Respinta</div>
                    <div className="font-medium text-red-600">{selectedInspection.rejectedQuantity} {selectedInspection.unit}</div>
                  </div>
                  {selectedInspection.inspector && (
                    <div>
                      <div className="text-sm text-gray-600">Ispettore</div>
                      <div className="font-medium">{selectedInspection.inspector}</div>
                    </div>
                  )}
                  {selectedInspection.location && (
                    <div>
                      <div className="text-sm text-gray-600">Ubicazione</div>
                      <div className="font-medium">{selectedInspection.location}</div>
                    </div>
                  )}
                  {selectedInspection.udcBarcode && (
                    <div>
                      <div className="text-sm text-gray-600">UDC</div>
                      <button
                        onClick={() => navigate(`/udc/${selectedInspection.udcBarcode}`)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {selectedInspection.udcBarcode}
                      </button>
                    </div>
                  )}
                  {selectedInspection.relatedOrder && (
                    <div>
                      <div className="text-sm text-gray-600">Ordine Collegato</div>
                      <div className="font-medium">{selectedInspection.relatedOrder}</div>
                    </div>
                  )}
                </div>
                {selectedInspection.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Note</div>
                    <div className="mt-1 text-gray-900">{selectedInspection.notes}</div>
                  </div>
                )}
              </Card>

              {/* Difetti */}
              {mockDefects[selectedInspection.id] && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Difetti Rilevati ({mockDefects[selectedInspection.id].length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gravità</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantità</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area Interessata</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azione Correttiva</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mockDefects[selectedInspection.id].map((defect, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{defect.defectCode}</td>
                            <td className="px-4 py-3 text-sm">{defect.defectDescription}</td>
                            <td className="px-4 py-3 text-sm">{getSeverityBadge(defect.severity)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-red-600">{defect.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{defect.affectedArea || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{defect.correctiveAction || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Azioni */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => console.log('Print report')}
                >
                  Stampa Report
                </Button>
                {selectedInspection.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    onClick={() => handleStartInspection(selectedInspection.id)}
                  >
                    Avvia Ispezione
                  </Button>
                )}
                {selectedInspection.status === 'IN_PROGRESS' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(selectedInspection.id)}
                    >
                      Respingi
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => handleApprove(selectedInspection.id)}
                    >
                      Approva
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControlPage;

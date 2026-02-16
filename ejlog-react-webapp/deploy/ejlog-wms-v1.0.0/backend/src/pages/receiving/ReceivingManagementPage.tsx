import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface ReceivingOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  supplierCode: string;
  documentNumber: string;
  documentDate: string;
  expectedDate: string;
  receivedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  totalLines: number;
  completedLines: number;
  totalQuantity: number;
  receivedQuantity: number;
  operator?: string;
  notes?: string;
}

interface ReceivingLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unit: string;
  lotNumber?: string;
  expiryDate?: string;
  targetLocation?: string;
  targetUDC?: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

const ReceivingManagementPage = () => {
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ReceivingOrder | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Mock data
  const mockOrders: ReceivingOrder[] = [
    {
      id: 'RCV001',
      orderNumber: 'PO-2025-001',
      supplier: 'Fornitore Alpha S.r.l.',
      supplierCode: 'SUPP001',
      documentNumber: 'DDT-12345',
      documentDate: '2025-11-18',
      expectedDate: '2025-11-20',
      status: 'IN_PROGRESS',
      priority: 1,
      totalLines: 15,
      completedLines: 8,
      totalQuantity: 1500,
      receivedQuantity: 850,
      operator: 'mario.rossi',
      notes: 'Merce parzialmente ricevuta, in attesa seconda consegna',
    },
    {
      id: 'RCV002',
      orderNumber: 'PO-2025-002',
      supplier: 'Beta Supply Co.',
      supplierCode: 'SUPP002',
      documentNumber: 'DDT-12346',
      documentDate: '2025-11-19',
      expectedDate: '2025-11-20',
      status: 'PENDING',
      priority: 2,
      totalLines: 8,
      completedLines: 0,
      totalQuantity: 500,
      receivedQuantity: 0,
    },
    {
      id: 'RCV003',
      orderNumber: 'PO-2025-003',
      supplier: 'Gamma Industries',
      supplierCode: 'SUPP003',
      documentNumber: 'DDT-12347',
      documentDate: '2025-11-17',
      expectedDate: '2025-11-19',
      receivedDate: '2025-11-19T14:30:00',
      status: 'COMPLETED',
      priority: 3,
      totalLines: 12,
      completedLines: 12,
      totalQuantity: 800,
      receivedQuantity: 800,
      operator: 'luigi.verdi',
    },
    {
      id: 'RCV004',
      orderNumber: 'PO-2025-004',
      supplier: 'Delta Materials',
      supplierCode: 'SUPP004',
      documentNumber: 'DDT-12348',
      documentDate: '2025-11-19',
      expectedDate: '2025-11-21',
      status: 'PENDING',
      priority: 1,
      totalLines: 20,
      completedLines: 0,
      totalQuantity: 2000,
      receivedQuantity: 0,
    },
    {
      id: 'RCV005',
      orderNumber: 'PO-2025-005',
      supplier: 'Epsilon Logistics',
      supplierCode: 'SUPP005',
      documentNumber: 'DDT-12349',
      documentDate: '2025-11-18',
      expectedDate: '2025-11-20',
      status: 'PARTIAL',
      priority: 2,
      totalLines: 10,
      completedLines: 6,
      totalQuantity: 1200,
      receivedQuantity: 720,
      operator: 'giulia.bianchi',
      notes: 'Ricevuto 60%, resto previsto domani',
    },
  ];

  const mockLines: ReceivingLine[] = [
    {
      lineNumber: 1,
      productCode: 'PROD001',
      productDescription: 'Bullone M8x20',
      orderedQuantity: 100,
      receivedQuantity: 100,
      remainingQuantity: 0,
      unit: 'PZ',
      lotNumber: 'LOT20251118A',
      targetLocation: 'A-01-01',
      status: 'COMPLETED',
    },
    {
      lineNumber: 2,
      productCode: 'PROD002',
      productDescription: 'Dado M8',
      orderedQuantity: 200,
      receivedQuantity: 150,
      remainingQuantity: 50,
      unit: 'PZ',
      lotNumber: 'LOT20251118B',
      targetLocation: 'A-02-03',
      status: 'PARTIAL',
    },
    {
      lineNumber: 3,
      productCode: 'PROD003',
      productDescription: 'Rondella Piana M8',
      orderedQuantity: 300,
      receivedQuantity: 0,
      remainingQuantity: 300,
      unit: 'PZ',
      targetLocation: 'B-03-02',
      status: 'PENDING',
    },
  ];

  // Filtering
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === 'TODAY') {
      matchesDate = order.expectedDate === new Date().toISOString().split('T')[0];
    } else if (dateFilter === 'OVERDUE') {
      matchesDate = new Date(order.expectedDate) < new Date() && order.status !== 'COMPLETED';
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Statistics
  const stats = {
    totalOrders: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === 'PENDING').length,
    inProgress: mockOrders.filter((o) => o.status === 'IN_PROGRESS').length,
    partial: mockOrders.filter((o) => o.status === 'PARTIAL').length,
    completed: mockOrders.filter((o) => o.status === 'COMPLETED').length,
    overdue: mockOrders.filter(
      (o) => new Date(o.expectedDate) < new Date() && o.status !== 'COMPLETED'
    ).length,
  };

  const getStatusBadge = (status: ReceivingOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">DA RICEVERE</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">IN CORSO</Badge>;
      case 'PARTIAL':
        return <Badge variant="warning">PARZIALE</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">COMPLETATO</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">ANNULLATO</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLineStatusBadge = (status: ReceivingLine['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">DA RICEVERE</Badge>;
      case 'PARTIAL':
        return <Badge variant="warning">PARZIALE</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">COMPLETATO</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCompletionPercentage = (received: number, total: number) => {
    return total > 0 ? Math.round((received / total) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Ordine',
      sortable: true,
      render: (row: ReceivingOrder) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => {
              setSelectedOrder(row);
              setShowDetailsModal(true);
            }}
          >
            {row.orderNumber}
          </div>
          <div className="text-xs text-gray-600">DDT: {row.documentNumber}</div>
        </div>
      ),
    },
    {
      key: 'supplier',
      label: 'Fornitore',
      sortable: true,
      render: (row: ReceivingOrder) => (
        <div>
          <div className="font-medium">{row.supplier}</div>
          <div className="text-xs text-gray-600">{row.supplierCode}</div>
        </div>
      ),
    },
    {
      key: 'expectedDate',
      label: 'Data Prevista',
      sortable: true,
      render: (row: ReceivingOrder) => {
        const isOverdue = new Date(row.expectedDate) < new Date() && row.status !== 'COMPLETED';
        return (
          <div className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            {formatDate(row.expectedDate)}
            {isOverdue && <div className="text-xs">SCADUTO</div>}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Stato',
      sortable: true,
      render: (row: ReceivingOrder) => getStatusBadge(row.status),
    },
    {
      key: 'priority',
      label: 'Priorità',
      sortable: true,
      render: (row: ReceivingOrder) => (
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
              row.priority === 1 ? 'bg-red-100 text-red-600' :
              row.priority === 2 ? 'bg-orange-100 text-orange-600' :
              'bg-gray-100 text-gray-600'
            }`}
          >
            {row.priority}
          </div>
        </div>
      ),
    },
    {
      key: 'progress',
      label: 'Progresso',
      render: (row: ReceivingOrder) => {
        const percentage = getCompletionPercentage(row.receivedQuantity, row.totalQuantity);
        return (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{row.receivedQuantity} / {row.totalQuantity}</span>
              <span className="text-gray-600">{percentage}%</span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  percentage === 100 ? 'bg-green-500' :
                  percentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {row.completedLines} / {row.totalLines} righe
            </div>
          </div>
        );
      },
    },
    {
      key: 'operator',
      label: 'Operatore',
      render: (row: ReceivingOrder) => (
        <span className="text-sm">{row.operator || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: ReceivingOrder) => (
        <div className="flex gap-2">
          {row.status === 'PENDING' && (
            <Button
              size="sm"
              onClick={() => alert(`Avvia ricevimento ${row.orderNumber}`)}
            >
              Avvia
            </Button>
          )}
          {(row.status === 'IN_PROGRESS' || row.status === 'PARTIAL') && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => alert(`Continua ricevimento ${row.orderNumber}`)}
            >
              Continua
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedOrder(row);
              setShowDetailsModal(true);
            }}
          >
            Dettagli
          </Button>
        </div>
      ),
    },
  ];

  const lineColumns = [
    {
      key: 'lineNumber',
      label: '#',
      render: (row: ReceivingLine) => (
        <span className="font-semibold">{row.lineNumber}</span>
      ),
    },
    {
      key: 'product',
      label: 'Articolo',
      render: (row: ReceivingLine) => (
        <div>
          <div className="font-medium">{row.productCode}</div>
          <div className="text-sm text-gray-600 truncate max-w-xs">{row.productDescription}</div>
        </div>
      ),
    },
    {
      key: 'quantities',
      label: 'Quantità',
      render: (row: ReceivingLine) => (
        <div className="text-sm">
          <div>Ordinato: <span className="font-semibold">{row.orderedQuantity} {row.unit}</span></div>
          <div className="text-green-600">Ricevuto: <span className="font-semibold">{row.receivedQuantity} {row.unit}</span></div>
          <div className="text-orange-600">Rimanente: <span className="font-semibold">{row.remainingQuantity} {row.unit}</span></div>
        </div>
      ),
    },
    {
      key: 'tracking',
      label: 'Tracciabilità',
      render: (row: ReceivingLine) => (
        <div className="text-sm">
          {row.lotNumber && (
            <div className="flex items-center gap-1">
              <Badge variant="info" className="text-xs">LOT</Badge>
              <span className="font-mono">{row.lotNumber}</span>
            </div>
          )}
          {row.expiryDate && (
            <div className="text-xs text-gray-600 mt-1">
              Scad: {formatDate(row.expiryDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'destination',
      label: 'Destinazione',
      render: (row: ReceivingLine) => (
        <div className="text-sm">
          {row.targetLocation && (
            <div className="text-blue-600">{row.targetLocation}</div>
          )}
          {row.targetUDC && (
            <div className="text-gray-600 text-xs">UDC: {row.targetUDC}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stato',
      render: (row: ReceivingLine) => getLineStatusBadge(row.status),
    },
  ];

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Ricevimenti</h1>
          <p className="text-gray-600 mt-1">Gestione ricevimento merce da fornitori</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Esporta
          </Button>
          <Button onClick={() => alert('Crea nuovo ordine di ricevimento')}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuovo Ordine
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Totale Ordini</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Da Ricevere</p>
            <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">In Corso</p>
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Parziali</p>
            <p className="text-3xl font-bold text-orange-600">{stats.partial}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Completati</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">In Ritardo</p>
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cerca</label>
              <input
                type="text"
                placeholder="Ordine, fornitore, DDT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutti gli stati</option>
                <option value="PENDING">Da ricevere</option>
                <option value="IN_PROGRESS">In corso</option>
                <option value="PARTIAL">Parziale</option>
                <option value="COMPLETED">Completato</option>
                <option value="CANCELLED">Annullato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutte le date</option>
                <option value="TODAY">Oggi</option>
                <option value="OVERDUE">In ritardo</option>
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                Trovati <span className="font-semibold">{filteredOrders.length}</span> ordini
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDateFilter('ALL');
                }}
              >
                Reset Filtri
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table columns={columns} data={filteredOrders} />

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun ordine trovato</h3>
            <p className="mt-1 text-sm text-gray-500">Prova a modificare i filtri di ricerca</p>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Dettaglio Ordine {selectedOrder.orderNumber}</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Order Header Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Fornitore</p>
                <p className="font-semibold">{selectedOrder.supplier}</p>
                <p className="text-xs text-gray-500">{selectedOrder.supplierCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documento</p>
                <p className="font-semibold">{selectedOrder.documentNumber}</p>
                <p className="text-xs text-gray-500">Data: {formatDate(selectedOrder.documentDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stato</p>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-800"><strong>Note:</strong> {selectedOrder.notes}</p>
              </div>
            )}

            {/* Order Lines */}
            <h3 className="text-lg font-semibold mb-4">Righe Ordine</h3>
            <Table columns={lineColumns} data={mockLines} />

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button onClick={() => alert('Stampa documenti')} variant="outline">
                Stampa
              </Button>
              <Button onClick={() => alert('Chiudi ordine')} variant="outline">
                Chiudi Ordine
              </Button>
              <Button onClick={() => setShowDetailsModal(false)} className="ml-auto">
                Chiudi
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceivingManagementPage;

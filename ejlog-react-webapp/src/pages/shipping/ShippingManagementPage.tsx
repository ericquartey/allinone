import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

// TypeScript interfaces
interface ShippingOrder {
  id: string;
  orderNumber: string;
  customer: string;
  customerCode: string;
  shipmentNumber: string;
  shipmentDate: string;
  plannedShipDate: string;
  actualShipDate?: string;
  status: 'PENDING' | 'IN_PREPARATION' | 'READY' | 'SHIPPED' | 'CANCELLED';
  priority: number;
  totalLines: number;
  preparedLines: number;
  totalQuantity: number;
  preparedQuantity: number;
  carrier?: string;
  trackingNumber?: string;
  destination: string;
  operator?: string;
  notes?: string;
}

interface ShippingLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  orderedQuantity: number;
  preparedQuantity: number;
  remainingQuantity: number;
  unit: string;
  lotNumber?: string;
  expiryDate?: string;
  sourceLocation?: string;
  sourceUDC?: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

const ShippingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data - in produzione verranno dalle API
  const mockOrders: ShippingOrder[] = [
    {
      id: '1',
      orderNumber: 'SO-2025-001',
      customer: 'Cliente A S.p.A.',
      customerCode: 'CLI001',
      shipmentNumber: 'SHP-001',
      shipmentDate: '2025-11-20',
      plannedShipDate: '2025-11-20',
      status: 'READY',
      priority: 1,
      totalLines: 8,
      preparedLines: 8,
      totalQuantity: 450,
      preparedQuantity: 450,
      carrier: 'DHL Express',
      trackingNumber: 'DHL123456789',
      destination: 'Milano, IT',
      operator: 'M.Rossi',
      notes: 'Spedizione urgente - Cliente premium'
    },
    {
      id: '2',
      orderNumber: 'SO-2025-002',
      customer: 'Cliente B S.r.l.',
      customerCode: 'CLI002',
      shipmentNumber: 'SHP-002',
      shipmentDate: '2025-11-20',
      plannedShipDate: '2025-11-21',
      status: 'IN_PREPARATION',
      priority: 2,
      totalLines: 12,
      preparedLines: 7,
      totalQuantity: 680,
      preparedQuantity: 380,
      carrier: 'UPS Standard',
      destination: 'Roma, IT',
      operator: 'G.Bianchi',
      notes: ''
    },
    {
      id: '3',
      orderNumber: 'SO-2025-003',
      customer: 'Cliente C International',
      customerCode: 'CLI003',
      shipmentNumber: 'SHP-003',
      shipmentDate: '2025-11-19',
      plannedShipDate: '2025-11-19',
      actualShipDate: '2025-11-19',
      status: 'SHIPPED',
      priority: 1,
      totalLines: 5,
      preparedLines: 5,
      totalQuantity: 250,
      preparedQuantity: 250,
      carrier: 'FedEx International',
      trackingNumber: 'FDX987654321',
      destination: 'Berlin, DE',
      operator: 'M.Rossi',
      notes: 'Spedizione internazionale - Documentazione doganale completa'
    },
    {
      id: '4',
      orderNumber: 'SO-2025-004',
      customer: 'Cliente D Logistics',
      customerCode: 'CLI004',
      shipmentNumber: 'SHP-004',
      shipmentDate: '2025-11-20',
      plannedShipDate: '2025-11-22',
      status: 'PENDING',
      priority: 3,
      totalLines: 15,
      preparedLines: 0,
      totalQuantity: 920,
      preparedQuantity: 0,
      destination: 'Torino, IT',
      notes: ''
    },
    {
      id: '5',
      orderNumber: 'SO-2025-005',
      customer: 'Cliente E Distribution',
      customerCode: 'CLI005',
      shipmentNumber: 'SHP-005',
      shipmentDate: '2025-11-18',
      plannedShipDate: '2025-11-18',
      actualShipDate: '2025-11-18',
      status: 'SHIPPED',
      priority: 2,
      totalLines: 10,
      preparedLines: 10,
      totalQuantity: 560,
      preparedQuantity: 560,
      carrier: 'GLS Standard',
      trackingNumber: 'GLS555444333',
      destination: 'Napoli, IT',
      operator: 'A.Verdi',
      notes: ''
    },
    {
      id: '6',
      orderNumber: 'SO-2025-006',
      customer: 'Cliente F Retail',
      customerCode: 'CLI006',
      shipmentNumber: 'SHP-006',
      shipmentDate: '2025-11-20',
      plannedShipDate: '2025-11-23',
      status: 'PENDING',
      priority: 4,
      totalLines: 6,
      preparedLines: 0,
      totalQuantity: 180,
      preparedQuantity: 0,
      destination: 'Firenze, IT',
      notes: 'Ordine standard'
    }
  ];

  const mockLines: Record<string, ShippingLine[]> = {
    '1': [
      { lineNumber: 1, productCode: 'PROD001', productDescription: 'Articolo A', orderedQuantity: 100, preparedQuantity: 100, remainingQuantity: 0, unit: 'PZ', lotNumber: 'LOT2025001', expiryDate: '2026-12-31', sourceLocation: 'A-01-02', sourceUDC: 'UDC-001', status: 'COMPLETED' },
      { lineNumber: 2, productCode: 'PROD002', productDescription: 'Articolo B Premium', orderedQuantity: 50, preparedQuantity: 50, remainingQuantity: 0, unit: 'PZ', lotNumber: 'LOT2025002', expiryDate: '2026-06-30', sourceLocation: 'A-01-03', sourceUDC: 'UDC-002', status: 'COMPLETED' },
      { lineNumber: 3, productCode: 'PROD003', productDescription: 'Articolo C', orderedQuantity: 200, preparedQuantity: 200, remainingQuantity: 0, unit: 'PZ', sourceLocation: 'A-02-01', sourceUDC: 'UDC-003', status: 'COMPLETED' },
      { lineNumber: 4, productCode: 'PROD004', productDescription: 'Articolo D Speciale', orderedQuantity: 100, preparedQuantity: 100, remainingQuantity: 0, unit: 'PZ', lotNumber: 'LOT2025004', sourceLocation: 'B-01-01', sourceUDC: 'UDC-004', status: 'COMPLETED' }
    ],
    '2': [
      { lineNumber: 1, productCode: 'PROD005', productDescription: 'Articolo E', orderedQuantity: 150, preparedQuantity: 150, remainingQuantity: 0, unit: 'PZ', sourceLocation: 'A-03-01', sourceUDC: 'UDC-005', status: 'COMPLETED' },
      { lineNumber: 2, productCode: 'PROD006', productDescription: 'Articolo F', orderedQuantity: 80, preparedQuantity: 80, remainingQuantity: 0, unit: 'PZ', lotNumber: 'LOT2025006', expiryDate: '2027-03-31', sourceLocation: 'A-03-02', sourceUDC: 'UDC-006', status: 'COMPLETED' },
      { lineNumber: 3, productCode: 'PROD007', productDescription: 'Articolo G', orderedQuantity: 120, preparedQuantity: 120, remainingQuantity: 0, unit: 'PZ', sourceLocation: 'B-02-01', sourceUDC: 'UDC-007', status: 'COMPLETED' },
      { lineNumber: 4, productCode: 'PROD008', productDescription: 'Articolo H', orderedQuantity: 90, preparedQuantity: 30, remainingQuantity: 60, unit: 'PZ', sourceLocation: 'B-02-02', sourceUDC: 'UDC-008', status: 'PARTIAL' },
      { lineNumber: 5, productCode: 'PROD009', productDescription: 'Articolo I', orderedQuantity: 240, preparedQuantity: 0, remainingQuantity: 240, unit: 'PZ', status: 'PENDING' }
    ]
  };

  // Calcola le statistiche
  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === 'PENDING').length,
    inPreparation: mockOrders.filter(o => o.status === 'IN_PREPARATION').length,
    ready: mockOrders.filter(o => o.status === 'READY').length,
    shipped: mockOrders.filter(o => o.status === 'SHIPPED').length,
    overdue: mockOrders.filter(o => {
      if (o.status === 'SHIPPED') return false;
      const planned = new Date(o.plannedShipDate);
      const today = new Date();
      return planned < today;
    }).length
  };

  // Filtra gli ordini
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Funzione per ottenere il badge di stato
  const getStatusBadge = (status: ShippingOrder['status']) => {
    const statusConfig = {
      PENDING: { label: 'In Attesa', variant: 'secondary' as const },
      IN_PREPARATION: { label: 'In Preparazione', variant: 'warning' as const },
      READY: { label: 'Pronto', variant: 'info' as const },
      SHIPPED: { label: 'Spedito', variant: 'success' as const },
      CANCELLED: { label: 'Annullato', variant: 'danger' as const }
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Funzione per ottenere il badge di priorità
  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="danger">Urgente</Badge>;
    if (priority === 2) return <Badge variant="warning">Alta</Badge>;
    if (priority === 3) return <Badge variant="info">Media</Badge>;
    return <Badge variant="secondary">Bassa</Badge>;
  };

  // Funzione per verificare se un ordine è in ritardo
  const isOverdue = (order: ShippingOrder) => {
    if (order.status === 'SHIPPED') return false;
    const planned = new Date(order.plannedShipDate);
    const today = new Date();
    return planned < today;
  };

  // Gestione apertura dettaglio
  const handleOpenDetail = (order: ShippingOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Gestione chiusura dettaglio
  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  // Gestione preparazione ordine
  const handlePrepareOrder = (orderId: string) => {
    console.log('Prepare order:', orderId);
    // In produzione: navigare alla pagina di preparazione
    navigate(`/shipping/${orderId}/prepare`);
  };

  // Gestione conferma spedizione
  const handleConfirmShipment = (orderId: string) => {
    console.log('Confirm shipment:', orderId);
    // In produzione: chiamata API per confermare la spedizione
  };

  // Gestione stampa documenti
  const handlePrintDocuments = (orderId: string) => {
    console.log('Print documents:', orderId);
    // In produzione: generare e stampare i documenti di spedizione
  };

  // Gestione cancellazione ordine
  const handleCancelOrder = (orderId: string) => {
    console.log('Cancel order:', orderId);
    // In produzione: chiamata API per cancellare l'ordine
  };

  // Colonne della tabella
  const columns = [
    {
      key: 'orderNumber',
      label: 'N. Ordine',
      render: (row: ShippingOrder) => (
        <div>
          <div className="font-medium">{row.orderNumber}</div>
          <div className="text-xs text-gray-600">{row.shipmentNumber}</div>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Cliente',
      render: (row: ShippingOrder) => (
        <div>
          <div className="font-medium">{row.customer}</div>
          <div className="text-xs text-gray-600">{row.customerCode}</div>
        </div>
      )
    },
    {
      key: 'destination',
      label: 'Destinazione'
    },
    {
      key: 'plannedShipDate',
      label: 'Data Prevista',
      render: (row: ShippingOrder) => (
        <div>
          <div className={isOverdue(row) ? 'text-red-600 font-semibold' : ''}>
            {new Date(row.plannedShipDate).toLocaleDateString('it-IT')}
          </div>
          {row.actualShipDate && (
            <div className="text-xs text-green-600">
              Spedito: {new Date(row.actualShipDate).toLocaleDateString('it-IT')}
            </div>
          )}
          {isOverdue(row) && (
            <div className="text-xs text-red-600">In ritardo!</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      render: (row: ShippingOrder) => getStatusBadge(row.status)
    },
    {
      key: 'priority',
      label: 'Priorità',
      render: (row: ShippingOrder) => getPriorityBadge(row.priority)
    },
    {
      key: 'progress',
      label: 'Progresso',
      render: (row: ShippingOrder) => {
        const percentage = row.totalQuantity > 0
          ? Math.round((row.preparedQuantity / row.totalQuantity) * 100)
          : 0;

        return (
          <div className="min-w-[120px]">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{row.preparedQuantity} / {row.totalQuantity}</span>
              <span className="text-gray-600">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  percentage === 100 ? 'bg-green-500' :
                  percentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {row.preparedLines} / {row.totalLines} righe
            </div>
          </div>
        );
      }
    },
    {
      key: 'carrier',
      label: 'Vettore',
      render: (row: ShippingOrder) => (
        <div>
          {row.carrier && <div className="text-sm">{row.carrier}</div>}
          {row.trackingNumber && (
            <div className="text-xs text-blue-600 font-mono">{row.trackingNumber}</div>
          )}
        </div>
      )
    },
    {
      key: 'operator',
      label: 'Operatore'
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: ShippingOrder) => (
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
              onClick={() => handlePrepareOrder(row.id)}
            >
              Prepara
            </Button>
          )}
          {row.status === 'READY' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleConfirmShipment(row.id)}
            >
              Conferma Spedizione
            </Button>
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Spedizioni</h1>
          <p className="mt-2 text-gray-600">
            Gestisci ordini di spedizione, preparazione e tracking
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
            onClick={() => console.log('Nuovo ordine')}
          >
            Nuovo Ordine
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Totale Ordini</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">In Attesa</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">In Preparazione</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inPreparation}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Pronti</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.ready}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Spediti</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.shipped}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">In Ritardo</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</div>
        </Card>
      </div>

      {/* Filtri */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ricerca
            </label>
            <input
              type="text"
              placeholder="Cerca per ordine, spedizione, cliente, tracking..."
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
              <option value="IN_PREPARATION">In Preparazione</option>
              <option value="READY">Pronto</option>
              <option value="SHIPPED">Spedito</option>
              <option value="CANCELLED">Annullato</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabella ordini */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Ordini di Spedizione ({filteredOrders.length})
          </h2>
        </div>
        <Table
          columns={columns}
          data={filteredOrders}
          keyExtractor={(row) => row.id}
        />
      </Card>

      {/* Modal dettaglio */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Dettaglio Ordine {selectedOrder.orderNumber}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Spedizione: {selectedOrder.shipmentNumber}
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
              {/* Informazioni ordine */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Ordine</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Cliente</div>
                    <div className="font-medium">{selectedOrder.customer}</div>
                    <div className="text-xs text-gray-500">{selectedOrder.customerCode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Destinazione</div>
                    <div className="font-medium">{selectedOrder.destination}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Stato</div>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Priorità</div>
                    <div className="mt-1">{getPriorityBadge(selectedOrder.priority)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Ordine</div>
                    <div className="font-medium">
                      {new Date(selectedOrder.shipmentDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Spedizione Prevista</div>
                    <div className={`font-medium ${isOverdue(selectedOrder) ? 'text-red-600' : ''}`}>
                      {new Date(selectedOrder.plannedShipDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  {selectedOrder.actualShipDate && (
                    <div>
                      <div className="text-sm text-gray-600">Data Spedizione Effettiva</div>
                      <div className="font-medium text-green-600">
                        {new Date(selectedOrder.actualShipDate).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                  {selectedOrder.operator && (
                    <div>
                      <div className="text-sm text-gray-600">Operatore</div>
                      <div className="font-medium">{selectedOrder.operator}</div>
                    </div>
                  )}
                  {selectedOrder.carrier && (
                    <div>
                      <div className="text-sm text-gray-600">Vettore</div>
                      <div className="font-medium">{selectedOrder.carrier}</div>
                    </div>
                  )}
                  {selectedOrder.trackingNumber && (
                    <div>
                      <div className="text-sm text-gray-600">Tracking Number</div>
                      <div className="font-medium font-mono text-blue-600">{selectedOrder.trackingNumber}</div>
                    </div>
                  )}
                </div>
                {selectedOrder.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Note</div>
                    <div className="mt-1 text-gray-900">{selectedOrder.notes}</div>
                  </div>
                )}
              </Card>

              {/* Righe ordine */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Righe Ordine</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riga</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q.tà Ordinata</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q.tà Preparata</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q.tà Rimanente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lotto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scadenza</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provenienza</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(mockLines[selectedOrder.id] || []).map((line) => (
                        <tr key={line.lineNumber} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{line.lineNumber}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/products/${line.productCode}`)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {line.productCode}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm">{line.productDescription}</td>
                          <td className="px-4 py-3 text-sm font-medium">{line.orderedQuantity} {line.unit}</td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">{line.preparedQuantity} {line.unit}</td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">{line.remainingQuantity} {line.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{line.lotNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {line.expiryDate ? new Date(line.expiryDate).toLocaleDateString('it-IT') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {line.sourceLocation && (
                              <button
                                onClick={() => navigate(`/locations/${line.sourceLocation}`)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {line.sourceLocation}
                              </button>
                            )}
                            {line.sourceUDC && (
                              <div>
                                <button
                                  onClick={() => navigate(`/udc/${line.sourceUDC}`)}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  {line.sourceUDC}
                                </button>
                              </div>
                            )}
                            {!line.sourceLocation && !line.sourceUDC && '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {line.status === 'COMPLETED' && <Badge variant="success">Completato</Badge>}
                            {line.status === 'PARTIAL' && <Badge variant="warning">Parziale</Badge>}
                            {line.status === 'PENDING' && <Badge variant="secondary">In Attesa</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Azioni */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handlePrintDocuments(selectedOrder.id)}
                >
                  Stampa Documenti
                </Button>
                {selectedOrder.status === 'PENDING' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                    >
                      Annulla Ordine
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handlePrepareOrder(selectedOrder.id)}
                    >
                      Inizia Preparazione
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'READY' && (
                  <Button
                    variant="success"
                    onClick={() => handleConfirmShipment(selectedOrder.id)}
                  >
                    Conferma Spedizione
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManagementPage;

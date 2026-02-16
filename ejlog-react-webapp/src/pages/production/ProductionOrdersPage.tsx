import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

// TypeScript interfaces
interface ProductionOrder {
  id: string;
  orderNumber: string;
  productCode: string;
  productDescription: string;
  orderType: 'PRODUCTION' | 'ASSEMBLY' | 'DISASSEMBLY' | 'REPACKING';
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  unit: string;
  status: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  workstation?: string;
  operator?: string;
  batchNumber?: string;
  parentOrder?: string;
  notes?: string;
}

interface ProductionComponent {
  lineNumber: number;
  componentCode: string;
  componentDescription: string;
  requiredQuantity: number;
  consumedQuantity: number;
  availableQuantity: number;
  unit: string;
  lotNumber?: string;
  location?: string;
  udcBarcode?: string;
  status: 'PENDING' | 'ALLOCATED' | 'CONSUMED';
}

const ProductionOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data - in produzione verranno dalle API
  const mockOrders: ProductionOrder[] = [
    {
      id: '1',
      orderNumber: 'PO-2025-001',
      productCode: 'FIN001',
      productDescription: 'Prodotto Finito A',
      orderType: 'PRODUCTION',
      plannedQuantity: 1000,
      producedQuantity: 750,
      scrapQuantity: 15,
      unit: 'PZ',
      status: 'IN_PROGRESS',
      priority: 1,
      startDate: '2025-11-18',
      plannedEndDate: '2025-11-20',
      workstation: 'WS-PROD-01',
      operator: 'M.Rossi',
      batchNumber: 'BATCH-2025-001',
      notes: 'Produzione urgente per ordine cliente'
    },
    {
      id: '2',
      orderNumber: 'PO-2025-002',
      productCode: 'FIN002',
      productDescription: 'Prodotto Finito B Premium',
      orderType: 'ASSEMBLY',
      plannedQuantity: 500,
      producedQuantity: 500,
      scrapQuantity: 8,
      unit: 'PZ',
      status: 'COMPLETED',
      priority: 2,
      startDate: '2025-11-15',
      plannedEndDate: '2025-11-17',
      actualEndDate: '2025-11-17',
      workstation: 'WS-ASM-01',
      operator: 'G.Bianchi',
      batchNumber: 'BATCH-2025-002',
      notes: ''
    },
    {
      id: '3',
      orderNumber: 'PO-2025-003',
      productCode: 'FIN003',
      productDescription: 'Prodotto Finito C',
      orderType: 'PRODUCTION',
      plannedQuantity: 2000,
      producedQuantity: 0,
      scrapQuantity: 0,
      unit: 'PZ',
      status: 'RELEASED',
      priority: 3,
      startDate: '2025-11-21',
      plannedEndDate: '2025-11-24',
      workstation: 'WS-PROD-02',
      batchNumber: 'BATCH-2025-003',
      notes: ''
    },
    {
      id: '4',
      orderNumber: 'PO-2025-004',
      productCode: 'KIT001',
      productDescription: 'Kit Assemblaggio Special',
      orderType: 'ASSEMBLY',
      plannedQuantity: 300,
      producedQuantity: 150,
      scrapQuantity: 3,
      unit: 'KIT',
      status: 'IN_PROGRESS',
      priority: 1,
      startDate: '2025-11-19',
      plannedEndDate: '2025-11-21',
      workstation: 'WS-ASM-02',
      operator: 'A.Verdi',
      batchNumber: 'BATCH-2025-004',
      notes: 'Assemblaggio kit promozionale'
    },
    {
      id: '5',
      orderNumber: 'PO-2025-005',
      productCode: 'FIN004',
      productDescription: 'Prodotto Finito D',
      orderType: 'PRODUCTION',
      plannedQuantity: 1500,
      producedQuantity: 0,
      scrapQuantity: 0,
      unit: 'PZ',
      status: 'PLANNED',
      priority: 4,
      startDate: '2025-11-25',
      plannedEndDate: '2025-11-28',
      notes: ''
    },
    {
      id: '6',
      orderNumber: 'PO-2025-006',
      productCode: 'REPACK001',
      productDescription: 'Riconfezionamento Articolo X',
      orderType: 'REPACKING',
      plannedQuantity: 800,
      producedQuantity: 400,
      scrapQuantity: 5,
      unit: 'PZ',
      status: 'IN_PROGRESS',
      priority: 2,
      startDate: '2025-11-19',
      plannedEndDate: '2025-11-22',
      workstation: 'WS-PACK-01',
      operator: 'L.Neri',
      batchNumber: 'BATCH-2025-006',
      notes: 'Cambio packaging per mercato estero'
    }
  ];

  const mockComponents: Record<string, ProductionComponent[]> = {
    '1': [
      { lineNumber: 1, componentCode: 'COMP001', componentDescription: 'Componente Base A', requiredQuantity: 2000, consumedQuantity: 1500, availableQuantity: 5000, unit: 'PZ', lotNumber: 'LOT-C001', location: 'A-05-01', udcBarcode: 'UDC-C001', status: 'CONSUMED' },
      { lineNumber: 2, componentCode: 'COMP002', componentDescription: 'Componente Premium B', requiredQuantity: 1000, consumedQuantity: 750, availableQuantity: 3000, unit: 'PZ', lotNumber: 'LOT-C002', location: 'A-05-02', udcBarcode: 'UDC-C002', status: 'CONSUMED' },
      { lineNumber: 3, componentCode: 'COMP003', componentDescription: 'Materiale di Consumo C', requiredQuantity: 500, consumedQuantity: 375, availableQuantity: 2000, unit: 'PZ', location: 'A-05-03', status: 'CONSUMED' },
      { lineNumber: 4, componentCode: 'PACK001', componentDescription: 'Imballo Primario', requiredQuantity: 1000, consumedQuantity: 750, availableQuantity: 10000, unit: 'PZ', location: 'B-03-01', status: 'CONSUMED' }
    ],
    '2': [
      { lineNumber: 1, componentCode: 'COMP004', componentDescription: 'Componente X', requiredQuantity: 1000, consumedQuantity: 1000, availableQuantity: 2500, unit: 'PZ', lotNumber: 'LOT-C004', location: 'A-06-01', status: 'CONSUMED' },
      { lineNumber: 2, componentCode: 'COMP005', componentDescription: 'Componente Y', requiredQuantity: 500, consumedQuantity: 500, availableQuantity: 1500, unit: 'PZ', lotNumber: 'LOT-C005', location: 'A-06-02', status: 'CONSUMED' }
    ],
    '4': [
      { lineNumber: 1, componentCode: 'COMP006', componentDescription: 'Articolo Kit 1', requiredQuantity: 300, consumedQuantity: 150, availableQuantity: 800, unit: 'PZ', location: 'A-07-01', udcBarcode: 'UDC-K001', status: 'CONSUMED' },
      { lineNumber: 2, componentCode: 'COMP007', componentDescription: 'Articolo Kit 2', requiredQuantity: 600, consumedQuantity: 300, availableQuantity: 1200, unit: 'PZ', location: 'A-07-02', udcBarcode: 'UDC-K002', status: 'CONSUMED' },
      { lineNumber: 3, componentCode: 'COMP008', componentDescription: 'Articolo Kit 3', requiredQuantity: 300, consumedQuantity: 0, availableQuantity: 200, unit: 'PZ', location: 'A-07-03', status: 'ALLOCATED' }
    ]
  };

  // Calcola le statistiche
  const stats = {
    total: mockOrders.length,
    planned: mockOrders.filter(o => o.status === 'PLANNED').length,
    released: mockOrders.filter(o => o.status === 'RELEASED').length,
    inProgress: mockOrders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: mockOrders.filter(o => o.status === 'COMPLETED').length,
    overdue: mockOrders.filter(o => {
      if (o.status === 'COMPLETED' || o.status === 'CANCELLED') return false;
      const planned = new Date(o.plannedEndDate);
      const today = new Date();
      return planned < today;
    }).length
  };

  // Filtra gli ordini
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.batchNumber && order.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.workstation && order.workstation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || order.orderType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Funzione per ottenere il badge di stato
  const getStatusBadge = (status: ProductionOrder['status']) => {
    const statusConfig = {
      PLANNED: { label: 'Pianificato', variant: 'secondary' as const },
      RELEASED: { label: 'Rilasciato', variant: 'info' as const },
      IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const },
      COMPLETED: { label: 'Completato', variant: 'success' as const },
      CANCELLED: { label: 'Annullato', variant: 'danger' as const }
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Funzione per ottenere il badge del tipo
  const getTypeBadge = (type: ProductionOrder['orderType']) => {
    const typeConfig = {
      PRODUCTION: { label: 'Produzione', color: 'bg-blue-100 text-blue-800' },
      ASSEMBLY: { label: 'Assemblaggio', color: 'bg-purple-100 text-purple-800' },
      DISASSEMBLY: { label: 'Disassemblaggio', color: 'bg-orange-100 text-orange-800' },
      REPACKING: { label: 'Riconfezionamento', color: 'bg-teal-100 text-teal-800' }
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

  // Funzione per verificare se un ordine è in ritardo
  const isOverdue = (order: ProductionOrder) => {
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') return false;
    const planned = new Date(order.plannedEndDate);
    const today = new Date();
    return planned < today;
  };

  // Gestione apertura dettaglio
  const handleOpenDetail = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Gestione chiusura dettaglio
  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  // Gestione avvio ordine
  const handleStartOrder = (orderId: string) => {
    console.log('Start order:', orderId);
    // In produzione: chiamata API per avviare l'ordine
  };

  // Gestione completamento ordine
  const handleCompleteOrder = (orderId: string) => {
    console.log('Complete order:', orderId);
    // In produzione: chiamata API per completare l'ordine
  };

  // Gestione stampa documenti
  const handlePrintDocuments = (orderId: string) => {
    console.log('Print documents:', orderId);
    // In produzione: generare e stampare documenti di produzione
  };

  // Colonne della tabella
  const columns = [
    {
      key: 'orderNumber',
      label: 'N. Ordine',
      render: (row: ProductionOrder) => (
        <div>
          <div className="font-medium">{row.orderNumber}</div>
          {row.batchNumber && (
            <div className="text-xs text-gray-600">{row.batchNumber}</div>
          )}
        </div>
      )
    },
    {
      key: 'product',
      label: 'Prodotto',
      render: (row: ProductionOrder) => (
        <div>
          <button
            onClick={() => navigate(`/products/${row.productCode}`)}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {row.productCode}
          </button>
          <div className="text-sm text-gray-600">{row.productDescription}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row: ProductionOrder) => getTypeBadge(row.orderType)
    },
    {
      key: 'quantity',
      label: 'Quantità',
      render: (row: ProductionOrder) => (
        <div>
          <div className="text-sm">
            <span className="font-medium text-blue-600">{row.producedQuantity}</span>
            <span className="text-gray-600"> / {row.plannedQuantity} {row.unit}</span>
          </div>
          {row.scrapQuantity > 0 && (
            <div className="text-xs text-red-600">
              Scarto: {row.scrapQuantity} {row.unit}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progresso',
      render: (row: ProductionOrder) => {
        const percentage = row.plannedQuantity > 0
          ? Math.round((row.producedQuantity / row.plannedQuantity) * 100)
          : 0;

        return (
          <div className="min-w-[120px]">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{percentage}%</span>
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
          </div>
        );
      }
    },
    {
      key: 'dates',
      label: 'Date',
      render: (row: ProductionOrder) => (
        <div className="text-sm">
          <div>Inizio: {new Date(row.startDate).toLocaleDateString('it-IT')}</div>
          <div className={isOverdue(row) ? 'text-red-600 font-semibold' : ''}>
            Fine: {new Date(row.plannedEndDate).toLocaleDateString('it-IT')}
          </div>
          {row.actualEndDate && (
            <div className="text-green-600">
              Completato: {new Date(row.actualEndDate).toLocaleDateString('it-IT')}
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
      render: (row: ProductionOrder) => getStatusBadge(row.status)
    },
    {
      key: 'priority',
      label: 'Priorità',
      render: (row: ProductionOrder) => getPriorityBadge(row.priority)
    },
    {
      key: 'workstation',
      label: 'Postazione',
      render: (row: ProductionOrder) => (
        <div className="text-sm">
          {row.workstation && (
            <button
              onClick={() => navigate(`/workstations/${row.workstation}`)}
              className="text-blue-600 hover:text-blue-800"
            >
              {row.workstation}
            </button>
          )}
          {row.operator && (
            <div className="text-xs text-gray-600">{row.operator}</div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: ProductionOrder) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDetail(row)}
          >
            Dettaglio
          </Button>
          {row.status === 'RELEASED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStartOrder(row.id)}
            >
              Avvia
            </Button>
          )}
          {row.status === 'IN_PROGRESS' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleCompleteOrder(row.id)}
            >
              Completa
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
          <h1 className="text-3xl font-bold text-gray-900">Ordini di Produzione</h1>
          <p className="mt-2 text-gray-600">
            Gestisci ordini di produzione, assemblaggio e lavorazioni
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
          <div className="text-sm font-medium text-gray-600">Pianificati</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.planned}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Rilasciati</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.released}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">In Corso</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Completati</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">In Ritardo</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</div>
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
              placeholder="Cerca per ordine, prodotto, batch, postazione..."
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
              <option value="PLANNED">Pianificato</option>
              <option value="RELEASED">Rilasciato</option>
              <option value="IN_PROGRESS">In Corso</option>
              <option value="COMPLETED">Completato</option>
              <option value="CANCELLED">Annullato</option>
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
              <option value="PRODUCTION">Produzione</option>
              <option value="ASSEMBLY">Assemblaggio</option>
              <option value="DISASSEMBLY">Disassemblaggio</option>
              <option value="REPACKING">Riconfezionamento</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabella ordini */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Ordini di Produzione ({filteredOrders.length})
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
                    {selectedOrder.productDescription}
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
                    <div className="text-sm text-gray-600">Prodotto</div>
                    <button
                      onClick={() => navigate(`/products/${selectedOrder.productCode}`)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {selectedOrder.productCode}
                    </button>
                    <div className="text-xs text-gray-500">{selectedOrder.productDescription}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Tipo Ordine</div>
                    <div className="mt-1">{getTypeBadge(selectedOrder.orderType)}</div>
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
                    <div className="text-sm text-gray-600">Quantità Pianificata</div>
                    <div className="font-medium">{selectedOrder.plannedQuantity} {selectedOrder.unit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Quantità Prodotta</div>
                    <div className="font-medium text-blue-600">{selectedOrder.producedQuantity} {selectedOrder.unit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Quantità Scarto</div>
                    <div className="font-medium text-red-600">{selectedOrder.scrapQuantity} {selectedOrder.unit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Batch</div>
                    <div className="font-medium font-mono">{selectedOrder.batchNumber || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Inizio</div>
                    <div className="font-medium">
                      {new Date(selectedOrder.startDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Fine Prevista</div>
                    <div className={`font-medium ${isOverdue(selectedOrder) ? 'text-red-600' : ''}`}>
                      {new Date(selectedOrder.plannedEndDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  {selectedOrder.actualEndDate && (
                    <div>
                      <div className="text-sm text-gray-600">Data Fine Effettiva</div>
                      <div className="font-medium text-green-600">
                        {new Date(selectedOrder.actualEndDate).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                  {selectedOrder.workstation && (
                    <div>
                      <div className="text-sm text-gray-600">Postazione</div>
                      <button
                        onClick={() => navigate(`/workstations/${selectedOrder.workstation}`)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {selectedOrder.workstation}
                      </button>
                    </div>
                  )}
                  {selectedOrder.operator && (
                    <div>
                      <div className="text-sm text-gray-600">Operatore</div>
                      <div className="font-medium">{selectedOrder.operator}</div>
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

              {/* Componenti */}
              {mockComponents[selectedOrder.id] && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Componenti e Materiali</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riga</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q.tà Richiesta</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q.tà Consumata</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q.tà Disponibile</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lotto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicazione</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mockComponents[selectedOrder.id].map((component) => (
                          <tr key={component.lineNumber} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{component.lineNumber}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => navigate(`/products/${component.componentCode}`)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {component.componentCode}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm">{component.componentDescription}</td>
                            <td className="px-4 py-3 text-sm font-medium">{component.requiredQuantity} {component.unit}</td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">{component.consumedQuantity} {component.unit}</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">{component.availableQuantity} {component.unit}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{component.lotNumber || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              {component.location && (
                                <button
                                  onClick={() => navigate(`/locations/${component.location}`)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {component.location}
                                </button>
                              )}
                              {component.udcBarcode && (
                                <div>
                                  <button
                                    onClick={() => navigate(`/udc/${component.udcBarcode}`)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    {component.udcBarcode}
                                  </button>
                                </div>
                              )}
                              {!component.location && '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {component.status === 'CONSUMED' && <Badge variant="success">Consumato</Badge>}
                              {component.status === 'ALLOCATED' && <Badge variant="info">Allocato</Badge>}
                              {component.status === 'PENDING' && <Badge variant="secondary">In Attesa</Badge>}
                            </td>
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
                  onClick={() => handlePrintDocuments(selectedOrder.id)}
                >
                  Stampa Documenti
                </Button>
                {selectedOrder.status === 'RELEASED' && (
                  <Button
                    variant="primary"
                    onClick={() => handleStartOrder(selectedOrder.id)}
                  >
                    Avvia Produzione
                  </Button>
                )}
                {selectedOrder.status === 'IN_PROGRESS' && (
                  <Button
                    variant="success"
                    onClick={() => handleCompleteOrder(selectedOrder.id)}
                  >
                    Completa Ordine
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

export default ProductionOrdersPage;

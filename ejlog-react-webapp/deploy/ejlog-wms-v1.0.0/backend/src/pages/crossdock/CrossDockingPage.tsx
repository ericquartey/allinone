import { useState } from 'react';
import { ArrowLeft, Search, TruckIcon, Package, Clock, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface CrossDockOperation {
  id: string;
  operationNumber: string;
  inboundShipment: string;
  outboundShipment: string;
  status: 'SCHEDULED' | 'RECEIVING' | 'SORTING' | 'LOADING' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  supplier: string;
  customer: string;
  scheduledArrival: string;
  actualArrival?: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  inboundDock: string;
  outboundDock: string;
  totalItems: number;
  processedItems: number;
  totalPallets: number;
  processedPallets: number;
  operatorAssigned?: string;
  estimatedDuration: number;
  actualDuration?: number;
  type: 'DIRECT' | 'CONSOLIDATION' | 'DECONSOLIDATION' | 'TRANS_SHIPMENT';
}

const CrossDockingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedOperation, setSelectedOperation] = useState<CrossDockOperation | null>(null);

  const mockOperations: CrossDockOperation[] = [
    {
      id: '1',
      operationNumber: 'XD-2025-001',
      inboundShipment: 'IN-5521',
      outboundShipment: 'OUT-3342',
      status: 'RECEIVING',
      priority: 'HIGH',
      supplier: 'Fast Logistics SRL',
      customer: 'Retail Store North',
      scheduledArrival: '2025-11-20 08:00',
      actualArrival: '2025-11-20 08:15',
      scheduledDeparture: '2025-11-20 11:00',
      inboundDock: 'Dock A1',
      outboundDock: 'Dock B3',
      totalItems: 240,
      processedItems: 85,
      totalPallets: 12,
      processedPallets: 4,
      operatorAssigned: 'Mario Rossi',
      estimatedDuration: 180,
      type: 'DIRECT'
    },
    {
      id: '2',
      operationNumber: 'XD-2025-002',
      inboundShipment: 'IN-5522',
      outboundShipment: 'OUT-3343',
      status: 'SORTING',
      priority: 'URGENT',
      supplier: 'Express Cargo Ltd',
      customer: 'Distribution Hub South',
      scheduledArrival: '2025-11-20 06:00',
      actualArrival: '2025-11-20 06:05',
      scheduledDeparture: '2025-11-20 10:00',
      inboundDock: 'Dock A2',
      outboundDock: 'Dock B4',
      totalItems: 180,
      processedItems: 140,
      totalPallets: 9,
      processedPallets: 7,
      operatorAssigned: 'Laura Bianchi',
      estimatedDuration: 240,
      actualDuration: 190,
      type: 'CONSOLIDATION'
    },
    {
      id: '3',
      operationNumber: 'XD-2025-003',
      inboundShipment: 'IN-5523',
      outboundShipment: 'OUT-3344',
      status: 'LOADING',
      priority: 'HIGH',
      supplier: 'Global Freight Inc',
      customer: 'Mega Store East',
      scheduledArrival: '2025-11-20 07:00',
      actualArrival: '2025-11-20 07:10',
      scheduledDeparture: '2025-11-20 12:00',
      inboundDock: 'Dock A3',
      outboundDock: 'Dock B1',
      totalItems: 320,
      processedItems: 310,
      totalPallets: 16,
      processedPallets: 15,
      operatorAssigned: 'Giuseppe Verdi',
      estimatedDuration: 300,
      type: 'DECONSOLIDATION'
    },
    {
      id: '4',
      operationNumber: 'XD-2025-004',
      inboundShipment: 'IN-5524',
      outboundShipment: 'OUT-3345',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      supplier: 'Swift Transport SA',
      customer: 'Wholesale Center',
      scheduledArrival: '2025-11-19 14:00',
      actualArrival: '2025-11-19 14:20',
      scheduledDeparture: '2025-11-19 17:00',
      actualDeparture: '2025-11-19 16:45',
      inboundDock: 'Dock A4',
      outboundDock: 'Dock B2',
      totalItems: 150,
      processedItems: 150,
      totalPallets: 8,
      processedPallets: 8,
      operatorAssigned: 'Anna Neri',
      estimatedDuration: 180,
      actualDuration: 165,
      type: 'DIRECT'
    },
    {
      id: '5',
      operationNumber: 'XD-2025-005',
      inboundShipment: 'IN-5525',
      outboundShipment: 'OUT-3346',
      status: 'SCHEDULED',
      priority: 'MEDIUM',
      supplier: 'Premium Delivery Co',
      customer: 'Branch Office West',
      scheduledArrival: '2025-11-20 13:00',
      scheduledDeparture: '2025-11-20 16:00',
      inboundDock: 'Dock A1',
      outboundDock: 'Dock B3',
      totalItems: 200,
      processedItems: 0,
      totalPallets: 10,
      processedPallets: 0,
      estimatedDuration: 180,
      type: 'TRANS_SHIPMENT'
    },
    {
      id: '6',
      operationNumber: 'XD-2025-006',
      inboundShipment: 'IN-5526',
      outboundShipment: 'OUT-3347',
      status: 'DELAYED',
      priority: 'HIGH',
      supplier: 'Quick Ship Express',
      customer: 'Retail Chain HQ',
      scheduledArrival: '2025-11-20 09:00',
      scheduledDeparture: '2025-11-20 13:00',
      inboundDock: 'Dock A2',
      outboundDock: 'Dock B4',
      totalItems: 280,
      processedItems: 0,
      totalPallets: 14,
      processedPallets: 0,
      estimatedDuration: 240,
      type: 'CONSOLIDATION'
    }
  ];

  const filteredOperations = mockOperations.filter(op => {
    const matchesSearch = op.operationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.inboundShipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.outboundShipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || op.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalOperations = mockOperations.length;
  const activeOperations = mockOperations.filter(o => ['RECEIVING', 'SORTING', 'LOADING'].includes(o.status)).length;
  const completedToday = mockOperations.filter(o => o.status === 'COMPLETED').length;
  const avgThroughput = mockOperations.filter(o => o.actualDuration).reduce((sum, o) => sum + (o.totalItems / (o.actualDuration! / 60)), 0) / mockOperations.filter(o => o.actualDuration).length || 0;

  const getStatusBadge = (status: CrossDockOperation['status']) => {
    const variants: Record<CrossDockOperation['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      SCHEDULED: 'info',
      RECEIVING: 'warning',
      SORTING: 'warning',
      LOADING: 'warning',
      COMPLETED: 'success',
      DELAYED: 'danger',
      CANCELLED: 'default'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: CrossDockOperation['priority']) => {
    const variants: Record<CrossDockOperation['priority'], 'default' | 'warning' | 'danger'> = {
      LOW: 'default',
      MEDIUM: 'warning',
      HIGH: 'warning',
      URGENT: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getTypeBadge = (type: CrossDockOperation['type']) => {
    const colors: Record<CrossDockOperation['type'], string> = {
      DIRECT: 'bg-blue-100 text-blue-800',
      CONSOLIDATION: 'bg-purple-100 text-purple-800',
      DECONSOLIDATION: 'bg-orange-100 text-orange-800',
      TRANS_SHIPMENT: 'bg-teal-100 text-teal-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>{type.replace('_', ' ')}</span>;
  };

  const getProgressPercentage = (processed: number, total: number) => {
    return total > 0 ? Math.round((processed / total) * 100) : 0;
  };

  const columns = [
    { header: 'Operation #', accessor: 'operationNumber' as keyof CrossDockOperation },
    {
      header: 'Type',
      accessor: 'type' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => getTypeBadge(op.type)
    },
    {
      header: 'Status',
      accessor: 'status' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => getStatusBadge(op.status)
    },
    {
      header: 'Priority',
      accessor: 'priority' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => getPriorityBadge(op.priority)
    },
    {
      header: 'Inbound → Outbound',
      accessor: 'inboundShipment' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => (
        <div className="text-sm">
          <div className="font-medium">{op.inboundShipment} → {op.outboundShipment}</div>
          <div className="text-gray-500 text-xs">{op.inboundDock} → {op.outboundDock}</div>
        </div>
      )
    },
    {
      header: 'Supplier → Customer',
      accessor: 'supplier' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => (
        <div className="text-sm max-w-xs">
          <div className="font-medium truncate">{op.supplier}</div>
          <div className="text-gray-500 text-xs truncate">{op.customer}</div>
        </div>
      )
    },
    {
      header: 'Progress',
      accessor: 'processedItems' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => {
        const percentage = getProgressPercentage(op.processedItems, op.totalItems);
        return (
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span>{op.processedItems}/{op.totalItems} items</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Timeline',
      accessor: 'scheduledArrival' as keyof CrossDockOperation,
      render: (op: CrossDockOperation) => (
        <div className="text-xs">
          <div>Arrival: {op.actualArrival || op.scheduledArrival}</div>
          <div>Departure: {op.actualDeparture || op.scheduledDeparture}</div>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cross-Docking Operations</h1>
            <p className="text-gray-600 mt-1">Manage direct transfer operations from inbound to outbound</p>
          </div>
          <Button variant="primary">
            <TruckIcon className="w-4 h-4 mr-2" />
            New Operation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Operations</p>
              <p className="text-2xl font-bold text-gray-900">{totalOperations}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-orange-600">{activeOperations}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">{completedToday}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Throughput</p>
              <p className="text-2xl font-bold text-gray-900">{avgThroughput.toFixed(0)}</p>
              <p className="text-xs text-gray-500">items/hour</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="RECEIVING">Receiving</option>
            <option value="SORTING">Sorting</option>
            <option value="LOADING">Loading</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="DIRECT">Direct</option>
            <option value="CONSOLIDATION">Consolidation</option>
            <option value="DECONSOLIDATION">Deconsolidation</option>
            <option value="TRANS_SHIPMENT">Trans-shipment</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredOperations}
          onRowClick={(op) => setSelectedOperation(op)}
        />
      </Card>

      {selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Operation: {selectedOperation.operationNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedOperation(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                  {getTypeBadge(selectedOperation.type)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedOperation.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  {getPriorityBadge(selectedOperation.priority)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned Operator</h3>
                  <p className="text-gray-900">{selectedOperation.operatorAssigned || 'Not assigned'}</p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Shipment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Inbound</h4>
                    <p className="font-medium">{selectedOperation.inboundShipment}</p>
                    <p className="text-sm text-gray-600">From: {selectedOperation.supplier}</p>
                    <p className="text-sm text-gray-600">Dock: {selectedOperation.inboundDock}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Outbound</h4>
                    <p className="font-medium">{selectedOperation.outboundShipment}</p>
                    <p className="text-sm text-gray-600">To: {selectedOperation.customer}</p>
                    <p className="text-sm text-gray-600">Dock: {selectedOperation.outboundDock}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Items Processing</span>
                      <span className="text-sm">{selectedOperation.processedItems} / {selectedOperation.totalItems}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${getProgressPercentage(selectedOperation.processedItems, selectedOperation.totalItems)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Pallets Processing</span>
                      <span className="text-sm">{selectedOperation.processedPallets} / {selectedOperation.totalPallets}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{ width: `${getProgressPercentage(selectedOperation.processedPallets, selectedOperation.totalPallets)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scheduled Arrival:</span>
                    <span className="font-medium">{selectedOperation.scheduledArrival}</span>
                  </div>
                  {selectedOperation.actualArrival && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actual Arrival:</span>
                      <span className="font-medium text-green-600">{selectedOperation.actualArrival}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scheduled Departure:</span>
                    <span className="font-medium">{selectedOperation.scheduledDeparture}</span>
                  </div>
                  {selectedOperation.actualDeparture && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actual Departure:</span>
                      <span className="font-medium text-green-600">{selectedOperation.actualDeparture}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Estimated Duration:</span>
                    <span className="font-medium">{selectedOperation.estimatedDuration} min</span>
                  </div>
                  {selectedOperation.actualDuration && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actual Duration:</span>
                      <span className={`font-medium ${selectedOperation.actualDuration > selectedOperation.estimatedDuration ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedOperation.actualDuration} min
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossDockingPage;

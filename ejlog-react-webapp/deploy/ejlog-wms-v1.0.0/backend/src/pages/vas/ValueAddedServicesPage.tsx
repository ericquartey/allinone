import { useState } from 'react';
import { ArrowLeft, Search, Package, Wrench, Tag, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface VASOrder {
  id: string;
  orderNumber: string;
  serviceType: 'LABELING' | 'KITTING' | 'PACKAGING' | 'ASSEMBLY' | 'QUALITY_CHECK' | 'CUSTOMIZATION' | 'GIFT_WRAP' | 'REPACK';
  status: 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customer: string;
  productCode: string;
  productName: string;
  quantity: number;
  completedQuantity: number;
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  assignedOperator?: string;
  workstation?: string;
  estimatedTime: number;
  actualTime?: number;
  unitPrice: number;
  totalPrice: number;
  instructions?: string;
}

const ValueAddedServicesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<VASOrder | null>(null);

  const mockOrders: VASOrder[] = [
    {
      id: '1',
      orderNumber: 'VAS-2025-001',
      serviceType: 'LABELING',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      customer: 'Retail Chain North',
      productCode: 'PROD-1523',
      productName: 'Electronic Device A',
      quantity: 500,
      completedQuantity: 320,
      requestedDate: '2025-11-18',
      scheduledDate: '2025-11-20 08:00',
      assignedOperator: 'Mario Rossi',
      workstation: 'VAS-STATION-1',
      estimatedTime: 180,
      unitPrice: 0.50,
      totalPrice: 250.00,
      instructions: 'Apply promotional labels on top surface'
    },
    {
      id: '2',
      orderNumber: 'VAS-2025-002',
      serviceType: 'KITTING',
      status: 'SCHEDULED',
      priority: 'URGENT',
      customer: 'E-commerce Platform',
      productCode: 'KIT-8845',
      productName: 'Starter Kit Bundle',
      quantity: 200,
      completedQuantity: 0,
      requestedDate: '2025-11-19',
      scheduledDate: '2025-11-20 14:00',
      assignedOperator: 'Laura Bianchi',
      workstation: 'VAS-STATION-3',
      estimatedTime: 240,
      unitPrice: 3.50,
      totalPrice: 700.00,
      instructions: 'Assemble 5 components per kit with instruction manual'
    },
    {
      id: '3',
      orderNumber: 'VAS-2025-003',
      serviceType: 'GIFT_WRAP',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      customer: 'Premium Store',
      productCode: 'PROD-3421',
      productName: 'Luxury Item Set',
      quantity: 80,
      completedQuantity: 80,
      requestedDate: '2025-11-17',
      scheduledDate: '2025-11-19 10:00',
      completedDate: '2025-11-19 13:45',
      assignedOperator: 'Giuseppe Verdi',
      workstation: 'VAS-STATION-2',
      estimatedTime: 120,
      actualTime: 115,
      unitPrice: 2.00,
      totalPrice: 160.00,
      instructions: 'Premium gift wrapping with branded ribbon'
    },
    {
      id: '4',
      orderNumber: 'VAS-2025-004',
      serviceType: 'QUALITY_CHECK',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      customer: 'Manufacturing Co',
      productCode: 'PROD-7788',
      productName: 'Industrial Component',
      quantity: 1000,
      completedQuantity: 650,
      requestedDate: '2025-11-18',
      scheduledDate: '2025-11-20 06:00',
      assignedOperator: 'Anna Neri',
      workstation: 'QC-STATION-1',
      estimatedTime: 300,
      unitPrice: 0.75,
      totalPrice: 750.00,
      instructions: 'Visual inspection and measurement verification'
    },
    {
      id: '5',
      orderNumber: 'VAS-2025-005',
      serviceType: 'REPACK',
      status: 'REQUESTED',
      priority: 'MEDIUM',
      customer: 'Distribution Hub',
      productCode: 'PROD-5512',
      productName: 'Bulk Product',
      quantity: 300,
      completedQuantity: 0,
      requestedDate: '2025-11-20',
      estimatedTime: 150,
      unitPrice: 1.20,
      totalPrice: 360.00,
      instructions: 'Repack from bulk to retail packaging'
    },
    {
      id: '6',
      orderNumber: 'VAS-2025-006',
      serviceType: 'CUSTOMIZATION',
      status: 'ON_HOLD',
      priority: 'LOW',
      customer: 'Corporate Client',
      productCode: 'PROD-9932',
      productName: 'Custom Merchandise',
      quantity: 150,
      completedQuantity: 0,
      requestedDate: '2025-11-19',
      estimatedTime: 200,
      unitPrice: 4.00,
      totalPrice: 600.00,
      instructions: 'Apply custom logo - waiting for artwork approval'
    },
    {
      id: '7',
      orderNumber: 'VAS-2025-007',
      serviceType: 'ASSEMBLY',
      status: 'SCHEDULED',
      priority: 'HIGH',
      customer: 'Furniture Store',
      productCode: 'FURN-2234',
      productName: 'Display Unit',
      quantity: 50,
      completedQuantity: 0,
      requestedDate: '2025-11-18',
      scheduledDate: '2025-11-20 12:00',
      assignedOperator: 'Paolo Blu',
      workstation: 'VAS-STATION-4',
      estimatedTime: 180,
      unitPrice: 15.00,
      totalPrice: 750.00,
      instructions: 'Pre-assembly of furniture components'
    }
  ];

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesService = serviceFilter === 'ALL' || order.serviceType === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const totalOrders = mockOrders.length;
  const activeOrders = mockOrders.filter(o => ['SCHEDULED', 'IN_PROGRESS'].includes(o.status)).length;
  const totalRevenue = mockOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalPrice, 0);
  const avgCompletionTime = mockOrders.filter(o => o.actualTime).reduce((sum, o) => sum + (o.actualTime || 0), 0) / mockOrders.filter(o => o.actualTime).length || 0;

  const getStatusBadge = (status: VASOrder['status']) => {
    const variants: Record<VASOrder['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      REQUESTED: 'info',
      SCHEDULED: 'warning',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      ON_HOLD: 'danger',
      CANCELLED: 'default'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: VASOrder['priority']) => {
    const variants: Record<VASOrder['priority'], 'default' | 'warning' | 'danger'> = {
      LOW: 'default',
      MEDIUM: 'warning',
      HIGH: 'warning',
      URGENT: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getServiceBadge = (service: VASOrder['serviceType']) => {
    const colors: Record<VASOrder['serviceType'], string> = {
      LABELING: 'bg-blue-100 text-blue-800',
      KITTING: 'bg-purple-100 text-purple-800',
      PACKAGING: 'bg-green-100 text-green-800',
      ASSEMBLY: 'bg-orange-100 text-orange-800',
      QUALITY_CHECK: 'bg-red-100 text-red-800',
      CUSTOMIZATION: 'bg-indigo-100 text-indigo-800',
      GIFT_WRAP: 'bg-pink-100 text-pink-800',
      REPACK: 'bg-teal-100 text-teal-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[service]}`}>{service.replace('_', ' ')}</span>;
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const columns = [
    { header: 'Order #', accessor: 'orderNumber' as keyof VASOrder },
    {
      header: 'Service Type',
      accessor: 'serviceType' as keyof VASOrder,
      render: (order: VASOrder) => getServiceBadge(order.serviceType)
    },
    {
      header: 'Status',
      accessor: 'status' as keyof VASOrder,
      render: (order: VASOrder) => getStatusBadge(order.status)
    },
    {
      header: 'Priority',
      accessor: 'priority' as keyof VASOrder,
      render: (order: VASOrder) => getPriorityBadge(order.priority)
    },
    { header: 'Customer', accessor: 'customer' as keyof VASOrder },
    {
      header: 'Product',
      accessor: 'productCode' as keyof VASOrder,
      render: (order: VASOrder) => (
        <div className="text-sm">
          <div className="font-medium">{order.productCode}</div>
          <div className="text-gray-500 text-xs truncate max-w-xs">{order.productName}</div>
        </div>
      )
    },
    {
      header: 'Progress',
      accessor: 'completedQuantity' as keyof VASOrder,
      render: (order: VASOrder) => {
        const percentage = getProgressPercentage(order.completedQuantity, order.quantity);
        return (
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span>{order.completedQuantity}/{order.quantity}</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Total Price',
      accessor: 'totalPrice' as keyof VASOrder,
      render: (order: VASOrder) => <span className="font-medium">€{order.totalPrice.toFixed(2)}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Value-Added Services</h1>
            <p className="text-gray-600 mt-1">Manage additional services and customizations</p>
          </div>
          <Button variant="primary">
            <Wrench className="w-4 h-4 mr-2" />
            New Service Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-orange-600">{activeOrders}</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgCompletionTime.toFixed(0)}</p>
              <p className="text-xs text-gray-500">minutes</p>
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
              placeholder="Search orders..."
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
            <option value="REQUESTED">Requested</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Services</option>
            <option value="LABELING">Labeling</option>
            <option value="KITTING">Kitting</option>
            <option value="PACKAGING">Packaging</option>
            <option value="ASSEMBLY">Assembly</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="CUSTOMIZATION">Customization</option>
            <option value="GIFT_WRAP">Gift Wrap</option>
            <option value="REPACK">Repack</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredOrders}
          onRowClick={(order) => setSelectedOrder(order)}
        />
      </Card>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Order: {selectedOrder.orderNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Service Type</h3>
                  {getServiceBadge(selectedOrder.serviceType)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  {getPriorityBadge(selectedOrder.priority)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                  <p className="text-gray-900">{selectedOrder.customer}</p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Code:</span>
                    <span className="font-medium">{selectedOrder.productCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Name:</span>
                    <span className="font-medium">{selectedOrder.productName}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="font-bold text-lg">{selectedOrder.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed:</span>
                    <span className="font-bold text-green-600">{selectedOrder.completedQuantity} units</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unit Price:</span>
                    <span className="font-medium">€{selectedOrder.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Total Price:</span>
                    <span className="font-bold text-xl text-green-600">€{selectedOrder.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requested Date:</span>
                    <span className="font-medium">{selectedOrder.requestedDate}</span>
                  </div>
                  {selectedOrder.scheduledDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Scheduled Date:</span>
                      <span className="font-medium">{selectedOrder.scheduledDate}</span>
                    </div>
                  )}
                  {selectedOrder.completedDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed Date:</span>
                      <span className="font-medium text-green-600">{selectedOrder.completedDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Estimated Time:</span>
                    <span className="font-medium">{selectedOrder.estimatedTime} min</span>
                  </div>
                  {selectedOrder.actualTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actual Time:</span>
                      <span className={`font-medium ${selectedOrder.actualTime > selectedOrder.estimatedTime ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedOrder.actualTime} min
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedOrder.assignedOperator || selectedOrder.workstation) && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Assignment</h3>
                  <div className="space-y-3">
                    {selectedOrder.assignedOperator && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Operator:</span>
                        <span className="font-medium">{selectedOrder.assignedOperator}</span>
                      </div>
                    )}
                    {selectedOrder.workstation && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Workstation:</span>
                        <span className="font-medium">{selectedOrder.workstation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.instructions && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Instructions</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded">{selectedOrder.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueAddedServicesPage;

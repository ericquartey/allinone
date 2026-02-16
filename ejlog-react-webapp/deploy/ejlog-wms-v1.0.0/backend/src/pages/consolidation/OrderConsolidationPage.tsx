import { useState } from 'react';
import { ArrowLeft, Search, Package, Users, TruckIcon, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface ConsolidationGroup {
  id: string;
  groupNumber: string;
  status: 'PLANNING' | 'CONSOLIDATING' | 'READY' | 'SHIPPED' | 'CANCELLED';
  customer: string;
  destination: string;
  ordersCount: number;
  totalLines: number;
  totalUnits: number;
  totalWeight: number;
  totalVolume: number;
  carrier: string;
  shipmentType: 'STANDARD' | 'EXPRESS' | 'ECONOMY' | 'NEXT_DAY';
  createdDate: string;
  consolidationDate?: string;
  shipDate?: string;
  estimatedDelivery: string;
  pallets: number;
  packagesCount: number;
}

const OrderConsolidationPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shipmentFilter, setShipmentFilter] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<ConsolidationGroup | null>(null);

  const mockGroups: ConsolidationGroup[] = [
    {
      id: '1',
      groupNumber: 'CONS-2025-001',
      status: 'CONSOLIDATING',
      customer: 'ABC Retail Chain',
      destination: 'Milan Distribution Center',
      ordersCount: 8,
      totalLines: 45,
      totalUnits: 1200,
      totalWeight: 850.5,
      totalVolume: 12.5,
      carrier: 'Express Logistics SRL',
      shipmentType: 'STANDARD',
      createdDate: '2025-11-19',
      consolidationDate: '2025-11-20 08:00',
      estimatedDelivery: '2025-11-22',
      pallets: 4,
      packagesCount: 15
    },
    {
      id: '2',
      groupNumber: 'CONS-2025-002',
      status: 'READY',
      customer: 'Premium Store Network',
      destination: 'Rome Hub',
      ordersCount: 12,
      totalLines: 68,
      totalUnits: 2400,
      totalWeight: 1450.0,
      totalVolume: 22.0,
      carrier: 'Fast Transport Co',
      shipmentType: 'EXPRESS',
      createdDate: '2025-11-18',
      consolidationDate: '2025-11-19 14:00',
      shipDate: '2025-11-20',
      estimatedDelivery: '2025-11-21',
      pallets: 7,
      packagesCount: 28
    },
    {
      id: '3',
      groupNumber: 'CONS-2025-003',
      status: 'PLANNING',
      customer: 'Wholesale Partners Ltd',
      destination: 'Naples Warehouse',
      ordersCount: 5,
      totalLines: 32,
      totalUnits: 800,
      totalWeight: 520.0,
      totalVolume: 8.0,
      carrier: 'Economy Freight Inc',
      shipmentType: 'ECONOMY',
      createdDate: '2025-11-20',
      estimatedDelivery: '2025-11-25',
      pallets: 3,
      packagesCount: 10
    },
    {
      id: '4',
      groupNumber: 'CONS-2025-004',
      status: 'SHIPPED',
      customer: 'E-commerce Platform',
      destination: 'Turin Center',
      ordersCount: 15,
      totalLines: 89,
      totalUnits: 3500,
      totalWeight: 2100.5,
      totalVolume: 35.0,
      carrier: 'Premium Delivery SA',
      shipmentType: 'NEXT_DAY',
      createdDate: '2025-11-17',
      consolidationDate: '2025-11-18 09:00',
      shipDate: '2025-11-19',
      estimatedDelivery: '2025-11-20',
      pallets: 10,
      packagesCount: 42
    },
    {
      id: '5',
      groupNumber: 'CONS-2025-005',
      status: 'CONSOLIDATING',
      customer: 'Regional Distributors',
      destination: 'Florence Depot',
      ordersCount: 6,
      totalLines: 38,
      totalUnits: 950,
      totalWeight: 680.0,
      totalVolume: 10.5,
      carrier: 'Express Logistics SRL',
      shipmentType: 'STANDARD',
      createdDate: '2025-11-19',
      consolidationDate: '2025-11-20 10:00',
      estimatedDelivery: '2025-11-23',
      pallets: 3,
      packagesCount: 12
    },
    {
      id: '6',
      groupNumber: 'CONS-2025-006',
      status: 'READY',
      customer: 'Department Store Group',
      destination: 'Venice Distribution',
      ordersCount: 10,
      totalLines: 55,
      totalUnits: 1800,
      totalWeight: 1200.0,
      totalVolume: 18.0,
      carrier: 'Fast Transport Co',
      shipmentType: 'EXPRESS',
      createdDate: '2025-11-18',
      consolidationDate: '2025-11-19 16:00',
      estimatedDelivery: '2025-11-21',
      pallets: 6,
      packagesCount: 20
    }
  ];

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.groupNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || group.status === statusFilter;
    const matchesShipment = shipmentFilter === 'ALL' || group.shipmentType === shipmentFilter;
    return matchesSearch && matchesStatus && matchesShipment;
  });

  const totalGroups = mockGroups.length;
  const activeGroups = mockGroups.filter(g => ['PLANNING', 'CONSOLIDATING', 'READY'].includes(g.status)).length;
  const readyToShip = mockGroups.filter(g => g.status === 'READY').length;
  const totalUnits = mockGroups.reduce((sum, g) => sum + g.totalUnits, 0);

  const getStatusBadge = (status: ConsolidationGroup['status']) => {
    const variants: Record<ConsolidationGroup['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      PLANNING: 'info',
      CONSOLIDATING: 'warning',
      READY: 'success',
      SHIPPED: 'default',
      CANCELLED: 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getShipmentTypeBadge = (type: ConsolidationGroup['shipmentType']) => {
    const colors: Record<ConsolidationGroup['shipmentType'], string> = {
      STANDARD: 'bg-blue-100 text-blue-800',
      EXPRESS: 'bg-orange-100 text-orange-800',
      ECONOMY: 'bg-gray-100 text-gray-800',
      NEXT_DAY: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>{type.replace('_', ' ')}</span>;
  };

  const columns = [
    { header: 'Group #', accessor: 'groupNumber' as keyof ConsolidationGroup },
    {
      header: 'Status',
      accessor: 'status' as keyof ConsolidationGroup,
      render: (group: ConsolidationGroup) => getStatusBadge(group.status)
    },
    {
      header: 'Customer',
      accessor: 'customer' as keyof ConsolidationGroup,
      render: (group: ConsolidationGroup) => (
        <div className="text-sm">
          <div className="font-medium">{group.customer}</div>
          <div className="text-gray-500 text-xs">{group.destination}</div>
        </div>
      )
    },
    {
      header: 'Orders / Lines',
      accessor: 'ordersCount' as keyof ConsolidationGroup,
      render: (group: ConsolidationGroup) => (
        <div className="text-sm">
          <div className="font-medium">{group.ordersCount} orders</div>
          <div className="text-gray-500 text-xs">{group.totalLines} lines</div>
        </div>
      )
    },
    {
      header: 'Units',
      accessor: 'totalUnits' as keyof ConsolidationGroup,
      render: (group: ConsolidationGroup) => <span className="font-medium">{group.totalUnits.toLocaleString()}</span>
    },
    {
      header: 'Weight / Volume',
      accessor: 'totalWeight' as keyof ConsolidationGroup,
      render: (group: ConsolidationGroup) => (
        <div className="text-xs">
          <div>{group.totalWeight.toFixed(1)} kg</div>
          <div className="text-gray-500">{group.totalVolume.toFixed(1)} m³</div>
        </div>
      )
    },
    {
      header: 'Shipment Type',
      accessor: 'shipmentType' as keyof ConsolidationGroup,
      render: (group: ConsolidationGroup) => getShipmentTypeBadge(group.shipmentType)
    },
    {
      header: 'Carrier',
      accessor: 'carrier' as keyof ConsolidationGroup
    },
    {
      header: 'Est. Delivery',
      accessor: 'estimatedDelivery' as keyof ConsolidationGroup
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
            <h1 className="text-2xl font-bold text-gray-900">Order Consolidation</h1>
            <p className="text-gray-600 mt-1">Combine multiple orders for efficient shipping</p>
          </div>
          <Button variant="primary">
            <Users className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold text-gray-900">{totalGroups}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-orange-600">{activeGroups}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ready to Ship</p>
              <p className="text-2xl font-bold text-green-600">{readyToShip}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</p>
            </div>
            <TruckIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search groups..."
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
            <option value="PLANNING">Planning</option>
            <option value="CONSOLIDATING">Consolidating</option>
            <option value="READY">Ready</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={shipmentFilter}
            onChange={(e) => setShipmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Shipment Types</option>
            <option value="STANDARD">Standard</option>
            <option value="EXPRESS">Express</option>
            <option value="ECONOMY">Economy</option>
            <option value="NEXT_DAY">Next Day</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredGroups}
          onRowClick={(group) => setSelectedGroup(group)}
        />
      </Card>

      {selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Group: {selectedGroup.groupNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedGroup(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedGroup.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Shipment Type</h3>
                  {getShipmentTypeBadge(selectedGroup.shipmentType)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                  <p className="text-gray-900">{selectedGroup.customer}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Destination</h3>
                  <p className="text-gray-900">{selectedGroup.destination}</p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-blue-600 mb-1">Orders</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedGroup.ordersCount}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-sm text-purple-600 mb-1">Total Lines</p>
                    <p className="text-2xl font-bold text-purple-900">{selectedGroup.totalLines}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-green-600 mb-1">Total Units</p>
                    <p className="text-2xl font-bold text-green-900">{selectedGroup.totalUnits.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Shipment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Weight:</span>
                    <span className="font-medium">{selectedGroup.totalWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Volume:</span>
                    <span className="font-medium">{selectedGroup.totalVolume.toFixed(2)} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pallets:</span>
                    <span className="font-medium">{selectedGroup.pallets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Packages:</span>
                    <span className="font-medium">{selectedGroup.packagesCount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Carrier:</span>
                    <span className="font-medium">{selectedGroup.carrier}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created Date:</span>
                    <span className="font-medium">{selectedGroup.createdDate}</span>
                  </div>
                  {selectedGroup.consolidationDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Consolidation Date:</span>
                      <span className="font-medium">{selectedGroup.consolidationDate}</span>
                    </div>
                  )}
                  {selectedGroup.shipDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ship Date:</span>
                      <span className="font-medium text-green-600">{selectedGroup.shipDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Estimated Delivery:</span>
                    <span className="font-bold text-blue-600">{selectedGroup.estimatedDelivery}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConsolidationPage;

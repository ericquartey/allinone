import { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface InventoryAdjustment {
  id: string;
  adjustmentNumber: string;
  type: 'INCREASE' | 'DECREASE' | 'TRANSFER' | 'DAMAGE' | 'CORRECTION' | 'FOUND' | 'LOST';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  productCode: string;
  productName: string;
  location: string;
  quantityBefore: number;
  quantityAdjustment: number;
  quantityAfter: number;
  uom: string;
  reason: string;
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  completedDate?: string;
  notes?: string;
  reference?: string;
  costImpact: number;
}

const InventoryAdjustmentsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedAdjustment, setSelectedAdjustment] = useState<InventoryAdjustment | null>(null);

  const mockAdjustments: InventoryAdjustment[] = [
    {
      id: '1',
      adjustmentNumber: 'ADJ-2025-001',
      type: 'CORRECTION',
      status: 'PENDING',
      productCode: 'PROD-5234',
      productName: 'Industrial Component A',
      location: 'ZONE-A-12-03',
      quantityBefore: 100,
      quantityAdjustment: -5,
      quantityAfter: 95,
      uom: 'EA',
      reason: 'Physical count discrepancy',
      createdBy: 'Mario Rossi',
      createdDate: '2025-11-20 09:15',
      notes: 'Found during cycle count',
      costImpact: -125.50
    },
    {
      id: '2',
      adjustmentNumber: 'ADJ-2025-002',
      type: 'DAMAGE',
      status: 'APPROVED',
      productCode: 'PROD-8821',
      productName: 'Perishable Goods B',
      location: 'COLD-ZONE-B-05',
      quantityBefore: 500,
      quantityAdjustment: -50,
      quantityAfter: 450,
      uom: 'EA',
      reason: 'Damaged during handling',
      createdBy: 'Laura Bianchi',
      createdDate: '2025-11-19 14:30',
      approvedBy: 'Supervisor A',
      approvedDate: '2025-11-19 15:00',
      reference: 'CLAIM-2025-015',
      costImpact: -550.00
    },
    {
      id: '3',
      adjustmentNumber: 'ADJ-2025-003',
      type: 'FOUND',
      status: 'COMPLETED',
      productCode: 'PROD-3312',
      productName: 'Standard Product C',
      location: 'ZONE-C-15-08',
      quantityBefore: 75,
      quantityAdjustment: 10,
      quantityAfter: 85,
      uom: 'EA',
      reason: 'Items found in wrong location',
      createdBy: 'Giuseppe Verdi',
      createdDate: '2025-11-18 10:00',
      approvedBy: 'Supervisor B',
      approvedDate: '2025-11-18 11:00',
      completedDate: '2025-11-18 11:30',
      notes: 'Relocated from Zone D',
      costImpact: 0
    },
    {
      id: '4',
      adjustmentNumber: 'ADJ-2025-004',
      type: 'LOST',
      status: 'APPROVED',
      productCode: 'PROD-9945',
      productName: 'High Value Item D',
      location: 'SECURE-ZONE-01',
      quantityBefore: 20,
      quantityAdjustment: -2,
      quantityAfter: 18,
      uom: 'EA',
      reason: 'Cannot locate after full warehouse search',
      createdBy: 'Anna Neri',
      createdDate: '2025-11-19 16:00',
      approvedBy: 'Manager A',
      approvedDate: '2025-11-20 08:00',
      reference: 'INVESTIGATION-2025-003',
      costImpact: -2400.00
    },
    {
      id: '5',
      adjustmentNumber: 'ADJ-2025-005',
      type: 'INCREASE',
      status: 'COMPLETED',
      productCode: 'PROD-7623',
      productName: 'Fast Mover Product E',
      location: 'PICK-ZONE-F-02',
      quantityBefore: 250,
      quantityAdjustment: 100,
      quantityAfter: 350,
      uom: 'EA',
      reason: 'Receipt not properly recorded',
      createdBy: 'Paolo Blu',
      createdDate: '2025-11-17 13:00',
      approvedBy: 'Supervisor C',
      approvedDate: '2025-11-17 14:00',
      completedDate: '2025-11-17 14:30',
      reference: 'RCV-2025-112',
      costImpact: 0
    },
    {
      id: '6',
      adjustmentNumber: 'ADJ-2025-006',
      type: 'DECREASE',
      status: 'REJECTED',
      productCode: 'PROD-4456',
      productName: 'Standard Item F',
      location: 'ZONE-B-08-15',
      quantityBefore: 150,
      quantityAdjustment: -30,
      quantityAfter: 120,
      uom: 'EA',
      reason: 'Suspected shrinkage',
      createdBy: 'Lucia Gialli',
      createdDate: '2025-11-20 08:00',
      approvedBy: 'Manager B',
      approvedDate: '2025-11-20 09:00',
      notes: 'Insufficient evidence - recount required',
      costImpact: 0
    },
    {
      id: '7',
      adjustmentNumber: 'ADJ-2025-007',
      type: 'TRANSFER',
      status: 'PENDING',
      productCode: 'PROD-1189',
      productName: 'Bulk Material G',
      location: 'BULK-ZONE-G-01',
      quantityBefore: 1000,
      quantityAdjustment: -200,
      quantityAfter: 800,
      uom: 'KG',
      reason: 'Transfer to production not recorded',
      createdBy: 'Marco Verdi',
      createdDate: '2025-11-20 10:00',
      reference: 'PROD-ORDER-2025-089',
      costImpact: 0
    }
  ];

  const filteredAdjustments = mockAdjustments.filter(adj => {
    const matchesSearch = adj.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || adj.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || adj.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalAdjustments = mockAdjustments.length;
  const pendingApproval = mockAdjustments.filter(a => a.status === 'PENDING').length;
  const totalIncrease = mockAdjustments.filter(a => a.quantityAdjustment > 0).reduce((sum, a) => sum + a.quantityAdjustment, 0);
  const totalDecrease = mockAdjustments.filter(a => a.quantityAdjustment < 0).reduce((sum, a) => sum + Math.abs(a.quantityAdjustment), 0);
  const totalCostImpact = mockAdjustments.reduce((sum, a) => sum + a.costImpact, 0);

  const getStatusBadge = (status: InventoryAdjustment['status']) => {
    const variants: Record<InventoryAdjustment['status'], 'default' | 'success' | 'warning' | 'danger'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      COMPLETED: 'default'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getTypeBadge = (type: InventoryAdjustment['type']) => {
    const colors: Record<InventoryAdjustment['type'], string> = {
      INCREASE: 'bg-green-100 text-green-800',
      DECREASE: 'bg-red-100 text-red-800',
      TRANSFER: 'bg-blue-100 text-blue-800',
      DAMAGE: 'bg-orange-100 text-orange-800',
      CORRECTION: 'bg-purple-100 text-purple-800',
      FOUND: 'bg-teal-100 text-teal-800',
      LOST: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>{type}</span>;
  };

  const columns = [
    { header: 'Adjustment #', accessor: 'adjustmentNumber' as keyof InventoryAdjustment },
    {
      header: 'Type',
      accessor: 'type' as keyof InventoryAdjustment,
      render: (adj: InventoryAdjustment) => getTypeBadge(adj.type)
    },
    {
      header: 'Status',
      accessor: 'status' as keyof InventoryAdjustment,
      render: (adj: InventoryAdjustment) => getStatusBadge(adj.status)
    },
    {
      header: 'Product',
      accessor: 'productCode' as keyof InventoryAdjustment,
      render: (adj: InventoryAdjustment) => (
        <div className="text-sm">
          <div className="font-medium">{adj.productCode}</div>
          <div className="text-gray-500 text-xs truncate max-w-xs">{adj.productName}</div>
        </div>
      )
    },
    { header: 'Location', accessor: 'location' as keyof InventoryAdjustment },
    {
      header: 'Qty Adjustment',
      accessor: 'quantityAdjustment' as keyof InventoryAdjustment,
      render: (adj: InventoryAdjustment) => (
        <div className="flex items-center gap-1">
          {adj.quantityAdjustment > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-600">+{adj.quantityAdjustment}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-600">{adj.quantityAdjustment}</span>
            </>
          )}
        </div>
      )
    },
    {
      header: 'Before → After',
      accessor: 'quantityBefore' as keyof InventoryAdjustment,
      render: (adj: InventoryAdjustment) => (
        <div className="text-xs">
          <span>{adj.quantityBefore} → {adj.quantityAfter} {adj.uom}</span>
        </div>
      )
    },
    {
      header: 'Cost Impact',
      accessor: 'costImpact' as keyof InventoryAdjustment,
      render: (adj: InventoryAdjustment) => (
        <span className={`font-medium ${adj.costImpact < 0 ? 'text-red-600' : adj.costImpact > 0 ? 'text-green-600' : 'text-gray-600'}`}>
          €{adj.costImpact.toFixed(2)}
        </span>
      )
    },
    { header: 'Created Date', accessor: 'createdDate' as keyof InventoryAdjustment }
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
            <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
            <p className="text-gray-600 mt-1">Manage inventory corrections and adjustments</p>
          </div>
          <Button variant="primary">
            <FileText className="w-4 h-4 mr-2" />
            New Adjustment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalAdjustments}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingApproval}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Increased</p>
              <p className="text-2xl font-bold text-green-600">+{totalIncrease}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Decreased</p>
              <p className="text-2xl font-bold text-red-600">-{totalDecrease}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cost Impact</p>
              <p className={`text-2xl font-bold ${totalCostImpact < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                €{totalCostImpact.toFixed(0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search adjustments..."
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
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="INCREASE">Increase</option>
            <option value="DECREASE">Decrease</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DAMAGE">Damage</option>
            <option value="CORRECTION">Correction</option>
            <option value="FOUND">Found</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredAdjustments}
          onRowClick={(adj) => setSelectedAdjustment(adj)}
        />
      </Card>

      {selectedAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Adjustment: {selectedAdjustment.adjustmentNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedAdjustment(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                  {getTypeBadge(selectedAdjustment.type)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedAdjustment.status)}
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Code:</span>
                    <span className="font-medium">{selectedAdjustment.productCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Name:</span>
                    <span className="font-medium">{selectedAdjustment.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="font-medium">{selectedAdjustment.location}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Quantity Changes</h3>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Before:</span>
                    <span className="font-bold text-lg">{selectedAdjustment.quantityBefore} {selectedAdjustment.uom}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Adjustment:</span>
                    <span className={`font-bold text-xl ${selectedAdjustment.quantityAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAdjustment.quantityAdjustment > 0 ? '+' : ''}{selectedAdjustment.quantityAdjustment} {selectedAdjustment.uom}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">After:</span>
                    <span className="font-bold text-lg">{selectedAdjustment.quantityAfter} {selectedAdjustment.uom}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Financial Impact</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cost Impact:</span>
                  <span className={`font-bold text-xl ${selectedAdjustment.costImpact < 0 ? 'text-red-600' : selectedAdjustment.costImpact > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    €{selectedAdjustment.costImpact.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Reason</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded">{selectedAdjustment.reason}</p>
              </div>

              {selectedAdjustment.notes && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <p className="text-gray-700 bg-yellow-50 p-4 rounded">{selectedAdjustment.notes}</p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created By:</span>
                    <span className="font-medium">{selectedAdjustment.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created Date:</span>
                    <span className="font-medium">{selectedAdjustment.createdDate}</span>
                  </div>
                  {selectedAdjustment.approvedBy && (
                    <>
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-sm text-gray-600">Approved By:</span>
                        <span className="font-medium">{selectedAdjustment.approvedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Approved Date:</span>
                        <span className="font-medium">{selectedAdjustment.approvedDate}</span>
                      </div>
                    </>
                  )}
                  {selectedAdjustment.completedDate && (
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-sm text-gray-600">Completed Date:</span>
                      <span className="font-medium text-green-600">{selectedAdjustment.completedDate}</span>
                    </div>
                  )}
                  {selectedAdjustment.reference && (
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-sm text-gray-600">Reference:</span>
                      <span className="font-medium">{selectedAdjustment.reference}</span>
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

export default InventoryAdjustmentsPage;

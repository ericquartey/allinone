import { useState } from 'react';
import { ArrowLeft, Search, Filter, Download, Plus, FileText, Image, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface DamageClaim {
  id: string;
  claimNumber: string;
  type: 'SHIPPING' | 'RECEIVING' | 'STORAGE' | 'HANDLING' | 'CARRIER' | 'THIRD_PARTY';
  status: 'REPORTED' | 'INVESTIGATING' | 'DOCUMENTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SETTLED' | 'CLOSED';
  reportedDate: string;
  incidentDate: string;
  location: string;
  reportedBy: string;
  responsibleParty?: 'INTERNAL' | 'CARRIER' | 'SUPPLIER' | 'CUSTOMER' | 'THIRD_PARTY' | 'UNKNOWN';
  claimAmount: number;
  approvedAmount?: number;
  affectedItems: number;
  photosCount: number;
  documentsCount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  resolution?: string;
  insuranceClaim: boolean;
  insuranceNumber?: string;
}

const DamageClaimsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedClaim, setSelectedClaim] = useState<DamageClaim | null>(null);

  // Mock data
  const mockClaims: DamageClaim[] = [
    {
      id: '1',
      claimNumber: 'CLM-2025-001',
      type: 'SHIPPING',
      status: 'INVESTIGATING',
      reportedDate: '2025-11-18',
      incidentDate: '2025-11-17',
      location: 'Dock A3',
      reportedBy: 'Mario Rossi',
      responsibleParty: 'CARRIER',
      claimAmount: 2500.00,
      affectedItems: 15,
      photosCount: 8,
      documentsCount: 3,
      priority: 'HIGH',
      description: 'Damaged pallets during shipping - forklift impact',
      insuranceClaim: true,
      insuranceNumber: 'INS-2025-445'
    },
    {
      id: '2',
      claimNumber: 'CLM-2025-002',
      type: 'RECEIVING',
      status: 'SUBMITTED',
      reportedDate: '2025-11-15',
      incidentDate: '2025-11-15',
      location: 'Receiving Bay 2',
      reportedBy: 'Laura Bianchi',
      responsibleParty: 'SUPPLIER',
      claimAmount: 1800.00,
      approvedAmount: 1600.00,
      affectedItems: 25,
      photosCount: 12,
      documentsCount: 5,
      priority: 'MEDIUM',
      description: 'Water damage on electronics shipment',
      insuranceClaim: false
    },
    {
      id: '3',
      claimNumber: 'CLM-2025-003',
      type: 'STORAGE',
      status: 'APPROVED',
      reportedDate: '2025-11-10',
      incidentDate: '2025-11-09',
      location: 'Zone B - Rack 15',
      reportedBy: 'Giuseppe Verdi',
      responsibleParty: 'INTERNAL',
      claimAmount: 950.00,
      approvedAmount: 950.00,
      affectedItems: 8,
      photosCount: 5,
      documentsCount: 2,
      priority: 'LOW',
      description: 'Shelf collapse - improper loading',
      insuranceClaim: true,
      insuranceNumber: 'INS-2025-423'
    },
    {
      id: '4',
      claimNumber: 'CLM-2025-004',
      type: 'HANDLING',
      status: 'SETTLED',
      reportedDate: '2025-11-05',
      incidentDate: '2025-11-04',
      location: 'Picking Zone C',
      reportedBy: 'Anna Neri',
      responsibleParty: 'INTERNAL',
      claimAmount: 450.00,
      approvedAmount: 450.00,
      affectedItems: 3,
      photosCount: 4,
      documentsCount: 2,
      priority: 'LOW',
      description: 'Product drop during picking operation',
      resolution: 'Reimbursed - operator training completed',
      insuranceClaim: false
    },
    {
      id: '5',
      claimNumber: 'CLM-2025-005',
      type: 'CARRIER',
      status: 'DOCUMENTED',
      reportedDate: '2025-11-19',
      incidentDate: '2025-11-18',
      location: 'Loading Area',
      reportedBy: 'Paolo Blu',
      responsibleParty: 'CARRIER',
      claimAmount: 5200.00,
      affectedItems: 42,
      photosCount: 15,
      documentsCount: 7,
      priority: 'CRITICAL',
      description: 'Major damage during transport - truck accident',
      insuranceClaim: true,
      insuranceNumber: 'INS-2025-456'
    },
    {
      id: '6',
      claimNumber: 'CLM-2025-006',
      type: 'THIRD_PARTY',
      status: 'REJECTED',
      reportedDate: '2025-11-12',
      incidentDate: '2025-11-10',
      location: 'Staging Area',
      reportedBy: 'Lucia Gialli',
      responsibleParty: 'THIRD_PARTY',
      claimAmount: 1200.00,
      affectedItems: 10,
      photosCount: 6,
      documentsCount: 3,
      priority: 'MEDIUM',
      description: 'Damage during installation service',
      resolution: 'Insufficient evidence - claim denied',
      insuranceClaim: false
    },
    {
      id: '7',
      claimNumber: 'CLM-2025-007',
      type: 'STORAGE',
      status: 'REPORTED',
      reportedDate: '2025-11-20',
      incidentDate: '2025-11-20',
      location: 'Cold Storage Zone A',
      reportedBy: 'Marco Verdi',
      responsibleParty: 'UNKNOWN',
      claimAmount: 3200.00,
      affectedItems: 120,
      photosCount: 10,
      documentsCount: 1,
      priority: 'CRITICAL',
      description: 'Temperature control failure - perishable goods',
      insuranceClaim: true,
      insuranceNumber: 'INS-2025-458'
    }
  ];

  const filteredClaims = mockClaims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || claim.type === typeFilter;
    const matchesPriority = priorityFilter === 'ALL' || claim.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const totalClaims = mockClaims.length;
  const activeClaims = mockClaims.filter(c => ['REPORTED', 'INVESTIGATING', 'DOCUMENTED', 'SUBMITTED'].includes(c.status)).length;
  const totalClaimAmount = mockClaims.reduce((sum, c) => sum + c.claimAmount, 0);
  const settledAmount = mockClaims.filter(c => c.status === 'SETTLED').reduce((sum, c) => sum + (c.approvedAmount || 0), 0);
  const avgClaimAmount = totalClaims > 0 ? totalClaimAmount / totalClaims : 0;

  const getStatusBadge = (status: DamageClaim['status']) => {
    const variants: Record<DamageClaim['status'], 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
      REPORTED: 'info',
      INVESTIGATING: 'warning',
      DOCUMENTED: 'info',
      SUBMITTED: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      SETTLED: 'success',
      CLOSED: 'secondary'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getTypeBadge = (type: DamageClaim['type']) => {
    const colors: Record<DamageClaim['type'], string> = {
      SHIPPING: 'bg-blue-100 text-blue-800',
      RECEIVING: 'bg-purple-100 text-purple-800',
      STORAGE: 'bg-orange-100 text-orange-800',
      HANDLING: 'bg-teal-100 text-teal-800',
      CARRIER: 'bg-indigo-100 text-indigo-800',
      THIRD_PARTY: 'bg-pink-100 text-pink-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>{type.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority: DamageClaim['priority']) => {
    const variants: Record<DamageClaim['priority'], 'default' | 'success' | 'warning' | 'danger'> = {
      LOW: 'default',
      MEDIUM: 'warning',
      HIGH: 'warning',
      CRITICAL: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getResponsiblePartyBadge = (party?: DamageClaim['responsibleParty']) => {
    if (!party) return <span className="text-gray-400">Not assigned</span>;
    const colors: Record<NonNullable<DamageClaim['responsibleParty']>, string> = {
      INTERNAL: 'bg-red-100 text-red-800',
      CARRIER: 'bg-blue-100 text-blue-800',
      SUPPLIER: 'bg-purple-100 text-purple-800',
      CUSTOMER: 'bg-green-100 text-green-800',
      THIRD_PARTY: 'bg-yellow-100 text-yellow-800',
      UNKNOWN: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[party]}`}>{party.replace('_', ' ')}</span>;
  };

  const columns = [
    { header: 'Claim #', accessor: 'claimNumber' as keyof DamageClaim },
    {
      header: 'Type',
      accessor: 'type' as keyof DamageClaim,
      render: (claim: DamageClaim) => getTypeBadge(claim.type)
    },
    {
      header: 'Status',
      accessor: 'status' as keyof DamageClaim,
      render: (claim: DamageClaim) => getStatusBadge(claim.status)
    },
    {
      header: 'Priority',
      accessor: 'priority' as keyof DamageClaim,
      render: (claim: DamageClaim) => getPriorityBadge(claim.priority)
    },
    { header: 'Incident Date', accessor: 'incidentDate' as keyof DamageClaim },
    { header: 'Location', accessor: 'location' as keyof DamageClaim },
    {
      header: 'Responsible',
      accessor: 'responsibleParty' as keyof DamageClaim,
      render: (claim: DamageClaim) => getResponsiblePartyBadge(claim.responsibleParty)
    },
    {
      header: 'Claim Amount',
      accessor: 'claimAmount' as keyof DamageClaim,
      render: (claim: DamageClaim) => `€${claim.claimAmount.toFixed(2)}`
    },
    {
      header: 'Items',
      accessor: 'affectedItems' as keyof DamageClaim,
      render: (claim: DamageClaim) => <span className="font-medium">{claim.affectedItems}</span>
    },
    {
      header: 'Docs',
      accessor: 'documentsCount' as keyof DamageClaim,
      render: (claim: DamageClaim) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {claim.documentsCount}
          </span>
          <span className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            {claim.photosCount}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Damage Claims Management</h1>
            <p className="text-gray-600 mt-1">Track and manage damage claims and incidents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              New Claim
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{totalClaims}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Claims</p>
              <p className="text-2xl font-bold text-orange-600">{activeClaims}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">€{totalClaimAmount.toFixed(0)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Settled</p>
              <p className="text-2xl font-bold text-green-600">€{settledAmount.toFixed(0)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Claim</p>
              <p className="text-2xl font-bold text-gray-900">€{avgClaimAmount.toFixed(0)}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search claims..."
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
            <option value="REPORTED">Reported</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="DOCUMENTED">Documented</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SETTLED">Settled</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="SHIPPING">Shipping</option>
            <option value="RECEIVING">Receiving</option>
            <option value="STORAGE">Storage</option>
            <option value="HANDLING">Handling</option>
            <option value="CARRIER">Carrier</option>
            <option value="THIRD_PARTY">Third Party</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </Card>

      {/* Claims Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredClaims}
          onRowClick={(claim) => setSelectedClaim(claim)}
        />
      </Card>

      {/* Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Claim Details: {selectedClaim.claimNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedClaim(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                  {getTypeBadge(selectedClaim.type)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedClaim.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  {getPriorityBadge(selectedClaim.priority)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Responsible Party</h3>
                  {getResponsiblePartyBadge(selectedClaim.responsibleParty)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Incident Date</h3>
                  <p className="text-gray-900">{selectedClaim.incidentDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Reported Date</h3>
                  <p className="text-gray-900">{selectedClaim.reportedDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                  <p className="text-gray-900">{selectedClaim.location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Reported By</h3>
                  <p className="text-gray-900">{selectedClaim.reportedBy}</p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Claim Amount</h4>
                    <p className="text-xl font-bold text-gray-900">€{selectedClaim.claimAmount.toFixed(2)}</p>
                  </div>
                  {selectedClaim.approvedAmount && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Approved Amount</h4>
                      <p className="text-xl font-bold text-green-600">€{selectedClaim.approvedAmount.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Affected Items</h4>
                    <p className="text-xl font-bold text-gray-900">{selectedClaim.affectedItems}</p>
                  </div>
                </div>
              </div>

              {selectedClaim.insuranceClaim && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Insurance Information</h3>
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Insurance Claim:</strong> Yes
                      {selectedClaim.insuranceNumber && (
                        <span className="ml-4"><strong>Number:</strong> {selectedClaim.insuranceNumber}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedClaim.description}</p>
              </div>

              {selectedClaim.resolution && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Resolution</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedClaim.resolution}</p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Documentation</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">{selectedClaim.documentsCount} Documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{selectedClaim.photosCount} Photos</span>
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

export default DamageClaimsPage;

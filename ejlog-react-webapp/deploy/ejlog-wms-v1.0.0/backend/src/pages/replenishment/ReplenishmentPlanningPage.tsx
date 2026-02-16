import { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, AlertCircle, Package, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface ReplenishmentPlan {
  id: string;
  planNumber: string;
  productCode: string;
  productName: string;
  fromLocation: string;
  toLocation: string;
  status: 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  strategy: 'MIN_MAX' | 'DEMAND_BASED' | 'TIME_BASED' | 'SEASONAL' | 'FORECAST';
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
  suggestedQuantity: number;
  approvedQuantity?: number;
  scheduledDate?: string;
  completedDate?: string;
  assignedOperator?: string;
  zone: string;
  velocity: 'FAST' | 'MEDIUM' | 'SLOW';
  estimatedTime: number;
  actualTime?: number;
}

const ReplenishmentPlanningPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [velocityFilter, setVelocityFilter] = useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<ReplenishmentPlan | null>(null);

  const mockPlans: ReplenishmentPlan[] = [
    {
      id: '1',
      planNumber: 'REP-2025-001',
      productCode: 'PROD-1001',
      productName: 'Electronic Component A',
      fromLocation: 'BULK-A-12',
      toLocation: 'PICK-F-05',
      status: 'SCHEDULED',
      priority: 'HIGH',
      strategy: 'MIN_MAX',
      currentStock: 45,
      minLevel: 50,
      maxLevel: 200,
      reorderPoint: 60,
      suggestedQuantity: 150,
      approvedQuantity: 150,
      scheduledDate: '2025-11-20 10:00',
      assignedOperator: 'Mario Rossi',
      zone: 'Zone F',
      velocity: 'FAST',
      estimatedTime: 25
    },
    {
      id: '2',
      planNumber: 'REP-2025-002',
      productCode: 'PROD-2034',
      productName: 'Packaging Material B',
      fromLocation: 'RESERVE-B-08',
      toLocation: 'PICK-A-12',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      strategy: 'DEMAND_BASED',
      currentStock: 20,
      minLevel: 30,
      maxLevel: 150,
      reorderPoint: 35,
      suggestedQuantity: 130,
      approvedQuantity: 130,
      scheduledDate: '2025-11-20 08:30',
      assignedOperator: 'Laura Bianchi',
      zone: 'Zone A',
      velocity: 'FAST',
      estimatedTime: 30,
      actualTime: 18
    },
    {
      id: '3',
      planNumber: 'REP-2025-003',
      productCode: 'PROD-3567',
      productName: 'Industrial Tool C',
      fromLocation: 'STORAGE-C-15',
      toLocation: 'PICK-B-22',
      status: 'PLANNED',
      priority: 'MEDIUM',
      strategy: 'TIME_BASED',
      currentStock: 88,
      minLevel: 75,
      maxLevel: 300,
      reorderPoint: 90,
      suggestedQuantity: 200,
      zone: 'Zone B',
      velocity: 'MEDIUM',
      estimatedTime: 45
    },
    {
      id: '4',
      planNumber: 'REP-2025-004',
      productCode: 'PROD-4221',
      productName: 'Seasonal Item D',
      fromLocation: 'BULK-D-20',
      toLocation: 'PICK-E-08',
      status: 'COMPLETED',
      priority: 'LOW',
      strategy: 'SEASONAL',
      currentStock: 180,
      minLevel: 100,
      maxLevel: 400,
      reorderPoint: 120,
      suggestedQuantity: 220,
      approvedQuantity: 220,
      scheduledDate: '2025-11-19 14:00',
      completedDate: '2025-11-19 15:30',
      assignedOperator: 'Giuseppe Verdi',
      zone: 'Zone E',
      velocity: 'MEDIUM',
      estimatedTime: 50,
      actualTime: 55
    },
    {
      id: '5',
      planNumber: 'REP-2025-005',
      productCode: 'PROD-5890',
      productName: 'Rare Component E',
      fromLocation: 'RESERVE-A-05',
      toLocation: 'PICK-D-18',
      status: 'ON_HOLD',
      priority: 'LOW',
      strategy: 'FORECAST',
      currentStock: 15,
      minLevel: 10,
      maxLevel: 50,
      reorderPoint: 12,
      suggestedQuantity: 35,
      zone: 'Zone D',
      velocity: 'SLOW',
      estimatedTime: 20
    },
    {
      id: '6',
      planNumber: 'REP-2025-006',
      productCode: 'PROD-6543',
      productName: 'High Demand Product F',
      fromLocation: 'BULK-F-30',
      toLocation: 'PICK-C-10',
      status: 'PLANNED',
      priority: 'HIGH',
      strategy: 'DEMAND_BASED',
      currentStock: 65,
      minLevel: 80,
      maxLevel: 250,
      reorderPoint: 90,
      suggestedQuantity: 180,
      zone: 'Zone C',
      velocity: 'FAST',
      estimatedTime: 35
    },
    {
      id: '7',
      planNumber: 'REP-2025-007',
      productCode: 'PROD-7102',
      productName: 'Standard Item G',
      fromLocation: 'STORAGE-G-12',
      toLocation: 'PICK-F-25',
      status: 'SCHEDULED',
      priority: 'MEDIUM',
      strategy: 'MIN_MAX',
      currentStock: 110,
      minLevel: 100,
      maxLevel: 300,
      reorderPoint: 120,
      suggestedQuantity: 190,
      approvedQuantity: 180,
      scheduledDate: '2025-11-20 13:00',
      zone: 'Zone F',
      velocity: 'MEDIUM',
      estimatedTime: 40
    }
  ];

  const filteredPlans = mockPlans.filter(plan => {
    const matchesSearch = plan.planNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || plan.status === statusFilter;
    const matchesStrategy = strategyFilter === 'ALL' || plan.strategy === strategyFilter;
    const matchesVelocity = velocityFilter === 'ALL' || plan.velocity === velocityFilter;
    return matchesSearch && matchesStatus && matchesStrategy && matchesVelocity;
  });

  const totalPlans = mockPlans.length;
  const urgentPlans = mockPlans.filter(p => p.priority === 'URGENT' || (p.priority === 'HIGH' && p.currentStock < p.reorderPoint)).length;
  const scheduledToday = mockPlans.filter(p => p.scheduledDate?.startsWith('2025-11-20')).length;
  const completionRate = mockPlans.filter(p => p.status === 'COMPLETED').length / totalPlans * 100;

  const getStatusBadge = (status: ReplenishmentPlan['status']) => {
    const variants: Record<ReplenishmentPlan['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      PLANNED: 'info',
      SCHEDULED: 'warning',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'default',
      ON_HOLD: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: ReplenishmentPlan['priority']) => {
    const variants: Record<ReplenishmentPlan['priority'], 'default' | 'warning' | 'danger'> = {
      LOW: 'default',
      MEDIUM: 'warning',
      HIGH: 'warning',
      URGENT: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getVelocityBadge = (velocity: ReplenishmentPlan['velocity']) => {
    const colors: Record<ReplenishmentPlan['velocity'], string> = {
      FAST: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      SLOW: 'bg-green-100 text-green-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[velocity]}`}>{velocity}</span>;
  };

  const getStrategyBadge = (strategy: ReplenishmentPlan['strategy']) => {
    const colors: Record<ReplenishmentPlan['strategy'], string> = {
      MIN_MAX: 'bg-blue-100 text-blue-800',
      DEMAND_BASED: 'bg-purple-100 text-purple-800',
      TIME_BASED: 'bg-teal-100 text-teal-800',
      SEASONAL: 'bg-orange-100 text-orange-800',
      FORECAST: 'bg-indigo-100 text-indigo-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[strategy]}`}>{strategy.replace('_', ' ')}</span>;
  };

  const getStockStatus = (plan: ReplenishmentPlan) => {
    if (plan.currentStock < plan.reorderPoint) {
      return <span className="text-red-600 font-medium">Below Reorder Point</span>;
    } else if (plan.currentStock < plan.minLevel) {
      return <span className="text-orange-600 font-medium">Below Min Level</span>;
    } else if (plan.currentStock > plan.maxLevel) {
      return <span className="text-blue-600 font-medium">Above Max Level</span>;
    }
    return <span className="text-green-600 font-medium">Normal</span>;
  };

  const columns = [
    { header: 'Plan #', accessor: 'planNumber' as keyof ReplenishmentPlan },
    {
      header: 'Product',
      accessor: 'productCode' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => (
        <div className="text-sm">
          <div className="font-medium">{plan.productCode}</div>
          <div className="text-gray-500 text-xs truncate max-w-xs">{plan.productName}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => getStatusBadge(plan.status)
    },
    {
      header: 'Priority',
      accessor: 'priority' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => getPriorityBadge(plan.priority)
    },
    {
      header: 'Strategy',
      accessor: 'strategy' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => getStrategyBadge(plan.strategy)
    },
    {
      header: 'Velocity',
      accessor: 'velocity' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => getVelocityBadge(plan.velocity)
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => (
        <div className="text-sm">
          <div className="font-medium">{plan.currentStock} units</div>
          <div className="text-xs">{getStockStatus(plan)}</div>
        </div>
      )
    },
    {
      header: 'Suggested Qty',
      accessor: 'suggestedQuantity' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => <span className="font-medium">{plan.suggestedQuantity}</span>
    },
    {
      header: 'From → To',
      accessor: 'fromLocation' as keyof ReplenishmentPlan,
      render: (plan: ReplenishmentPlan) => (
        <div className="text-xs">
          <div>{plan.fromLocation}</div>
          <div className="text-gray-400">↓</div>
          <div>{plan.toLocation}</div>
        </div>
      )
    },
    {
      header: 'Zone',
      accessor: 'zone' as keyof ReplenishmentPlan
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
            <h1 className="text-2xl font-bold text-gray-900">Replenishment Planning</h1>
            <p className="text-gray-600 mt-1">Manage stock replenishment and optimize picking locations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Generate Plan
            </Button>
            <Button variant="primary">
              <Package className="w-4 h-4 mr-2" />
              Manual Replenishment
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-red-600">{urgentPlans}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled Today</p>
              <p className="text-2xl font-bold text-orange-600">{scheduledToday}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(0)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search plans..."
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
            <option value="PLANNED">Planned</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Strategies</option>
            <option value="MIN_MAX">Min-Max</option>
            <option value="DEMAND_BASED">Demand Based</option>
            <option value="TIME_BASED">Time Based</option>
            <option value="SEASONAL">Seasonal</option>
            <option value="FORECAST">Forecast</option>
          </select>

          <select
            value={velocityFilter}
            onChange={(e) => setVelocityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Velocities</option>
            <option value="FAST">Fast Movers</option>
            <option value="MEDIUM">Medium Movers</option>
            <option value="SLOW">Slow Movers</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredPlans}
          onRowClick={(plan) => setSelectedPlan(plan)}
        />
      </Card>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Plan: {selectedPlan.planNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedPlan(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Product Code</h3>
                  <p className="text-gray-900 font-medium">{selectedPlan.productCode}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Product Name</h3>
                  <p className="text-gray-900">{selectedPlan.productName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedPlan.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  {getPriorityBadge(selectedPlan.priority)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Strategy</h3>
                  {getStrategyBadge(selectedPlan.strategy)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Velocity</h3>
                  {getVelocityBadge(selectedPlan.velocity)}
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Current Stock</h4>
                    <p className="text-2xl font-bold text-gray-900">{selectedPlan.currentStock}</p>
                    <p className="text-sm">{getStockStatus(selectedPlan)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Reorder Point</h4>
                    <p className="text-xl font-bold text-orange-600">{selectedPlan.reorderPoint}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Min Level</h4>
                    <p className="text-xl font-bold text-red-600">{selectedPlan.minLevel}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Max Level</h4>
                    <p className="text-xl font-bold text-green-600">{selectedPlan.maxLevel}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Replenishment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">From Location:</span>
                    <span className="font-medium">{selectedPlan.fromLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">To Location:</span>
                    <span className="font-medium">{selectedPlan.toLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zone:</span>
                    <span className="font-medium">{selectedPlan.zone}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Suggested Quantity:</span>
                    <span className="font-bold text-blue-600">{selectedPlan.suggestedQuantity} units</span>
                  </div>
                  {selectedPlan.approvedQuantity && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Approved Quantity:</span>
                      <span className="font-bold text-green-600">{selectedPlan.approvedQuantity} units</span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedPlan.scheduledDate || selectedPlan.completedDate) && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <div className="space-y-3">
                    {selectedPlan.scheduledDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Scheduled Date:</span>
                        <span className="font-medium">{selectedPlan.scheduledDate}</span>
                      </div>
                    )}
                    {selectedPlan.completedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed Date:</span>
                        <span className="font-medium text-green-600">{selectedPlan.completedDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{selectedPlan.estimatedTime} min</span>
                    </div>
                    {selectedPlan.actualTime && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Actual Time:</span>
                        <span className={`font-medium ${selectedPlan.actualTime > selectedPlan.estimatedTime ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedPlan.actualTime} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPlan.assignedOperator && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Assignment</h3>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assigned Operator:</span>
                    <span className="font-medium">{selectedPlan.assignedOperator}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplenishmentPlanningPage;

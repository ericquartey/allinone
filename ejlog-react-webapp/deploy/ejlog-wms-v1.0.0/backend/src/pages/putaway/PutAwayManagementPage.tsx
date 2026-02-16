import { useState } from 'react';
import { ArrowLeft, Search, MapPin, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface PutAwayTask {
  id: string;
  taskNumber: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  productCode: string;
  productName: string;
  quantity: number;
  uom: string;
  fromLocation: string;
  toLocation: string;
  suggestedLocation?: string;
  zone: string;
  receiptNumber: string;
  supplier: string;
  assignedOperator?: string;
  createdDate: string;
  startedTime?: string;
  completedTime?: string;
  estimatedTime: number;
  actualTime?: number;
  storageType: 'PALLET' | 'CASE' | 'PIECE' | 'BULK';
  strategy: 'FIFO' | 'LIFO' | 'FEFO' | 'FIXED' | 'RANDOM' | 'ABC';
}

const PutAwayManagementPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<PutAwayTask | null>(null);

  const mockTasks: PutAwayTask[] = [
    {
      id: '1',
      taskNumber: 'PA-2025-001',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      productCode: 'PROD-5234',
      productName: 'Industrial Component A',
      quantity: 48,
      uom: 'EA',
      fromLocation: 'RECEIVING-01',
      toLocation: 'ZONE-A-12-03',
      suggestedLocation: 'ZONE-A-12-03',
      zone: 'Zone A',
      receiptNumber: 'RCV-20251120-001',
      supplier: 'FastSupply Inc',
      assignedOperator: 'Mario Rossi',
      createdDate: '2025-11-20 08:15',
      startedTime: '2025-11-20 08:30',
      estimatedTime: 15,
      storageType: 'PALLET',
      strategy: 'FIFO'
    },
    {
      id: '2',
      taskNumber: 'PA-2025-002',
      status: 'ASSIGNED',
      priority: 'URGENT',
      productCode: 'PROD-8821',
      productName: 'Perishable Goods B',
      quantity: 120,
      uom: 'EA',
      fromLocation: 'DOCK-A3',
      toLocation: 'COLD-ZONE-B-05',
      suggestedLocation: 'COLD-ZONE-B-05',
      zone: 'Cold Storage B',
      receiptNumber: 'RCV-20251120-002',
      supplier: 'Fresh Foods Ltd',
      assignedOperator: 'Laura Bianchi',
      createdDate: '2025-11-20 07:45',
      estimatedTime: 20,
      storageType: 'CASE',
      strategy: 'FEFO'
    },
    {
      id: '3',
      taskNumber: 'PA-2025-003',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      productCode: 'PROD-3312',
      productName: 'Standard Product C',
      quantity: 200,
      uom: 'EA',
      fromLocation: 'STAGING-02',
      toLocation: 'ZONE-C-15-08',
      suggestedLocation: 'ZONE-C-15-08',
      zone: 'Zone C',
      receiptNumber: 'RCV-20251119-015',
      supplier: 'Global Trade Co',
      assignedOperator: 'Giuseppe Verdi',
      createdDate: '2025-11-19 14:30',
      startedTime: '2025-11-19 15:00',
      completedTime: '2025-11-19 15:22',
      estimatedTime: 18,
      actualTime: 22,
      storageType: 'PALLET',
      strategy: 'ABC'
    },
    {
      id: '4',
      taskNumber: 'PA-2025-004',
      status: 'PENDING',
      priority: 'LOW',
      productCode: 'PROD-9945',
      productName: 'Slow Mover Item D',
      quantity: 30,
      uom: 'BX',
      fromLocation: 'RECEIVING-03',
      toLocation: 'ZONE-D-20-12',
      suggestedLocation: 'ZONE-D-20-12',
      zone: 'Zone D',
      receiptNumber: 'RCV-20251120-003',
      supplier: 'Bulk Suppliers SA',
      createdDate: '2025-11-20 09:00',
      estimatedTime: 12,
      storageType: 'CASE',
      strategy: 'LIFO'
    },
    {
      id: '5',
      taskNumber: 'PA-2025-005',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      productCode: 'PROD-7623',
      productName: 'Fast Mover Product E',
      quantity: 500,
      uom: 'EA',
      fromLocation: 'CROSSDOCK-01',
      toLocation: 'PICK-ZONE-F-02',
      suggestedLocation: 'PICK-ZONE-F-02',
      zone: 'Forward Pick F',
      receiptNumber: 'RCV-20251120-004',
      supplier: 'Express Logistics',
      assignedOperator: 'Anna Neri',
      createdDate: '2025-11-20 08:00',
      startedTime: '2025-11-20 08:45',
      estimatedTime: 25,
      storageType: 'CASE',
      strategy: 'ABC'
    },
    {
      id: '6',
      taskNumber: 'PA-2025-006',
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      productCode: 'PROD-4456',
      productName: 'Pending Inspection F',
      quantity: 80,
      uom: 'EA',
      fromLocation: 'QC-HOLD',
      toLocation: 'ZONE-B-08-15',
      suggestedLocation: 'ZONE-B-08-15',
      zone: 'Zone B',
      receiptNumber: 'RCV-20251119-020',
      supplier: 'Quality Goods Inc',
      createdDate: '2025-11-19 16:00',
      estimatedTime: 15,
      storageType: 'PALLET',
      strategy: 'FIXED'
    },
    {
      id: '7',
      taskNumber: 'PA-2025-007',
      status: 'PENDING',
      priority: 'HIGH',
      productCode: 'PROD-1189',
      productName: 'Bulk Material G',
      quantity: 1000,
      uom: 'KG',
      fromLocation: 'RECEIVING-02',
      toLocation: 'BULK-ZONE-G-01',
      suggestedLocation: 'BULK-ZONE-G-01',
      zone: 'Bulk Storage G',
      receiptNumber: 'RCV-20251120-005',
      supplier: 'Raw Materials Co',
      createdDate: '2025-11-20 09:15',
      estimatedTime: 30,
      storageType: 'BULK',
      strategy: 'RANDOM'
    }
  ];

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalTasks = mockTasks.length;
  const pendingTasks = mockTasks.filter(t => t.status === 'PENDING').length;
  const activeTasks = mockTasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const completedToday = mockTasks.filter(t => t.status === 'COMPLETED').length;
  const avgTime = mockTasks.filter(t => t.actualTime).reduce((sum, t) => sum + (t.actualTime || 0), 0) / mockTasks.filter(t => t.actualTime).length || 0;

  const getStatusBadge = (status: PutAwayTask['status']) => {
    const variants: Record<PutAwayTask['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      PENDING: 'info',
      ASSIGNED: 'warning',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      ON_HOLD: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: PutAwayTask['priority']) => {
    const variants: Record<PutAwayTask['priority'], 'default' | 'warning' | 'danger'> = {
      LOW: 'default',
      MEDIUM: 'warning',
      HIGH: 'warning',
      URGENT: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getStorageTypeBadge = (type: PutAwayTask['storageType']) => {
    const colors: Record<PutAwayTask['storageType'], string> = {
      PALLET: 'bg-blue-100 text-blue-800',
      CASE: 'bg-green-100 text-green-800',
      PIECE: 'bg-purple-100 text-purple-800',
      BULK: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>{type}</span>;
  };

  const getStrategyBadge = (strategy: PutAwayTask['strategy']) => {
    const colors: Record<PutAwayTask['strategy'], string> = {
      FIFO: 'bg-blue-100 text-blue-800',
      LIFO: 'bg-purple-100 text-purple-800',
      FEFO: 'bg-red-100 text-red-800',
      FIXED: 'bg-gray-100 text-gray-800',
      RANDOM: 'bg-yellow-100 text-yellow-800',
      ABC: 'bg-green-100 text-green-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[strategy]}`}>{strategy}</span>;
  };

  const columns = [
    { header: 'Task #', accessor: 'taskNumber' as keyof PutAwayTask },
    {
      header: 'Status',
      accessor: 'status' as keyof PutAwayTask,
      render: (task: PutAwayTask) => getStatusBadge(task.status)
    },
    {
      header: 'Priority',
      accessor: 'priority' as keyof PutAwayTask,
      render: (task: PutAwayTask) => getPriorityBadge(task.priority)
    },
    {
      header: 'Product',
      accessor: 'productCode' as keyof PutAwayTask,
      render: (task: PutAwayTask) => (
        <div className="text-sm">
          <div className="font-medium">{task.productCode}</div>
          <div className="text-gray-500 text-xs truncate max-w-xs">{task.productName}</div>
        </div>
      )
    },
    {
      header: 'Quantity',
      accessor: 'quantity' as keyof PutAwayTask,
      render: (task: PutAwayTask) => `${task.quantity} ${task.uom}`
    },
    {
      header: 'From → To',
      accessor: 'fromLocation' as keyof PutAwayTask,
      render: (task: PutAwayTask) => (
        <div className="text-xs">
          <div>{task.fromLocation}</div>
          <div className="text-gray-400">↓</div>
          <div className="font-medium">{task.toLocation}</div>
        </div>
      )
    },
    {
      header: 'Zone',
      accessor: 'zone' as keyof PutAwayTask
    },
    {
      header: 'Type',
      accessor: 'storageType' as keyof PutAwayTask,
      render: (task: PutAwayTask) => getStorageTypeBadge(task.storageType)
    },
    {
      header: 'Strategy',
      accessor: 'strategy' as keyof PutAwayTask,
      render: (task: PutAwayTask) => getStrategyBadge(task.strategy)
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
            <h1 className="text-2xl font-bold text-gray-900">Put-Away Management</h1>
            <p className="text-gray-600 mt-1">Manage storage and location assignments</p>
          </div>
          <Button variant="primary">
            <Package className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingTasks}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-purple-600">{activeTasks}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedToday}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgTime.toFixed(0)}</p>
              <p className="text-xs text-gray-500">minutes</p>
            </div>
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
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
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
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
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredTasks}
          onRowClick={(task) => setSelectedTask(task)}
        />
      </Card>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Task: {selectedTask.taskNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedTask(null)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedTask.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  {getPriorityBadge(selectedTask.priority)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Storage Type</h3>
                  {getStorageTypeBadge(selectedTask.storageType)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Strategy</h3>
                  {getStrategyBadge(selectedTask.strategy)}
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Code:</span>
                    <span className="font-medium">{selectedTask.productCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Name:</span>
                    <span className="font-medium">{selectedTask.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="font-bold text-lg">{selectedTask.quantity} {selectedTask.uom}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Location Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">From Location:</span>
                    <span className="font-medium">{selectedTask.fromLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">To Location:</span>
                    <span className="font-medium text-green-600">{selectedTask.toLocation}</span>
                  </div>
                  {selectedTask.suggestedLocation && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Suggested Location:</span>
                      <span className="font-medium text-blue-600">{selectedTask.suggestedLocation}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zone:</span>
                    <span className="font-medium">{selectedTask.zone}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Receipt Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Receipt Number:</span>
                    <span className="font-medium">{selectedTask.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="font-medium">{selectedTask.supplier}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="font-medium">{selectedTask.createdDate}</span>
                  </div>
                  {selectedTask.startedTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Started:</span>
                      <span className="font-medium">{selectedTask.startedTime}</span>
                    </div>
                  )}
                  {selectedTask.completedTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed:</span>
                      <span className="font-medium text-green-600">{selectedTask.completedTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm text-gray-600">Estimated Time:</span>
                    <span className="font-medium">{selectedTask.estimatedTime} min</span>
                  </div>
                  {selectedTask.actualTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Actual Time:</span>
                      <span className={`font-medium ${selectedTask.actualTime > selectedTask.estimatedTime ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedTask.actualTime} min
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTask.assignedOperator && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Assignment</h3>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assigned Operator:</span>
                    <span className="font-medium">{selectedTask.assignedOperator}</span>
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

export default PutAwayManagementPage;

import { useState } from 'react';
import { ArrowLeft, Search, Package, Box, CheckCircle, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface PackingTask {
  id: string;
  taskNumber: string;
  orderNumber: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customer: string;
  linesCount: number;
  itemsCount: number;
  packagesRequired: number;
  packagesCompleted: number;
  packingStation: string;
  assignedOperator?: string;
  startTime?: string;
  completedTime?: string;
  estimatedTime: number;
  actualTime?: number;
  packingMethod: 'SINGLE' | 'MULTI' | 'BULK' | 'GIFT';
  shippingMethod: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
}

const PackingOperationsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<PackingTask | null>(null);

  const mockTasks: PackingTask[] = [
    {
      id: '1', taskNumber: 'PACK-2025-001', orderNumber: 'ORD-8821', status: 'IN_PROGRESS', priority: 'HIGH',
      customer: 'ABC Retail', linesCount: 8, itemsCount: 45, packagesRequired: 3, packagesCompleted: 1,
      packingStation: 'PACK-STATION-1', assignedOperator: 'Mario Rossi', startTime: '2025-11-20 08:30',
      estimatedTime: 25, packingMethod: 'MULTI', shippingMethod: 'EXPRESS'
    },
    {
      id: '2', taskNumber: 'PACK-2025-002', orderNumber: 'ORD-8822', status: 'PENDING', priority: 'URGENT',
      customer: 'Premium Store', linesCount: 15, itemsCount: 120, packagesRequired: 5, packagesCompleted: 0,
      packingStation: 'PACK-STATION-2', estimatedTime: 45, packingMethod: 'SINGLE', shippingMethod: 'OVERNIGHT'
    },
    {
      id: '3', taskNumber: 'PACK-2025-003', orderNumber: 'ORD-8823', status: 'COMPLETED', priority: 'MEDIUM',
      customer: 'E-commerce Platform', linesCount: 5, itemsCount: 20, packagesRequired: 2, packagesCompleted: 2,
      packingStation: 'PACK-STATION-3', assignedOperator: 'Laura Bianchi', startTime: '2025-11-19 14:00',
      completedTime: '2025-11-19 14:28', estimatedTime: 20, actualTime: 28, packingMethod: 'GIFT', shippingMethod: 'STANDARD'
    },
    {
      id: '4', taskNumber: 'PACK-2025-004', orderNumber: 'ORD-8824', status: 'IN_PROGRESS', priority: 'HIGH',
      customer: 'Wholesale Partners', linesCount: 20, itemsCount: 350, packagesRequired: 8, packagesCompleted: 4,
      packingStation: 'PACK-STATION-4', assignedOperator: 'Giuseppe Verdi', startTime: '2025-11-20 07:00',
      estimatedTime: 60, packingMethod: 'BULK', shippingMethod: 'STANDARD'
    },
    {
      id: '5', taskNumber: 'PACK-2025-005', orderNumber: 'ORD-8825', status: 'PENDING', priority: 'MEDIUM',
      customer: 'Regional Distributors', linesCount: 10, itemsCount: 75, packagesRequired: 4, packagesCompleted: 0,
      packingStation: 'PACK-STATION-1', estimatedTime: 30, packingMethod: 'MULTI', shippingMethod: 'EXPRESS'
    }
  ];

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTasks = mockTasks.length;
  const activeTasks = mockTasks.filter(t => ['IN_PROGRESS'].includes(t.status)).length;
  const completedToday = mockTasks.filter(t => t.status === 'COMPLETED').length;
  const avgTime = mockTasks.filter(t => t.actualTime).reduce((sum, t) => sum + (t.actualTime || 0), 0) / mockTasks.filter(t => t.actualTime).length || 0;

  const getStatusBadge = (status: PackingTask['status']) => {
    const variants: Record<PackingTask['status'], 'default' | 'success' | 'warning' | 'danger'> = {
      PENDING: 'warning', IN_PROGRESS: 'info', COMPLETED: 'success', ON_HOLD: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: PackingTask['priority']) => {
    const variants: Record<PackingTask['priority'], 'default' | 'warning' | 'danger'> = {
      LOW: 'default', MEDIUM: 'warning', HIGH: 'warning', URGENT: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const columns = [
    { header: 'Task #', accessor: 'taskNumber' as keyof PackingTask },
    { header: 'Order #', accessor: 'orderNumber' as keyof PackingTask },
    { header: 'Status', accessor: 'status' as keyof PackingTask, render: (t: PackingTask) => getStatusBadge(t.status) },
    { header: 'Priority', accessor: 'priority' as keyof PackingTask, render: (t: PackingTask) => getPriorityBadge(t.priority) },
    { header: 'Customer', accessor: 'customer' as keyof PackingTask },
    {
      header: 'Items / Lines',
      accessor: 'itemsCount' as keyof PackingTask,
      render: (t: PackingTask) => <div className="text-sm"><div className="font-medium">{t.itemsCount} items</div><div className="text-xs text-gray-500">{t.linesCount} lines</div></div>
    },
    {
      header: 'Packages',
      accessor: 'packagesCompleted' as keyof PackingTask,
      render: (t: PackingTask) => <span className="font-medium">{t.packagesCompleted}/{t.packagesRequired}</span>
    },
    { header: 'Station', accessor: 'packingStation' as keyof PackingTask },
    { header: 'Operator', accessor: 'assignedOperator' as keyof PackingTask, render: (t: PackingTask) => t.assignedOperator || <span className="text-gray-400">Unassigned</span> }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Packing Operations</h1><p className="text-gray-600 mt-1">Manage order packing and packaging</p></div>
          <Button variant="primary"><Package className="w-4 h-4 mr-2" />Assign Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Tasks</p><p className="text-2xl font-bold text-gray-900">{totalTasks}</p></div><Package className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-orange-600">{activeTasks}</p></div><Clock className="w-8 h-8 text-orange-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold text-green-600">{completedToday}</p></div><CheckCircle className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Time</p><p className="text-2xl font-bold text-gray-900">{avgTime.toFixed(0)}</p><p className="text-xs text-gray-500">minutes</p></div><User className="w-8 h-8 text-purple-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option><option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredTasks} onRowClick={(t) => setSelectedTask(t)} /></Card>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Task: {selectedTask.taskNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedTask(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>{getStatusBadge(selectedTask.status)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>{getPriorityBadge(selectedTask.priority)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Order Number</h3><p className="text-gray-900">{selectedTask.orderNumber}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3><p className="text-gray-900">{selectedTask.customer}</p></div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Packing Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded"><p className="text-sm text-blue-600 mb-1">Lines</p><p className="text-2xl font-bold text-blue-900">{selectedTask.linesCount}</p></div>
                  <div className="bg-purple-50 p-4 rounded"><p className="text-sm text-purple-600 mb-1">Items</p><p className="text-2xl font-bold text-purple-900">{selectedTask.itemsCount}</p></div>
                  <div className="bg-green-50 p-4 rounded"><p className="text-sm text-green-600 mb-1">Packages</p><p className="text-2xl font-bold text-green-900">{selectedTask.packagesCompleted}/{selectedTask.packagesRequired}</p></div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Station & Operator</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Packing Station:</span><span className="font-medium">{selectedTask.packingStation}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Assigned Operator:</span><span className="font-medium">{selectedTask.assignedOperator || 'Unassigned'}</span></div>
                </div>
              </div>
              {(selectedTask.startTime || selectedTask.completedTime) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <div className="space-y-3">
                    {selectedTask.startTime && <div className="flex justify-between"><span className="text-sm text-gray-600">Start Time:</span><span className="font-medium">{selectedTask.startTime}</span></div>}
                    {selectedTask.completedTime && <div className="flex justify-between"><span className="text-sm text-gray-600">Completed Time:</span><span className="font-medium text-green-600">{selectedTask.completedTime}</span></div>}
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Estimated:</span><span className="font-medium">{selectedTask.estimatedTime} min</span></div>
                    {selectedTask.actualTime && <div className="flex justify-between"><span className="text-sm text-gray-600">Actual:</span><span className={`font-medium ${selectedTask.actualTime > selectedTask.estimatedTime ? 'text-red-600' : 'text-green-600'}`}>{selectedTask.actualTime} min</span></div>}
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

export default PackingOperationsPage;

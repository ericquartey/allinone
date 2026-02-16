import { useState } from 'react';
import { ArrowLeft, Search, Route, MapPin, Truck, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface RoutePlan {
  id: string;
  routeNumber: string;
  status: 'DRAFT' | 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  routeType: 'DELIVERY' | 'PICKUP' | 'MIXED' | 'TRANSFER' | 'RETURN';
  vehicle?: string;
  driver?: string;
  stopsCount: number;
  completedStops: number;
  totalDistance: number;
  estimatedDuration: number;
  actualDuration?: number;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  totalWeight: number;
  totalVolume: number;
  ordersCount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  optimizationScore: number;
}

const RoutePlanningPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedRoute, setSelectedRoute] = useState<RoutePlan | null>(null);

  const mockRoutes: RoutePlan[] = [
    { id: '1', routeNumber: 'ROUTE-2025-001', status: 'IN_PROGRESS', routeType: 'DELIVERY', vehicle: 'VAN-001', driver: 'Mario Rossi', stopsCount: 12, completedStops: 7, totalDistance: 85.5, estimatedDuration: 240, scheduledDate: '2025-11-20', startTime: '08:00', totalWeight: 1250, totalVolume: 18.5, ordersCount: 23, priority: 'HIGH', optimizationScore: 92 },
    { id: '2', routeNumber: 'ROUTE-2025-002', status: 'PLANNED', routeType: 'MIXED', vehicle: 'TRUCK-005', driver: 'Laura Bianchi', stopsCount: 18, completedStops: 0, totalDistance: 142.3, estimatedDuration: 360, scheduledDate: '2025-11-20', totalWeight: 3500, totalVolume: 42.0, ordersCount: 45, priority: 'URGENT', optimizationScore: 88 },
    { id: '3', routeNumber: 'ROUTE-2025-003', status: 'COMPLETED', routeType: 'PICKUP', vehicle: 'VAN-003', driver: 'Giuseppe Verdi', stopsCount: 8, completedStops: 8, totalDistance: 67.2, estimatedDuration: 180, actualDuration: 195, scheduledDate: '2025-11-19', startTime: '09:00', endTime: '12:15', totalWeight: 890, totalVolume: 12.3, ordersCount: 15, priority: 'MEDIUM', optimizationScore: 95 },
    { id: '4', routeNumber: 'ROUTE-2025-004', status: 'ASSIGNED', routeType: 'DELIVERY', vehicle: 'TRUCK-002', driver: 'Anna Neri', stopsCount: 15, completedStops: 0, totalDistance: 118.7, estimatedDuration: 300, scheduledDate: '2025-11-20', totalWeight: 2800, totalVolume: 35.2, ordersCount: 32, priority: 'HIGH', optimizationScore: 90 },
    { id: '5', routeNumber: 'ROUTE-2025-005', status: 'DRAFT', routeType: 'TRANSFER', stopsCount: 5, completedStops: 0, totalDistance: 45.8, estimatedDuration: 120, scheduledDate: '2025-11-21', totalWeight: 1500, totalVolume: 20.0, ordersCount: 10, priority: 'LOW', optimizationScore: 85 },
    { id: '6', routeNumber: 'ROUTE-2025-006', status: 'PLANNED', routeType: 'RETURN', vehicle: 'VAN-002', driver: 'Marco Blu', stopsCount: 10, completedStops: 0, totalDistance: 92.4, estimatedDuration: 210, scheduledDate: '2025-11-20', totalWeight: 650, totalVolume: 15.8, ordersCount: 18, priority: 'MEDIUM', optimizationScore: 87 }
  ];

  const filteredRoutes = mockRoutes.filter(r => {
    const matchesSearch = r.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (r.vehicle?.toLowerCase().includes(searchTerm.toLowerCase())) || (r.driver?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || r.routeType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalRoutes = mockRoutes.length;
  const activeRoutes = mockRoutes.filter(r => r.status === 'IN_PROGRESS').length;
  const plannedRoutes = mockRoutes.filter(r => ['PLANNED', 'ASSIGNED'].includes(r.status)).length;
  const avgOptimization = mockRoutes.reduce((sum, r) => sum + r.optimizationScore, 0) / mockRoutes.length;
  const totalDistance = mockRoutes.reduce((sum, r) => sum + r.totalDistance, 0);

  const getStatusBadge = (status: RoutePlan['status']) => {
    const variants: Record<RoutePlan['status'], 'default' | 'success' | 'warning' | 'danger'> = { DRAFT: 'default', PLANNED: 'info', ASSIGNED: 'warning', IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'danger' };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: RoutePlan['priority']) => {
    const variants: Record<RoutePlan['priority'], 'default' | 'warning' | 'danger'> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'warning', URGENT: 'danger' };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const columns = [
    { header: 'Route #', accessor: 'routeNumber' as keyof RoutePlan },
    { header: 'Status', accessor: 'status' as keyof RoutePlan, render: (r: RoutePlan) => getStatusBadge(r.status) },
    { header: 'Type', accessor: 'routeType' as keyof RoutePlan },
    { header: 'Driver', accessor: 'driver' as keyof RoutePlan, render: (r: RoutePlan) => r.driver || <span className="text-gray-400">Unassigned</span> },
    { header: 'Stops', accessor: 'stopsCount' as keyof RoutePlan, render: (r: RoutePlan) => <span className="font-medium">{r.completedStops}/{r.stopsCount}</span> },
    { header: 'Distance', accessor: 'totalDistance' as keyof RoutePlan, render: (r: RoutePlan) => <span>{r.totalDistance.toFixed(1)} km</span> },
    { header: 'Priority', accessor: 'priority' as keyof RoutePlan, render: (r: RoutePlan) => getPriorityBadge(r.priority) },
    { header: 'Score', accessor: 'optimizationScore' as keyof RoutePlan, render: (r: RoutePlan) => <span className={`font-medium ${r.optimizationScore >= 90 ? 'text-green-600' : r.optimizationScore >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>{r.optimizationScore}%</span> }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Route Planning</h1><p className="text-gray-600 mt-1">Optimize delivery and pickup routes</p></div>
          <div className="flex gap-2">
            <Button variant="secondary"><TrendingUp className="w-4 h-4 mr-2" />Optimize Routes</Button>
            <Button variant="primary"><Route className="w-4 h-4 mr-2" />Create Route</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Routes</p><p className="text-2xl font-bold text-gray-900">{totalRoutes}</p></div><Route className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-orange-600">{activeRoutes}</p></div><Truck className="w-8 h-8 text-orange-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Planned</p><p className="text-2xl font-bold text-blue-600">{plannedRoutes}</p></div><MapPin className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Score</p><p className="text-2xl font-bold text-green-600">{avgOptimization.toFixed(0)}%</p></div><TrendingUp className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Distance</p><p className="text-2xl font-bold text-purple-600">{totalDistance.toFixed(0)}</p><p className="text-xs text-gray-500">km</p></div><Clock className="w-8 h-8 text-purple-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search routes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option><option value="DRAFT">Draft</option><option value="PLANNED">Planned</option><option value="ASSIGNED">Assigned</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Types</option><option value="DELIVERY">Delivery</option><option value="PICKUP">Pickup</option><option value="MIXED">Mixed</option><option value="TRANSFER">Transfer</option><option value="RETURN">Return</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredRoutes} onRowClick={(r) => setSelectedRoute(r)} /></Card>

      {selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Route: {selectedRoute.routeNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedRoute(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>{getStatusBadge(selectedRoute.status)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>{getPriorityBadge(selectedRoute.priority)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Route Type</h3><p className="text-gray-900">{selectedRoute.routeType}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Scheduled Date</h3><p className="text-gray-900">{selectedRoute.scheduledDate}</p></div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Route Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded"><p className="text-sm text-blue-600 mb-1">Stops</p><p className="text-2xl font-bold text-blue-900">{selectedRoute.completedStops}/{selectedRoute.stopsCount}</p></div>
                  <div className="bg-purple-50 p-4 rounded"><p className="text-sm text-purple-600 mb-1">Distance</p><p className="text-2xl font-bold text-purple-900">{selectedRoute.totalDistance.toFixed(1)} km</p></div>
                  <div className="bg-green-50 p-4 rounded"><p className="text-sm text-green-600 mb-1">Orders</p><p className="text-2xl font-bold text-green-900">{selectedRoute.ordersCount}</p></div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Vehicle & Driver</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Vehicle:</span><span className="font-medium">{selectedRoute.vehicle || 'Not assigned'}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Driver:</span><span className="font-medium">{selectedRoute.driver || 'Not assigned'}</span></div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Capacity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Weight:</span><span className="font-medium">{selectedRoute.totalWeight} kg</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Volume:</span><span className="font-medium">{selectedRoute.totalVolume} m³</span></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Optimization Score:</span><span className={`font-medium ${selectedRoute.optimizationScore >= 90 ? 'text-green-600' : selectedRoute.optimizationScore >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>{selectedRoute.optimizationScore}%</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Estimated Duration:</span><span className="font-medium">{selectedRoute.estimatedDuration} min</span></div>
                  {selectedRoute.actualDuration && <div className="flex justify-between"><span className="text-sm text-gray-600">Actual Duration:</span><span className={`font-medium ${selectedRoute.actualDuration > selectedRoute.estimatedDuration ? 'text-red-600' : 'text-green-600'}`}>{selectedRoute.actualDuration} min</span></div>}
                  {selectedRoute.startTime && <div className="flex justify-between"><span className="text-sm text-gray-600">Start Time:</span><span className="font-medium">{selectedRoute.startTime}</span></div>}
                  {selectedRoute.endTime && <div className="flex justify-between"><span className="text-sm text-gray-600">End Time:</span><span className="font-medium">{selectedRoute.endTime}</span></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePlanningPage;

import { useState } from 'react';
import { ArrowLeft, Search, Target, TrendingUp, Clock, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface PerformanceMetric {
  id: string;
  metricName: string;
  category: 'PRODUCTIVITY' | 'ACCURACY' | 'EFFICIENCY' | 'QUALITY' | 'SAFETY';
  operator: string;
  department: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  performance: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  status: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_TARGET' | 'CRITICAL';
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastUpdated: string;
  benchmark: number;
}

const PerformanceMetricsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetric | null>(null);

  const mockMetrics: PerformanceMetric[] = [
    { id: '1', metricName: 'Picking Rate', category: 'PRODUCTIVITY', operator: 'Mario Rossi', department: 'Picking', currentValue: 145, targetValue: 120, unit: 'items/hour', performance: 121, trend: 'IMPROVING', status: 'EXCELLENT', period: 'DAILY', lastUpdated: '2025-11-20 09:00', benchmark: 130 },
    { id: '2', metricName: 'Order Accuracy', category: 'ACCURACY', operator: 'Laura Bianchi', department: 'Packing', currentValue: 98.5, targetValue: 99.0, unit: '%', performance: 99, trend: 'STABLE', status: 'GOOD', period: 'WEEKLY', lastUpdated: '2025-11-20 08:30', benchmark: 99.2 },
    { id: '3', metricName: 'Dock-to-Stock Time', category: 'EFFICIENCY', operator: 'Giuseppe Verdi', department: 'Receiving', currentValue: 35, targetValue: 45, unit: 'minutes', performance: 129, trend: 'IMPROVING', status: 'EXCELLENT', period: 'DAILY', lastUpdated: '2025-11-20 09:15', benchmark: 40 },
    { id: '4', metricName: 'Damage Rate', category: 'QUALITY', operator: 'Anna Neri', department: 'Warehouse', currentValue: 0.8, targetValue: 0.5, unit: '%', performance: 63, trend: 'DECLINING', status: 'BELOW_TARGET', period: 'MONTHLY', lastUpdated: '2025-11-20 08:00', benchmark: 0.5 },
    { id: '5', metricName: 'Safety Incidents', category: 'SAFETY', operator: 'All Staff', department: 'Warehouse', currentValue: 2, targetValue: 0, unit: 'incidents', performance: 0, trend: 'DECLINING', status: 'CRITICAL', period: 'MONTHLY', lastUpdated: '2025-11-20 07:30', benchmark: 0 },
    { id: '6', metricName: 'Pallet Moves per Hour', category: 'PRODUCTIVITY', operator: 'Marco Blu', department: 'Forklift Ops', currentValue: 22, targetValue: 25, unit: 'pallets/hour', performance: 88, trend: 'STABLE', status: 'AVERAGE', period: 'DAILY', lastUpdated: '2025-11-20 09:30', benchmark: 27 },
    { id: '7', metricName: 'Inventory Count Accuracy', category: 'ACCURACY', operator: 'Sofia Rossi', department: 'Inventory', currentValue: 99.8, targetValue: 99.5, unit: '%', performance: 100, trend: 'IMPROVING', status: 'EXCELLENT', period: 'WEEKLY', lastUpdated: '2025-11-20 08:45', benchmark: 99.6 },
    { id: '8', metricName: 'Order Fulfillment Time', category: 'EFFICIENCY', operator: 'Team A', department: 'Fulfillment', currentValue: 18, targetValue: 24, unit: 'hours', performance: 133, trend: 'IMPROVING', status: 'EXCELLENT', period: 'DAILY', lastUpdated: '2025-11-20 09:00', benchmark: 20 }
  ];

  const filteredMetrics = mockMetrics.filter(m => {
    const matchesSearch = m.metricName.toLowerCase().includes(searchTerm.toLowerCase()) || m.operator.toLowerCase().includes(searchTerm.toLowerCase()) || m.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalMetrics = mockMetrics.length;
  const excellentCount = mockMetrics.filter(m => m.status === 'EXCELLENT').length;
  const criticalCount = mockMetrics.filter(m => m.status === 'CRITICAL').length;
  const avgPerformance = mockMetrics.reduce((sum, m) => sum + m.performance, 0) / mockMetrics.length;
  const improvingCount = mockMetrics.filter(m => m.trend === 'IMPROVING').length;

  const getStatusBadge = (status: PerformanceMetric['status']) => {
    const variants: Record<PerformanceMetric['status'], 'default' | 'success' | 'warning' | 'danger'> = { EXCELLENT: 'success', GOOD: 'success', AVERAGE: 'warning', BELOW_TARGET: 'warning', CRITICAL: 'danger' };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getTrendBadge = (trend: PerformanceMetric['trend']) => {
    const variants: Record<PerformanceMetric['trend'], 'success' | 'warning' | 'danger'> = { IMPROVING: 'success', STABLE: 'warning', DECLINING: 'danger' };
    return <Badge variant={variants[trend]}>{trend}</Badge>;
  };

  const columns = [
    { header: 'Metric Name', accessor: 'metricName' as keyof PerformanceMetric },
    { header: 'Category', accessor: 'category' as keyof PerformanceMetric },
    { header: 'Operator', accessor: 'operator' as keyof PerformanceMetric },
    { header: 'Department', accessor: 'department' as keyof PerformanceMetric },
    { header: 'Current', accessor: 'currentValue' as keyof PerformanceMetric, render: (m: PerformanceMetric) => <span className="font-medium">{m.currentValue} {m.unit}</span> },
    { header: 'Target', accessor: 'targetValue' as keyof PerformanceMetric, render: (m: PerformanceMetric) => <span>{m.targetValue} {m.unit}</span> },
    { header: 'Performance', accessor: 'performance' as keyof PerformanceMetric, render: (m: PerformanceMetric) => <span className={`font-medium ${m.performance >= 100 ? 'text-green-600' : m.performance >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>{m.performance}%</span> },
    { header: 'Status', accessor: 'status' as keyof PerformanceMetric, render: (m: PerformanceMetric) => getStatusBadge(m.status) },
    { header: 'Trend', accessor: 'trend' as keyof PerformanceMetric, render: (m: PerformanceMetric) => getTrendBadge(m.trend) }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1><p className="text-gray-600 mt-1">Monitor and analyze warehouse KPIs</p></div>
          <div className="flex gap-2">
            <Button variant="secondary"><Target className="w-4 h-4 mr-2" />Set Targets</Button>
            <Button variant="primary"><Award className="w-4 h-4 mr-2" />Generate Report</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Metrics</p><p className="text-2xl font-bold text-gray-900">{totalMetrics}</p></div><Target className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Excellent</p><p className="text-2xl font-bold text-green-600">{excellentCount}</p></div><Award className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Critical</p><p className="text-2xl font-bold text-red-600">{criticalCount}</p></div><Clock className="w-8 h-8 text-red-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Performance</p><p className="text-2xl font-bold text-purple-600">{avgPerformance.toFixed(0)}%</p></div><TrendingUp className="w-8 h-8 text-purple-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Improving</p><p className="text-2xl font-bold text-orange-600">{improvingCount}</p></div><Users className="w-8 h-8 text-orange-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search metrics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Categories</option><option value="PRODUCTIVITY">Productivity</option><option value="ACCURACY">Accuracy</option><option value="EFFICIENCY">Efficiency</option><option value="QUALITY">Quality</option><option value="SAFETY">Safety</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option><option value="EXCELLENT">Excellent</option><option value="GOOD">Good</option><option value="AVERAGE">Average</option><option value="BELOW_TARGET">Below Target</option><option value="CRITICAL">Critical</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredMetrics} onRowClick={(m) => setSelectedMetric(m)} /></Card>

      {selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Metric: {selectedMetric.metricName}</h2>
              <Button variant="secondary" onClick={() => setSelectedMetric(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3><p className="text-gray-900">{selectedMetric.category}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3><p className="text-gray-900">{selectedMetric.department}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Operator</h3><p className="text-gray-900">{selectedMetric.operator}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Period</h3><p className="text-gray-900">{selectedMetric.period}</p></div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded"><p className="text-sm text-blue-600 mb-1">Current Value</p><p className="text-2xl font-bold text-blue-900">{selectedMetric.currentValue}</p><p className="text-xs text-gray-600">{selectedMetric.unit}</p></div>
                  <div className="bg-orange-50 p-4 rounded"><p className="text-sm text-orange-600 mb-1">Target Value</p><p className="text-2xl font-bold text-orange-900">{selectedMetric.targetValue}</p><p className="text-xs text-gray-600">{selectedMetric.unit}</p></div>
                  <div className="bg-green-50 p-4 rounded"><p className="text-sm text-green-600 mb-1">Benchmark</p><p className="text-2xl font-bold text-green-900">{selectedMetric.benchmark}</p><p className="text-xs text-gray-600">{selectedMetric.unit}</p></div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Performance vs Target</span><span className="font-medium">{selectedMetric.performance}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-4"><div className={`h-4 rounded-full ${selectedMetric.performance >= 100 ? 'bg-green-600' : selectedMetric.performance >= 80 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${Math.min(selectedMetric.performance, 100)}%` }}></div></div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Status & Trend</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>{getStatusBadge(selectedMetric.status)}</div>
                  <div><h3 className="text-sm font-medium text-gray-500 mb-2">Trend</h3>{getTrendBadge(selectedMetric.trend)}</div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Last Updated</h3>
                <p className="text-gray-600">{selectedMetric.lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetricsPage;

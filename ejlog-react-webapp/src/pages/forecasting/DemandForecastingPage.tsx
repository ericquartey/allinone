import { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface ForecastItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  avgDailyDemand: number;
  forecastedDemand: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
  accuracy: number;
  confidence: number;
  forecastPeriod: '7_DAYS' | '14_DAYS' | '30_DAYS' | '90_DAYS';
  seasonalFactor: number;
  recommendedOrder: number;
  stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  leadTime: number;
  safetyStock: number;
  reorderPoint: number;
  lastUpdated: string;
}

const DemandForecastingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<ForecastItem | null>(null);

  const mockForecasts: ForecastItem[] = [
    { id: '1', productCode: 'PROD-001', productName: 'Laptop Dell XPS 15', category: 'Electronics', currentStock: 45, avgDailyDemand: 8.5, forecastedDemand: 255, trend: 'INCREASING', accuracy: 92, confidence: 88, forecastPeriod: '30_DAYS', seasonalFactor: 1.15, recommendedOrder: 150, stockoutRisk: 'MEDIUM', leadTime: 7, safetyStock: 60, reorderPoint: 120, lastUpdated: '2025-11-20 09:00' },
    { id: '2', productCode: 'PROD-002', productName: 'Office Chair Ergonomic', category: 'Furniture', currentStock: 120, avgDailyDemand: 5.2, forecastedDemand: 156, trend: 'STABLE', accuracy: 95, confidence: 92, forecastPeriod: '30_DAYS', seasonalFactor: 1.0, recommendedOrder: 80, stockoutRisk: 'LOW', leadTime: 14, safetyStock: 75, reorderPoint: 150, lastUpdated: '2025-11-20 08:30' },
    { id: '3', productCode: 'PROD-003', productName: 'Wireless Mouse Logitech', category: 'Accessories', currentStock: 15, avgDailyDemand: 12.3, forecastedDemand: 369, trend: 'INCREASING', accuracy: 89, confidence: 85, forecastPeriod: '30_DAYS', seasonalFactor: 1.25, recommendedOrder: 300, stockoutRisk: 'CRITICAL', leadTime: 5, safetyStock: 100, reorderPoint: 160, lastUpdated: '2025-11-20 09:15' },
    { id: '4', productCode: 'PROD-004', productName: 'Monitor Samsung 27"', category: 'Electronics', currentStock: 88, avgDailyDemand: 6.8, forecastedDemand: 204, trend: 'STABLE', accuracy: 94, confidence: 91, forecastPeriod: '30_DAYS', seasonalFactor: 1.05, recommendedOrder: 100, stockoutRisk: 'LOW', leadTime: 10, safetyStock: 70, reorderPoint: 138, lastUpdated: '2025-11-20 08:45' },
    { id: '5', productCode: 'PROD-005', productName: 'USB-C Hub Adapter', category: 'Accessories', currentStock: 35, avgDailyDemand: 15.7, forecastedDemand: 471, trend: 'VOLATILE', accuracy: 78, confidence: 72, forecastPeriod: '30_DAYS', seasonalFactor: 1.35, recommendedOrder: 400, stockoutRisk: 'HIGH', leadTime: 3, safetyStock: 120, reorderPoint: 167, lastUpdated: '2025-11-20 09:30' },
    { id: '6', productCode: 'PROD-006', productName: 'Desk Lamp LED', category: 'Furniture', currentStock: 200, avgDailyDemand: 3.2, forecastedDemand: 96, trend: 'DECREASING', accuracy: 91, confidence: 87, forecastPeriod: '30_DAYS', seasonalFactor: 0.85, recommendedOrder: 0, stockoutRisk: 'LOW', leadTime: 12, safetyStock: 40, reorderPoint: 80, lastUpdated: '2025-11-20 08:00' },
    { id: '7', productCode: 'PROD-007', productName: 'Mechanical Keyboard RGB', category: 'Accessories', currentStock: 52, avgDailyDemand: 9.4, forecastedDemand: 282, trend: 'INCREASING', accuracy: 93, confidence: 90, forecastPeriod: '30_DAYS', seasonalFactor: 1.18, recommendedOrder: 200, stockoutRisk: 'MEDIUM', leadTime: 8, safetyStock: 80, reorderPoint: 155, lastUpdated: '2025-11-20 09:00' },
    { id: '8', productCode: 'PROD-008', productName: 'Webcam HD Logitech', category: 'Electronics', currentStock: 8, avgDailyDemand: 18.5, forecastedDemand: 555, trend: 'INCREASING', accuracy: 87, confidence: 83, forecastPeriod: '30_DAYS', seasonalFactor: 1.40, recommendedOrder: 500, stockoutRisk: 'CRITICAL', leadTime: 6, safetyStock: 150, reorderPoint: 261, lastUpdated: '2025-11-20 09:45' }
  ];

  const filteredForecasts = mockForecasts.filter(f => {
    const matchesSearch = f.productCode.toLowerCase().includes(searchTerm.toLowerCase()) || f.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesRisk = riskFilter === 'ALL' || f.stockoutRisk === riskFilter;
    return matchesSearch && matchesCategory && matchesRisk;
  });

  const totalItems = mockForecasts.length;
  const criticalItems = mockForecasts.filter(f => f.stockoutRisk === 'CRITICAL').length;
  const avgAccuracy = mockForecasts.reduce((sum, f) => sum + f.accuracy, 0) / mockForecasts.length;
  const increasingTrend = mockForecasts.filter(f => f.trend === 'INCREASING').length;
  const totalOrderValue = mockForecasts.reduce((sum, f) => sum + f.recommendedOrder, 0);

  const getTrendBadge = (trend: ForecastItem['trend']) => {
    const variants: Record<ForecastItem['trend'], { variant: 'default' | 'success' | 'warning' | 'danger'; icon: any }> = {
      INCREASING: { variant: 'success', icon: TrendingUp },
      DECREASING: { variant: 'danger', icon: TrendingDown },
      STABLE: { variant: 'info', icon: Activity },
      VOLATILE: { variant: 'warning', icon: AlertCircle }
    };
    const config = variants[trend];
    const Icon = config.icon;
    return <Badge variant={config.variant}><Icon className="w-3 h-3 mr-1 inline" />{trend}</Badge>;
  };

  const getRiskBadge = (risk: ForecastItem['stockoutRisk']) => {
    const variants: Record<ForecastItem['stockoutRisk'], 'default' | 'success' | 'warning' | 'danger'> = { LOW: 'success', MEDIUM: 'warning', HIGH: 'warning', CRITICAL: 'danger' };
    return <Badge variant={variants[risk]}>{risk}</Badge>;
  };

  const columns = [
    { header: 'Product Code', accessor: 'productCode' as keyof ForecastItem },
    { header: 'Product Name', accessor: 'productName' as keyof ForecastItem },
    { header: 'Current Stock', accessor: 'currentStock' as keyof ForecastItem, render: (f: ForecastItem) => <span className="font-medium">{f.currentStock}</span> },
    { header: 'Forecasted (30d)', accessor: 'forecastedDemand' as keyof ForecastItem, render: (f: ForecastItem) => <span className="font-medium text-blue-600">{f.forecastedDemand}</span> },
    { header: 'Trend', accessor: 'trend' as keyof ForecastItem, render: (f: ForecastItem) => getTrendBadge(f.trend) },
    { header: 'Accuracy', accessor: 'accuracy' as keyof ForecastItem, render: (f: ForecastItem) => <span className={`font-medium ${f.accuracy >= 90 ? 'text-green-600' : f.accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>{f.accuracy}%</span> },
    { header: 'Stockout Risk', accessor: 'stockoutRisk' as keyof ForecastItem, render: (f: ForecastItem) => getRiskBadge(f.stockoutRisk) },
    { header: 'Recommended Order', accessor: 'recommendedOrder' as keyof ForecastItem, render: (f: ForecastItem) => <span className={`font-medium ${f.recommendedOrder > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{f.recommendedOrder || '-'}</span> }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Demand Forecasting</h1><p className="text-gray-600 mt-1">Predict future demand and optimize inventory</p></div>
          <div className="flex gap-2">
            <Button variant="secondary"><BarChart3 className="w-4 h-4 mr-2" />Generate Report</Button>
            <Button variant="primary"><TrendingUp className="w-4 h-4 mr-2" />Recalculate All</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Items</p><p className="text-2xl font-bold text-gray-900">{totalItems}</p></div><BarChart3 className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Critical Risk</p><p className="text-2xl font-bold text-red-600">{criticalItems}</p></div><AlertCircle className="w-8 h-8 text-red-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Accuracy</p><p className="text-2xl font-bold text-green-600">{avgAccuracy.toFixed(0)}%</p></div><Activity className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Rising Demand</p><p className="text-2xl font-bold text-orange-600">{increasingTrend}</p></div><TrendingUp className="w-8 h-8 text-orange-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Rec. Order Qty</p><p className="text-2xl font-bold text-purple-600">{totalOrderValue}</p></div><TrendingDown className="w-8 h-8 text-purple-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Categories</option><option value="Electronics">Electronics</option><option value="Furniture">Furniture</option><option value="Accessories">Accessories</option>
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Risk Levels</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredForecasts} onRowClick={(f) => setSelectedItem(f)} /></Card>

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Forecast: {selectedItem.productName}</h2>
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Product Code</h3><p className="text-gray-900 font-mono">{selectedItem.productCode}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3><p className="text-gray-900">{selectedItem.category}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Trend</h3>{getTrendBadge(selectedItem.trend)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Stockout Risk</h3>{getRiskBadge(selectedItem.stockoutRisk)}</div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Forecast Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded"><p className="text-sm text-blue-600 mb-1">Current Stock</p><p className="text-2xl font-bold text-blue-900">{selectedItem.currentStock}</p></div>
                  <div className="bg-purple-50 p-4 rounded"><p className="text-sm text-purple-600 mb-1">Avg Daily Demand</p><p className="text-2xl font-bold text-purple-900">{selectedItem.avgDailyDemand.toFixed(1)}</p></div>
                  <div className="bg-orange-50 p-4 rounded"><p className="text-sm text-orange-600 mb-1">Forecasted (30d)</p><p className="text-2xl font-bold text-orange-900">{selectedItem.forecastedDemand}</p></div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Accuracy & Confidence</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Forecast Accuracy</span><span className="font-medium">{selectedItem.accuracy}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${selectedItem.accuracy >= 90 ? 'bg-green-600' : selectedItem.accuracy >= 80 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${selectedItem.accuracy}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Confidence Level</span><span className="font-medium">{selectedItem.confidence}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${selectedItem.confidence >= 85 ? 'bg-green-600' : selectedItem.confidence >= 75 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${selectedItem.confidence}%` }}></div></div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Inventory Planning</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Recommended Order:</span><span className={`font-medium ${selectedItem.recommendedOrder > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{selectedItem.recommendedOrder > 0 ? `${selectedItem.recommendedOrder} units` : 'No order needed'}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Safety Stock:</span><span className="font-medium">{selectedItem.safetyStock} units</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Reorder Point:</span><span className="font-medium">{selectedItem.reorderPoint} units</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Lead Time:</span><span className="font-medium">{selectedItem.leadTime} days</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Seasonal Factor:</span><span className={`font-medium ${selectedItem.seasonalFactor > 1 ? 'text-green-600' : selectedItem.seasonalFactor < 1 ? 'text-red-600' : 'text-gray-900'}`}>{selectedItem.seasonalFactor.toFixed(2)}x</span></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Last Updated</h3>
                <p className="text-gray-600">{selectedItem.lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandForecastingPage;

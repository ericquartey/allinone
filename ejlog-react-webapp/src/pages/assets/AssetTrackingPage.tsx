import { useState } from 'react';
import { ArrowLeft, Search, Package, MapPin, Clock, Wrench, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface Asset {
  id: string;
  assetNumber: string;
  assetName: string;
  assetType: 'FORKLIFT' | 'PALLET_JACK' | 'SCANNER' | 'PRINTER' | 'TRUCK' | 'CONVEYOR' | 'SCALE' | 'COMPUTER';
  status: 'ACTIVE' | 'IN_USE' | 'MAINTENANCE' | 'IDLE' | 'BROKEN' | 'RETIRED';
  location: string;
  assignedTo?: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  lastMaintenance?: string;
  nextMaintenance: string;
  maintenanceStatus: 'OK' | 'DUE' | 'OVERDUE';
  utilizationRate: number;
  hoursUsed: number;
  operatingHours: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  value: number;
}

const AssetTrackingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const mockAssets: Asset[] = [
    { id: '1', assetNumber: 'FORK-001', assetName: 'Forklift Toyota 8FD25', assetType: 'FORKLIFT', status: 'IN_USE', location: 'Storage Zone A', assignedTo: 'Mario Rossi', manufacturer: 'Toyota', model: '8FD25', serialNumber: 'TY-8FD-2024-001', purchaseDate: '2024-01-15', lastMaintenance: '2025-10-15', nextMaintenance: '2025-12-15', maintenanceStatus: 'OK', utilizationRate: 85, hoursUsed: 1250, operatingHours: 1500, condition: 'GOOD', value: 25000 },
    { id: '2', assetNumber: 'SCAN-042', assetName: 'Handheld Scanner Zebra', assetType: 'SCANNER', status: 'ACTIVE', location: 'Picking Zone 1', assignedTo: 'Laura Bianchi', manufacturer: 'Zebra', model: 'MC3300', serialNumber: 'ZB-MC-2024-042', purchaseDate: '2024-03-20', lastMaintenance: '2025-09-01', nextMaintenance: '2026-03-01', maintenanceStatus: 'OK', utilizationRate: 92, hoursUsed: 2100, operatingHours: 2500, condition: 'EXCELLENT', value: 1200 },
    { id: '3', assetNumber: 'TRUCK-005', assetName: 'Delivery Truck Iveco Daily', assetType: 'TRUCK', status: 'MAINTENANCE', location: 'Workshop', manufacturer: 'Iveco', model: 'Daily 35S14', serialNumber: 'IV-DL-2023-005', purchaseDate: '2023-06-10', lastMaintenance: '2025-11-18', nextMaintenance: '2025-12-18', maintenanceStatus: 'OK', utilizationRate: 75, hoursUsed: 3500, operatingHours: 5000, condition: 'GOOD', value: 35000 },
    { id: '4', assetNumber: 'PRINT-015', assetName: 'Label Printer Zebra ZD620', assetType: 'PRINTER', status: 'BROKEN', location: 'Receiving Dock 1', manufacturer: 'Zebra', model: 'ZD620', serialNumber: 'ZB-ZD-2024-015', purchaseDate: '2024-05-12', lastMaintenance: '2025-08-10', nextMaintenance: '2025-11-10', maintenanceStatus: 'OVERDUE', utilizationRate: 0, hoursUsed: 850, operatingHours: 1000, condition: 'POOR', value: 800 },
    { id: '5', assetNumber: 'JACK-008', assetName: 'Electric Pallet Jack', assetType: 'PALLET_JACK', status: 'IDLE', location: 'Staging Area', manufacturer: 'Crown', model: 'PE4500', serialNumber: 'CR-PE-2024-008', purchaseDate: '2024-02-28', lastMaintenance: '2025-09-20', nextMaintenance: '2025-11-20', maintenanceStatus: 'DUE', utilizationRate: 45, hoursUsed: 680, operatingHours: 1500, condition: 'GOOD', value: 8500 },
    { id: '6', assetNumber: 'CONV-001', assetName: 'Conveyor Belt System', assetType: 'CONVEYOR', status: 'ACTIVE', location: 'Shipping Dock 2', manufacturer: 'Hytrol', model: 'ProSort 400', serialNumber: 'HY-PS-2022-001', purchaseDate: '2022-11-05', lastMaintenance: '2025-10-01', nextMaintenance: '2026-01-01', maintenanceStatus: 'OK', utilizationRate: 95, hoursUsed: 12000, operatingHours: 15000, condition: 'FAIR', value: 45000 },
    { id: '7', assetNumber: 'SCALE-003', assetName: 'Industrial Scale Mettler Toledo', assetType: 'SCALE', status: 'ACTIVE', location: 'Receiving Dock 2', manufacturer: 'Mettler Toledo', model: 'IND570', serialNumber: 'MT-IN-2023-003', purchaseDate: '2023-08-15', lastMaintenance: '2025-11-01', nextMaintenance: '2026-02-01', maintenanceStatus: 'OK', utilizationRate: 70, hoursUsed: 4200, operatingHours: 6000, condition: 'GOOD', value: 3500 },
    { id: '8', assetNumber: 'PC-025', assetName: 'Warehouse Workstation PC', assetType: 'COMPUTER', status: 'ACTIVE', location: 'Office Zone', assignedTo: 'Giuseppe Verdi', manufacturer: 'Dell', model: 'OptiPlex 7090', serialNumber: 'DL-OP-2024-025', purchaseDate: '2024-04-10', nextMaintenance: '2026-04-10', maintenanceStatus: 'OK', utilizationRate: 88, hoursUsed: 1800, operatingHours: 2000, condition: 'EXCELLENT', value: 1500 }
  ];

  const filteredAssets = mockAssets.filter(a => {
    const matchesSearch = a.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) || a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) || a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.assetType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalAssets = mockAssets.length;
  const activeAssets = mockAssets.filter(a => ['ACTIVE', 'IN_USE'].includes(a.status)).length;
  const maintenanceNeeded = mockAssets.filter(a => a.maintenanceStatus === 'DUE' || a.maintenanceStatus === 'OVERDUE').length;
  const brokenAssets = mockAssets.filter(a => a.status === 'BROKEN').length;
  const avgUtilization = mockAssets.filter(a => a.status !== 'RETIRED').reduce((sum, a) => sum + a.utilizationRate, 0) / mockAssets.filter(a => a.status !== 'RETIRED').length;

  const getStatusBadge = (status: Asset['status']) => {
    const variants: Record<Asset['status'], 'default' | 'success' | 'warning' | 'danger'> = { ACTIVE: 'success', IN_USE: 'info', MAINTENANCE: 'warning', IDLE: 'default', BROKEN: 'danger', RETIRED: 'default' };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getMaintenanceBadge = (status: Asset['maintenanceStatus']) => {
    const variants: Record<Asset['maintenanceStatus'], 'success' | 'warning' | 'danger'> = { OK: 'success', DUE: 'warning', OVERDUE: 'danger' };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getConditionBadge = (condition: Asset['condition']) => {
    const variants: Record<Asset['condition'], 'success' | 'warning' | 'danger'> = { EXCELLENT: 'success', GOOD: 'success', FAIR: 'warning', POOR: 'danger' };
    return <Badge variant={variants[condition]}>{condition}</Badge>;
  };

  const columns = [
    { header: 'Asset #', accessor: 'assetNumber' as keyof Asset },
    { header: 'Name', accessor: 'assetName' as keyof Asset },
    { header: 'Type', accessor: 'assetType' as keyof Asset, render: (a: Asset) => <span className="text-xs">{a.assetType.replace('_', ' ')}</span> },
    { header: 'Status', accessor: 'status' as keyof Asset, render: (a: Asset) => getStatusBadge(a.status) },
    { header: 'Location', accessor: 'location' as keyof Asset },
    { header: 'Assigned To', accessor: 'assignedTo' as keyof Asset, render: (a: Asset) => a.assignedTo || <span className="text-gray-400">-</span> },
    { header: 'Maintenance', accessor: 'maintenanceStatus' as keyof Asset, render: (a: Asset) => getMaintenanceBadge(a.maintenanceStatus) },
    { header: 'Utilization', accessor: 'utilizationRate' as keyof Asset, render: (a: Asset) => <span className={`font-medium ${a.utilizationRate >= 80 ? 'text-green-600' : a.utilizationRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{a.utilizationRate}%</span> }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Asset Tracking</h1><p className="text-gray-600 mt-1">Monitor and manage warehouse assets</p></div>
          <div className="flex gap-2">
            <Button variant="secondary"><Wrench className="w-4 h-4 mr-2" />Schedule Maintenance</Button>
            <Button variant="primary"><Package className="w-4 h-4 mr-2" />Add Asset</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Assets</p><p className="text-2xl font-bold text-gray-900">{totalAssets}</p></div><Package className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-green-600">{activeAssets}</p></div><MapPin className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Maintenance Needed</p><p className="text-2xl font-bold text-orange-600">{maintenanceNeeded}</p></div><Wrench className="w-8 h-8 text-orange-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Broken</p><p className="text-2xl font-bold text-red-600">{brokenAssets}</p></div><AlertCircle className="w-8 h-8 text-red-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Utilization</p><p className="text-2xl font-bold text-purple-600">{avgUtilization.toFixed(0)}%</p></div><Clock className="w-8 h-8 text-purple-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Types</option><option value="FORKLIFT">Forklift</option><option value="PALLET_JACK">Pallet Jack</option><option value="SCANNER">Scanner</option><option value="PRINTER">Printer</option><option value="TRUCK">Truck</option><option value="CONVEYOR">Conveyor</option><option value="SCALE">Scale</option><option value="COMPUTER">Computer</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="IN_USE">In Use</option><option value="MAINTENANCE">Maintenance</option><option value="IDLE">Idle</option><option value="BROKEN">Broken</option><option value="RETIRED">Retired</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredAssets} onRowClick={(a) => setSelectedAsset(a)} /></Card>

      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Asset: {selectedAsset.assetNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedAsset(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>{getStatusBadge(selectedAsset.status)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Condition</h3>{getConditionBadge(selectedAsset.condition)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3><p className="text-gray-900">{selectedAsset.assetType.replace('_', ' ')}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3><p className="text-gray-900">{selectedAsset.location}</p></div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Asset Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Manufacturer:</span><span className="font-medium">{selectedAsset.manufacturer}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Model:</span><span className="font-medium">{selectedAsset.model}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Serial Number:</span><span className="font-medium font-mono text-sm">{selectedAsset.serialNumber}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Purchase Date:</span><span className="font-medium">{selectedAsset.purchaseDate}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Value:</span><span className="font-medium">${selectedAsset.value.toLocaleString()}</span></div>
                  {selectedAsset.assignedTo && <div className="flex justify-between"><span className="text-sm text-gray-600">Assigned To:</span><span className="font-medium">{selectedAsset.assignedTo}</span></div>}
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Utilization</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Utilization Rate</span><span className="font-medium">{selectedAsset.utilizationRate}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${selectedAsset.utilizationRate >= 80 ? 'bg-green-600' : selectedAsset.utilizationRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${selectedAsset.utilizationRate}%` }}></div></div>
                  </div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Hours Used:</span><span className="font-medium">{selectedAsset.hoursUsed} / {selectedAsset.operatingHours} hours</span></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Maintenance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Status:</span>{getMaintenanceBadge(selectedAsset.maintenanceStatus)}</div>
                  {selectedAsset.lastMaintenance && <div className="flex justify-between"><span className="text-sm text-gray-600">Last Maintenance:</span><span className="font-medium">{selectedAsset.lastMaintenance}</span></div>}
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Next Maintenance:</span><span className={`font-medium ${selectedAsset.maintenanceStatus === 'OVERDUE' ? 'text-red-600' : selectedAsset.maintenanceStatus === 'DUE' ? 'text-yellow-600' : 'text-green-600'}`}>{selectedAsset.nextMaintenance}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTrackingPage;

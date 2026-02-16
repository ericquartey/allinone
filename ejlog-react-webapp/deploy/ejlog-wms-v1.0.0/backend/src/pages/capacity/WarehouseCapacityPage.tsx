import { useState } from 'react';
import { ArrowLeft, Search, Box, TrendingUp, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface CapacityZone {
  id: string;
  zoneName: string;
  zoneCode: string;
  zoneType: 'STORAGE' | 'PICKING' | 'STAGING' | 'RECEIVING' | 'SHIPPING' | 'QUARANTINE';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'FULL' | 'MAINTENANCE';
  totalLocations: number;
  occupiedLocations: number;
  occupancyRate: number;
  totalCapacity: number;
  usedCapacity: number;
  capacityUnit: 'PALLETS' | 'UNITS' | 'M3' | 'KG';
  availableCapacity: number;
  reservedCapacity: number;
  utilizationRate: number;
  forecastedFull: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastUpdated: string;
}

const WarehouseCapacityPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<CapacityZone | null>(null);

  const mockZones: CapacityZone[] = [
    { id: '1', zoneName: 'Storage Zone A', zoneCode: 'ZONE-A', zoneType: 'STORAGE', status: 'WARNING', totalLocations: 500, occupiedLocations: 425, occupancyRate: 85, totalCapacity: 2000, usedCapacity: 1700, capacityUnit: 'PALLETS', availableCapacity: 300, reservedCapacity: 150, utilizationRate: 85, forecastedFull: '2025-12-15', priority: 'HIGH', lastUpdated: '2025-11-20 09:30' },
    { id: '2', zoneName: 'Picking Zone 1', zoneCode: 'PICK-01', zoneType: 'PICKING', status: 'NORMAL', totalLocations: 300, occupiedLocations: 180, occupancyRate: 60, totalCapacity: 15000, usedCapacity: 9000, capacityUnit: 'UNITS', availableCapacity: 6000, reservedCapacity: 2000, utilizationRate: 60, forecastedFull: '2026-02-20', priority: 'MEDIUM', lastUpdated: '2025-11-20 09:15' },
    { id: '3', zoneName: 'Storage Zone B', zoneCode: 'ZONE-B', zoneType: 'STORAGE', status: 'CRITICAL', totalLocations: 600, occupiedLocations: 570, occupancyRate: 95, totalCapacity: 2400, usedCapacity: 2280, capacityUnit: 'PALLETS', availableCapacity: 120, reservedCapacity: 80, utilizationRate: 95, forecastedFull: '2025-11-25', priority: 'CRITICAL', lastUpdated: '2025-11-20 09:45' },
    { id: '4', zoneName: 'Receiving Dock 1', zoneCode: 'REC-01', zoneType: 'RECEIVING', status: 'NORMAL', totalLocations: 50, occupiedLocations: 22, occupancyRate: 44, totalCapacity: 5000, usedCapacity: 2200, capacityUnit: 'M3', availableCapacity: 2800, reservedCapacity: 500, utilizationRate: 44, forecastedFull: '2026-01-30', priority: 'LOW', lastUpdated: '2025-11-20 08:00' },
    { id: '5', zoneName: 'Staging Area', zoneCode: 'STAGE-01', zoneType: 'STAGING', status: 'WARNING', totalLocations: 100, occupiedLocations: 78, occupancyRate: 78, totalCapacity: 500, usedCapacity: 390, capacityUnit: 'PALLETS', availableCapacity: 110, reservedCapacity: 60, utilizationRate: 78, forecastedFull: '2025-12-05', priority: 'HIGH', lastUpdated: '2025-11-20 09:00' },
    { id: '6', zoneName: 'Quarantine Zone', zoneCode: 'QUA-01', zoneType: 'QUARANTINE', status: 'NORMAL', totalLocations: 80, occupiedLocations: 12, occupancyRate: 15, totalCapacity: 320, usedCapacity: 48, capacityUnit: 'PALLETS', availableCapacity: 272, reservedCapacity: 20, utilizationRate: 15, forecastedFull: '2026-06-15', priority: 'LOW', lastUpdated: '2025-11-20 07:30' },
    { id: '7', zoneName: 'Shipping Dock 2', zoneCode: 'SHIP-02', zoneType: 'SHIPPING', status: 'FULL', totalLocations: 40, occupiedLocations: 40, occupancyRate: 100, totalCapacity: 4000, usedCapacity: 4000, capacityUnit: 'M3', availableCapacity: 0, reservedCapacity: 0, utilizationRate: 100, forecastedFull: 'NOW', priority: 'CRITICAL', lastUpdated: '2025-11-20 10:00' },
    { id: '8', zoneName: 'Storage Zone C', zoneCode: 'ZONE-C', zoneType: 'STORAGE', status: 'MAINTENANCE', totalLocations: 450, occupiedLocations: 0, occupancyRate: 0, totalCapacity: 1800, usedCapacity: 0, capacityUnit: 'PALLETS', availableCapacity: 0, reservedCapacity: 0, utilizationRate: 0, forecastedFull: 'N/A', priority: 'MEDIUM', lastUpdated: '2025-11-19 16:00' }
  ];

  const filteredZones = mockZones.filter(z => {
    const matchesSearch = z.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) || z.zoneCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = zoneTypeFilter === 'ALL' || z.zoneType === zoneTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || z.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalLocations = mockZones.reduce((sum, z) => sum + z.totalLocations, 0);
  const occupiedLocations = mockZones.reduce((sum, z) => sum + z.occupiedLocations, 0);
  const avgUtilization = mockZones.filter(z => z.status !== 'MAINTENANCE').reduce((sum, z) => sum + z.utilizationRate, 0) / mockZones.filter(z => z.status !== 'MAINTENANCE').length;
  const criticalZones = mockZones.filter(z => z.status === 'CRITICAL' || z.status === 'FULL').length;
  const availableLocations = totalLocations - occupiedLocations;

  const getStatusBadge = (status: CapacityZone['status']) => {
    const variants: Record<CapacityZone['status'], 'default' | 'success' | 'warning' | 'danger'> = { NORMAL: 'success', WARNING: 'warning', CRITICAL: 'danger', FULL: 'danger', MAINTENANCE: 'default' };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: CapacityZone['priority']) => {
    const variants: Record<CapacityZone['priority'], 'default' | 'warning' | 'danger'> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'warning', CRITICAL: 'danger' };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const columns = [
    { header: 'Zone Name', accessor: 'zoneName' as keyof CapacityZone },
    { header: 'Code', accessor: 'zoneCode' as keyof CapacityZone },
    { header: 'Type', accessor: 'zoneType' as keyof CapacityZone },
    { header: 'Status', accessor: 'status' as keyof CapacityZone, render: (z: CapacityZone) => getStatusBadge(z.status) },
    { header: 'Locations', accessor: 'occupiedLocations' as keyof CapacityZone, render: (z: CapacityZone) => <span className="font-medium">{z.occupiedLocations}/{z.totalLocations}</span> },
    { header: 'Capacity', accessor: 'usedCapacity' as keyof CapacityZone, render: (z: CapacityZone) => <span>{z.usedCapacity}/{z.totalCapacity} {z.capacityUnit}</span> },
    { header: 'Utilization', accessor: 'utilizationRate' as keyof CapacityZone, render: (z: CapacityZone) => <div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${z.utilizationRate >= 90 ? 'bg-red-600' : z.utilizationRate >= 75 ? 'bg-yellow-600' : 'bg-green-600'}`} style={{ width: `${z.utilizationRate}%` }}></div></div><span className="text-sm font-medium">{z.utilizationRate}%</span></div> },
    { header: 'Priority', accessor: 'priority' as keyof CapacityZone, render: (z: CapacityZone) => getPriorityBadge(z.priority) }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Warehouse Capacity</h1><p className="text-gray-600 mt-1">Monitor space utilization and capacity planning</p></div>
          <Button variant="primary"><Database className="w-4 h-4 mr-2" />Capacity Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Locations</p><p className="text-2xl font-bold text-gray-900">{totalLocations}</p></div><Box className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Occupied</p><p className="text-2xl font-bold text-orange-600">{occupiedLocations}</p></div><Database className="w-8 h-8 text-orange-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Available</p><p className="text-2xl font-bold text-green-600">{availableLocations}</p></div><CheckCircle className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Utilization</p><p className="text-2xl font-bold text-blue-600">{avgUtilization.toFixed(0)}%</p></div><TrendingUp className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Critical Zones</p><p className="text-2xl font-bold text-red-600">{criticalZones}</p></div><AlertTriangle className="w-8 h-8 text-red-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search zones..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={zoneTypeFilter} onChange={(e) => setZoneTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Types</option><option value="STORAGE">Storage</option><option value="PICKING">Picking</option><option value="STAGING">Staging</option><option value="RECEIVING">Receiving</option><option value="SHIPPING">Shipping</option><option value="QUARANTINE">Quarantine</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option><option value="NORMAL">Normal</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option><option value="FULL">Full</option><option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredZones} onRowClick={(z) => setSelectedZone(z)} /></Card>

      {selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Zone: {selectedZone.zoneName}</h2>
              <Button variant="secondary" onClick={() => setSelectedZone(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>{getStatusBadge(selectedZone.status)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>{getPriorityBadge(selectedZone.priority)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Zone Code</h3><p className="text-gray-900">{selectedZone.zoneCode}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Zone Type</h3><p className="text-gray-900">{selectedZone.zoneType}</p></div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Capacity Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Location Occupancy</span><span className="font-medium">{selectedZone.occupiedLocations}/{selectedZone.totalLocations} ({selectedZone.occupancyRate}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${selectedZone.occupancyRate >= 90 ? 'bg-red-600' : selectedZone.occupancyRate >= 75 ? 'bg-yellow-600' : 'bg-green-600'}`} style={{ width: `${selectedZone.occupancyRate}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Capacity Utilization</span><span className="font-medium">{selectedZone.usedCapacity}/{selectedZone.totalCapacity} {selectedZone.capacityUnit} ({selectedZone.utilizationRate}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${selectedZone.utilizationRate >= 90 ? 'bg-red-600' : selectedZone.utilizationRate >= 75 ? 'bg-yellow-600' : 'bg-green-600'}`} style={{ width: `${selectedZone.utilizationRate}%` }}></div></div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Capacity Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded"><p className="text-sm text-green-600 mb-1">Available</p><p className="text-2xl font-bold text-green-900">{selectedZone.availableCapacity}</p><p className="text-xs text-gray-600">{selectedZone.capacityUnit}</p></div>
                  <div className="bg-blue-50 p-4 rounded"><p className="text-sm text-blue-600 mb-1">Reserved</p><p className="text-2xl font-bold text-blue-900">{selectedZone.reservedCapacity}</p><p className="text-xs text-gray-600">{selectedZone.capacityUnit}</p></div>
                  <div className="bg-orange-50 p-4 rounded"><p className="text-sm text-orange-600 mb-1">Used</p><p className="text-2xl font-bold text-orange-900">{selectedZone.usedCapacity}</p><p className="text-xs text-gray-600">{selectedZone.capacityUnit}</p></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Forecasting</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Forecasted Full:</span><span className={`font-medium ${selectedZone.forecastedFull === 'NOW' ? 'text-red-600' : selectedZone.forecastedFull === 'N/A' ? 'text-gray-400' : 'text-gray-900'}`}>{selectedZone.forecastedFull}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Last Updated:</span><span className="font-medium">{selectedZone.lastUpdated}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseCapacityPage;

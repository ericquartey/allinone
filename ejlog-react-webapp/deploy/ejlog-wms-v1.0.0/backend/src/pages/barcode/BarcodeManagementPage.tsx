import { useState } from 'react';
import { ArrowLeft, Search, Barcode, Printer, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';

interface BarcodeRecord {
  id: string;
  barcodeNumber: string;
  barcodeType: 'UPC_A' | 'EAN_13' | 'CODE_128' | 'QR_CODE' | 'DATA_MATRIX' | 'CODE_39';
  status: 'GENERATED' | 'PRINTED' | 'VERIFIED' | 'ACTIVE' | 'INVALID' | 'RETIRED';
  entityType: 'PRODUCT' | 'LOCATION' | 'UDC' | 'ASSET' | 'BATCH' | 'SERIAL';
  entityId: string;
  entityDescription: string;
  generatedDate: string;
  generatedBy: string;
  printedDate?: string;
  printedBy?: string;
  printCount: number;
  lastScanned?: string;
  scanCount: number;
  validationResult?: 'PASSED' | 'FAILED' | 'WARNING';
  errorMessage?: string;
}

const BarcodeManagementPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeRecord | null>(null);

  const mockBarcodes: BarcodeRecord[] = [
    { id: '1', barcodeNumber: '012345678901', barcodeType: 'UPC_A', status: 'ACTIVE', entityType: 'PRODUCT', entityId: 'PROD-001', entityDescription: 'Product ABC', generatedDate: '2025-11-01 10:00', generatedBy: 'System', printedDate: '2025-11-01 10:30', printedBy: 'Mario Rossi', printCount: 5, lastScanned: '2025-11-20 08:45', scanCount: 127, validationResult: 'PASSED' },
    { id: '2', barcodeNumber: '5901234123457', barcodeType: 'EAN_13', status: 'PRINTED', entityType: 'PRODUCT', entityId: 'PROD-002', entityDescription: 'Product XYZ', generatedDate: '2025-11-15 14:00', generatedBy: 'Laura Bianchi', printedDate: '2025-11-15 14:15', printedBy: 'Laura Bianchi', printCount: 2, scanCount: 0 },
    { id: '3', barcodeNumber: 'LOC-A-01-03', barcodeType: 'CODE_128', status: 'ACTIVE', entityType: 'LOCATION', entityId: 'LOC-5521', entityDescription: 'Warehouse A - Row 01 - Slot 03', generatedDate: '2025-10-20 09:00', generatedBy: 'System', printedDate: '2025-10-20 09:30', printedBy: 'Giuseppe Verdi', printCount: 1, lastScanned: '2025-11-20 09:12', scanCount: 543, validationResult: 'PASSED' },
    { id: '4', barcodeNumber: 'https://wms.example.com/udc/2891', barcodeType: 'QR_CODE', status: 'VERIFIED', entityType: 'UDC', entityId: 'UDC-2891', entityDescription: 'Pallet 2891 - Electronics', generatedDate: '2025-11-18 08:00', generatedBy: 'System', printedDate: '2025-11-18 08:20', printedBy: 'Mario Rossi', printCount: 1, lastScanned: '2025-11-20 07:30', scanCount: 45, validationResult: 'PASSED' },
    { id: '5', barcodeNumber: 'ASSET-FORK-1234', barcodeType: 'CODE_39', status: 'ACTIVE', entityType: 'ASSET', entityId: 'ASSET-1234', entityDescription: 'Forklift - Toyota 8FD25', generatedDate: '2025-09-10 11:00', generatedBy: 'Admin', printedDate: '2025-09-10 11:15', printedBy: 'Admin', printCount: 1, lastScanned: '2025-11-19 17:00', scanCount: 89, validationResult: 'PASSED' },
    { id: '6', barcodeNumber: 'BATCH-2025-11-001', barcodeType: 'DATA_MATRIX', status: 'GENERATED', entityType: 'BATCH', entityId: 'BATCH-001', entityDescription: 'Production Batch Nov 2025', generatedDate: '2025-11-20 06:00', generatedBy: 'Laura Bianchi', printCount: 0, scanCount: 0 },
    { id: '7', barcodeNumber: '0123456789', barcodeType: 'CODE_128', status: 'INVALID', entityType: 'PRODUCT', entityId: 'PROD-999', entityDescription: 'Defective Item', generatedDate: '2025-11-19 15:00', generatedBy: 'System', printedDate: '2025-11-19 15:30', printedBy: 'Mario Rossi', printCount: 1, scanCount: 3, validationResult: 'FAILED', errorMessage: 'Checksum validation failed' },
    { id: '8', barcodeNumber: 'SN-987654321', barcodeType: 'CODE_39', status: 'RETIRED', entityType: 'SERIAL', entityId: 'SERIAL-9876', entityDescription: 'Laptop S/N 987654321 (Disposed)', generatedDate: '2023-05-10 10:00', generatedBy: 'Admin', printedDate: '2023-05-10 10:30', printedBy: 'Admin', printCount: 1, lastScanned: '2025-11-01 12:00', scanCount: 234, validationResult: 'WARNING' }
  ];

  const filteredBarcodes = mockBarcodes.filter(b => {
    const matchesSearch = b.barcodeNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.entityDescription.toLowerCase().includes(searchTerm.toLowerCase()) || b.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || b.barcodeType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalBarcodes = mockBarcodes.length;
  const printedToday = mockBarcodes.filter(b => b.printedDate?.startsWith('2025-11-20')).length;
  const activeCount = mockBarcodes.filter(b => b.status === 'ACTIVE').length;
  const errorCount = mockBarcodes.filter(b => b.status === 'INVALID').length;
  const totalScans = mockBarcodes.reduce((sum, b) => sum + b.scanCount, 0);

  const getStatusBadge = (status: BarcodeRecord['status']) => {
    const variants: Record<BarcodeRecord['status'], 'default' | 'success' | 'warning' | 'danger'> = { GENERATED: 'default', PRINTED: 'info', VERIFIED: 'success', ACTIVE: 'success', INVALID: 'danger', RETIRED: 'warning' };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getValidationBadge = (result?: BarcodeRecord['validationResult']) => {
    if (!result) return <span className="text-gray-400">-</span>;
    const variants: Record<NonNullable<BarcodeRecord['validationResult']>, 'success' | 'warning' | 'danger'> = { PASSED: 'success', WARNING: 'warning', FAILED: 'danger' };
    return <Badge variant={variants[result]}>{result}</Badge>;
  };

  const columns = [
    { header: 'Barcode', accessor: 'barcodeNumber' as keyof BarcodeRecord },
    { header: 'Type', accessor: 'barcodeType' as keyof BarcodeRecord, render: (b: BarcodeRecord) => <span className="text-xs">{b.barcodeType.replace('_', ' ')}</span> },
    { header: 'Status', accessor: 'status' as keyof BarcodeRecord, render: (b: BarcodeRecord) => getStatusBadge(b.status) },
    { header: 'Entity', accessor: 'entityType' as keyof BarcodeRecord, render: (b: BarcodeRecord) => <div className="text-sm"><div className="font-medium">{b.entityType}</div><div className="text-xs text-gray-500">{b.entityId}</div></div> },
    { header: 'Description', accessor: 'entityDescription' as keyof BarcodeRecord },
    { header: 'Prints', accessor: 'printCount' as keyof BarcodeRecord, render: (b: BarcodeRecord) => <span className="font-medium">{b.printCount}</span> },
    { header: 'Scans', accessor: 'scanCount' as keyof BarcodeRecord, render: (b: BarcodeRecord) => <span className="font-medium text-blue-600">{b.scanCount}</span> },
    { header: 'Validation', accessor: 'validationResult' as keyof BarcodeRecord, render: (b: BarcodeRecord) => getValidationBadge(b.validationResult) }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Barcode Management</h1><p className="text-gray-600 mt-1">Generate, print, and validate barcodes</p></div>
          <div className="flex gap-2">
            <Button variant="secondary"><Printer className="w-4 h-4 mr-2" />Print Labels</Button>
            <Button variant="primary"><Barcode className="w-4 h-4 mr-2" />Generate Barcode</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Barcodes</p><p className="text-2xl font-bold text-gray-900">{totalBarcodes}</p></div><Barcode className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Printed Today</p><p className="text-2xl font-bold text-green-600">{printedToday}</p></div><Printer className="w-8 h-8 text-green-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-blue-600">{activeCount}</p></div><CheckCircle className="w-8 h-8 text-blue-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Errors</p><p className="text-2xl font-bold text-red-600">{errorCount}</p></div><XCircle className="w-8 h-8 text-red-500" /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Scans</p><p className="text-2xl font-bold text-purple-600">{totalScans.toLocaleString()}</p></div><AlertCircle className="w-8 h-8 text-purple-500" /></div></Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input type="text" placeholder="Search barcodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Types</option><option value="UPC_A">UPC-A</option><option value="EAN_13">EAN-13</option><option value="CODE_128">Code 128</option><option value="QR_CODE">QR Code</option><option value="DATA_MATRIX">Data Matrix</option><option value="CODE_39">Code 39</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Statuses</option><option value="GENERATED">Generated</option><option value="PRINTED">Printed</option><option value="VERIFIED">Verified</option><option value="ACTIVE">Active</option><option value="INVALID">Invalid</option><option value="RETIRED">Retired</option>
          </select>
        </div>
      </Card>

      <Card><Table columns={columns} data={filteredBarcodes} onRowClick={(b) => setSelectedBarcode(b)} /></Card>

      {selectedBarcode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Barcode: {selectedBarcode.barcodeNumber}</h2>
              <Button variant="secondary" onClick={() => setSelectedBarcode(null)}>Close</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>{getStatusBadge(selectedBarcode.status)}</div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3><p className="text-gray-900">{selectedBarcode.barcodeType.replace('_', ' ')}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Entity Type</h3><p className="text-gray-900">{selectedBarcode.entityType}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500 mb-1">Entity ID</h3><p className="text-gray-900">{selectedBarcode.entityId}</p></div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Barcode Details</h3>
                <div className="bg-gray-50 p-6 rounded text-center mb-4">
                  <div className="bg-white inline-block p-4 rounded border-2 border-gray-300 mb-2"><Barcode className="w-32 h-32 text-gray-900" /></div>
                  <p className="text-lg font-mono font-bold text-gray-900">{selectedBarcode.barcodeNumber}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedBarcode.entityDescription}</p>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded"><p className="text-sm text-blue-600 mb-1">Print Count</p><p className="text-2xl font-bold text-blue-900">{selectedBarcode.printCount}</p></div>
                  <div className="bg-purple-50 p-4 rounded"><p className="text-sm text-purple-600 mb-1">Scan Count</p><p className="text-2xl font-bold text-purple-900">{selectedBarcode.scanCount}</p></div>
                </div>
              </div>
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Generated:</span><span className="font-medium">{selectedBarcode.generatedDate} by {selectedBarcode.generatedBy}</span></div>
                  {selectedBarcode.printedDate && <div className="flex justify-between"><span className="text-sm text-gray-600">Printed:</span><span className="font-medium">{selectedBarcode.printedDate} by {selectedBarcode.printedBy}</span></div>}
                  {selectedBarcode.lastScanned && <div className="flex justify-between"><span className="text-sm text-gray-600">Last Scanned:</span><span className="font-medium">{selectedBarcode.lastScanned}</span></div>}
                </div>
              </div>
              {selectedBarcode.validationResult && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Validation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Result:</span>{getValidationBadge(selectedBarcode.validationResult)}</div>
                    {selectedBarcode.errorMessage && <div className="bg-red-50 border border-red-200 rounded p-3"><p className="text-sm text-red-800"><strong>Error:</strong> {selectedBarcode.errorMessage}</p></div>}
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

export default BarcodeManagementPage;

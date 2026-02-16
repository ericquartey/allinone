import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Return {
  id: string;
  returnNumber: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'INTERNAL';
  status: 'PENDING' | 'RECEIVED' | 'INSPECTING' | 'APPROVED' | 'REJECTED' | 'RESTOCKED' | 'DISPOSED';
  customerName?: string;
  supplierName?: string;
  originalOrder: string;
  reason: string;
  reasonCategory: 'DEFECTIVE' | 'DAMAGED' | 'WRONG_ITEM' | 'EXCESS' | 'EXPIRED' | 'CHANGE_MIND' | 'OTHER';
  itemsCount: number;
  totalValue: number;
  requestedDate: string;
  receivedDate?: string;
  inspectionDate?: string;
  completedDate?: string;
  inspectedBy?: string;
  approvedBy?: string;
  notes?: string;
  refundStatus?: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'DECLINED';
  restockLocation?: string;
}

interface ReturnItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: 'NEW' | 'GOOD' | 'DAMAGED' | 'DEFECTIVE' | 'UNUSABLE';
  inspectionNotes?: string;
  decision: 'RESTOCK' | 'REPAIR' | 'DISPOSE' | 'RETURN_TO_SUPPLIER' | 'PENDING';
  unitValue: number;
}

const ReturnsManagementPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockReturns: Return[] = [
    { id: '1', returnNumber: 'RET-2025-001', type: 'CUSTOMER', status: 'PENDING', customerName: 'Mario Rossi SRL', originalOrder: 'ORD-12345', reason: 'Articolo difettoso', reasonCategory: 'DEFECTIVE', itemsCount: 3, totalValue: 245.80, requestedDate: '2025-11-20T08:00:00', refundStatus: 'PENDING' },
    { id: '2', returnNumber: 'RET-2025-002', type: 'CUSTOMER', status: 'RECEIVED', customerName: 'Tech Solutions SpA', originalOrder: 'ORD-12346', reason: 'Prodotto danneggiato durante trasporto', reasonCategory: 'DAMAGED', itemsCount: 1, totalValue: 189.50, requestedDate: '2025-11-19T14:30:00', receivedDate: '2025-11-20T09:00:00', refundStatus: 'PENDING' },
    { id: '3', returnNumber: 'RET-2025-003', type: 'SUPPLIER', status: 'INSPECTING', supplierName: 'Fornitore ABC', originalOrder: 'PO-5678', reason: 'Articoli in eccesso', reasonCategory: 'EXCESS', itemsCount: 25, totalValue: 1250.00, requestedDate: '2025-11-18T10:00:00', receivedDate: '2025-11-19T11:00:00', inspectionDate: '2025-11-20T08:30:00', inspectedBy: 'Luigi Bianchi' },
    { id: '4', returnNumber: 'RET-2025-004', type: 'CUSTOMER', status: 'APPROVED', customerName: 'Commerciale XYZ', originalOrder: 'ORD-12347', reason: 'Articolo sbagliato inviato', reasonCategory: 'WRONG_ITEM', itemsCount: 2, totalValue: 98.00, requestedDate: '2025-11-17T16:00:00', receivedDate: '2025-11-18T10:00:00', inspectionDate: '2025-11-18T14:00:00', inspectedBy: 'Anna Verdi', approvedBy: 'Marco Neri', refundStatus: 'APPROVED', notes: 'Articoli in buone condizioni, riutilizzabili' },
    { id: '5', returnNumber: 'RET-2025-005', type: 'CUSTOMER', status: 'RESTOCKED', customerName: 'Cliente Premium', originalOrder: 'ORD-12348', reason: 'Ripensamento cliente', reasonCategory: 'CHANGE_MIND', itemsCount: 5, totalValue: 567.30, requestedDate: '2025-11-16T09:00:00', receivedDate: '2025-11-17T08:00:00', inspectionDate: '2025-11-17T10:00:00', completedDate: '2025-11-17T15:00:00', inspectedBy: 'Paolo Rossi', approvedBy: 'Marco Neri', refundStatus: 'COMPLETED', restockLocation: 'A-12-03' },
    { id: '6', returnNumber: 'RET-2025-006', type: 'INTERNAL', status: 'REJECTED', originalOrder: 'INT-789', reason: 'Articoli scaduti', reasonCategory: 'EXPIRED', itemsCount: 15, totalValue: 345.00, requestedDate: '2025-11-15T11:00:00', receivedDate: '2025-11-16T09:00:00', inspectionDate: '2025-11-16T13:00:00', completedDate: '2025-11-16T16:00:00', inspectedBy: 'Giulia Verdi', approvedBy: 'Marco Neri', notes: 'Articoli da smaltire secondo normativa' },
    { id: '7', returnNumber: 'RET-2025-007', type: 'SUPPLIER', status: 'DISPOSED', supplierName: 'Fornitore DEF', originalOrder: 'PO-5679', reason: 'Lotto difettoso', reasonCategory: 'DEFECTIVE', itemsCount: 50, totalValue: 2500.00, requestedDate: '2025-11-14T08:00:00', receivedDate: '2025-11-15T10:00:00', inspectionDate: '2025-11-15T14:00:00', completedDate: '2025-11-19T10:00:00', inspectedBy: 'Anna Verdi', approvedBy: 'Marco Neri', notes: 'Lotto intero da smaltire, rimborso concordato con fornitore' }
  ];

  const mockReturnItems: { [key: string]: ReturnItem[] } = {
    '1': [
      { id: 'I1', productCode: 'PROD-001', productName: 'Widget Base', quantity: 2, reason: 'Non funzionante', condition: 'DEFECTIVE', decision: 'PENDING', unitValue: 89.90 },
      { id: 'I2', productCode: 'PROD-002', productName: 'Component X', quantity: 1, reason: 'Parti rotte', condition: 'DAMAGED', decision: 'PENDING', unitValue: 66.00 }
    ],
    '4': [
      { id: 'I3', productCode: 'PROD-003', productName: 'Gadget Pro', quantity: 2, reason: 'Codice errato', condition: 'NEW', decision: 'RESTOCK', unitValue: 49.00, inspectionNotes: 'Confezione originale integra' }
    ]
  };

  const filteredReturns = mockReturns.filter((ret) => {
    const matchesSearch = ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) || ret.reason.toLowerCase().includes(searchTerm.toLowerCase()) || (ret.customerName && ret.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || (ret.supplierName && ret.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || ret.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || ret.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: mockReturns.length,
    pending: mockReturns.filter(r => r.status === 'PENDING').length,
    received: mockReturns.filter(r => r.status === 'RECEIVED').length,
    inspecting: mockReturns.filter(r => r.status === 'INSPECTING').length,
    approved: mockReturns.filter(r => r.status === 'APPROVED').length,
    totalValue: mockReturns.reduce((sum, r) => sum + r.totalValue, 0),
    avgProcessingTime: 2.3 // giorni
  };

  const getTypeBadge = (type: Return['type']) => {
    const config = { CUSTOMER: { label: 'Cliente', color: 'bg-blue-100 text-blue-800' }, SUPPLIER: { label: 'Fornitore', color: 'bg-purple-100 text-purple-800' }, INTERNAL: { label: 'Interno', color: 'bg-gray-100 text-gray-800' } };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[type].color}`}>{config[type].label}</span>;
  };

  const getStatusBadge = (status: Return['status']) => {
    const config = { PENDING: { label: 'In Attesa', variant: 'secondary' as const }, RECEIVED: { label: 'Ricevuto', variant: 'info' as const }, INSPECTING: { label: 'In Ispezione', variant: 'warning' as const }, APPROVED: { label: 'Approvato', variant: 'success' as const }, REJECTED: { label: 'Rifiutato', variant: 'danger' as const }, RESTOCKED: { label: 'Rimesso a Stock', variant: 'success' as const }, DISPOSED: { label: 'Smaltito', variant: 'secondary' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getReasonBadge = (category: Return['reasonCategory']) => {
    const labels = { DEFECTIVE: 'Difettoso', DAMAGED: 'Danneggiato', WRONG_ITEM: 'Articolo Errato', EXCESS: 'Eccesso', EXPIRED: 'Scaduto', CHANGE_MIND: 'Ripensamento', OTHER: 'Altro' };
    return <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">{labels[category]}</span>;
  };

  const getRefundBadge = (status?: Return['refundStatus']) => {
    if (!status) return null;
    const config = { PENDING: { label: 'In Attesa', variant: 'secondary' as const }, APPROVED: { label: 'Approvato', variant: 'info' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, DECLINED: { label: 'Rifiutato', variant: 'danger' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getConditionBadge = (condition: ReturnItem['condition']) => {
    const config = { NEW: 'bg-green-100 text-green-800', GOOD: 'bg-blue-100 text-blue-800', DAMAGED: 'bg-orange-100 text-orange-800', DEFECTIVE: 'bg-red-100 text-red-800', UNUSABLE: 'bg-gray-100 text-gray-800' };
    const labels = { NEW: 'Nuovo', GOOD: 'Buono', DAMAGED: 'Danneggiato', DEFECTIVE: 'Difettoso', UNUSABLE: 'Inutilizzabile' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[condition]}`}>{labels[condition]}</span>;
  };

  const getDecisionBadge = (decision: ReturnItem['decision']) => {
    const config = { RESTOCK: { label: 'Rimetti a Stock', color: 'bg-green-100 text-green-800' }, REPAIR: { label: 'Ripara', color: 'bg-blue-100 text-blue-800' }, DISPOSE: { label: 'Smaltisci', color: 'bg-red-100 text-red-800' }, RETURN_TO_SUPPLIER: { label: 'Rendi a Fornitore', color: 'bg-purple-100 text-purple-800' }, PENDING: { label: 'In Attesa', color: 'bg-gray-100 text-gray-800' } };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[decision].color}`}>{config[decision].label}</span>;
  };

  const columns = [
    { key: 'returnNumber', label: 'Numero Reso', render: (row: Return) => <div className="font-medium font-mono text-sm">{row.returnNumber}</div> },
    { key: 'type', label: 'Tipo', render: (row: Return) => getTypeBadge(row.type) },
    { key: 'status', label: 'Stato', render: (row: Return) => getStatusBadge(row.status) },
    { key: 'entity', label: 'Cliente/Fornitore', render: (row: Return) => <div className="text-sm">{row.customerName || row.supplierName || 'Interno'}</div> },
    { key: 'reason', label: 'Motivo', render: (row: Return) => <div><div className="text-sm">{row.reason}</div><div className="mt-1">{getReasonBadge(row.reasonCategory)}</div></div> },
    { key: 'items', label: 'Articoli', render: (row: Return) => <div className="font-medium">{row.itemsCount}</div> },
    { key: 'value', label: 'Valore', render: (row: Return) => <div className="font-medium">€{row.totalValue.toFixed(2)}</div> },
    { key: 'refund', label: 'Rimborso', render: (row: Return) => row.refundStatus ? getRefundBadge(row.refundStatus) : <span className="text-sm text-gray-500">-</span> },
    { key: 'date', label: 'Data Richiesta', render: (row: Return) => <div className="text-sm">{new Date(row.requestedDate).toLocaleDateString('it-IT')}</div> },
    { key: 'actions', label: 'Azioni', render: (row: Return) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedReturn(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'RECEIVED' && <Button variant="primary" size="sm" onClick={() => console.log('Inizia ispezione')}>Ispeziona</Button>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Resi</h1><p className="mt-2 text-gray-600">Gestisci resi da clienti, fornitori e interni</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta report')}>Esporta Report</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo reso')}>Nuovo Reso</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Resi Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">In Attesa</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Ricevuti</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.received}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Ispezione</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inspecting}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Approvati</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Valore Totale</div><div className="text-2xl font-bold text-blue-600 mt-1">€{stats.totalValue.toFixed(0)}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per numero, cliente, motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="CUSTOMER">Cliente</option><option value="SUPPLIER">Fornitore</option><option value="INTERNAL">Interno</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PENDING">In Attesa</option><option value="RECEIVED">Ricevuto</option><option value="INSPECTING">In Ispezione</option><option value="APPROVED">Approvato</option><option value="REJECTED">Rifiutato</option><option value="RESTOCKED">Rimesso a Stock</option><option value="DISPOSED">Smaltito</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Resi ({filteredReturns.length})</h2></div>
        <Table columns={columns} data={filteredReturns} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedReturn.returnNumber}</h2><p className="text-gray-600 mt-1">{selectedReturn.customerName || selectedReturn.supplierName || 'Reso Interno'}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Reso</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedReturn.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedReturn.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Ordine Originale</div><div className="font-medium font-mono">{selectedReturn.originalOrder}</div></div>
                  <div><div className="text-sm text-gray-600">Categoria Motivo</div><div className="mt-1">{getReasonBadge(selectedReturn.reasonCategory)}</div></div>
                  <div><div className="text-sm text-gray-600">Articoli Totali</div><div className="font-medium text-lg">{selectedReturn.itemsCount}</div></div>
                  <div><div className="text-sm text-gray-600">Valore Totale</div><div className="font-medium text-lg text-blue-600">€{selectedReturn.totalValue.toFixed(2)}</div></div>
                  {selectedReturn.refundStatus && <div><div className="text-sm text-gray-600">Stato Rimborso</div><div className="mt-1">{getRefundBadge(selectedReturn.refundStatus)}</div></div>}
                  {selectedReturn.restockLocation && <div><div className="text-sm text-gray-600">Locazione Restock</div><div className="font-medium font-mono">{selectedReturn.restockLocation}</div></div>}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Motivo Reso</h3>
                <p className="text-gray-800">{selectedReturn.reason}</p>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div><div className="flex-1"><div className="font-medium">Richiesta Inviata</div><div className="text-sm text-gray-600">{new Date(selectedReturn.requestedDate).toLocaleString('it-IT')}</div></div></div>
                  {selectedReturn.receivedDate && <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div><div className="flex-1"><div className="font-medium">Merce Ricevuta</div><div className="text-sm text-gray-600">{new Date(selectedReturn.receivedDate).toLocaleString('it-IT')}</div></div></div>}
                  {selectedReturn.inspectionDate && <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div><div className="flex-1"><div className="font-medium">Ispezione Avviata</div><div className="text-sm text-gray-600">{new Date(selectedReturn.inspectionDate).toLocaleString('it-IT')}</div>{selectedReturn.inspectedBy && <div className="text-sm text-gray-600">da {selectedReturn.inspectedBy}</div>}</div></div>}
                  {selectedReturn.approvedBy && <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div><div className="flex-1"><div className="font-medium">Approvato</div><div className="text-sm text-gray-600">da {selectedReturn.approvedBy}</div></div></div>}
                  {selectedReturn.completedDate && <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div><div className="flex-1"><div className="font-medium">Completato</div><div className="text-sm text-gray-600">{new Date(selectedReturn.completedDate).toLocaleString('it-IT')}</div></div></div>}
                </div>
              </Card>

              {mockReturnItems[selectedReturn.id] && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Articoli nel Reso</h3>
                  <div className="space-y-3">
                    {mockReturnItems[selectedReturn.id].map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3"><div className="font-medium">{item.productName}</div><div className="font-mono text-sm text-gray-600">{item.productCode}</div></div>
                            <div className="text-sm text-gray-600 mt-1">Quantità: {item.quantity} • Valore unitario: €{item.unitValue.toFixed(2)}</div>
                            <div className="text-sm text-gray-700 mt-1">Motivo: {item.reason}</div>
                            {item.inspectionNotes && <div className="text-sm text-blue-600 mt-1">Note ispezione: {item.inspectionNotes}</div>}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getConditionBadge(item.condition)}
                            {getDecisionBadge(item.decision)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {selectedReturn.notes && (
                <Card className="p-4 border-yellow-200 bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3>
                  <p className="text-yellow-900">{selectedReturn.notes}</p>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Stampa etichetta')}>Stampa Etichetta</Button>
                {selectedReturn.status === 'RECEIVED' && <Button variant="primary" onClick={() => console.log('Inizia ispezione')}>Inizia Ispezione</Button>}
                {selectedReturn.status === 'INSPECTING' && <><Button variant="success" onClick={() => console.log('Approva')}>Approva</Button><Button variant="danger" onClick={() => console.log('Rifiuta')}>Rifiuta</Button></>}
                {selectedReturn.status === 'APPROVED' && <Button variant="primary" onClick={() => console.log('Rimetti a stock')}>Rimetti a Stock</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagementPage;

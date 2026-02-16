import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface KitOrder {
  id: string;
  orderNumber: string;
  kitProduct: string;
  kitCode: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  quantity: number;
  completedQuantity: number;
  componentsCount: number;
  missingComponents: number;
  workstation?: string;
  assignedTo?: string;
  createdDate: string;
  startedDate?: string;
  completedDate?: string;
  dueDate?: string;
  customerOrder?: string;
  notes?: string;
}

interface KitComponent {
  id: string;
  productCode: string;
  productName: string;
  requiredQuantity: number;
  availableQuantity: number;
  pickedQuantity: number;
  location: string;
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'PICKED';
}

const KittingAssemblyPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<KitOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockKitOrders: KitOrder[] = [
    { id: '1', orderNumber: 'KIT-001', kitProduct: 'Starter Kit Pro', kitCode: 'SKP-2025', status: 'PENDING', priority: 'URGENT', quantity: 50, completedQuantity: 0, componentsCount: 8, missingComponents: 0, createdDate: '2025-11-20T08:00:00', dueDate: '2025-11-21T18:00:00', customerOrder: 'ORD-12345' },
    { id: '2', orderNumber: 'KIT-002', kitProduct: 'Premium Bundle', kitCode: 'PB-2025', status: 'IN_PROGRESS', priority: 'HIGH', quantity: 30, completedQuantity: 15, componentsCount: 12, missingComponents: 1, workstation: 'WS-A1', assignedTo: 'Mario Rossi', createdDate: '2025-11-19T10:00:00', startedDate: '2025-11-20T08:00:00', dueDate: '2025-11-22T12:00:00', customerOrder: 'ORD-12346' },
    { id: '3', orderNumber: 'KIT-003', kitProduct: 'Basic Set', kitCode: 'BS-2025', status: 'COMPLETED', priority: 'MEDIUM', quantity: 100, completedQuantity: 100, componentsCount: 5, missingComponents: 0, workstation: 'WS-B2', assignedTo: 'Luigi Bianchi', createdDate: '2025-11-18T09:00:00', startedDate: '2025-11-18T14:00:00', completedDate: '2025-11-19T16:00:00', dueDate: '2025-11-20T18:00:00' },
    { id: '4', orderNumber: 'KIT-004', kitProduct: 'Deluxe Package', kitCode: 'DP-2025', status: 'ON_HOLD', priority: 'HIGH', quantity: 25, completedQuantity: 10, componentsCount: 15, missingComponents: 3, workstation: 'WS-A2', assignedTo: 'Anna Verdi', createdDate: '2025-11-19T15:00:00', startedDate: '2025-11-20T07:00:00', dueDate: '2025-11-23T12:00:00', customerOrder: 'ORD-12347', notes: 'In attesa componenti da fornitore' },
    { id: '5', orderNumber: 'KIT-005', kitProduct: 'Custom Assembly X', kitCode: 'CAX-2025', status: 'PENDING', priority: 'LOW', quantity: 10, completedQuantity: 0, componentsCount: 20, missingComponents: 0, createdDate: '2025-11-20T09:00:00', dueDate: '2025-11-25T18:00:00', customerOrder: 'ORD-12348' },
    { id: '6', orderNumber: 'KIT-006', kitProduct: 'Starter Kit Pro', kitCode: 'SKP-2025', status: 'IN_PROGRESS', priority: 'MEDIUM', quantity: 40, completedQuantity: 20, componentsCount: 8, missingComponents: 0, workstation: 'WS-B1', assignedTo: 'Paolo Neri', createdDate: '2025-11-19T11:00:00', startedDate: '2025-11-19T16:00:00', dueDate: '2025-11-22T18:00:00' }
  ];

  const mockKitComponents: { [key: string]: KitComponent[] } = {
    '1': [
      { id: 'C1', productCode: 'COMP-001', productName: 'Base Unit', requiredQuantity: 50, availableQuantity: 50, pickedQuantity: 0, location: 'A-10-02', status: 'AVAILABLE' },
      { id: 'C2', productCode: 'COMP-002', productName: 'Power Cable', requiredQuantity: 50, availableQuantity: 50, pickedQuantity: 0, location: 'B-05-01', status: 'AVAILABLE' },
      { id: 'C3', productCode: 'COMP-003', productName: 'Manual', requiredQuantity: 50, availableQuantity: 50, pickedQuantity: 0, location: 'C-02-03', status: 'AVAILABLE' },
      { id: 'C4', productCode: 'COMP-004', productName: 'Accessories Kit', requiredQuantity: 50, availableQuantity: 50, pickedQuantity: 0, location: 'A-15-01', status: 'AVAILABLE' }
    ],
    '2': [
      { id: 'C5', productCode: 'COMP-005', productName: 'Premium Module', requiredQuantity: 30, availableQuantity: 30, pickedQuantity: 15, location: 'A-12-04', status: 'PICKED' },
      { id: 'C6', productCode: 'COMP-006', productName: 'Extended Battery', requiredQuantity: 30, availableQuantity: 25, pickedQuantity: 15, location: 'B-08-02', status: 'PARTIAL' },
      { id: 'C7', productCode: 'COMP-007', productName: 'Premium Case', requiredQuantity: 30, availableQuantity: 30, pickedQuantity: 15, location: 'C-10-01', status: 'PICKED' }
    ]
  };

  const filteredOrders = mockKitOrders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || order.kitProduct.toLowerCase().includes(searchTerm.toLowerCase()) || order.kitCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: mockKitOrders.length,
    pending: mockKitOrders.filter(o => o.status === 'PENDING').length,
    inProgress: mockKitOrders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: mockKitOrders.filter(o => o.status === 'COMPLETED').length,
    onHold: mockKitOrders.filter(o => o.status === 'ON_HOLD').length,
    totalQuantity: mockKitOrders.reduce((sum, o) => sum + o.quantity, 0),
    completedQuantity: mockKitOrders.reduce((sum, o) => sum + o.completedQuantity, 0)
  };

  const getStatusBadge = (status: KitOrder['status']) => {
    const config = { PENDING: { label: 'In Attesa', variant: 'secondary' as const }, IN_PROGRESS: { label: 'In Corso', variant: 'warning' as const }, COMPLETED: { label: 'Completato', variant: 'success' as const }, ON_HOLD: { label: 'In Pausa', variant: 'danger' as const }, CANCELLED: { label: 'Annullato', variant: 'secondary' as const } };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getPriorityBadge = (priority: KitOrder['priority']) => {
    const config = { URGENT: { label: 'Urgente', variant: 'danger' as const }, HIGH: { label: 'Alta', variant: 'warning' as const }, MEDIUM: { label: 'Media', variant: 'info' as const }, LOW: { label: 'Bassa', variant: 'secondary' as const } };
    return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
  };

  const getComponentStatusBadge = (status: KitComponent['status']) => {
    const config = { AVAILABLE: 'bg-green-100 text-green-800', PARTIAL: 'bg-yellow-100 text-yellow-800', UNAVAILABLE: 'bg-red-100 text-red-800', PICKED: 'bg-blue-100 text-blue-800' };
    const labels = { AVAILABLE: 'Disponibile', PARTIAL: 'Parziale', UNAVAILABLE: 'Non Disponibile', PICKED: 'Prelevato' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[status]}`}>{labels[status]}</span>;
  };

  const columns = [
    { key: 'orderNumber', label: 'Numero Ordine', render: (row: KitOrder) => <div className="font-medium font-mono text-sm">{row.orderNumber}</div> },
    { key: 'kit', label: 'Kit', render: (row: KitOrder) => <div><div className="font-medium">{row.kitProduct}</div><div className="text-sm text-gray-600">{row.kitCode}</div></div> },
    { key: 'status', label: 'Stato', render: (row: KitOrder) => getStatusBadge(row.status) },
    { key: 'priority', label: 'Priorità', render: (row: KitOrder) => getPriorityBadge(row.priority) },
    { key: 'progress', label: 'Progresso', render: (row: KitOrder) => <div><div className="flex items-center gap-2"><div className="text-sm font-medium">{row.completedQuantity}/{row.quantity}</div><div className="text-xs text-gray-600">({((row.completedQuantity / row.quantity) * 100).toFixed(0)}%)</div></div><div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(row.completedQuantity / row.quantity) * 100}%` }} /></div></div> },
    { key: 'components', label: 'Componenti', render: (row: KitOrder) => <div><div className="text-sm">{row.componentsCount} tot.</div>{row.missingComponents > 0 && <div className="text-xs text-red-600">{row.missingComponents} mancanti</div>}</div> },
    { key: 'workstation', label: 'Postazione', render: (row: KitOrder) => row.workstation ? <div className="text-sm"><div className="font-medium">{row.workstation}</div>{row.assignedTo && <div className="text-gray-600">{row.assignedTo}</div>}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'dueDate', label: 'Scadenza', render: (row: KitOrder) => row.dueDate ? <div className="text-sm">{new Date(row.dueDate).toLocaleDateString('it-IT')}</div> : <span className="text-sm text-gray-500">-</span> },
    { key: 'actions', label: 'Azioni', render: (row: KitOrder) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedOrder(row); setShowDetailModal(true); }}>Dettaglio</Button>{row.status === 'PENDING' && <Button variant="primary" size="sm" onClick={() => console.log('Inizia')}>Inizia</Button>}</div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Kitting & Assemblaggio</h1><p className="mt-2 text-gray-600">Gestisci ordini di kit e assemblaggio prodotti</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Postazioni')}>Gestisci Postazioni</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo kit')}>Nuovo Ordine Kit</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Ordini Totali</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-gray-200 bg-gray-50"><div className="text-sm font-medium text-gray-700">In Attesa</div><div className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</div></Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50"><div className="text-sm font-medium text-yellow-700">In Corso</div><div className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completati</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div></Card>
        <Card className="p-4 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">In Pausa</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.onHold}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Quantità Totale</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalQuantity}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Completate</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.completedQuantity}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per numero, kit, codice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="PENDING">In Attesa</option><option value="IN_PROGRESS">In Corso</option><option value="COMPLETED">Completato</option><option value="ON_HOLD">In Pausa</option><option value="CANCELLED">Annullato</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutte</option><option value="URGENT">Urgente</option><option value="HIGH">Alta</option><option value="MEDIUM">Media</option><option value="LOW">Bassa</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Ordini Kit ({filteredOrders.length})</h2></div>
        <Table columns={columns} data={filteredOrders} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2><p className="text-gray-600 mt-1">{selectedOrder.kitProduct} ({selectedOrder.kitCode})</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Ordine</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedOrder.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Priorità</div><div className="mt-1">{getPriorityBadge(selectedOrder.priority)}</div></div>
                  <div><div className="text-sm text-gray-600">Quantità Richiesta</div><div className="font-medium text-lg">{selectedOrder.quantity}</div></div>
                  <div><div className="text-sm text-gray-600">Quantità Completata</div><div className="font-medium text-lg text-green-600">{selectedOrder.completedQuantity}</div></div>
                  <div><div className="text-sm text-gray-600">Componenti Totali</div><div className="font-medium">{selectedOrder.componentsCount}</div></div>
                  {selectedOrder.missingComponents > 0 && <div><div className="text-sm text-gray-600">Componenti Mancanti</div><div className="font-medium text-red-600">{selectedOrder.missingComponents}</div></div>}
                  {selectedOrder.workstation && <div><div className="text-sm text-gray-600">Postazione</div><div className="font-medium">{selectedOrder.workstation}</div></div>}
                  {selectedOrder.assignedTo && <div><div className="text-sm text-gray-600">Assegnato A</div><div className="font-medium">{selectedOrder.assignedTo}</div></div>}
                  {selectedOrder.customerOrder && <div><div className="text-sm text-gray-600">Ordine Cliente</div><div className="font-medium font-mono">{selectedOrder.customerOrder}</div></div>}
                  {selectedOrder.dueDate && <div><div className="text-sm text-gray-600">Scadenza</div><div className="font-medium">{new Date(selectedOrder.dueDate).toLocaleString('it-IT')}</div></div>}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Progresso</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Completamento</span><span className="font-medium">{selectedOrder.completedQuantity}/{selectedOrder.quantity} ({((selectedOrder.completedQuantity / selectedOrder.quantity) * 100).toFixed(0)}%)</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${(selectedOrder.completedQuantity / selectedOrder.quantity) * 100}%` }}><span className="text-xs text-white font-medium">{((selectedOrder.completedQuantity / selectedOrder.quantity) * 100).toFixed(0)}%</span></div></div>
                </div>
              </Card>

              {mockKitComponents[selectedOrder.id] && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Componenti Richiesti</h3>
                  <div className="space-y-3">
                    {mockKitComponents[selectedOrder.id].map(comp => (
                      <div key={comp.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3"><div className="font-medium">{comp.productName}</div><div className="font-mono text-sm text-gray-600">{comp.productCode}</div></div>
                            <div className="text-sm text-gray-600 mt-1">Locazione: {comp.location}</div>
                            <div className="grid grid-cols-3 gap-4 mt-2"><div><div className="text-xs text-gray-600">Richiesto</div><div className="font-medium">{comp.requiredQuantity}</div></div><div><div className="text-xs text-gray-600">Disponibile</div><div className="font-medium text-blue-600">{comp.availableQuantity}</div></div><div><div className="text-xs text-gray-600">Prelevato</div><div className="font-medium text-green-600">{comp.pickedQuantity}</div></div></div>
                          </div>
                          <div className="flex flex-col items-end gap-2">{getComponentStatusBadge(comp.status)}<div className="text-sm text-gray-600">{((comp.pickedQuantity / comp.requiredQuantity) * 100).toFixed(0)}%</div></div>
                        </div>
                        {comp.status === 'AVAILABLE' && <Button variant="primary" size="sm" className="mt-3" onClick={() => console.log('Preleva')}>Preleva Componente</Button>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div><div className="flex-1"><div className="font-medium">Ordine Creato</div><div className="text-sm text-gray-600">{new Date(selectedOrder.createdDate).toLocaleString('it-IT')}</div></div></div>
                  {selectedOrder.startedDate && <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div><div className="flex-1"><div className="font-medium">Lavorazione Iniziata</div><div className="text-sm text-gray-600">{new Date(selectedOrder.startedDate).toLocaleString('it-IT')}</div></div></div>}
                  {selectedOrder.completedDate && <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div><div className="flex-1"><div className="font-medium">Completato</div><div className="text-sm text-gray-600">{new Date(selectedOrder.completedDate).toLocaleString('it-IT')}</div></div></div>}
                </div>
              </Card>

              {selectedOrder.notes && (
                <Card className="p-4 border-yellow-200 bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3>
                  <p className="text-yellow-900">{selectedOrder.notes}</p>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={() => console.log('Stampa distinta')}>Stampa Distinta</Button>
                {selectedOrder.status === 'PENDING' && <Button variant="primary" onClick={() => console.log('Inizia')}>Inizia Lavorazione</Button>}
                {selectedOrder.status === 'IN_PROGRESS' && <><Button variant="warning" onClick={() => console.log('Pausa')}>Metti in Pausa</Button><Button variant="success" onClick={() => console.log('Completa')}>Completa Ordine</Button></>}
                {selectedOrder.status === 'ON_HOLD' && <Button variant="primary" onClick={() => console.log('Riprendi')}>Riprendi Lavorazione</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KittingAssemblyPage;

import React, { useMemo, useState } from 'react';
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

type MovementType = 'PICKING' | 'DEPOSIT';

interface MovementListRow {
  id: string;
  orderNumber: string;
  productCode: string;
  productName: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
}

interface MovementList {
  id: string;
  type: MovementType;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: 'DRAFT' | 'RELEASED';
  rows: MovementListRow[];
}

const initialKitOrders: KitOrder[] = [
  { id: '1', orderNumber: 'KIT-001', kitProduct: 'Starter Kit Pro', kitCode: 'SKP-2025', status: 'PENDING', priority: 'URGENT', quantity: 50, completedQuantity: 0, componentsCount: 8, missingComponents: 0, createdDate: '2025-11-20T08:00:00', dueDate: '2025-11-21T18:00:00', customerOrder: 'ORD-12345' },
  { id: '2', orderNumber: 'KIT-002', kitProduct: 'Premium Bundle', kitCode: 'PB-2025', status: 'IN_PROGRESS', priority: 'HIGH', quantity: 30, completedQuantity: 15, componentsCount: 12, missingComponents: 1, workstation: 'WS-A1', assignedTo: 'Mario Rossi', createdDate: '2025-11-19T10:00:00', startedDate: '2025-11-20T08:00:00', dueDate: '2025-11-22T12:00:00', customerOrder: 'ORD-12346' },
  { id: '3', orderNumber: 'KIT-003', kitProduct: 'Basic Set', kitCode: 'BS-2025', status: 'COMPLETED', priority: 'MEDIUM', quantity: 100, completedQuantity: 100, componentsCount: 5, missingComponents: 0, workstation: 'WS-B2', assignedTo: 'Luigi Bianchi', createdDate: '2025-11-18T09:00:00', startedDate: '2025-11-18T14:00:00', completedDate: '2025-11-19T16:00:00', dueDate: '2025-11-20T18:00:00' },
  { id: '4', orderNumber: 'KIT-004', kitProduct: 'Deluxe Package', kitCode: 'DP-2025', status: 'ON_HOLD', priority: 'HIGH', quantity: 25, completedQuantity: 10, componentsCount: 15, missingComponents: 3, workstation: 'WS-A2', assignedTo: 'Anna Verdi', createdDate: '2025-11-19T15:00:00', startedDate: '2025-11-20T07:00:00', dueDate: '2025-11-23T12:00:00', customerOrder: 'ORD-12347', notes: 'In attesa componenti da fornitore' },
  { id: '5', orderNumber: 'KIT-005', kitProduct: 'Custom Assembly X', kitCode: 'CAX-2025', status: 'PENDING', priority: 'LOW', quantity: 10, completedQuantity: 0, componentsCount: 20, missingComponents: 0, createdDate: '2025-11-20T09:00:00', dueDate: '2025-11-25T18:00:00', customerOrder: 'ORD-12348' },
  { id: '6', orderNumber: 'KIT-006', kitProduct: 'Starter Kit Pro', kitCode: 'SKP-2025', status: 'IN_PROGRESS', priority: 'MEDIUM', quantity: 40, completedQuantity: 20, componentsCount: 8, missingComponents: 0, workstation: 'WS-B1', assignedTo: 'Paolo Neri', createdDate: '2025-11-19T11:00:00', startedDate: '2025-11-19T16:00:00', dueDate: '2025-11-22T18:00:00' }
];

const initialKitComponents: Record<string, KitComponent[]> = {
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

const KittingAssemblyPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [orders, setOrders] = useState<KitOrder[]>(initialKitOrders);
  const [componentsByOrder, setComponentsByOrder] = useState<Record<string, KitComponent[]>>(initialKitComponents);
  const [movementLists, setMovementLists] = useState<MovementList[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || order.kitProduct.toLowerCase().includes(searchTerm.toLowerCase()) || order.kitCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    onHold: orders.filter((o) => o.status === 'ON_HOLD').length
  };

  const getOrderStatusBadge = (status: KitOrder['status']) => {
    const variantMap: Record<KitOrder['status'], 'info' | 'warning' | 'success' | 'danger'> = {
      PENDING: 'info',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      ON_HOLD: 'danger',
      CANCELLED: 'danger'
    };
    return <Badge variant={variantMap[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: KitOrder['priority']) => {
    const variantMap: Record<KitOrder['priority'], 'danger' | 'warning' | 'info'> = {
      URGENT: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'info'
    };
    return <Badge variant={variantMap[priority]}>{priority}</Badge>;
  };

  const getComponentStatusBadge = (status: KitComponent['status']) => {
    const variantMap: Record<KitComponent['status'], 'success' | 'warning' | 'danger' | 'info'> = {
      AVAILABLE: 'info',
      PARTIAL: 'warning',
      UNAVAILABLE: 'danger',
      PICKED: 'success'
    };
    return <Badge variant={variantMap[status]}>{status}</Badge>;
  };

  const updateOrderStatus = (orderId: string, status: KitOrder['status']) => {
    setOrders((prev) => prev.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      if (status === 'IN_PROGRESS') {
        return { ...order, status, startedDate: order.startedDate || new Date().toISOString() };
      }

      if (status === 'COMPLETED') {
        return { ...order, status, completedDate: new Date().toISOString(), completedQuantity: order.quantity };
      }

      return { ...order, status };
    }));
  };

  const handlePickComponent = (orderId: string, componentId: string) => {
    setComponentsByOrder((prev) => {
      const orderComponents = prev[orderId] || [];
      const updatedComponents = orderComponents.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const remainingToPick = component.requiredQuantity - component.pickedQuantity;
        const qtyPickedNow = Math.min(remainingToPick, component.availableQuantity);
        const nextPickedQty = component.pickedQuantity + qtyPickedNow;
        const nextAvailable = component.availableQuantity - qtyPickedNow;

        let status: KitComponent['status'] = 'UNAVAILABLE';
        if (nextPickedQty >= component.requiredQuantity) {
          status = 'PICKED';
        } else if (nextPickedQty > 0) {
          status = 'PARTIAL';
        } else if (nextAvailable > 0) {
          status = 'AVAILABLE';
        }

        return {
          ...component,
          pickedQuantity: nextPickedQty,
          availableQuantity: nextAvailable,
          status
        };
      });

      return {
        ...prev,
        [orderId]: updatedComponents
      };
    });
  };

  const createMovementList = (order: KitOrder, type: MovementType) => {
    const components = componentsByOrder[order.id] || [];

    const rows: MovementListRow[] = type === 'PICKING'
      ? components
        .filter((component) => component.requiredQuantity - component.pickedQuantity > 0)
        .map((component) => ({
          id: `${order.id}-${component.id}-P`,
          orderNumber: order.orderNumber,
          productCode: component.productCode,
          productName: component.productName,
          quantity: component.requiredQuantity - component.pickedQuantity,
          fromLocation: component.location,
          toLocation: order.workstation || 'AREA-KIT-01'
        }))
      : [{
        id: `${order.id}-KIT-DEPOSIT`,
        orderNumber: order.orderNumber,
        productCode: order.kitCode,
        productName: order.kitProduct,
        quantity: order.completedQuantity,
        fromLocation: order.workstation || 'AREA-KIT-01',
        toLocation: 'SPEDIZIONE-DOCK'
      }].filter((row) => row.quantity > 0);

    if (rows.length === 0) {
      return;
    }

    const movementList: MovementList = {
      id: `${type}-${order.orderNumber}-${Date.now()}`,
      type,
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: new Date().toISOString(),
      status: 'DRAFT',
      rows
    };

    setMovementLists((prev) => [movementList, ...prev]);
  };

  const columns = [
    { key: 'orderNumber', label: 'Ordine', render: (row: KitOrder) => <div className="font-mono font-semibold">{row.orderNumber}</div> },
    { key: 'kit', label: 'Kit', render: (row: KitOrder) => <div><div className="font-medium">{row.kitProduct}</div><div className="text-sm text-gray-600">{row.kitCode}</div></div> },
    { key: 'status', label: 'Stato', render: (row: KitOrder) => getOrderStatusBadge(row.status) },
    { key: 'priority', label: 'Priorità', render: (row: KitOrder) => getPriorityBadge(row.priority) },
    { key: 'progress', label: 'Progresso', render: (row: KitOrder) => <div>{row.completedQuantity}/{row.quantity}</div> },
    { key: 'components', label: 'Componenti', render: (row: KitOrder) => <div>{row.componentsCount}</div> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitting & Assemblaggio</h1>
          <p className="mt-2 text-gray-600">Gestisci ordini kit, prelievi componenti e deposito prodotto finito</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm text-gray-600">Totali</div><div className="text-2xl font-bold text-gray-900">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">In attesa</div><div className="text-2xl font-bold text-blue-600">{stats.pending}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">In corso</div><div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">Completati</div><div className="text-2xl font-bold text-green-600">{stats.completed}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">In pausa</div><div className="text-2xl font-bold text-red-600">{stats.onHold}</div></Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" placeholder="Cerca per numero, kit, codice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="ALL">Tutti gli stati</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON_HOLD</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="ALL">Tutte le priorità</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {loading ? <Spinner size="lg" /> : <Table data={filteredOrders} columns={columns} searchable={false} onRowClick={(row) => {
          setSelectedOrderId(row.id);
          setShowDetailModal(true);
        }} />}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Liste operative generate</h2>
          <Badge variant="default">{movementLists.length} liste</Badge>
        </div>
        <div className="space-y-2">
          {movementLists.length === 0 && <div className="text-sm text-gray-500">Nessuna lista creata. Apri un ordine per generare liste di prelievo e deposito.</div>}
          {movementLists.map((list) => (
            <div key={list.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{list.type} - {list.orderNumber}</div>
                  <div className="text-xs text-gray-500">{new Date(list.createdAt).toLocaleString('it-IT')} · {list.rows.length} righe</div>
                </div>
                <Badge variant={list.type === 'PICKING' ? 'info' : 'success'}>{list.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                <p className="text-gray-600">{selectedOrder.kitProduct} ({selectedOrder.kitCode})</p>
              </div>
              <Button variant="ghost" onClick={() => setShowDetailModal(false)}>Chiudi</Button>
            </div>

            <div className="p-6 space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><div className="text-sm text-gray-600">Stato</div><div>{getOrderStatusBadge(selectedOrder.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Priorità</div><div>{getPriorityBadge(selectedOrder.priority)}</div></div>
                  <div><div className="text-sm text-gray-600">Quantità</div><div className="font-medium">{selectedOrder.completedQuantity}/{selectedOrder.quantity}</div></div>
                  <div><div className="text-sm text-gray-600">Postazione</div><div className="font-medium">{selectedOrder.workstation || 'AREA-KIT-01'}</div></div>
                </div>
              </Card>

              {(componentsByOrder[selectedOrder.id] || []).length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Componenti da prelevare</h3>
                  <div className="space-y-3">
                    {(componentsByOrder[selectedOrder.id] || []).map((component) => {
                      const remaining = component.requiredQuantity - component.pickedQuantity;
                      return (
                        <div key={component.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{component.productName} <span className="font-mono text-sm text-gray-500">({component.productCode})</span></div>
                              <div className="text-sm text-gray-600">Locazione: {component.location}</div>
                              <div className="text-sm mt-1">Richiesto: {component.requiredQuantity} · Prelevato: {component.pickedQuantity} · Residuo: {remaining}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getComponentStatusBadge(component.status)}
                              <Button variant="primary" size="sm" disabled={remaining <= 0 || selectedOrder.status === 'COMPLETED'} onClick={() => handlePickComponent(selectedOrder.id, component.id)}>
                                Preleva residuo
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Azioni operative</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'PENDING' && <Button variant="primary" onClick={() => updateOrderStatus(selectedOrder.id, 'IN_PROGRESS')}>Inizia lavorazione</Button>}
                  {selectedOrder.status === 'IN_PROGRESS' && <Button variant="secondary" onClick={() => updateOrderStatus(selectedOrder.id, 'ON_HOLD')}>Metti in pausa</Button>}
                  {selectedOrder.status === 'ON_HOLD' && <Button variant="primary" onClick={() => updateOrderStatus(selectedOrder.id, 'IN_PROGRESS')}>Riprendi</Button>}
                  {selectedOrder.status !== 'COMPLETED' && <Button variant="success" onClick={() => updateOrderStatus(selectedOrder.id, 'COMPLETED')}>Completa ordine</Button>}
                  <Button variant="outline" onClick={() => createMovementList(selectedOrder, 'PICKING')}>Genera lista prelievo</Button>
                  <Button variant="outline" onClick={() => createMovementList(selectedOrder, 'DEPOSIT')}>Genera lista deposito</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KittingAssemblyPage;

import React, { useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

type KitOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
type KitOrderPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
type KitComponentStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'PICKED';

interface KitOrder {
  id: string;
  orderNumber: string;
  kitProduct: string;
  kitCode: string;
  status: KitOrderStatus;
  priority: KitOrderPriority;
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
  status: KitComponentStatus;
}

interface BomLine {
  id: string;
  productCode: string;
  productName: string;
  qtyPerKit: number;
  defaultAvailableStock: number;
  location: string;
}

interface BomTemplate {
  id: string;
  kitCode: string;
  kitProduct: string;
  revision: string;
  description: string;
  lines: BomLine[];
}

const statusVariantMap: Record<KitOrderStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  ON_HOLD: 'warning',
  CANCELLED: 'danger',
};

const componentStatusVariantMap: Record<KitComponentStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  AVAILABLE: 'success',
  PARTIAL: 'warning',
  UNAVAILABLE: 'danger',
  PICKED: 'info',
};

const getComponentStatus = (pickedQuantity: number, requiredQuantity: number, availableQuantity: number): KitComponentStatus => {
  if (pickedQuantity >= requiredQuantity) {
    return 'PICKED';
  }

  if (availableQuantity <= 0) {
    return 'UNAVAILABLE';
  }

  if (availableQuantity < requiredQuantity) {
    return 'PARTIAL';
  }

  return 'AVAILABLE';
};

const kitBomTemplates: BomTemplate[] = [
  {
    id: 'BOM-01',
    kitCode: 'SKP-2025',
    kitProduct: 'Starter Kit Pro',
    revision: 'R03',
    description: 'Kit base per onboarding installatori.',
    lines: [
      { id: 'L1', productCode: 'COMP-001', productName: 'Base Unit', qtyPerKit: 1, defaultAvailableStock: 200, location: 'A-10-02' },
      { id: 'L2', productCode: 'COMP-002', productName: 'Power Cable', qtyPerKit: 1, defaultAvailableStock: 180, location: 'B-05-01' },
      { id: 'L3', productCode: 'COMP-003', productName: 'Manuale Installazione', qtyPerKit: 1, defaultAvailableStock: 300, location: 'C-02-03' },
      { id: 'L4', productCode: 'COMP-004', productName: 'Accessories Kit', qtyPerKit: 1, defaultAvailableStock: 160, location: 'A-15-01' },
    ],
  },
  {
    id: 'BOM-02',
    kitCode: 'PB-2025',
    kitProduct: 'Premium Bundle',
    revision: 'R05',
    description: 'Bundle premium con batteria estesa e valigetta.',
    lines: [
      { id: 'L5', productCode: 'COMP-005', productName: 'Premium Module', qtyPerKit: 1, defaultAvailableStock: 90, location: 'A-12-04' },
      { id: 'L6', productCode: 'COMP-006', productName: 'Extended Battery', qtyPerKit: 1, defaultAvailableStock: 25, location: 'B-08-02' },
      { id: 'L7', productCode: 'COMP-007', productName: 'Premium Case', qtyPerKit: 1, defaultAvailableStock: 40, location: 'C-10-01' },
      { id: 'L8', productCode: 'COMP-008', productName: 'Sigillo QC', qtyPerKit: 2, defaultAvailableStock: 200, location: 'QC-01-01' },
    ],
  },
  {
    id: 'BOM-03',
    kitCode: 'CAX-2025',
    kitProduct: 'Custom Assembly X',
    revision: 'R02',
    description: 'Kit custom con componenti misti per commesse speciali.',
    lines: [
      { id: 'L9', productCode: 'COMP-009', productName: 'Controller X', qtyPerKit: 1, defaultAvailableStock: 18, location: 'D-04-01' },
      { id: 'L10', productCode: 'COMP-010', productName: 'Kit Cablaggio X', qtyPerKit: 2, defaultAvailableStock: 45, location: 'D-04-02' },
      { id: 'L11', productCode: 'COMP-011', productName: 'Piastra Supporto', qtyPerKit: 1, defaultAvailableStock: 80, location: 'D-09-03' },
    ],
  },
];

const createComponentsFromBom = (bom: BomTemplate, quantity: number): KitComponent[] =>
  bom.lines.map((line) => {
    const requiredQuantity = line.qtyPerKit * quantity;
    const availableQuantity = line.defaultAvailableStock;

    return {
      id: `${bom.id}-${line.id}`,
      productCode: line.productCode,
      productName: line.productName,
      requiredQuantity,
      availableQuantity,
      pickedQuantity: 0,
      location: line.location,
      status: getComponentStatus(0, requiredQuantity, availableQuantity),
    };
  });

const KittingAssemblyPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<KitOrder[]>([
    {
      id: '1',
      orderNumber: 'KIT-001',
      kitProduct: 'Starter Kit Pro',
      kitCode: 'SKP-2025',
      status: 'PENDING',
      priority: 'URGENT',
      quantity: 50,
      completedQuantity: 0,
      componentsCount: 4,
      missingComponents: 0,
      createdDate: '2025-11-20T08:00:00',
      dueDate: '2025-11-21T18:00:00',
      customerOrder: 'ORD-12345',
      notes: 'Usare check-list packing rev 2',
    },
    {
      id: '2',
      orderNumber: 'KIT-002',
      kitProduct: 'Premium Bundle',
      kitCode: 'PB-2025',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      quantity: 30,
      completedQuantity: 15,
      componentsCount: 4,
      missingComponents: 1,
      workstation: 'WS-A1',
      assignedTo: 'Mario Rossi',
      createdDate: '2025-11-19T10:00:00',
      startedDate: '2025-11-20T08:00:00',
      dueDate: '2025-11-22T12:00:00',
      customerOrder: 'ORD-12346',
    },
  ]);

  const [orderComponents, setOrderComponents] = useState<Record<string, KitComponent[]>>({
    '1': createComponentsFromBom(kitBomTemplates[0], 50),
    '2': createComponentsFromBom(kitBomTemplates[1], 30).map((item) => ({
      ...item,
      pickedQuantity: Math.floor(item.requiredQuantity * 0.5),
      status: getComponentStatus(Math.floor(item.requiredQuantity * 0.5), item.requiredQuantity, item.availableQuantity),
    })),
  });

  const [newOrderForm, setNewOrderForm] = useState({
    bomId: kitBomTemplates[0].id,
    quantity: 20,
    priority: 'MEDIUM' as KitOrderPriority,
    customerOrder: '',
    dueDate: '',
    notes: '',
  });

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.kitProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.kitCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [orders, priorityFilter, searchTerm, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      blocked: orders.filter((o) => o.status === 'ON_HOLD' || o.missingComponents > 0).length,
    }),
    [orders]
  );

  const bomPreview = useMemo(
    () => kitBomTemplates.find((bom) => bom.id === newOrderForm.bomId) ?? kitBomTemplates[0],
    [newOrderForm.bomId]
  );

  const updateOrderById = (orderId: string, updater: (order: KitOrder) => KitOrder) => {
    setOrders((current) => current.map((order) => (order.id === orderId ? updater(order) : order)));
  };

  const refreshOrderNumbers = (orderId: string, components: KitComponent[]) => {
    const missingComponents = components.filter((component) => component.availableQuantity < component.requiredQuantity).length;
    const completionRatios = components.map((component) => component.pickedQuantity / component.requiredQuantity);
    const completedQuantityRatio = completionRatios.length ? Math.min(...completionRatios) : 0;

    updateOrderById(orderId, (order) => ({
      ...order,
      completedQuantity: Math.floor(order.quantity * completedQuantityRatio),
      missingComponents,
      status: completedQuantityRatio >= 1 ? 'COMPLETED' : order.status,
      completedDate: completedQuantityRatio >= 1 ? new Date().toISOString() : order.completedDate,
    }));
  };

  const handleCreateOrder = () => {
    const selectedBom = kitBomTemplates.find((bom) => bom.id === newOrderForm.bomId);

    if (!selectedBom || newOrderForm.quantity <= 0) {
      return;
    }

    const orderId = String(Date.now());
    const orderNumber = `KIT-${String(orders.length + 1).padStart(3, '0')}`;
    const components = createComponentsFromBom(selectedBom, newOrderForm.quantity);
    const missingComponents = components.filter((component) => component.availableQuantity < component.requiredQuantity).length;

    const newOrder: KitOrder = {
      id: orderId,
      orderNumber,
      kitProduct: selectedBom.kitProduct,
      kitCode: selectedBom.kitCode,
      status: missingComponents > 0 ? 'ON_HOLD' : 'PENDING',
      priority: newOrderForm.priority,
      quantity: newOrderForm.quantity,
      completedQuantity: 0,
      componentsCount: components.length,
      missingComponents,
      createdDate: new Date().toISOString(),
      dueDate: newOrderForm.dueDate || undefined,
      customerOrder: newOrderForm.customerOrder || undefined,
      notes: newOrderForm.notes || undefined,
    };

    setOrders((current) => [newOrder, ...current]);
    setOrderComponents((current) => ({ ...current, [orderId]: components }));
    setSelectedOrderId(orderId);
  };

  const handlePickComponent = (orderId: string, componentId: string) => {
    setOrderComponents((current) => {
      const existingComponents = current[orderId] ?? [];
      const updatedComponents = existingComponents.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const remaining = component.requiredQuantity - component.pickedQuantity;
        const pickBatch = Math.min(Math.max(1, Math.ceil(component.requiredQuantity * 0.2)), remaining);
        const nextPicked = component.pickedQuantity + pickBatch;

        return {
          ...component,
          pickedQuantity: nextPicked,
          status: getComponentStatus(nextPicked, component.requiredQuantity, component.availableQuantity),
        };
      });

      refreshOrderNumbers(orderId, updatedComponents);
      return { ...current, [orderId]: updatedComponents };
    });
  };

  const handleOrderStatus = (orderId: string, status: KitOrderStatus) => {
    updateOrderById(orderId, (order) => ({
      ...order,
      status,
      startedDate: status === 'IN_PROGRESS' && !order.startedDate ? new Date().toISOString() : order.startedDate,
      completedDate: status === 'COMPLETED' ? new Date().toISOString() : order.completedDate,
    }));
  };

  const renderStatusBadge = (status: KitOrderStatus) => (
    <Badge variant={statusVariantMap[status]}>{status.replace('_', ' ')}</Badge>
  );

  const renderComponentStatusBadge = (status: KitComponentStatus) => (
    <Badge variant={componentStatusVariantMap[status]}>{status}</Badge>
  );

  const orderColumns = [
    {
      key: 'orderNumber',
      label: 'Ordine',
      render: (row: KitOrder) => (
        <div>
          <div className="font-medium">{row.orderNumber}</div>
          <div className="text-xs text-gray-500">{new Date(row.createdDate).toLocaleDateString('it-IT')}</div>
        </div>
      ),
    },
    {
      key: 'kit',
      label: 'Kit',
      render: (row: KitOrder) => (
        <div>
          <div className="font-medium">{row.kitProduct}</div>
          <div className="text-sm text-gray-600">{row.kitCode}</div>
        </div>
      ),
    },
    { key: 'priority', label: 'Priorità', render: (row: KitOrder) => row.priority },
    { key: 'progress', label: 'Completato', render: (row: KitOrder) => `${row.completedQuantity}/${row.quantity}` },
    { key: 'missingComponents', label: 'Mancanti', render: (row: KitOrder) => row.missingComponents },
    { key: 'status', label: 'Stato', render: (row: KitOrder) => renderStatusBadge(row.status) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitting & Distinta Base</h1>
          <p className="mt-2 text-gray-600">Gestione completa kit in stile SMS: template BOM, ordini, prelievo componenti e avanzamento.</p>
        </div>
      </div>

      {loading && (
        <Card className="p-6 flex justify-center">
          <Spinner />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm text-gray-600">Totale ordini</div><div className="text-3xl font-bold text-gray-900">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">In attesa</div><div className="text-3xl font-bold text-yellow-600">{stats.pending}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">In corso</div><div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">Completati</div><div className="text-3xl font-bold text-green-600">{stats.completed}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-600">Bloccati</div><div className="text-3xl font-bold text-red-600">{stats.blocked}</div></Card>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Nuovo ordine kit da distinta base</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-md" value={newOrderForm.bomId} onChange={(e) => setNewOrderForm((current) => ({ ...current, bomId: e.target.value }))}>
            {kitBomTemplates.map((bom) => (
              <option key={bom.id} value={bom.id}>{bom.kitCode} - {bom.kitProduct} ({bom.revision})</option>
            ))}
          </select>
          <input type="number" min={1} className="px-3 py-2 border border-gray-300 rounded-md" value={newOrderForm.quantity} onChange={(e) => setNewOrderForm((current) => ({ ...current, quantity: Number(e.target.value) || 0 }))} />
          <select className="px-3 py-2 border border-gray-300 rounded-md" value={newOrderForm.priority} onChange={(e) => setNewOrderForm((current) => ({ ...current, priority: e.target.value as KitOrderPriority }))}>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <input type="text" placeholder="Ordine cliente" className="px-3 py-2 border border-gray-300 rounded-md" value={newOrderForm.customerOrder} onChange={(e) => setNewOrderForm((current) => ({ ...current, customerOrder: e.target.value }))} />
          <input type="datetime-local" className="px-3 py-2 border border-gray-300 rounded-md" value={newOrderForm.dueDate} onChange={(e) => setNewOrderForm((current) => ({ ...current, dueDate: e.target.value }))} />
          <Button onClick={handleCreateOrder}>Crea ordine da BOM</Button>
        </div>
        <div className="mt-3 text-sm text-gray-600">BOM selezionata: <span className="font-medium text-gray-800">{bomPreview.description}</span> ({bomPreview.lines.length} componenti)</div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input type="text" placeholder="Cerca per numero, kit, codice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="ALL">Tutti gli stati</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON_HOLD</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="ALL">Tutte le priorità</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <Table data={filteredOrders} columns={orderColumns} searchable={false} onRowClick={(row) => setSelectedOrderId(row.id)} />
      </Card>

      {selectedOrder && (
        <Card className="p-5 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h3>
              <p className="text-gray-600">{selectedOrder.kitProduct} ({selectedOrder.kitCode})</p>
            </div>
            {renderStatusBadge(selectedOrder.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><div className="text-xs text-gray-500">Q.tà ordine</div><div className="font-semibold">{selectedOrder.quantity}</div></div>
            <div><div className="text-xs text-gray-500">Completato</div><div className="font-semibold">{selectedOrder.completedQuantity}</div></div>
            <div><div className="text-xs text-gray-500">Componenti mancanti</div><div className="font-semibold text-red-600">{selectedOrder.missingComponents}</div></div>
            <div><div className="text-xs text-gray-500">Scadenza</div><div className="font-semibold">{selectedOrder.dueDate ? new Date(selectedOrder.dueDate).toLocaleString('it-IT') : '-'}</div></div>
          </div>

          <div className="space-y-3">
            {(orderComponents[selectedOrder.id] ?? []).map((component) => {
              const percentage = Math.round((component.pickedQuantity / component.requiredQuantity) * 100);

              return (
                <div key={component.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <div className="font-medium">{component.productName} <span className="text-xs text-gray-500">({component.productCode})</span></div>
                      <div className="text-sm text-gray-600">Locazione: {component.location}</div>
                    </div>
                    {renderComponentStatusBadge(component.status)}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2 text-sm">
                    <div>Richiesto: <span className="font-semibold">{component.requiredQuantity}</span></div>
                    <div>Disponibile: <span className="font-semibold">{component.availableQuantity}</span></div>
                    <div>Prelevato: <span className="font-semibold text-green-700">{component.pickedQuantity} ({percentage}%)</span></div>
                  </div>
                  {selectedOrder.status !== 'COMPLETED' && component.pickedQuantity < component.requiredQuantity && (
                    <Button size="sm" className="mt-3" onClick={() => handlePickComponent(selectedOrder.id, component.id)}>Preleva batch</Button>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Distinta base ordine (stampa rapida)</h4>
            <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-auto">{(orderComponents[selectedOrder.id] ?? [])
              .map((component) => `${selectedOrder.orderNumber};${component.productCode};${component.productName};REQ=${component.requiredQuantity};PICKED=${component.pickedQuantity};LOC=${component.location}`)
              .join('\n')}</pre>
          </div>

          <div className="flex gap-2 border-t border-gray-200 pt-4">
            {selectedOrder.status === 'PENDING' && <Button onClick={() => handleOrderStatus(selectedOrder.id, 'IN_PROGRESS')}>Avvia</Button>}
            {selectedOrder.status === 'IN_PROGRESS' && <Button variant="secondary" onClick={() => handleOrderStatus(selectedOrder.id, 'ON_HOLD')}>Metti in pausa</Button>}
            {selectedOrder.status === 'ON_HOLD' && <Button onClick={() => handleOrderStatus(selectedOrder.id, 'IN_PROGRESS')}>Riprendi</Button>}
            {selectedOrder.status !== 'COMPLETED' && <Button variant="success" onClick={() => handleOrderStatus(selectedOrder.id, 'COMPLETED')}>Chiudi ordine</Button>}
            {selectedOrder.status !== 'CANCELLED' && <Button variant="danger" onClick={() => handleOrderStatus(selectedOrder.id, 'CANCELLED')}>Annulla</Button>}
          </div>
        </Card>
      )}
    </div>
  );
};

export default KittingAssemblyPage;

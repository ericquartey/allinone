import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Carrier {
  id: string;
  code: string;
  name: string;
  type: 'EXPRESS' | 'STANDARD' | 'ECONOMY' | 'FREIGHT';
  status: 'ACTIVE' | 'INACTIVE';
  rating: number;
  phone?: string;
  email?: string;
  website?: string;
  trackingUrl?: string;
  avgDeliveryTime: number;
  totalShipments: number;
  activeShipments: number;
  onTimeDelivery: number;
  cost: string;
  notes?: string;
}

const CarriersPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockCarriers: Carrier[] = [
    { id: '1', code: 'DHL', name: 'DHL Express', type: 'EXPRESS', status: 'ACTIVE', rating: 5, phone: '+39 02 1234567', email: 'info@dhl.it', website: 'www.dhl.it', trackingUrl: 'https://www.dhl.com/track', avgDeliveryTime: 1, totalShipments: 1234, activeShipments: 45, onTimeDelivery: 98, cost: '€€€', notes: 'Servizio express premium' },
    { id: '2', code: 'UPS', name: 'UPS Standard', type: 'STANDARD', status: 'ACTIVE', rating: 4, phone: '+39 02 7654321', email: 'info@ups.it', website: 'www.ups.it', trackingUrl: 'https://www.ups.com/track', avgDeliveryTime: 2, totalShipments: 987, activeShipments: 32, onTimeDelivery: 95, cost: '€€' },
    { id: '3', code: 'FDX', name: 'FedEx International', type: 'EXPRESS', status: 'ACTIVE', rating: 5, phone: '+39 02 9876543', email: 'service@fedex.it', website: 'www.fedex.it', trackingUrl: 'https://www.fedex.com/track', avgDeliveryTime: 2, totalShipments: 765, activeShipments: 28, onTimeDelivery: 97, cost: '€€€' },
    { id: '4', code: 'GLS', name: 'GLS Italy', type: 'ECONOMY', status: 'ACTIVE', rating: 3, phone: '+39 02 5555555', email: 'info@gls.it', website: 'www.gls.it', trackingUrl: 'https://www.gls.it/track', avgDeliveryTime: 3, totalShipments: 543, activeShipments: 18, onTimeDelivery: 92, cost: '€' },
    { id: '5', code: 'TNT', name: 'TNT Express', type: 'STANDARD', status: 'INACTIVE', rating: 4, phone: '+39 02 4444444', email: 'info@tnt.it', website: 'www.tnt.it', avgDeliveryTime: 2, totalShipments: 321, activeShipments: 0, onTimeDelivery: 94, cost: '€€', notes: 'Temporaneamente inattivo' }
  ];

  const stats = {
    total: mockCarriers.length,
    active: mockCarriers.filter(c => c.status === 'ACTIVE').length,
    activeShipments: mockCarriers.reduce((sum, c) => sum + c.activeShipments, 0),
    avgOnTime: Math.round(mockCarriers.reduce((sum, c) => sum + c.onTimeDelivery, 0) / mockCarriers.length)
  };

  const filteredCarriers = mockCarriers.filter((carrier) => {
    const matchesSearch = carrier.code.toLowerCase().includes(searchTerm.toLowerCase()) || carrier.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || carrier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Carrier['status']) => status === 'ACTIVE' ? <Badge variant="success">Attivo</Badge> : <Badge variant="secondary">Inattivo</Badge>;

  const getTypeBadge = (type: Carrier['type']) => {
    const config = { EXPRESS: 'bg-red-100 text-red-800', STANDARD: 'bg-blue-100 text-blue-800', ECONOMY: 'bg-green-100 text-green-800', FREIGHT: 'bg-purple-100 text-purple-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[type]}`}>{type}</span>;
  };

  const getRatingStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const columns = [
    { key: 'code', label: 'Codice', render: (row: Carrier) => <div className="font-medium">{row.code}</div> },
    { key: 'name', label: 'Nome', render: (row: Carrier) => <div><div className="font-medium">{row.name}</div><div className="text-xs text-gray-600">{row.email}</div></div> },
    { key: 'type', label: 'Tipo', render: (row: Carrier) => getTypeBadge(row.type) },
    { key: 'rating', label: 'Valutazione', render: (row: Carrier) => getRatingStars(row.rating) },
    { key: 'performance', label: 'Performance', render: (row: Carrier) => <div className="text-sm"><div>Consegna: {row.avgDeliveryTime}gg</div><div className="text-green-600">On-time: {row.onTimeDelivery}%</div></div> },
    { key: 'shipments', label: 'Spedizioni', render: (row: Carrier) => <div className="text-sm"><div className="font-medium">Tot: {row.totalShipments}</div><div className="text-blue-600">Attive: {row.activeShipments}</div></div> },
    { key: 'cost', label: 'Costo', render: (row: Carrier) => <div className="font-medium">{row.cost}</div> },
    { key: 'status', label: 'Stato', render: (row: Carrier) => getStatusBadge(row.status) },
    { key: 'actions', label: 'Azioni', render: (row: Carrier) => <Button variant="secondary" size="sm" onClick={() => { setSelectedCarrier(row); setShowDetailModal(true); }}>Dettaglio</Button> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Vettori</h1><p className="mt-2 text-gray-600">Gestisci vettori, tracking e performance</p></div>
        <Button variant="primary" onClick={() => console.log('Nuovo vettore')}>Nuovo Vettore</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Totale Vettori</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Attivi</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Spedizioni Attive</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeShipments}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">On-Time Avg</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.avgOnTime}%</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label><input type="text" placeholder="Cerca per codice, nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stato</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="ALL">Tutti</option><option value="ACTIVE">Attivo</option><option value="INACTIVE">Inattivo</option></select></div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Vettori ({filteredCarriers.length})</h2></div>
        <Table columns={columns} data={filteredCarriers} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedCarrier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedCarrier.name}</h2><p className="text-gray-600 mt-1">Codice: {selectedCarrier.code}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Vettore</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedCarrier.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedCarrier.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Valutazione</div><div className="mt-1">{getRatingStars(selectedCarrier.rating)}</div></div>
                  <div><div className="text-sm text-gray-600">Costo</div><div className="font-medium mt-1">{selectedCarrier.cost}</div></div>
                  {selectedCarrier.phone && <div><div className="text-sm text-gray-600">Telefono</div><div className="font-medium">{selectedCarrier.phone}</div></div>}
                  {selectedCarrier.email && <div><div className="text-sm text-gray-600">Email</div><div className="font-medium text-blue-600">{selectedCarrier.email}</div></div>}
                  {selectedCarrier.website && <div><div className="text-sm text-gray-600">Website</div><div className="font-medium text-blue-600">{selectedCarrier.website}</div></div>}
                  {selectedCarrier.trackingUrl && <div><div className="text-sm text-gray-600">Tracking URL</div><div className="font-medium text-blue-600 text-xs break-all">{selectedCarrier.trackingUrl}</div></div>}
                  <div><div className="text-sm text-gray-600">Tempo Medio Consegna</div><div className="font-medium">{selectedCarrier.avgDeliveryTime} giorni</div></div>
                  <div><div className="text-sm text-gray-600">On-Time Delivery</div><div className="font-medium text-green-600">{selectedCarrier.onTimeDelivery}%</div></div>
                  <div><div className="text-sm text-gray-600">Totale Spedizioni</div><div className="font-medium">{selectedCarrier.totalShipments}</div></div>
                  <div><div className="text-sm text-gray-600">Spedizioni Attive</div><div className="font-medium text-blue-600">{selectedCarrier.activeShipments}</div></div>
                </div>
                {selectedCarrier.notes && <div className="mt-4 pt-4 border-t border-gray-200"><div className="text-sm text-gray-600">Note</div><div className="mt-1 text-gray-900">{selectedCarrier.notes}</div></div>}
              </Card>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('View shipments')}>Vedi Spedizioni</Button>
                <Button variant="primary" onClick={() => console.log('Edit')}>Modifica</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarriersPage;

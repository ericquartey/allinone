import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'RETAIL' | 'WHOLESALE' | 'B2B' | 'B2C';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  priority: number;
  address: string;
  city: string;
  country: string;
  vatNumber?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  paymentTerms?: string;
  creditLimit: number;
  currentCredit: number;
  currency: string;
  totalOrders: number;
  activeOrders: number;
  lastOrderDate?: string;
  notes?: string;
}

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockCustomers: Customer[] = [
    {
      id: '1', code: 'CUST001', name: 'Cliente Premium S.p.A.', type: 'B2B', status: 'ACTIVE', priority: 1,
      address: 'Via Milano 100', city: 'Milano', country: 'IT', vatNumber: 'IT11111111111',
      phone: '+39 02 1111111', email: 'ordini@premium.it', contactPerson: 'Laura Verdi',
      paymentTerms: '60 giorni DFFM', creditLimit: 100000, currentCredit: 35000, currency: 'EUR',
      totalOrders: 234, activeOrders: 8, lastOrderDate: '2025-11-19', notes: 'Cliente VIP - massima priorità'
    },
    {
      id: '2', code: 'CUST002', name: 'Retail Chain Ltd', type: 'WHOLESALE', status: 'ACTIVE', priority: 2,
      address: '25 High Street', city: 'London', country: 'UK', vatNumber: 'GB222222222',
      phone: '+44 20 2222222', email: 'orders@retailchain.uk', contactPerson: 'James Brown',
      paymentTerms: '30 giorni DF', creditLimit: 75000, currentCredit: 22000, currency: 'GBP',
      totalOrders: 156, activeOrders: 4, lastOrderDate: '2025-11-17'
    },
    {
      id: '3', code: 'CUST003', name: 'Shop Online S.r.l.', type: 'B2C', status: 'ACTIVE', priority: 3,
      address: 'Via Roma 45', city: 'Roma', country: 'IT', vatNumber: 'IT33333333333',
      phone: '+39 06 3333333', email: 'info@shoponline.it', contactPerson: 'Marco Neri',
      paymentTerms: '30 giorni DF', creditLimit: 50000, currentCredit: 18000, currency: 'EUR',
      totalOrders: 89, activeOrders: 3, lastOrderDate: '2025-11-18'
    },
    {
      id: '4', code: 'CUST004', name: 'Distributore Alpha', type: 'WHOLESALE', status: 'BLOCKED', priority: 4,
      address: 'Corso Italia 78', city: 'Torino', country: 'IT', vatNumber: 'IT44444444444',
      phone: '+39 011 4444444', email: 'admin@alpha.it', contactPerson: 'Anna Blu',
      paymentTerms: 'Prepagato', creditLimit: 30000, currentCredit: 30500, currency: 'EUR',
      totalOrders: 45, activeOrders: 0, lastOrderDate: '2025-09-10', notes: 'Bloccato per superamento fido'
    }
  ];

  const stats = {
    total: mockCustomers.length,
    active: mockCustomers.filter(c => c.status === 'ACTIVE').length,
    blocked: mockCustomers.filter(c => c.status === 'BLOCKED').length,
    activeOrders: mockCustomers.reduce((sum, c) => sum + c.activeOrders, 0),
    totalCredit: mockCustomers.reduce((sum, c) => sum + c.currentCredit, 0)
  };

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch = customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || customer.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Customer['status']) => {
    const config = {
      ACTIVE: { label: 'Attivo', variant: 'success' as const },
      INACTIVE: { label: 'Inattivo', variant: 'secondary' as const },
      BLOCKED: { label: 'Bloccato', variant: 'danger' as const }
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: Customer['type']) => {
    const config = {
      RETAIL: { label: 'Retail', color: 'bg-blue-100 text-blue-800' },
      WHOLESALE: { label: 'Grossista', color: 'bg-purple-100 text-purple-800' },
      B2B: { label: 'B2B', color: 'bg-green-100 text-green-800' },
      B2C: { label: 'B2C', color: 'bg-orange-100 text-orange-800' }
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[type].color}`}>{config[type].label}</span>;
  };

  const columns = [
    { key: 'code', label: 'Codice', render: (row: Customer) => <div className="font-medium">{row.code}</div> },
    { key: 'name', label: 'Nome', render: (row: Customer) => <div><div className="font-medium">{row.name}</div><div className="text-sm text-gray-600">{row.contactPerson}</div></div> },
    { key: 'type', label: 'Tipo', render: (row: Customer) => getTypeBadge(row.type) },
    { key: 'location', label: 'Località', render: (row: Customer) => <div className="text-sm"><div>{row.city}</div><div className="text-gray-600">{row.country}</div></div> },
    { key: 'credit', label: 'Fido', render: (row: Customer) => <div className="text-sm"><div className="font-medium">{row.creditLimit.toLocaleString()} {row.currency}</div><div className={row.currentCredit > row.creditLimit ? 'text-red-600' : 'text-blue-600'}>Utilizzo: {row.currentCredit.toLocaleString()}</div></div> },
    { key: 'orders', label: 'Ordini', render: (row: Customer) => <div className="text-sm"><div className="font-medium">Tot: {row.totalOrders}</div><div className="text-blue-600">Attivi: {row.activeOrders}</div></div> },
    { key: 'status', label: 'Stato', render: (row: Customer) => getStatusBadge(row.status) },
    { key: 'actions', label: 'Azioni', render: (row: Customer) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setSelectedCustomer(row); setShowDetailModal(true); }}>Dettaglio</Button></div> }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Clienti</h1>
          <p className="mt-2 text-gray-600">Gestisci anagrafica clienti e fidi</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta')}>Esporta</Button>
          <Button variant="primary" onClick={() => console.log('Nuovo cliente')}>Nuovo Cliente</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Totale Clienti</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></Card>
        <Card className="p-4 border-green-200 bg-green-50"><div className="text-sm font-medium text-green-700">Attivi</div><div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div></Card>
        <Card className="p-4 border-red-200 bg-red-50"><div className="text-sm font-medium text-red-700">Bloccati</div><div className="text-2xl font-bold text-red-600 mt-1">{stats.blocked}</div></Card>
        <Card className="p-4 border-blue-200 bg-blue-50"><div className="text-sm font-medium text-blue-700">Ordini Attivi</div><div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeOrders}</div></Card>
        <Card className="p-4"><div className="text-sm font-medium text-gray-600">Fido Totale</div><div className="text-2xl font-bold text-orange-600 mt-1">{(stats.totalCredit/1000).toFixed(0)}K</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label>
            <input type="text" placeholder="Cerca per codice, nome, città..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option><option value="ACTIVE">Attivo</option><option value="INACTIVE">Inattivo</option><option value="BLOCKED">Bloccato</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option><option value="RETAIL">Retail</option><option value="WHOLESALE">Grossista</option><option value="B2B">B2B</option><option value="B2C">B2C</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Clienti ({filteredCustomers.length})</h2></div>
        <Table columns={columns} data={filteredCustomers} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2><p className="text-gray-600 mt-1">Codice: {selectedCustomer.code}</p></div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Cliente</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><div className="text-sm text-gray-600">Tipo</div><div className="mt-1">{getTypeBadge(selectedCustomer.type)}</div></div>
                  <div><div className="text-sm text-gray-600">Stato</div><div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div></div>
                  <div><div className="text-sm text-gray-600">Indirizzo</div><div className="font-medium">{selectedCustomer.address}</div><div className="text-sm">{selectedCustomer.city}, {selectedCustomer.country}</div></div>
                  {selectedCustomer.vatNumber && <div><div className="text-sm text-gray-600">Partita IVA</div><div className="font-medium font-mono">{selectedCustomer.vatNumber}</div></div>}
                  {selectedCustomer.phone && <div><div className="text-sm text-gray-600">Telefono</div><div className="font-medium">{selectedCustomer.phone}</div></div>}
                  {selectedCustomer.email && <div><div className="text-sm text-gray-600">Email</div><div className="font-medium text-blue-600">{selectedCustomer.email}</div></div>}
                  <div><div className="text-sm text-gray-600">Limite Fido</div><div className="font-medium">{selectedCustomer.creditLimit.toLocaleString()} {selectedCustomer.currency}</div></div>
                  <div><div className="text-sm text-gray-600">Fido Utilizzato</div><div className={`font-medium ${selectedCustomer.currentCredit > selectedCustomer.creditLimit ? 'text-red-600' : 'text-blue-600'}`}>{selectedCustomer.currentCredit.toLocaleString()} {selectedCustomer.currency}</div></div>
                  <div><div className="text-sm text-gray-600">Totale Ordini</div><div className="font-medium">{selectedCustomer.totalOrders}</div></div>
                  {selectedCustomer.lastOrderDate && <div><div className="text-sm text-gray-600">Ultimo Ordine</div><div className="font-medium">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString('it-IT')}</div></div>}
                </div>
                {selectedCustomer.notes && <div className="mt-4 pt-4 border-t border-gray-200"><div className="text-sm text-gray-600">Note</div><div className="mt-1 text-gray-900">{selectedCustomer.notes}</div></div>}
              </Card>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('View orders')}>Visualizza Ordini</Button>
                <Button variant="primary" onClick={() => console.log('Edit')}>Modifica Cliente</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

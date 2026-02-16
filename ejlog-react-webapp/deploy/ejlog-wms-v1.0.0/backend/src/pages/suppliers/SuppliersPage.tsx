import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

// TypeScript interfaces
interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'MANUFACTURER' | 'WHOLESALER' | 'DISTRIBUTOR' | 'SERVICES';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING';
  rating: number;
  address: string;
  city: string;
  country: string;
  vatNumber?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  paymentTerms?: string;
  currency: string;
  leadTime: number;
  totalOrders: number;
  activeOrders: number;
  lastOrderDate?: string;
  notes?: string;
}

const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data - in produzione verranno dalle API
  const mockSuppliers: Supplier[] = [
    {
      id: '1',
      code: 'SUPP001',
      name: 'Fornitore Alpha S.p.A.',
      type: 'MANUFACTURER',
      status: 'ACTIVE',
      rating: 5,
      address: 'Via Roma 123',
      city: 'Milano',
      country: 'IT',
      vatNumber: 'IT12345678901',
      phone: '+39 02 1234567',
      email: 'info@alpha.it',
      contactPerson: 'Mario Rossi',
      paymentTerms: '60 giorni DFFM',
      currency: 'EUR',
      leadTime: 7,
      totalOrders: 145,
      activeOrders: 5,
      lastOrderDate: '2025-11-18',
      notes: 'Fornitore strategico - priorità alta'
    },
    {
      id: '2',
      code: 'SUPP002',
      name: 'Beta International Ltd',
      type: 'WHOLESALER',
      status: 'ACTIVE',
      rating: 4,
      address: '10 Oxford Street',
      city: 'London',
      country: 'UK',
      vatNumber: 'GB987654321',
      phone: '+44 20 7123456',
      email: 'orders@beta.co.uk',
      contactPerson: 'John Smith',
      paymentTerms: '30 giorni DF',
      currency: 'GBP',
      leadTime: 14,
      totalOrders: 89,
      activeOrders: 2,
      lastOrderDate: '2025-11-15',
      notes: ''
    },
    {
      id: '3',
      code: 'SUPP003',
      name: 'Gamma Logistics GmbH',
      type: 'DISTRIBUTOR',
      status: 'ACTIVE',
      rating: 5,
      address: 'Hauptstrasse 45',
      city: 'Berlin',
      country: 'DE',
      vatNumber: 'DE123456789',
      phone: '+49 30 1234567',
      email: 'contact@gamma.de',
      contactPerson: 'Hans Mueller',
      paymentTerms: '45 giorni DFFM',
      currency: 'EUR',
      leadTime: 10,
      totalOrders: 203,
      activeOrders: 8,
      lastOrderDate: '2025-11-19',
      notes: 'Fornitore certificato ISO 9001'
    },
    {
      id: '4',
      code: 'SUPP004',
      name: 'Delta Services S.r.l.',
      type: 'SERVICES',
      status: 'ACTIVE',
      rating: 3,
      address: 'Via Veneto 78',
      city: 'Roma',
      country: 'IT',
      vatNumber: 'IT98765432109',
      phone: '+39 06 9876543',
      email: 'servizi@delta.it',
      contactPerson: 'Giuseppe Verdi',
      paymentTerms: '30 giorni DF',
      currency: 'EUR',
      leadTime: 3,
      totalOrders: 56,
      activeOrders: 1,
      lastOrderDate: '2025-11-10',
      notes: ''
    },
    {
      id: '5',
      code: 'SUPP005',
      name: 'Epsilon Manufacturing Corp',
      type: 'MANUFACTURER',
      status: 'BLOCKED',
      rating: 2,
      address: '5th Avenue 789',
      city: 'New York',
      country: 'US',
      vatNumber: 'US555666777',
      phone: '+1 212 5556666',
      email: 'info@epsilon.com',
      contactPerson: 'Robert Johnson',
      paymentTerms: 'Prepagato',
      currency: 'USD',
      leadTime: 30,
      totalOrders: 23,
      activeOrders: 0,
      lastOrderDate: '2025-09-15',
      notes: 'Bloccato per ritardi consegna - in fase di valutazione'
    },
    {
      id: '6',
      code: 'SUPP006',
      name: 'Zeta Components S.A.',
      type: 'MANUFACTURER',
      status: 'PENDING',
      rating: 0,
      address: 'Rue de la Paix 23',
      city: 'Paris',
      country: 'FR',
      vatNumber: 'FR111222333',
      phone: '+33 1 12345678',
      email: 'commercial@zeta.fr',
      contactPerson: 'Pierre Dubois',
      paymentTerms: '60 giorni DFFM',
      currency: 'EUR',
      leadTime: 12,
      totalOrders: 0,
      activeOrders: 0,
      notes: 'Nuovo fornitore - in fase di qualificazione'
    },
    {
      id: '7',
      code: 'SUPP007',
      name: 'Eta Trade S.p.A.',
      type: 'WHOLESALER',
      status: 'INACTIVE',
      rating: 4,
      address: 'Corso Italia 456',
      city: 'Torino',
      country: 'IT',
      vatNumber: 'IT11223344556',
      phone: '+39 011 1122334',
      email: 'info@eta.it',
      contactPerson: 'Anna Bianchi',
      paymentTerms: '90 giorni DFFM',
      currency: 'EUR',
      leadTime: 5,
      totalOrders: 178,
      activeOrders: 0,
      lastOrderDate: '2025-08-20',
      notes: 'Temporaneamente inattivo'
    }
  ];

  // Calcola le statistiche
  const stats = {
    total: mockSuppliers.length,
    active: mockSuppliers.filter(s => s.status === 'ACTIVE').length,
    inactive: mockSuppliers.filter(s => s.status === 'INACTIVE').length,
    blocked: mockSuppliers.filter(s => s.status === 'BLOCKED').length,
    pending: mockSuppliers.filter(s => s.status === 'PENDING').length,
    activeOrders: mockSuppliers.reduce((sum, s) => sum + s.activeOrders, 0)
  };

  // Filtra i fornitori
  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch =
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.vatNumber && supplier.vatNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || supplier.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || supplier.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Funzione per ottenere il badge di stato
  const getStatusBadge = (status: Supplier['status']) => {
    const statusConfig = {
      ACTIVE: { label: 'Attivo', variant: 'success' as const },
      INACTIVE: { label: 'Inattivo', variant: 'secondary' as const },
      BLOCKED: { label: 'Bloccato', variant: 'danger' as const },
      PENDING: { label: 'In Attesa', variant: 'warning' as const }
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Funzione per ottenere il badge del tipo
  const getTypeBadge = (type: Supplier['type']) => {
    const typeConfig = {
      MANUFACTURER: { label: 'Produttore', color: 'bg-blue-100 text-blue-800' },
      WHOLESALER: { label: 'Grossista', color: 'bg-purple-100 text-purple-800' },
      DISTRIBUTOR: { label: 'Distributore', color: 'bg-green-100 text-green-800' },
      SERVICES: { label: 'Servizi', color: 'bg-orange-100 text-orange-800' }
    };
    const config = typeConfig[type];
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config.color}`}>{config.label}</span>;
  };

  // Funzione per ottenere le stelle di rating
  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  // Gestione apertura dettaglio
  const handleOpenDetail = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  // Gestione chiusura dettaglio
  const handleCloseDetail = () => {
    setSelectedSupplier(null);
    setShowDetailModal(false);
  };

  // Gestione edit fornitore
  const handleEdit = (supplierId: string) => {
    console.log('Edit supplier:', supplierId);
    // In produzione: navigare a pagina di modifica
  };

  // Gestione blocco/sblocco fornitore
  const handleToggleBlock = (supplierId: string, currentStatus: string) => {
    console.log('Toggle block supplier:', supplierId, currentStatus);
    // In produzione: chiamata API per bloccare/sbloccare
  };

  // Colonne della tabella
  const columns = [
    {
      key: 'code',
      label: 'Codice',
      render: (row: Supplier) => (
        <div className="font-medium">{row.code}</div>
      )
    },
    {
      key: 'name',
      label: 'Nome',
      render: (row: Supplier) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-600">{row.contactPerson}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row: Supplier) => getTypeBadge(row.type)
    },
    {
      key: 'location',
      label: 'Località',
      render: (row: Supplier) => (
        <div className="text-sm">
          <div>{row.city}</div>
          <div className="text-gray-600">{row.country}</div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contatti',
      render: (row: Supplier) => (
        <div className="text-sm">
          {row.email && <div className="text-blue-600">{row.email}</div>}
          {row.phone && <div className="text-gray-600">{row.phone}</div>}
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Valutazione',
      render: (row: Supplier) => getRatingStars(row.rating)
    },
    {
      key: 'orders',
      label: 'Ordini',
      render: (row: Supplier) => (
        <div className="text-sm">
          <div className="font-medium">Totale: {row.totalOrders}</div>
          <div className="text-blue-600">Attivi: {row.activeOrders}</div>
        </div>
      )
    },
    {
      key: 'leadTime',
      label: 'Lead Time',
      render: (row: Supplier) => (
        <div className="text-sm">
          <Badge variant="info">{row.leadTime} giorni</Badge>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      render: (row: Supplier) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: Supplier) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenDetail(row)}
          >
            Dettaglio
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleEdit(row.id)}
          >
            Modifica
          </Button>
          {row.status === 'ACTIVE' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleToggleBlock(row.id, row.status)}
            >
              Blocca
            </Button>
          )}
          {row.status === 'BLOCKED' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleToggleBlock(row.id, row.status)}
            >
              Sblocca
            </Button>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Fornitori</h1>
          <p className="mt-2 text-gray-600">
            Gestisci anagrafica fornitori, valutazioni e contratti
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => console.log('Esporta')}
          >
            Esporta
          </Button>
          <Button
            variant="primary"
            onClick={() => console.log('Nuovo fornitore')}
          >
            Nuovo Fornitore
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Totale Fornitori</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700">Attivi</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Inattivi</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">Bloccati</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.blocked}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">In Attesa</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-700">Ordini Attivi</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeOrders}</div>
        </Card>
      </div>

      {/* Filtri */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ricerca
            </label>
            <input
              type="text"
              placeholder="Cerca per codice, nome, città, P.IVA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">Tutti</option>
              <option value="ACTIVE">Attivo</option>
              <option value="INACTIVE">Inattivo</option>
              <option value="BLOCKED">Bloccato</option>
              <option value="PENDING">In Attesa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">Tutti</option>
              <option value="MANUFACTURER">Produttore</option>
              <option value="WHOLESALER">Grossista</option>
              <option value="DISTRIBUTOR">Distributore</option>
              <option value="SERVICES">Servizi</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabella fornitori */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Fornitori ({filteredSuppliers.length})
          </h2>
        </div>
        <Table
          columns={columns}
          data={filteredSuppliers}
          keyExtractor={(row) => row.id}
        />
      </Card>

      {/* Modal dettaglio */}
      {showDetailModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedSupplier.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Codice: {selectedSupplier.code}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenuto modal */}
            <div className="p-6 space-y-6">
              {/* Informazioni fornitore */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Fornitore</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Tipo</div>
                    <div className="mt-1">{getTypeBadge(selectedSupplier.type)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Stato</div>
                    <div className="mt-1">{getStatusBadge(selectedSupplier.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Valutazione</div>
                    <div className="mt-1">{getRatingStars(selectedSupplier.rating)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Indirizzo</div>
                    <div className="font-medium">{selectedSupplier.address}</div>
                    <div className="text-sm">{selectedSupplier.city}, {selectedSupplier.country}</div>
                  </div>
                  {selectedSupplier.vatNumber && (
                    <div>
                      <div className="text-sm text-gray-600">Partita IVA</div>
                      <div className="font-medium font-mono">{selectedSupplier.vatNumber}</div>
                    </div>
                  )}
                  {selectedSupplier.contactPerson && (
                    <div>
                      <div className="text-sm text-gray-600">Persona di Contatto</div>
                      <div className="font-medium">{selectedSupplier.contactPerson}</div>
                    </div>
                  )}
                  {selectedSupplier.phone && (
                    <div>
                      <div className="text-sm text-gray-600">Telefono</div>
                      <div className="font-medium">{selectedSupplier.phone}</div>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium text-blue-600">{selectedSupplier.email}</div>
                    </div>
                  )}
                  {selectedSupplier.paymentTerms && (
                    <div>
                      <div className="text-sm text-gray-600">Termini Pagamento</div>
                      <div className="font-medium">{selectedSupplier.paymentTerms}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600">Valuta</div>
                    <div className="font-medium">{selectedSupplier.currency}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Lead Time</div>
                    <div className="font-medium">{selectedSupplier.leadTime} giorni</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Totale Ordini</div>
                    <div className="font-medium">{selectedSupplier.totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ordini Attivi</div>
                    <div className="font-medium text-blue-600">{selectedSupplier.activeOrders}</div>
                  </div>
                  {selectedSupplier.lastOrderDate && (
                    <div>
                      <div className="text-sm text-gray-600">Ultimo Ordine</div>
                      <div className="font-medium">
                        {new Date(selectedSupplier.lastOrderDate).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  )}
                </div>
                {selectedSupplier.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Note</div>
                    <div className="mt-1 text-gray-900">{selectedSupplier.notes}</div>
                  </div>
                )}
              </Card>

              {/* Azioni */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => console.log('View orders')}
                >
                  Visualizza Ordini
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleEdit(selectedSupplier.id)}
                >
                  Modifica Fornitore
                </Button>
                {selectedSupplier.status === 'ACTIVE' && (
                  <Button
                    variant="danger"
                    onClick={() => handleToggleBlock(selectedSupplier.id, selectedSupplier.status)}
                  >
                    Blocca Fornitore
                  </Button>
                )}
                {selectedSupplier.status === 'BLOCKED' && (
                  <Button
                    variant="success"
                    onClick={() => handleToggleBlock(selectedSupplier.id, selectedSupplier.status)}
                  >
                    Sblocca Fornitore
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;

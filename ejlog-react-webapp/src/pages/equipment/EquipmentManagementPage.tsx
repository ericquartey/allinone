import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Equipment {
  id: string;
  code: string;
  name: string;
  type: 'FORKLIFT' | 'SCANNER' | 'PRINTER' | 'CONVEYOR' | 'SCALE' | 'AGV' | 'SORTER';
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'FAULT';
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  totalOperatingHours: number;
  assignedTo?: string;
  maintenanceHistory: number;
  faultCount: number;
  notes?: string;
}

const EquipmentManagementPage: React.FC = () => {
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const mockEquipment: Equipment[] = [
    {
      id: '1', code: 'FRK-001', name: 'Carrello Elevatore 1', type: 'FORKLIFT', status: 'OPERATIONAL',
      location: 'ZONA-A', manufacturer: 'Toyota', model: '8FD25', serialNumber: 'TY2023-12345',
      purchaseDate: '2023-01-15', lastMaintenance: '2025-11-10', nextMaintenance: '2025-12-10',
      totalOperatingHours: 1234, assignedTo: 'M.Rossi', maintenanceHistory: 8, faultCount: 2
    },
    {
      id: '2', code: 'SCN-001', name: 'Scanner Barcode 1', type: 'SCANNER', status: 'OPERATIONAL',
      location: 'Postazione WS-01', manufacturer: 'Zebra', model: 'DS3678', serialNumber: 'ZB2024-56789',
      purchaseDate: '2024-03-20', lastMaintenance: '2025-10-15', nextMaintenance: '2026-01-15',
      totalOperatingHours: 456, assignedTo: 'G.Bianchi', maintenanceHistory: 2, faultCount: 0
    },
    {
      id: '3', code: 'PRT-001', name: 'Stampante Etichette 1', type: 'PRINTER', status: 'MAINTENANCE',
      location: 'ZONA-B', manufacturer: 'Datamax', model: 'I-4212', serialNumber: 'DM2023-11111',
      purchaseDate: '2023-06-10', lastMaintenance: '2025-11-18', nextMaintenance: '2025-11-25',
      totalOperatingHours: 892, maintenanceHistory: 12, faultCount: 5, notes: 'Manutenzione programmata - sostituzione testina'
    },
    {
      id: '4', code: 'CNV-001', name: 'Nastro Trasportatore 1', type: 'CONVEYOR', status: 'OPERATIONAL',
      location: 'Linea Picking', manufacturer: 'Interroll', model: 'RollerDrive EC310', serialNumber: 'IR2022-22222',
      purchaseDate: '2022-09-05', lastMaintenance: '2025-11-01', nextMaintenance: '2026-02-01',
      totalOperatingHours: 3456, maintenanceHistory: 18, faultCount: 8
    },
    {
      id: '5', code: 'SCL-001', name: 'Bilancia Industriale 1', type: 'SCALE', status: 'OPERATIONAL',
      location: 'ZONA-C', manufacturer: 'Mettler Toledo', model: 'IND780', serialNumber: 'MT2024-33333',
      purchaseDate: '2024-02-12', lastMaintenance: '2025-11-15', nextMaintenance: '2026-02-15',
      totalOperatingHours: 234, assignedTo: 'A.Verdi', maintenanceHistory: 3, faultCount: 0
    },
    {
      id: '6', code: 'AGV-001', name: 'Robot AGV 1', type: 'AGV', status: 'FAULT',
      location: 'ZONA-D', manufacturer: 'KUKA', model: 'KMP 1500', serialNumber: 'KK2023-44444',
      purchaseDate: '2023-11-20', lastMaintenance: '2025-11-12', nextMaintenance: '2025-12-12',
      totalOperatingHours: 567, maintenanceHistory: 6, faultCount: 3, notes: 'Errore navigazione - tecnico chiamato'
    },
    {
      id: '7', code: 'SRT-001', name: 'Sorter Automatico 1', type: 'SORTER', status: 'OFFLINE',
      location: 'Area Spedizioni', manufacturer: 'Beumer', model: 'BG Sorter 400', serialNumber: 'BE2022-55555',
      purchaseDate: '2022-05-30', lastMaintenance: '2025-10-20', nextMaintenance: '2026-01-20',
      totalOperatingHours: 4123, maintenanceHistory: 22, faultCount: 15, notes: 'Fermo per upgrade software'
    },
    {
      id: '8', code: 'FRK-002', name: 'Carrello Elevatore 2', type: 'FORKLIFT', status: 'OPERATIONAL',
      location: 'ZONA-B', manufacturer: 'Linde', model: 'E20', serialNumber: 'LI2023-66666',
      purchaseDate: '2023-04-18', lastMaintenance: '2025-11-08', nextMaintenance: '2025-12-08',
      totalOperatingHours: 987, assignedTo: 'L.Neri', maintenanceHistory: 7, faultCount: 1
    }
  ];

  const stats = {
    total: mockEquipment.length,
    operational: mockEquipment.filter(e => e.status === 'OPERATIONAL').length,
    maintenance: mockEquipment.filter(e => e.status === 'MAINTENANCE').length,
    fault: mockEquipment.filter(e => e.status === 'FAULT').length,
    offline: mockEquipment.filter(e => e.status === 'OFFLINE').length
  };

  const filteredEquipment = mockEquipment.filter((equipment) => {
    const matchesSearch = equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || equipment.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || equipment.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: Equipment['status']) => {
    const config = {
      OPERATIONAL: { label: 'Operativo', variant: 'success' as const },
      MAINTENANCE: { label: 'Manutenzione', variant: 'warning' as const },
      OFFLINE: { label: 'Offline', variant: 'secondary' as const },
      FAULT: { label: 'Guasto', variant: 'danger' as const }
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getTypeBadge = (type: Equipment['type']) => {
    const config = {
      FORKLIFT: { label: 'Carrello', color: 'bg-blue-100 text-blue-800' },
      SCANNER: { label: 'Scanner', color: 'bg-purple-100 text-purple-800' },
      PRINTER: { label: 'Stampante', color: 'bg-green-100 text-green-800' },
      CONVEYOR: { label: 'Nastro', color: 'bg-orange-100 text-orange-800' },
      SCALE: { label: 'Bilancia', color: 'bg-pink-100 text-pink-800' },
      AGV: { label: 'AGV/Robot', color: 'bg-indigo-100 text-indigo-800' },
      SORTER: { label: 'Sorter', color: 'bg-yellow-100 text-yellow-800' }
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${config[type].color}`}>{config[type].label}</span>;
  };

  const getMaintenanceStatus = (nextMaintenance?: string) => {
    if (!nextMaintenance) return <Badge variant="secondary">Non Programmata</Badge>;
    const daysUntil = Math.ceil((new Date(nextMaintenance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return <Badge variant="danger">Scaduta</Badge>;
    if (daysUntil <= 7) return <Badge variant="warning">{daysUntil}gg</Badge>;
    return <Badge variant="success">{daysUntil}gg</Badge>;
  };

  const columns = [
    {
      key: 'code',
      label: 'Codice',
      render: (row: Equipment) => <div className="font-medium font-mono text-sm">{row.code}</div>
    },
    {
      key: 'name',
      label: 'Nome',
      render: (row: Equipment) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-600">{row.manufacturer} {row.model}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row: Equipment) => getTypeBadge(row.type)
    },
    {
      key: 'location',
      label: 'Locazione',
      render: (row: Equipment) => (
        <div className="text-sm">
          <div>{row.location}</div>
          {row.assignedTo && <div className="text-gray-600">Assegnato: {row.assignedTo}</div>}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      render: (row: Equipment) => getStatusBadge(row.status)
    },
    {
      key: 'maintenance',
      label: 'Prossima Manutenzione',
      render: (row: Equipment) => (
        <div className="text-sm">
          {getMaintenanceStatus(row.nextMaintenance)}
          {row.nextMaintenance && <div className="text-xs text-gray-600 mt-1">{new Date(row.nextMaintenance).toLocaleDateString('it-IT')}</div>}
        </div>
      )
    },
    {
      key: 'hours',
      label: 'Ore Utilizzo',
      render: (row: Equipment) => <div className="font-medium">{row.totalOperatingHours}h</div>
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: Equipment) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSelectedEquipment(row); setShowDetailModal(true); }}>
            Dettaglio
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Attrezzature</h1>
          <p className="mt-2 text-gray-600">Gestisci macchinari, equipaggiamenti e manutenzioni</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Programma manutenzione')}>Programma Manutenzione</Button>
          <Button variant="primary" onClick={() => console.log('Nuova attrezzatura')}>Nuova Attrezzatura</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Totale Attrezzature</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700">Operative</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.operational}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm font-medium text-yellow-700">Manutenzione</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.maintenance}</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700">Guasti</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.fault}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Offline</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.offline}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ricerca</label>
            <input
              type="text"
              placeholder="Cerca per codice, nome, locazione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option>
              <option value="FORKLIFT">Carrello Elevatore</option>
              <option value="SCANNER">Scanner</option>
              <option value="PRINTER">Stampante</option>
              <option value="CONVEYOR">Nastro Trasportatore</option>
              <option value="SCALE">Bilancia</option>
              <option value="AGV">AGV/Robot</option>
              <option value="SORTER">Sorter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="ALL">Tutti</option>
              <option value="OPERATIONAL">Operativo</option>
              <option value="MAINTENANCE">Manutenzione</option>
              <option value="FAULT">Guasto</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Attrezzature ({filteredEquipment.length})</h2>
        </div>
        <Table columns={columns} data={filteredEquipment} keyExtractor={(row) => row.id} />
      </Card>

      {showDetailModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedEquipment.name}</h2>
                    {getTypeBadge(selectedEquipment.type)}
                    {getStatusBadge(selectedEquipment.status)}
                  </div>
                  <p className="text-gray-600 mt-1">Codice: {selectedEquipment.code}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Informazioni Generali</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Produttore</div>
                    <div className="font-medium">{selectedEquipment.manufacturer}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Modello</div>
                    <div className="font-medium">{selectedEquipment.model}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Numero Seriale</div>
                    <div className="font-medium font-mono text-sm">{selectedEquipment.serialNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Acquisto</div>
                    <div className="font-medium">{new Date(selectedEquipment.purchaseDate).toLocaleDateString('it-IT')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Locazione</div>
                    <div className="font-medium">{selectedEquipment.location}</div>
                  </div>
                  {selectedEquipment.assignedTo && (
                    <div>
                      <div className="text-sm text-gray-600">Assegnato A</div>
                      <div className="font-medium">{selectedEquipment.assignedTo}</div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Statistiche Utilizzo</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Ore Totali Utilizzo</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedEquipment.totalOperatingHours}h</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Manutenzioni Effettuate</div>
                    <div className="text-2xl font-bold text-green-600">{selectedEquipment.maintenanceHistory}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Guasti Totali</div>
                    <div className={`text-2xl font-bold ${selectedEquipment.faultCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedEquipment.faultCount}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Manutenzione</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEquipment.lastMaintenance && (
                    <div>
                      <div className="text-sm text-gray-600">Ultima Manutenzione</div>
                      <div className="font-medium">{new Date(selectedEquipment.lastMaintenance).toLocaleDateString('it-IT')}</div>
                    </div>
                  )}
                  {selectedEquipment.nextMaintenance && (
                    <div>
                      <div className="text-sm text-gray-600">Prossima Manutenzione</div>
                      <div className="font-medium flex items-center gap-2">
                        {new Date(selectedEquipment.nextMaintenance).toLocaleDateString('it-IT')}
                        {getMaintenanceStatus(selectedEquipment.nextMaintenance)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {selectedEquipment.notes && (
                <Card className="p-4 border-yellow-200 bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800">Note</h3>
                  <p className="text-yellow-900">{selectedEquipment.notes}</p>
                </Card>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => console.log('Storico manutenzioni')}>Storico Manutenzioni</Button>
                <Button variant="secondary" onClick={() => console.log('Programma manutenzione')}>Programma Manutenzione</Button>
                <Button variant="primary" onClick={() => console.log('Modifica')}>Modifica</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagementPage;

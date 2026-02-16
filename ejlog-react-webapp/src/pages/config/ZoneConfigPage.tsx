import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface Zone {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'STORAGE' | 'PICKING' | 'RECEIVING' | 'SHIPPING' | 'STAGING' | 'RETURN';
  temperature: 'AMBIENT' | 'COLD' | 'FROZEN';
  priority: number;
  isActive: boolean;
  allowMixedProducts: boolean;
  requiresLotControl: boolean;
  requiresSerialNumber: boolean;
  maxLocations: number;
  currentLocations: number;
  maxCapacityKg: number;
  currentCapacityKg: number;
  allowedProductCategories: string[];
  restrictedProductCategories: string[];
  createdAt: string;
  updatedAt: string;
}

const ZoneConfigPage = () => {
  const [isLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Mock data
  const mockZones: Zone[] = [
    {
      id: 'ZONE001',
      code: 'A',
      name: 'Zona Stoccaggio A',
      description: 'Zona principale per stoccaggio prodotti pesanti',
      type: 'STORAGE',
      temperature: 'AMBIENT',
      priority: 1,
      isActive: true,
      allowMixedProducts: true,
      requiresLotControl: false,
      requiresSerialNumber: false,
      maxLocations: 100,
      currentLocations: 87,
      maxCapacityKg: 50000,
      currentCapacityKg: 42350,
      allowedProductCategories: ['FERRAMENTA', 'BULLONERIA', 'MATERIALE_EDILE'],
      restrictedProductCategories: [],
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2025-11-15T14:30:00',
    },
    {
      id: 'ZONE002',
      code: 'B',
      name: 'Zona Picking B',
      description: 'Zona dedicata al picking rapido',
      type: 'PICKING',
      temperature: 'AMBIENT',
      priority: 2,
      isActive: true,
      allowMixedProducts: true,
      requiresLotControl: false,
      requiresSerialNumber: false,
      maxLocations: 50,
      currentLocations: 48,
      maxCapacityKg: 5000,
      currentCapacityKg: 4200,
      allowedProductCategories: ['FERRAMENTA', 'BULLONERIA'],
      restrictedProductCategories: [],
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2025-11-18T09:15:00',
    },
    {
      id: 'ZONE003',
      code: 'C',
      name: 'Zona Freddo',
      description: 'Zona refrigerata per prodotti deperibili',
      type: 'STORAGE',
      temperature: 'COLD',
      priority: 3,
      isActive: true,
      allowMixedProducts: false,
      requiresLotControl: true,
      requiresSerialNumber: false,
      maxLocations: 30,
      currentLocations: 22,
      maxCapacityKg: 10000,
      currentCapacityKg: 6500,
      allowedProductCategories: ['ALIMENTARI', 'FARMACEUTICI'],
      restrictedProductCategories: ['CHIMICI'],
      createdAt: '2024-02-01T10:00:00',
      updatedAt: '2025-11-19T16:45:00',
    },
    {
      id: 'ZONE004',
      code: 'R',
      name: 'Zona Ricevimento',
      description: 'Area di ricevimento merci',
      type: 'RECEIVING',
      temperature: 'AMBIENT',
      priority: 1,
      isActive: true,
      allowMixedProducts: true,
      requiresLotControl: false,
      requiresSerialNumber: false,
      maxLocations: 20,
      currentLocations: 8,
      maxCapacityKg: 15000,
      currentCapacityKg: 3200,
      allowedProductCategories: [],
      restrictedProductCategories: [],
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2025-11-20T08:00:00',
    },
    {
      id: 'ZONE005',
      code: 'S',
      name: 'Zona Spedizioni',
      description: 'Area preparazione spedizioni',
      type: 'SHIPPING',
      temperature: 'AMBIENT',
      priority: 1,
      isActive: true,
      allowMixedProducts: true,
      requiresLotControl: false,
      requiresSerialNumber: false,
      maxLocations: 25,
      currentLocations: 15,
      maxCapacityKg: 12000,
      currentCapacityKg: 5800,
      allowedProductCategories: [],
      restrictedProductCategories: [],
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2025-11-20T11:30:00',
    },
    {
      id: 'ZONE006',
      code: 'F',
      name: 'Zona Congelati',
      description: 'Zona per prodotti surgelati',
      type: 'STORAGE',
      temperature: 'FROZEN',
      priority: 4,
      isActive: true,
      allowMixedProducts: false,
      requiresLotControl: true,
      requiresSerialNumber: true,
      maxLocations: 15,
      currentLocations: 12,
      maxCapacityKg: 8000,
      currentCapacityKg: 6200,
      allowedProductCategories: ['SURGELATI'],
      restrictedProductCategories: ['CHIMICI', 'INFIAMMABILI'],
      createdAt: '2024-03-10T10:00:00',
      updatedAt: '2025-11-19T14:20:00',
    },
    {
      id: 'ZONE007',
      code: 'T',
      name: 'Zona Transito',
      description: 'Area di staging temporaneo',
      type: 'STAGING',
      temperature: 'AMBIENT',
      priority: 2,
      isActive: true,
      allowMixedProducts: true,
      requiresLotControl: false,
      requiresSerialNumber: false,
      maxLocations: 10,
      currentLocations: 6,
      maxCapacityKg: 5000,
      currentCapacityKg: 2100,
      allowedProductCategories: [],
      restrictedProductCategories: [],
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2025-11-20T09:45:00',
    },
    {
      id: 'ZONE008',
      code: 'D',
      name: 'Zona Resi',
      description: 'Area gestione resi e difettosi',
      type: 'RETURN',
      temperature: 'AMBIENT',
      priority: 5,
      isActive: false,
      allowMixedProducts: true,
      requiresLotControl: true,
      requiresSerialNumber: true,
      maxLocations: 15,
      currentLocations: 3,
      maxCapacityKg: 3000,
      currentCapacityKg: 450,
      allowedProductCategories: [],
      restrictedProductCategories: [],
      createdAt: '2024-04-01T10:00:00',
      updatedAt: '2025-11-10T12:00:00',
    },
  ];

  // Filtering
  const filteredZones = mockZones.filter((zone) => {
    const matchesSearch =
      zone.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || zone.type === typeFilter;
    const matchesTemperature = temperatureFilter === 'ALL' || zone.temperature === temperatureFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && zone.isActive) ||
      (statusFilter === 'INACTIVE' && !zone.isActive);

    return matchesSearch && matchesType && matchesTemperature && matchesStatus;
  });

  // Statistics
  const stats = {
    totalZones: mockZones.length,
    activeZones: mockZones.filter((z) => z.isActive).length,
    totalLocations: mockZones.reduce((sum, z) => sum + z.currentLocations, 0),
    maxLocations: mockZones.reduce((sum, z) => sum + z.maxLocations, 0),
    totalCapacity: mockZones.reduce((sum, z) => sum + z.currentCapacityKg, 0),
    maxCapacity: mockZones.reduce((sum, z) => sum + z.maxCapacityKg, 0),
  };

  const getZoneTypeBadge = (type: Zone['type']) => {
    switch (type) {
      case 'STORAGE':
        return <Badge variant="primary">STOCCAGGIO</Badge>;
      case 'PICKING':
        return <Badge variant="success">PICKING</Badge>;
      case 'RECEIVING':
        return <Badge variant="info">RICEVIMENTO</Badge>;
      case 'SHIPPING':
        return <Badge variant="warning">SPEDIZIONE</Badge>;
      case 'STAGING':
        return <Badge variant="secondary">TRANSITO</Badge>;
      case 'RETURN':
        return <Badge variant="danger">RESI</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getTemperatureBadge = (temp: Zone['temperature']) => {
    switch (temp) {
      case 'AMBIENT':
        return <Badge variant="success">AMBIENTE</Badge>;
      case 'COLD':
        return <Badge variant="info">FREDDO</Badge>;
      case 'FROZEN':
        return <Badge variant="primary">CONGELATO</Badge>;
      default:
        return <Badge variant="secondary">{temp}</Badge>;
    }
  };

  const getOccupancyPercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  const columns = [
    {
      key: 'code',
      label: 'Codice',
      sortable: true,
      render: (row: Zone) => (
        <div className="font-bold text-lg text-blue-600">{row.code}</div>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (row: Zone) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-600 truncate max-w-xs">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (row: Zone) => getZoneTypeBadge(row.type),
    },
    {
      key: 'temperature',
      label: 'Temperatura',
      sortable: true,
      render: (row: Zone) => getTemperatureBadge(row.temperature),
    },
    {
      key: 'priority',
      label: 'Priorità',
      sortable: true,
      render: (row: Zone) => (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
            {row.priority}
          </div>
        </div>
      ),
    },
    {
      key: 'locations',
      label: 'Locazioni',
      render: (row: Zone) => {
        const percentage = getOccupancyPercentage(row.currentLocations, row.maxLocations);
        return (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{row.currentLocations} / {row.maxLocations}</span>
              <span className="text-gray-600">{percentage}%</span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  percentage > 90 ? 'bg-red-500' :
                  percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'capacity',
      label: 'Capacità (kg)',
      render: (row: Zone) => {
        const percentage = getOccupancyPercentage(row.currentCapacityKg, row.maxCapacityKg);
        return (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{row.currentCapacityKg.toLocaleString()}</span>
              <span className="text-gray-600">{percentage}%</span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  percentage > 90 ? 'bg-red-500' :
                  percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'features',
      label: 'Caratteristiche',
      render: (row: Zone) => (
        <div className="flex flex-wrap gap-1">
          {row.allowMixedProducts && (
            <Badge variant="info" className="text-xs">MIX</Badge>
          )}
          {row.requiresLotControl && (
            <Badge variant="warning" className="text-xs">LOT</Badge>
          )}
          {row.requiresSerialNumber && (
            <Badge variant="danger" className="text-xs">SN</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stato',
      sortable: true,
      render: (row: Zone) =>
        row.isActive ? (
          <Badge variant="success">ATTIVA</Badge>
        ) : (
          <Badge variant="secondary">INATTIVA</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Azioni',
      render: (row: Zone) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedZone(row);
              setShowEditModal(true);
            }}
          >
            Modifica
          </Button>
          <Button
            size="sm"
            variant={row.isActive ? 'warning' : 'success'}
            onClick={() => alert(`${row.isActive ? 'Disattiva' : 'Attiva'} zona ${row.code}`)}
          >
            {row.isActive ? 'Disattiva' : 'Attiva'}
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateZone = () => {
    alert('Creazione nuova zona...');
    setShowCreateModal(false);
  };

  const handleUpdateZone = () => {
    alert(`Aggiornamento zona ${selectedZone?.code}...`);
    setShowEditModal(false);
    setSelectedZone(null);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Configurazione Zone</h1>
          <p className="text-gray-600 mt-1">Gestione zone e aree del magazzino</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuova Zona
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Totale Zone</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalZones}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Zone Attive</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeZones}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Locazioni</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalLocations}</p>
            <p className="text-xs text-gray-600">/ {stats.maxLocations}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Utilizzo Locazioni</p>
            <p className="text-3xl font-bold text-orange-600">
              {getOccupancyPercentage(stats.totalLocations, stats.maxLocations)}%
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Capacità (kg)</p>
            <p className="text-3xl font-bold text-purple-600">
              {(stats.totalCapacity / 1000).toFixed(1)}t
            </p>
            <p className="text-xs text-gray-600">/ {(stats.maxCapacity / 1000).toFixed(1)}t</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Utilizzo Capacità</p>
            <p className="text-3xl font-bold text-red-600">
              {getOccupancyPercentage(stats.totalCapacity, stats.maxCapacity)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cerca</label>
              <input
                type="text"
                placeholder="Codice, nome, descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Zona</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutti i tipi</option>
                <option value="STORAGE">Stoccaggio</option>
                <option value="PICKING">Picking</option>
                <option value="RECEIVING">Ricevimento</option>
                <option value="SHIPPING">Spedizione</option>
                <option value="STAGING">Transito</option>
                <option value="RETURN">Resi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperatura</label>
              <select
                value={temperatureFilter}
                onChange={(e) => setTemperatureFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutte</option>
                <option value="AMBIENT">Ambiente</option>
                <option value="COLD">Freddo</option>
                <option value="FROZEN">Congelato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tutti</option>
                <option value="ACTIVE">Attive</option>
                <option value="INACTIVE">Inattive</option>
              </select>
            </div>
          </div>

          {(searchTerm || typeFilter !== 'ALL' || temperatureFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                Trovate <span className="font-semibold">{filteredZones.length}</span> zone
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('ALL');
                  setTemperatureFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filtri
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Zones Table */}
      <Card>
        <Table columns={columns} data={filteredZones} />

        {filteredZones.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna zona trovata</h3>
            <p className="mt-1 text-sm text-gray-500">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        )}
      </Card>

      {/* Create Zone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Crea Nuova Zona</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Zona *
                  </label>
                  <input
                    type="text"
                    placeholder="Es: A, B, C..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Zona *
                  </label>
                  <input
                    type="text"
                    placeholder="Es: Zona Stoccaggio A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  rows={3}
                  placeholder="Descrizione della zona..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Zona *
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="STORAGE">Stoccaggio</option>
                    <option value="PICKING">Picking</option>
                    <option value="RECEIVING">Ricevimento</option>
                    <option value="SHIPPING">Spedizione</option>
                    <option value="STAGING">Transito</option>
                    <option value="RETURN">Resi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura *
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="AMBIENT">Ambiente</option>
                    <option value="COLD">Freddo</option>
                    <option value="FROZEN">Congelato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorità *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Locazioni
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Capacità (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="50000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configurazioni</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Consenti prodotti misti</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Richiedi controllo lotto</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Richiedi numero seriale</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Zona attiva</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button onClick={handleCreateZone} className="flex-1">
                Crea Zona
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Annulla
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Zone Modal */}
      {showEditModal && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Modifica Zona {selectedZone.code}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedZone(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Zona
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedZone.code}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Zona *
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedZone.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  rows={3}
                  defaultValue={selectedZone.description}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Zona
                  </label>
                  <select
                    defaultValue={selectedZone.type}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="STORAGE">Stoccaggio</option>
                    <option value="PICKING">Picking</option>
                    <option value="RECEIVING">Ricevimento</option>
                    <option value="SHIPPING">Spedizione</option>
                    <option value="STAGING">Transito</option>
                    <option value="RETURN">Resi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura
                  </label>
                  <select
                    defaultValue={selectedZone.temperature}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="AMBIENT">Ambiente</option>
                    <option value="COLD">Freddo</option>
                    <option value="FROZEN">Congelato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorità
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={selectedZone.priority}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Locazioni
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={selectedZone.maxLocations}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Capacità (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={selectedZone.maxCapacityKg}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configurazioni</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      defaultChecked={selectedZone.allowMixedProducts}
                    />
                    <span className="text-sm">Consenti prodotti misti</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      defaultChecked={selectedZone.requiresLotControl}
                    />
                    <span className="text-sm">Richiedi controllo lotto</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      defaultChecked={selectedZone.requiresSerialNumber}
                    />
                    <span className="text-sm">Richiedi numero seriale</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      defaultChecked={selectedZone.isActive}
                    />
                    <span className="text-sm">Zona attiva</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button onClick={handleUpdateZone} className="flex-1">
                Salva Modifiche
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedZone(null);
                }}
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ZoneConfigPage;

// ============================================================================
// EJLOG WMS - UDC List Page
// Gestione completa Unità Di Carico (Load Units) - WITH REAL DATABASE DATA
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Modal from '../../components/shared/Modal';
import { CubeIcon } from '@heroicons/react/24/outline';

// ============================================================================
// REAL DATA TYPES FROM DATABASE
// ============================================================================

interface UdcRaw {
  id: number;
  numeroUdc: string;
  barcode: string;
  descrizione: string;
  numProdotti: number;
  numSupporti: number;
  idLocazione: number;
  idMagazzino: number;
  bloccataManualmente: boolean;
  bloccataPerCriterio: boolean;
  prenotataInteramentePicking: boolean;
  numeroPrenotazioniTotali: number;
  dataCreazione: string;
  dataModificaContenuto: string;
  dataUltimaMovimentazione: string;
  peso: number;
  altezza: number;
  larghezza: number;
  profondita: number;
}

const UDCListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [udcs, setUdcs] = useState<UdcRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

  // Volume modal
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Calculate volume for a single UDC (cm³ -> m³)
  const calculateVolume = (udc: UdcRaw): number => {
    if (!udc.altezza || !udc.larghezza || !udc.profondita) return 0;
    // Convert cm to m and calculate volume in m³
    return (udc.altezza * udc.larghezza * udc.profondita) / 1000000;
  };

  // Format volume for display
  const formatVolume = (volumeM3: number): string => {
    if (volumeM3 === 0) return '0 m³';
    if (volumeM3 < 0.001) {
      // Show in cm³ for very small volumes
      return `${(volumeM3 * 1000000).toFixed(0)} cm³`;
    }
    return `${volumeM3.toFixed(3)} m³`;
  };

  // Load UDCs on component mount
  useEffect(() => {
    loadUdcs();
  }, []);

  const loadUdcs = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[UDCListPage] Caricamento UDC reali da /api/udc...');

      const response = await axios.get<{ data: UdcRaw[]; total: number }>('/api/udc', {
        params: { limit: 100, offset: 0 }
      });

      console.log('[UDCListPage] UDC caricate:', response.data);
      setUdcs(response.data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Errore nel caricamento UDC';
      setError(errorMsg);
      console.error('[UDCListPage] Error loading UDCs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filter
  const filteredUDCs = udcs.filter(udc => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      udc.numeroUdc?.toLowerCase().includes(search) ||
      udc.barcode?.toLowerCase().includes(search) ||
      udc.descrizione?.toLowerCase().includes(search)
    );
  });

  // Statistics
  const totalVolume = udcs.reduce((sum, udc) => sum + calculateVolume(udc), 0);

  const stats = {
    total: udcs.length,
    occupied: udcs.filter(u => u.numProdotti > 0).length,
    empty: udcs.filter(u => u.numProdotti === 0).length,
    blocked: udcs.filter(u => u.bloccataManualmente || u.bloccataPerCriterio).length,
    totalVolume: totalVolume,
  };

  const getStatusBadge = (udc: UdcRaw) => {
    if (udc.bloccataManualmente || udc.bloccataPerCriterio) {
      return <Badge variant="danger">BLOCCATO</Badge>;
    }

    if (udc.numProdotti > 0) {
      return <Badge variant="success">OCCUPATO</Badge>;
    } else {
      return <Badge variant="secondary">VUOTO</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <Button onClick={loadUdcs} className="mt-4">Riprova</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione UDC</h1>
          <p className="text-gray-600 mt-1">
            Unità Di Carico - {filteredUDCs.length} risultati
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/udc/create')}>
            Crea Nuova UDC
          </Button>
          <Button onClick={() => navigate('/udc/print-labels')}>
            Stampa Etichette
          </Button>
          <Button variant="ghost" onClick={loadUdcs}>
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Totale UDC</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Occupate</p>
            <p className="text-3xl font-bold text-green-600">{stats.occupied}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Vuote</p>
            <p className="text-3xl font-bold text-gray-600">{stats.empty}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Bloccate</p>
            <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowVolumeModal(true)}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CubeIcon className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-600">Volume Totale</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatVolume(stats.totalVolume)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Click per dettagli</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca per Barcode o Locazione
            </label>
            <input
              type="text"
              placeholder="Es: UDC001234, A01-02-03"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti</option>
            </select>
          </div>
        </div>
      </Card>

      {/* UDC Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Elenco UDC</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSearchTerm('')}>
              Reset Filtri
            </Button>
            <Button size="sm" variant="ghost">
              Esporta Excel
            </Button>
          </div>
        </div>

        {filteredUDCs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nessuna UDC trovata</p>
            <p className="text-sm mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <Table
            columns={[
              {
                key: 'numeroUdc',
                label: 'Numero UDC',
                render: (row: UdcRaw) => (
                  <button
                    className="text-blue-600 hover:underline font-semibold"
                    onClick={() => navigate(`/udc/${row.id}`)}
                  >
                    {row.numeroUdc}
                  </button>
                ),
              },
              {
                key: 'barcode',
                label: 'Barcode',
                render: (row: UdcRaw) => (
                  <span className="font-mono text-sm">{row.barcode}</span>
                ),
              },
              {
                key: 'descrizione',
                label: 'Descrizione',
                render: (row: UdcRaw) => (
                  <span>{row.descrizione || '-'}</span>
                ),
              },
              {
                key: 'status',
                label: 'Stato',
                render: (row: UdcRaw) => getStatusBadge(row),
              },
              {
                key: 'numProdotti',
                label: 'Prodotti',
                render: (row: UdcRaw) => (
                  <span className="font-semibold">{row.numProdotti}</span>
                ),
              },
              {
                key: 'numSupporti',
                label: 'Cassetti',
                render: (row: UdcRaw) => (
                  <span className="font-semibold text-blue-600">{row.numSupporti}</span>
                ),
              },
              {
                key: 'peso',
                label: 'Peso (kg)',
                render: (row: UdcRaw) => (
                  <span className="text-sm">{row.peso || 0}</span>
                ),
              },
              {
                key: 'volume',
                label: 'Volume',
                render: (row: UdcRaw) => {
                  const volume = calculateVolume(row);
                  return (
                    <div className="text-sm">
                      <span className="font-semibold text-purple-600">
                        {formatVolume(volume)}
                      </span>
                      {volume > 0 && (
                        <p className="text-xs text-gray-500">
                          {row.altezza}×{row.larghezza}×{row.profondita} cm
                        </p>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'dataUltimaMovimentazione',
                label: 'Ultimo Movimento',
                render: (row: UdcRaw) => (
                  <span className="text-sm text-gray-600">
                    {row.dataUltimaMovimentazione
                      ? new Date(row.dataUltimaMovimentazione).toLocaleString('it-IT')
                      : '-'
                    }
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Azioni',
                render: (row: UdcRaw) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/udc/${row.id}`)}
                    >
                      Dettagli
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/udc/${row.id}/compartments`)}
                    >
                      Cassetti
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredUDCs}
          />
        )}
      </Card>

      {/* Bulk Actions */}
      <Card>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Azioni di Massa</h3>
          <div className="flex gap-2">
            <Button variant="secondary">
              Stampa Etichette Selezionate
            </Button>
            <Button variant="secondary">
              Esporta Selezione
            </Button>
            <Button variant="danger" disabled>
              Blocca Selezionate
            </Button>
          </div>
        </div>
      </Card>

      {/* Volume Details Modal */}
      <Modal
        isOpen={showVolumeModal}
        onClose={() => setShowVolumeModal(false)}
        title="Dettaglio Volumetrico UDC"
        size="xl"
      >
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume Totale</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatVolume(stats.totalVolume)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume Medio</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatVolume(stats.total > 0 ? stats.totalVolume / stats.total : 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume Max</p>
              <p className="text-2xl font-bold text-green-600">
                {formatVolume(Math.max(...udcs.map(u => calculateVolume(u)), 0))}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume Min</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatVolume(
                  udcs.length > 0
                    ? Math.min(...udcs.filter(u => calculateVolume(u) > 0).map(u => calculateVolume(u)))
                    : 0
                )}
              </p>
            </div>
          </div>

          {/* Volume Table */}
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UDC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensioni (cm)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume (m³)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cassetti
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {udcs
                  .sort((a, b) => calculateVolume(b) - calculateVolume(a))
                  .map((udc) => {
                    const volume = calculateVolume(udc);
                    return (
                      <tr key={udc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            className="text-blue-600 hover:underline font-semibold"
                            onClick={() => {
                              setShowVolumeModal(false);
                              navigate(`/udc/${udc.id}`);
                            }}
                          >
                            {udc.numeroUdc}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {udc.altezza} × {udc.larghezza} × {udc.profondita}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-purple-600">
                            {formatVolume(volume)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-blue-600">
                            {udc.numSupporti}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(udc)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Volume Chart Legend */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Legenda</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CubeIcon className="w-4 h-4 text-purple-600" />
                <span>Volume calcolato: Altezza × Larghezza × Profondità</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">m³</span>
                <span>Metri cubi (1 m³ = 1,000,000 cm³)</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UDCListPage;

// ============================================================================
// EJLOG WMS - UDC Detail Page
// Dettaglio completo Unità Di Carico con contenuti e storico - Refactored with udcService
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import * as UdcService from '../../services/udcService';
import type { Udc, UdcContent, UdcMovement, UdcStatus, MovementType } from '../../services/udcService';

const UDCDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('contents');
  const [udc, setUdc] = useState<Udc | null>(null);
  const [contents, setContents] = useState<UdcContent[]>([]);
  const [movements, setMovements] = useState<UdcMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load UDC data on mount
  useEffect(() => {
    if (id) {
      loadUdcData(parseInt(id, 10));
    }
  }, [id]);

  const loadUdcData = async (udcId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Load UDC details
      const udcData = await UdcService.getUdcById(udcId);

      if (!udcData) {
        setError('UDC non trovata');
        setLoading(false);
        return;
      }

      setUdc(udcData);

      // Load contents and movements in parallel
      const [contentsData, movementsData] = await Promise.all([
        UdcService.getUdcContents(udcId),
        UdcService.getUdcMovements(udcId),
      ]);

      setContents(contentsData);
      setMovements(movementsData);
    } catch (err) {
      console.error('Error loading UDC data:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati UDC');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUdc = async () => {
    if (!udc) return;

    const reason = prompt('Inserisci motivazione blocco:');
    if (!reason) return;

    try {
      const response = await UdcService.blockUdc(udc.id, reason);
      if (response.result === 'OK') {
        // Reload UDC data
        loadUdcData(udc.id);
      } else {
        alert(response.message || 'Errore durante il blocco');
      }
    } catch (err) {
      alert('Errore durante il blocco UDC');
      console.error('Error blocking UDC:', err);
    }
  };

  const handleUnblockUdc = async () => {
    if (!udc) return;

    if (!confirm('Confermi lo sblocco di questa UDC?')) return;

    try {
      const response = await UdcService.unblockUdc(udc.id);
      if (response.result === 'OK') {
        // Reload UDC data
        loadUdcData(udc.id);
      } else {
        alert(response.message || 'Errore durante lo sblocco');
      }
    } catch (err) {
      alert('Errore durante lo sblocco UDC');
      console.error('Error unblocking UDC:', err);
    }
  };

  const handleDeleteUdc = async () => {
    if (!udc) return;

    if (!confirm('ATTENZIONE: Confermi l\'eliminazione di questa UDC? Questa operazione non può essere annullata.')) return;

    try {
      const response = await UdcService.deleteUdc(udc.id);
      if (response.result === 'OK') {
        alert('UDC eliminata con successo');
        navigate('/udc');
      } else {
        alert(response.message || 'Errore durante l\'eliminazione');
      }
    } catch (err) {
      alert('Errore durante l\'eliminazione UDC');
      console.error('Error deleting UDC:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !udc) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error || 'UDC non trovata'}</p>
            <Button onClick={() => navigate('/udc')} className="mt-4">
              Torna alla Lista UDC
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (udc.isBlocked) return <Badge variant="danger">BLOCCATO</Badge>;

    const statusLabel = UdcService.getUdcStatusLabel(udc.status);

    switch (udc.status) {
      case UdcService.UdcStatus.OCCUPIED:
        return <Badge variant="success">{statusLabel.toUpperCase()}</Badge>;
      case UdcService.UdcStatus.EMPTY:
        return <Badge variant="secondary">{statusLabel.toUpperCase()}</Badge>;
      case UdcService.UdcStatus.IN_TRANSIT:
        return <Badge variant="warning">{statusLabel.toUpperCase()}</Badge>;
      case UdcService.UdcStatus.BLOCKED:
        return <Badge variant="danger">{statusLabel.toUpperCase()}</Badge>;
      default:
        return <Badge variant="info">{statusLabel.toUpperCase()}</Badge>;
    }
  };

  const getTotalQuantity = () => {
    return contents.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getMovementTypeBadge = (type: MovementType) => {
    const typeLabel = UdcService.getMovementTypeLabel(type);

    switch (type) {
      case UdcService.MovementType.TRANSFER:
        return <Badge variant="primary">{typeLabel.toUpperCase()}</Badge>;
      case UdcService.MovementType.STOCKING:
        return <Badge variant="success">{typeLabel.toUpperCase()}</Badge>;
      case UdcService.MovementType.PICKING:
        return <Badge variant="warning">{typeLabel.toUpperCase()}</Badge>;
      case UdcService.MovementType.CREATION:
        return <Badge variant="info">{typeLabel.toUpperCase()}</Badge>;
      case UdcService.MovementType.REFILLING:
        return <Badge variant="primary">{typeLabel.toUpperCase()}</Badge>;
      case UdcService.MovementType.ADJUSTMENT:
        return <Badge variant="secondary">{typeLabel.toUpperCase()}</Badge>;
      default:
        return <Badge variant="secondary">{typeLabel.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dettaglio UDC</h1>
          <p className="text-gray-600 mt-1">{udc.barcode}</p>
        </div>
        <div className="flex gap-2 items-center">
          {getStatusBadge()}
          <Button variant="ghost" onClick={() => navigate('/udc')}>
            Indietro
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <label className="text-sm text-gray-600">Tipo UDC</label>
            <p className="text-xl font-bold text-blue-600">
              {UdcService.getUdcTypeLabel(udc.type)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Locazione Attuale</label>
            <p className="text-xl font-semibold">
              {udc.locationCode ? (
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => navigate(`/locations/${udc.locationId}`)}
                >
                  {udc.locationCode}
                </button>
              ) : (
                <span className="text-gray-400">Non assegnata</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Articoli Contenuti</label>
            <p className="text-xl font-semibold">{contents.length}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Quantità Totale</label>
            <p className="text-xl font-semibold">{getTotalQuantity().toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* UDC Information Card */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Informazioni UDC</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Barcode</label>
            <p className="font-semibold text-lg">{udc.barcode}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <p className="font-semibold">{UdcService.getUdcTypeLabel(udc.type)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Descrizione</label>
            <p>{udc.description || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Zona Magazzino</label>
            <p className="font-semibold">{udc.warehouseZone || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Data Creazione</label>
            <p>{new Date(udc.createdDate).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Ultimo Movimento</label>
            <p>{udc.lastMovementDate ? new Date(udc.lastMovementDate).toLocaleString() : '-'}</p>
          </div>
        </div>
      </Card>

      {/* Capacity Card */}
      {(udc.weight || udc.volume || udc.maxWeight || udc.maxVolume) && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Capacità e Dimensioni</h2>
          <div className="grid grid-cols-2 gap-6">
            {udc.weight !== undefined && udc.maxWeight !== undefined && udc.maxWeight > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-600">Peso Attuale</label>
                  <span className="font-semibold">{udc.weight} / {udc.maxWeight} kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      (udc.weight / udc.maxWeight) * 100 > 80
                        ? 'bg-red-500'
                        : (udc.weight / udc.maxWeight) * 100 > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((udc.weight / udc.maxWeight) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((udc.weight / udc.maxWeight) * 100).toFixed(1)}% utilizzato
                </p>
              </div>
            )}
            {udc.volume !== undefined && udc.maxVolume !== undefined && udc.maxVolume > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-600">Volume Attuale</label>
                  <span className="font-semibold">{udc.volume} / {udc.maxVolume} m³</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      (udc.volume / udc.maxVolume) * 100 > 80
                        ? 'bg-red-500'
                        : (udc.volume / udc.maxVolume) * 100 > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((udc.volume / udc.maxVolume) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((udc.volume / udc.maxVolume) * 100).toFixed(1)}% utilizzato
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('contents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contenuti ({contents.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Storico Movimenti ({movements.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Contents Tab */}
          {activeTab === 'contents' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Contenuti UDC</h3>
                <Button size="sm" variant="ghost">
                  Stampa Lista Contenuti
                </Button>
              </div>

              {contents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  UDC Vuota - Nessun articolo presente
                </div>
              ) : (
                <Table
                  columns={[
                    {
                      key: 'productCode',
                      label: 'Codice Articolo',
                      render: (row) => (
                        <button
                          className="text-blue-600 hover:underline font-semibold"
                          onClick={() => navigate(`/items/${row.productCode}`)}
                        >
                          {row.productCode}
                        </button>
                      ),
                    },
                    {
                      key: 'productDescription',
                      label: 'Descrizione',
                      render: (row) => row.productDescription || '-',
                    },
                    {
                      key: 'lot',
                      label: 'Lotto',
                      render: (row) => row.lot || '-',
                    },
                    {
                      key: 'serialNumber',
                      label: 'Matricola',
                      render: (row) => row.serialNumber || '-',
                    },
                    {
                      key: 'quantity',
                      label: 'Quantità',
                      render: (row) => (
                        <span className="font-semibold">
                          {row.quantity.toFixed(2)} {row.um || ''}
                        </span>
                      ),
                    },
                    {
                      key: 'expirationDate',
                      label: 'Scadenza',
                      render: (row) =>
                        row.expirationDate ? (
                          <span
                            className={
                              new Date(row.expirationDate) < new Date()
                                ? 'text-red-600 font-semibold'
                                : ''
                            }
                          >
                            {new Date(row.expirationDate).toLocaleDateString()}
                          </span>
                        ) : (
                          '-'
                        ),
                    },
                    {
                      key: 'stockedDate',
                      label: 'Data Stoccaggio',
                      render: (row) => (
                        <span className="text-sm">
                          {row.stockedDate ? new Date(row.stockedDate).toLocaleDateString() : '-'}
                        </span>
                      ),
                    },
                    {
                      key: 'actions',
                      label: 'Azioni',
                      render: (row) => (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/items/${row.productCode}`)}
                        >
                          Dettagli
                        </Button>
                      ),
                    },
                  ]}
                  data={contents}
                />
              )}
            </div>
          )}

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Storico Movimenti UDC</h3>
                <Button size="sm" variant="ghost">
                  Esporta Excel
                </Button>
              </div>
              <Table
                columns={[
                  {
                    key: 'movementDate',
                    label: 'Data/Ora',
                    render: (row) => row.movementDate ? new Date(row.movementDate).toLocaleString() : '-',
                  },
                  {
                    key: 'movementType',
                    label: 'Tipo Movimento',
                    render: (row) => getMovementTypeBadge(row.movementType),
                  },
                  {
                    key: 'fromLocationCode',
                    label: 'Da Locazione',
                    render: (row) => row.fromLocationCode || '-',
                  },
                  {
                    key: 'toLocationCode',
                    label: 'A Locazione',
                    render: (row) => row.toLocationCode || '-',
                  },
                  {
                    key: 'operatorId',
                    label: 'Operatore',
                    render: (row) => row.operatorId || '-',
                  },
                  {
                    key: 'listNumber',
                    label: 'Lista',
                    render: (row) => row.listNumber ? (
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => navigate(`/lists/${row.listNumber}`)}
                      >
                        {row.listNumber}
                      </button>
                    ) : '-',
                  },
                  {
                    key: 'notes',
                    label: 'Note',
                    render: (row) => row.notes || '-',
                  },
                ]}
                data={movements}
              />
            </div>
          )}
        </div>
      </div>

      {/* Block Warning */}
      {udc.isBlocked && (
        <Card>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              UDC Bloccata
            </h3>
            <p className="text-red-700">
              {udc.blockReason || 'Nessuna motivazione specificata'}
            </p>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <div className="flex gap-3">
          {!udc.isBlocked && udc.status !== UdcService.UdcStatus.EMPTY && (
            <Button onClick={() => navigate(`/transfers/new?udcId=${id}`)}>
              Trasferisci UDC
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => navigate(`/udc/${id}/print-label`)}
          >
            Stampa Etichetta
          </Button>
          <Button variant="secondary">Modifica Contenuti</Button>
          {!udc.isBlocked && (
            <Button variant="danger" onClick={handleBlockUdc}>
              Blocca UDC
            </Button>
          )}
          {udc.isBlocked && (
            <Button variant="success" onClick={handleUnblockUdc}>
              Sblocca UDC
            </Button>
          )}
          {contents.length === 0 && (
            <Button variant="danger" onClick={handleDeleteUdc}>
              Elimina UDC Vuota
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UDCDetailPage;

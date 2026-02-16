// ============================================================================
// EJLOG WMS - Machine Detail Page
// Dettaglio macchina con calcolo volumetrico
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetMachineByIdQuery, useGetMachineLoadingUnitsQuery } from '../../services/api/machinesApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Modal from '../../components/shared/Modal';
import { MachineStatus } from '../../types/models';
import { CubeIcon } from '@heroicons/react/24/outline';

const MachineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: machine, isLoading } = useGetMachineByIdQuery(Number(id));
  const { data: udcs } = useGetMachineLoadingUnitsQuery(Number(id));

  // Volume modal state
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Calculate volume for a single UDC (cm³ -> m³)
  const calculateVolume = (udc: any): number => {
    if (!udc.height || !udc.width || !udc.depth) return 0;
    // Convert cm to m and calculate volume in m³
    return (udc.height * udc.width * udc.depth) / 1000000;
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

  // Calculate total volume
  const totalVolume = udcs?.reduce((sum, udc) => sum + calculateVolume(udc), 0) || 0;

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!machine) return <Card><p>Macchina non trovata</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{machine.code}</h1>
          <p className="text-gray-600">{machine.description || 'Nessuna descrizione'}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/machines')}>
          Indietro
        </Button>
      </div>

      <Card title="Informazioni">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <p className="font-semibold">{machine.machineType || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Stato</label>
            <p>
              {machine.status !== undefined ? (
                <Badge>{MachineStatus[machine.status]}</Badge>
              ) : (
                '-'
              )}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Disponibile</label>
            <p>
              <Badge variant={machine.isAvailable ? 'success' : 'danger'}>
                {machine.isAvailable ? 'Sì' : 'No'}
              </Badge>
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">UDC Presenti</label>
            <p className="font-semibold text-blue-600">{udcs?.length || 0}</p>
          </div>
        </div>
      </Card>

      {/* Volume Card */}
      {udcs && udcs.length > 0 && (
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50"
          onClick={() => setShowVolumeModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <CubeIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Volume Totale Occupato</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatVolume(totalVolume)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Calcolato su {udcs.length} UDC presenti in macchina
                </p>
              </div>
            </div>
            <Button variant="secondary">
              Dettagli Volume
            </Button>
          </div>
        </Card>
      )}

      {udcs && udcs.length > 0 && (
        <Card title="UDC in Macchina">
          <div className="space-y-2">
            {udcs.map((udc) => {
              const volume = calculateVolume(udc);
              return (
                <div
                  key={udc.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/udc/${udc.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-semibold">UDC #{udc.id}</p>
                    <p className="text-sm text-gray-600">{udc.barcode || 'Nessun barcode'}</p>
                    {volume > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        Volume: {formatVolume(volume)} ({udc.width}×{udc.depth}×{udc.height} cm)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{udc.compartmentsCount} cassetti</Badge>
                    {volume > 0 && (
                      <Badge variant="secondary">
                        <CubeIcon className="w-4 h-4 inline mr-1" />
                        {formatVolume(volume)}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Volume Details Modal */}
      <Modal
        isOpen={showVolumeModal}
        onClose={() => setShowVolumeModal(false)}
        title={`Dettaglio Volumetrico - ${machine.code}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume Totale</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatVolume(totalVolume)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Volume Medio UDC</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatVolume(udcs && udcs.length > 0 ? totalVolume / udcs.length : 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Totale UDC</p>
              <p className="text-2xl font-bold text-green-600">
                {udcs?.length || 0}
              </p>
            </div>
          </div>

          {/* UDC Volume Table */}
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UDC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {udcs
                  ?.sort((a, b) => calculateVolume(b) - calculateVolume(a))
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
                            UDC #{udc.id}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {udc.barcode || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {udc.width} × {udc.depth} × {udc.height}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-purple-600">
                            {formatVolume(volume)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="info">{udc.compartmentsCount}</Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Volume Chart Legend */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Informazioni</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CubeIcon className="w-4 h-4 text-purple-600" />
                <span>Volume calcolato: Larghezza × Profondità × Altezza</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">m³</span>
                <span>Metri cubi (1 m³ = 1,000,000 cm³)</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="text-purple-600 font-semibold">Macchina:</span>
                <span>{machine.code} - {machine.description || 'N/D'}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MachineDetailPage;

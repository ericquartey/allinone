// ============================================================================
// EJLOG WMS - PLC Device Detail Page
// Detailed view of a single PLC device with tabs
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import DeviceInfoCard from '../../components/plc/DeviceInfoCard';
import ConnectionStatusPanel from '../../components/plc/ConnectionStatusPanel';
import DatabufferViewer from '../../components/plc/DatabufferViewer';
import ManualCommandPanel from '../../components/plc/ManualCommandPanel';
import ShuttleControlPanel from '../../components/plc/ShuttleControlPanel';
import TransferControlPanel from '../../components/plc/TransferControlPanel';
import {
  useGetPLCDeviceByIdQuery,
  useConnectPLCDeviceMutation,
  useDisconnectPLCDeviceMutation,
  useResetPLCDeviceMutation,
  useGetPLCCommandsQuery,
  useGetDeviceStatisticsQuery
} from '../../services/api/plcApi';

type TabType = 'info' | 'connection' | 'databuffer' | 'controls' | 'commands' | 'statistics';

const PLCDeviceDetailPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // API queries
  const {
    data: device,
    isLoading,
    error,
    refetch
  } = useGetPLCDeviceByIdQuery(deviceId!, { skip: !deviceId });

  const {
    data: commands,
    isLoading: isLoadingCommands
  } = useGetPLCCommandsQuery(
    { deviceId: deviceId!, limit: 50 },
    { skip: !deviceId || activeTab !== 'commands' }
  );

  const {
    data: statistics,
    isLoading: isLoadingStatistics
  } = useGetDeviceStatisticsQuery(
    { deviceId: deviceId!, period: '24h' },
    { skip: !deviceId || activeTab !== 'statistics', pollingInterval: 5000 }
  );

  // Mutations
  const [connectDevice] = useConnectPLCDeviceMutation();
  const [disconnectDevice] = useDisconnectPLCDeviceMutation();
  const [resetDevice] = useResetPLCDeviceMutation();

  // Handlers
  const handleConnect = async (deviceId: string) => {
    await connectDevice(deviceId).unwrap();
    refetch();
  };

  const handleDisconnect = async (deviceId: string) => {
    await disconnectDevice(deviceId).unwrap();
    refetch();
  };

  const handleReset = async (deviceId: string) => {
    await resetDevice(deviceId).unwrap();
    refetch();
  };

  const handleBack = () => {
    navigate('/plc/devices');
  };

  // Tab configuration
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'info', label: 'Informazioni', icon: 'ℹ️' },
    { id: 'connection', label: 'Connessione', icon: '🔌' },
    { id: 'databuffer', label: 'Databuffer', icon: '💾' },
    { id: 'controls', label: 'Controlli', icon: '🎮' },
    { id: 'commands', label: 'Comandi', icon: '⚡' },
    { id: 'statistics', label: 'Statistiche', icon: '📊' }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !device) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dettaglio Dispositivo PLC</h1>
          <Button variant="ghost" onClick={handleBack}>
            ← Torna alla Lista
          </Button>
        </div>
        <Alert variant="danger">
          <p className="font-semibold">Errore nel caricamento del dispositivo</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : 'Dispositivo non trovato'}
          </p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to devices list">
              ← Indietro
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{device.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{device.code}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => refetch()}
            aria-label="Refresh device data"
          >
            <span className="text-lg" aria-hidden="true">↻</span>
            <span className="ml-1">Aggiorna</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="mr-2" aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <DeviceInfoCard device={device} />
          </div>
        )}

        {activeTab === 'connection' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConnectionStatusPanel
              device={device}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onReset={handleReset}
            />
            <div className="space-y-6">
              {/* Connection History Placeholder */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-500">Storico Connessioni</p>
                <p className="text-sm text-gray-400 mt-2">Disponibile in una prossima versione</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'databuffer' && (
          <DatabufferViewer deviceId={device.id} deviceName={device.name} />
        )}

        {activeTab === 'controls' && (
          <div className="space-y-6">
            {/* Manual Command Panel - Always available */}
            <ManualCommandPanel device={device} onCommandSent={refetch} />

            {/* Device-specific control panels */}
            {(device.type === 'SHUTTLE' || device.type === 'AGV') && (
              <ShuttleControlPanel device={device} onCommandSent={refetch} />
            )}

            {(device.type === 'TRANSFER' || device.type === 'CONVEYOR') && (
              <TransferControlPanel device={device} onCommandSent={refetch} />
            )}

            {/* Info message if no specific controls */}
            {device.type !== 'SHUTTLE' &&
             device.type !== 'AGV' &&
             device.type !== 'TRANSFER' &&
             device.type !== 'CONVEYOR' && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600">
                  Controlli specifici non disponibili per il tipo di dispositivo: <strong>{device.type}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Utilizza il pannello Comandi Manuali per inviare comandi personalizzati
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Storico Comandi</h2>
              <span className="text-sm text-gray-500">
                Ultimi 50 comandi
              </span>
            </div>

            {isLoadingCommands ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : commands && commands.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comando
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utente
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commands.map((command) => (
                      <tr key={command.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(command.createdAt).toLocaleString('it-IT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {command.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {command.command}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            command.status === 'EXECUTED' ? 'bg-green-100 text-green-800' :
                            command.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                            command.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {command.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {command.userName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <p className="text-gray-500">Nessun comando trovato</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Statistiche Dispositivo (24h)</h2>

            {isLoadingStatistics ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : statistics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Comandi Totali</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statistics.totalCommands.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {statistics.successRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Tempo Risposta Medio</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {statistics.avgResponseTime.toFixed(0)}ms
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {statistics.uptime.toFixed(1)}%
                  </p>
                </div>

                <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500 mb-4">Attività Ultima Ora</p>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const height = Math.random() * 100;
                      return (
                        <div key={i} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${height}%` }} />
                      );
                    })}
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    {statistics.lastHourCommands} comandi nell'ultima ora
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <p className="text-gray-500">Nessuna statistica disponibile</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PLCDeviceDetailPage;

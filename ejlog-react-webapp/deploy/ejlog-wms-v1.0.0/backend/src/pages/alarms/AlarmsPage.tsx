// ============================================================================
// EJLOG WMS - Alarms Page
// Gestione allarmi di sistema
// ============================================================================

import { Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function AlarmsPage() {
  const [alarms] = useState([
    { id: 1, code: 'ALM001', description: 'Magazzino Zona A - Temperatura elevata', severity: 'Warning', occurredAt: '2025-11-28 08:15:32', acknowledged: false },
    { id: 2, code: 'ALM002', description: 'Conveyor 3 - Rallentamento operativo', severity: 'Info', occurredAt: '2025-11-28 07:45:12', acknowledged: false },
    { id: 3, code: 'ALM003', description: 'Sistema PLC - Connessione persa', severity: 'Critical', occurredAt: '2025-11-28 06:30:55', acknowledged: true },
    { id: 4, code: 'ALM004', description: 'Stamante Etichette - Carta in esaurimento', severity: 'Warning', occurredAt: '2025-11-27 15:22:18', acknowledged: true },
    { id: 5, code: 'ALM005', description: 'UDC non trovata in posizione attesa', severity: 'Error', occurredAt: '2025-11-27 14:10:05', acknowledged: true },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'Error':
        return 'bg-orange-100 text-orange-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const activeAlarms = alarms.filter(a => !a.acknowledged);
  const acknowledgedAlarms = alarms.filter(a => a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-ferretto-red" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Allarmi</h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitoraggio e gestione allarmi di sistema
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Allarmi Attivi</p>
              <p className="text-3xl font-bold text-ferretto-red mt-2">{activeAlarms.length}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-ferretto-red opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Allarmi Riconosciuti</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{acknowledgedAlarms.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Allarmi</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{alarms.length}</p>
            </div>
            <Bell className="w-12 h-12 text-gray-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Active Alarms */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Allarmi Attivi</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Ora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrizione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severità
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeAlarms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                    <p>Nessun allarme attivo</p>
                  </div>
                </td>
              </tr>
            ) : (
              activeAlarms.map((alarm) => (
                <tr key={alarm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{alarm.occurredAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{alarm.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{alarm.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alarm.severity)}`}>
                      {alarm.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-ferretto-red hover:text-red-700">Riconosci</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Acknowledged Alarms History */}
      {acknowledgedAlarms.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Storico Allarmi Riconosciuti</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Ora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Codice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrizione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severità
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {acknowledgedAlarms.map((alarm) => (
                <tr key={alarm.id} className="hover:bg-gray-50 opacity-75">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{alarm.occurredAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-600">{alarm.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{alarm.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alarm.severity)}`}>
                      {alarm.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

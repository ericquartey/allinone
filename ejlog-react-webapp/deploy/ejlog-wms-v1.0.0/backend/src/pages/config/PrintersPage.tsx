// ============================================================================
// EJLOG WMS - Printers Configuration Page
// Configurazione stampanti di sistema
// ============================================================================

import { Monitor, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function PrintersPage() {
  const [printers] = useState([
    { id: 1, name: 'Stampante Etichette 1', type: 'Zebra ZT230', location: 'Zona A', status: 'Online' },
    { id: 2, name: 'Stampante Etichette 2', type: 'Zebra ZT230', location: 'Zona B', status: 'Online' },
    { id: 3, name: 'Stampante Picking', type: 'Brother QL-820NWB', location: 'Ufficio', status: 'Offline' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-ferretto-red" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurazione Stampanti</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestione stampanti di sistema
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" />
              <span>Aggiorna</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-ferretto-red text-white rounded-lg hover:bg-red-700">
              <Plus className="w-4 h-4" />
              <span>Nuova Stampante</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo/Modello
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicazione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {printers.map((printer) => (
              <tr key={printer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{printer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{printer.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{printer.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      printer.status === 'Online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {printer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-ferretto-red hover:text-red-700 mr-3">Modifica</button>
                  <button className="text-gray-600 hover:text-gray-900">Test</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

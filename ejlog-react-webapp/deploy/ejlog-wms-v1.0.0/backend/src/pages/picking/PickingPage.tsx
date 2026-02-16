// ============================================================================
// EJLOG WMS - Picking Operations Page
// Gestione operazioni di picking (preliev per liste in esecuzione)
// ============================================================================

import { ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PickingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Package className="w-8 h-8 text-ferretto-red" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Esecuzione Picking</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestione operazioni di prelievo merce
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/lists/execution"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-ferretto-red hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-ferretto-red">
                Liste in Esecuzione
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Visualizza liste picking attive
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-ferretto-red" />
          </div>
        </Link>

        <Link
          to="/lists"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-ferretto-red hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-ferretto-red">
                Tutte le Liste
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Gestione completa liste picking
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-ferretto-red" />
          </div>
        </Link>

        <Link
          to="/rf-operations"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-ferretto-red hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-ferretto-red">
                Operazioni RF
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Modalità radio frequency
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-ferretto-red" />
          </div>
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Per eseguire il picking di una lista specifica, naviga a{' '}
          <Link to="/lists/execution" className="underline font-semibold">
            Liste in Esecuzione
          </Link>{' '}
          e seleziona la lista desiderata.
        </p>
      </div>
    </div>
  );
}

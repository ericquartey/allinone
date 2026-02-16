// src/components/lists/ListDetailPanel.jsx

import React, { useState } from 'react';
import {
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { getListTypeLabel, getListStatusLabel } from '../../types/lists';

/**
 * Panel displaying list header details and rows table
 * Shows all fields including auxiliary fields in collapsible sections
 */
export const ListDetailPanel: React.FC<{  list  }> = ({  list  }) => {
  const [showAuxFields, setShowAuxFields] = useState(false);

  if (!list || !list.listHeader) {
    return null;
  }

  const header = list.listHeader;
  const rows = list.listRows || [];

  const hasAuxFields = Boolean(
    header.auxHostText01 || header.auxHostText02 || header.auxHostText03 || header.auxHostText04 || header.auxHostText05 ||
    header.auxHostInt01 !== undefined || header.auxHostInt02 !== undefined || header.auxHostInt03 !== undefined ||
    header.auxHostBit01 || header.auxHostBit02 || header.auxHostBit03 ||
    header.auxHostDate01 || header.auxHostDate02 || header.auxHostDate03 ||
    header.auxHostNum01 !== undefined || header.auxHostNum02 !== undefined || header.auxHostNum03 !== undefined
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* List Header Details */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{header.listNumber}</h2>
            {header.listDescription && (
              <p className="text-sm text-gray-600 mt-1">{header.listDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              header.listType === 0 ? 'bg-green-100 text-green-800' :
              header.listType === 1 ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {getListTypeLabel(header.listType)}
            </span>
            {header.listStatus !== undefined && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                header.listStatus === 1 ? 'bg-yellow-100 text-yellow-800' :
                header.listStatus === 2 ? 'bg-blue-100 text-blue-800' :
                header.listStatus === 3 ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getListStatusLabel(header.listStatus)}
              </span>
            )}
          </div>
        </div>

        {/* Header Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {header.cause && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Causale</label>
              <div className="mt-1 text-sm font-medium text-gray-900">{header.cause}</div>
            </div>
          )}

          {header.orderNumber && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Commessa</label>
              <div className="mt-1 text-sm font-medium text-gray-900">{header.orderNumber}</div>
            </div>
          )}

          {header.priority !== undefined && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Priorità</label>
              <div className="mt-1 text-sm font-medium text-gray-900">{header.priority}</div>
            </div>
          )}

          {header.exitPoint !== undefined && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Punto di Uscita</label>
              <div className="mt-1 text-sm font-medium text-gray-900">{header.exitPoint}</div>
            </div>
          )}

          {header.selectedWarehouses && header.selectedWarehouses.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Magazzini</label>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {header.selectedWarehouses.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Auxiliary Fields (Collapsible) */}
        {hasAuxFields && (
          <div className="mt-4">
            <button
              onClick={() => setShowAuxFields(!showAuxFields)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {showAuxFields ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              Campi Ausiliari
            </button>

            {showAuxFields && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  {/* Text fields */}
                  {[1, 2, 3, 4, 5].map(i => {
                    const field = `auxHostText${String(i).padStart(2, '0')}`;
                    return header[field] ? (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Testo {String(i).padStart(2, '0')}
                        </label>
                        <div className="mt-1 text-sm text-gray-900">{header[field]}</div>
                      </div>
                    ) : null;
                  })}

                  {/* Integer fields */}
                  {[1, 2, 3].map(i => {
                    const field = `auxHostInt${String(i).padStart(2, '0')}`;
                    return header[field] !== undefined && header[field] !== null ? (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Intero {String(i).padStart(2, '0')}
                        </label>
                        <div className="mt-1 text-sm text-gray-900">{header[field]}</div>
                      </div>
                    ) : null;
                  })}

                  {/* Boolean fields */}
                  {[1, 2, 3].map(i => {
                    const field = `auxHostBit${String(i).padStart(2, '0')}`;
                    return header[field] ? (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Booleano {String(i).padStart(2, '0')}
                        </label>
                        <div className="mt-1 text-sm text-gray-900">
                          {header[field] ? 'Sì' : 'No'}
                        </div>
                      </div>
                    ) : null;
                  })}

                  {/* Date fields */}
                  {[1, 2, 3].map(i => {
                    const field = `auxHostDate${String(i).padStart(2, '0')}`;
                    return header[field] ? (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Data {String(i).padStart(2, '0')}
                        </label>
                        <div className="mt-1 text-sm text-gray-900">
                          {new Date(header[field]).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    ) : null;
                  })}

                  {/* Numeric fields */}
                  {[1, 2, 3].map(i => {
                    const field = `auxHostNum${String(i).padStart(2, '0')}`;
                    return header[field] !== undefined && header[field] !== null ? (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-500 uppercase">
                          Numerico {String(i).padStart(2, '0')}
                        </label>
                        <div className="mt-1 text-sm text-gray-900">{header[field]}</div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* List Rows Table */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">
            Righe Lista ({rows.length})
          </h3>
        </div>

        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nessuna riga presente</p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N. Riga
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articolo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrizione
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qta Richiesta
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qta Movimentata
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lotto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matricola
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scadenza
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.rowNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                      {row.item}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.lineDescription || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {row.requestedQty}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {row.processedQty !== undefined ? row.processedQty : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {row.lot || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                      {row.serialNumber || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('it-IT') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Info */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Totale righe: {rows.length}</span>
          <span className="text-gray-600">
            Quantità totale richiesta:{' '}
            <strong className="text-gray-900">
              {rows.reduce((sum, row) => sum + (row.requestedQty || 0), 0).toFixed(2)}
            </strong>
          </span>
          {rows.some(row => row.processedQty !== undefined) && (
            <span className="text-gray-600">
              Quantità totale movimentata:{' '}
              <strong className="text-gray-900">
                {rows.reduce((sum, row) => sum + (row.processedQty || 0), 0).toFixed(2)}
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

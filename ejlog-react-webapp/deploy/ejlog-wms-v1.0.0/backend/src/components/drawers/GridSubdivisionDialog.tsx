// src/components/drawers/GridSubdivisionDialog.tsx

import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

/**
 * Grid Subdivision Dialog
 * Allows automatic subdivision of a loading unit/compartment in a NxM grid
 * Replicates Swing UI: RipartisciScompartoMultiDimensionePanel
 */
export function GridSubdivisionDialog({
  loadingUnit,
  onConfirm,
  onCancel
}: {
  loadingUnit: any;
  onConfirm: (rows: number, columns: number) => void;
  onCancel: () => void;
}): JSX.Element {
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(2);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Validation
    if (!rows || rows < 1 || rows > 20) {
      setError('Numero righe deve essere tra 1 e 20');
      return;
    }
    if (!columns || columns < 1 || columns > 20) {
      setError('Numero colonne deve essere tra 1 e 20');
      return;
    }

    // Check minimum compartment size
    const compartmentWidth = loadingUnit.width / columns;
    const compartmentDepth = loadingUnit.depth / rows;

    // Minimum 50mm per compartment (as in Swing code)
    if (compartmentWidth < 50) {
      setError(`Larghezza scomparto troppo piccola: ${Math.round(compartmentWidth)}mm (min 50mm)`);
      return;
    }
    if (compartmentDepth < 50) {
      setError(`Profondità scomparto troppo piccola: ${Math.round(compartmentDepth)}mm (min 50mm)`);
      return;
    }

    onConfirm(rows, columns);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onCancel}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Suddivisione Automatica Scomparti
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Loading Unit Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Cassetto:</span> {loadingUnit.code}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Dimensioni:</span>{' '}
              {loadingUnit.width} × {loadingUnit.depth} × {loadingUnit.height} mm
            </p>
          </div>

          {/* Grid Inputs */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Rows */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Righe
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => {
                  setRows(parseInt(e.target.value) || 1);
                  setError('');
                }}
                className="w-full px-4 py-3 text-center text-4xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Orizzontali
              </p>
            </div>

            {/* Columns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colonne
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={columns}
                onChange={(e) => {
                  setColumns(parseInt(e.target.value) || 1);
                  setError('');
                }}
                className="w-full px-4 py-3 text-center text-4xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Verticali
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Anteprima Suddivisione
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p><span className="font-medium">Totale scomparti:</span> {rows * columns}</p>
                <p><span className="font-medium">Larghezza scomparto:</span> ~{Math.round(loadingUnit.width / columns)} mm</p>
              </div>
              <div>
                <p><span className="font-medium">Matrice:</span> {rows} × {columns}</p>
                <p><span className="font-medium">Profondità scomparto:</span> ~{Math.round(loadingUnit.depth / rows)} mm</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <span className="flex items-center justify-center gap-2">
                <XMarkIcon className="w-5 h-5" />
                Annulla
              </span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span className="flex items-center justify-center gap-2">
                <CheckIcon className="w-5 h-5" />
                Conferma
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

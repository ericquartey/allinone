// src/components/lists/EditListRowsModal.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useListRows } from '../../hooks/useLists';

/**
 * Modal for editing list rows (AGGIORNA_RIGA command)
 * Allows updating quantities and other row fields
 */
export const EditListRowsModal: React.FC<{  isOpen, list, onClose, onSuccess  }> = ({  isOpen, list, onClose, onSuccess  }) => {
  const listNumber = list?.listHeader?.listNumber;
  const { updateRows, loading } = useListRows(listNumber);

  const [formRows, setFormRows] = useState([]);
  const [errors, setErrors] = useState({});

  // Initialize form rows when list changes
  useEffect(() => {
    if (list && list.listRows) {
      setFormRows(
        list.listRows.map(row => ({
          rowNumber: row.rowNumber,
          item: row.item,
          lineDescription: row.lineDescription || '',
          requestedQty: row.requestedQty,
          lot: row.lot || '',
          serialNumber: row.serialNumber || '',
          expiryDate: row.expiryDate || '',
          rowSequence: row.rowSequence,
          operatorInfo: row.operatorInfo || '',
          labelInfo: row.labelInfo || ''
        }))
      );
    }
  }, [list]);

  const handleRowChange = useCallback((index, field, value) => {
    setFormRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });

    // Clear error for this field
    const errorKey = `row_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};

    formRows.forEach((row, index) => {
      if (!row.rowNumber.trim()) {
        newErrors[`row_${index}_rowNumber`] = 'Numero riga obbligatorio';
      }
      if (!row.item.trim()) {
        newErrors[`row_${index}_item`] = 'Articolo obbligatorio';
      }
      if (!row.requestedQty || row.requestedQty <= 0) {
        newErrors[`row_${index}_requestedQty`] = 'Quantità deve essere > 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await updateRows(
      formRows.map(row => ({
        rowNumber: row.rowNumber,
        item: row.item,
        requestedQty: Number(row.requestedQty),
        lineDescription: row.lineDescription || undefined,
        lot: row.lot || undefined,
        serialNumber: row.serialNumber || undefined,
        expiryDate: row.expiryDate || undefined,
        rowSequence: row.rowSequence,
        operatorInfo: row.operatorInfo || undefined,
        labelInfo: row.labelInfo || undefined
      }))
    );

    if (result && result.result === 'OK') {
      onSuccess();
    } else {
      const errorMsg = result?.errors?.[0]?.errorMessage || 'Errore nell\'aggiornamento delle righe';
      alert(`Errore: ${errorMsg}`);
    }
  };

  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-600">
            <h3 className="text-lg font-semibold text-white">
              Modifica Righe - Lista: {list.listHeader.listNumber}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Attenzione:</strong> L'aggiornamento delle righe è possibile solo per liste non ancora iniziate.
                Puoi modificare le quantità richieste e altri campi, ma non puoi cambiare l'articolo.
              </p>
            </div>

            <div className="space-y-3">
              {formRows.map((row, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Riga {index + 1}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Num. Riga *
                      </label>
                      <input
                        type="text"
                        value={row.rowNumber}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Articolo *
                      </label>
                      <input
                        type="text"
                        value={row.item}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                        title="L'articolo non può essere modificato"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantità *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={row.requestedQty}
                        onChange={(e) => handleRowChange(index, 'requestedQty', parseFloat(e.target.value))}
                        className={`w-full px-2 py-1 border rounded text-sm ${
                          errors[`row_${index}_requestedQty`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`row_${index}_requestedQty`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`row_${index}_requestedQty`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sequenza
                      </label>
                      <input
                        type="number"
                        value={row.rowSequence || ''}
                        onChange={(e) => handleRowChange(index, 'rowSequence', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Descrizione
                      </label>
                      <input
                        type="text"
                        value={row.lineDescription}
                        onChange={(e) => handleRowChange(index, 'lineDescription', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Lotto
                      </label>
                      <input
                        type="text"
                        value={row.lot}
                        onChange={(e) => handleRowChange(index, 'lot', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Matricola
                      </label>
                      <input
                        type="text"
                        value={row.serialNumber}
                        onChange={(e) => handleRowChange(index, 'serialNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scadenza
                      </label>
                      <input
                        type="date"
                        value={row.expiryDate}
                        onChange={(e) => handleRowChange(index, 'expiryDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Info Operatore
                      </label>
                      <input
                        type="text"
                        value={row.operatorInfo}
                        onChange={(e) => handleRowChange(index, 'operatorInfo', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvataggio...' : 'Salva Righe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

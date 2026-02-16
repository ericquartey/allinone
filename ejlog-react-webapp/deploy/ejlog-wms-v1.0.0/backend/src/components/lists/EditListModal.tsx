// src/components/lists/EditListModal.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useLists } from '../../hooks/useLists';

/**
 * Modal for editing list header (AGGIORNA_LISTA command)
 * Only allows editing certain fields: listDescription, priority, and auxiliary fields
 */
export const EditListModal: React.FC<{  isOpen, list, onClose, onSuccess  }> = ({  isOpen, list, onClose, onSuccess  }) => {
  const { updateList, loading } = useLists();
  const [showAuxFields, setShowAuxFields] = useState(false);

  const [formData, setFormData] = useState({
    listDescription: '',
    priority: 50,

    // Auxiliary fields
    auxHostText01: '',
    auxHostText02: '',
    auxHostText03: '',
    auxHostText04: '',
    auxHostText05: '',
    auxHostInt01: undefined,
    auxHostInt02: undefined,
    auxHostInt03: undefined,
    auxHostBit01: false,
    auxHostBit02: false,
    auxHostBit03: false,
    auxHostDate01: '',
    auxHostDate02: '',
    auxHostDate03: '',
    auxHostNum01: undefined,
    auxHostNum02: undefined,
    auxHostNum03: undefined
  });

  // Initialize form data when list changes
  useEffect(() => {
    if (list && list.listHeader) {
      const header = list.listHeader;
      setFormData({
        listDescription: header.listDescription || '',
        priority: header.priority || 50,
        auxHostText01: header.auxHostText01 || '',
        auxHostText02: header.auxHostText02 || '',
        auxHostText03: header.auxHostText03 || '',
        auxHostText04: header.auxHostText04 || '',
        auxHostText05: header.auxHostText05 || '',
        auxHostInt01: header.auxHostInt01,
        auxHostInt02: header.auxHostInt02,
        auxHostInt03: header.auxHostInt03,
        auxHostBit01: header.auxHostBit01 || false,
        auxHostBit02: header.auxHostBit02 || false,
        auxHostBit03: header.auxHostBit03 || false,
        auxHostDate01: header.auxHostDate01 || '',
        auxHostDate02: header.auxHostDate02 || '',
        auxHostDate03: header.auxHostDate03 || '',
        auxHostNum01: header.auxHostNum01,
        auxHostNum02: header.auxHostNum02,
        auxHostNum03: header.auxHostNum03
      });
    }
  }, [list]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!list || !list.listHeader) {
      return;
    }

    const result = await updateList(list.listHeader.listNumber, {
      listDescription: formData.listDescription || undefined,
      priority: formData.priority,

      // Auxiliary fields (only if filled)
      auxHostText01: formData.auxHostText01 || undefined,
      auxHostText02: formData.auxHostText02 || undefined,
      auxHostText03: formData.auxHostText03 || undefined,
      auxHostText04: formData.auxHostText04 || undefined,
      auxHostText05: formData.auxHostText05 || undefined,
      auxHostInt01: formData.auxHostInt01,
      auxHostInt02: formData.auxHostInt02,
      auxHostInt03: formData.auxHostInt03,
      auxHostBit01: formData.auxHostBit01,
      auxHostBit02: formData.auxHostBit02,
      auxHostBit03: formData.auxHostBit03,
      auxHostDate01: formData.auxHostDate01 || undefined,
      auxHostDate02: formData.auxHostDate02 || undefined,
      auxHostDate03: formData.auxHostDate03 || undefined,
      auxHostNum01: formData.auxHostNum01,
      auxHostNum02: formData.auxHostNum02,
      auxHostNum03: formData.auxHostNum03
    });

    if (result && result.result === 'OK') {
      onSuccess();
    } else {
      const errorMsg = result?.errors?.[0]?.errorMessage || 'Errore nell\'aggiornamento della lista';
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
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-600">
            <h3 className="text-lg font-semibold text-white">
              Modifica Lista: {list.listHeader.listNumber}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <input
                  type="text"
                  value={formData.listDescription}
                  onChange={(e) => handleChange('listDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Descrizione lista"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorità (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Auxiliary Fields (Collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAuxFields(!showAuxFields)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  {showAuxFields ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  Campi Ausiliari (opzionali)
                </button>

                {showAuxFields && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Text fields */}
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={`text${i}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Testo {String(i).padStart(2, '0')}
                          </label>
                          <input
                            type="text"
                            value={formData[`auxHostText${String(i).padStart(2, '0')}`]}
                            onChange={(e) => handleChange(`auxHostText${String(i).padStart(2, '0')}`, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      ))}

                      {/* Integer fields */}
                      {[1, 2, 3].map(i => (
                        <div key={`int${i}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Intero {String(i).padStart(2, '0')}
                          </label>
                          <input
                            type="number"
                            value={formData[`auxHostInt${String(i).padStart(2, '0')}`] || ''}
                            onChange={(e) => handleChange(`auxHostInt${String(i).padStart(2, '0')}`, e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      ))}

                      {/* Boolean fields */}
                      {[1, 2, 3].map(i => (
                        <div key={`bit${i}`} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData[`auxHostBit${String(i).padStart(2, '0')}`]}
                            onChange={(e) => handleChange(`auxHostBit${String(i).padStart(2, '0')}`, e.target.checked)}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-xs font-medium text-gray-700">
                            Booleano {String(i).padStart(2, '0')}
                          </label>
                        </div>
                      ))}

                      {/* Date fields */}
                      {[1, 2, 3].map(i => (
                        <div key={`date${i}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Data {String(i).padStart(2, '0')}
                          </label>
                          <input
                            type="date"
                            value={formData[`auxHostDate${String(i).padStart(2, '0')}`]}
                            onChange={(e) => handleChange(`auxHostDate${String(i).padStart(2, '0')}`, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      ))}

                      {/* Numeric fields */}
                      {[1, 2, 3].map(i => (
                        <div key={`num${i}`}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Numerico {String(i).padStart(2, '0')}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData[`auxHostNum${String(i).padStart(2, '0')}`] || ''}
                            onChange={(e) => handleChange(`auxHostNum${String(i).padStart(2, '0')}`, e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

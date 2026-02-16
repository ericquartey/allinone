// src/components/drawers/EditLoadingUnitModal.jsx

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * Modal for editing Loading Unit (UDC/Cassetto) properties
 * Allows modification of: code, barcode, description, location, blocked status
 */
export function EditLoadingUnitModal({  loadingUnit, isOpen, onClose, onSave  }: any): JSX.Element {
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    description: '',
    locationId: '',
    isBlocked: false
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Initialize form data when modal opens or loadingUnit changes
  useEffect(() => {
    if (isOpen && loadingUnit) {
      setFormData({
        code: loadingUnit.code || '',
        barcode: loadingUnit.barcode || '',
        description: loadingUnit.description || loadingUnit.note || '',
        locationId: loadingUnit.locationId || '',
        isBlocked: loadingUnit.isBlocked || loadingUnit.isBlockedFromEjlog || false
      });
      setErrors({});
      setSaveError(null);
    }
  }, [isOpen, loadingUnit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = 'Il codice è obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Prepare update request (only send fields that can be updated)
      const updateRequest = {
        code: formData.code.trim(),
        barcode: formData.barcode.trim() || undefined,
        description: formData.description.trim() || undefined,
        locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
        isBlocked: formData.isBlocked
      };

      await onSave(loadingUnit.id, updateRequest);

      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Error saving loading unit:', error);
      setSaveError(error.message || 'Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Modifica Cassetto (UDC)
            </h2>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Error Alert */}
              {saveError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Errore di salvataggio</p>
                    <p className="text-sm text-red-700 mt-1">{saveError}</p>
                  </div>
                </div>
              )}

              {/* ID (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID
                </label>
                <input
                  type="text"
                  value={loadingUnit?.id || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Es: UDC-001"
                />
                {errors.code && (
                  <p className="text-sm text-red-600 mt-1">{errors.code}</p>
                )}
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Es: 123456789"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSaving}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Descrizione del cassetto..."
                />
              </div>

              {/* Location ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Ubicazione
                </label>
                <input
                  type="number"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Es: 101"
                />
                {loadingUnit?.locationCode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ubicazione corrente: {loadingUnit.locationCode}
                  </p>
                )}
              </div>

              {/* Is Blocked */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="isBlocked"
                  id="isBlocked"
                  checked={formData.isBlocked}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
                />
                <label htmlFor="isBlocked" className="flex-1 cursor-pointer">
                  <div className="text-sm font-medium text-gray-900">
                    Cassetto Bloccato
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Se selezionato, il cassetto non può essere utilizzato per operazioni
                  </div>
                </label>
              </div>

              {/* Read-only Info */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Informazioni di sola lettura
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Larghezza:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {loadingUnit?.width || 0} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Profondità:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {loadingUnit?.depth || 0} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Altezza:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {loadingUnit?.height || 0} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Scomparti:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {loadingUnit?.compartmentCount || loadingUnit?.compartmentsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditLoadingUnitModal;

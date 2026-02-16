// ============================================================================
// EJLOG WMS - Picking Validation Modal
// Modal per validazioni lotto/matricola/scadenza e conferma operazione
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Package, Calendar, Hash, Barcode } from 'lucide-react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import type { PickingOperation } from '../../types/operations';

interface PickingValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: PickingOperation;
  onConfirm: (data: ValidationData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export interface ValidationData {
  quantity: number;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  barcode?: string;
  wastedQuantity?: number;
  notes?: string;
}

const PickingValidationModal: React.FC<PickingValidationModalProps> = ({
  isOpen,
  onClose,
  operation,
  onConfirm,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<ValidationData>({
    quantity: operation.requestedQuantity,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form quando cambia operazione
  useEffect(() => {
    setFormData({
      quantity: operation.requestedQuantity,
      lot: operation.lot,
      serialNumber: operation.serialNumber,
      expiryDate: operation.expiryDate,
    });
    setErrors({});
  }, [operation]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Valida quantità
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantità deve essere maggiore di 0';
    }
    if (formData.quantity > operation.availableQuantity) {
      newErrors.quantity = `Quantità non può superare ${operation.availableQuantity}`;
    }

    // Valida lotto se richiesto
    if (operation.requiresLot && !formData.lot) {
      newErrors.lot = 'Lotto obbligatorio per questo articolo';
    }

    // Valida matricola se richiesta
    if (operation.requiresSerialNumber && !formData.serialNumber) {
      newErrors.serialNumber = 'Matricola obbligatoria per questo articolo';
    }

    // Valida scadenza se richiesta
    if (operation.requiresExpiryDate && !formData.expiryDate) {
      newErrors.expiryDate = 'Data scadenza obbligatoria per questo articolo';
    }

    // Valida quantità scartata
    if (formData.wastedQuantity) {
      if (formData.wastedQuantity < 0) {
        newErrors.wastedQuantity = 'Quantità scartata non può essere negativa';
      }
      if (formData.quantity + formData.wastedQuantity > operation.availableQuantity) {
        newErrors.wastedQuantity = 'Quantità totale supera la disponibilità';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onConfirm(formData);
      onClose();
    } catch (error) {
      // Error handling già gestito dal parent
      console.error('Error confirming operation:', error);
    }
  };

  const handleChange = (field: keyof ValidationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conferma Operazione">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Operation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">{operation.itemCode}</h4>
          <p className="text-sm text-blue-700">{operation.itemDescription}</p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="text-xs text-blue-600">Ubicazione</label>
              <p className="font-mono font-semibold">{operation.locationCode}</p>
            </div>
            {operation.udcBarcode && (
              <div>
                <label className="text-xs text-blue-600">UDC</label>
                <p className="font-mono font-semibold">{operation.udcBarcode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <Input
            label="Quantità da movimentare"
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', parseFloat(e.target.value))}
            error={errors.quantity}
            required
            icon={<Package className="w-5 h-5" />}
            helperText={`Disponibile: ${operation.availableQuantity} ${operation.itemUm}`}
          />
        </div>

        {/* Lot Input */}
        {operation.requiresLot && (
          <div>
            <Input
              label="Lotto"
              value={formData.lot || ''}
              onChange={(e) => handleChange('lot', e.target.value)}
              error={errors.lot}
              required
              icon={<Hash className="w-5 h-5" />}
              placeholder="Inserisci lotto"
            />
            {operation.lot && formData.lot !== operation.lot && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Lotto diverso da quello atteso: {operation.lot}</span>
              </div>
            )}
          </div>
        )}

        {/* Serial Number Input */}
        {operation.requiresSerialNumber && (
          <div>
            <Input
              label="Matricola"
              value={formData.serialNumber || ''}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
              error={errors.serialNumber}
              required
              icon={<Barcode className="w-5 h-5" />}
              placeholder="Inserisci matricola"
            />
          </div>
        )}

        {/* Expiry Date Input */}
        {operation.requiresExpiryDate && (
          <div>
            <Input
              label="Data Scadenza"
              type="date"
              value={formData.expiryDate || ''}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
              error={errors.expiryDate}
              required
              icon={<Calendar className="w-5 h-5" />}
            />
          </div>
        )}

        {/* Wasted Quantity (Optional) */}
        <div>
          <Input
            label="Quantità Scartata (opzionale)"
            type="number"
            step="0.01"
            value={formData.wastedQuantity || ''}
            onChange={(e) => handleChange('wastedQuantity', parseFloat(e.target.value) || undefined)}
            error={errors.wastedQuantity}
            icon={<AlertTriangle className="w-5 h-5" />}
            helperText="Inserisci solo se parte della merce è danneggiata o non utilizzabile"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (opzionale)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Aggiungi note sull'operazione..."
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Riepilogo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quantità da movimentare:</span>
              <span className="font-semibold">
                {formData.quantity} {operation.itemUm}
              </span>
            </div>
            {formData.wastedQuantity && formData.wastedQuantity > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Quantità scartata:</span>
                <span className="font-semibold">
                  {formData.wastedQuantity} {operation.itemUm}
                </span>
              </div>
            )}
            {formData.lot && (
              <div className="flex justify-between">
                <span className="text-gray-600">Lotto:</span>
                <span className="font-mono font-semibold">{formData.lot}</span>
              </div>
            )}
            {formData.serialNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Matricola:</span>
                <span className="font-mono font-semibold">{formData.serialNumber}</span>
              </div>
            )}
            {formData.expiryDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Scadenza:</span>
                <span className="font-semibold">
                  {new Date(formData.expiryDate).toLocaleDateString('it-IT')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Annulla
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1">
            Conferma Operazione
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PickingValidationModal;

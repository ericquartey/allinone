// ============================================================================
// EJLOG WMS - Item Create Page
// Creazione nuovo articolo - Refactored with itemsService
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import * as ItemsService from '../../services/itemsService';
import type { CreateItemParams } from '../../services/itemsService';

const ItemCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<CreateItemParams>({
    itemCode: '',
    itemDescription: '',
    itemType: ItemsService.ItemType.PRODUCT,
    unitOfMeasure: ItemsService.UnitOfMeasure.PIECE,
    requiresLot: false,
    requiresSerialNumber: false,
    requiresExpiryDate: false,
    weight: undefined,
    volume: undefined,
    category: '',
    barcode: '',
    minStockLevel: undefined,
    maxStockLevel: undefined,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = ItemsService.validateItemCreation(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await ItemsService.createItem(formData);

      if (response.result === 'OK' && response.data) {
        // Navigate to item detail page
        navigate(`/items/${response.data.itemCode}`);
      } else {
        setErrors({ submit: response.message || 'Errore durante la creazione articolo' });
      }
    } catch (error) {
      console.error('Error creating item:', error);
      setErrors({ submit: 'Errore di connessione durante la creazione articolo' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateItemParams, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field as string]) {
      const newErrors = { ...errors };
      delete newErrors[field as string];
      setErrors(newErrors);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nuovo Articolo</h1>
          <p className="text-gray-600 mt-1">Crea un nuovo articolo nel sistema</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/items')}>
          Annulla
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Informazioni di Base</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Codice Articolo"
              type="text"
              value={formData.itemCode}
              onChange={(e) => handleChange('itemCode', e.target.value)}
              placeholder="Es: ART001"
              required
              error={errors.itemCode}
            />

            <Input
              label="Barcode / EAN"
              type="text"
              value={formData.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="Es: 8012345678901"
            />

            <div className="col-span-2">
              <Input
                label="Descrizione"
                type="text"
                value={formData.itemDescription}
                onChange={(e) => handleChange('itemDescription', e.target.value)}
                placeholder="Es: Prodotto Finito XYZ"
                required
                error={errors.itemDescription}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Articolo *
              </label>
              <select
                value={formData.itemType}
                onChange={(e) => handleChange('itemType', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={ItemsService.ItemType.PRODUCT}>Prodotto</option>
                <option value={ItemsService.ItemType.RAW_MATERIAL}>Materia Prima</option>
                <option value={ItemsService.ItemType.SEMI_FINISHED}>Semilavorato</option>
                <option value={ItemsService.ItemType.FINISHED_GOOD}>Prodotto Finito</option>
                <option value={ItemsService.ItemType.CONSUMABLE}>Consumabile</option>
                <option value={ItemsService.ItemType.SPARE_PART}>Ricambio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unità di Misura *
              </label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => handleChange('unitOfMeasure', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={ItemsService.UnitOfMeasure.PIECE}>Pezzi (PZ)</option>
                <option value={ItemsService.UnitOfMeasure.KG}>Chilogrammi (KG)</option>
                <option value={ItemsService.UnitOfMeasure.LITER}>Litri (L)</option>
                <option value={ItemsService.UnitOfMeasure.METER}>Metri (M)</option>
                <option value={ItemsService.UnitOfMeasure.BOX}>Scatole (BOX)</option>
                <option value={ItemsService.UnitOfMeasure.PALLET}>Pallet (PLT)</option>
              </select>
            </div>

            <Input
              label="Categoria"
              type="text"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Es: Elettronica"
            />
          </div>
        </Card>

        {/* Physical Characteristics */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Caratteristiche Fisiche</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Peso (kg)"
              type="number"
              step="0.001"
              min="0"
              value={formData.weight || ''}
              onChange={(e) => handleChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Es: 1.250"
              error={errors.weight}
            />

            <Input
              label="Volume (m³)"
              type="number"
              step="0.0001"
              min="0"
              value={formData.volume || ''}
              onChange={(e) => handleChange('volume', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Es: 0.0125"
              error={errors.volume}
            />
          </div>
        </Card>

        {/* Stock Management */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Gestione Giacenze</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scorta Minima"
              type="number"
              step="0.01"
              min="0"
              value={formData.minStockLevel || ''}
              onChange={(e) => handleChange('minStockLevel', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Es: 10"
            />

            <Input
              label="Scorta Massima"
              type="number"
              step="0.01"
              min="0"
              value={formData.maxStockLevel || ''}
              onChange={(e) => handleChange('maxStockLevel', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Es: 100"
              error={errors.stockLevels}
            />
          </div>
        </Card>

        {/* Traceability */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Tracciabilità</h2>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresLot}
                onChange={(e) => handleChange('requiresLot', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Richiede gestione a Lotto
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresSerialNumber}
                onChange={(e) => handleChange('requiresSerialNumber', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Richiede gestione a Matricola
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresExpiryDate}
                onChange={(e) => handleChange('requiresExpiryDate', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Richiede Data di Scadenza
              </span>
            </label>
          </div>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Note</h2>

          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Inserisci eventuali note aggiuntive sull'articolo..."
          />
        </Card>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/items')}
            disabled={loading}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Creazione in corso...' : 'Crea Articolo'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItemCreatePage;

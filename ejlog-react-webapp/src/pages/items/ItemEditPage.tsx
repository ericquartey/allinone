// ============================================================================
// EJLOG WMS - Item Edit Page
// Modifica articolo esistente - Refactored with itemsService
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import * as ItemsService from '../../services/itemsService';
import type { Item, UpdateItemParams } from '../../services/itemsService';

const ItemEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Form state - initialized with UpdateItemParams fields
  const [formData, setFormData] = useState<UpdateItemParams>({
    itemCode: '',
    itemDescription: '',
    itemStatus: ItemsService.ItemStatus.ACTIVE,
    unitOfMeasure: ItemsService.UnitOfMeasure.PIECE,
    weight: undefined,
    volume: undefined,
    category: '',
    barcode: '',
    minStockLevel: undefined,
    maxStockLevel: undefined,
    notes: '',
  });

  // Load item data
  useEffect(() => {
    if (id) {
      loadItemData();
    }
  }, [id]);

  const loadItemData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const itemData = await ItemsService.getItemByCode(id);

      if (!itemData) {
        setError('Articolo non trovato');
        setLoading(false);
        return;
      }

      setItem(itemData);

      // Populate form with existing data
      setFormData({
        itemCode: itemData.itemCode,
        itemDescription: itemData.itemDescription,
        itemStatus: itemData.itemStatus,
        unitOfMeasure: itemData.unitOfMeasure,
        weight: itemData.weight,
        volume: itemData.volume,
        category: itemData.category || '',
        barcode: itemData.barcode || '',
        minStockLevel: itemData.minStockLevel,
        maxStockLevel: itemData.maxStockLevel,
        notes: itemData.notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento articolo');
      console.error('Error loading item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = ItemsService.validateItemUpdate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await ItemsService.updateItem(formData);

      if (response.result === 'OK') {
        // Navigate back to detail page
        navigate(`/items/${formData.itemCode}`);
      } else {
        setErrors({ submit: response.message || 'Errore durante l\'aggiornamento articolo' });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setErrors({ submit: 'Errore di connessione durante l\'aggiornamento articolo' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof UpdateItemParams, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field as string]) {
      const newErrors = { ...errors };
      delete newErrors[field as string];
      setErrors(newErrors);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error || 'Articolo non trovato'}</p>
            <Button onClick={() => navigate('/items')} className="mt-4">
              Torna all'Elenco
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Modifica Articolo</h1>
          <p className="text-gray-600 mt-1">Modifica i dati dell'articolo {item.itemCode}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/items/${id}`)}>
          Annulla
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Informazioni di Base</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Articolo *
              </label>
              <input
                type="text"
                value={formData.itemCode}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                title="Il codice articolo non può essere modificato"
              />
              <p className="text-xs text-gray-500 mt-1">Il codice non può essere modificato</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode / EAN
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es: 8012345678901"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione *
              </label>
              <input
                type="text"
                value={formData.itemDescription}
                onChange={(e) => handleChange('itemDescription', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.itemDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Es: Prodotto Finito XYZ"
                required
              />
              {errors.itemDescription && (
                <p className="text-sm text-red-600 mt-1">{errors.itemDescription}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato *
              </label>
              <select
                value={formData.itemStatus}
                onChange={(e) => handleChange('itemStatus', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={ItemsService.ItemStatus.ACTIVE}>Attivo</option>
                <option value={ItemsService.ItemStatus.INACTIVE}>Inattivo</option>
                <option value={ItemsService.ItemStatus.DISCONTINUED}>Dismesso</option>
                <option value={ItemsService.ItemStatus.BLOCKED}>Bloccato</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es: Elettronica"
              />
            </div>
          </div>
        </Card>

        {/* Physical Characteristics */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Caratteristiche Fisiche</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.weight || ''}
                onChange={(e) => handleChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Es: 1.250"
              />
              {errors.weight && (
                <p className="text-sm text-red-600 mt-1">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (m³)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.volume || ''}
                onChange={(e) => handleChange('volume', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.volume ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Es: 0.0125"
              />
              {errors.volume && (
                <p className="text-sm text-red-600 mt-1">{errors.volume}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Stock Management */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Gestione Giacenze</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scorta Minima
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minStockLevel || ''}
                onChange={(e) => handleChange('minStockLevel', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es: 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scorta Massima
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.maxStockLevel || ''}
                onChange={(e) => handleChange('maxStockLevel', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es: 100"
              />
            </div>
          </div>
        </Card>

        {/* Traceability Info (Read-only) */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Tracciabilità</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-3">
              Le impostazioni di tracciabilità non possono essere modificate dopo la creazione dell'articolo.
            </p>
            <div className="flex gap-3">
              {item.requiresLot && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Richiede Lotto
                </span>
              )}
              {item.requiresSerialNumber && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Richiede Matricola
                </span>
              )}
              {item.requiresExpiryDate && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  Richiede Data Scadenza
                </span>
              )}
              {!item.requiresLot && !item.requiresSerialNumber && !item.requiresExpiryDate && (
                <span className="text-gray-600 text-sm">Nessuna tracciabilità richiesta</span>
              )}
            </div>
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
            onClick={() => navigate(`/items/${id}`)}
            disabled={submitting}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? 'Salvataggio in corso...' : 'Salva Modifiche'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItemEditPage;

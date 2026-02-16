// ============================================================================
// EJLOG WMS - Create UDC Page
// Creazione nuova UDC - Refactored with udcService
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as UdcService from '../../services/udcService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';

const CreateUdcPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<UdcService.CreateUdcParams>({
    type: UdcService.UdcType.PALLET,
    width: 800,
    depth: 1200,
    height: 1000,
    compartmentsCount: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validationErrors = UdcService.validateUdcCreation(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await UdcService.createUdc(formData);
      if (result.result === 'OK' && result.data) {
        alert('UDC creata con successo!');
        navigate(`/udc/${result.data.id}`);
      } else {
        alert(result.message || 'Errore durante la creazione');
      }
    } catch (error) {
      console.error('Error creating UDC:', error);
      alert('Errore durante la creazione UDC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crea Nuova UDC</h1>
        <p className="text-gray-600 mt-1">Unità Di Carico</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* UDC Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo UDC *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as UdcService.UdcType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={UdcService.UdcType.PALLET}>Pallet</option>
              <option value={UdcService.UdcType.BOX}>Scatola</option>
              <option value={UdcService.UdcType.CONTAINER}>Contenitore</option>
              <option value={UdcService.UdcType.CART}>Carrello</option>
              <option value={UdcService.UdcType.CUSTOM}>Personalizzato</option>
            </select>
            {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Barcode (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode (opzionale - generato automaticamente se non specificato)
            </label>
            <input
              type="text"
              value={formData.barcode || ''}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es: UDC001234"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione (opzionale)
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrizione UDC"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Larghezza (mm) *
              </label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={1}
              />
              {errors.width && <p className="text-red-600 text-sm mt-1">{errors.width}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profondità (mm) *
              </label>
              <input
                type="number"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={1}
              />
              {errors.depth && <p className="text-red-600 text-sm mt-1">{errors.depth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altezza (mm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso Massimo (kg)
              </label>
              <input
                type="number"
                value={formData.maxWeight || ''}
                onChange={(e) => setFormData({ ...formData, maxWeight: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
                step={0.1}
              />
              {errors.maxWeight && <p className="text-red-600 text-sm mt-1">{errors.maxWeight}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Massimo (m³)
              </label>
              <input
                type="number"
                value={formData.maxVolume || ''}
                onChange={(e) => setFormData({ ...formData, maxVolume: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
                step={0.01}
              />
              {errors.maxVolume && <p className="text-red-600 text-sm mt-1">{errors.maxVolume}</p>}
            </div>
          </div>

          {/* Compartments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero Compartimenti
            </label>
            <input
              type="number"
              value={formData.compartmentsCount}
              onChange={(e) => setFormData({ ...formData, compartmentsCount: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
            />
            {errors.compartmentsCount && <p className="text-red-600 text-sm mt-1">{errors.compartmentsCount}</p>}
            <p className="text-sm text-gray-500 mt-1">Lascia a 0 se non utilizza compartimenti</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Note aggiuntive..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creazione in corso...
                </>
              ) : (
                'Crea UDC'
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/udc')}>
              Annulla
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateUdcPage;

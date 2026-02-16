// ============================================================================
// EJLOG WMS - Item Form Page Enhanced
// Form creazione/modifica articolo con upload immagini
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft } from 'lucide-react';
import { useGetItemByIdQuery, useCreateItemMutation, useUpdateItemMutation } from '../../services/api/itemsApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import FileUpload from '../../components/common/FileUpload';
import type { Item, ManagementType } from '../../types/models';

interface ItemFormData {
  code: string;
  description: string;
  itemCategoryDescription?: string;
  measureUnitDescription: string;
  managementType: ManagementType;
  note?: string;
  averageWeight?: number;
  unitWeight?: number;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  imageFile?: File;
}

/**
 * Item Form Page Enhanced
 *
 * Form completo per creazione/modifica articolo:
 * - Tutti i campi articolo
 * - Upload immagine prodotto con preview
 * - Validazione real-time
 * - Save/Cancel actions
 */
const ItemFormPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Fetch existing item if edit mode
  const { data: existingItem, isLoading: loadingItem } = useGetItemByIdQuery(Number(id), {
    skip: !isEditMode,
  });

  // Mutations
  const [createItem, { isLoading: creating }] = useCreateItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateItemMutation();

  // Form state
  const [formData, setFormData] = useState<ItemFormData>({
    code: '',
    description: '',
    measureUnitDescription: '',
    managementType: ManagementType.STANDARD,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormData, string>>>({});
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  // Populate form if editing
  useEffect(() => {
    if (existingItem) {
      setFormData({
        code: existingItem.code,
        description: existingItem.description,
        itemCategoryDescription: existingItem.itemCategoryDescription,
        measureUnitDescription: existingItem.measureUnitDescription,
        managementType: existingItem.managementType,
        note: existingItem.note,
        averageWeight: existingItem.averageWeight,
        unitWeight: existingItem.unitWeight,
        barcode: existingItem.barcode,
        minStock: existingItem.minStock,
        maxStock: existingItem.maxStock,
        reorderPoint: existingItem.reorderPoint,
      });
    }
  }, [existingItem]);

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ItemFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Codice articolo obbligatorio';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Codice deve essere almeno 3 caratteri';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrizione obbligatoria';
    } else if (formData.description.length < 3) {
      newErrors.description = 'Descrizione deve essere almeno 3 caratteri';
    }

    if (!formData.measureUnitDescription.trim()) {
      newErrors.measureUnitDescription = 'Unità di misura obbligatoria';
    }

    if (formData.minStock !== undefined && formData.maxStock !== undefined) {
      if (formData.minStock > formData.maxStock) {
        newErrors.minStock = 'Giacenza minima non può superare la massima';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (field: keyof ItemFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      setUploadedImage(files[0]);
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload: Partial<Item> = {
        code: formData.code,
        description: formData.description,
        itemCategoryDescription: formData.itemCategoryDescription,
        measureUnitDescription: formData.measureUnitDescription,
        managementType: formData.managementType,
        note: formData.note,
        averageWeight: formData.averageWeight,
        unitWeight: formData.unitWeight,
        barcode: formData.barcode,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        reorderPoint: formData.reorderPoint,
      };

      if (isEditMode) {
        await updateItem({ id: Number(id), data: payload }).unwrap();
        alert('Articolo aggiornato con successo!');
      } else {
        await createItem(payload).unwrap();
        alert('Articolo creato con successo!');
      }

      // TODO: Upload image separately via imagesApi if uploadedImage exists

      navigate('/items');
    } catch (error) {
      console.error('Save error:', error);
      alert('Errore nel salvataggio dell\'articolo');
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (window.confirm('Annullare le modifiche?')) {
      navigate('/items');
    }
  };

  if (loadingItem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ferrRed mx-auto" />
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/items')} icon={<ArrowLeft className="w-5 h-5" />}>
          Indietro
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode
              ? `Modifica dei dati dell'articolo ${formData.code}`
              : 'Inserisci i dati del nuovo articolo'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card title="Informazioni Base">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Codice Articolo"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  error={errors.code}
                  required
                  disabled={isEditMode} // Code cannot be changed in edit mode
                  placeholder="es. ART001"
                />

                <Input
                  label="Barcode"
                  value={formData.barcode || ''}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  error={errors.barcode}
                  placeholder="es. 8001234567890"
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Descrizione"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    error={errors.description}
                    required
                    placeholder="Descrizione completa articolo"
                  />
                </div>

                <Input
                  label="Categoria"
                  value={formData.itemCategoryDescription || ''}
                  onChange={(e) => handleChange('itemCategoryDescription', e.target.value)}
                  placeholder="es. Alimentari"
                />

                <Input
                  label="Unità di Misura"
                  value={formData.measureUnitDescription}
                  onChange={(e) => handleChange('measureUnitDescription', e.target.value)}
                  error={errors.measureUnitDescription}
                  required
                  placeholder="es. PZ, KG, LT"
                />
              </div>
            </Card>

            {/* Management Type Card */}
            <Card title="Gestione Articolo">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Gestione
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: ManagementType.STANDARD, label: 'Standard' },
                      { value: ManagementType.LOTTO, label: 'A Lotto' },
                      { value: ManagementType.MATRICOLA, label: 'A Matricola' },
                      { value: ManagementType.LOTTO_E_MATRICOLA, label: 'Lotto + Matricola' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.managementType === option.value
                            ? 'border-ferrRed bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="managementType"
                          value={option.value}
                          checked={formData.managementType === option.value}
                          onChange={(e) => handleChange('managementType', Number(e.target.value))}
                          className="w-4 h-4 text-ferrRed focus:ring-ferrRed"
                        />
                        <span className="ml-2 text-sm font-medium">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stock & Weight Card */}
            <Card title="Giacenze e Pesi">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="Giacenza Minima"
                  value={formData.minStock ?? ''}
                  onChange={(e) => handleChange('minStock', e.target.value ? Number(e.target.value) : undefined)}
                  error={errors.minStock}
                  min={0}
                  step={1}
                />

                <Input
                  type="number"
                  label="Giacenza Massima"
                  value={formData.maxStock ?? ''}
                  onChange={(e) => handleChange('maxStock', e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  step={1}
                />

                <Input
                  type="number"
                  label="Punto Riordino"
                  value={formData.reorderPoint ?? ''}
                  onChange={(e) => handleChange('reorderPoint', e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  step={1}
                />

                <Input
                  type="number"
                  label="Peso Unitario (g)"
                  value={formData.unitWeight ?? ''}
                  onChange={(e) => handleChange('unitWeight', e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  step={0.01}
                />

                <Input
                  type="number"
                  label="Peso Medio (g)"
                  value={formData.averageWeight ?? ''}
                  onChange={(e) => handleChange('averageWeight', e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  step={0.01}
                />
              </div>
            </Card>

            {/* Notes Card */}
            <Card title="Note">
              <textarea
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ferrRed focus:border-transparent"
                placeholder="Note aggiuntive sull'articolo..."
              />
            </Card>
          </div>

          {/* Right Column - Image Upload */}
          <div>
            <Card title="Immagine Prodotto">
              <FileUpload
                onFilesSelected={handleImageUpload}
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                showPreview
                helpText="PNG, JPG o GIF (max 5MB)"
              />

              {existingItem?.imageUrl && !uploadedImage && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Immagine Corrente:</p>
                  <img
                    src={existingItem.imageUrl}
                    alt={existingItem.description}
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="ghost" onClick={handleCancel} disabled={creating || updating}>
            <X className="w-4 h-4 mr-2" />
            Annulla
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={creating || updating}
            icon={<Save className="w-4 h-4" />}
          >
            {isEditMode ? 'Aggiorna' : 'Crea'} Articolo
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItemFormPageEnhanced;

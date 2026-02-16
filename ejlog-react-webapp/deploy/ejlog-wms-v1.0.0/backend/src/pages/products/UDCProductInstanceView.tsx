// ============================================================================
// EJLOG WMS - UDC Product Instance View
// View/Edit/Delete product instances in UDCs (matches Wicket ProdottoPage)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Loader2,
  AlertCircle,
  Save,
  Trash2,
  ArrowLeft,
  Plus,
  Minus,
  Edit3,
  Archive,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Alert from '../../components/shared/Alert';

// Types
interface UDCProductInstance {
  id: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitOfMeasure: string;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  udcId: number;
  udcCode: string;
  locationId: number;
  locationCode: string;
  warehouseId: number;
  warehouseName: string;
  lotManaged: boolean;
  serialManaged: boolean;
  expirationManaged: boolean;
  itemId: number;
  compartmentId?: number;
}

interface QuantityModalData {
  type: 'pick' | 'deposit';
  title: string;
  action: string;
  color: string;
}

interface Props {
  productId: number;
  udcId: number;
}

const UDCProductInstanceView: React.FC<Props> = ({ productId, udcId }) => {
  const navigate = useNavigate();
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // State
  const [product, setProduct] = useState<UDCProductInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editedQuantity, setEditedQuantity] = useState<string>('');
  const [editedLot, setEditedLot] = useState<string>('');
  const [editedSerial, setEditedSerial] = useState<string>('');

  // Quantity modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityModalData, setQuantityModalData] = useState<QuantityModalData | null>(null);
  const [quantityValue, setQuantityValue] = useState<string>('');

  // Load product data
  useEffect(() => {
    loadProduct();
  }, [productId, udcId]);

  const loadProduct = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3077/api/products/${productId}?udcId=${udcId}`
      );

      if (!response.ok) {
        throw new Error('Prodotto non trovato');
      }

      const data: UDCProductInstance = await response.json();
      setProduct(data);
      setEditedQuantity(data.quantity.toString());
      setEditedLot(data.lot || '');
      setEditedSerial(data.serialNumber || '');
    } catch (err) {
      console.error('Load product error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento');
      toast.error('Errore durante il caricamento prodotto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 100);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (product) {
      setEditedQuantity(product.quantity.toString());
      setEditedLot(product.lot || '');
      setEditedSerial(product.serialNumber || '');
    }
  };

  const handleSave = async () => {
    if (!product) return;

    const qty = parseFloat(editedQuantity);
    if (isNaN(qty) || qty < 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    // Validate lot if required
    if (product.lotManaged && !editedLot.trim()) {
      toast.error('Il lotto è obbligatorio per questo articolo');
      return;
    }

    // Validate serial if required
    if (product.serialManaged && !editedSerial.trim()) {
      toast.error('La matricola è obbligatoria per questo articolo');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`http://localhost:3077/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: qty,
          lot: editedLot.trim() || null,
          serialNumber: editedSerial.trim() || null,
          userName: 'current-user',
        }),
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio');
      }

      toast.success('Prodotto aggiornato con successo');
      setIsEditMode(false);
      await loadProduct();
    } catch (err) {
      console.error('Save product error:', err);
      toast.error('Errore durante il salvataggio prodotto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (!confirm(`Confermi l'eliminazione del prodotto ${product.productCode}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3077/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'current-user',
        }),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione');
      }

      toast.success('Prodotto eliminato con successo');
      navigate(`/loading-units/${product.udcId}`);
    } catch (err) {
      console.error('Delete product error:', err);
      toast.error('Errore durante l\'eliminazione prodotto');
    }
  };

  const handleOpenPickModal = () => {
    setQuantityModalData({
      type: 'pick',
      title: 'Preleva Prodotto',
      action: 'Preleva',
      color: 'red',
    });
    setQuantityValue('');
    setShowQuantityModal(true);
  };

  const handleOpenDepositModal = () => {
    setQuantityModalData({
      type: 'deposit',
      title: 'Deposita Prodotto',
      action: 'Deposita',
      color: 'green',
    });
    setQuantityValue('');
    setShowQuantityModal(true);
  };

  const handleQuantityAction = async () => {
    if (!product || !quantityModalData) return;

    const qty = parseFloat(quantityValue);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Inserisci una quantità valida');
      return;
    }

    if (quantityModalData.type === 'pick' && qty > product.quantity) {
      toast.error('Quantità richiesta superiore alla giacenza disponibile');
      return;
    }

    try {
      const endpoint =
        quantityModalData.type === 'pick'
          ? `http://localhost:3077/api/products/${product.id}/pick`
          : `http://localhost:3077/api/products/${product.id}/deposit`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: qty,
          userName: 'current-user',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Errore durante ${quantityModalData.type === 'pick' ? 'il prelievo' : 'il deposito'}`
        );
      }

      const action = quantityModalData.type === 'pick' ? 'prelevata' : 'depositata';
      toast.success(`Quantità ${action}: ${qty} ${product.unitOfMeasure}`);
      setShowQuantityModal(false);
      setQuantityValue('');
      await loadProduct();
    } catch (err) {
      console.error('Quantity action error:', err);
      toast.error(err instanceof Error ? err.message : 'Errore durante l\'operazione');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento prodotto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="error">
          {error || 'Prodotto non trovato'}
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna Indietro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Package className="text-blue-600 w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dettaglio Prodotto</h1>
              <p className="text-gray-600">{product.productCode}</p>
            </div>
          </div>
        </div>

        {!isEditMode && (
          <Button onClick={handleEdit}>
            <Edit3 className="w-4 h-4 mr-2" />
            Modifica
          </Button>
        )}
      </div>

      {/* Product Information Card */}
      <Card>
        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">Informazioni Prodotto</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Article Info */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Articolo</label>
              <div className="flex items-center gap-2">
                <Package size={18} className="text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">{product.productCode}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Descrizione</label>
              <span className="text-lg text-gray-900">{product.productDescription}</span>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Quantità</label>
              {isEditMode ? (
                <input
                  ref={quantityInputRef}
                  type="number"
                  value={editedQuantity}
                  onChange={(e) => setEditedQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="text-2xl font-bold text-green-600">
                  {product.quantity} {product.unitOfMeasure}
                </span>
              )}
            </div>

            {/* Unit of Measure */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Unità di Misura
                </label>
                <span className="text-lg text-gray-900">{product.unitOfMeasure}</span>
              </div>
            )}

            {/* Lot */}
            {product.lotManaged && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Lotto {product.lotManaged && <span className="text-red-600">*</span>}
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedLot}
                    onChange={(e) => setEditedLot(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Inserisci lotto..."
                  />
                ) : (
                  <Badge variant="default" size="lg">
                    {product.lot || '-'}
                  </Badge>
                )}
              </div>
            )}

            {/* Serial Number */}
            {product.serialManaged && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Matricola {product.serialManaged && <span className="text-red-600">*</span>}
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedSerial}
                    onChange={(e) => setEditedSerial(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Inserisci matricola..."
                  />
                ) : (
                  <Badge variant="default" size="lg">
                    {product.serialNumber || '-'}
                  </Badge>
                )}
              </div>
            )}

            {/* Expiration Date */}
            {product.expirationManaged && product.expirationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Data Scadenza
                </label>
                <span className="text-lg text-gray-900">
                  {new Date(product.expirationDate).toLocaleDateString('it-IT')}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Location Information Card */}
      <Card>
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">Ubicazione</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UDC */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">UDC</label>
              <div className="flex items-center gap-2">
                <Archive size={18} className="text-gray-400" />
                <button
                  onClick={() => navigate(`/loading-units/${product.udcId}`)}
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {product.udcCode}
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Locazione</label>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-gray-400" />
                <span className="text-lg font-mono text-gray-900">{product.locationCode}</span>
              </div>
            </div>

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Magazzino</label>
              <span className="text-lg text-gray-900">{product.warehouseName}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isEditMode ? (
          <>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Salva
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
              Annulla
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleOpenPickModal}>
              <Minus size={20} className="mr-2" />
              Preleva
            </Button>
            <Button variant="outline" onClick={handleOpenDepositModal}>
              <Plus size={20} className="mr-2" />
              Deposita
            </Button>
            <div className="ml-auto">
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 size={20} className="mr-2 text-red-600" />
                <span className="text-red-600">Elimina</span>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Quantity Action Modal */}
      {showQuantityModal && quantityModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {quantityModalData.title}
            </h3>

            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Articolo:</div>
                  <div className="font-medium text-gray-900">{product.productCode}</div>
                  <div className="text-gray-600">Giacenza:</div>
                  <div className="font-bold text-green-600">
                    {product.quantity} {product.unitOfMeasure}
                  </div>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità da {quantityModalData.type === 'pick' ? 'prelevare' : 'depositare'}
              </label>
              <input
                type="number"
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuantityAction();
                  }
                }}
                placeholder="0"
                min="0"
                max={quantityModalData.type === 'pick' ? product.quantity : undefined}
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center font-bold"
                autoFocus
              />
              {quantityModalData.type === 'pick' && (
                <p className="text-xs text-gray-500 mt-1">Max: {product.quantity}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleQuantityAction}
                variant={quantityModalData.type === 'pick' ? 'outline' : 'default'}
                className="flex-1"
              >
                {quantityModalData.action}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowQuantityModal(false);
                  setQuantityValue('');
                }}
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UDCProductInstanceView;


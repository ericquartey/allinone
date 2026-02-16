// ============================================================================
// EJLOG WMS - Picking Execution Page COMPLETA
// Esecuzione picking con parità funzionale 100% rispetto a EjLog legacy
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Barcode as BarcodeIcon,
  Printer,
  SkipForward,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useBarcode } from '../../hooks/useBarcode';
import operationsService from '../../services/operationsService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Badge from '../../components/shared/Badge';
import Alert from '../../components/shared/Alert';
import PickingLineItem from '../../components/operations/PickingLineItem';
import PickingValidationModal, { ValidationData } from '../../components/operations/PickingValidationModal';
import type { PickingList, PickingOperation } from '../../types/operations';

const PickingExecutionPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [list, setList] = useState<PickingList | null>(null);
  const [operations, setOperations] = useState<PickingOperation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Barcode scanning state
  const [barcodeValidated, setBarcodeValidated] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Validation modal
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Auto-advance settings
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Current operation
  const currentOperation = useMemo(() => {
    return operations[currentIndex] || null;
  }, [operations, currentIndex]);

  // Pending operations (non completate)
  const pendingOperations = useMemo(() => {
    return operations.filter(op => !op.isCompleted);
  }, [operations]);

  // Progress calculation
  const progress = useMemo(() => {
    if (operations.length === 0) return 0;
    const completed = operations.filter(op => op.isCompleted).length;
    return (completed / operations.length) * 100;
  }, [operations]);

  // Load list and operations
  useEffect(() => {
    if (!listId) return;
    loadListData();
  }, [listId]);

  const loadListData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const listData = await operationsService.getListWithOperations(Number(listId));
      setList(listData);
      setOperations(listData.operations || []);

      // Find first non-completed operation
      const firstPending = listData.operations?.findIndex(op => !op.isCompleted);
      if (firstPending !== undefined && firstPending !== -1) {
        setCurrentIndex(firstPending);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento lista');
      toast.error('Errore caricamento dati');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset barcode validation when operation changes
  useEffect(() => {
    if (currentOperation) {
      // Reset only if UDC changes
      const prevOp = operations[currentIndex - 1];
      if (prevOp && prevOp.udcId !== currentOperation.udcId) {
        setBarcodeValidated(false);
        setScannedBarcode('');
        setBarcodeError(null);
      }
    }
  }, [currentIndex, currentOperation, operations]);

  // Barcode scan handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!currentOperation || barcodeValidated) return;

    setBarcodeError(null);
    setScannedBarcode(barcode);

    try {
      const validation = await operationsService.validateBarcode(
        currentOperation.id,
        barcode,
        'UDC'
      );

      if (validation.valid) {
        setBarcodeValidated(true);
        toast.success('Barcode UDC validato correttamente');
      } else {
        setBarcodeError(validation.message || 'Barcode non valido');
        toast.error(validation.message || 'Barcode non valido');
      }
    } catch (err: any) {
      setBarcodeError(err.response?.data?.message || 'Errore validazione barcode');
      toast.error('Errore validazione barcode');
    }
  }, [currentOperation, barcodeValidated]);

  // Enable barcode scanner
  useBarcode({
    onScan: handleBarcodeScan,
    enabled: !barcodeValidated && !!currentOperation,
  });

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setBarcodeError(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < operations.length - 1) {
      setCurrentIndex(currentIndex - 1);
      setBarcodeError(null);
    }
  };

  const handleSkipBarcode = () => {
    setBarcodeValidated(true);
    toast.success('Validazione barcode saltata');
  };

  const handleOpenValidation = () => {
    if (!barcodeValidated) {
      toast.error('Validare prima il barcode UDC');
      return;
    }
    setShowValidationModal(true);
  };

  // Complete operation
  const handleConfirmOperation = async (validationData: ValidationData) => {
    if (!currentOperation || !user) return;

    setIsSubmitting(true);

    try {
      const result = await operationsService.completeOperation({
        operationId: currentOperation.id,
        quantity: validationData.quantity,
        wastedQuantity: validationData.wastedQuantity,
        lot: validationData.lot,
        serialNumber: validationData.serialNumber,
        expiryDate: validationData.expiryDate,
        barcode: scannedBarcode,
        userName: user.userName,
        notes: validationData.notes,
      });

      toast.success('Operazione completata con successo');

      // Reload list data
      await loadListData();

      // Auto-advance to next operation
      if (autoAdvance && currentIndex < operations.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setBarcodeValidated(false);
        setScannedBarcode('');
      } else if (result.listCompleted) {
        // List completed, return to list detail
        toast.success('Lista completata!');
        navigate(`/lists/${listId}`);
      }

      setShowValidationModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Errore completamento operazione');
      throw err; // Re-throw to keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip operation
  const handleSkipOperation = () => {
    if (!autoAdvance && currentIndex < operations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setBarcodeValidated(false);
      setScannedBarcode('');
      toast.info('Operazione saltata');
    }
  };

  // Jump to specific operation
  const handleJumpToOperation = (index: number) => {
    setCurrentIndex(index);
    setBarcodeValidated(false);
    setScannedBarcode('');
    setBarcodeError(null);
  };

  // Return to list
  const handleBack = () => {
    navigate(`/lists/${listId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !list || operations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Nessuna operazione da eseguire'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error ? 'Si è verificato un errore nel caricamento' : 'La lista non contiene operazioni'}
            </p>
            <Button onClick={handleBack} variant="primary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Torna alla lista
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentOperation) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Esecuzione Picking</h1>
            <p className="text-gray-600">
              Lista {list.code} - {list.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={list.status === 'IN_PROGRESS' ? 'info' : 'success'} size="lg">
            {list.status === 'IN_PROGRESS' ? 'In corso' : 'Completata'}
          </Badge>
          <Badge variant="default" size="lg">
            Priorità: {list.priority}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Progresso Lista
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {operations.filter(op => op.isCompleted).length} / {operations.length} operazioni completate
            </span>
            <span>
              {pendingOperations.length} rimanenti
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Operation Execution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation */}
          <Card>
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Precedente
              </Button>
              <span className="text-lg font-semibold">
                Operazione {currentIndex + 1} di {operations.length}
              </span>
              <Button
                variant="ghost"
                onClick={handleNext}
                disabled={currentIndex === operations.length - 1}
              >
                Successiva
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Barcode Validation */}
          {!barcodeValidated && currentOperation.udcBarcode && (
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarcodeIcon className="w-5 h-5" />
                Validazione Barcode UDC
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">UDC Atteso</label>
                  <p className="text-2xl font-mono font-bold text-blue-600">
                    {currentOperation.udcBarcode}
                  </p>
                </div>
                <Alert
                  variant="info"
                  message="Scansiona il barcode dell'UDC con il lettore"
                />
                {scannedBarcode && (
                  <div>
                    <label className="text-sm text-gray-600">Barcode Scansionato</label>
                    <p className="text-lg font-mono">{scannedBarcode}</p>
                  </div>
                )}
                {barcodeError && (
                  <Alert variant="error" message={barcodeError} />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipBarcode}
                >
                  Salta validazione barcode
                </Button>
              </div>
            </Card>
          )}

          {barcodeValidated && (
            <Alert
              variant="success"
              message="Barcode UDC validato correttamente"
              icon={<CheckCircle className="w-5 h-5" />}
            />
          )}

          {/* Location Info */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicazione
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Codice</label>
                <p className="text-3xl font-bold text-blue-600">
                  {currentOperation.locationCode}
                </p>
              </div>
              {currentOperation.locationWarehouse && (
                <div>
                  <label className="text-sm text-gray-600">Magazzino</label>
                  <p className="text-lg font-semibold">
                    {currentOperation.locationWarehouse}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600">Coordinate</label>
                <p className="font-mono text-sm">
                  X:{currentOperation.locationX || '-'}
                  Y:{currentOperation.locationY || '-'}
                  Z:{currentOperation.locationZ || '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Article Info */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Articolo
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600">Codice</label>
                <p className="text-2xl font-bold">{currentOperation.itemCode}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Descrizione</label>
                <p className="text-lg">{currentOperation.itemDescription}</p>
              </div>

              {/* Image if available */}
              {currentOperation.itemImageUrl && (
                <div className="col-span-2">
                  <img
                    src={currentOperation.itemImageUrl}
                    alt={currentOperation.itemCode}
                    className="w-full max-w-sm h-48 object-contain border rounded-lg"
                  />
                </div>
              )}

              {/* Lot/Serial/Expiry if present */}
              {(currentOperation.lot || currentOperation.serialNumber || currentOperation.expiryDate) && (
                <>
                  {currentOperation.lot && (
                    <div>
                      <label className="text-sm text-gray-600">Lotto</label>
                      <p className="font-mono font-semibold">{currentOperation.lot}</p>
                    </div>
                  )}
                  {currentOperation.serialNumber && (
                    <div>
                      <label className="text-sm text-gray-600">Matricola</label>
                      <p className="font-mono font-semibold">{currentOperation.serialNumber}</p>
                    </div>
                  )}
                  {currentOperation.expiryDate && (
                    <div>
                      <label className="text-sm text-gray-600">Scadenza</label>
                      <p className="font-semibold">
                        {new Date(currentOperation.expiryDate).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Quantity Info */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Quantità</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <label className="text-sm text-gray-600">Richiesta</label>
                <p className="text-3xl font-bold text-blue-600">
                  {currentOperation.requestedQuantity}
                </p>
                <span className="text-sm text-gray-500">{currentOperation.itemUm}</span>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <label className="text-sm text-gray-600">Disponibile</label>
                <p className="text-3xl font-bold text-green-600">
                  {currentOperation.availableQuantity}
                </p>
                <span className="text-sm text-gray-500">{currentOperation.itemUm}</span>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-600">Processata</label>
                <p className="text-3xl font-bold text-gray-600">
                  {currentOperation.processedQuantity}
                </p>
                <span className="text-sm text-gray-500">{currentOperation.itemUm}</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOpenValidation}
                disabled={!barcodeValidated}
                className="flex-1"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Conferma Operazione
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSkipOperation}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar - Operations List */}
        <div className="space-y-6">
          {/* Settings */}
          <Card>
            <h3 className="font-semibold mb-3">Impostazioni</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Avanzamento automatico</span>
            </label>
          </Card>

          {/* Operations List */}
          <Card>
            <h3 className="font-semibold mb-3">
              Operazioni ({pendingOperations.length} rimanenti)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {operations.map((operation, index) => (
                <PickingLineItem
                  key={operation.id}
                  operation={operation}
                  isActive={index === currentIndex}
                  onClick={() => handleJumpToOperation(index)}
                  showDetails={false}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Validation Modal */}
      {currentOperation && (
        <PickingValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          operation={currentOperation}
          onConfirm={handleConfirmOperation}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default PickingExecutionPage;

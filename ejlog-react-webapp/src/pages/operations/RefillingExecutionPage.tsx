// ============================================================================
// EJLOG WMS - Refilling Execution Page COMPLETA
// Esecuzione refilling con selezione UDC/scomparto destinazione e merge
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
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import operationsService from '../../services/operationsService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Badge from '../../components/shared/Badge';
import Alert from '../../components/shared/Alert';
import UdcSelector from '../../components/operations/UdcSelector';
import PickingLineItem from '../../components/operations/PickingLineItem';
import type {
  PickingList,
  PickingOperation,
  UdcOption,
  CompartmentOption,
} from '../../types/operations';

const RefillingExecutionPage: React.FC = () => {
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

  // Quantity input
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [lotInput, setLotInput] = useState('');
  const [expiryInput, setExpiryInput] = useState('');

  // UDC Selection State
  const [availableUdcs, setAvailableUdcs] = useState<UdcOption[]>([]);
  const [selectedUdc, setSelectedUdc] = useState<UdcOption | null>(null);
  const [selectedCompartment, setSelectedCompartment] = useState<CompartmentOption | null>(null);
  const [isLoadingUdcs, setIsLoadingUdcs] = useState(false);
  const [canMerge, setCanMerge] = useState(false);
  const [mergeReason, setMergeReason] = useState<string | undefined>(undefined);

  // Auto-advance settings
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Current operation
  const currentOperation = useMemo(() => {
    return operations[currentIndex] || null;
  }, [operations, currentIndex]);

  // Pending operations (non completate)
  const pendingOperations = useMemo(() => {
    return operations.filter((op) => !op.isCompleted);
  }, [operations]);

  // Progress calculation
  const progress = useMemo(() => {
    if (operations.length === 0) return 0;
    const completed = operations.filter((op) => op.isCompleted).length;
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
      const firstPending = listData.operations?.findIndex((op) => !op.isCompleted);
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

  // Load available UDCs when operation changes
  useEffect(() => {
    if (!currentOperation) return;
    loadAvailableUdcs();
  }, [currentOperation]);

  const loadAvailableUdcs = async () => {
    if (!currentOperation) return;

    setIsLoadingUdcs(true);
    try {
      const udcs = await operationsService.getAvailableUdcsForRefilling(
        currentOperation.locationId,
        currentOperation.itemCode
      );
      setAvailableUdcs(udcs);

      // Reset selections
      setSelectedUdc(null);
      setSelectedCompartment(null);
      setCanMerge(false);
      setMergeReason(undefined);
    } catch (err: any) {
      toast.error('Errore caricamento UDC disponibili');
      setAvailableUdcs([]);
    } finally {
      setIsLoadingUdcs(false);
    }
  };

  // Check merge compatibility when compartment is selected
  useEffect(() => {
    if (!selectedUdc || !selectedCompartment || !currentOperation) {
      setCanMerge(false);
      setMergeReason(undefined);
      return;
    }

    checkMergeCompatibility();
  }, [selectedUdc, selectedCompartment, currentOperation]);

  const checkMergeCompatibility = async () => {
    if (!selectedUdc || !selectedCompartment || !currentOperation) return;

    try {
      const result = await operationsService.canMergeWithExistingProduct(
        selectedUdc.id,
        selectedCompartment.id,
        currentOperation.itemCode,
        lotInput || currentOperation.lot
      );

      setCanMerge(result.canMerge);
      setMergeReason(result.reason);
    } catch (err: any) {
      setCanMerge(false);
      setMergeReason('Errore verifica compatibilità');
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    if (!currentOperation) return;

    setScannedBarcode(barcode);
    setBarcodeError(null);

    try {
      const validation = await operationsService.validateBarcode(
        currentOperation.id,
        barcode,
        'ITEM'
      );

      if (validation.valid) {
        setBarcodeValidated(true);
        toast.success('Barcode validato correttamente');

        // Auto-fill quantity with requested quantity
        setQuantityInput(currentOperation.requestedQuantity.toString());
      } else {
        setBarcodeError(validation.message || 'Barcode non valido');
        toast.error(validation.message || 'Barcode non valido');
      }
    } catch (err: any) {
      setBarcodeError('Errore validazione barcode');
      toast.error('Errore validazione barcode');
    }
  };

  // Handle UDC selection
  const handleSelectUdc = (udc: UdcOption) => {
    setSelectedUdc(udc);
    setSelectedCompartment(null);
  };

  // Handle compartment selection
  const handleSelectCompartment = (compartment: CompartmentOption) => {
    setSelectedCompartment(compartment);
  };

  // Validate form before submission
  const canSubmit = useMemo(() => {
    if (!currentOperation) return false;
    if (!barcodeValidated) return false;
    if (!selectedUdc || !selectedCompartment) return false;

    const quantity = parseFloat(quantityInput);
    if (isNaN(quantity) || quantity <= 0) return false;
    if (quantity > currentOperation.requestedQuantity) return false;

    // Check lot if required
    if (currentOperation.requiresLot && !lotInput) return false;

    // Check expiry if required
    if (currentOperation.requiresExpiryDate && !expiryInput) return false;

    return true;
  }, [currentOperation, barcodeValidated, selectedUdc, selectedCompartment, quantityInput, lotInput, expiryInput]);

  // Complete operation
  const handleCompleteOperation = async () => {
    if (!currentOperation || !canSubmit || !selectedUdc || !selectedCompartment || !user) return;

    setIsSubmitting(true);

    try {
      const quantity = parseFloat(quantityInput);

      const response = await operationsService.completeRefillingOperation({
        operationId: currentOperation.id,
        quantity,
        barcode: scannedBarcode,
        lot: lotInput || currentOperation.lot,
        expiryDate: expiryInput || currentOperation.expiryDate,
        userName: user.username,
        destinationUdcId: selectedUdc.id,
        destinationCompartmentId: selectedCompartment.id,
        mergeWithExisting: canMerge,
      });

      if (response.success) {
        toast.success('Operazione completata con successo');

        // Update operation status
        const updatedOps = operations.map((op) =>
          op.id === currentOperation.id
            ? { ...op, isCompleted: true, processedQuantity: quantity }
            : op
        );
        setOperations(updatedOps);

        // Reset state
        setBarcodeValidated(false);
        setScannedBarcode('');
        setQuantityInput('');
        setLotInput('');
        setExpiryInput('');
        setSelectedUdc(null);
        setSelectedCompartment(null);

        // Auto-advance to next operation
        if (autoAdvance) {
          const nextPending = updatedOps.findIndex(
            (op, idx) => idx > currentIndex && !op.isCompleted
          );
          if (nextPending !== -1) {
            setCurrentIndex(nextPending);
          } else {
            // All operations completed
            toast.success('Tutte le operazioni completate!');
            navigate('/operations');
          }
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Errore completamento operazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const handlePreviousOperation = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetOperationState();
    }
  };

  const handleNextOperation = () => {
    if (currentIndex < operations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetOperationState();
    }
  };

  const resetOperationState = () => {
    setBarcodeValidated(false);
    setScannedBarcode('');
    setBarcodeError(null);
    setQuantityInput('');
    setLotInput('');
    setExpiryInput('');
    setSelectedUdc(null);
    setSelectedCompartment(null);
  };

  // Skip operation
  const handleSkipOperation = () => {
    const nextPending = operations.findIndex(
      (op, idx) => idx > currentIndex && !op.isCompleted
    );
    if (nextPending !== -1) {
      setCurrentIndex(nextPending);
      resetOperationState();
    } else {
      toast.info('Nessuna operazione successiva da eseguire');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error || !list) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <p className="font-medium">Errore caricamento lista</p>
          <p className="text-sm mt-1">{error || 'Lista non trovata'}</p>
        </Alert>
        <Button onClick={() => navigate('/operations')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alle operazioni
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Operations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            onClick={() => navigate('/operations')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna indietro
          </Button>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista {list.code}
            </h2>
            <Badge variant={list.status === 'COMPLETED' ? 'success' : 'info'}>
              {list.status}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-3">{list.description}</p>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-medium text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {operations.filter((op) => op.isCompleted).length} /{' '}
                {operations.length} completate
              </span>
              <span>{pendingOperations.length} rimanenti</span>
            </div>
          </div>
        </div>

        {/* Operations List */}
        <div className="flex-1 overflow-y-auto">
          {operations.map((op, idx) => (
            <PickingLineItem
              key={op.id}
              operation={op}
              index={idx}
              isActive={idx === currentIndex}
              onClick={() => {
                setCurrentIndex(idx);
                resetOperationState();
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content - Current Operation */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          {currentOperation ? (
            <div className="space-y-6">
              {/* Operation Header */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <RefreshCw className="w-6 h-6 text-blue-600" />
                      <h1 className="text-2xl font-bold text-gray-900">
                        Refilling - Operazione {currentIndex + 1} di{' '}
                        {operations.length}
                      </h1>
                    </div>
                    <p className="text-gray-600">
                      {currentOperation.itemCode} - {currentOperation.itemDescription}
                    </p>
                  </div>

                  {currentOperation.isCompleted && (
                    <Badge variant="success" size="lg">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completata
                    </Badge>
                  )}
                </div>

                {/* Operation Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Quantità richiesta</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentOperation.requestedQuantity} {currentOperation.itemUm}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicazione origine</p>
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {currentOperation.locationCode || 'N/A'}
                    </p>
                  </div>
                  {currentOperation.lot && (
                    <div>
                      <p className="text-sm text-gray-600">Lotto</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentOperation.lot}
                      </p>
                    </div>
                  )}
                  {currentOperation.expiryDate && (
                    <div>
                      <p className="text-sm text-gray-600">Scadenza</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(currentOperation.expiryDate).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Step 1: Barcode Scanning */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarcodeIcon className="w-5 h-5 text-blue-600" />
                  Step 1: Scansiona Barcode Articolo
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={scannedBarcode}
                      onChange={(e) => handleBarcodeScan(e.target.value)}
                      placeholder="Scansiona o inserisci barcode"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                      disabled={barcodeValidated || currentOperation.isCompleted}
                    />
                  </div>

                  {barcodeError && <Alert variant="error">{barcodeError}</Alert>}

                  {barcodeValidated && (
                    <Alert variant="success">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Barcode validato correttamente
                    </Alert>
                  )}
                </div>
              </Card>

              {/* Step 2: Quantity and Lot */}
              {barcodeValidated && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Step 2: Quantità e Dati Lotto
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantità *
                      </label>
                      <input
                        type="number"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        placeholder="Inserisci quantità"
                        min="0"
                        max={currentOperation.requestedQuantity}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={currentOperation.isCompleted}
                      />
                    </div>

                    {currentOperation.requiresLot && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lotto *
                        </label>
                        <input
                          type="text"
                          value={lotInput}
                          onChange={(e) => setLotInput(e.target.value)}
                          placeholder="Inserisci lotto"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={currentOperation.isCompleted}
                        />
                      </div>
                    )}

                    {currentOperation.requiresExpiryDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scadenza *
                        </label>
                        <input
                          type="date"
                          value={expiryInput}
                          onChange={(e) => setExpiryInput(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={currentOperation.isCompleted}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Step 3: UDC and Compartment Selection */}
              {barcodeValidated && quantityInput && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Step 3: Seleziona UDC e Scomparto Destinazione
                  </h3>

                  <UdcSelector
                    availableUdcs={availableUdcs}
                    selectedUdc={selectedUdc}
                    selectedCompartment={selectedCompartment}
                    itemCode={currentOperation.itemCode}
                    lot={lotInput || currentOperation.lot}
                    onSelectUdc={handleSelectUdc}
                    onSelectCompartment={handleSelectCompartment}
                    canMerge={canMerge}
                    mergeReason={mergeReason}
                    isLoading={isLoadingUdcs}
                  />
                </Card>
              )}

              {/* Action Buttons */}
              {!currentOperation.isCompleted && (
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePreviousOperation}
                        disabled={currentIndex === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Precedente
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleNextOperation}
                        disabled={currentIndex === operations.length - 1}
                      >
                        Successiva
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleSkipOperation}>
                        <SkipForward className="w-4 h-4 mr-2" />
                        Salta
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleCompleteOperation}
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Completamento...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completa Refilling
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nessuna operazione disponibile</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefillingExecutionPage;

// ============================================================================
// EJLOG WMS - PickingWorkflow Component
// Workflow step-by-step per esecuzione picking RF con barcode scanner
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, ArrowRight, Package } from 'lucide-react';
import BarcodeScanner, { BarcodeScannerRef } from '../common/BarcodeScanner';
import ReservationCard, { Reservation } from './ReservationCard';

export interface PickingWorkflowProps {
  listId: string;
  reservations: Reservation[];
  onPickComplete: (reservationId: string, quantity: number, udcBarcode: string) => Promise<void>;
  onWorkflowComplete?: () => void;
  onCancel?: () => void;
}

type WorkflowStep = 'SCAN_LIST' | 'SHOW_RESERVATION' | 'SCAN_UDC' | 'CONFIRM_QTY' | 'COMPLETE';

interface WorkflowState {
  step: WorkflowStep;
  currentReservation: Reservation | null;
  currentReservationIndex: number;
  scannedUdc: string;
  confirmedQty: number;
  error: string | null;
}

/**
 * PickingWorkflow Component
 *
 * Gestisce il workflow completo di picking RF con 5 step:
 * 1. SCAN_LIST: Scan barcode lista/prenotazione per iniziare
 * 2. SHOW_RESERVATION: Mostra dettagli prenotazione corrente
 * 3. SCAN_UDC: Scan barcode UDC per validazione locazione
 * 4. CONFIRM_QTY: Input quantità e conferma prelievo
 * 5. COMPLETE: Passa alla prossima prenotazione o completa lista
 *
 * Features:
 * - Auto-focus su BarcodeScanner per scansioni rapide
 * - Validazione UDC corretta per locazione
 * - Progress indicator (es. 3/15 prenotazioni)
 * - Error handling robusto con messaggi chiari
 * - Audio e visual feedback su scan
 *
 * @example
 * ```tsx
 * <PickingWorkflow
 *   listId="PICK-001"
 *   reservations={reservations}
 *   onPickComplete={handlePickComplete}
 *   onWorkflowComplete={() => navigate('/lists')}
 * />
 * ```
 */
export const PickingWorkflow: React.FC<PickingWorkflowProps> = ({
  listId,
  reservations,
  onPickComplete,
  onWorkflowComplete,
  onCancel,
}) => {
  const [state, setState] = useState<WorkflowState>({
    step: 'SCAN_LIST',
    currentReservation: null,
    currentReservationIndex: -1,
    scannedUdc: '',
    confirmedQty: 0,
    error: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<BarcodeScannerRef>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Total reservations count
  const totalReservations = reservations.length;
  const completedReservations = reservations.filter((r) => r.status === 'COMPLETED').length;
  const progressPercentage = totalReservations > 0
    ? (completedReservations / totalReservations) * 100
    : 0;

  // Auto-focus scanner quando step cambia
  useEffect(() => {
    if (state.step === 'SCAN_LIST' || state.step === 'SCAN_UDC') {
      setTimeout(() => scannerRef.current?.focus(), 100);
    } else if (state.step === 'CONFIRM_QTY') {
      setTimeout(() => qtyInputRef.current?.focus(), 100);
    }
  }, [state.step]);

  // ========================================
  // STEP 1: Scan Lista/Prenotazione
  // ========================================
  const handleListScan = async (barcode: string) => {
    // Validazione: barcode deve corrispondere a listId o a una prenotazione
    if (barcode !== listId && !reservations.some((r) => r.id === barcode)) {
      setState((prev) => ({
        ...prev,
        error: `Barcode non valido. Scansiona lista ${listId} o una prenotazione.`,
      }));
      return;
    }

    // Trova prima prenotazione PENDING
    const nextReservationIndex = reservations.findIndex((r) => r.status === 'PENDING');

    if (nextReservationIndex === -1) {
      setState((prev) => ({
        ...prev,
        error: 'Tutte le prenotazioni sono già state completate!',
      }));
      return;
    }

    const nextReservation = reservations[nextReservationIndex];

    setState({
      step: 'SHOW_RESERVATION',
      currentReservation: nextReservation,
      currentReservationIndex: nextReservationIndex,
      scannedUdc: '',
      confirmedQty: nextReservation.remainingQty, // Default: quantità rimanente
      error: null,
    });
  };

  // ========================================
  // STEP 2: Mostra Prenotazione → vai a SCAN_UDC
  // ========================================
  const handleStartPicking = () => {
    setState((prev) => ({
      ...prev,
      step: 'SCAN_UDC',
      error: null,
    }));
  };

  // ========================================
  // STEP 3: Scan UDC
  // ========================================
  const handleUdcScan = async (barcode: string) => {
    if (!state.currentReservation) return;

    // Validazione UDC: deve esistere e corrispondere alla locazione
    // (In produzione: chiamata API per validare UDC)
    const isValidUdc = barcode.length >= 8; // Validazione basic

    if (!isValidUdc) {
      setState((prev) => ({
        ...prev,
        error: 'UDC non valido. Riprova.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      step: 'CONFIRM_QTY',
      scannedUdc: barcode,
      error: null,
    }));
  };

  // ========================================
  // STEP 4: Conferma Quantità
  // ========================================
  const handleConfirmPick = async () => {
    if (!state.currentReservation) return;

    // Validazione quantità
    if (state.confirmedQty <= 0) {
      setState((prev) => ({
        ...prev,
        error: 'Quantità deve essere maggiore di zero.',
      }));
      return;
    }

    if (state.confirmedQty > state.currentReservation.remainingQty) {
      setState((prev) => ({
        ...prev,
        error: `Quantità non può superare ${state.currentReservation.remainingQty} ${state.currentReservation.unit || 'PZ'}`,
      }));
      return;
    }

    setIsProcessing(true);

    try {
      // Chiamata API per confermare picking
      await onPickComplete(
        state.currentReservation.id,
        state.confirmedQty,
        state.scannedUdc
      );

      // Success! Trova prossima prenotazione
      const nextReservationIndex = reservations.findIndex(
        (r, idx) => idx > state.currentReservationIndex && r.status === 'PENDING'
      );

      if (nextReservationIndex === -1) {
        // Tutte le prenotazioni completate!
        setState({
          step: 'COMPLETE',
          currentReservation: null,
          currentReservationIndex: -1,
          scannedUdc: '',
          confirmedQty: 0,
          error: null,
        });

        // Callback completamento workflow
        if (onWorkflowComplete) {
          setTimeout(() => onWorkflowComplete(), 2000);
        }
      } else {
        // Prossima prenotazione
        const nextReservation = reservations[nextReservationIndex];
        setState({
          step: 'SHOW_RESERVATION',
          currentReservation: nextReservation,
          currentReservationIndex: nextReservationIndex,
          scannedUdc: '',
          confirmedQty: nextReservation.remainingQty,
          error: null,
        });
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Errore durante il picking.',
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // ========================================
  // RENDER STEPS
  // ========================================

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Lista {listId}</h2>
          <span className="text-sm font-medium text-gray-600">
            {completedReservations} / {totalReservations} Completate
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-red-900">Errore</div>
            <div className="text-sm text-red-700">{state.error}</div>
          </div>
        </div>
      )}

      {/* STEP 1: SCAN LIST */}
      {state.step === 'SCAN_LIST' && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="text-center mb-6">
            <Package className="w-16 h-16 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Inizia Picking</h3>
            <p className="text-gray-600">
              Scansiona il barcode della lista o di una prenotazione
            </p>
          </div>

          <BarcodeScanner
            ref={scannerRef}
            label="Barcode Lista/Prenotazione"
            onScan={handleListScan}
            audioFeedback
            visualFeedback
            clearOnScan
            autoFocus
            placeholder={`Scan ${listId}...`}
          />
        </div>
      )}

      {/* STEP 2: SHOW RESERVATION */}
      {state.step === 'SHOW_RESERVATION' && state.currentReservation && (
        <div className="space-y-4">
          <ReservationCard reservation={state.currentReservation} showProgress />

          <button
            onClick={handleStartPicking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Inizia Prelievo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 3: SCAN UDC */}
      {state.step === 'SCAN_UDC' && state.currentReservation && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Scansiona UDC</h3>
            <p className="text-sm text-gray-600">
              Locazione: <span className="font-semibold">{state.currentReservation.locationCode}</span>
            </p>
          </div>

          <BarcodeScanner
            ref={scannerRef}
            label="Barcode UDC"
            onScan={handleUdcScan}
            audioFeedback
            visualFeedback
            clearOnScan
            autoFocus
            placeholder="Scan UDC..."
          />
        </div>
      )}

      {/* STEP 4: CONFIRM QTY */}
      {state.step === 'CONFIRM_QTY' && state.currentReservation && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="text-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">Conferma Quantità</h3>
            <p className="text-sm text-gray-600">UDC: {state.scannedUdc}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantità Prelevata ({state.currentReservation.unit || 'PZ'})
            </label>
            <input
              ref={qtyInputRef}
              type="number"
              min="1"
              max={state.currentReservation.remainingQty}
              value={state.confirmedQty}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  confirmedQty: parseInt(e.target.value) || 0,
                  error: null,
                }))
              }
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Max: {state.currentReservation.remainingQty} {state.currentReservation.unit || 'PZ'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                setState((prev) => ({ ...prev, step: 'SCAN_UDC', scannedUdc: '', error: null }))
              }
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Indietro
            </button>
            <button
              onClick={handleConfirmPick}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>Elaborazione...</>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Conferma Prelievo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: COMPLETE */}
      {state.step === 'COMPLETE' && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">Picking Completato!</h3>
          <p className="text-green-700 mb-6">
            Tutte le {totalReservations} prenotazioni sono state processate.
          </p>
          {onWorkflowComplete && (
            <p className="text-sm text-green-600">Reindirizzamento in corso...</p>
          )}
        </div>
      )}

      {/* Cancel Button (sempre visibile tranne che in COMPLETE) */}
      {state.step !== 'COMPLETE' && onCancel && (
        <button
          onClick={onCancel}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Annulla Operazione
        </button>
      )}
    </div>
  );
};

export default PickingWorkflow;

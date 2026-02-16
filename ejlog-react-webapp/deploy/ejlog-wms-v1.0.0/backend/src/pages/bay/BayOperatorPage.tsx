// ============================================================================
// EJLOG WMS - Bay Operator Page
// Pagina principale Baia Operatore con guidance real-time
// ============================================================================

import { FC, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../services/websocket';
import { useBarcodeScanner, ScannerType } from '../../hooks/useBarcodeScanner';
import {
  Reservation,
  Guidance,
  GuidanceStep,
  ConfirmOperationRequest,
  getActiveReservations,
  getGuidance,
  confirmOperation,
  completeReservation,
  setOperatorReady,
  reportIssue,
} from '../../services/api/bayApi';
import { GuidancePanel } from '../../components/bay/GuidancePanel';
import { ReservationQueue } from '../../components/bay/ReservationQueue';
import toast from 'react-hot-toast';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Keyboard,
  RefreshCw,
} from 'lucide-react';

/**
 * Baia Operatore - Pagina principale
 *
 * Funzionalità:
 * - Guidance step-by-step con istruzioni visive
 * - Scansione barcode (USB scanner o camera)
 * - Real-time updates via WebSocket
 * - Coda prenotazioni live
 * - Audio/visual feedback
 * - Gestione errori e assistenza
 */
export const BayOperatorPage: FC = () => {
  // State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperatorReady, setIsOperatorReady] = useState(false);
  const [bayId] = useState(1); // TODO: get from user session
  const [operatorId] = useState(1); // TODO: get from user session

  // WebSocket
  const ws = useWebSocket();

  // Barcode scanner with beep
  const { state: scannerState, actions: scannerActions } = useBarcodeScanner({
    onScan: handleBarcodeScan,
    minLength: 6,
    beep: true,
    enabled: isOperatorReady && !!activeReservation,
  });

  /**
   * Carica prenotazioni iniziali
   */
  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getActiveReservations(bayId);
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Errore caricamento prenotazioni');
    } finally {
      setIsLoading(false);
    }
  }, [bayId]);

  /**
   * Carica guidance per prenotazione attiva
   */
  const loadGuidance = useCallback(async (reservationId: number) => {
    try {
      const data = await getGuidance(reservationId);
      setGuidance(data);
    } catch (error) {
      console.error('Error loading guidance:', error);
      toast.error('Errore caricamento guidance');
    }
  }, []);

  /**
   * Gestione scan barcode
   */
  async function handleBarcodeScan(barcode: string, type: ScannerType) {
    if (!activeReservation || !guidance) {
      toast.error('Nessuna operazione attiva');
      return;
    }

    // Trova step corrente
    const currentStep = guidance.steps.find((s) => s.status === 'ACTIVE');
    if (!currentStep) {
      toast.error('Nessuno step attivo');
      return;
    }

    console.log('[Bay] Barcode scanned:', { barcode, type, step: currentStep.stepNumber });

    // Valida barcode atteso
    if (currentStep.expectedBarcode && currentStep.expectedBarcode !== barcode) {
      toast.error(
        `Codice errato! Atteso: ${currentStep.expectedBarcode}, Scansionato: ${barcode}`
      );
      playErrorSound();
      return;
    }

    // Conferma operazione
    try {
      const request: ConfirmOperationRequest = {
        reservationId: activeReservation.id,
        stepId: currentStep.id,
        barcode,
      };

      const response = await confirmOperation(request);

      if (response.success) {
        toast.success(response.message || 'Operazione confermata!');
        playSuccessSound();

        // Aggiorna guidance
        if (response.guidance) {
          setGuidance(response.guidance);
        }

        // Se completato, chiudi operazione
        if (response.completed) {
          handleCompleteReservation();
        }
      } else {
        toast.error(response.message || 'Errore conferma operazione');
        playErrorSound();
      }
    } catch (error) {
      console.error('Error confirming operation:', error);
      toast.error('Errore durante conferma operazione');
      playErrorSound();
    }
  }

  /**
   * Completa prenotazione corrente
   */
  const handleCompleteReservation = useCallback(async () => {
    if (!activeReservation) return;

    try {
      const response = await completeReservation({
        reservationId: activeReservation.id,
      });

      if (response.success) {
        toast.success('✅ Operazione completata con successo!');
        playSuccessSound();

        // Reset stato
        setActiveReservation(null);
        setGuidance(null);

        // Ricarica prenotazioni
        await loadReservations();

        // Se c'è prossima prenotazione, caricala
        if (response.nextReservation) {
          setActiveReservation(response.nextReservation);
          await loadGuidance(response.nextReservation.id);
        }
      }
    } catch (error) {
      console.error('Error completing reservation:', error);
      toast.error('Errore completamento operazione');
    }
  }, [activeReservation, loadReservations, loadGuidance]);

  /**
   * Segna operatore come pronto
   */
  const handleOperatorReady = useCallback(async () => {
    try {
      const nextReservation = await setOperatorReady(bayId, operatorId);

      setIsOperatorReady(true);
      toast.success('Operatore pronto! 🚀');

      if (nextReservation) {
        setActiveReservation(nextReservation);
        await loadGuidance(nextReservation.id);
      }
    } catch (error) {
      console.error('Error setting operator ready:', error);
      toast.error('Errore attivazione operatore');
    }
  }, [bayId, operatorId, loadGuidance]);

  /**
   * Pausa operatore
   */
  const handleOperatorPause = useCallback(() => {
    setIsOperatorReady(false);
    toast('Operatore in pausa', { icon: '⏸️' });
  }, []);

  /**
   * Segnala problema
   */
  const handleReportIssue = useCallback(async () => {
    if (!activeReservation || !guidance) return;

    const currentStep = guidance.steps.find((s) => s.status === 'ACTIVE');
    if (!currentStep) return;

    const description = prompt('Descrivi il problema:');
    if (!description) return;

    try {
      await reportIssue(activeReservation.id, currentStep.id, {
        type: 'OPERATOR_ISSUE',
        description,
        severity: 'MEDIUM',
      });

      toast.success('Problema segnalato, supervisor notificato');
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Errore segnalazione problema');
    }
  }, [activeReservation, guidance]);

  /**
   * Audio feedback
   */
  function playSuccessSound() {
    // Beep successo (già gestito dal barcode scanner)
    // Aggiungi qui ulteriori feedback se necessario
  }

  function playErrorSound() {
    // Beep errore (due beep corti)
    const audioContext = new AudioContext();
    [0, 0.2].forEach((delay) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400; // Tono più basso per errore
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + delay + 0.1
      );

      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + 0.1);
    });
  }

  /**
   * Setup WebSocket listeners
   */
  useEffect(() => {
    ws.connect();

    // New reservation assigned
    const cleanupNewReservation = ws.on('bay:new-reservation', (reservation: Reservation) => {
      console.log('[Bay] New reservation:', reservation);
      setReservations((prev) => [...prev, reservation]);
      toast('Nuova prenotazione assegnata', { icon: '📦' });
    });

    // Guidance update
    const cleanupGuidanceUpdate = ws.on('bay:guidance-update', (updatedGuidance: Guidance) => {
      console.log('[Bay] Guidance update:', updatedGuidance);
      setGuidance(updatedGuidance);
    });

    // Operation complete
    const cleanupOperationComplete = ws.on('bay:operation-complete', (data: any) => {
      console.log('[Bay] Operation complete:', data);
      toast.success('✅ Operazione completata!');
      playSuccessSound();
    });

    return () => {
      cleanupNewReservation();
      cleanupGuidanceUpdate();
      cleanupOperationComplete();
      ws.disconnect();
    };
  }, [ws]);

  /**
   * Load initial data
   */
  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Baia Operatore
              </h1>
              <p className="text-sm text-gray-500">
                Baia #{bayId} • Operatore #{operatorId}
              </p>
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-3">
              {/* Operator ready toggle */}
              {!isOperatorReady ? (
                <button
                  onClick={handleOperatorReady}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Inizia Operazioni
                </button>
              ) : (
                <button
                  onClick={handleOperatorPause}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-lg shadow-lg"
                >
                  <Pause className="w-5 h-5" />
                  Pausa
                </button>
              )}

              {/* Report issue */}
              {activeReservation && (
                <button
                  onClick={handleReportIssue}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium shadow-lg"
                  title="Segnala problema"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Problema
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={loadReservations}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-lg"
                title="Ricarica prenotazioni"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Scanner status */}
        {isOperatorReady && (
          <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="font-semibold text-blue-900">
                  Scanner Attivo
                </span>
                {scannerState.buffer && (
                  <span className="font-mono text-sm text-blue-700">
                    Scansione: {scannerState.buffer}...
                  </span>
                )}
              </div>

              {/* Scanner type indicator */}
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Keyboard className="w-4 h-4" />
                <span>Scanner USB</span>
                <button
                  onClick={scannerActions.startCamera}
                  className="ml-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
                >
                  <Camera className="w-3 h-3" />
                  Camera
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guidance Panel - 2/3 width */}
          <div className="lg:col-span-2">
            <GuidancePanel guidance={guidance} isLoading={isLoading && !!activeReservation} />
          </div>

          {/* Reservation Queue - 1/3 width */}
          <div className="lg:col-span-1">
            <ReservationQueue
              reservations={reservations}
              activeReservationId={activeReservation?.id}
              onReservationSelect={(reservation) => {
                setActiveReservation(reservation);
                loadGuidance(reservation.id);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Stats footer */}
        {scannerState.scanCount > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Scansioni effettuate: <strong>{scannerState.scanCount}</strong>
              </div>
              {scannerState.lastScan && (
                <div>
                  Ultima scansione: <strong className="font-mono">{scannerState.lastScan}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BayOperatorPage;

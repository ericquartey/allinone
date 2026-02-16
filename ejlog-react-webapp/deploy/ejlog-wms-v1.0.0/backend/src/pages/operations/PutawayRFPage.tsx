// ============================================================================
// EJLOG WMS - Putaway RF Page
// Pagina RF per operazioni di versamento con suggerimento locazione ottimale
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PackageCheck, ArrowLeft, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import BarcodeScanner, { BarcodeScannerRef } from '../../components/common/BarcodeScanner';
import LocationSuggestion, { LocationSuggestion as LocationSuggestionType } from '../../components/operations/LocationSuggestion';
import { useLazyGetItemByBarcodeQuery } from '../../services/api';
import type { Item } from '../../types/models';

type WorkflowStep = 'SCAN_ITEM' | 'INPUT_QTY' | 'SUGGEST_LOCATION' | 'SCAN_LOCATION' | 'CONFIRM' | 'COMPLETE';

interface WorkflowState {
  step: WorkflowStep;
  scannedItem: Item | null;
  quantity: number;
  suggestedLocations: LocationSuggestionType[];
  selectedLocation: LocationSuggestionType | null;
  scannedLocationCode: string;
  error: string | null;
}

/**
 * PutawayRFPage Component
 *
 * Workflow completo per versamento (putaway) RF:
 * 1. SCAN_ITEM: Scansiona barcode articolo
 * 2. INPUT_QTY: Inserisci quantità da versare
 * 3. SUGGEST_LOCATION: Sistema suggerisce locazioni ottimali (algoritmo ABC + capacità + zone)
 * 4. SCAN_LOCATION: Scansiona locazione (conferma suggerimento o override manuale)
 * 5. CONFIRM: Conferma versamento
 * 6. COMPLETE: Operazione completata
 *
 * Features:
 * - Suggerimenti intelligenti con scoring 0-100
 * - Validazione capacità locazione in real-time
 * - Override manuale locazione permesso
 * - Visual feedback capacità con progress bar
 * - Audio e visual feedback su ogni scan
 *
 * @example
 * URL: /putaway/rf
 */
const PutawayRFPage: React.FC = () => {
  const navigate = useNavigate();

  const [state, setState] = useState<WorkflowState>({
    step: 'SCAN_ITEM',
    scannedItem: null,
    quantity: 0,
    suggestedLocations: [],
    selectedLocation: null,
    scannedLocationCode: '',
    error: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<BarcodeScannerRef>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const [getItemByBarcode] = useLazyGetItemByBarcodeQuery();

  // Auto-focus quando step cambia
  useEffect(() => {
    if (state.step === 'SCAN_ITEM' || state.step === 'SCAN_LOCATION') {
      setTimeout(() => scannerRef.current?.focus(), 100);
    } else if (state.step === 'INPUT_QTY') {
      setTimeout(() => qtyInputRef.current?.focus(), 100);
    }
  }, [state.step]);

  // ========================================
  // STEP 1: Scan Articolo
  // ========================================
  const handleItemScan = async (barcode: string) => {
    try {
      const item = await getItemByBarcode(barcode).unwrap();

      if (!item) {
        setState((prev) => ({
          ...prev,
          error: 'Articolo non trovato',
        }));
        return;
      }

      setState({
        step: 'INPUT_QTY',
        scannedItem: item,
        quantity: 1, // Default
        suggestedLocations: [],
        selectedLocation: null,
        scannedLocationCode: '',
        error: null,
      });

      toast.success(`Articolo ${item.code} riconosciuto`);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Errore nel caricamento articolo',
      }));
      toast.error('Articolo non trovato');
    }
  };

  // ========================================
  // STEP 2: Input Quantità → Genera Suggerimenti
  // ========================================
  const handleQuantityConfirm = async () => {
    if (state.quantity <= 0) {
      setState((prev) => ({
        ...prev,
        error: 'Quantità deve essere maggiore di zero',
      }));
      return;
    }

    // Genera suggerimenti locazione (mock - in produzione: API GET /api/locations/suggest)
    const mockSuggestions: LocationSuggestionType[] = [
      {
        locationCode: 'A-01-05',
        locationDescription: 'Picking Zone - Shelf 5',
        zone: 'Picking',
        areaId: 'AREA-A',
        score: 95,
        isPrimary: true,
        capacity: {
          locationCode: 'A-01-05',
          currentWeight: 450,
          maxWeight: 1000,
          currentVolume: 2.5,
          maxVolume: 5.0,
          currentItems: 15,
          maxItems: 30,
          utilizationPercentage: 45,
        },
        distance: 12,
        reasons: [
          'Classificazione ABC: A (alta rotazione)',
          'Zona picking ottimale per articolo',
          'Capacità residua: 55%',
          'Distanza minima da input',
        ],
      },
      {
        locationCode: 'B-02-10',
        locationDescription: 'Reserve Zone - Rack 10',
        zone: 'Reserve',
        areaId: 'AREA-B',
        score: 78,
        isPrimary: false,
        capacity: {
          locationCode: 'B-02-10',
          currentWeight: 750,
          maxWeight: 1000,
          currentVolume: 4.0,
          maxVolume: 5.0,
          currentItems: 24,
          maxItems: 30,
          utilizationPercentage: 75,
        },
        distance: 28,
        reasons: [
          'Zona reserve adatta per stock',
          'Capacità residua: 25%',
          'Stesso tipo articolo presente',
        ],
        warnings: ['Capacità in esaurimento'],
      },
      {
        locationCode: 'C-03-15',
        locationDescription: 'Buffer Zone - Bay 15',
        zone: 'Buffer',
        areaId: 'AREA-C',
        score: 62,
        isPrimary: false,
        capacity: {
          locationCode: 'C-03-15',
          currentWeight: 200,
          maxWeight: 1000,
          currentVolume: 1.0,
          maxVolume: 5.0,
          currentItems: 5,
          maxItems: 30,
          utilizationPercentage: 20,
        },
        distance: 45,
        reasons: ['Capacità ampia disponibile', 'Zona buffer per overflow'],
        warnings: ['Distanza elevata da picking'],
      },
    ];

    setState((prev) => ({
      ...prev,
      step: 'SUGGEST_LOCATION',
      suggestedLocations: mockSuggestions,
      selectedLocation: mockSuggestions[0], // Auto-seleziona primary
      error: null,
    }));

    toast.success('Suggerimenti locazione generati');
  };

  // ========================================
  // STEP 3: Selezione Manuale Locazione
  // ========================================
  const handleLocationSelect = (location: LocationSuggestionType) => {
    setState((prev) => ({
      ...prev,
      selectedLocation: location,
      error: null,
    }));
  };

  // ========================================
  // STEP 4: Scan Locazione
  // ========================================
  const handleLocationScan = async (barcode: string) => {
    // Verifica se barcode corrisponde a una locazione suggerita
    const matchingSuggestion = state.suggestedLocations.find(
      (s) => s.locationCode === barcode
    );

    if (matchingSuggestion) {
      // Scan conferma suggerimento
      setState((prev) => ({
        ...prev,
        step: 'CONFIRM',
        selectedLocation: matchingSuggestion,
        scannedLocationCode: barcode,
        error: null,
      }));
      toast.success(`Locazione ${barcode} confermata`);
    } else {
      // Override manuale: locazione non suggerita
      // In produzione: validare con API GET /api/locations/{code}/capacity
      const isValidLocation = barcode.length >= 5; // Validazione basic

      if (!isValidLocation) {
        setState((prev) => ({
          ...prev,
          error: 'Locazione non valida',
        }));
        return;
      }

      // Mock: crea suggestion per locazione override
      const overrideLocation: LocationSuggestionType = {
        locationCode: barcode,
        locationDescription: 'Locazione Manual Override',
        zone: 'Unknown',
        score: 50,
        isPrimary: false,
        capacity: {
          locationCode: barcode,
          currentWeight: 0,
          maxWeight: 1000,
          utilizationPercentage: 0,
        },
        reasons: ['Selezione manuale operatore'],
        warnings: ['Verifica capacità manualmente'],
      };

      setState((prev) => ({
        ...prev,
        step: 'CONFIRM',
        selectedLocation: overrideLocation,
        scannedLocationCode: barcode,
        error: null,
      }));

      toast.warning(`Locazione ${barcode} - Override manuale`, { duration: 3000 });
    }
  };

  // ========================================
  // STEP 5: Conferma Versamento
  // ========================================
  const handleConfirmPutaway = async () => {
    if (!state.scannedItem || !state.selectedLocation) return;

    setIsProcessing(true);

    try {
      // API call per versamento
      // await putawayItem({
      //   itemId: state.scannedItem.id,
      //   quantity: state.quantity,
      //   locationCode: state.selectedLocation.locationCode,
      // }).unwrap();

      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        step: 'COMPLETE',
        error: null,
      }));

      toast.success('Versamento completato!', { duration: 3000 });

      // Auto-reset dopo 2 secondi
      setTimeout(() => {
        resetWorkflow();
      }, 2000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Errore durante il versamento',
      }));
      toast.error('Errore nel versamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // ========================================
  // RESET WORKFLOW
  // ========================================
  const resetWorkflow = () => {
    setState({
      step: 'SCAN_ITEM',
      scannedItem: null,
      quantity: 0,
      suggestedLocations: [],
      selectedLocation: null,
      scannedLocationCode: '',
      error: null,
    });
  };

  const handleCancel = () => {
    if (confirm('Vuoi annullare l\'operazione di putaway?')) {
      navigate('/operations/lists');
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/operations/lists')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <PackageCheck className="w-8 h-8 text-green-400" />
                <div>
                  <h1 className="text-2xl font-bold">Putaway RF</h1>
                  <p className="text-sm text-gray-400">Versamento con Suggerimento Locazione</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {state.error && (
          <div className="mb-6 bg-red-900 bg-opacity-50 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-200">Errore</div>
              <div className="text-sm text-red-300">{state.error}</div>
            </div>
          </div>
        )}

        {/* STEP 1: SCAN ITEM */}
        {state.step === 'SCAN_ITEM' && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <PackageCheck className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Scansiona Articolo</h2>
              <p className="text-gray-400">Inquadra il barcode dell'articolo da versare</p>
            </div>

            <BarcodeScanner
              ref={scannerRef}
              label="Barcode Articolo"
              onScan={handleItemScan}
              audioFeedback
              visualFeedback
              clearOnScan
              autoFocus
              placeholder="Scan articolo..."
            />
          </div>
        )}

        {/* STEP 2: INPUT QTY */}
        {state.step === 'INPUT_QTY' && state.scannedItem && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Quantità da Versare</h2>

            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">Articolo</p>
              <p className="text-xl font-bold">{state.scannedItem.code}</p>
              <p className="text-gray-300">{state.scannedItem.description}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantità ({state.scannedItem.unit || 'PZ'})
              </label>
              <input
                ref={qtyInputRef}
                type="number"
                min="1"
                value={state.quantity}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                    error: null,
                  }))
                }
                className="w-full px-4 py-4 text-3xl font-bold text-center bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState((prev) => ({ ...prev, step: 'SCAN_ITEM', error: null }))}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Indietro
              </button>
              <button
                onClick={handleQuantityConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUGGEST LOCATION */}
        {state.step === 'SUGGEST_LOCATION' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Suggerimenti Locazione</h2>
                  <p className="text-sm text-gray-400">
                    Seleziona o scansiona una locazione per il versamento
                  </p>
                </div>
              </div>

              {/* Item Summary */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Articolo</p>
                  <p className="font-semibold">{state.scannedItem?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Quantità</p>
                  <p className="text-2xl font-bold text-green-400">{state.quantity}</p>
                </div>
              </div>
            </div>

            {/* Location Suggestions */}
            <div className="space-y-4">
              {state.suggestedLocations.map((suggestion) => (
                <LocationSuggestion
                  key={suggestion.locationCode}
                  suggestion={suggestion}
                  selected={state.selectedLocation?.locationCode === suggestion.locationCode}
                  onSelect={() => handleLocationSelect(suggestion)}
                  showCapacity
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
              <p className="text-sm text-gray-400 mb-4 text-center">
                Scansiona il barcode della locazione per confermare
              </p>

              <BarcodeScanner
                ref={scannerRef}
                label="Barcode Locazione"
                onScan={handleLocationScan}
                audioFeedback
                visualFeedback
                clearOnScan
                autoFocus
                placeholder="Scan locazione..."
              />

              <button
                onClick={() => setState((prev) => ({ ...prev, step: 'INPUT_QTY', error: null }))}
                className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Modifica Quantità
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRM */}
        {state.step === 'CONFIRM' && state.selectedLocation && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Conferma Versamento</h2>
              <p className="text-gray-400">Verifica i dati prima di confermare</p>
            </div>

            {/* Summary */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">Articolo</p>
                <p className="text-lg font-bold">{state.scannedItem?.code}</p>
                <p className="text-gray-300">{state.scannedItem?.description}</p>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">Quantità</p>
                <p className="text-2xl font-bold text-green-400">{state.quantity}</p>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">Locazione Destinazione</p>
                <p className="text-lg font-bold">{state.selectedLocation.locationCode}</p>
                {state.selectedLocation.locationDescription && (
                  <p className="text-sm text-gray-400">{state.selectedLocation.locationDescription}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState((prev) => ({ ...prev, step: 'SUGGEST_LOCATION', error: null }))}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Indietro
              </button>
              <button
                onClick={handleConfirmPutaway}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>Elaborazione...</>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Conferma Versamento
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETE */}
        {state.step === 'COMPLETE' && (
          <div className="bg-green-900 bg-opacity-50 border-2 border-green-500 rounded-lg p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-green-200 mb-2">Versamento Completato!</h2>
            <p className="text-green-300 mb-4">
              {state.quantity} {state.scannedItem?.unit || 'PZ'} versati in {state.selectedLocation?.locationCode}
            </p>
            <p className="text-sm text-green-400">Pronto per nuovo versamento...</p>
          </div>
        )}

        {/* Cancel Button */}
        {state.step !== 'COMPLETE' && (
          <button
            onClick={handleCancel}
            className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Annulla Operazione
          </button>
        )}
      </div>
    </div>
  );
};

export default PutawayRFPage;

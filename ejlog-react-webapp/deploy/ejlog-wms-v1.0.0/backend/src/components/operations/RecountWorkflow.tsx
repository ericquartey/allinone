// ============================================================================
// EJLOG WMS - RecountWorkflow Component
// Workflow guidato per riconteggio articoli con discrepanze
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import BarcodeScanner, { BarcodeScannerRef } from '../common/BarcodeScanner';

export interface RecountItem {
  itemCode: string;
  itemDescription: string;
  location: string;
  originalCount: number;
  systemQty: number;
  unit?: string;
}

export interface RecountWorkflowProps {
  item: RecountItem;
  onComplete: (newCount: number) => void;
  onCancel: () => void;
}

type RecountStep = 'SCAN_ITEM' | 'INPUT_COUNT' | 'CONFIRM';

/**
 * RecountWorkflow Component
 *
 * Workflow guidato per riconteggio articolo con discrepanza:
 * 1. SCAN_ITEM: Scansiona articolo per conferma identità
 * 2. INPUT_COUNT: Inserisci nuovo conteggio manuale
 * 3. CONFIRM: Conferma e confronta con conteggio precedente
 *
 * Features:
 * - Validazione barcode articolo
 * - Confronto conteggio 1 vs conteggio 2
 * - Warning se ancora differenza significativa
 * - Audio/visual feedback
 * - Help inline per operatore
 *
 * @example
 * ```tsx
 * <RecountWorkflow
 *   item={{
 *     itemCode: 'ART-001',
 *     originalCount: 45,
 *     systemQty: 50,
 *     location: 'A-01-05'
 *   }}
 *   onComplete={(newCount) => handleRecountComplete(newCount)}
 *   onCancel={() => setShowRecount(false)}
 * />
 * ```
 */
export const RecountWorkflow: React.FC<RecountWorkflowProps> = ({
  item,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<RecountStep>('SCAN_ITEM');
  const [newCount, setNewCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<BarcodeScannerRef>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus
  useEffect(() => {
    if (step === 'SCAN_ITEM') {
      setTimeout(() => scannerRef.current?.focus(), 100);
    } else if (step === 'INPUT_COUNT') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  // ========================================
  // STEP 1: Scan Item for Verification
  // ========================================
  const handleItemScan = async (barcode: string) => {
    // Verifica che barcode corrisponda all'articolo
    if (barcode !== item.itemCode) {
      setError(`Articolo errato. Previsto: ${item.itemCode}`);
      return;
    }

    setStep('INPUT_COUNT');
    setError(null);
  };

  // ========================================
  // STEP 2: Input New Count
  // ========================================
  const handleInputConfirm = () => {
    if (newCount < 0) {
      setError('Quantità non può essere negativa');
      return;
    }

    setStep('CONFIRM');
    setError(null);
  };

  // ========================================
  // STEP 3: Confirm Recount
  // ========================================
  const handleFinalConfirm = () => {
    onComplete(newCount);
  };

  // Calcola differenze
  const diff1 = item.originalCount - item.systemQty; // Primo conteggio vs sistema
  const diff2 = newCount - item.systemQty; // Riconteggio vs sistema
  const recountDiff = newCount - item.originalCount; // Riconteggio vs primo conteggio

  const isDifferenceResolved = Math.abs(diff2) < Math.abs(diff1);

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Riconteggio Articolo</h2>
            <p className="text-sm text-blue-100">Verifica e conferma quantità</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Item Info Box */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="font-semibold text-lg text-gray-900 mb-1">{item.itemCode}</div>
          <div className="text-sm text-gray-600 mb-2">{item.itemDescription}</div>
          <div className="text-xs text-gray-500">Locazione: {item.location}</div>
        </div>

        {/* Previous Counts Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-xs text-blue-600 mb-1">Sistema</div>
            <div className="text-2xl font-bold text-blue-900">
              {item.systemQty} {item.unit || 'PZ'}
            </div>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="text-xs text-orange-600 mb-1">Conteggio 1</div>
            <div className="text-2xl font-bold text-orange-900">
              {item.originalCount} {item.unit || 'PZ'}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Diff: {diff1 > 0 ? '+' : ''}{diff1}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-500 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* STEP 1: SCAN ITEM */}
        {step === 'SCAN_ITEM' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 1: Verifica Articolo
              </h3>
              <p className="text-sm text-gray-600">
                Scansiona il barcode dell'articolo per confermare l'identità
              </p>
            </div>

            <BarcodeScanner
              ref={scannerRef}
              label={`Scansiona: ${item.itemCode}`}
              onScan={handleItemScan}
              audioFeedback
              visualFeedback
              clearOnScan
              autoFocus
              placeholder={`Scan ${item.itemCode}...`}
            />

            <button
              onClick={onCancel}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors"
            >
              Annulla Riconteggio
            </button>
          </div>
        )}

        {/* STEP 2: INPUT COUNT */}
        {step === 'INPUT_COUNT' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 2: Nuovo Conteggio
              </h3>
              <p className="text-sm text-gray-600">
                Conta nuovamente l'articolo e inserisci la quantità trovata
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantità Riconteggiata ({item.unit || 'PZ'})
              </label>
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={newCount}
                onChange={(e) => {
                  setNewCount(parseInt(e.target.value) || 0);
                  setError(null);
                }}
                className="w-full px-4 py-4 text-3xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('SCAN_ITEM')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Indietro
              </button>
              <button
                onClick={handleInputConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Continua
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 'CONFIRM' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Step 3: Conferma Riconteggio
              </h3>
              <p className="text-sm text-gray-600">
                Verifica i dati prima di confermare
              </p>
            </div>

            {/* Comparison Table */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Fonte</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Quantità</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 font-medium text-gray-900">Sistema</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {item.systemQty} {item.unit || 'PZ'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">-</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-orange-50">
                    <td className="px-4 py-3 font-medium text-gray-900">Conteggio 1</td>
                    <td className="px-4 py-3 text-right text-orange-900 font-semibold">
                      {item.originalCount} {item.unit || 'PZ'}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      diff1 > 0 ? 'text-green-600' : diff1 < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {diff1 > 0 ? '+' : ''}{diff1}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-blue-50">
                    <td className="px-4 py-3 font-medium text-gray-900">Riconteggio</td>
                    <td className="px-4 py-3 text-right text-blue-900 font-bold text-lg">
                      {newCount} {item.unit || 'PZ'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold text-lg ${
                      diff2 > 0 ? 'text-green-600' : diff2 < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {diff2 > 0 ? '+' : ''}{diff2}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Difference Analysis */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Analisi Riconteggio:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Differenza Conteggio 1:</span>
                  <span className={`font-semibold ${
                    diff1 > 0 ? 'text-green-600' : diff1 < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {diff1 > 0 ? '+' : ''}{diff1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Differenza Riconteggio:</span>
                  <span className={`font-semibold ${
                    diff2 > 0 ? 'text-green-600' : diff2 < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {diff2 > 0 ? '+' : ''}{diff2}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-700 font-medium">Scostamento tra conteggi:</span>
                  <span className={`font-bold ${
                    recountDiff > 0 ? 'text-green-600' : recountDiff < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {recountDiff > 0 ? '+' : ''}{recountDiff}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning if Still Different */}
            {!isDifferenceResolved && Math.abs(diff2) > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Attenzione:</strong> La discrepanza persiste.
                  Considera un ulteriore riconteggio o verifica il sistema.
                </div>
              </div>
            )}

            {/* Success if Resolved */}
            {isDifferenceResolved && (
              <div className="p-3 bg-green-50 border border-green-300 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <strong>Ottimo!</strong> La discrepanza è stata ridotta con il riconteggio.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('INPUT_COUNT')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Modifica Conteggio
              </button>
              <button
                onClick={handleFinalConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Conferma Riconteggio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecountWorkflow;

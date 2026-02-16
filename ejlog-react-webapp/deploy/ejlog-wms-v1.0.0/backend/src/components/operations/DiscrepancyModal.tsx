// ============================================================================
// EJLOG WMS - DiscrepancyModal Component
// Modal per gestione discrepanze inventario con workflow autorizzazione
// ============================================================================

import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

export interface InventoryDiscrepancy {
  itemCode: string;
  itemDescription: string;
  location: string;
  systemQty: number;
  countedQty: number;
  discrepancy: number; // Differenza (counted - system)
  discrepancyPercentage: number; // Percentuale di scostamento
  value?: number; // Valore economico discrepanza (€)
  unit?: string;
  requiresRecount?: boolean; // Se discrepanza > soglia
  requiresAuthorization?: boolean; // Se valore alto
}

export interface DiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  discrepancies: InventoryDiscrepancy[];
  onRecount: (itemCode: string) => void;
  onApprove: (itemCode: string, notes?: string) => void;
  onReject: (itemCode: string) => void;
  canAuthorize?: boolean; // Se utente può autorizzare (supervisore)
}

/**
 * DiscrepancyModal Component
 *
 * Modal per gestire discrepanze inventario con:
 * - Lista discrepanze con dettagli (sistema vs conteggio)
 * - Calcolo automatico scostamento % e valore €
 * - Richiesta riconteggio per discrepanze alte
 * - Workflow autorizzazione supervisore per valori alti
 * - Note e motivazioni
 * - Color coding (rosso = grave, giallo = attenzione, verde = ok)
 *
 * Soglie:
 * - Discrepanza > 10%: Richiede riconteggio
 * - Valore > 1000€: Richiede autorizzazione supervisore
 *
 * @example
 * ```tsx
 * <DiscrepancyModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   discrepancies={discrepancyList}
 *   onRecount={handleRecount}
 *   onApprove={handleApprove}
 *   canAuthorize={user.isSupervisor}
 * />
 * ```
 */
export const DiscrepancyModal: React.FC<DiscrepancyModalProps> = ({
  isOpen,
  onClose,
  discrepancies,
  onRecount,
  onApprove,
  onReject,
  canAuthorize = false,
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  // Statistiche discrepanze
  const totalDiscrepancies = discrepancies.length;
  const criticalDiscrepancies = discrepancies.filter(
    (d) => Math.abs(d.discrepancyPercentage) > 10 || (d.value && Math.abs(d.value) > 1000)
  ).length;
  const totalValue = discrepancies.reduce((sum, d) => sum + Math.abs(d.value || 0), 0);

  const getSeverityColor = (discrepancy: InventoryDiscrepancy) => {
    const absPercentage = Math.abs(discrepancy.discrepancyPercentage);
    const absValue = Math.abs(discrepancy.value || 0);

    if (absPercentage > 20 || absValue > 5000) return 'bg-red-100 border-red-500 text-red-900';
    if (absPercentage > 10 || absValue > 1000) return 'bg-yellow-100 border-yellow-500 text-yellow-900';
    return 'bg-green-100 border-green-500 text-green-900';
  };

  const getSeverityIcon = (discrepancy: InventoryDiscrepancy) => {
    const absPercentage = Math.abs(discrepancy.discrepancyPercentage);

    if (absPercentage > 10) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Discrepanze Inventario</h2>
              <p className="text-sm text-gray-600">
                {totalDiscrepancies} discrepanze trovate - {criticalDiscrepancies} critiche
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalDiscrepancies}</div>
              <div className="text-sm text-gray-600">Totale Discrepanze</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalDiscrepancies}</div>
              <div className="text-sm text-gray-600">Critiche</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">€{totalValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Valore Totale</div>
            </div>
          </div>
        </div>

        {/* Discrepancies List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {discrepancies.map((discrepancy) => (
            <div
              key={`${discrepancy.itemCode}-${discrepancy.location}`}
              className={`border-2 rounded-lg p-4 ${getSeverityColor(discrepancy)}`}
            >
              {/* Item Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(discrepancy)}
                  <div className="flex-1">
                    <div className="font-bold text-lg">{discrepancy.itemCode}</div>
                    <div className="text-sm opacity-80">{discrepancy.itemDescription}</div>
                    <div className="text-xs opacity-70 mt-1">
                      Locazione: {discrepancy.location}
                    </div>
                  </div>
                </div>

                {/* Discrepancy Indicator */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    {discrepancy.discrepancy > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-2xl font-bold">
                      {discrepancy.discrepancy > 0 ? '+' : ''}
                      {discrepancy.discrepancy}
                    </span>
                  </div>
                  <div className="text-sm opacity-80">
                    {discrepancy.discrepancyPercentage > 0 ? '+' : ''}
                    {discrepancy.discrepancyPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Quantities Comparison */}
              <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-white bg-opacity-50 rounded">
                <div>
                  <div className="text-xs opacity-70 mb-1">Sistema</div>
                  <div className="text-lg font-semibold">
                    {discrepancy.systemQty} {discrepancy.unit || 'PZ'}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-1">Conteggio</div>
                  <div className="text-lg font-semibold">
                    {discrepancy.countedQty} {discrepancy.unit || 'PZ'}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-1">Valore</div>
                  <div className="text-lg font-semibold">
                    €{Math.abs(discrepancy.value || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {discrepancy.requiresRecount && (
                <div className="mb-3 p-2 bg-yellow-200 bg-opacity-50 rounded flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-yellow-800">
                    <strong>Riconteggio richiesto:</strong> Discrepanza superiore alla soglia del 10%
                  </span>
                </div>
              )}

              {discrepancy.requiresAuthorization && (
                <div className="mb-3 p-2 bg-red-200 bg-opacity-50 rounded flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-800">
                    <strong>Autorizzazione supervisore richiesta:</strong> Valore discrepanza {'>'} €1000
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {discrepancy.requiresRecount && (
                  <button
                    onClick={() => onRecount(discrepancy.itemCode)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Riconteggio
                  </button>
                )}

                {discrepancy.requiresAuthorization ? (
                  canAuthorize ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedItem(discrepancy.itemCode);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approva
                      </button>
                      <button
                        onClick={() => onReject(discrepancy.itemCode)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Rifiuta
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 p-2 bg-orange-200 text-orange-800 text-sm rounded text-center">
                      In attesa autorizzazione supervisore
                    </div>
                  )
                ) : (
                  !discrepancy.requiresRecount && (
                    <button
                      onClick={() => onApprove(discrepancy.itemCode)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Conferma Discrepanza
                    </button>
                  )
                )}
              </div>

              {/* Notes Input for Authorization */}
              {selectedItem === discrepancy.itemCode && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Autorizzazione
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder="Inserisci motivazione autorizzazione..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        onApprove(discrepancy.itemCode, notes);
                        setSelectedItem(null);
                        setNotes('');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold"
                    >
                      Conferma Approvazione
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        setNotes('');
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1.5 rounded text-sm font-semibold"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancyModal;

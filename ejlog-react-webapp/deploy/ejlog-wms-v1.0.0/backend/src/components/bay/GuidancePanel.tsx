// ============================================================================
// EJLOG WMS - Guidance Panel Component
// Pannello guidance step-by-step per operatore baia
// ============================================================================

import { FC, useMemo } from 'react';
import {
  Guidance,
  GuidanceStep,
  GuidanceStepStatus,
  calculateProgress,
} from '../../services/api/bayApi';
import { CheckCircle, Circle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface GuidancePanelProps {
  guidance: Guidance | null;
  isLoading?: boolean;
  onStepClick?: (step: GuidanceStep) => void;
}

/**
 * Pannello guidance per operatore baia
 *
 * Mostra:
 * - Step corrente con istruzioni dettagliate
 * - Progress bar
 * - Lista step completati/pendenti
 * - Visual aids (immagini/icone)
 * - Location da raggiungere
 */
export const GuidancePanel: FC<GuidancePanelProps> = ({
  guidance,
  isLoading = false,
  onStepClick,
}) => {
  // Calcola progresso
  const progress = useMemo(() => {
    return guidance ? calculateProgress(guidance) : 0;
  }, [guidance]);

  // Step corrente
  const currentStep = useMemo(() => {
    if (!guidance) return null;
    return guidance.steps.find((s) => s.status === GuidanceStepStatus.ACTIVE);
  }, [guidance]);

  // Rendering vuoto
  if (!guidance && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Circle className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nessuna operazione attiva
        </h3>
        <p className="text-gray-500">
          In attesa di assegnazione prenotazione
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!guidance) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">
            Operazione in Corso
          </h2>
          <span className="text-2xl font-bold">
            {progress}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-blue-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 text-sm text-blue-100">
          Step {guidance.currentStep} di {guidance.totalSteps}
        </div>
      </div>

      {/* Current Step - Large and Prominent */}
      {currentStep && (
        <div className="p-6 border-b-4 border-blue-500">
          {/* Step number badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
              {currentStep.stepNumber}
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                Step Corrente
              </div>
              <div className="text-xs text-gray-400">
                {currentStep.requiresScan && '🔍 Richiede scansione'}
                {currentStep.requiresConfirmation && ' • ✓ Richiede conferma'}
              </div>
            </div>
          </div>

          {/* Main instruction - LARGE */}
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 mb-4">
            <div className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
              {currentStep.instruction}
            </div>
            {currentStep.instructionEn && (
              <div className="text-lg text-gray-600 italic mt-2">
                {currentStep.instructionEn}
              </div>
            )}
          </div>

          {/* Location highlight */}
          {currentStep.location && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 text-yellow-900 rounded-lg px-4 py-2 font-bold text-2xl">
                  📍
                </div>
                <div>
                  <div className="text-sm text-yellow-800 font-medium uppercase tracking-wide">
                    Posizione
                  </div>
                  <div className="text-3xl font-bold text-yellow-900">
                    {currentStep.location}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expected barcode */}
          {currentStep.expectedBarcode && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">
                Codice atteso:
              </div>
              <div className="font-mono text-xl font-bold text-gray-900">
                {currentStep.expectedBarcode}
              </div>
            </div>
          )}

          {/* Expected quantity */}
          {currentStep.expectedQuantity && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">
                Quantità attesa:
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {currentStep.expectedQuantity} <span className="text-lg text-gray-500">pz</span>
              </div>
            </div>
          )}

          {/* Visual aid */}
          {currentStep.visualAid && (
            <div className="mb-4">
              <img
                src={currentStep.visualAid}
                alt="Visual guidance"
                className="rounded-lg border-2 border-gray-300 max-h-64 mx-auto"
              />
            </div>
          )}
        </div>
      )}

      {/* Steps timeline */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Tutti gli Step
        </h3>

        <div className="space-y-2">
          {guidance.steps.map((step, index) => {
            const isActive = step.status === GuidanceStepStatus.ACTIVE;
            const isCompleted = step.status === GuidanceStepStatus.COMPLETED;
            const isError = step.status === GuidanceStepStatus.ERROR;
            const isPending = step.status === GuidanceStepStatus.PENDING;

            return (
              <div
                key={step.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isActive ? 'border-blue-500 bg-blue-50 shadow-md scale-105' : ''}
                  ${isCompleted ? 'border-green-300 bg-green-50 opacity-75' : ''}
                  ${isError ? 'border-red-300 bg-red-50' : ''}
                  ${isPending ? 'border-gray-200 bg-gray-50 opacity-60' : ''}
                  hover:shadow-sm
                `}
                onClick={() => onStepClick?.(step)}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                  {isActive && (
                    <ArrowRight className="w-6 h-6 text-blue-600 animate-pulse" />
                  )}
                  {isError && (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  {isPending && (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`
                        text-sm font-bold
                        ${isActive ? 'text-blue-700' : ''}
                        ${isCompleted ? 'text-green-700' : ''}
                        ${isError ? 'text-red-700' : ''}
                        ${isPending ? 'text-gray-500' : ''}
                      `}
                    >
                      {step.stepNumber}.
                    </span>
                    <span
                      className={`
                        text-sm truncate
                        ${isActive ? 'text-blue-900 font-semibold' : ''}
                        ${isCompleted ? 'text-green-800 line-through' : ''}
                        ${isError ? 'text-red-800' : ''}
                        ${isPending ? 'text-gray-600' : ''}
                      `}
                    >
                      {step.instruction}
                    </span>
                  </div>

                  {step.location && (
                    <div className="text-xs text-gray-500 mt-1">
                      📍 {step.location}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {isCompleted && step.completedAt && (
                    <div className="text-xs text-green-600">
                      {new Date(step.completedAt).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  {isActive && (
                    <div className="text-xs text-blue-600 font-semibold uppercase">
                      In corso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with tips */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Suggerimento:</strong> Segui attentamente le istruzioni e
            scansiona i codici quando richiesto per procedere automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidancePanel;

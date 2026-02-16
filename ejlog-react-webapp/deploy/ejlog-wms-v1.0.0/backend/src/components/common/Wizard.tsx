// ============================================================================
// EJLOG WMS - Wizard Component
// Multi-step wizard con navigazione, validazione, progress tracking
// ============================================================================

import React, { useState, ReactNode, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import Button from './Button';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
  canSkip?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  onComplete: (data?: any) => void | Promise<void>;
  onCancel?: () => void;
  initialStep?: number;
  showStepNumbers?: boolean;
  allowStepNavigation?: boolean;
  verticalLayout?: boolean;
  completeBtnText?: string;
  nextBtnText?: string;
  prevBtnText?: string;
  cancelBtnText?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * Wizard Component
 *
 * Wizard multi-step per processi guidati:
 * - Navigazione tra step (Avanti/Indietro)
 * - Validazione per step
 * - Progress bar visuale
 * - Step attivi/completati/disabilitati
 * - Salto step opzionale
 * - Supporto async validation
 * - Riepilogo finale (opzionale)
 *
 * @example
 * ```tsx
 * const steps: WizardStep[] = [
 *   {
 *     id: 'info',
 *     title: 'Basic Info',
 *     content: <StepOneForm />,
 *     validate: async () => validateStep1()
 *   },
 *   {
 *     id: 'details',
 *     title: 'Details',
 *     content: <StepTwoForm />
 *   },
 *   {
 *     id: 'review',
 *     title: 'Review',
 *     content: <ReviewStep />
 *   }
 * ];
 *
 * <Wizard
 *   steps={steps}
 *   onComplete={handleComplete}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export default function Wizard({
  steps,
  onComplete,
  onCancel,
  initialStep = 0,
  showStepNumbers = true,
  allowStepNavigation = false,
  verticalLayout = false,
  completeBtnText = 'Complete',
  nextBtnText = 'Next',
  prevBtnText = 'Back',
  cancelBtnText = 'Cancel',
  className,
  'data-testid': dataTestId,
}: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [validating, setValidating] = useState(false);
  const [completing, setCompleting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  /**
   * Validate current step
   */
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!currentStep.validate) return true;

    setValidating(true);
    try {
      const isValid = await currentStep.validate();
      return isValid;
    } catch (error) {
      console.error('Step validation error:', error);
      return false;
    } finally {
      setValidating(false);
    }
  }, [currentStep]);

  /**
   * Go to next step
   */
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      // Could show toast notification here
      console.warn('Validation failed for current step');
      return;
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  /**
   * Go to previous step
   */
  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  /**
   * Jump to specific step (if allowed)
   */
  const handleStepClick = async (index: number) => {
    if (!allowStepNavigation) return;
    if (index === currentStepIndex) return;

    // Can only navigate to completed steps or next immediate step
    if (index < currentStepIndex || completedSteps.has(index - 1)) {
      setCurrentStepIndex(index);
    }
  };

  /**
   * Complete wizard
   */
  const handleComplete = async () => {
    // Validate last step
    const isValid = await validateCurrentStep();
    if (!isValid) {
      console.warn('Validation failed for final step');
      return;
    }

    setCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Wizard completion error:', error);
    } finally {
      setCompleting(false);
    }
  };

  /**
   * Get step status
   */
  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' | 'disabled' => {
    if (completedSteps.has(index)) return 'completed';
    if (index === currentStepIndex) return 'current';
    if (index < currentStepIndex) return 'completed';
    if (!allowStepNavigation && index > currentStepIndex + 1) return 'disabled';
    return 'upcoming';
  };

  /**
   * Render step indicator
   */
  const renderStepIndicator = (step: WizardStep, index: number) => {
    const status = getStepStatus(index);
    const isClickable = allowStepNavigation && (status === 'completed' || status === 'current');

    const stepNumber = index + 1;

    return (
      <div
        key={step.id}
        className={twMerge(
          'flex items-center',
          verticalLayout ? 'flex-col' : 'flex-row',
          isClickable && 'cursor-pointer'
        )}
        onClick={() => handleStepClick(index)}
        data-testid={`${dataTestId}-step-indicator-${index}`}
      >
        {/* Step Circle */}
        <div className="flex items-center">
          <div
            className={twMerge(
              'flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all',
              status === 'completed' && 'bg-green-500 border-green-500 text-white',
              status === 'current' && 'bg-ferrRed border-ferrRed text-white',
              status === 'upcoming' && 'bg-white border-gray-300 text-gray-500',
              status === 'disabled' && 'bg-gray-100 border-gray-200 text-gray-400'
            )}
          >
            {status === 'completed' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : step.icon ? (
              step.icon
            ) : showStepNumbers ? (
              stepNumber
            ) : null}
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={twMerge(
                verticalLayout ? 'h-12 w-0.5 ml-5' : 'w-12 h-0.5 mx-2',
                status === 'completed' || status === 'current' ? 'bg-ferrRed' : 'bg-gray-300'
              )}
            />
          )}
        </div>

        {/* Step Label */}
        <div className={twMerge('ml-3', verticalLayout && 'mt-2')}>
          <p
            className={twMerge(
              'text-sm font-medium',
              status === 'current' && 'text-ferrRed',
              status === 'completed' && 'text-green-600',
              (status === 'upcoming' || status === 'disabled') && 'text-gray-500'
            )}
          >
            {step.title}
          </p>
          {step.description && (
            <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={twMerge('space-y-8', className)} data-testid={dataTestId}>
      {/* Step Indicators */}
      <div className={twMerge('flex', verticalLayout ? 'flex-col space-y-4' : 'items-center justify-center')}>
        {steps.map((step, index) => renderStepIndicator(step, index))}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-ferrRed h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <div
        className="min-h-[400px] bg-white border border-gray-200 rounded-lg p-6"
        data-testid={`${dataTestId}-step-content`}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{currentStep.title}</h2>
          {currentStep.description && (
            <p className="text-gray-600 mt-2">{currentStep.description}</p>
          )}
        </div>

        <div>{currentStep.content}</div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={validating || completing}
              data-testid={`${dataTestId}-cancel-btn`}
            >
              {cancelBtnText}
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={validating || completing}
              data-testid={`${dataTestId}-prev-btn`}
            >
              {prevBtnText}
            </Button>
          )}

          {isLastStep ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              loading={completing}
              disabled={validating}
              data-testid={`${dataTestId}-complete-btn`}
            >
              {completeBtnText}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              loading={validating}
              disabled={completing}
              data-testid={`${dataTestId}-next-btn`}
            >
              {nextBtnText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

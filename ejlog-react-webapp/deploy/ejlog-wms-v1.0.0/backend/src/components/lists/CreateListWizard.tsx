import { useState } from 'react';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

/**
 * CreateListWizard - Wizard 3-step per creazione nuova lista
 *
 * Step 1: Selezione tipo lista (Picking/Refilling/Inventory)
 * Step 2: Configurazione (description, priority, assignedTo)
 * Step 3: Review e conferma
 *
 * Features:
 * - Navigazione: Avanti, Indietro, Annulla, Conferma
 * - Validation: Required fields per ogni step
 * - Visual feedback per step attivo
 */
function CreateListWizard({  isOpen, onClose, onConfirm  }: any): JSX.Element {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    listType: null,
    description: '',
    priority: 'MEDIUM',
    assignedTo: '',
  });

  const [errors, setErrors] = useState({});

  // Reset wizard quando chiude
  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      listType: null,
      description: '',
      priority: 'MEDIUM',
      assignedTo: '',
    });
    setErrors({});
    onClose();
  };

  // Step 1: Selezione tipo lista
  const listTypes = [
    {
      value: 0,
      label: 'Picking',
      description: 'Lista di prelievo articoli dal magazzino',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      value: 1,
      label: 'Refilling',
      description: 'Lista di rifornimento ubicazioni',
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500',
    },
    {
      value: 2,
      label: 'Inventory',
      description: 'Lista inventario fisico',
      icon: CubeIcon,
      color: 'bg-purple-500',
    },
  ];

  const handleSelectListType = (type) => {
    setFormData(prev => ({ ...prev, listType: type }));
    setErrors(prev => ({ ...prev, listType: null }));
  };

  // Validazione Step 1
  const validateStep1 = () => {
    if (formData.listType === null) {
      setErrors({ listType: 'Seleziona un tipo di lista' });
      toast.error('Seleziona un tipo di lista per continuare');
      return false;
    }
    return true;
  };

  // Validazione Step 2
  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrizione obbligatoria';
    }

    if (!formData.assignedTo.trim()) {
      newErrors.assignedTo = 'Operatore assegnato obbligatorio';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Compila tutti i campi obbligatori');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(formData);
      toast.success('Lista creata con successo');
      handleClose();
    } catch (error) {
      toast.error('Errore durante la creazione della lista');
      console.error('Error creating list:', error);
    }
  };

  const getSelectedListType = () => {
    return listTypes.find(type => type.value === formData.listType);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Crea Nuova Lista - Step ${currentStep}/3`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-ferretto-red border-ferretto-red text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {currentStep > step ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-ferretto-red' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Seleziona Tipo Lista */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Seleziona Tipo Lista
                </h3>
                <p className="text-gray-600 text-sm">
                  Scegli il tipo di lista che vuoi creare
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {listTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.listType === type.value;

                  return (
                    <button
                      key={type.value}
                      onClick={() => handleSelectListType(type.value)}
                      className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-ferretto-red bg-red-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`p-3 rounded-full ${type.color} bg-opacity-10`}>
                          <Icon className={`w-8 h-8 ${type.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-lg text-gray-900">
                            {type.label}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {type.description}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircleIcon className="w-6 h-6 text-ferretto-red" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {errors.listType && (
                <p className="text-red-600 text-sm mt-2">{errors.listType}</p>
              )}
            </div>
          )}

          {/* Step 2: Configura Lista */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Configura Lista
                </h3>
                <p className="text-gray-600 text-sm">
                  Inserisci i dettagli della lista
                </p>
              </div>

              <div className="space-y-4">
                {/* Descrizione */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Descrizione <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    id="wizard-description"
                    name="wizard-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Es. Lista picking magazzino A - Cliente XYZ"
                    className="w-full"
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Priorità */}
                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Priorità
                  </label>
                  <select
                    id="wizard-priority"
                    name="wizard-priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, priority: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                  >
                    <option value="LOW">Bassa</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>

                {/* Operatore Assegnato */}
                <div>
                  <label
                    htmlFor="assignedTo"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Operatore Assegnato <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    id="wizard-assignedTo"
                    name="wizard-assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, assignedTo: e.target.value }))
                    }
                    placeholder="Nome operatore"
                    className="w-full"
                  />
                  {errors.assignedTo && (
                    <p className="text-red-600 text-sm mt-1">{errors.assignedTo}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Riepilogo e Conferma */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Riepilogo e Conferma
                </h3>
                <p className="text-gray-600 text-sm">
                  Verifica i dati e conferma la creazione
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Tipo Lista</div>
                    <div className="font-semibold text-gray-900">
                      Tipo: {getSelectedListType()?.label}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Priorità</div>
                    <div className="font-semibold text-gray-900">
                      {formData.priority === 'HIGH' && 'Alta'}
                      {formData.priority === 'MEDIUM' && 'Media'}
                      {formData.priority === 'LOW' && 'Bassa'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Descrizione</div>
                  <div className="font-semibold text-gray-900">{formData.description}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Operatore Assegnato</div>
                  <div className="font-semibold text-gray-900">{formData.assignedTo}</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">
                      Pronto per la creazione
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Cliccando su "Conferma e Crea", la lista verrà creata nel sistema
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handlePrevious}>
                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                Indietro
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Annulla
            </Button>

            {currentStep < 3 ? (
              <Button variant="primary" onClick={handleNext}>
                Avanti
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="success" onClick={handleConfirm}>
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Conferma e Crea
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CreateListWizard;

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ListPromptOption {
  value: string | number;
  label: string;
}

export interface ListPromptModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  inputLabel: string;
  inputType?: 'text' | 'number' | 'select';
  options?: ListPromptOption[];
  defaultValue?: string | number;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export const ListPromptModal = ({
  isOpen,
  title,
  description,
  inputLabel,
  inputType = 'text',
  options = [],
  defaultValue,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  onConfirm,
  onClose
}: ListPromptModalProps): JSX.Element | null => {
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue !== undefined ? String(defaultValue) : '');
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-ferretto-dark">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}

          <label className="block text-sm font-medium text-gray-700 mb-1">{inputLabel}</label>
          {inputType === 'select' ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Seleziona...</option>
              {options.map(option => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-ferretto-red rounded-md hover:bg-ferretto-red-dark"
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

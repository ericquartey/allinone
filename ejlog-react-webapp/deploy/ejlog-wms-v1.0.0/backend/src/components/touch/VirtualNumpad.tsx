// ============================================================================
// EJLOG WMS - Virtual Numpad Component
// Tastierino numerico virtuale per touch mode
// Design touch-friendly con tasti grandi e feedback visivo
// ============================================================================

import React from 'react';
import { BackspaceIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VirtualNumpadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  maxLength?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  title?: string;
}

/**
 * Virtual Numpad Component
 * Tastierino numerico virtuale ottimizzato per touch mode
 *
 * Features:
 * - Layout 3x4 classico (1-9, 0, backspace, .)
 * - Tasti grandi touch-friendly (min 60px)
 * - Supporto numeri decimali e negativi opzionale
 * - Feedback visivo su pressione
 * - Modale full-screen per max usabilità
 */
const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  value,
  onChange,
  onClose,
  maxLength = 10,
  allowDecimal = false,
  allowNegative = false,
  title = 'Inserisci numero',
}) => {
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === 'clear') {
      onChange('');
      return;
    }

    if (key === '+/-' && allowNegative) {
      if (value.startsWith('-')) {
        onChange(value.slice(1));
      } else {
        onChange('-' + value);
      }
      return;
    }

    if (key === '.' && allowDecimal) {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
      return;
    }

    // Controllo lunghezza massima
    if (value.length >= maxLength) return;

    // Aggiungi cifra
    onChange(value + key);
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [allowNegative ? '+/-' : 'C', '0', allowDecimal ? '.' : '⌫'],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fadeIn">
      {/* Numpad container */}
      <div className="bg-white w-full max-w-full rounded-t-3xl shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            <XMarkIcon className="w-7 h-7 text-gray-600" />
          </button>
        </div>

        {/* Display */}
        <div className="px-6 py-6 bg-gray-50">
          <div className="bg-white rounded-xl border-2 border-gray-300 px-6 py-5 min-h-[70px] flex items-center justify-end">
            <span className="text-4xl font-bold text-gray-900 tabular-nums">
              {value || '0'}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-4">
            {keys.flat().map((key, index) => {
              const isBackspace = key === '⌫';
              const isClear = key === 'C';
              const isSpecial = key === '+/-' || key === '.';

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isBackspace) handleKeyPress('backspace');
                    else if (isClear) handleKeyPress('clear');
                    else handleKeyPress(key);
                  }}
                  className={`
                    h-20 rounded-xl font-bold text-3xl transition-all active:scale-95
                    ${
                      isBackspace || isClear
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : isSpecial
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }
                    shadow-md active:shadow-sm
                  `}
                >
                  {isBackspace ? <BackspaceIcon className="w-9 h-9 mx-auto" /> : key}
                </button>
              );
            })}
          </div>

          {/* Confirm button */}
          <button
            onClick={onClose}
            className="w-full mt-5 h-18 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl rounded-xl shadow-md active:shadow-sm active:scale-95 transition-all"
          >
            ✓ Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualNumpad;

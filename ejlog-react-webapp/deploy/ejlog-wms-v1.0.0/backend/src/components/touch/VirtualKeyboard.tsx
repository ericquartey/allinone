// ============================================================================
// EJLOG WMS - Virtual Keyboard Component
// Tastiera virtuale QWERTY per touch mode
// Design touch-friendly con tasti grandi e feedback visivo
// ============================================================================

import React, { useState } from 'react';
import { BackspaceIcon, XMarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface VirtualKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  maxLength?: number;
  placeholder?: string;
  title?: string;
}

/**
 * Virtual Keyboard Component
 * Tastiera virtuale QWERTY ottimizzata per touch mode
 *
 * Features:
 * - Layout QWERTY italiano
 * - Tasti grandi touch-friendly
 * - Maiuscolo/minuscolo con shift
 * - Numeri e caratteri speciali
 * - Feedback visivo su pressione
 * - Modale full-screen
 */
const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  value,
  onChange,
  onClose,
  maxLength = 100,
  placeholder = 'Inizia a digitare...',
  title = 'Inserisci testo',
}) => {
  const [shift, setShift] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === 'space') {
      if (value.length < maxLength) {
        onChange(value + ' ');
      }
      return;
    }

    if (key === 'shift') {
      setShift(!shift);
      return;
    }

    if (key === '123') {
      setShowNumbers(!showNumbers);
      return;
    }

    if (key === 'clear') {
      onChange('');
      return;
    }

    // Controllo lunghezza massima
    if (value.length >= maxLength) return;

    // Aggiungi carattere
    const char = shift ? key.toUpperCase() : key.toLowerCase();
    onChange(value + char);

    // Disattiva shift dopo un carattere
    if (shift) setShift(false);
  };

  // Layout tastiera lettere
  const letterKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  // Layout tastiera numeri/simboli
  const numberKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    ['.', ',', '?', '!', "'", '+', '=', '*', '#'],
  ];

  const keys = showNumbers ? numberKeys : letterKeys;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fadeIn">
      {/* Keyboard container */}
      <div className="bg-white w-full rounded-t-3xl shadow-2xl animate-slideUp max-w-full">
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
        <div className="px-6 py-5 bg-gray-50">
          <div className="bg-white rounded-xl border-2 border-gray-300 px-6 py-4 min-h-[60px] flex items-center">
            <span className="text-2xl text-gray-900 break-all">
              {value || <span className="text-gray-400">{placeholder}</span>}
            </span>
          </div>
          <div className="text-right text-base text-gray-500 mt-2">
            {value.length}/{maxLength}
          </div>
        </div>

        {/* Keyboard */}
        <div className="px-3 pb-5">
          {/* Rows of keys */}
          {keys.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-center gap-2 mb-2"
              style={{ paddingLeft: rowIndex === 1 ? '30px' : rowIndex === 2 ? '60px' : '0' }}
            >
              {row.map((key, keyIndex) => {
                const displayKey = shift && !showNumbers ? key.toUpperCase() : key.toLowerCase();

                return (
                  <button
                    key={keyIndex}
                    onClick={() => handleKeyPress(key)}
                    className="h-16 min-w-[44px] flex-1 max-w-[80px] bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-2xl text-gray-900 shadow-md active:shadow-none active:scale-95 transition-all"
                  >
                    {displayKey}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Bottom row with special keys */}
          <div className="flex justify-center gap-2 mt-2">
            {/* 123/ABC toggle */}
            <button
              onClick={() => handleKeyPress('123')}
              className="h-16 px-6 bg-gray-300 hover:bg-gray-400 rounded-xl font-bold text-xl text-gray-900 shadow-md active:shadow-none active:scale-95 transition-all"
            >
              {showNumbers ? 'ABC' : '123'}
            </button>

            {/* Shift (only in letter mode) */}
            {!showNumbers && (
              <button
                onClick={() => handleKeyPress('shift')}
                className={`h-16 px-6 rounded-xl font-bold text-xl shadow-md active:shadow-none active:scale-95 transition-all ${
                  shift
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                }`}
              >
                <ArrowUpIcon className="w-6 h-6" />
              </button>
            )}

            {/* Space */}
            <button
              onClick={() => handleKeyPress('space')}
              className="h-16 flex-1 max-w-[280px] bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-xl text-gray-900 shadow-md active:shadow-none active:scale-95 transition-all"
            >
              Spazio
            </button>

            {/* Backspace */}
            <button
              onClick={() => handleKeyPress('backspace')}
              className="h-16 px-6 bg-red-500 hover:bg-red-600 rounded-xl text-white shadow-md active:shadow-none active:scale-95 transition-all"
            >
              <BackspaceIcon className="w-7 h-7" />
            </button>

            {/* Clear */}
            <button
              onClick={() => handleKeyPress('clear')}
              className="h-16 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xl text-white shadow-md active:shadow-none active:scale-95 transition-all"
            >
              C
            </button>
          </div>

          {/* Confirm button */}
          <button
            onClick={onClose}
            className="w-full mt-4 h-16 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl rounded-xl shadow-md active:shadow-sm active:scale-95 transition-all"
          >
            ✓ Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;

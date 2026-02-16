/**
 * Voice Pick Execution Component
 * Interfaccia per esecuzione liste picking con comandi vocali
 * Integrazione I/ML Voice Pick System
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { VoiceCommand } from '../services/voiceRecognitionService';

export interface PickingItem {
  id: string;
  itemCode: string;
  description: string;
  warehouse: string;
  location: string;
  quantityRequested: number;
  quantityPicked: number;
  unit: string;
  checkDigit?: string; // Cifra di controllo per verifica location
}

export interface PickingList {
  id: string;
  listNumber: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused';
  items: PickingItem[];
  currentItemIndex: number;
  totalItems: number;
  completedItems: number;
}

interface VoicePickExecutionProps {
  pickingList: PickingList;
  onPickConfirmed: (itemId: string, quantity: number) => void;
  onListCompleted: () => void;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const VoicePickExecution: React.FC<VoicePickExecutionProps> = ({
  pickingList,
  onPickConfirmed,
  onListCompleted,
  onCancel,
  onPause,
  onResume,
}) => {
  const [currentItem, setCurrentItem] = useState<PickingItem | null>(null);
  const [pickingState, setPickingState] = useState<'location' | 'quantity' | 'confirmation'>('location');
  const [enteredQuantity, setEnteredQuantity] = useState<string>('');
  const [enteredCheckDigit, setEnteredCheckDigit] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showTranscript, setShowTranscript] = useState<boolean>(true);

  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    lastCommand,
    lastValue,
    error,
    start,
    stop,
    pause,
    resume,
    speak,
    playFeedback,
  } = useVoiceRecognition({
    onCommand: handleVoiceCommand,
    autoStart: false,
  });

  // Carica item corrente all'avvio
  useEffect(() => {
    if (pickingList && pickingList.items.length > 0) {
      const current = pickingList.items[pickingList.currentItemIndex];
      setCurrentItem(current);
      announceNextItem(current);
    }
  }, [pickingList]);

  /**
   * Annuncia il prossimo item da prelevare
   */
  async function announceNextItem(item: PickingItem) {
    if (!item) return;

    const message = `
      Articolo: ${item.itemCode}.
      Posizione: ${item.location}.
      ${item.checkDigit ? `Cifra di controllo: ${item.checkDigit}.` : ''}
      Quantità: ${item.quantityRequested} ${item.unit}.
    `;

    setFeedback('Ascolta le istruzioni...');
    await speak(message);
    setFeedback('Conferma posizione con cifra di controllo');
    setPickingState('location');
  }

  /**
   * Gestisce i comandi vocali
   */
  function handleVoiceCommand(command: VoiceCommand, value?: string | number) {
    console.log('[VoicePick] Command:', command, 'Value:', value);

    switch (command) {
      case 'conferma':
        handleConfirm();
        break;

      case 'annulla':
        handleCancel();
        break;

      case 'ripeti':
        handleRepeat();
        break;

      case 'pausa':
        handlePauseCommand();
        break;

      case 'riprendi':
        handleResumeCommand();
        break;

      case 'aiuto':
        handleHelp();
        break;

      case 'numero':
        if (typeof value === 'number') {
          handleNumberInput(value);
        }
        break;

      default:
        // Nessun comando riconosciuto
        break;
    }
  }

  /**
   * Gestisce input numerico
   */
  function handleNumberInput(num: number) {
    if (pickingState === 'location') {
      // Input cifra di controllo
      setEnteredCheckDigit(num.toString());
      verifyCheckDigit(num.toString());
    } else if (pickingState === 'quantity') {
      // Input quantità
      setEnteredQuantity((prev) => prev + num.toString());
    }
  }

  /**
   * Verifica cifra di controllo
   */
  async function verifyCheckDigit(digit: string) {
    if (!currentItem) return;

    if (currentItem.checkDigit && digit === currentItem.checkDigit) {
      // Cifra corretta
      playFeedback('success');
      await speak('Posizione corretta.');
      setFeedback('Inserisci la quantità prelevata');
      setPickingState('quantity');
    } else {
      // Cifra errata
      playFeedback('error');
      await speak('Cifra errata. Riprova.');
      setFeedback('Cifra di controllo errata! Riprova.');
      setEnteredCheckDigit('');
    }
  }

  /**
   * Gestisce conferma
   */
  async function handleConfirm() {
    if (!currentItem) return;

    if (pickingState === 'quantity') {
      const quantity = parseInt(enteredQuantity, 10);

      if (isNaN(quantity) || quantity <= 0) {
        playFeedback('error');
        await speak('Quantità non valida.');
        setFeedback('Quantità non valida! Inserisci un numero.');
        return;
      }

      if (quantity !== currentItem.quantityRequested) {
        playFeedback('warning');
        await speak(`Attenzione. Quantità richiesta: ${currentItem.quantityRequested}. Quantità inserita: ${quantity}. Confermi?`);
        setFeedback(`Quantità diversa da richiesta (${currentItem.quantityRequested}). Conferma?`);
        setPickingState('confirmation');
      } else {
        // Quantità corretta, conferma pick
        confirmPick(quantity);
      }
    } else if (pickingState === 'confirmation') {
      // Conferma finale
      const quantity = parseInt(enteredQuantity, 10);
      confirmPick(quantity);
    }
  }

  /**
   * Conferma il prelievo
   */
  async function confirmPick(quantity: number) {
    if (!currentItem) return;

    playFeedback('success');
    await speak('Prelievo confermato.');

    // Notifica parent component
    onPickConfirmed(currentItem.id, quantity);

    // Reset state
    setEnteredQuantity('');
    setEnteredCheckDigit('');

    // Passa al prossimo item
    const nextIndex = pickingList.currentItemIndex + 1;
    if (nextIndex < pickingList.totalItems) {
      const nextItem = pickingList.items[nextIndex];
      setCurrentItem(nextItem);
      announceNextItem(nextItem);
    } else {
      // Lista completata
      await speak('Lista completata. Ottimo lavoro!');
      playFeedback('success');
      onListCompleted();
    }
  }

  /**
   * Annulla operazione
   */
  async function handleCancel() {
    playFeedback('warning');
    await speak('Operazione annullata.');
    stop();
    onCancel();
  }

  /**
   * Ripete l'ultima istruzione
   */
  async function handleRepeat() {
    if (!currentItem) return;

    if (pickingState === 'location') {
      await speak(`Posizione: ${currentItem.location}. ${currentItem.checkDigit ? `Cifra: ${currentItem.checkDigit}` : ''}`);
    } else if (pickingState === 'quantity') {
      await speak(`Quantità richiesta: ${currentItem.quantityRequested} ${currentItem.unit}`);
    }
  }

  /**
   * Mette in pausa
   */
  async function handlePauseCommand() {
    pause();
    await speak('In pausa.');
    setFeedback('Sistema in pausa');
    onPause();
  }

  /**
   * Riprende
   */
  async function handleResumeCommand() {
    resume();
    await speak('Ripresa.');
    setFeedback('Sistema attivo');
    onResume();
  }

  /**
   * Aiuto
   */
  async function handleHelp() {
    const helpMessage = `
      Comandi disponibili:
      Conferma, per confermare.
      Annulla, per annullare.
      Ripeti, per ripetere.
      Pausa, per mettere in pausa.
      Riprendi, per riprendere.
      Di' la cifra di controllo per verificare la posizione.
      Di' la quantità prelevata.
    `;

    await speak(helpMessage);
  }

  /**
   * Toggle listening
   */
  const toggleListening = () => {
    if (isListening) {
      pause();
    } else {
      resume();
    }
  };

  // Progress percentage
  const progress = pickingList ? (pickingList.completedItems / pickingList.totalItems) * 100 : 0;

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Voice Pick Non Supportato</h3>
        <p className="text-red-600">Il tuo browser non supporta il riconoscimento vocale.</p>
        <p className="text-sm text-red-500 mt-2">Usa Google Chrome o Microsoft Edge.</p>
      </div>
    );
  }

  return (
    <div className="voice-pick-execution bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Voice Pick - Lista #{pickingList?.listNumber}</h2>

          <motion.button
            onClick={toggleListening}
            className={`px-6 py-3 rounded-full font-semibold flex items-center gap-2 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isListening ? (
              <>
                <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse" />
                In Ascolto
              </>
            ) : (
              <>
                <span className="inline-block w-3 h-3 bg-white rounded-full" />
                Avvia Ascolto
              </>
            )}
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-green-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Progresso: {pickingList?.completedItems} / {pickingList?.totalItems} articoli completati
        </p>
      </div>

      {/* Current Item */}
      {currentItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 mb-6"
          >
            <h3 className="text-xl font-bold text-green-800 mb-4">Articolo Corrente</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Codice</p>
                <p className="text-2xl font-bold text-gray-900">{currentItem.itemCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Posizione</p>
                <p className="text-2xl font-bold text-green-600">{currentItem.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantità Richiesta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentItem.quantityRequested} {currentItem.unit}
                </p>
              </div>
              {currentItem.checkDigit && (
                <div>
                  <p className="text-sm text-gray-600">Cifra di Controllo</p>
                  <p className="text-4xl font-bold text-blue-600">{currentItem.checkDigit}</p>
                </div>
              )}
            </div>

            <p className="text-lg text-gray-700 mt-2">{currentItem.description}</p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* State Display */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
        <p className="text-lg font-semibold text-blue-800 mb-2">Stato: {getFaseLabel(pickingState)}</p>
        <p className="text-blue-700">{feedback}</p>
      </div>

      {/* Voice Input Display */}
      {showTranscript && transcript && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Riconosciuto:</p>
          <p className="text-lg font-mono text-gray-900">{transcript}</p>
          <p className="text-xs text-gray-500 mt-1">Confidenza: {(confidence * 100).toFixed(0)}%</p>
        </div>
      )}

      {/* Manual Input (backup) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cifra di Controllo (manuale)
          </label>
          <input
            type="text"
            value={enteredCheckDigit}
            onChange={(e) => setEnteredCheckDigit(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            disabled={pickingState !== 'location'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantità (manuale)
          </label>
          <input
            type="number"
            value={enteredQuantity}
            onChange={(e) => setEnteredQuantity(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            disabled={pickingState !== 'quantity'}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg"
          disabled={pickingState === 'location' && !enteredCheckDigit}
        >
          Conferma
        </button>
        <button
          onClick={handleRepeat}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg"
        >
          Ripeti
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
        >
          Annulla
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Errore: {error}</p>
        </div>
      )}
    </div>
  );
};

function getFaseLabel(state: 'location' | 'quantity' | 'confirmation'): string {
  switch (state) {
    case 'location':
      return 'Verifica Posizione';
    case 'quantity':
      return 'Inserimento Quantità';
    case 'confirmation':
      return 'Conferma Finale';
    default:
      return 'Sconosciuto';
  }
}

export default VoicePickExecution;

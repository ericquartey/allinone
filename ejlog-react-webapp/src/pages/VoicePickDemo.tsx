/**
 * Voice Pick Demo Page
 * Pagina demo per testare il sistema Voice Pick I/ML
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VoicePickExecution, { PickingList, PickingItem } from '../components/VoicePickExecution';

// Mock data per demo
const mockPickingList: PickingList = {
  id: 'PL-001',
  listNumber: '00245',
  type: 'Picking',
  status: 'pending',
  currentItemIndex: 0,
  totalItems: 5,
  completedItems: 0,
  items: [
    {
      id: 'item-1',
      itemCode: 'ART-12345',
      description: 'Vite M8x40 Zincata',
      warehouse: 'MAG01',
      location: 'A-12-05',
      quantityRequested: 50,
      quantityPicked: 0,
      unit: 'PZ',
      checkDigit: '7',
    },
    {
      id: 'item-2',
      itemCode: 'ART-67890',
      description: 'Dado M8 Autobloccante',
      warehouse: 'MAG01',
      location: 'A-12-08',
      quantityRequested: 50,
      quantityPicked: 0,
      unit: 'PZ',
      checkDigit: '3',
    },
    {
      id: 'item-3',
      itemCode: 'ART-11111',
      description: 'Rondella Piana M8',
      warehouse: 'MAG01',
      location: 'B-05-12',
      quantityRequested: 100,
      quantityPicked: 0,
      unit: 'PZ',
      checkDigit: '9',
    },
    {
      id: 'item-4',
      itemCode: 'ART-22222',
      description: 'Bullone M10x60',
      warehouse: 'MAG01',
      location: 'B-08-03',
      quantityRequested: 30,
      quantityPicked: 0,
      unit: 'PZ',
      checkDigit: '2',
    },
    {
      id: 'item-5',
      itemCode: 'ART-33333',
      description: 'Piastra Supporto 100x100',
      warehouse: 'MAG01',
      location: 'C-15-20',
      quantityRequested: 10,
      quantityPicked: 0,
      unit: 'PZ',
      checkDigit: '5',
    },
  ],
};

export const VoicePickDemo: React.FC = () => {
  const [pickingList, setPickingList] = useState<PickingList>(mockPickingList);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pickedItems, setPickedItems] = useState<Array<{ itemId: string; quantity: number }>>([]);

  const handleStartExecution = () => {
    setIsExecuting(true);
    setPickingList({
      ...mockPickingList,
      status: 'in_progress',
      currentItemIndex: 0,
      completedItems: 0,
    });
  };

  const handlePickConfirmed = (itemId: string, quantity: number) => {
    setPickedItems((prev) => [...prev, { itemId, quantity }]);

    setPickingList((prev) => ({
      ...prev,
      currentItemIndex: prev.currentItemIndex + 1,
      completedItems: prev.completedItems + 1,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, quantityPicked: quantity } : item
      ),
    }));
  };

  const handleListCompleted = () => {
    setPickingList((prev) => ({ ...prev, status: 'completed' }));
    setIsExecuting(false);
  };

  const handleCancel = () => {
    if (confirm('Sei sicuro di voler annullare la lista?')) {
      setIsExecuting(false);
      setPickingList({
        ...mockPickingList,
        status: 'pending',
        currentItemIndex: 0,
        completedItems: 0,
      });
      setPickedItems([]);
    }
  };

  const handlePause = () => {
    setPickingList((prev) => ({ ...prev, status: 'paused' }));
  };

  const handleResume = () => {
    setPickingList((prev) => ({ ...prev, status: 'in_progress' }));
  };

  const handleResetDemo = () => {
    setIsExecuting(false);
    setPickingList({
      ...mockPickingList,
      status: 'pending',
      currentItemIndex: 0,
      completedItems: 0,
      items: mockPickingList.items.map((item) => ({ ...item, quantityPicked: 0 })),
    });
    setPickedItems([]);
  };

  return (
    <div className="voice-pick-demo min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Voice Pick I/ML - Demo</h1>
        <p className="text-lg text-gray-600">
          Sistema di picking vocale hands-free per magazzino
        </p>
      </motion.div>

      {!isExecuting ? (
        /* Start Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Lista Pronta per Esecuzione</h2>

            {/* List Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold mb-1">Numero Lista</p>
                <p className="text-3xl font-bold text-blue-800">{pickingList.listNumber}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold mb-1">Tipo</p>
                <p className="text-3xl font-bold text-green-800">{pickingList.type}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-semibold mb-1">Articoli</p>
                <p className="text-3xl font-bold text-purple-800">{pickingList.totalItems}</p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Articoli da Prelevare</h3>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Codice</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Descrizione</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Posizione</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Quantità</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickingList.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.description}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">{item.location}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {item.quantityRequested} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                            {item.checkDigit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">Istruzioni Voice Pick</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Il sistema ti guiderà vocalmente attraverso ogni articolo</li>
                <li>• Conferma la posizione dicendo la cifra di controllo</li>
                <li>• Inserisci la quantità prelevata a voce o manualmente</li>
                <li>• Usa i comandi: "conferma", "ripeti", "pausa", "aiuto"</li>
                <li>• Assicurati che il microfono sia attivo</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                onClick={handleStartExecution}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Avvia Voice Pick
              </motion.button>

              {pickedItems.length > 0 && (
                <motion.button
                  onClick={handleResetDemo}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg"
                >
                  Reset Demo
                </motion.button>
              )}
            </div>
          </div>

          {/* Picked Items Summary (if any) */}
          {pickedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-lg shadow-xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Articoli Prelevati</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pickedItems.map((picked, index) => {
                  const item = pickingList.items.find((i) => i.id === picked.itemId);
                  return (
                    <div key={index} className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item?.itemCode}</p>
                        <p className="text-sm text-gray-600">Qtà: {picked.quantity} {item?.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* Execution Screen */
        <VoicePickExecution
          pickingList={pickingList}
          onPickConfirmed={handlePickConfirmed}
          onListCompleted={handleListCompleted}
          onCancel={handleCancel}
          onPause={handlePause}
          onResume={handleResume}
        />
      )}

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        <p>© 2024 EjLog WMS - Voice Pick System by I/ML Integration</p>
        <p className="mt-1">Powered by Web Speech API - Ottimizzato per Google Chrome</p>
      </motion.div>
    </div>
  );
};

export default VoicePickDemo;

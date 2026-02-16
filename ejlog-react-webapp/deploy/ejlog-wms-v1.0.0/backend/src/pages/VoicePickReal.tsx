/**
 * Voice Pick Real - Integrazione con Liste Reali dal Database
 * Connette il sistema Voice Pick alle liste reali del magazzino
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VoicePickExecution, { PickingList, PickingItem } from '../components/VoicePickExecution';

export const VoicePickReal: React.FC = () => {
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<PickingList | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica liste disponibili dal backend
  useEffect(() => {
    loadAvailableLists();
  }, []);

  async function loadAvailableLists() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/lists?skip=0&limit=100');

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle liste');
      }

      const data = await response.json();
      const lists = data.exported || data.data || [];

      console.log('[VoicePickReal] Liste caricate:', lists.length);
      setAvailableLists(lists);
    } catch (err) {
      console.error('[VoicePickReal] Errore caricamento liste:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadListDetails(listId: string) {
    try {
      // Carica dettagli lista e items
      const [listRes, itemsRes] = await Promise.all([
        fetch(`/api/lists/${listId}`),
        fetch(`/api/lists/${listId}/items`)
      ]);

      if (!listRes.ok || !itemsRes.ok) {
        throw new Error('Errore nel caricamento dettagli lista');
      }

      const listData = await listRes.json();
      const itemsData = await itemsRes.json();

      // Converti in formato Voice Pick
      const pickingList: PickingList = {
        id: listData.id || listData.listCode,
        listNumber: listData.listNumber || listData.listCode,
        type: listData.type || 'Picking',
        status: 'pending',
        currentItemIndex: 0,
        totalItems: itemsData.length,
        completedItems: 0,
        items: itemsData.map((item: any, index: number) => ({
          id: item.id || `item-${index}`,
          itemCode: item.itemCode || item.code,
          description: item.description || item.descr || '',
          warehouse: item.warehouse || item.warehouseCode || 'MAG01',
          location: item.location || item.locationCode || 'N/A',
          quantityRequested: item.quantity || item.qtyRequested || 0,
          quantityPicked: 0,
          unit: item.unit || item.um || 'PZ',
          checkDigit: generateCheckDigit(item.location || item.locationCode),
        })),
      };

      return pickingList;
    } catch (err) {
      console.error('[VoicePickReal] Errore caricamento dettagli:', err);
      throw err;
    }
  }

  function generateCheckDigit(location: string): string {
    if (!location) return '0';

    // Genera cifra di controllo dalla location (es. A-12-05 → 5)
    const digits = location.match(/\d+/g);
    if (digits && digits.length > 0) {
      const lastDigit = digits[digits.length - 1];
      return lastDigit.charAt(lastDigit.length - 1);
    }

    return '0';
  }

  async function handleSelectList(list: any) {
    try {
      setIsLoading(true);
      const pickingList = await loadListDetails(list.id || list.listCode);
      setSelectedList(pickingList);
      setIsExecuting(true);
    } catch (err) {
      setError('Impossibile caricare i dettagli della lista');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePickConfirmed(itemId: string, quantity: number) {
    console.log('[VoicePickReal] Pick confermato:', { itemId, quantity });

    // TODO: Salvare pick nel backend
    try {
      await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: selectedList?.id,
          itemId,
          quantity,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('[VoicePickReal] Errore salvataggio pick:', err);
    }
  }

  function handleListCompleted() {
    console.log('[VoicePickReal] Lista completata!');
    setIsExecuting(false);
    setSelectedList(null);

    // Ricarica liste
    loadAvailableLists();
  }

  function handleCancel() {
    setIsExecuting(false);
    setSelectedList(null);
  }

  function handlePause() {
    console.log('[VoicePickReal] Lista in pausa');
  }

  function handleResume() {
    console.log('[VoicePickReal] Lista ripresa');
  }

  if (isLoading && availableLists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Caricamento liste...</p>
        </div>
      </div>
    );
  }

  if (error && availableLists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Errore</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAvailableLists}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (isExecuting && selectedList) {
    return (
      <VoicePickExecution
        pickingList={selectedList}
        onPickConfirmed={handlePickConfirmed}
        onListCompleted={handleListCompleted}
        onCancel={handleCancel}
        onPause={handlePause}
        onResume={handleResume}
      />
    );
  }

  return (
    <div className="voice-pick-real min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Voice Pick - Liste Reali</h1>
        <p className="text-lg text-gray-600">
          Seleziona una lista da eseguire con comandi vocali
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Liste Disponibili</p>
          <p className="text-4xl font-bold text-green-600">{availableLists.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Stato Sistema</p>
          <p className="text-2xl font-bold text-green-600">✓ Online</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Ultima Sincronizzazione</p>
          <p className="text-sm font-semibold text-gray-700">
            {new Date().toLocaleTimeString('it-IT')}
          </p>
        </div>
      </div>

      {/* Liste Disponibili */}
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Liste Disponibili</h2>
          <button
            onClick={loadAvailableLists}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Caricamento...' : 'Aggiorna'}
          </button>
        </div>

        {availableLists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 mb-4">Nessuna lista disponibile</p>
            <p className="text-gray-400">Le liste verranno visualizzate qui quando disponibili</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableLists.map((list, index) => (
              <motion.div
                key={list.id || list.listCode || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectList(list)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-green-800">
                    #{list.listNumber || list.listCode}
                  </h3>
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {list.type || 'Picking'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stato:</span>
                    <span className="font-semibold text-gray-800">
                      {list.status || 'Disponibile'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Righe:</span>
                    <span className="font-semibold text-gray-800">
                      {list.itemCount || list.rows || '?'}
                    </span>
                  </div>
                  {list.warehouse && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Magazzino:</span>
                      <span className="font-semibold text-gray-800">{list.warehouse}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectList(list);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Avvia Voice Pick
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePickReal;

/**
 * Tab Deprenotazione Liste
 * Permette di rimuovere la prenotazione di una lista (non implementata nel backend)
 * Utilizziamo la funzione rereserve per riassegnare o terminare la prenotazione
 */

import React, { useState } from 'react';
import {
  useLazyGetListByNumberQuery,
  useRereserveListMutation,
} from '../../../services/api/listsApi';
import Button from '../../shared/Button';
import Input from '../../shared/Input';
import Alert from '../../shared/Alert';
import Badge from '../../shared/Badge';
import { BookmarkSlashIcon, MagnifyingGlassIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

const UnreserveListTab: React.FC = () => {
  const [searchCode, setSearchCode] = useState('');
  const [currentOperatorId, setCurrentOperatorId] = useState('');
  const [newOperatorId, setNewOperatorId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [listInfo, setListInfo] = useState<any>(null);
  const [action, setAction] = useState<'unreserve' | 'rereserve'>('unreserve');

  const [searchList, { isLoading: isSearching, isError: isSearchError }] = useLazyGetListByNumberQuery();
  const [rereserveList, { isLoading: isProcessing, isSuccess, isError: isProcessError, error }] = useRereserveListMutation();

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      return;
    }

    try {
      const result = await searchList(searchCode).unwrap();
      setListInfo(result);
    } catch (err) {
      console.error('Errore durante la ricerca della lista:', err);
      setListInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listInfo || !currentOperatorId.trim()) {
      return;
    }

    try {
      await rereserveList({
        id: listInfo.code,
        previousOperatorId: currentOperatorId,
        newOperatorId: action === 'unreserve' ? 'SYSTEM' : newOperatorId,
        reason: reason || (action === 'unreserve' ? 'Deprenotazione manuale' : 'Riassegnazione'),
        notes: notes || undefined,
      }).unwrap();

      // Reset form on success
      setSearchCode('');
      setCurrentOperatorId('');
      setNewOperatorId('');
      setReason('');
      setNotes('');
      setListInfo(null);
      setAction('unreserve');
    } catch (err) {
      console.error('Errore durante la deprenotazione/riassegnazione:', err);
    }
  };

  const handleReset = () => {
    setSearchCode('');
    setCurrentOperatorId('');
    setNewOperatorId('');
    setReason('');
    setNotes('');
    setListInfo(null);
    setAction('unreserve');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      active: { label: 'Attiva', variant: 'success' },
      completed: { label: 'Completata', variant: 'info' },
      suspended: { label: 'Sospesa', variant: 'warning' },
      unfulfillable: { label: 'Inevadibile', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTypeLabel = (type: number) => {
    const typeMap: Record<number, string> = {
      0: 'Picking',
      1: 'Stoccaggio',
      2: 'Inventario',
      3: 'Trasferimento',
      4: 'Rettifica',
      5: 'Produzione',
    };
    return typeMap[type] || `Tipo ${type}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Deprenotazione Lista</h2>
        <p className="text-gray-600 mt-1">
          Rimuovi la prenotazione di una lista o riassegnala a un altro operatore
        </p>
      </div>

      {/* Ricerca Lista */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Cerca Lista per Codice
        </label>
        <div className="flex gap-2">
          <Input
            id="search"
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Inserisci codice lista (es: LIST001)"
            disabled={isSearching}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button
            type="button"
            variant="primary"
            onClick={handleSearch}
            disabled={isSearching || !searchCode.trim()}
            className="flex items-center gap-2 shrink-0"
          >
            {isSearching ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ricerca...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-5 w-5" />
                Cerca
              </>
            )}
          </Button>
        </div>
        {isSearchError && (
          <p className="text-sm text-red-600 mt-2">
            Lista non trovata. Verifica il codice inserito.
          </p>
        )}
      </div>

      {/* Informazioni Lista */}
      {listInfo && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dettagli Lista</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Codice:</span>
              <span className="ml-2 font-medium">{listInfo.code}</span>
            </div>
            <div>
              <span className="text-gray-600">Tipo:</span>
              <span className="ml-2 font-medium">{getTypeLabel(listInfo.itemListType)}</span>
            </div>
            <div>
              <span className="text-gray-600">Stato:</span>
              <span className="ml-2">{getStatusBadge(listInfo.status)}</span>
            </div>
            <div>
              <span className="text-gray-600">Priorità:</span>
              <span className="ml-2 font-medium">{listInfo.priority}</span>
            </div>
            {listInfo.description && (
              <div className="col-span-2">
                <span className="text-gray-600">Descrizione:</span>
                <span className="ml-2 font-medium">{listInfo.description}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Deprenotazione */}
      {listInfo && (
        <>
          {isSuccess && (
            <Alert
              type="success"
              title={action === 'unreserve' ? 'Lista deprenotata con successo!' : 'Lista riassegnata con successo!'}
              message={
                action === 'unreserve'
                  ? `La lista ${listInfo.code} non è più assegnata a nessun operatore.`
                  : `La lista ${listInfo.code} è stata riassegnata all'operatore ${newOperatorId}.`
              }
            />
          )}

          {isProcessError && (
            <Alert
              type="error"
              title="Errore durante l'operazione"
              message={error?.message || 'Si è verificato un errore. Riprova.'}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo Azione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di Operazione
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="unreserve"
                    checked={action === 'unreserve'}
                    onChange={(e) => setAction(e.target.value as 'unreserve')}
                    className="mr-2"
                  />
                  <span className="text-sm">Deprenota (rimuovi assegnazione)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="rereserve"
                    checked={action === 'rereserve'}
                    onChange={(e) => setAction(e.target.value as 'rereserve')}
                    className="mr-2"
                  />
                  <span className="text-sm">Riassegna ad altro operatore</span>
                </label>
              </div>
            </div>

            {/* ID Operatore Corrente */}
            <div>
              <label htmlFor="currentOperatorId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Operatore Corrente *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="currentOperatorId"
                  type="text"
                  value={currentOperatorId}
                  onChange={(e) => setCurrentOperatorId(e.target.value)}
                  placeholder="Es: OP001"
                  required
                  disabled={isProcessing}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                L'operatore che ha attualmente la lista prenotata
              </p>
            </div>

            {/* ID Nuovo Operatore (solo se riassegnazione) */}
            {action === 'rereserve' && (
              <div>
                <label htmlFor="newOperatorId" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Nuovo Operatore *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="newOperatorId"
                    type="text"
                    value={newOperatorId}
                    onChange={(e) => setNewOperatorId(e.target.value)}
                    placeholder="Es: OP002"
                    required={action === 'rereserve'}
                    disabled={isProcessing}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L'operatore a cui riassegnare la lista
                </p>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={action === 'unreserve' ? 'Es: Operatore assente' : 'Es: Cambio turno'}
                disabled={isProcessing}
              />
            </div>

            {/* Note (opzionale) */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Note (opzionale)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Eventuali note aggiuntive..."
                disabled={isProcessing}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>

            {/* Pulsanti */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isProcessing || !currentOperatorId.trim() || (action === 'rereserve' && !newOperatorId.trim())}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  <>
                    {action === 'unreserve' ? (
                      <>
                        <BookmarkSlashIcon className="h-5 w-5" />
                        Deprenota Lista
                      </>
                    ) : (
                      <>
                        <UserIcon className="h-5 w-5" />
                        Riassegna Lista
                      </>
                    )}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Annulla
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default UnreserveListTab;

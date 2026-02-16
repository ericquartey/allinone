/**
 * Tab Prenotazione Liste
 * Permette di prenotare una lista per un operatore
 */

import React, { useState } from 'react';
import {
  useLazyGetListByNumberQuery,
  useReserveListMutation,
} from '../../../services/api/listsApi';
import Button from '../../shared/Button';
import Input from '../../shared/Input';
import Alert from '../../shared/Alert';
import Badge from '../../shared/Badge';
import { BookmarkIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

const ReserveListTab: React.FC = () => {
  const [searchCode, setSearchCode] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [notes, setNotes] = useState('');
  const [listInfo, setListInfo] = useState<any>(null);

  const [searchList, { isLoading: isSearching, isError: isSearchError }] = useLazyGetListByNumberQuery();
  const [reserveList, { isLoading: isReserving, isSuccess, isError: isReserveError, error }] = useReserveListMutation();

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

    if (!listInfo || !operatorId.trim()) {
      return;
    }

    try {
      await reserveList({
        id: listInfo.code,
        operatorId: operatorId,
        notes: notes || undefined,
      }).unwrap();

      // Reset form on success
      setSearchCode('');
      setOperatorId('');
      setNotes('');
      setListInfo(null);
    } catch (err) {
      console.error('Errore durante la prenotazione della lista:', err);
    }
  };

  const handleReset = () => {
    setSearchCode('');
    setOperatorId('');
    setNotes('');
    setListInfo(null);
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
        <h2 className="text-xl font-semibold text-gray-900">Prenotazione Lista</h2>
        <p className="text-gray-600 mt-1">
          Prenota una lista per assegnarla a un operatore specifico
        </p>
      </div>

      {/* Ricerca Lista */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
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

      {/* Form Prenotazione */}
      {listInfo && (
        <>
          {isSuccess && (
            <Alert
              type="success"
              title="Lista prenotata con successo!"
              message={`La lista ${listInfo.code} è stata assegnata all'operatore ${operatorId}.`}
            />
          )}

          {isReserveError && (
            <Alert
              type="error"
              title="Errore durante la prenotazione"
              message={error?.message || 'Si è verificato un errore. Riprova.'}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ID Operatore */}
            <div>
              <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Operatore *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="operatorId"
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="Es: OP001"
                  required
                  disabled={isReserving}
                  className="pl-10"
                />
              </div>
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
                placeholder="Eventuali note sulla prenotazione..."
                disabled={isReserving}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Pulsanti */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isReserving || !operatorId.trim()}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {isReserving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Prenotazione...
                  </>
                ) : (
                  <>
                    <BookmarkIcon className="h-5 w-5" />
                    Prenota Lista
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={isReserving}
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

export default ReserveListTab;

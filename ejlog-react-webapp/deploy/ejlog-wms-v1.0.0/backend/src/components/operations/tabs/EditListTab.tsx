/**
 * Tab Modifica Liste
 * Permette di modificare una lista esistente
 */

import React, { useState } from 'react';
import {
  useLazyGetListByNumberQuery,
  useUpdateListMutation,
} from '../../../services/api/listsApi';
import { ItemListType } from '../../../types/models';
import Button from '../../shared/Button';
import Input from '../../shared/Input';
import Alert from '../../shared/Alert';
import Spinner from '../../shared/Spinner';
import { PencilSquareIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const EditListTab: React.FC = () => {
  const [searchCode, setSearchCode] = useState('');
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    description: '',
    tipoLista: ItemListType.PICKING,
    priority: 1,
  });
  const [isListLoaded, setIsListLoaded] = useState(false);

  const [searchList, { isLoading: isSearching, isError: isSearchError }] = useLazyGetListByNumberQuery();
  const [updateList, { isLoading: isUpdating, isSuccess, isError: isUpdateError, error }] = useUpdateListMutation();

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      return;
    }

    try {
      const result = await searchList(searchCode).unwrap();

      setFormData({
        id: result.id,
        code: result.code,
        description: result.description || '',
        tipoLista: result.itemListType,
        priority: result.priority,
      });
      setIsListLoaded(true);
    } catch (err) {
      console.error('Errore durante la ricerca della lista:', err);
      setIsListLoaded(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateList({
        id: formData.id,
        description: formData.description,
        priority: formData.priority,
      }).unwrap();
    } catch (err) {
      console.error('Errore durante l\'aggiornamento della lista:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setSearchCode('');
    setFormData({
      id: 0,
      code: '',
      description: '',
      tipoLista: ItemListType.PICKING,
      priority: 1,
    });
    setIsListLoaded(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Modifica Lista Esistente</h2>
        <p className="text-gray-600 mt-1">
          Cerca una lista per codice e modifica i suoi dati
        </p>
      </div>

      {/* Ricerca Lista */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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

      {/* Form Modifica */}
      {isListLoaded && (
        <>
          {isSuccess && (
            <Alert
              type="success"
              title="Lista aggiornata con successo!"
              message="Le modifiche sono state salvate nel sistema."
            />
          )}

          {isUpdateError && (
            <Alert
              type="error"
              title="Errore durante l'aggiornamento"
              message={error?.message || 'Si è verificato un errore. Riprova.'}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Codice Lista (read-only) */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Codice Lista
              </label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Il codice non può essere modificato
              </p>
            </div>

            {/* Tipo Lista (read-only) */}
            <div>
              <label htmlFor="tipoLista" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Lista
              </label>
              <select
                id="tipoLista"
                value={formData.tipoLista}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              >
                <option value={ItemListType.PICKING}>Picking (Prelievo)</option>
                <option value={ItemListType.STOCCAGGIO}>Stoccaggio (Deposito)</option>
                <option value={ItemListType.INVENTARIO}>Inventario</option>
                <option value={ItemListType.TRASFERIMENTO}>Trasferimento</option>
                <option value={ItemListType.RETTIFICA}>Rettifica</option>
                <option value={ItemListType.PRODUZIONE}>Produzione</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Il tipo non può essere modificato
              </p>
            </div>

            {/* Descrizione (modificabile) */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrizione della lista"
                disabled={isUpdating}
              />
            </div>

            {/* Priorità (modificabile) */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                placeholder="1"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Valore da 1 (minima) a 100 (massima)
              </p>
            </div>

            {/* Pulsanti */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="h-5 w-5" />
                    Salva Modifiche
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={isUpdating}
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

export default EditListTab;

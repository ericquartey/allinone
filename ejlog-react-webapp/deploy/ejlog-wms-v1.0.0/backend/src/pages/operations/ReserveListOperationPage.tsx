// ============================================================================
// EJLOG WMS - Reserve List Operation Page
// Prenota lista per un operatore
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReserveListMutation, useGetListByIdQuery } from '../../services/api/listsApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';
import { toast } from 'react-hot-toast';

const ReserveListOperationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const user = useAppSelector((state) => state.auth.user);

  const { data: list, isLoading } = useGetListByIdQuery(Number(listId), {
    skip: !listId,
  });

  const [reserveList, { isLoading: isReserving }] = useReserveListMutation();

  const [operatorId, setOperatorId] = useState(user?.userName || '');
  const [notes, setNotes] = useState('');

  const handleReserve = async () => {
    if (!listId || !list) {
      toast.error('Lista non valida');
      return;
    }

    if (!operatorId.trim()) {
      toast.error('Inserire ID operatore');
      return;
    }

    try {
      await reserveList({
        id: listId,
        operatorId: operatorId.trim(),
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success(`Lista prenotata per l'operatore ${operatorId}!`);
      navigate('/operations');
    } catch (error: any) {
      console.error('Errore durante prenotazione lista:', error);
      toast.error(error?.data?.message || 'Errore durante prenotazione lista');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert type="error">Lista non trovata</Alert>
        <Button onClick={() => navigate('/operations')}>Torna alle Operazioni</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prenota Lista</h1>
        <Button variant="ghost" onClick={() => navigate('/operations')}>
          Annulla
        </Button>
      </div>

      {/* Informazioni Lista */}
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Dettagli Lista</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Codice Lista</label>
              <p className="font-semibold text-lg">{list.code}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Descrizione</label>
              <p className="font-semibold">{list.description || 'N/D'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Tipo</label>
              <p>
                <Badge variant="info">{list.itemListType}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Priorità</label>
              <p className="font-semibold">{list.priority || 0}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Stato Attuale</label>
              <p>
                <Badge variant={list.isDispatchable ? 'success' : 'warning'}>
                  {list.isDispatchable ? 'Disponibile' : 'Non Disponibile'}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Unità di Spedizione</label>
              <p className="font-semibold">{list.shipmentUnitCode || 'N/D'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Form Prenotazione */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Dati Prenotazione</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700 mb-1">
              ID Operatore *
            </label>
            <Input
              id="operatorId"
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              placeholder="Inserire ID operatore"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              L'operatore deve essere autorizzato e con sessione attiva
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Note (opzionale)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuali note sulla prenotazione..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Informazioni Operative */}
      <Card>
        <Alert type="info">
          <p className="font-semibold mb-2">Cosa significa prenotare una lista?</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>La lista viene assegnata all'operatore specificato</li>
            <li>Lo stato della lista passerà a "Prenotata"</li>
            <li>L'operatore riceverà la priorità sull'esecuzione</li>
            <li>Le missioni in coda verranno associate all'operatore</li>
          </ul>
        </Alert>
      </Card>

      {/* Azioni */}
      <Card>
        <div className="flex space-x-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleReserve}
            loading={isReserving}
            disabled={isReserving || !operatorId.trim()}
            className="flex-1"
          >
            {isReserving ? 'Prenotazione in corso...' : 'Prenota Lista'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/operations')}
            disabled={isReserving}
            className="flex-1"
          >
            Annulla
          </Button>
        </div>
      </Card>

      {/* Informazioni Sistema */}
      <Card>
        <div className="text-sm text-gray-600">
          <p>
            <strong>Utente corrente:</strong> {user?.userName || 'Non autenticato'}
          </p>
          <p>
            <strong>Data/Ora:</strong> {new Date().toLocaleString('it-IT')}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ReserveListOperationPage;

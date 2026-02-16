// ============================================================================
// EJLOG WMS - Rereserve List Operation Page
// Riassegna lista da un operatore ad un altro
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRereserveListMutation, useGetListByIdQuery } from '../../services/api/listsApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import { toast } from 'react-hot-toast';

const RereserveListOperationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const user = useAppSelector((state) => state.auth.user);

  const { data: list, isLoading } = useGetListByIdQuery(Number(listId), {
    skip: !listId,
  });

  const [rereserveList, { isLoading: isRereserving }] = useRereserveListMutation();

  const [previousOperatorId, setPreviousOperatorId] = useState('');
  const [newOperatorId, setNewOperatorId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Motivi predefiniti per riassegnazione
  const reasonOptions = [
    { value: '', label: 'Seleziona motivo...' },
    { value: 'CAMBIO_TURNO', label: 'Cambio Turno' },
    { value: 'OPERATORE_ASSENTE', label: 'Operatore Assente' },
    { value: 'RIASSEGNAZIONE_PRIORITA', label: 'Riassegnazione per Priorità' },
    { value: 'OPERATORE_OCCUPATO', label: 'Operatore Occupato su Altra Lista' },
    { value: 'MALFUNZIONAMENTO', label: 'Malfunzionamento Postazione' },
    { value: 'ALTRO', label: 'Altro (specificare nelle note)' },
  ];

  const handleRereserve = async () => {
    if (!listId || !list) {
      toast.error('Lista non valida');
      return;
    }

    if (!previousOperatorId.trim()) {
      toast.error('Inserire ID operatore precedente');
      return;
    }

    if (!newOperatorId.trim()) {
      toast.error('Inserire ID nuovo operatore');
      return;
    }

    if (previousOperatorId.trim() === newOperatorId.trim()) {
      toast.error('Il nuovo operatore deve essere diverso dal precedente');
      return;
    }

    if (!reason) {
      toast.error('Selezionare un motivo per la riassegnazione');
      return;
    }

    try {
      await rereserveList({
        id: listId,
        previousOperatorId: previousOperatorId.trim(),
        newOperatorId: newOperatorId.trim(),
        reason: reason,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success(`Lista riassegnata da ${previousOperatorId} a ${newOperatorId}!`);
      navigate('/operations');
    } catch (error: any) {
      console.error('Errore durante riassegnazione lista:', error);
      toast.error(error?.data?.message || 'Errore durante riassegnazione lista');
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
        <h1 className="text-3xl font-bold">Riassegna Lista</h1>
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
          </div>
        </div>
      </Card>

      {/* Form Riassegnazione */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Dati Riassegnazione</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="previousOperatorId" className="block text-sm font-medium text-gray-700 mb-1">
                Operatore Precedente *
              </label>
              <Input
                id="previousOperatorId"
                type="text"
                value={previousOperatorId}
                onChange={(e) => setPreviousOperatorId(e.target.value)}
                placeholder="ID operatore attuale"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                L'operatore che ha attualmente la lista
              </p>
            </div>

            <div>
              <label htmlFor="newOperatorId" className="block text-sm font-medium text-gray-700 mb-1">
                Nuovo Operatore *
              </label>
              <Input
                id="newOperatorId"
                type="text"
                value={newOperatorId}
                onChange={(e) => setNewOperatorId(e.target.value)}
                placeholder="ID nuovo operatore"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                L'operatore a cui assegnare la lista
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo Riassegnazione *
            </label>
            <Select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={reasonOptions}
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Note Aggiuntive
              {reason === 'ALTRO' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={reason === 'ALTRO' ? 'Specificare il motivo della riassegnazione...' : 'Eventuali note aggiuntive...'}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={reason === 'ALTRO'}
            />
            {reason === 'ALTRO' && (
              <p className="mt-1 text-xs text-red-600">
                Le note sono obbligatorie quando si seleziona "Altro" come motivo
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Informazioni Operative */}
      <Card>
        <Alert type="warning">
          <p className="font-semibold mb-2">Attenzione</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>La lista deve essere attualmente in stato "Prenotata"</li>
            <li>L'operatore precedente deve corrispondere a quello attuale</li>
            <li>Il nuovo operatore deve essere autorizzato e con sessione attiva</li>
            <li>La riassegnazione verrà registrata nel log di audit</li>
            <li>L'operazione è tracciata per motivi di sicurezza</li>
          </ul>
        </Alert>
      </Card>

      {/* Azioni */}
      <Card>
        <div className="flex space-x-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleRereserve}
            loading={isRereserving}
            disabled={
              isRereserving ||
              !previousOperatorId.trim() ||
              !newOperatorId.trim() ||
              !reason ||
              (reason === 'ALTRO' && !notes.trim())
            }
            className="flex-1"
          >
            {isRereserving ? 'Riassegnazione in corso...' : 'Riassegna Lista'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/operations')}
            disabled={isRereserving}
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

export default RereserveListOperationPage;

// ============================================================================
// EJLOG WMS - Waiting List Operation Page
// Mette lista in attesa/sospensione
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSetListWaitingMutation, useGetListByIdQuery } from '../../services/api/listsApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import { toast } from 'react-hot-toast';

const WaitingListOperationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const user = useAppSelector((state) => state.auth.user);

  const { data: list, isLoading } = useGetListByIdQuery(Number(listId), {
    skip: !listId,
  });

  const [setListWaiting, { isLoading: isSetting }] = useSetListWaitingMutation();

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState<number | undefined>(undefined);

  // Motivi predefiniti per messa in attesa
  const reasonOptions = [
    { value: '', label: 'Seleziona motivo...' },
    { value: 'MATERIALE_MANCANTE', label: 'Materiale Mancante' },
    { value: 'UDC_NON_DISPONIBILE', label: 'UDC Non Disponibile' },
    { value: 'PROBLEMA_TECNICO', label: 'Problema Tecnico' },
    { value: 'ATTESA_APPROVAZIONE', label: 'Attesa Approvazione' },
    { value: 'INTERRUZIONE_PIANIFICATA', label: 'Interruzione Pianificata' },
    { value: 'CAMBIO_PRIORITA', label: 'Cambio Priorità' },
    { value: 'MANUTENZIONE', label: 'Manutenzione in Corso' },
    { value: 'FINE_TURNO', label: 'Fine Turno' },
    { value: 'ALTRO', label: 'Altro (specificare nelle note)' },
  ];

  const handleSetWaiting = async () => {
    if (!listId || !list) {
      toast.error('Lista non valida');
      return;
    }

    if (!reason) {
      toast.error('Selezionare un motivo per la sospensione');
      return;
    }

    if (reason === 'ALTRO' && !notes.trim()) {
      toast.error('Specificare il motivo nelle note');
      return;
    }

    try {
      await setListWaiting({
        id: listId,
        reason: reason,
        notes: notes.trim() || undefined,
        estimatedWaitTimeMinutes: estimatedWaitMinutes,
      }).unwrap();

      toast.success('Lista messa in attesa con successo!');
      navigate('/operations');
    } catch (error: any) {
      console.error('Errore durante sospensione lista:', error);
      toast.error(error?.data?.message || 'Errore durante sospensione lista');
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
        <h1 className="text-3xl font-bold">Metti Lista in Attesa</h1>
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
                  {list.isDispatchable ? 'In Esecuzione' : 'Non Disponibile'}
                </Badge>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Form Sospensione */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Dettagli Sospensione</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo Sospensione *
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
            <label htmlFor="estimatedWaitMinutes" className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Stimato di Attesa (minuti)
            </label>
            <Input
              id="estimatedWaitMinutes"
              type="number"
              value={estimatedWaitMinutes || ''}
              onChange={(e) => setEstimatedWaitMinutes(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Inserire tempo stimato (opzionale)"
              min={0}
              max={1440}
            />
            <p className="mt-1 text-xs text-gray-500">
              Tempo stimato prima della ripresa (max 24 ore = 1440 minuti)
            </p>
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
              placeholder={reason === 'ALTRO' ? 'Specificare il motivo della sospensione...' : 'Eventuali dettagli aggiuntivi sulla sospensione...'}
              rows={5}
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
        <Alert type="info">
          <p className="font-semibold mb-2">Cosa accade quando si sospende una lista?</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Le missioni correnti vengono messe in pausa (stato = 5)</li>
            <li>Le missioni in coda vengono sospese e la priorità viene abbassata</li>
            <li>Viene registrato il motivo e il timestamp di sospensione</li>
            <li>Lo stato della lista passa a "In Attesa"</li>
            <li>L'evento viene tracciato nel log di audit</li>
            <li>La lista potrà essere ripresa successivamente dallo stesso o da altro operatore</li>
          </ul>
        </Alert>
      </Card>

      {/* Anteprima Tempo Stimato */}
      {estimatedWaitMinutes && estimatedWaitMinutes > 0 && (
        <Card>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Tempo Stimato di Ripresa</h4>
            <p className="text-blue-800">
              <strong>Ripresa prevista:</strong>{' '}
              {new Date(Date.now() + estimatedWaitMinutes * 60000).toLocaleString('it-IT')}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              ({estimatedWaitMinutes} minuti ≈ {(estimatedWaitMinutes / 60).toFixed(1)} ore)
            </p>
          </div>
        </Card>
      )}

      {/* Azioni */}
      <Card>
        <div className="flex space-x-4">
          <Button
            variant="warning"
            size="lg"
            onClick={handleSetWaiting}
            loading={isSetting}
            disabled={
              isSetting ||
              !reason ||
              (reason === 'ALTRO' && !notes.trim())
            }
            className="flex-1"
          >
            {isSetting ? 'Sospensione in corso...' : 'Metti in Attesa'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/operations')}
            disabled={isSetting}
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

export default WaitingListOperationPage;

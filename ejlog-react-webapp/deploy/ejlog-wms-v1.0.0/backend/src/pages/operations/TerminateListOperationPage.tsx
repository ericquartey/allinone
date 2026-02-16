// ============================================================================
// EJLOG WMS - Terminate List Operation Page
// Completa esecuzione di una lista
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTerminateListMutation, useGetListByIdQuery } from '../../services/api/listsApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Badge from '../../components/shared/Badge';
import { toast } from 'react-hot-toast';

const TerminateListOperationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const user = useAppSelector((state) => state.auth.user);

  const { data: list, isLoading } = useGetListByIdQuery(Number(listId), {
    skip: !listId,
  });

  const [terminateList, { isLoading: isTerminating }] = useTerminateListMutation();

  const [confirmTerminate, setConfirmTerminate] = useState(false);

  const handleTerminate = async () => {
    if (!listId || !list) {
      toast.error('Lista non valida');
      return;
    }

    try {
      await terminateList(Number(listId)).unwrap();

      toast.success('Lista completata con successo!');
      navigate('/operations');
    } catch (error: any) {
      console.error('Errore durante completamento lista:', error);
      toast.error(error?.data?.message || 'Errore durante completamento lista');
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
        <h1 className="text-3xl font-bold">Completa Lista</h1>
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

          {/* Macchine Associate */}
          {list.machines && list.machines.length > 0 && (
            <div className="pt-4 border-t">
              <label className="text-sm text-gray-600 mb-2 block">Macchine Associate</label>
              <div className="grid grid-cols-3 gap-2">
                {list.machines.map((machine, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <p className="text-sm font-medium">{machine.machineCode}</p>
                    <p className="text-xs text-gray-600">{machine.machineDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Statistiche Esecuzione */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Riepilogo Esecuzione</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Stato</p>
            <p className="text-2xl font-bold text-blue-800">In Esecuzione</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Completate</p>
            <p className="text-2xl font-bold text-green-800">-</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">In Attesa</p>
            <p className="text-2xl font-bold text-gray-800">-</p>
          </div>
        </div>
        <Alert type="info" className="mt-4">
          <p className="text-sm">
            Le statistiche dettagliate saranno disponibili dopo il completamento della lista
          </p>
        </Alert>
      </Card>

      {/* Conferma Completamento */}
      {!confirmTerminate ? (
        <Card>
          <Alert type="warning">
            <p className="font-semibold mb-2">Attenzione</p>
            <p>
              Stai per completare la lista <strong>{list.code}</strong>.
              Questa operazione archivierà tutte le missioni completate e genererà il report finale.
            </p>
            <p className="mt-2 text-sm">
              Assicurati che tutte le operazioni siano state effettivamente completate prima di procedere.
            </p>
          </Alert>

          <div className="mt-4">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setConfirmTerminate(true)}
            >
              Procedi con il Completamento
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Alert type="info">
            <p className="font-semibold mb-2">Conferma Completamento</p>
            <p>
              Confermi di voler completare la lista <strong>{list.code}</strong>?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Questa operazione è irreversibile e archivierà definitivamente tutte le missioni.
            </p>
          </Alert>

          <div className="mt-6 flex space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleTerminate}
              loading={isTerminating}
              disabled={isTerminating}
              className="flex-1"
            >
              {isTerminating ? 'Completamento in corso...' : 'Conferma Completamento'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setConfirmTerminate(false)}
              disabled={isTerminating}
              className="flex-1"
            >
              Annulla
            </Button>
          </div>
        </Card>
      )}

      {/* Informazioni Operatore */}
      <Card>
        <div className="text-sm text-gray-600">
          <p>
            <strong>Operatore:</strong> {user?.userName || 'Non autenticato'}
          </p>
          <p>
            <strong>Data/Ora:</strong> {new Date().toLocaleString('it-IT')}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TerminateListOperationPage;

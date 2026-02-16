// ============================================================================
// EJLOG WMS - Execute List Operation Page
// Avvia esecuzione di una lista
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useExecuteListMutation, useGetListByIdQuery } from '../../services/api/listsApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import Badge from '../../components/shared/Badge';
import { toast } from 'react-hot-toast';

const ExecuteListOperationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const user = useAppSelector((state) => state.auth.user);

  const { data: list, isLoading } = useGetListByIdQuery(Number(listId), {
    skip: !listId,
  });

  const [executeList, { isLoading: isExecuting }] = useExecuteListMutation();

  const [confirmExecute, setConfirmExecute] = useState(false);

  const handleExecute = async () => {
    if (!listId || !list) {
      toast.error('Lista non valida');
      return;
    }

    try {
      await executeList({
        id: Number(listId),
        userName: user?.userName,
      }).unwrap();

      toast.success('Lista avviata con successo!');
      navigate('/operations');
    } catch (error: any) {
      console.error('Errore durante esecuzione lista:', error);
      toast.error(error?.data?.message || 'Errore durante esecuzione lista');
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
        <h1 className="text-3xl font-bold">Esegui Lista</h1>
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
                  {list.isDispatchable ? 'Pronta' : 'Non Pronta'}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Unità di Spedizione</label>
              <p className="font-semibold">{list.shipmentUnitCode || 'N/D'}</p>
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

      {/* Conferma Esecuzione */}
      {!confirmExecute ? (
        <Card>
          <Alert type="warning">
            <p className="font-semibold mb-2">Attenzione</p>
            <p>
              Stai per avviare l'esecuzione della lista <strong>{list.code}</strong>.
              L'operazione trasferirà le missioni dalla coda al sistema di esecuzione corrente.
            </p>
          </Alert>

          <div className="mt-4">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setConfirmExecute(true)}
            >
              Procedi con l'Esecuzione
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Alert type="info">
            <p className="font-semibold mb-2">Conferma Esecuzione</p>
            <p>Confermi di voler avviare l'esecuzione della lista <strong>{list.code}</strong>?</p>
          </Alert>

          <div className="mt-6 flex space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleExecute}
              loading={isExecuting}
              disabled={isExecuting}
              className="flex-1"
            >
              {isExecuting ? 'Avvio in corso...' : 'Conferma Esecuzione'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setConfirmExecute(false)}
              disabled={isExecuting}
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

export default ExecuteListOperationPage;

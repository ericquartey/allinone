// ============================================================================
// EJLOG WMS - Execute List Page
// Esecuzione lista
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetListByIdQuery, useExecuteListMutation } from '../../services/api/listsApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';

const ExecuteListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const { data: list, isLoading } = useGetListByIdQuery(Number(id));
  const [executeList, { isLoading: isExecuting }] = useExecuteListMutation();

  const handleExecute = async () => {
    if (!user) return;

    try {
      await executeList({
        id: Number(id),
        userName: user.userName,
      }).unwrap();
      alert('Lista avviata con successo');
      navigate(`/lists/${id}`);
    } catch (error) {
      alert('Errore durante l\'esecuzione');
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!list) return <Card><p>Lista non trovata</p></Card>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Esegui Lista</h1>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Codice Lista</label>
            <p className="font-semibold text-lg">{list.code}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Descrizione</label>
            <p>{list.description || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Totale Righe</label>
            <p className="font-semibold">{list.totalRows || 0}</p>
          </div>

          <div className="pt-4 border-t flex space-x-3">
            <Button
              variant="primary"
              onClick={handleExecute}
              loading={isExecuting}
            >
              Avvia Esecuzione
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/lists/${id}`)}>
              Annulla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExecuteListPage;

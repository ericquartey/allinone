// ============================================================================
// EJLOG WMS - List Detail Page
// Dettaglio lista con righe
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetListByIdQuery, useGetListRowsQuery } from '../../services/api/listsApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import { ItemListStatus } from '../../types/models';

const ListDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: list, isLoading } = useGetListByIdQuery(Number(id));
  const { data: rows } = useGetListRowsQuery(Number(id));

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!list) return <Card><p>Lista non trovata</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{list.code}</h1>
          <p className="text-gray-600">{list.description}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="ghost" onClick={() => navigate('/lists')}>Indietro</Button>
          {list.status === ItemListStatus.IN_ATTESA && (  // ✅ Aggiornato da DA_EVADERE
            <Button variant="primary" onClick={() => navigate(`/lists/${id}/execute`)}>
              Esegui
            </Button>
          )}
        </div>
      </div>

      <Card title="Righe Lista">
        <div className="space-y-2">
          {rows?.map((row) => (
            <div key={row.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{row.itemDescription}</p>
                <p className="text-sm text-gray-600">Codice: {row.itemCode}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {row.dispatchedQuantity} / {row.requestedQuantity}
                </p>
                {row.isCompleted && <Badge variant="success" size="sm">Completata</Badge>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ListDetailPage;

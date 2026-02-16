// ============================================================================
// EJLOG WMS - Operation Detail Page
// Dettaglio operazione
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetMissionOperationByIdQuery } from '../../services/api/masAdapterApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import { MissionOperationStatus, MissionOperationType } from '../../types/models';

const OperationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: operation, isLoading } = useGetMissionOperationByIdQuery(Number(id));

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!operation) return <Card><p>Operazione non trovata</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Operazione #{operation.id}</h1>
          <Badge variant="info">{MissionOperationType[operation.type]}</Badge>
        </div>
        <div className="flex space-x-3">
          <Button variant="ghost" onClick={() => navigate('/operations')}>Indietro</Button>
          {operation.status === MissionOperationStatus.DA_ESEGUIRE && (
            <Button variant="primary" onClick={() => navigate(`/operations/${id}/execute`)}>
              Esegui
            </Button>
          )}
        </div>
      </div>

      <Card title="Dettagli">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Articolo</label>
            <p className="font-semibold">{operation.itemCode}</p>
            <p className="text-sm text-gray-600">{operation.itemDescription}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Quantità</label>
            <p className="font-semibold">{operation.quantity}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Stato</label>
            <p><Badge>{MissionOperationStatus[operation.status]}</Badge></p>
          </div>
          {operation.lot && (
            <div>
              <label className="text-sm text-gray-600">Lotto</label>
              <p className="font-semibold">{operation.lot}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OperationDetailPage;

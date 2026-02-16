// ============================================================================
// EJLOG WMS - Execute Operation Page
// Esecuzione operazione
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetMissionOperationByIdQuery, useCompleteMissionOperationMutation } from '../../services/api/masAdapterApi';
import { useAppSelector } from '../../app/hooks';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Spinner from '../../components/shared/Spinner';

const ExecuteOperationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const { data: operation, isLoading } = useGetMissionOperationByIdQuery(Number(id));
  const [completeOperation, { isLoading: isCompleting }] = useCompleteMissionOperationMutation();

  const [quantity, setQuantity] = useState(0);

  React.useEffect(() => {
    if (operation) setQuantity(operation.quantity);
  }, [operation]);

  const handleComplete = async () => {
    if (!user) return;

    try {
      await completeOperation({
        id: Number(id),
        payload: {
          quantity,
          wastedQuantity: 0,
          ignoreRemainingQuantity: false,
          userName: user.userName,
        },
      }).unwrap();
      alert('Operazione completata');
      navigate('/operations');
    } catch (error) {
      alert('Errore durante il completamento');
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!operation) return <Card><p>Operazione non trovata</p></Card>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Esegui Operazione</h1>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Articolo</label>
            <p className="font-semibold">{operation.itemCode} - {operation.itemDescription}</p>
          </div>
          <Input
            label="Quantità da Completare"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            max={operation.quantity}
          />

          <div className="pt-4 border-t flex space-x-3">
            <Button
              variant="primary"
              onClick={handleComplete}
              loading={isCompleting}
            >
              Completa Operazione
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/operations/${id}`)}>
              Annulla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExecuteOperationPage;

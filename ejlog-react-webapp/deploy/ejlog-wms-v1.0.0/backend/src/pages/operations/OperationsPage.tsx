// ============================================================================
// EJLOG WMS - Operations Page
// Coda operazioni missione
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetOperationsQuery } from '../../services/api/operationsApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import { MissionOperation, MissionOperationStatus, MissionOperationType } from '../../types/models';

const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetOperationsQuery({});

  const statusVariant = (status: MissionOperationStatus) => {
    switch (status) {
      case MissionOperationStatus.COMPLETATA: return 'success';
      case MissionOperationStatus.IN_ESECUZIONE: return 'info';
      case MissionOperationStatus.IN_ERRORE: return 'danger';
      case MissionOperationStatus.SOSPESA: return 'warning';
      default: return 'default';
    }
  };

  const columns: Column<MissionOperation>[] = [
    { key: 'id', header: 'ID' },
    {
      key: 'type',
      header: 'Tipo',
      render: (op) => MissionOperationType[op.type],
    },
    { key: 'itemCode', header: 'Articolo' },
    { key: 'quantity', header: 'Qtà' },
    {
      key: 'status',
      header: 'Stato',
      render: (op) => (
        <Badge variant={statusVariant(op.status)}>
          {MissionOperationStatus[op.status]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Operazioni</h1>

      <Card>
        <Table
          data={data || []}
          columns={columns}
          loading={isLoading}
          onRowClick={(op) => navigate(`/operations/${op.id}`)}
        />
      </Card>
    </div>
  );
};

export default OperationsPage;

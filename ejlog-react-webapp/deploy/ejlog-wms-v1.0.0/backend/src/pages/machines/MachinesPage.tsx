// ============================================================================
// EJLOG WMS - Machines Page
// Elenco macchine
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMachinesQuery } from '../../services/api/machinesApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import { MachineInfo, MachineStatus } from '../../types/models';

const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMachinesQuery();

  const statusVariant = (status?: MachineStatus) => {
    switch (status) {
      case MachineStatus.WORKING: return 'success';
      case MachineStatus.ERROR: return 'danger';
      case MachineStatus.MAINTENANCE: return 'warning';
      case MachineStatus.OFFLINE: return 'danger';
      default: return 'default';
    }
  };

  const columns: Column<MachineInfo>[] = [
    { key: 'code', header: 'Codice' },
    { key: 'description', header: 'Descrizione', render: (m) => m.description || '-' },
    { key: 'machineType', header: 'Tipo', render: (m) => m.machineType || '-' },
    {
      key: 'status',
      header: 'Stato',
      render: (m) => (
        <Badge variant={statusVariant(m.status)}>
          {m.status !== undefined ? MachineStatus[m.status] : 'N/D'}
        </Badge>
      ),
    },
    {
      key: 'isAvailable',
      header: 'Disponibile',
      render: (m) => (
        <Badge variant={m.isAvailable ? 'success' : 'danger'}>
          {m.isAvailable ? 'Sì' : 'No'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Macchine</h1>

      <Card>
        <Table
          data={data || []}
          columns={columns}
          loading={isLoading}
          onRowClick={(m) => navigate(`/machines/${m.id}`)}
        />
      </Card>
    </div>
  );
};

export default MachinesPage;

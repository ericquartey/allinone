// ============================================================================
// EJLOG WMS - Alarm History Page
// Storico allarmi
// ============================================================================

import React from 'react';
import { useGetAlarmsQuery } from '../../services/api/alarmsApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import { Alarm, AlarmSeverity } from '../../types/models';

const AlarmHistoryPage: React.FC = () => {
  const { data, isLoading } = useGetAlarmsQuery({
    page: 1,
    pageSize: 100,
    orderBy: 'occurredAt',
    sortDirection: 'desc',
  });

  const columns: Column<Alarm>[] = [
    {
      key: 'occurredAt',
      header: 'Data Inizio',
      render: (a) => new Date(a.occurredAt).toLocaleString('it-IT'),
    },
    {
      key: 'resolvedAt',
      header: 'Data Risoluzione',
      render: (a) => a.resolvedAt ? new Date(a.resolvedAt).toLocaleString('it-IT') : '-',
    },
    { key: 'machineCode', header: 'Macchina', render: (a) => a.machineCode || '-' },
    { key: 'alarmCode', header: 'Codice' },
    {
      key: 'severity',
      header: 'Severità',
      render: (a) => <Badge>{AlarmSeverity[a.severity]}</Badge>,
    },
    {
      key: 'isActive',
      header: 'Stato',
      render: (a) => (
        <Badge variant={a.isActive ? 'danger' : 'default'}>
          {a.isActive ? 'Attivo' : 'Risolto'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Storico Allarmi</h1>

      <Card>
        <Table
          data={data?.data || []}
          columns={columns}
          loading={isLoading}
        />
      </Card>
    </div>
  );
};

export default AlarmHistoryPage;

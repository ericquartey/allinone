// ============================================================================
// EJLOG WMS - Areas Config Page
// Gestione aree magazzino
// ============================================================================

import React from 'react';
import { useGetAreasQuery } from '../../services/api/areasApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import { Area } from '../../types/models';

const AreasPage: React.FC = () => {
  const { data, isLoading } = useGetAreasQuery();

  const columns: Column<Area>[] = [
    { key: 'code', header: 'Codice' },
    { key: 'name', header: 'Nome' },
    { key: 'description', header: 'Descrizione', render: (a) => a.description || '-' },
    {
      key: 'isActive',
      header: 'Stato',
      render: (a) => (
        <Badge variant={a.isActive ? 'success' : 'default'}>
          {a.isActive ? 'Attiva' : 'Inattiva'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestione Aree</h1>

      <Card>
        <Table
          data={data || []}
          columns={columns}
          loading={isLoading}
        />
      </Card>
    </div>
  );
};

export default AreasPage;

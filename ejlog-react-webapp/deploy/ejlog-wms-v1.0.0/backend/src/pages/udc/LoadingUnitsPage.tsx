// ============================================================================
// EJLOG WMS - Loading Units Page
// Elenco unità di carico (UDC)
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetUdcListQuery } from '../../services/api/udcApi';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import { LoadingUnit } from '../../types/models';

const LoadingUnitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetUdcListQuery({});

  const columns: Column<LoadingUnit>[] = [
    { key: 'id', header: 'ID' },
    { key: 'barcode', header: 'Barcode', render: (udc) => udc.barcode || '-' },
    { key: 'compartmentsCount', header: 'Compartimenti' },
    {
      key: 'areaFillRate',
      header: 'Riempimento',
      render: (udc) => <Badge variant="info">{udc.areaFillRate.toFixed(1)}%</Badge>,
    },
    {
      key: 'isBlockedFromEjlog',
      header: 'Stato',
      render: (udc) => (
        <Badge variant={udc.isBlockedFromEjlog ? 'danger' : 'success'}>
          {udc.isBlockedFromEjlog ? 'Bloccata' : 'Attiva'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Unità di Carico (UDC)</h1>
        <Button variant="primary" onClick={() => navigate('/udc/create')}>
          Nuova UDC
        </Button>
      </div>

      <Card>
        <Table
          data={data || []}
          columns={columns}
          loading={isLoading}
          onRowClick={(udc) => navigate(`/udc/${udc.id}`)}
        />
      </Card>
    </div>
  );
};

export default LoadingUnitsPage;

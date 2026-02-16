// ============================================================================
// EJLOG WMS - Items Page
// Pagina lista articoli con ricerca e filtri
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetItemsQuery } from '../../services/api/itemsApi';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setFilters, setSearchQuery } from '../../features/items/itemsSlice';
import Card from '../../components/shared/Card';
import Table, { Column } from '../../components/shared/Table';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Pagination from '../../components/shared/Pagination';
import Badge from '../../components/shared/Badge';
import type { Item, ManagementType } from '../../types/models';

const ItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.items.filters);
  const searchQuery = useAppSelector((state) => state.items.searchQuery);

  const { data, isLoading } = useGetItemsQuery(filters);

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearch = () => {
    dispatch(setSearchQuery(localSearch));
  };

  const handleSort = (key: string) => {
    const newDirection =
      filters.orderBy === key && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    dispatch(setFilters({ orderBy: key, sortDirection: newDirection }));
  };

  const columns: Column<Item>[] = [
    {
      key: 'code',
      header: 'Codice',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-semibold text-ferrRed">{item.code}</span>
      ),
    },
    {
      key: 'description',
      header: 'Descrizione',
      sortable: true,
    },
    {
      key: 'itemCategoryDescription',
      header: 'Categoria',
      render: (item) => item.itemCategoryDescription || '-',
    },
    {
      key: 'measureUnitDescription',
      header: 'UM',
    },
    {
      key: 'managementType',
      header: 'Gestione',
      render: (item) => {
        const labels: Record<ManagementType, string> = {
          [ManagementType.STANDARD]: 'Standard',
          [ManagementType.LOTTO]: 'Lotto',
          [ManagementType.MATRICOLA]: 'Matricola',
          [ManagementType.LOTTO_E_MATRICOLA]: 'Lotto+Matricola',
        };
        return <Badge size="sm">{labels[item.managementType]}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Azioni',
      render: (item) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/items/${item.id}`);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Dettagli
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/items/${item.id}/edit`);
            }}
            className="text-green-600 hover:text-green-800"
          >
            Modifica
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articoli</h1>
          <p className="text-gray-600 mt-1">Gestione anagrafica articoli</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/items/create')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Nuovo Articolo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Cerca per codice o descrizione..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <Button variant="primary" onClick={handleSearch}>
            Cerca
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setLocalSearch('');
              dispatch(setSearchQuery(''));
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          data={data?.data || []}
          columns={columns}
          loading={isLoading}
          onRowClick={(item) => navigate(`/items/${item.id}`)}
          sortBy={filters.orderBy}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          emptyMessage="Nessun articolo trovato"
        />

        {data && data.totalPages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            pageSize={data.pageSize}
            onPageChange={(page) => dispatch(setFilters({ page }))}
          />
        )}
      </Card>
    </div>
  );
};

export default ItemsPage;

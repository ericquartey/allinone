// ============================================================================
// EJLOG WMS - Dashboard Page
// Dashboard principale con KPI e statistiche
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMissionOperationsQuery } from '../services/api/masAdapterApi';
import { useGetActiveAlarmsQuery } from '../services/api/alarmsApi';
import { useGetListsQuery } from '../services/api/listsApi';
import Card from '../components/shared/Card';
import Badge from '../components/shared/Badge';
import Button from '../components/shared/Button';
import { ItemListStatus } from '../types/models';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: operations } = useGetMissionOperationsQuery({ status: 0 }); // DA_ESEGUIRE
  const { data: activeAlarms } = useGetActiveAlarmsQuery({});
  const { data: listsData } = useGetListsQuery({
    status: ItemListStatus.IN_ESECUZIONE,
    page: 1,
    pageSize: 5,
  });

  const criticalAlarms = activeAlarms?.filter((a) => a.severity === 3).length || 0;
  const activeLists = listsData?.total || 0;
  const pendingOperations = operations?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Panoramica sistema EjLog WMS</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Operazioni in Coda</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingOperations}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={() => navigate('/operations')}
          >
            Vedi tutte
          </Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Liste Attive</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeLists}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={() => navigate('/lists')}
          >
            Vedi tutte
          </Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Allarmi Attivi</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeAlarms?.length || 0}</p>
              {criticalAlarms > 0 && (
                <Badge variant="danger" size="sm" className="mt-2">
                  {criticalAlarms} critici
                </Badge>
              )}
            </div>
            <div className={`p-3 rounded-lg ${criticalAlarms > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <svg className={`w-8 h-8 ${criticalAlarms > 0 ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={() => navigate('/alarms')}
          >
            Vedi tutti
          </Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Macchine Online</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={() => navigate('/machines')}
          >
            Vedi tutte
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Azioni Rapide">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => navigate('/lists/create')}
          >
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuova Lista
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => navigate('/items')}
          >
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Articoli
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => navigate('/stock')}
          >
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Giacenze
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => navigate('/reports')}
          >
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Report
          </Button>
        </div>
      </Card>

      {/* Recent Lists */}
      {listsData && listsData.data.length > 0 && (
        <Card
          title="Liste Recenti"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/lists')}>
              Vedi tutte
            </Button>
          }
        >
          <div className="space-y-3">
            {listsData.data.slice(0, 5).map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/lists/${list.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{list.code}</p>
                  <p className="text-sm text-gray-600">{list.description}</p>
                </div>
                <Badge
                  variant={
                    list.status === ItemListStatus.TERMINATA  // ✅ Aggiornato da COMPLETATA
                      ? 'success'
                      : list.status === ItemListStatus.IN_ESECUZIONE
                      ? 'info'
                      : 'default'
                  }
                >
                  {ItemListStatus[list.status]}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;

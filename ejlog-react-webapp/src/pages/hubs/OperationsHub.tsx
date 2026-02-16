import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CubeIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { useLists } from '../../hooks/useLists';
import { useMovements } from '../../hooks/useMovements';

function StatCard({  title, value, icon: Icon, color, subtitle  }: any): JSX.Element {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

function OperationsHub(): JSX.Element {
  const [activeTab, setActiveTab] = useState('receiving');

  // Fetch real data
  const { data: listsData, isLoading: listsLoading } = useLists({ skip: 0, take: 50 });
  const { data: movementsData, isLoading: movementsLoading } = useMovements({
    skip: 0,
    take: 20
  });

  // Calculate operational stats
  const stats = useMemo(() => {
    const lists = listsData?.lists || [];
    const movements = movementsData?.movements || [];

    // Lista di prelievo (picking lists) - tipo 0
    const pickingLists = lists.filter(l => l.tipo === 0);
    const activePickingLists = pickingLists.filter(l => l.stato === 1).length;
    const completedPickingLists = pickingLists.filter(l => l.stato === 2).length;

    // Lista di versamento (putaway lists) - tipo 1
    const putawayLists = lists.filter(l => l.tipo === 1);
    const activePutawayLists = putawayLists.filter(l => l.stato === 1).length;

    // Recent movements
    const todayMovements = movements.filter(m => {
      if (!m.data) return false;
      const movDate = new Date(m.data);
      const today = new Date();
      return movDate.toDateString() === today.toDateString();
    }).length;

    return {
      activePickingLists,
      completedPickingLists,
      activePutawayLists,
      todayMovements,
      totalLists: lists.length,
      totalMovements: movementsData?.totalCount || 0,
    };
  }, [listsData, movementsData]);

  // Get recent lists for display
  const recentLists = useMemo(() => {
    if (!listsData?.lists) return [];
    return listsData.lists
      .filter(l => l.stato === 1) // Active lists
      .slice(0, 5);
  }, [listsData]);

  const isLoading = listsLoading || movementsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento Operations Hub..." />
      </div>
    );
  }

  const getListTypeLabel = (tipo) => {
    switch(tipo) {
      case 0: return 'Prelievo';
      case 1: return 'Versamento';
      case 2: return 'Inventario';
      case 3: return 'Trasferimento';
      default: return 'Altro';
    }
  };

  const getListStatusBadge = (stato) => {
    switch(stato) {
      case 0: return <Badge variant="default">Nuova</Badge>;
      case 1: return <Badge variant="info">In Corso</Badge>;
      case 2: return <Badge variant="success">Completata</Badge>;
      case 3: return <Badge variant="error">Annullata</Badge>;
      default: return <Badge variant="default">Sconosciuto</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Hub</h1>
          <p className="text-gray-600 mt-1">
            Centro di controllo operazioni di magazzino
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati operativi in tempo reale
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="primary">Nuova Operazione</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Prelievi Attivi"
          value={stats.activePickingLists}
          icon={TruckIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle="Liste di prelievo in corso"
        />
        <StatCard
          title="Versamenti Attivi"
          value={stats.activePutawayLists}
          icon={CubeIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle="Liste di versamento in corso"
        />
        <StatCard
          title="Prelievi Completati"
          value={stats.completedPickingLists}
          icon={CheckCircleIcon}
          color="bg-gradient-to-br from-ferretto-red to-red-600"
          subtitle="Oggi"
        />
        <StatCard
          title="Movimenti Oggi"
          value={stats.todayMovements}
          icon={DocumentTextIcon}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          subtitle="Operazioni registrate"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'receiving', label: 'Ricevimento', icon: TruckIcon },
            { id: 'picking', label: 'Prelievo', icon: DocumentTextIcon },
            { id: 'putaway', label: 'Versamento', icon: CubeIcon },
            { id: 'shipping', label: 'Spedizione', icon: TruckIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-ferretto-red text-ferretto-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Lists */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste Attive
          </h3>
          <Button variant="ghost" size="sm">
            Vedi tutte
          </Button>
        </div>

        {recentLists.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numero Lista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Creazione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operatore
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLists.map((list) => (
                  <tr key={list.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {list.nrLista}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getListTypeLabel(list.tipo)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getListStatusBadge(list.stato)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {list.dataOraCreazione
                        ? new Date(list.dataOraCreazione).toLocaleDateString('it-IT')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {list.matricola || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        Dettagli
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna lista attiva</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non ci sono liste in corso al momento
            </p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Azioni Rapide
          </h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <TruckIcon className="w-5 h-5 mr-3" />
              Nuova Lista Prelievo
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CubeIcon className="w-5 h-5 mr-3" />
              Nuova Lista Versamento
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DocumentTextIcon className="w-5 h-5 mr-3" />
              Nuova Lista Inventario
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ArrowPathIcon className="w-5 h-5 mr-3" />
              Trasferimento Merce
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Operatori
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Operatore 1</p>
                  <p className="text-xs text-gray-500">12 liste completate oggi</p>
                </div>
              </div>
              <Badge variant="success">Top</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Operatore 2</p>
                  <p className="text-xs text-gray-500">8 liste completate oggi</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Operatore 3</p>
                  <p className="text-xs text-gray-500">6 liste completate oggi</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default OperationsHub;

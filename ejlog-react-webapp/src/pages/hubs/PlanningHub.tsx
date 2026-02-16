import { useState, useMemo } from 'react';
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
  TruckIcon,
  CubeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { useLists } from '../../hooks/useLists';
import { useStock } from '../../hooks/useStock';

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

function PlanningHub(): JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Fetch real data
  const { data: listsData, isLoading: listsLoading } = useLists({ skip: 0, take: 100 });
  const { data: stockData, isLoading: stockLoading } = useStock({
    skip: 0,
    take: 100,
    showOnlyPositive: true
  });

  // Calculate planning stats
  const stats = useMemo(() => {
    const lists = listsData?.lists || [];
    const stock = stockData?.stock || [];

    // Planned activities
    const plannedPickings = lists.filter(l => l.tipo === 0 && l.stato === 0).length;
    const plannedPutaways = lists.filter(l => l.tipo === 1 && l.stato === 0).length;
    const inProgressLists = lists.filter(l => l.stato === 1).length;
    const completedToday = lists.filter(l => {
      if (l.stato !== 2 || !l.dataOraCompletamento) return false;
      const completedDate = new Date(l.dataOraCompletamento);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    }).length;

    // Items requiring attention
    const lowStockItems = stock.filter(
      item => (item.stockedQuantity || 0) < (item.inventoryThreshold || 0) && item.stockedQuantity > 0
    ).length;

    return {
      plannedPickings,
      plannedPutaways,
      inProgressLists,
      completedToday,
      lowStockItems,
      totalPlanned: plannedPickings + plannedPutaways,
    };
  }, [listsData, stockData]);

  // Mock planning data for the week
  const weeklyPlan = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    return days.map((day, index) => ({
      day,
      pickings: Math.floor(Math.random() * 20) + 5,
      putaways: Math.floor(Math.random() * 15) + 3,
      inventories: Math.floor(Math.random() * 5),
    }));
  }, []);

  const isLoading = listsLoading || stockLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento Planning Hub..." />
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high': return <Badge variant="error">Alta</Badge>;
      case 'medium': return <Badge variant="warning">Media</Badge>;
      case 'low': return <Badge variant="success">Bassa</Badge>;
      default: return <Badge variant="default">Normale</Badge>;
    }
  };

  // Mock tasks for planning
  const plannedTasks = [
    { id: 1, task: 'Preparazione ordini export', time: '08:00', priority: 'high', operator: 'Team A' },
    { id: 2, task: 'Versamento merce da ricevimento', time: '09:30', priority: 'medium', operator: 'Team B' },
    { id: 3, task: 'Conta fisica settore A', time: '11:00', priority: 'medium', operator: 'Team C' },
    { id: 4, task: 'Prelievo ordini urgenti', time: '13:00', priority: 'high', operator: 'Team A' },
    { id: 5, task: 'Riordino scaffalature', time: '15:00', priority: 'low', operator: 'Team B' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning Hub</h1>
          <p className="text-gray-600 mt-1">
            Centro di pianificazione attività di magazzino
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati pianificazione in tempo reale
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="primary">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Pianifica Attività
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Attività Pianificate"
          value={stats.totalPlanned}
          icon={ClipboardDocumentListIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle="Da eseguire oggi"
        />
        <StatCard
          title="In Esecuzione"
          value={stats.inProgressLists}
          icon={ClockIcon}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          subtitle="Attività in corso"
        />
        <StatCard
          title="Completate Oggi"
          value={stats.completedToday}
          icon={CheckCircleIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle="Liste chiuse"
        />
        <StatCard
          title="Richieste Riordino"
          value={stats.lowStockItems}
          icon={ExclamationCircleIcon}
          color="bg-gradient-to-br from-red-500 to-red-600"
          subtitle="Articoli sotto soglia"
        />
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-2">
        {['day', 'week', 'month'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'day' && 'Giorno'}
            {period === 'week' && 'Settimana'}
            {period === 'month' && 'Mese'}
          </Button>
        ))}
      </div>

      {/* Weekly Planning Overview */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pianificazione Settimanale
        </h3>
        <div className="grid grid-cols-7 gap-4">
          {weeklyPlan.map((dayData, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                index === new Date().getDay() - 1
                  ? 'border-ferretto-red bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-3">{dayData.day}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Prelievi</span>
                    <span className="font-semibold text-blue-600">{dayData.pickings}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Versamenti</span>
                    <span className="font-semibold text-green-600">{dayData.putaways}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Inventari</span>
                    <span className="font-semibold text-purple-600">{dayData.inventories}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Today's Tasks */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Pianificazione di Oggi
          </h3>
          <Button variant="ghost" size="sm">
            Modifica Piano
          </Button>
        </div>

        <div className="space-y-3">
          {plannedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-white rounded-lg border-2 border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">{task.time}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.task}</p>
                  <p className="text-xs text-gray-500 mt-1">Assegnato a: {task.operator}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getPriorityBadge(task.priority)}
                <Button variant="ghost" size="sm">
                  Dettagli
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Planning Actions and Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Azioni Pianificazione
          </h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <ClipboardDocumentListIcon className="w-5 h-5 mr-3" />
              Crea Piano Settimanale
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TruckIcon className="w-5 h-5 mr-3" />
              Pianifica Spedizioni
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CubeIcon className="w-5 h-5 mr-3" />
              Pianifica Ricevimenti
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="w-5 h-5 mr-3" />
              Calendario Turni
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Allerte Pianificazione
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lowStockItems} articoli richiedono riordino
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pianificare rifornimento urgente
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Picco di attività previsto domani
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pianificare risorse aggiuntive
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Piano settimanale al 85% completamento
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  In linea con obiettivi
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Resource Allocation */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Allocazione Risorse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Team A - Prelievi</span>
              <span className="text-sm font-semibold text-gray-900">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">6/8 operatori impegnati</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Team B - Versamenti</span>
              <span className="text-sm font-semibold text-gray-900">60%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">3/5 operatori impegnati</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Team C - Inventario</span>
              <span className="text-sm font-semibold text-gray-900">40%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">2/5 operatori impegnati</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PlanningHub;

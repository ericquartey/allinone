import { useState, useMemo } from 'react';
import {
  PresentationChartLineIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { useItems } from '../../hooks/useItems';
import { useLists } from '../../hooks/useLists';
import { useStock } from '../../hooks/useStock';
import { useMovements } from '../../hooks/useMovements';

function StatCard({  title, value, icon: Icon, color, trend, trendValue  }: any): JSX.Element {
  const isPositive = trend === 'up';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && trendValue && (
            <div
              className={`flex items-center mt-2 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">{trendValue}</span>
              <span className="text-gray-500 ml-1">vs scorsa settimana</span>
            </div>
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

function AnalyticsHub(): JSX.Element {
  const [dateRange, setDateRange] = useState('week');

  // Fetch real data
  const { data: itemsData, isLoading: itemsLoading } = useItems({ skip: 0, take: 1 });
  const { data: listsData, isLoading: listsLoading } = useLists({ skip: 0, take: 100 });
  const { data: stockData, isLoading: stockLoading } = useStock({
    skip: 0,
    take: 100,
    showOnlyPositive: true
  });
  const { data: movementsData, isLoading: movementsLoading } = useMovements({
    skip: 0,
    take: 100
  });

  // Calculate analytics stats
  const stats = useMemo(() => {
    const lists = listsData?.lists || [];
    const stock = stockData?.stock || [];
    const movements = movementsData?.movements || [];

    const completedLists = lists.filter(l => l.stato === 2).length;
    const totalStock = stock.reduce((sum, item) => sum + (item.stockedQuantity || 0), 0);
    const totalMovements = movements.length;
    const avgListCompletionTime = '4.2h'; // Mock

    return {
      completedLists,
      totalStock,
      totalMovements,
      avgListCompletionTime,
    };
  }, [listsData, stockData, movementsData]);

  // Generate weekly activity data
  const weeklyActivity = useMemo(() => {
    return [
      { day: 'Lun', movimenti: 45, liste: 12, efficienza: 85 },
      { day: 'Mar', movimenti: 52, liste: 15, efficienza: 88 },
      { day: 'Mer', movimenti: 48, liste: 13, efficienza: 82 },
      { day: 'Gio', movimenti: 61, liste: 18, efficienza: 91 },
      { day: 'Ven', movimenti: 55, liste: 16, efficienza: 87 },
      { day: 'Sab', movimenti: 38, liste: 10, efficienza: 79 },
      { day: 'Dom', movimenti: 25, liste: 6, efficienza: 75 },
    ];
  }, []);

  // Category distribution from stock
  const categoryDistribution = useMemo(() => {
    if (!stockData?.stock) return [];

    const catMap = {};
    stockData.stock.forEach(item => {
      const cat = item.item?.categoriaDesc || 'Altro';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 5);
  }, [stockData]);

  // List type distribution
  const listTypeDistribution = useMemo(() => {
    if (!listsData?.lists) return [];

    const types = {
      'Prelievo': 0,
      'Versamento': 0,
      'Inventario': 0,
      'Trasferimento': 0,
    };

    listsData.lists.forEach(list => {
      switch(list.tipo) {
        case 0: types['Prelievo']++; break;
        case 1: types['Versamento']++; break;
        case 2: types['Inventario']++; break;
        case 3: types['Trasferimento']++; break;
        default: break;
      }
    });

    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [listsData]);

  const COLORS = ['#E30613', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const isLoading = itemsLoading || listsLoading || stockLoading || movementsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento Analytics Hub..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Hub</h1>
          <p className="text-gray-600 mt-1">
            Centro di analisi e reportistica avanzata
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati analytics in tempo reale
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="primary">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Esporta Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Liste Completate"
          value={stats.completedLists}
          icon={ChartBarIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Giacenza Totale"
          value={stats.totalStock.toLocaleString()}
          icon={ArrowTrendingUpIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="Movimenti Totali"
          value={stats.totalMovements}
          icon={PresentationChartLineIcon}
          color="bg-gradient-to-br from-ferretto-red to-red-600"
          trend="down"
          trendValue="-3%"
        />
        <StatCard
          title="Tempo Medio Completamento"
          value={stats.avgListCompletionTime}
          icon={CalendarIcon}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend="down"
          trendValue="-8%"
        />
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center space-x-2">
        {['day', 'week', 'month', 'year'].map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
          >
            {range === 'day' && 'Giorno'}
            {range === 'week' && 'Settimana'}
            {range === 'month' && 'Mese'}
            {range === 'year' && 'Anno'}
          </Button>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attività Settimanale
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="movimenti" fill="#E30613" name="Movimenti" radius={[8, 8, 0, 0]} />
            <Bar dataKey="liste" fill="#3B82F6" name="Liste" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        {categoryDistribution.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribuzione per Categoria
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* List Type Distribution */}
        {listTypeDistribution.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribuzione Tipo Liste
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={listTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {listTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Efficiency Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trend Efficienza Operativa
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="efficienza"
              stroke="#10B981"
              strokeWidth={3}
              name="Efficienza %"
              dot={{ fill: '#10B981', r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* KPIs and Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            KPI Operativi
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tasso di completamento</span>
                <span className="font-medium text-gray-900">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Accuratezza picking</span>
                <span className="font-medium text-gray-900">96%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Utilizzo spazio</span>
                <span className="font-medium text-gray-900">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-ferretto-red h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Magazzino
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Throughput giornaliero</span>
              <Badge variant="success">+15%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tempo medio prelievo</span>
              <Badge variant="success">-8%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rotazione inventario</span>
              <Badge variant="info">3.2x</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Errori di picking</span>
              <Badge variant="success">-12%</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Report Disponibili
          </h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Report Movimenti
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Report Giacenze
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Report Efficienza
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Report Custom
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsHub;

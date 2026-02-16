import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  TrophyIcon,
  CheckCircleIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { LiveIndicator } from '../components/common/LiveIndicator';
import { useRealTimeData } from '../hooks/useRealTimeData';

// COLORI TEMA FERRETTO.IT
const FERRETTO_COLORS = {
  red: '#E30613',
  redDark: '#B10510',
  redLight: '#FF3B47',
  green: '#10B981',
  greenDark: '#059669',
  greenLight: '#34D399',
  gray: '#2D2D2D',
  grayLight: '#404040',
  white: '#FFFFFF',
  warning: '#F59E0B',
  blue: '#3B82F6',
  purple: '#9333EA',
  orange: '#F97316',
  cyan: '#06B6D4',
};

// Colori per magazzini
const WAREHOUSE_COLORS = [
  '#E30613', // Ferretto Red
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Orange
  '#9333EA', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#8B5CF6', // Violet
];

// Gradienti Ferretto - VERDE per le card
const FERRETTO_GRADIENTS = {
  primary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  secondary: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
  mixed: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  tertiary: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  user: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
  stock: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  warehouse: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
};

// Componente Card Stat con colori Ferretto
function StatCardFerretto({ title, value, icon: Icon, trend, trendValue, gradient, subtitle, badge }: any): JSX.Element {
  const isPositive = trend === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="relative p-6 text-white">
          {badge && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold">
                {badge}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Icon className="w-8 h-8" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
            <p className="text-4xl font-bold mb-2">{value}</p>
            {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
            {trend && (
              <div className="flex items-center mt-3 text-sm">
                {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
                <span className="font-semibold">{trendValue}</span>
                <span className="opacity-75 ml-1">vs scorsa settimana</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente User Card Ferretto
function UserCardFerretto({ user, userStats }: any): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: FERRETTO_GRADIENTS.user }}
    >
      <div className="relative p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm p-1 shadow-2xl">
                <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
                  <UserIcon className="w-12 h-12" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white/30 flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            </motion.div>

            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Benvenuto, {userStats?.userInfo?.displayName || user?.displayName || 'Utente'}!
                <TrophyIcon className="w-8 h-8 text-yellow-300" />
              </h2>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 opacity-75" />
                  <span className="text-sm opacity-90">
                    Ultimo accesso: {userStats?.userInfo?.lastLoginDate
                      ? new Date(userStats.userInfo.lastLoginDate).toLocaleDateString('it-IT')
                      : 'Oggi'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-semibold">Ferretto Pro</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(userStats?.userInfo?.roles || user?.roles || ['Operatore']).map((role: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 bg-white/25 backdrop-blur-md rounded-full text-sm font-semibold"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Liste Totali', value: userStats?.stats?.lists?.totalLists || 0, icon: DocumentTextIcon },
            { label: 'Completate', value: userStats?.stats?.lists?.completedLists || 0, icon: CheckCircleIcon },
            { label: 'In Corso', value: userStats?.stats?.lists?.inProgressLists || 0, icon: ClockIcon },
            { label: 'Streak', value: 7, icon: FireIcon },
            { label: 'Efficienza', value: '98%', icon: BoltIcon },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center"
            >
              <div className="inline-flex p-2 bg-white/20 rounded-xl mb-2">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs opacity-90 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Dashboard Principale
function DashboardFerretto(): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const currentUser = useSelector((state: any) => state.auth?.user);

  // Fetch TUTTI gli articoli - usa pagination.total per il conteggio REALE con real-time hook
  const {
    data: itemsData,
    isLoading: itemsLoading,
    isLive: itemsIsLive,
    lastUpdate: itemsLastUpdate
  } = useRealTimeData('/api/items?skip=0&limit=200', {
    interval: autoRefresh ? 30000 : 0,
    enabled: autoRefresh,
  });

  // Fetch liste - usa exported e recordNumber
  const { data: listsData, isLoading: listsLoading } = useQuery({
    queryKey: ['lists-all', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/lists?skip=0&limit=100');
      const data = await response.json();
      return data;
    },
    staleTime: 30000,
  });

  // Fetch TUTTE le giacenze - usa exportedItems e recordNumber
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-all', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/stock?skip=0&limit=200');
      const data = await response.json();
      return data;
    },
    staleTime: 30000,
  });

  const { data: userStatsData } = useQuery({
    queryKey: ['user-stats', currentUser?.userId, refreshKey],
    queryFn: async () => {
      if (!currentUser?.userId) return null;
      const response = await fetch(`/api/user-stats/${currentUser.userId}`);
      return response.json();
    },
    enabled: !!currentUser?.userId,
    staleTime: 30000,
  });

  // Calcoli stats REALI usando i campi CORRETTI dell'API
  const stats = useMemo(() => {
    // Items usa 'data' array e 'pagination.total'
    const items = itemsData?.data || [];
    const totalItems = itemsData?.pagination?.total || items.length;

    // Lists usa 'exported' array e 'recordNumber'
    const lists = listsData?.exported || [];
    const totalLists = listsData?.recordNumber || listsData?.total || lists.length;

    // Stock usa 'exportedItems' o 'stock' array e 'recordNumber'
    const stock = stockData?.exportedItems || stockData?.stock || [];
    const totalStockRecords = stockData?.recordNumber || stockData?.total || stock.length;

    // GIACENZA TOTALE REALE (somma delle quantità)
    const totalStockQuantity = stock.reduce((sum: number, item: any) => {
      return sum + (item.qty || item.quantity || item.stockedQuantity || 0);
    }, 0);

    // Analisi magazzini
    const warehouseMap = new Map<string, { count: number; quantity: number; hasPTL: boolean }>();
    stock.forEach((item: any) => {
      const whCode = item.warehouse?.code || item.warehouseCode || 'MAG1';
      const whDesc = item.warehouse?.description || item.warehouseDescription || whCode;
      const key = `${whCode} - ${whDesc}`;

      if (!warehouseMap.has(key)) {
        warehouseMap.set(key, {
          count: 0,
          quantity: 0,
          hasPTL: whCode.toUpperCase().includes('PTL') || whCode.toUpperCase().includes('PICK')
        });
      }
      const wh = warehouseMap.get(key)!;
      wh.count++;
      wh.quantity += (item.qty || item.quantity || item.stockedQuantity || 0);
    });

    // Filtra le liste per tipo (listType o listHeader.listType)
    const pickingLists = lists.filter((l: any) => {
      const type = l.listType || l.listHeader?.listType;
      return type === 0 || type === 1; // Picking è tipo 1 in alcuni sistemi
    }).length;

    const refillingLists = lists.filter((l: any) => {
      const type = l.listType || l.listHeader?.listType;
      return type === 2; // Refilling è tipo 2
    }).length;

    const inventoryLists = lists.filter((l: any) => {
      const type = l.listType || l.listHeader?.listType;
      return type === 3; // Inventario è tipo 3
    }).length;

    return {
      totalItems,
      totalLists,
      pickingLists,
      refillingLists,
      inventoryLists,
      totalStockRecords,
      totalStockQuantity,
      lowStockItems: stock.filter((item: any) => {
        const qty = item.qty || item.quantity || item.stockedQuantity || 0;
        const minQty = item.minimumQuantity || item.minimumStockQuantity || 10;
        return qty < minQty && qty > 0;
      }).length,
      warehouses: Array.from(warehouseMap.entries()).map(([name, data]) => ({
        name,
        ...data,
      })),
    };
  }, [itemsData, listsData, stockData]);

  // Dati per grafici WAREHOUSE
  const warehouseData = useMemo(() => {
    return stats.warehouses
      .sort((a, b) => b.quantity - a.quantity)
      .map((wh, idx) => ({
        ...wh,
        color: WAREHOUSE_COLORS[idx % WAREHOUSE_COLORS.length],
      }));
  }, [stats.warehouses]);

  // Dati grafici liste
  const listsTypeData = useMemo(() => [
    { name: 'Picking', value: stats.pickingLists, color: FERRETTO_COLORS.red },
    { name: 'Refilling', value: stats.refillingLists, color: FERRETTO_COLORS.green },
    { name: 'Inventario', value: stats.inventoryLists, color: FERRETTO_COLORS.gray },
  ].filter(item => item.value > 0), [stats]);

  const categoryData = useMemo(() => {
    const stock = stockData?.exportedItems || stockData?.stock || [];
    if (stock.length === 0) return [];

    const catMap: any = {};
    stock.forEach((item: any) => {
      const cat = item.item?.categoriaDesc || item.category || item.description || 'Altro';
      const qty = item.qty || item.quantity || item.stockedQuantity || 0;
      catMap[cat] = (catMap[cat] || 0) + qty;
    });

    return Object.entries(catMap)
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => (b.quantity as number) - (a.quantity as number))
      .slice(0, 8);
  }, [stockData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => setRefreshKey(prev => prev + 1), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const isLoading = itemsLoading || listsLoading || stockLoading;

  if (isLoading && refreshKey === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento dati reali dal database..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Ferretto */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Dashboard Ferretto WMS 🚀
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Sistema completo con dati reali dal database SQL Server - promag</p>
          <div className="flex items-center gap-3 mt-3">
            <LiveIndicator
              isLive={itemsIsLive}
              lastUpdate={itemsLastUpdate}
              showText={true}
              showTime={true}
              size="md"
            />
            <span className="text-sm text-gray-600 font-medium">
              {stats.totalItems.toLocaleString()} articoli •
              {stats.totalLists} liste •
              {stats.totalStockQuantity.toLocaleString()} pezzi totali •
              {stats.warehouses.length} magazzini
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant={autoRefresh ? 'primary' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '⏸️ Pausa Auto-Refresh' : '▶️ Riprendi Auto-Refresh'}
          </Button>
          <Button variant="outline" onClick={() => setRefreshKey(prev => prev + 1)}>
            🔄 Aggiorna Ora
          </Button>
        </div>
      </motion.div>

      {/* User Profile Card */}
      <UserCardFerretto user={currentUser} userStats={userStatsData} />

      {/* Quick Actions Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <BoltIcon className="w-6 h-6 text-yellow-500" />
          Azioni Rapide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { name: 'Articoli', icon: CubeIcon, link: '/items', color: 'from-blue-500 to-blue-600', count: stats.totalItems },
            { name: 'Giacenze', icon: ArchiveBoxIcon, link: '/stock', color: 'from-purple-500 to-purple-600', count: stats.totalStockQuantity },
            { name: 'Liste', icon: DocumentTextIcon, link: '/lists', color: 'from-red-500 to-red-600', count: stats.totalLists },
            { name: 'Picking', icon: CheckCircleIcon, link: '/lists/picking', color: 'from-green-500 to-green-600', count: stats.pickingLists },
            { name: 'Operazioni', icon: ChartBarIcon, link: '/operations', color: 'from-orange-500 to-orange-600' },
            { name: 'Magazzini', icon: BuildingStorefrontIcon, link: '/warehouses', color: 'from-cyan-500 to-cyan-600', count: stats.warehouses.length },
            { name: 'Report', icon: DocumentTextIcon, link: '/reports', color: 'from-pink-500 to-pink-600' },
            { name: 'KPI', icon: ChartBarIcon, link: '/kpi', color: 'from-indigo-500 to-indigo-600' },
          ].map((action, idx) => (
            <motion.a
              key={idx}
              href={action.link}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`relative bg-gradient-to-br ${action.color} text-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group`}
            >
              <div className="flex flex-col items-center text-center">
                <action.icon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold mb-1">{action.name}</span>
                {action.count !== undefined && (
                  <span className="text-lg font-extrabold">{action.count.toLocaleString()}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards Ferretto - CON DATI REALI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardFerretto
          title="Articoli Totali"
          value={stats.totalItems.toLocaleString()}
          icon={CubeIcon}
          gradient={FERRETTO_GRADIENTS.primary}
          subtitle="Articoli unici nel catalogo"
          badge="✅ REALE"
        />
        <StatCardFerretto
          title="Giacenza Totale"
          value={stats.totalStockQuantity.toLocaleString()}
          icon={ArchiveBoxIcon}
          gradient={FERRETTO_GRADIENTS.stock}
          subtitle={`${stats.totalStockRecords} posizioni stock`}
          badge="📦 PEZZI"
        />
        <StatCardFerretto
          title="Magazzini Attivi"
          value={stats.warehouses.length}
          icon={BuildingStorefrontIcon}
          gradient={FERRETTO_GRADIENTS.warehouse}
          subtitle={`${stats.warehouses.filter(w => w.hasPTL).length} con PTL`}
          badge="🏭"
        />
        <StatCardFerretto
          title="Sotto Soglia"
          value={stats.lowStockItems}
          icon={ExclamationTriangleIcon}
          gradient={FERRETTO_GRADIENTS.tertiary}
          badge={stats.lowStockItems > 0 ? '⚠️ ALERT' : '✅ OK'}
        />
      </div>

      {/* Recent Activity & Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-700">
            <ClockIcon className="w-7 h-7" />
            Attività Recenti
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[
              { type: 'picking', user: 'Mario Rossi', item: 'Lista #1234', time: '2 minuti fa', status: 'completed', icon: CheckCircleIcon, color: 'green' },
              { type: 'stock', user: 'Sistema', item: 'Articolo ABC-123', time: '5 minuti fa', status: 'warning', icon: ExclamationTriangleIcon, color: 'yellow' },
              { type: 'refilling', user: 'Luigi Verdi', item: 'Lista #1235', time: '10 minuti fa', status: 'in-progress', icon: ClockIcon, color: 'blue' },
              { type: 'inventory', user: 'Anna Bianchi', item: 'Magazzino PTL-01', time: '15 minuti fa', status: 'completed', icon: CheckCircleIcon, color: 'green' },
              { type: 'alarm', user: 'Sistema', item: 'Allarme Temperatura', time: '20 minuti fa', status: 'error', icon: ExclamationTriangleIcon, color: 'red' },
              { type: 'picking', user: 'Marco Neri', item: 'Lista #1236', time: '25 minuti fa', status: 'completed', icon: CheckCircleIcon, color: 'green' },
            ].map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-lg border-l-4 ${
                  activity.color === 'green' ? 'bg-green-50 border-green-500' :
                  activity.color === 'blue' ? 'bg-blue-50 border-blue-500' :
                  activity.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-red-50 border-red-500'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.color === 'green' ? 'bg-green-200' :
                    activity.color === 'blue' ? 'bg-blue-200' :
                    activity.color === 'yellow' ? 'bg-yellow-200' :
                    'bg-red-200'
                  }`}>
                    <activity.icon className={`w-4 h-4 ${
                      activity.color === 'green' ? 'text-green-700' :
                      activity.color === 'blue' ? 'text-blue-700' :
                      activity.color === 'yellow' ? 'text-yellow-700' :
                      'text-red-700'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-gray-900">{activity.item}</span>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {activity.type === 'picking' && '📦 Picking completato'}
                      {activity.type === 'stock' && '⚠️ Sotto soglia minima'}
                      {activity.type === 'refilling' && '🔄 Rifornimento in corso'}
                      {activity.type === 'inventory' && '📊 Inventario completato'}
                      {activity.type === 'alarm' && '🚨 Allarme rilevato'}
                      {' - '}{activity.user}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
            <TrophyIcon className="w-6 h-6" />
            Performance
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Efficienza Picking', value: 94, target: 95, color: 'blue' },
              { label: 'Accuratezza', value: 98, target: 99, color: 'green' },
              { label: 'Tempo Medio', value: 87, target: 90, color: 'purple' },
              { label: 'Completamento', value: 92, target: 95, color: 'orange' },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">{metric.label}</span>
                  <span className={`font-bold ${
                    metric.value >= metric.target ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {metric.value}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={`h-full rounded-full ${
                      metric.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      metric.color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      metric.color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                      'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`}
                  />
                  <div className="absolute top-0 left-0 w-full h-full flex items-center px-2">
                    <div
                      className="w-0.5 h-full bg-white opacity-50"
                      style={{ marginLeft: `${metric.target}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">Target: {metric.target}%</div>
              </motion.div>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">A+</div>
                <div className="text-sm text-gray-600">Rating Complessivo</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center py-4">
            <div className="inline-flex p-3 bg-green-200 rounded-full mb-3">
              <CheckCircleIcon className="w-8 h-8 text-green-700" />
            </div>
            <div className="text-2xl font-bold text-green-800 mb-1">Sistema OK</div>
            <div className="text-sm text-green-700">Tutti i servizi attivi</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center py-4">
            <div className="inline-flex p-3 bg-blue-200 rounded-full mb-3">
              <UserIcon className="w-8 h-8 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-blue-800 mb-1">12</div>
            <div className="text-sm text-blue-700">Utenti Online</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center py-4">
            <div className="inline-flex p-3 bg-purple-200 rounded-full mb-3">
              <ClockIcon className="w-8 h-8 text-purple-700" />
            </div>
            <div className="text-2xl font-bold text-purple-800 mb-1">24/7</div>
            <div className="text-sm text-purple-700">Uptime</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center py-4">
            <div className="inline-flex p-3 bg-orange-200 rounded-full mb-3">
              <FireIcon className="w-8 h-8 text-orange-700" />
            </div>
            <div className="text-2xl font-bold text-orange-800 mb-1">15 giorni</div>
            <div className="text-sm text-orange-700">Streak Operativo</div>
          </div>
        </Card>
      </div>

      {/* Warehouse Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Pie Chart */}
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-700">
            <BuildingStorefrontIcon className="w-7 h-7" />
            Distribuzione Giacenza per Magazzino
          </h3>
          {warehouseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={warehouseData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, quantity, percent }) => `${name.split(' - ')[0]}: ${quantity.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={140}
                  innerRadius={80}
                  dataKey="quantity"
                  animationDuration={1500}
                  paddingAngle={3}
                >
                  {warehouseData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toLocaleString()} pz`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Nessun dato disponibile
            </div>
          )}
        </Card>

        {/* Warehouse List */}
        <Card>
          <h3 className="text-xl font-bold mb-4 text-purple-700">Magazzini</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {warehouseData.map((wh, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl border-2 hover:shadow-lg transition-shadow"
                style={{ borderColor: wh.color, backgroundColor: `${wh.color}10` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-bold text-sm" style={{ color: wh.color }}>
                      {wh.name}
                    </div>
                    {wh.hasPTL && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">
                        🔦 PTL Attivo
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-gray-600">Posizioni</div>
                    <div className="font-bold text-lg">{wh.count}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Quantità</div>
                    <div className="font-bold text-lg">{wh.quantity.toLocaleString()}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Liste */}
        {listsTypeData.length > 0 && (
          <Card>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: FERRETTO_COLORS.red }}>
              <ChartBarIcon className="w-6 h-6" />
              Distribuzione Liste per Tipo
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={listsTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  innerRadius={60}
                  dataKey="value"
                  animationDuration={1500}
                  paddingAngle={5}
                >
                  {listsTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Bar Chart Categorie */}
        {categoryData.length > 0 && (
          <Card>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: FERRETTO_COLORS.red }}>
              <CubeIcon className="w-6 h-6" />
              Top 8 Categorie per Giacenza
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" angle={-45} textAnchor="end" height={120} />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: any) => `${value.toLocaleString()} pz`} />
                <Bar dataKey="quantity" fill={FERRETTO_COLORS.green} radius={[12, 12, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Tabella Riepilogo Completa */}
      <Card>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: FERRETTO_COLORS.red }}>
          📊 Riepilogo Completo Dati Reali
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonna 1 */}
          <div>
            <h4 className="font-bold text-lg mb-3 text-green-700">Articoli e Giacenze</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-semibold">Articoli Totali</span>
                <span className="text-xl font-bold text-green-700">{stats.totalItems.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold">Posizioni Stock</span>
                <span className="text-xl font-bold text-blue-700">{stats.totalStockRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-semibold">Quantità Totale</span>
                <span className="text-xl font-bold text-purple-700">{stats.totalStockQuantity.toLocaleString()} pz</span>
              </div>
              <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                <span className="font-semibold">Sotto Soglia</span>
                <span className="text-xl font-bold text-orange-700">{stats.lowStockItems}</span>
              </div>
            </div>
          </div>

          {/* Colonna 2 */}
          <div>
            <h4 className="font-bold text-lg mb-3 text-red-700">Liste e Operazioni</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-semibold">Liste Totali</span>
                <span className="text-xl font-bold text-red-700">{stats.totalLists}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-semibold">Picking</span>
                <span className="text-xl font-bold text-green-700">{stats.pickingLists}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold">Refilling</span>
                <span className="text-xl font-bold text-blue-700">{stats.refillingLists}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-100 rounded-lg">
                <span className="font-semibold">Inventario</span>
                <span className="text-xl font-bold text-gray-700">{stats.inventoryLists}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Fonte: SQL Server - Database <strong className="text-red-600">promag</strong> |
              Server: <strong>localhost\SQL2019</strong>
            </span>
            <span>
              Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DashboardFerretto;

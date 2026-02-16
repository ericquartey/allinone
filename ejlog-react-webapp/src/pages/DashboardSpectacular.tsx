import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  AreaChart,
  Area,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import {
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  UserIcon,
  CalendarIcon,
  TrophyIcon,
  BoltIcon,
  CheckCircleIcon,
  StarIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

// Colori tematici moderni
const THEME_COLORS = {
  primary: '#E30613',
  secondary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  gradient1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradient2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gradient3: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  gradient4: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
};

// Componente Card Stat 3D moderna
function StatCard3D({ title, value, icon: Icon, trend, trendValue, gradient, subtitle, badge }: any): JSX.Element {
  const isPositive = trend === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      className="relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
        style={{
          background: gradient,
          transform: 'perspective(1000px)',
        }}
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
            {subtitle && (
              <p className="text-sm opacity-75">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-3 text-sm">
                {isPositive ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
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

// Componente User Profile Card Spettacolare
function UserProfileCard({ user, userStats }: any): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        {/* Background animato */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

        <div className="relative p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar 3D */}
              <motion.div
                whileHover={{ scale: 1.1, rotateY: 180 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
                    <UserIcon className="w-12 h-12" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
              </motion.div>

              {/* Info Utente */}
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
                    <span className="text-sm font-semibold">Livello Pro</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(userStats?.userInfo?.roles || user?.roles || ['Operatore']).map((role: string, idx: number) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="px-4 py-1.5 bg-white/25 backdrop-blur-md rounded-full text-sm font-semibold shadow-lg"
                    >
                      {role}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid 3D */}
          <div className="grid grid-cols-5 gap-4">
            {[
              {
                label: 'Liste Totali',
                value: userStats?.stats?.lists?.totalLists || 0,
                icon: DocumentTextIcon,
                color: 'from-blue-400 to-blue-600'
              },
              {
                label: 'Completate',
                value: userStats?.stats?.lists?.completedLists || 0,
                icon: CheckCircleIcon,
                color: 'from-green-400 to-green-600'
              },
              {
                label: 'In Corso',
                value: userStats?.stats?.lists?.inProgressLists || 0,
                icon: ClockIcon,
                color: 'from-orange-400 to-orange-600'
              },
              {
                label: 'Streak Giorni',
                value: userStats?.stats?.activity?.streakDays || 7,
                icon: FireIcon,
                color: 'from-red-400 to-red-600'
              },
              {
                label: 'Efficienza',
                value: '98%',
                icon: BoltIcon,
                color: 'from-yellow-400 to-yellow-600'
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative group`}
              >
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl hover:shadow-2xl transition-all">
                  <div className={`inline-flex p-2 bg-gradient-to-br ${stat.color} rounded-xl mb-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs opacity-90 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente Pie Chart 3D
function PieChart3D({ data, title }: any): JSX.Element {
  return (
    <Card className="hover:shadow-2xl transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ChartBarIcon className="w-6 h-6 text-purple-600" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <defs>
            {data.map((entry: any, index: number) => (
              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1500}
            paddingAngle={5}
          >
            {data.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${index})`}
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                  transform: 'translateZ(20px)',
                }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

// Dashboard Principale
function DashboardSpectacular(): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const currentUser = useSelector((state: any) => state.auth?.user);

  // Fetch dati
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items-count', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/items?skip=0&take=1');
      return response.json();
    },
    staleTime: 30000,
  });

  const { data: listsData, isLoading: listsLoading } = useQuery({
    queryKey: ['lists-all', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/item-lists?skip=0&take=100');
      return response.json();
    },
    staleTime: 30000,
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-count', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/stock?skip=0&take=100');
      return response.json();
    },
    staleTime: 30000,
  });

  const { data: userStatsData, isLoading: userStatsLoading } = useQuery({
    queryKey: ['user-stats', currentUser?.userId, refreshKey],
    queryFn: async () => {
      if (!currentUser?.userId) return null;
      const response = await fetch(`/api/user-stats/${currentUser.userId}`);
      return response.json();
    },
    enabled: !!currentUser?.userId,
    staleTime: 30000,
  });

  // Calcoli stats
  const stats = useMemo(() => {
    const lists = listsData?.exported || [];
    return {
      totalItems: itemsData?.recordNumber || 0,
      totalLists: listsData?.recordNumber || 0,
      pickingLists: lists.filter((l: any) => l.listType === 0).length,
      refillingLists: lists.filter((l: any) => l.listType === 1).length,
      inventoryLists: lists.filter((l: any) => l.listType === 2).length,
      totalStockItems: stockData?.recordNumber || 0,
      lowStockItems: (stockData?.exported || []).filter(
        (item: any) => (item.stockedQuantity || 0) < (item.minimumStockQuantity || 10)
      ).length,
    };
  }, [itemsData, listsData, stockData]);

  // Dati per grafici 3D
  const listsTypeData = useMemo(() => [
    { name: 'Picking', value: stats.pickingLists, color: '#E30613' },
    { name: 'Refilling', value: stats.refillingLists, color: '#10B981' },
    { name: 'Inventario', value: stats.inventoryLists, color: '#3B82F6' },
  ].filter(item => item.value > 0), [stats]);

  const categoryData = useMemo(() => {
    if (!stockData?.exported) return [];

    const catMap: any = {};
    stockData.exported.forEach((item: any) => {
      const cat = item.item?.categoriaDesc || 'Altro';
      catMap[cat] = (catMap[cat] || 0) + (item.stockedQuantity || 0);
    });

    return Object.entries(catMap)
      .map(([category, quantity]) => ({
        category,
        quantity,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      }))
      .sort((a, b) => (b.quantity as number) - (a.quantity as number))
      .slice(0, 6);
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
        <Loading size="lg" text="Caricamento dashboard spettacolare..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard Spettacolare
          </h1>
          <p className="text-gray-600 mt-2">Panoramica completa del sistema WMS in tempo reale</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={autoRefresh ? 'primary' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '⏸️ Pausa' : '▶️ Auto'}
          </Button>
          <Button variant="primary">
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Esporta Report
          </Button>
        </div>
      </motion.div>

      {/* User Profile Card */}
      <UserProfileCard user={currentUser} userStats={userStatsData} />

      {/* Stats Cards 3D Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard3D
          title="Articoli Totali"
          value={stats.totalItems.toLocaleString()}
          icon={CubeIcon}
          gradient={THEME_COLORS.gradient3}
          trend="up"
          trendValue="+12%"
          badge="LIVE"
        />
        <StatCard3D
          title="Liste Attive"
          value={stats.totalLists.toLocaleString()}
          icon={DocumentTextIcon}
          gradient={THEME_COLORS.gradient1}
          subtitle="In lavorazione"
          trend="up"
          trendValue="+8%"
        />
        <StatCard3D
          title="Giacenze"
          value={stats.totalStockItems.toLocaleString()}
          icon={ChartBarIcon}
          gradient={THEME_COLORS.gradient4}
          trend="up"
          trendValue="+5%"
        />
        <StatCard3D
          title="Sotto Soglia"
          value={stats.lowStockItems}
          icon={ExclamationTriangleIcon}
          gradient={THEME_COLORS.gradient2}
          badge="⚠️ ALERT"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart3D data={listsTypeData} title="Distribuzione Liste per Tipo" />

        {categoryData.length > 0 && (
          <Card className="hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CubeIcon className="w-6 h-6 text-blue-600" />
              Top Categorie Giacenze
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E30613" stopOpacity={1} />
                    <stop offset="100%" stopColor="#E30613" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="category"
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  }}
                />
                <Bar
                  dataKey="quantity"
                  fill="url(#colorBar)"
                  radius={[12, 12, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Quick Actions Spectacular */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-yellow-500" />
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: PlusIcon, label: 'Nuova Lista', color: 'from-red-500 to-pink-500', link: '/lists?action=create' },
              { icon: CubeIcon, label: 'Gestione Articoli', color: 'from-blue-500 to-cyan-500', link: '/items' },
              { icon: ChartBarIcon, label: 'Report Giacenze', color: 'from-green-500 to-emerald-500', link: '/stock' },
              { icon: MagnifyingGlassIcon, label: 'Ricerca Movimenti', color: 'from-purple-500 to-indigo-500', link: '/movements' },
            ].map((action, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = action.link}
                className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${action.color} text-white shadow-xl hover:shadow-2xl transition-all`}
              >
                <action.icon className="w-10 h-10 mb-3 mx-auto" />
                <p className="font-semibold">{action.label}</p>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default DashboardSpectacular;

import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

interface KPIMetric {
  id: string;
  name: string;
  category: 'PRODUCTIVITY' | 'QUALITY' | 'EFFICIENCY' | 'ACCURACY' | 'COST';
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
  lastUpdated: string;
}

const KPIDashboardPage: React.FC = () => {
  const [loading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const mockKPIs: KPIMetric[] = [
    { id: '1', name: 'Righe Prelevate/Ora', category: 'PRODUCTIVITY', currentValue: 125, targetValue: 150, unit: 'righe/h', trend: 'UP', trendPercentage: 8.5, lastUpdated: '2025-11-20T11:00:00' },
    { id: '2', name: 'Accuratezza Prelievi', category: 'ACCURACY', currentValue: 98.5, targetValue: 99.5, unit: '%', trend: 'DOWN', trendPercentage: -0.3, lastUpdated: '2025-11-20T11:00:00' },
    { id: '3', name: 'Tempo Medio Stoccaggio', category: 'EFFICIENCY', currentValue: 3.2, targetValue: 2.5, unit: 'min', trend: 'DOWN', trendPercentage: 12.3, lastUpdated: '2025-11-20T11:00:00' },
    { id: '4', name: 'Ordini Evasi On-Time', category: 'QUALITY', currentValue: 94.2, targetValue: 95.0, unit: '%', trend: 'STABLE', trendPercentage: 0.1, lastUpdated: '2025-11-20T11:00:00' },
    { id: '5', name: 'Costo per Riga Prelevata', category: 'COST', currentValue: 1.85, targetValue: 1.50, unit: '€', trend: 'UP', trendPercentage: 5.2, lastUpdated: '2025-11-20T11:00:00' },
    { id: '6', name: 'Utilizzo Spazio', category: 'EFFICIENCY', currentValue: 87.3, targetValue: 90.0, unit: '%', trend: 'UP', trendPercentage: 2.1, lastUpdated: '2025-11-20T11:00:00' },
    { id: '7', name: 'Rotazione Scorte', category: 'EFFICIENCY', currentValue: 6.5, targetValue: 8.0, unit: 'volte/anno', trend: 'UP', trendPercentage: 4.8, lastUpdated: '2025-11-20T11:00:00' },
    { id: '8', name: 'Difetti per 1000 Righe', category: 'QUALITY', currentValue: 2.1, targetValue: 1.0, unit: 'difetti', trend: 'DOWN', trendPercentage: 18.5, lastUpdated: '2025-11-20T11:00:00' }
  ];

  const filteredKPIs = mockKPIs.filter(kpi => categoryFilter === 'ALL' || kpi.category === categoryFilter);

  const getCategoryColor = (category: KPIMetric['category']) => {
    const config = { PRODUCTIVITY: 'text-blue-600', QUALITY: 'text-green-600', EFFICIENCY: 'text-purple-600', ACCURACY: 'text-orange-600', COST: 'text-red-600' };
    return config[category];
  };

  const getPerformanceBadge = (current: number, target: number, higherIsBetter: boolean) => {
    const percentage = (current / target) * 100;
    if (higherIsBetter) {
      if (percentage >= 100) return <Badge variant="success">Obiettivo Raggiunto</Badge>;
      if (percentage >= 90) return <Badge variant="warning">Vicino all'Obiettivo</Badge>;
      return <Badge variant="danger">Sotto Obiettivo</Badge>;
    } else {
      if (percentage <= 100) return <Badge variant="success">Obiettivo Raggiunto</Badge>;
      if (percentage <= 110) return <Badge variant="warning">Vicino all'Obiettivo</Badge>;
      return <Badge variant="danger">Sopra Obiettivo</Badge>;
    }
  };

  const getTrendIcon = (trend: KPIMetric['trend'], percentage: number) => {
    if (trend === 'UP') return <span className="text-green-600">↑ +{percentage.toFixed(1)}%</span>;
    if (trend === 'DOWN') return <span className="text-red-600">↓ {percentage.toFixed(1)}%</span>;
    return <span className="text-gray-600">→ {percentage.toFixed(1)}%</span>;
  };

  const renderKPICard = (kpi: KPIMetric) => {
    const percentage = (kpi.currentValue / kpi.targetValue) * 100;
    const higherIsBetter = !['Tempo Medio Stoccaggio', 'Costo per Riga Prelevata', 'Difetti per 1000 Righe'].includes(kpi.name);

    return (
      <Card key={kpi.id} className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className={`text-sm font-semibold ${getCategoryColor(kpi.category)}`}>{kpi.category}</div>
          {getTrendIcon(kpi.trend, kpi.trendPercentage)}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{kpi.name}</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <div className="text-3xl font-bold text-gray-900">{kpi.currentValue}</div>
          <div className="text-sm text-gray-600">{kpi.unit}</div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Target: {kpi.targetValue} {kpi.unit}</span>
            <span className={percentage >= 100 ? 'text-green-600' : 'text-orange-600'}>{percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${percentage >= 100 ? 'bg-green-500' : percentage >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
          </div>
        </div>
        {getPerformanceBadge(kpi.currentValue, kpi.targetValue, higherIsBetter)}
        <div className="text-xs text-gray-500 mt-2">Agg: {new Date(kpi.lastUpdated).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
      </Card>
    );
  };

  const categoryStats = {
    productivity: filteredKPIs.filter(k => k.category === 'PRODUCTIVITY').length,
    quality: filteredKPIs.filter(k => k.category === 'QUALITY').length,
    efficiency: filteredKPIs.filter(k => k.category === 'EFFICIENCY').length,
    accuracy: filteredKPIs.filter(k => k.category === 'ACCURACY').length,
    cost: filteredKPIs.filter(k => k.category === 'COST').length
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Dashboard KPI</h1><p className="mt-2 text-gray-600">Monitora indicatori di performance chiave</p></div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => console.log('Esporta report')}>Esporta Report</Button>
          <Button variant="primary" onClick={() => console.log('Configura KPI')}>Configura KPI</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={`p-3 cursor-pointer transition-all ${categoryFilter === 'ALL' ? 'border-blue-500 border-2 bg-blue-50' : ''}`} onClick={() => setCategoryFilter('ALL')}>
          <div className="text-xs font-medium text-gray-600">Tutti</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{mockKPIs.length}</div>
        </Card>
        <Card className={`p-3 cursor-pointer transition-all ${categoryFilter === 'PRODUCTIVITY' ? 'border-blue-500 border-2 bg-blue-50' : ''}`} onClick={() => setCategoryFilter('PRODUCTIVITY')}>
          <div className="text-xs font-medium text-blue-600">Produttività</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{categoryStats.productivity}</div>
        </Card>
        <Card className={`p-3 cursor-pointer transition-all ${categoryFilter === 'QUALITY' ? 'border-green-500 border-2 bg-green-50' : ''}`} onClick={() => setCategoryFilter('QUALITY')}>
          <div className="text-xs font-medium text-green-600">Qualità</div>
          <div className="text-xl font-bold text-green-600 mt-1">{categoryStats.quality}</div>
        </Card>
        <Card className={`p-3 cursor-pointer transition-all ${categoryFilter === 'EFFICIENCY' ? 'border-purple-500 border-2 bg-purple-50' : ''}`} onClick={() => setCategoryFilter('EFFICIENCY')}>
          <div className="text-xs font-medium text-purple-600">Efficienza</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{categoryStats.efficiency}</div>
        </Card>
        <Card className={`p-3 cursor-pointer transition-all ${categoryFilter === 'ACCURACY' ? 'border-orange-500 border-2 bg-orange-50' : ''}`} onClick={() => setCategoryFilter('ACCURACY')}>
          <div className="text-xs font-medium text-orange-600">Accuratezza</div>
          <div className="text-xl font-bold text-orange-600 mt-1">{categoryStats.accuracy}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="font-medium text-gray-700">Periodo:</div>
          <div className="flex gap-2">
            {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map(period => (
              <Button key={period} variant={selectedPeriod === period ? 'primary' : 'secondary'} size="sm" onClick={() => setSelectedPeriod(period)}>
                {period === 'TODAY' ? 'Oggi' : period === 'WEEK' ? 'Settimana' : period === 'MONTH' ? 'Mese' : 'Anno'}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKPIs.map(kpi => renderKPICard(kpi))}
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-xl font-bold mb-4">Riepilogo Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">KPI Sopra Target</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{mockKPIs.filter(k => k.currentValue >= k.targetValue).length}</div>
            <div className="text-xs text-gray-500 mt-1">{((mockKPIs.filter(k => k.currentValue >= k.targetValue).length / mockKPIs.length) * 100).toFixed(0)}% del totale</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Trend Positivi</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{mockKPIs.filter(k => k.trend === 'UP' && k.trendPercentage > 0).length}</div>
            <div className="text-xs text-gray-500 mt-1">In miglioramento</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Necessitano Attenzione</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">{mockKPIs.filter(k => (k.currentValue / k.targetValue) < 0.9).length}</div>
            <div className="text-xs text-gray-500 mt-1">Sotto il 90% del target</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KPIDashboardPage;

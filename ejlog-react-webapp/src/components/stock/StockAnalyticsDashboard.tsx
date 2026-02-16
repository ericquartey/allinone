// ============================================================================
// EJLOG WMS - Stock Analytics Dashboard Component
// Advanced analytics and insights for stock management with trends and forecasts
// ============================================================================

import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';

interface StockAnalyticsDashboardProps {
  warehouseId?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d' | '1y';
}

interface StockItem {
  itemCode: string;
  description: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  totalValue: number;
  avgCost: number;
  locations: number;
  lastMovement: Date;
  turnoverRate: number; // movements per month
  daysOfStock: number; // days until stockout
  reorderPoint: number;
  safetyStock: number;
  status: 'OK' | 'LOW' | 'CRITICAL' | 'EXCESS' | 'OBSOLETE';
}

type MetricType = 'value' | 'quantity' | 'turnover' | 'coverage' | 'health';
type ChartType = 'bar' | 'pie' | 'line';

const StockAnalyticsDashboard: React.FC<StockAnalyticsDashboardProps> = ({
  warehouseId,
  timeRange = '30d',
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('value');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Mock stock data - in real app would come from API
  const stockItems: StockItem[] = useMemo(() => {
    return [
      {
        itemCode: 'ITEM-001',
        description: 'Widget Standard A',
        category: 'Electronics',
        totalQuantity: 500,
        availableQuantity: 350,
        reservedQuantity: 100,
        inTransitQuantity: 50,
        totalValue: 25000,
        avgCost: 50,
        locations: 5,
        lastMovement: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        turnoverRate: 12,
        daysOfStock: 45,
        reorderPoint: 200,
        safetyStock: 100,
        status: 'OK',
      },
      {
        itemCode: 'ITEM-002',
        description: 'Component B Premium',
        category: 'Electronics',
        totalQuantity: 80,
        availableQuantity: 50,
        reservedQuantity: 20,
        inTransitQuantity: 10,
        totalValue: 16000,
        avgCost: 200,
        locations: 3,
        lastMovement: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        turnoverRate: 8,
        daysOfStock: 15,
        reorderPoint: 100,
        safetyStock: 50,
        status: 'LOW',
      },
      {
        itemCode: 'ITEM-003',
        description: 'Part C Industrial',
        category: 'Mechanical',
        totalQuantity: 25,
        availableQuantity: 15,
        reservedQuantity: 10,
        inTransitQuantity: 0,
        totalValue: 2500,
        avgCost: 100,
        locations: 2,
        lastMovement: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        turnoverRate: 15,
        daysOfStock: 5,
        reorderPoint: 50,
        safetyStock: 20,
        status: 'CRITICAL',
      },
      {
        itemCode: 'ITEM-004',
        description: 'Material D Bulk',
        category: 'Raw Materials',
        totalQuantity: 2000,
        availableQuantity: 1800,
        reservedQuantity: 150,
        inTransitQuantity: 50,
        totalValue: 40000,
        avgCost: 20,
        locations: 8,
        lastMovement: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        turnoverRate: 3,
        daysOfStock: 200,
        reorderPoint: 500,
        safetyStock: 300,
        status: 'EXCESS',
      },
      {
        itemCode: 'ITEM-005',
        description: 'Legacy Part E',
        category: 'Electronics',
        totalQuantity: 150,
        availableQuantity: 150,
        reservedQuantity: 0,
        inTransitQuantity: 0,
        totalValue: 3000,
        avgCost: 20,
        locations: 2,
        lastMovement: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        turnoverRate: 0.5,
        daysOfStock: 999,
        reorderPoint: 50,
        safetyStock: 20,
        status: 'OBSOLETE',
      },
    ];
  }, []);

  // Filter by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return stockItems;
    return stockItems.filter((item) => item.category === selectedCategory);
  }, [stockItems, selectedCategory]);

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.totalQuantity, 0);
    const avgTurnover =
      filteredItems.length > 0
        ? filteredItems.reduce((sum, item) => sum + item.turnoverRate, 0) /
          filteredItems.length
        : 0;
    const avgDaysOfStock =
      filteredItems.length > 0
        ? filteredItems.reduce((sum, item) => sum + item.daysOfStock, 0) /
          filteredItems.length
        : 0;

    const statusCounts = {
      ok: filteredItems.filter((i) => i.status === 'OK').length,
      low: filteredItems.filter((i) => i.status === 'LOW').length,
      critical: filteredItems.filter((i) => i.status === 'CRITICAL').length,
      excess: filteredItems.filter((i) => i.status === 'EXCESS').length,
      obsolete: filteredItems.filter((i) => i.status === 'OBSOLETE').length,
    };

    const categoryBreakdown = filteredItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.totalValue;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValue,
      totalQuantity,
      avgTurnover,
      avgDaysOfStock,
      statusCounts,
      categoryBreakdown,
      totalItems: filteredItems.length,
    };
  }, [filteredItems]);

  // Top/Bottom items by selected metric
  const rankedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      switch (selectedMetric) {
        case 'value':
          return b.totalValue - a.totalValue;
        case 'quantity':
          return b.totalQuantity - a.totalQuantity;
        case 'turnover':
          return b.turnoverRate - a.turnoverRate;
        case 'coverage':
          return b.daysOfStock - a.daysOfStock;
        default:
          return 0;
      }
    });

    return {
      top10: sorted.slice(0, 10),
      bottom10: sorted.slice(-10).reverse(),
    };
  }, [filteredItems, selectedMetric]);

  const getStatusColor = (status: string): string => {
    const colors = {
      OK: 'bg-green-100 text-green-800 border-green-300',
      LOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      EXCESS: 'bg-blue-100 text-blue-800 border-blue-300',
      OBSOLETE: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      OK: '✅',
      LOW: '⚠️',
      CRITICAL: '🔴',
      EXCESS: '📦',
      OBSOLETE: '🗑️',
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  const getMetricLabel = (metric: MetricType): string => {
    const labels = {
      value: 'Valore',
      quantity: 'Quantità',
      turnover: 'Rotazione',
      coverage: 'Copertura',
      health: 'Salute',
    };
    return labels[metric];
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const categories = [...new Set(stockItems.map((item) => item.category))];

  const exportData = () => {
    const data = {
      summary: metrics,
      items: filteredItems.map((item) => ({
        itemCode: item.itemCode,
        description: item.description,
        category: item.category,
        totalQuantity: item.totalQuantity,
        totalValue: item.totalValue,
        status: item.status,
        turnoverRate: item.turnoverRate,
        daysOfStock: item.daysOfStock,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_analytics_${timeRange}_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Tutte le categorie' },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Metrica
              </label>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                options={[
                  { value: 'value', label: '💰 Valore' },
                  { value: 'quantity', label: '📦 Quantità' },
                  { value: 'turnover', label: '🔄 Rotazione' },
                  { value: 'coverage', label: '📅 Copertura' },
                ]}
              />
            </div>
          </div>
          <Button variant="secondary" onClick={exportData}>
            💾 Esporta Dati
          </Button>
        </div>
      </Card>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-xs text-blue-700 mb-1">Valore Totale</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(metrics.totalValue)}
          </p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-xs text-green-700 mb-1">Articoli</p>
          <p className="text-2xl font-bold text-green-900">{metrics.totalItems}</p>
          <p className="text-xs text-green-600">{metrics.totalQuantity} pz</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-xs text-purple-700 mb-1">Rotazione Media</p>
          <p className="text-2xl font-bold text-purple-900">
            {metrics.avgTurnover.toFixed(1)}
          </p>
          <p className="text-xs text-purple-600">mov/mese</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-xs text-orange-700 mb-1">Copertura Media</p>
          <p className="text-2xl font-bold text-orange-900">
            {Math.floor(metrics.avgDaysOfStock)}
          </p>
          <p className="text-xs text-orange-600">giorni</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-xs text-yellow-700 mb-1">⚠️ Attenzione</p>
          <p className="text-2xl font-bold text-yellow-900">
            {metrics.statusCounts.low + metrics.statusCounts.critical}
          </p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-xs text-red-700 mb-1">🔴 Critici</p>
          <p className="text-2xl font-bold text-red-900">
            {metrics.statusCounts.critical}
          </p>
        </Card>
      </div>

      {/* Status Health Distribution */}
      <Card title="Distribuzione Stato Salute">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
            <p className="text-sm text-green-700 font-medium mb-2">✅ OK</p>
            <p className="text-3xl font-bold text-green-900">
              {metrics.statusCounts.ok}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {metrics.totalItems > 0
                ? ((metrics.statusCounts.ok / metrics.totalItems) * 100).toFixed(0)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
            <p className="text-sm text-yellow-700 font-medium mb-2">⚠️ Basso</p>
            <p className="text-3xl font-bold text-yellow-900">
              {metrics.statusCounts.low}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {metrics.totalItems > 0
                ? ((metrics.statusCounts.low / metrics.totalItems) * 100).toFixed(0)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-center">
            <p className="text-sm text-red-700 font-medium mb-2">🔴 Critico</p>
            <p className="text-3xl font-bold text-red-900">
              {metrics.statusCounts.critical}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {metrics.totalItems > 0
                ? ((metrics.statusCounts.critical / metrics.totalItems) * 100).toFixed(
                    0
                  )
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700 font-medium mb-2">📦 Eccesso</p>
            <p className="text-3xl font-bold text-blue-900">
              {metrics.statusCounts.excess}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {metrics.totalItems > 0
                ? ((metrics.statusCounts.excess / metrics.totalItems) * 100).toFixed(0)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-700 font-medium mb-2">🗑️ Obsoleto</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.statusCounts.obsolete}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.totalItems > 0
                ? ((metrics.statusCounts.obsolete / metrics.totalItems) * 100).toFixed(
                    0
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={`🏆 Top 10 per ${getMetricLabel(selectedMetric)}`}>
          <div className="space-y-2">
            {rankedItems.top10.map((item, index) => (
              <div
                key={item.itemCode}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate font-mono text-sm">
                    {item.itemCode}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{item.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {selectedMetric === 'value' && (
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.totalValue)}
                    </p>
                  )}
                  {selectedMetric === 'quantity' && (
                    <p className="text-sm font-bold text-gray-900">
                      {item.totalQuantity} pz
                    </p>
                  )}
                  {selectedMetric === 'turnover' && (
                    <p className="text-sm font-bold text-gray-900">
                      {item.turnoverRate.toFixed(1)} /m
                    </p>
                  )}
                  {selectedMetric === 'coverage' && (
                    <p className="text-sm font-bold text-gray-900">
                      {item.daysOfStock} gg
                    </p>
                  )}
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded mt-1 ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusIcon(item.status)} {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={`⚠️ Articoli che Richiedono Attenzione`}>
          <div className="space-y-2">
            {filteredItems
              .filter((item) => item.status === 'CRITICAL' || item.status === 'LOW')
              .sort((a, b) => {
                if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
                if (a.status !== 'CRITICAL' && b.status === 'CRITICAL') return 1;
                return a.daysOfStock - b.daysOfStock;
              })
              .slice(0, 10)
              .map((item) => (
                <div
                  key={item.itemCode}
                  className={`p-3 rounded-lg border-l-4 ${
                    item.status === 'CRITICAL'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 font-mono text-sm">
                          {item.itemCode}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusIcon(item.status)} {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Disponibile:</span>
                          <p className="font-semibold">{item.availableQuantity}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Reorder:</span>
                          <p className="font-semibold">{item.reorderPoint}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Giorni:</span>
                          <p className="font-semibold text-red-600">
                            {item.daysOfStock}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {filteredItems.filter(
              (item) => item.status === 'CRITICAL' || item.status === 'LOW'
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>Nessun articolo richiede attenzione immediata</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card title="💡 Raccomandazioni" className="bg-blue-50 border-blue-200">
        <div className="space-y-3">
          {metrics.statusCounts.critical > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">
                🔴 Azione Immediata Richiesta
              </h4>
              <p className="text-sm text-red-800">
                {metrics.statusCounts.critical} articoli in stato critico richiedono
                riapprovvigionamento urgente. Rischio di stockout imminente.
              </p>
            </div>
          )}
          {metrics.statusCounts.low > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Monitoraggio</h4>
              <p className="text-sm text-yellow-800">
                {metrics.statusCounts.low} articoli sotto il livello di reorder. Pianificare
                riapprovvigionamento a breve.
              </p>
            </div>
          )}
          {metrics.statusCounts.excess > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📦 Ottimizzazione</h4>
              <p className="text-sm text-blue-800">
                {metrics.statusCounts.excess} articoli in eccesso. Considerare riduzione
                ordini o promozioni per liberare spazio.
              </p>
            </div>
          )}
          {metrics.statusCounts.obsolete > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">🗑️ Pulizia</h4>
              <p className="text-sm text-gray-800">
                {metrics.statusCounts.obsolete} articoli obsoleti senza movimenti. Valutare
                dismissione o svendita.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockAnalyticsDashboard;

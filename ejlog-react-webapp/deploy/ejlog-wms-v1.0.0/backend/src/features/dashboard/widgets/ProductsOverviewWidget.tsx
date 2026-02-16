// ============================================================================
// EJLOG WMS - Products Overview Widget
// Widget con distribuzione prodotti per categoria (grafico torta)
// ============================================================================

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useProductsOverview } from '../hooks/useDashboardData';
import WidgetContainer from '../components/WidgetContainer';
import EmptyWidget from '../components/EmptyWidget';

/**
 * Widget Products Overview - Distribuzione prodotti per categoria
 */
export const ProductsOverviewWidget: React.FC = () => {
  const { data, isLoading, error } = useProductsOverview();
  const [showTopProducts, setShowTopProducts] = useState(false);

  const productsData = data?.data;

  /**
   * Tooltip personalizzato per il grafico
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.category}</p>
          <p className="text-sm text-gray-600">Prodotti: {data.count}</p>
          <p className="text-sm text-gray-600">
            Valore: €{data.value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-medium text-blue-600 mt-1">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  /**
   * Label personalizzata per il grafico
   */
  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <WidgetContainer
      title="Distribuzione Prodotti"
      subtitle="Prodotti per categoria merceologica"
      isLoading={isLoading}
      error={error ? 'Errore nel caricamento dati prodotti' : null}
      icon={
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
          />
        </svg>
      }
      headerAction={
        <button
          onClick={() => setShowTopProducts(!showTopProducts)}
          className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          {showTopProducts ? 'Mostra Grafici' : 'Top Prodotti'}
        </button>
      }
    >
      {!productsData ? (
        <EmptyWidget
          title="Nessun prodotto"
          message="Non ci sono prodotti da visualizzare."
          icon="data"
        />
      ) : showTopProducts ? (
        // Vista Top Prodotti
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top 10 Prodotti</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {productsData.topProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.code}</p>
                    <p className="text-xs text-gray-600 truncate">{product.description}</p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">Qty: {product.quantity}</p>
                  <p className="text-xs text-gray-600">
                    €{product.value.toLocaleString('it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Vista Grafico
        <div className="space-y-6">
          {/* Statistiche principali */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Totale Prodotti</p>
              <p className="text-2xl font-bold text-gray-900">{productsData.totalProducts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valore Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                €{productsData.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Grafico a Torta */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productsData.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  animationDuration={800}
                >
                  {productsData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-gray-700">
                      {entry.payload.category} ({entry.payload.count})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Dettagli categorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productsData.categories.map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.category}</p>
                    <p className="text-xs text-gray-600">{category.count} prodotti</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{category.percentage}%</p>
                  <p className="text-xs text-gray-600">
                    €{category.value.toLocaleString('it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetContainer>
  );
};

export default ProductsOverviewWidget;

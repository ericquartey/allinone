/**
 * Advanced Analytics Page - REAL IMPLEMENTATION
 * Feature E - Analytics e Reporting Avanzati con dati reali
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, BarChart3, TrendingUp, Download, Calendar, Loader } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';

interface KPIData {
  avgPickTime: string;
  accuracy: string;
  linesPerHour: number;
  efficiency: string;
  totalPicks: number;
  completedPicks: number;
  cancelledPicks: number;
}

interface TrendData {
  date: string;
  picks: number;
  avgTime: number | null;
  completed: number;
  accuracy: string;
}

interface OperatorData {
  operatorId: number;
  operatorName: string;
  totalPicks: number;
  avgTime: number | null;
  completed: number;
  accuracy: string;
}

export const AdvancedAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // 30 giorni fa
    to: new Date().toISOString().split('T')[0], // oggi
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [operatorData, setOperatorData] = useState<OperatorData[]>([]);

  // Funzione per caricare analytics dal backend
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/analytics/picking?from=${dateRange.from}&to=${dateRange.to}&groupBy=day`
      );

      if (!response.ok) {
        throw new Error('Errore nel caricamento analytics');
      }

      const data = await response.json();

      if (data.success) {
        setKpiData(data.kpi);
        setTrendData(data.trend);
        setOperatorData(data.operators);
      } else {
        throw new Error(data.error || 'Errore sconosciuto');
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carica dati all'avvio
  useEffect(() => {
    loadAnalytics();
  }, []);

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const response = await fetch(
        `/api/analytics/export/excel?from=${dateRange.from}&to=${dateRange.to}`
      );

      if (!response.ok) {
        throw new Error('Errore nell\'export Excel');
      }

      const data = await response.json();

      if (data.success) {
        // Crea workbook
        const ws = XLSX.utils.json_to_sheet(data.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Analytics');

        // Salva file
        XLSX.writeFile(wb, `analytics_${dateRange.from}_${dateRange.to}.xlsx`);
      }
    } catch (err: any) {
      console.error('Error exporting to Excel:', err);
      alert('Errore nell\'export Excel: ' + err.message);
    }
  };

  // Export to PDF (placeholder - può essere implementato con html2pdf o jsPDF)
  const exportToPDF = () => {
    alert('Export PDF - Da implementare con jsPDF o html2pdf');
  };

  // Colori per PieChart
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  // Prepara dati per PieChart operatori
  const operatorPieData = operatorData.slice(0, 4).map((op) => ({
    name: op.operatorName,
    value: op.totalPicks,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
        <p className="text-lg text-gray-600">Feature E - Analytics e Reporting Avanzati (REAL DATA)</p>
      </motion.div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Da:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">A:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="ml-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                Caricamento...
              </>
            ) : (
              'Aggiorna Dati'
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-600">Caricamento analytics in corso...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
          <p className="text-red-800 font-semibold">❌ {error}</p>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && kpiData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Avg Pick Time', value: kpiData.avgPickTime, icon: TrendingUp, color: 'blue' },
              { title: 'Accuracy', value: kpiData.accuracy, icon: PieChart, color: 'green' },
              { title: 'Lines/Hour', value: kpiData.linesPerHour.toString(), icon: BarChart3, color: 'purple' },
              { title: 'Efficiency', value: kpiData.efficiency, icon: TrendingUp, color: 'orange' },
            ].map((kpi, index) => {
              const Icon = kpi.icon;
              const colorClasses = {
                blue: 'bg-blue-500 text-blue-500',
                green: 'bg-green-500 text-green-500',
                purple: 'bg-purple-500 text-purple-500',
                orange: 'bg-orange-500 text-orange-500',
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
                    <div
                      className={`p-2 rounded-lg bg-opacity-10 ${
                        colorClasses[kpi.color as keyof typeof colorClasses].split(' ')[0]
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          colorClasses[kpi.color as keyof typeof colorClasses].split(' ')[1]
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">{kpi.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Riepilogo Periodo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Totale Picks</p>
                <p className="text-2xl font-bold text-blue-600">{kpiData.totalPicks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completate</p>
                <p className="text-2xl font-bold text-green-600">{kpiData.completedPicks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Annullate</p>
                <p className="text-2xl font-bold text-red-600">{kpiData.cancelledPicks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasso Successo</p>
                <p className="text-2xl font-bold text-purple-600">{kpiData.accuracy}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Trend Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Picking Performance Trend</h3>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString('it-IT')}
                      formatter={(value: any) => [value, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="picks" stroke="#3b82f6" name="Picks" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completati" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nessun dato disponibile per il periodo selezionato
                </div>
              )}
            </div>

            {/* Operator PieChart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Picks per Operatore (Top 4)</h3>
              {operatorPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={operatorPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {operatorPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nessun dato operatori disponibile
                </div>
              )}
            </div>
          </div>

          {/* Operators Table */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Operatori</h3>
            {operatorData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operatore
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Totale Picks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completati
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tempo Medio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accuratezza
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {operatorData.map((op) => (
                      <tr key={op.operatorId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {op.operatorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.totalPicks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {op.avgTime ? `${op.avgTime}s` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Nessun dato operatori disponibile</div>
            )}
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Export Reports</h2>
            <div className="flex gap-4">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Export to Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Export to PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedAnalytics;

// ============================================================================
// EJLOG WMS - Productivity Report Page
// Report produttività - visualizzazione e generazione
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import ReportFilters from '../../components/reports/ReportFilters';
import DataTable from '../../components/reports/DataTable';
import { ArrowLeft, Download, RefreshCw, Users, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { ReportFilter } from '../../services/reportsService';
import { getProductivityReportData } from '../../services/reportsService';
import { ProductivityData, productivityColumns } from './columns/productivityColumns.tsx';
import { exportData, type ExportFormat } from '../../utils/exportUtils';
import ProductivityTrendChart from '../../components/charts/ProductivityTrendChart';

// KPI Summary Interface
interface KPISummary {
  totalTasks: number;
  averageEfficiency: number;
  averageTimePerTask: number;
  totalActiveHours: number;
}

// Calculate KPI summary from data
const calculateKPIs = (data: ProductivityData[]): KPISummary => {
  if (data.length === 0) {
    return {
      totalTasks: 0,
      averageEfficiency: 0,
      averageTimePerTask: 0,
      totalActiveHours: 0,
    };
  }

  const totalTasks = data.reduce((sum, item) => sum + item.tasksCompleted, 0);
  const averageEfficiency = Math.round(
    data.reduce((sum, item) => sum + item.efficiency, 0) / data.length
  );
  const averageTimePerTask = Math.round(
    data.reduce((sum, item) => sum + item.averageTimePerTask, 0) / data.length
  );
  const totalActiveHours = data.reduce((sum, item) => sum + item.activeHours, 0);

  return {
    totalTasks,
    averageEfficiency,
    averageTimePerTask,
    totalActiveHours,
  };
};

const ProductivityReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: formatDate(new Date(), 'yyyy-MM-dd'),
    dateTo: formatDate(new Date(), 'yyyy-MM-dd'),
  });
  const [data, setData] = useState<ProductivityData[]>([]);
  const [kpis, setKpis] = useState<KPISummary>({
    totalTasks: 0,
    averageEfficiency: 0,
    averageTimePerTask: 0,
    totalActiveHours: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await getProductivityReportData(filters);

      if (response.result === 'OK' && response.data) {
        setData(response.data);
        setKpis(calculateKPIs(response.data));
      } else {
        console.error('Error fetching productivity report data:', response.message);
        setData([]);
        setKpis({ totalTasks: 0, averageEfficiency: 0, averageTimePerTask: 0, totalActiveHours: 0 });
      }
    } catch (error) {
      console.error('Error fetching productivity report data:', error);
      setData([]);
      setKpis({ totalTasks: 0, averageEfficiency: 0, averageTimePerTask: 0, totalActiveHours: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (newFilters: ReportFilter) => {
    setFilters(newFilters);
  };

  const handleExport = (format: ExportFormat) => {
    if (data.length === 0) {
      alert('Nessun dato da esportare');
      return;
    }

    exportData(format, {
      filename: 'report_produttivita',
      title: 'Report Produttività',
      columns: [
        { header: 'Operatore', accessor: 'userName' },
        { header: 'Reparto', accessor: 'department' },
        { header: 'Task Completati', accessor: 'tasksCompleted' },
        { header: 'Articoli Totali', accessor: 'totalItems' },
        { header: 'Tempo Medio (min)', accessor: 'averageTimePerTask' },
        { header: 'Efficienza %', accessor: 'efficiency' },
        { header: 'Ore Attive', accessor: 'activeHours' },
        { header: 'Data', accessor: (row) => row.date ? formatDate(new Date(row.date), 'dd/MM/yyyy') : '' },
      ],
      data,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="flex items-center space-x-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna ai Report</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center space-x-2"
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </Button>
          <div className="relative group">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleExport('PDF')}
              disabled={data.length === 0}
              className="flex items-center space-x-2"
              data-testid="export-button"
            >
              <Download className="w-4 h-4" />
              <span>Esporta PDF</span>
            </Button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('CSV')}
                disabled={data.length === 0}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Esporta CSV
              </button>
              <button
                onClick={() => handleExport('EXCEL')}
                disabled={data.length === 0}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Esporta Excel
              </button>
              <button
                onClick={() => handleExport('PDF')}
                disabled={data.length === 0}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Esporta PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Report Produttività</h1>
        <p className="text-gray-600">
          Analisi KPI e performance operatori nel periodo selezionato
        </p>
      </div>

      {/* Filters */}
      <ReportFilters onFilterChange={handleFilterChange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Task Completati</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalTasks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Efficienza Media</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.averageEfficiency}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tempo Medio Task</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.averageTimePerTask}m</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore Totali</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalActiveHours.toFixed(1)}h</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Productivity Trend Chart */}
      {data.length > 0 && (
        <ProductivityTrendChart
          data={data.map(item => ({
            userName: item.userName,
            efficiency: item.efficiency,
            tasksCompleted: item.tasksCompleted,
            activeHours: item.activeHours,
          }))}
          chartType="bar"
          height={400}
        />
      )}

      {/* Data Table */}
      <DataTable<ProductivityData>
        data={data}
        columns={productivityColumns}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProductivityReportPage;

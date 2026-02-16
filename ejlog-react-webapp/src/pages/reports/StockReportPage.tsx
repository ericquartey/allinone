// ============================================================================
// EJLOG WMS - Stock Report Page
// Report giacenze - visualizzazione e generazione
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import ReportFilters from '../../components/reports/ReportFilters';
import DataTable from '../../components/reports/DataTable';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { ReportFilter } from '../../services/reportsService';
import { getStockReportData } from '../../services/reportsService';
import { StockData, stockColumns } from './columns/stockColumns.tsx';
import { exportData, type ExportFormat } from '../../utils/exportUtils';
import StockLevelChart from '../../components/charts/StockLevelChart';

const StockReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: formatDate(new Date(), 'yyyy-MM-dd'),
    dateTo: formatDate(new Date(), 'yyyy-MM-dd'),
  });
  const [data, setData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await getStockReportData(filters);

      if (response.result === 'OK' && response.data) {
        setData(response.data);
      } else {
        console.error('Error fetching stock report data:', response.message);
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching stock report data:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when filters change
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
      filename: 'report_giacenze',
      title: 'Report Giacenze',
      columns: [
        { header: 'Codice Articolo', accessor: 'articleCode' },
        { header: 'Descrizione', accessor: 'description' },
        { header: 'Ubicazione', accessor: 'location' },
        { header: 'Lotto', accessor: 'batch' },
        { header: 'Quantità', accessor: 'quantity' },
        { header: 'UM', accessor: 'uom' },
        { header: 'Stato', accessor: 'status' },
        { header: 'Ultimo Movimento', accessor: (row) => row.lastMovement ? formatDate(new Date(row.lastMovement), 'dd/MM/yyyy HH:mm') : '' },
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
        <h1 className="text-3xl font-bold">Report Giacenze</h1>
        <p className="text-gray-600">
          Analisi completa delle giacenze per articolo, ubicazione e lotto
        </p>
      </div>

      {/* Filters */}
      <ReportFilters
        onFilterChange={handleFilterChange}
        showZoneFilter={true}
        showStatusFilter={true}
        zones={['A', 'B', 'C', 'D']}
        statuses={['DISPONIBILE', 'BLOCCATO', 'RISERVATO', 'IN_TRANSITO']}
      />

      {/* Stock Level Chart */}
      {data.length > 0 && (
        <StockLevelChart
          data={data.map(item => ({
            location: item.location,
            quantity: item.quantity,
            status: item.status,
          }))}
          groupBy="location"
          height={400}
        />
      )}

      {/* Data Table */}
      <DataTable<StockData>
        data={data}
        columns={stockColumns}
        isLoading={isLoading}
      />
    </div>
  );
};

export default StockReportPage;

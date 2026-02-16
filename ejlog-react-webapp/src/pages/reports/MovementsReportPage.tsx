// ============================================================================
// EJLOG WMS - Movements Report Page
// Report movimenti - visualizzazione e generazione
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import ReportFilters from '../../components/reports/ReportFilters';
import DataTable from '../../components/reports/DataTable';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { ReportFilter } from '../../services/reportsService';
import { getMovementsReportData } from '../../services/reportsService';
import { MovementData, movementsColumns } from './columns/movementsColumns.tsx';
import { exportData, type ExportFormat } from '../../utils/exportUtils';
import MovementFlowChart from '../../components/charts/MovementFlowChart';

const MovementsReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: formatDate(new Date(), 'yyyy-MM-dd'),
    dateTo: formatDate(new Date(), 'yyyy-MM-dd'),
  });
  const [data, setData] = useState<MovementData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await getMovementsReportData(filters);

      if (response.result === 'OK' && response.data) {
        setData(response.data);
      } else {
        console.error('Error fetching movements report data:', response.message);
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching movements report data:', error);
      setData([]);
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
      filename: 'report_movimenti',
      title: 'Report Movimenti',
      columns: [
        { header: 'ID Movimento', accessor: 'movementId' },
        { header: 'Tipo', accessor: 'type' },
        { header: 'Codice Articolo', accessor: 'articleCode' },
        { header: 'Da Ubicazione', accessor: 'fromLocation' },
        { header: 'A Ubicazione', accessor: 'toLocation' },
        { header: 'Quantità', accessor: 'quantity' },
        { header: 'Lotto', accessor: 'batch' },
        { header: 'Utente', accessor: 'user' },
        { header: 'Data/Ora', accessor: (row) => row.timestamp ? formatDate(new Date(row.timestamp), 'dd/MM/yyyy HH:mm') : '' },
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
        <h1 className="text-3xl font-bold">Report Movimenti</h1>
        <p className="text-gray-600">
          Storico movimenti e analisi flussi di magazzino
        </p>
      </div>

      {/* Filters */}
      <ReportFilters
        onFilterChange={handleFilterChange}
        showTypeFilter={true}
        types={['IN', 'OUT', 'TRANSFER']}
      />

      {/* Movement Flow Chart */}
      {data.length > 0 && (
        <MovementFlowChart
          data={data.map(item => ({
            timestamp: item.timestamp,
            type: item.type as 'IN' | 'OUT' | 'TRANSFER',
            quantity: item.quantity,
          }))}
          height={400}
        />
      )}

      {/* Data Table */}
      <DataTable<MovementData>
        data={data}
        columns={movementsColumns}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MovementsReportPage;

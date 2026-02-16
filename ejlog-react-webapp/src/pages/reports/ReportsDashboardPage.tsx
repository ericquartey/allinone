// ============================================================================
// EJLOG WMS - Reports Dashboard Page
// Dashboard reporting e analisi dati magazzino
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/shared/Badge';
import Loading from '../../components/common/Loading';
import * as ReportsService from '../../services/reportsService';
import {
  FileText,
  Download,
  Calendar,
  Eye,
  Trash2,
  TrendingUp,
  Package,
  Users,
  MapPin,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

const ReportsDashboardPage = () => {
  const navigate = useNavigate();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<ReportsService.DashboardStats | null>(null);
  const [reports, setReports] = useState<ReportsService.Report[]>([]);
  const [templates, setTemplates] = useState<ReportsService.ReportTemplate[]>([]);
  const [movementStats, setMovementStats] = useState<ReportsService.MovementStats[]>([]);
  const [productivityStats, setProductivityStats] = useState<ReportsService.ProductivityStats[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportsService.TimePeriod>(
    ReportsService.TimePeriod.TODAY
  );

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dateRange = ReportsService.getDateRangeForPeriod(selectedPeriod);

      const [statsResult, reportsResult, templatesResult, movementsResult, productivityResult] =
        await Promise.all([
          ReportsService.getDashboardStats(
            dateRange ? { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo } : undefined
          ),
          ReportsService.getReports(),
          ReportsService.getTemplates(),
          ReportsService.getMovementStats(dateRange?.dateFrom, dateRange?.dateTo),
          ReportsService.getProductivityStats(dateRange?.dateFrom, dateRange?.dateTo),
        ]);

      if (statsResult.result === 'OK' && statsResult.data) {
        setDashboardStats(statsResult.data);
      } else {
        setError(statsResult.message || 'Errore nel caricamento delle statistiche');
      }

      if (reportsResult.result === 'OK' && reportsResult.data) {
        setReports(reportsResult.data);
      }

      if (templatesResult.result === 'OK' && templatesResult.data) {
        setTemplates(templatesResult.data);
      }

      if (movementsResult.result === 'OK' && movementsResult.data) {
        setMovementStats(movementsResult.data);
      }

      if (productivityResult.result === 'OK' && productivityResult.data) {
        setProductivityStats(productivityResult.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Errore nel caricamento dei dati della dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleGenerateReport = useCallback(async (templateId: number) => {
    try {
      const result = await ReportsService.generateFromTemplate(templateId);

      if (result.result === 'OK') {
        alert('Report generato con successo!');
        await loadDashboardData();
      } else {
        alert(result.message || 'Errore nella generazione del report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Errore nella generazione del report');
    }
  }, [loadDashboardData]);

  const handleDownloadReport = useCallback(async (reportId: number) => {
    try {
      const result = await ReportsService.downloadReport(reportId);

      if (result.result === 'OK' && result.data) {
        // Create blob and download
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(result.message || 'Errore nel download del report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Errore nel download del report');
    }
  }, []);

  const handleDeleteReport = useCallback(async (reportId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo report?')) {
      return;
    }

    try {
      const result = await ReportsService.deleteReport(reportId);

      if (result.result === 'OK') {
        alert('Report eliminato con successo!');
        await loadDashboardData();
      } else {
        alert(result.message || 'Errore nell\'eliminazione del report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Errore nell\'eliminazione del report');
    }
  }, [loadDashboardData]);

  const handleViewReport = useCallback((reportId: number) => {
    navigate(`/reports/${reportId}`);
  }, [navigate]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'ALL') return templates;
    return templates.filter((template) => template.type === selectedCategory);
  }, [templates, selectedCategory]);

  const recentReports = useMemo(() => {
    return ReportsService.sortReportsByDate(reports, false).slice(0, 10);
  }, [reports]);

  const reportStats = useMemo(() => {
    return ReportsService.getReportsStats(reports);
  }, [reports]);

  // ============================================================================
  // RENDERING HELPERS
  // ============================================================================

  const getReportTypeIcon = (type: ReportsService.ReportType) => {
    switch (type) {
      case ReportsService.ReportType.INVENTORY:
        return <Package className="w-5 h-5" />;
      case ReportsService.ReportType.MOVEMENTS:
        return <TrendingUp className="w-5 h-5" />;
      case ReportsService.ReportType.PRODUCTIVITY:
        return <Users className="w-5 h-5" />;
      case ReportsService.ReportType.LOCATION_OCCUPANCY:
        return <MapPin className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getReportStatusIcon = (status: ReportsService.ReportStatus) => {
    switch (status) {
      case ReportsService.ReportStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case ReportsService.ReportStatus.GENERATING:
      case ReportsService.ReportStatus.PENDING:
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case ReportsService.ReportStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  if (error && !dashboardStats) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Dashboard reporting e analisi dati magazzino</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as ReportsService.TimePeriod)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={ReportsService.TimePeriod.TODAY}>
              {ReportsService.getTimePeriodLabel(ReportsService.TimePeriod.TODAY)}
            </option>
            <option value={ReportsService.TimePeriod.YESTERDAY}>
              {ReportsService.getTimePeriodLabel(ReportsService.TimePeriod.YESTERDAY)}
            </option>
            <option value={ReportsService.TimePeriod.THIS_WEEK}>
              {ReportsService.getTimePeriodLabel(ReportsService.TimePeriod.THIS_WEEK)}
            </option>
            <option value={ReportsService.TimePeriod.LAST_WEEK}>
              {ReportsService.getTimePeriodLabel(ReportsService.TimePeriod.LAST_WEEK)}
            </option>
            <option value={ReportsService.TimePeriod.THIS_MONTH}>
              {ReportsService.getTimePeriodLabel(ReportsService.TimePeriod.THIS_MONTH)}
            </option>
            <option value={ReportsService.TimePeriod.LAST_MONTH}>
              {ReportsService.getTimePeriodLabel(ReportsService.TimePeriod.LAST_MONTH)}
            </option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Movimenti Totali</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalMovements}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Articoli</p>
                <p className="text-3xl font-bold text-green-600">{dashboardStats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">UDC</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardStats.totalUDCs}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Occupazione</p>
                <p className="text-3xl font-bold text-orange-600">
                  {dashboardStats.occupancyRate.toFixed(1)}%
                </p>
              </div>
              <MapPin className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Movement Stats Chart */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Andamento Movimenti
          </h3>
          {movementStats.length > 0 ? (
            <>
              <div className="h-64 flex items-end justify-between gap-2">
                {movementStats.slice(-7).map((stat, index) => {
                  const maxTotal = Math.max(...movementStats.slice(-7).map((s) => s.total));
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col-reverse gap-1" style={{ height: '200px' }}>
                        <div
                          className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                          style={{ height: `${(stat.inbound / maxTotal) * 100}%` }}
                          title={`Entrate: ${stat.inbound}`}
                        />
                        <div
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                          style={{ height: `${(stat.outbound / maxTotal) * 100}%` }}
                          title={`Uscite: ${stat.outbound}`}
                        />
                        <div
                          className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                          style={{ height: `${(stat.internal / maxTotal) * 100}%` }}
                          title={`Interni: ${stat.internal}`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        {new Date(stat.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="text-xs font-semibold text-gray-900">{stat.total}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Entrate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Uscite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm text-gray-600">Interni</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessun dato disponibile</p>
            </div>
          )}
        </Card>

        {/* Productivity Stats */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top 5 Operatori per Produttività
          </h3>
          {productivityStats.length > 0 ? (
            <div className="space-y-4">
              {productivityStats.slice(0, 5).map((operator, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{operator.user}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{operator.tasksCompleted} task</div>
                      <div className="text-xs text-gray-600">{operator.efficiency.toFixed(0)}% efficienza</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(operator.efficiency, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nessun dato disponibile</p>
            </div>
          )}
        </Card>
      </div>

      {/* Report Templates Section */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Report Templates ({filteredTemplates.length})
          </h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tutte le Categorie</option>
            {Object.values(ReportsService.ReportType).map((type) => (
              <option key={type} value={type}>
                {ReportsService.getReportTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-2 border-gray-100 hover:border-blue-300 transition-colors">
                <div className="flex gap-4">
                  <div className="text-blue-500">{getReportTypeIcon(template.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-600">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Badge variant="default">{ReportsService.getReportTypeLabel(template.type)}</Badge>
                      <Badge variant="secondary">
                        {ReportsService.getReportFormatLabel(template.defaultFormat)}
                      </Badge>
                      {template.isSystem && <Badge variant="info">Sistema</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(template.id)}>
                        <FileText className="w-4 h-4 mr-1" />
                        Genera
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/reports/new?template=${template.id}`)}>
                        <Calendar className="w-4 h-4 mr-1" />
                        Configura
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nessun template trovato</p>
          </div>
        )}
      </Card>

      {/* Recent Reports */}
      <Card>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Report Generati Recentemente ({reportStats.total})
        </h2>

        {recentReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Generato</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Utente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Formato</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Dimensione</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getReportStatusIcon(report.status)}
                        <Badge variant={ReportsService.getReportStatusColor(report.status)} size="sm">
                          {ReportsService.getReportStatusLabel(report.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="default" size="sm">
                        {ReportsService.getReportTypeLabel(report.type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {report.generatedAt
                        ? new Date(report.generatedAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.generatedBy}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="secondary" size="sm">
                        {ReportsService.getReportFormatLabel(report.format)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {report.fileSize ? ReportsService.formatFileSize(report.fileSize) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {ReportsService.canDownloadReport(report) && (
                          <Button size="sm" variant="outline" onClick={() => handleDownloadReport(report.id)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleViewReport(report.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteReport(report.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nessun report generato</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsDashboardPage;

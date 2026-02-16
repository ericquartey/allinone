// ============================================================================
// EJLOG WMS - Report Viewer Page
// Visualizzazione e generazione report individuale
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/shared/Badge';
import Loading from '../../components/common/Loading';
import * as ReportsService from '../../services/reportsService';
import {
  FileText,
  Download,
  ArrowLeft,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  User,
  Clock,
  FileType,
  Database,
} from 'lucide-react';

const ReportViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportsService.Report | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadReport = useCallback(async () => {
    if (!id) {
      setError('ID report non fornito');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ReportsService.getReportById(parseInt(id));

      if (result.result === 'OK' && result.data) {
        setReport(result.data);
      } else {
        setError(result.message || 'Errore nel caricamento del report');
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Errore nel caricamento del report');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleDownload = useCallback(async () => {
    if (!report) return;

    try {
      const result = await ReportsService.downloadReport(report.id);

      if (result.result === 'OK' && result.data) {
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name}_${report.id}.${report.format.toLowerCase()}`;
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
  }, [report]);

  const handleRegenerate = useCallback(async () => {
    if (!report) return;

    if (!confirm('Sei sicuro di voler rigenerare questo report?')) {
      return;
    }

    try {
      const result = await ReportsService.regenerateReport(report.id);

      if (result.result === 'OK') {
        alert('Report in rigenerazione...');
        await loadReport();
      } else {
        alert(result.message || 'Errore nella rigenerazione');
      }
    } catch (error) {
      console.error('Error regenerating report:', error);
      alert('Errore nella rigenerazione del report');
    }
  }, [report, loadReport]);

  const handleDelete = useCallback(async () => {
    if (!report) return;

    if (!confirm('Sei sicuro di voler eliminare questo report?')) {
      return;
    }

    try {
      const result = await ReportsService.deleteReport(report.id);

      if (result.result === 'OK') {
        alert('Report eliminato con successo!');
        navigate('/reports');
      } else {
        alert(result.message || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Errore nell\'eliminazione del report');
    }
  }, [report, navigate]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusIcon = (status: ReportsService.ReportStatus) => {
    switch (status) {
      case ReportsService.ReportStatus.COMPLETED:
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case ReportsService.ReportStatus.GENERATING:
      case ReportsService.ReportStatus.PENDING:
        return <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />;
      case ReportsService.ReportStatus.FAILED:
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">
          {error || 'Report non trovato'}
        </div>
        <Button onClick={() => navigate('/reports')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna ai Report
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{report.name}</h1>
            {report.description && <p className="text-gray-600 mt-1">{report.description}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          {ReportsService.canDownloadReport(report) && (
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          {ReportsService.canRegenerateReport(report) && (
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rigenera
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Elimina
          </Button>
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

      {/* Status Card */}
      <Card>
        <div className="flex items-center gap-4 p-6">
          {getStatusIcon(report.status)}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">Stato Report</h2>
              <Badge variant={ReportsService.getReportStatusColor(report.status)}>
                {ReportsService.getReportStatusLabel(report.status)}
              </Badge>
            </div>
            {report.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-red-800 font-medium">Errore:</p>
                <p className="text-sm text-red-600">{report.error}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* General Info */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informazioni Generali
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">ID Report</dt>
              <dd className="font-medium">#{report.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Tipo</dt>
              <dd>
                <Badge variant="default">{ReportsService.getReportTypeLabel(report.type)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 flex items-center gap-1">
                <FileType className="w-4 h-4" />
                Formato
              </dt>
              <dd>
                <Badge variant="secondary">{ReportsService.getReportFormatLabel(report.format)}</Badge>
              </dd>
            </div>
            {report.fileSize && (
              <div>
                <dt className="text-sm text-gray-600">Dimensione File</dt>
                <dd className="font-medium">{ReportsService.formatFileSize(report.fileSize)}</dd>
              </div>
            )}
            {report.recordCount && (
              <div>
                <dt className="text-sm text-gray-600 flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  Record
                </dt>
                <dd className="font-medium">{report.recordCount.toLocaleString('it-IT')}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Timeline */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 flex items-center gap-1">
                <User className="w-4 h-4" />
                Generato Da
              </dt>
              <dd className="font-medium">{report.generatedBy}</dd>
            </div>
            {report.createdAt && (
              <div>
                <dt className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Data Creazione
                </dt>
                <dd className="font-medium">
                  {new Date(report.createdAt).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
            {report.generatedAt && (
              <div>
                <dt className="text-sm text-gray-600">Data Generazione</dt>
                <dd className="font-medium">
                  {new Date(report.generatedAt).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
            {report.completedAt && (
              <div>
                <dt className="text-sm text-gray-600">Data Completamento</dt>
                <dd className="font-medium">
                  {new Date(report.completedAt).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Filters */}
      {report.filters && Object.keys(report.filters).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Filtri Applicati</h3>
          <div className="grid grid-cols-3 gap-4">
            {report.filters.zone && (
              <div>
                <dt className="text-sm text-gray-600">Zona</dt>
                <dd className="font-medium">{report.filters.zone}</dd>
              </div>
            )}
            {report.filters.type && (
              <div>
                <dt className="text-sm text-gray-600">Tipo</dt>
                <dd className="font-medium">{report.filters.type}</dd>
              </div>
            )}
            {report.filters.user && (
              <div>
                <dt className="text-sm text-gray-600">Utente</dt>
                <dd className="font-medium">{report.filters.user}</dd>
              </div>
            )}
            {report.filters.status && (
              <div>
                <dt className="text-sm text-gray-600">Stato</dt>
                <dd className="font-medium">{report.filters.status}</dd>
              </div>
            )}
            {report.filters.dateFrom && (
              <div>
                <dt className="text-sm text-gray-600">Data Da</dt>
                <dd className="font-medium">
                  {new Date(report.filters.dateFrom).toLocaleDateString('it-IT')}
                </dd>
              </div>
            )}
            {report.filters.dateTo && (
              <div>
                <dt className="text-sm text-gray-600">Data A</dt>
                <dd className="font-medium">
                  {new Date(report.filters.dateTo).toLocaleDateString('it-IT')}
                </dd>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* File Info */}
      {report.fileUrl && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">File Generato</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium">{report.name}.{report.format.toLowerCase()}</p>
                  {report.fileSize && (
                    <p className="text-sm text-gray-600">{ReportsService.formatFileSize(report.fileSize)}</p>
                  )}
                </div>
              </div>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportViewerPage;
